import { prisma } from '@/lib/prisma';
import type {
  GlobalAnalyticsData,
  PhaseAnalytics,
  QuestionTypePerformance,
  HardestQuestionSummary,
  QuestionErrorAnalysis,
  CommonErrorItem,
} from '@/types';
import type { QuestionType } from '@prisma/client';

/**
 * Motor de agregação de métricas e analytics (SPEC-007)
 */
export async function getPhaseAnalytics(phaseId: string): Promise<PhaseAnalytics> {
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      questions: true,
    },
  });

  if (!phase) {
    throw new Error(`Fase não encontrada para o id: ${phaseId}`);
  }

  const questions = phase.questions || [];
  const questionIds = questions.map((q) => q.id);

  const submissions = questionIds.length > 0
    ? await prisma.submission.findMany({
        where: { questionId: { in: questionIds } },
      })
    : [];

  // Mapear cada questão para métricas de dificuldade
  const hardestQuestions: HardestQuestionSummary[] = questions.map((q) => {
    const qSubs = submissions.filter((s) => s.questionId === q.id);
    const totalAttempts = qSubs.length;
    const failureCount = qSubs.filter((s) => !s.isCorrect).length;
    const failureRate =
      totalAttempts > 0 ? Number(((failureCount / totalAttempts) * 100).toFixed(1)) : 0;

    return {
      questionId: q.id,
      enunciado: q.enunciado,
      topic: q.topic,
      type: q.type.toLowerCase() as any,
      failureCount,
      totalAttempts,
      failureRate,
    };
  });

  // Ordenar decrescente por falhas e taxa de falha
  hardestQuestions.sort((a, b) => b.failureCount - a.failureCount || b.failureRate - a.failureRate);

  // Análise qualitativa de erros mais frequentes
  const errorAnalysis: QuestionErrorAnalysis[] = questions.map((q) => {
    const wrongSubs = submissions.filter((s) => s.questionId === q.id && !s.isCorrect);
    const totalErrors = wrongSubs.length;

    if (totalErrors === 0) {
      return {
        questionId: q.id,
        enunciado: q.enunciado,
        totalErrors: 0,
        topErrors: [],
      };
    }

    const errorCountMap = new Map<string, { answer: any; count: number }>();

    for (const sub of wrongSubs) {
      const key = typeof sub.answer === 'string' ? sub.answer : JSON.stringify(sub.answer);
      const existing = errorCountMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        errorCountMap.set(key, { answer: sub.answer, count: 1 });
      }
    }

    const topErrors: CommonErrorItem[] = Array.from(errorCountMap.values())
      .map((item) => ({
        answer: item.answer,
        count: item.count,
        percentage: Number(((item.count / totalErrors) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      questionId: q.id,
      enunciado: q.enunciado,
      totalErrors,
      topErrors,
    };
  });

  return {
    phaseId: phase.id,
    phaseTitle: phase.title,
    totalQuestions: questions.length,
    totalSubmissions: submissions.length,
    hardestQuestions,
    errorAnalysis,
  };
}

export async function getAnalyticsOverview(): Promise<GlobalAnalyticsData> {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  });

  const totalStudents = students.length;
  const studentIds = new Set(students.map((s) => s.id));

  const totalQuestions = await prisma.question.count();

  const submissions = await prisma.submission.findMany({
    include: {
      question: true,
    },
  });

  // 1. Alunos ativos (estudantes com pelo menos 1 submissão)
  const activeStudentIds = new Set<string>();
  for (const sub of submissions) {
    if (studentIds.has(sub.userId)) {
      activeStudentIds.add(sub.userId);
    }
  }
  const totalActiveStudents = activeStudentIds.size;

  // 2. Taxa global de conclusão
  // Média do percentual de questões resolvidas com sucesso por aluno
  let globalCompletionRate = 0;
  if (totalStudents > 0 && totalQuestions > 0) {
    let sumRates = 0;
    for (const student of students) {
      const correctQuestionIds = new Set(
        submissions
          .filter((s) => s.userId === student.id && s.isCorrect)
          .map((s) => s.questionId)
      );
      const studentRate = (correctQuestionIds.size / totalQuestions) * 100;
      sumRates += studentRate;
    }
    globalCompletionRate = Number((sumRates / totalStudents).toFixed(1));
  }

  // 3. Desempenho por tipo de questão
  const questionTypes: QuestionType[] = ['DIAGRAMACAO', 'TABELA_VERDADE', 'FORMALIZACAO', 'FORMALIZACAO_ARGUMENTO', 'MULTIPLA_ESCOLHA'];
  const performanceByType: QuestionTypePerformance[] = questionTypes.map((type) => {
    const typeSubs = submissions.filter((s) => s.question?.type === type);
    const totalSubmissions = typeSubs.length;
    const correctSubmissions = typeSubs.filter((s) => s.isCorrect).length;
    const successRate =
      totalSubmissions > 0
        ? Number(((correctSubmissions / totalSubmissions) * 100).toFixed(1))
        : 0;

    return {
      type,
      totalSubmissions,
      correctSubmissions,
      successRate,
    };
  });

  // 4. Buscar métricas de todas as fases configuradas
  const phases = await prisma.phase.findMany({
    select: { id: true },
    orderBy: { order: 'asc' },
  });

  const phasesAnalytics: PhaseAnalytics[] = [];
  for (const p of phases) {
    try {
      const pAnalytics = await getPhaseAnalytics(p.id);
      phasesAnalytics.push(pAnalytics);
    } catch {
      // Ignora erro se fase for removida durante execução
    }
  }

  return {
    totalActiveStudents,
    totalStudents,
    globalCompletionRate,
    performanceByType,
    phases: phasesAnalytics,
  };
}

