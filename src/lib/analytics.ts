import { prisma } from '@/lib/prisma';
import type {
  GlobalAnalyticsData,
  PhaseAnalytics,
  QuestionTypePerformance,
  HardestQuestionSummary,
  QuestionErrorAnalysis,
  CommonErrorItem,
  QuestionStudentStatus,
  StudentQuestionDetail,
  StudentPhaseDetail,
  StudentMetricItem,
  StudentAnalyticsOverviewData,
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
      type: q.type.toLowerCase() as unknown as QuestionType,
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

    const errorCountMap = new Map<string, { answer: unknown; count: number }>();

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

/**
 * Agregação de métricas centrada no estudante (SPEC-007 v2.8.0)
 * [NÃO IMPLEMENTADO - FASE VERMELHA TDD]
 */
export async function getStudentAnalyticsOverview(): Promise<StudentAnalyticsOverviewData> {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: { name: 'asc' },
  });

  const studentIds = students.map((s) => s.id);

  const rawPhases = await prisma.phase.findMany({
    orderBy: { order: 'asc' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  // Filtra fases ativas (não marcadas com :oculta)
  const activePhases = rawPhases.filter((p) => {
    const [, flag] = (p.icon || '').split(':');
    return flag !== 'oculta';
  });

  // Mapeia questões ativas de cada fase
  const phasesWithActiveQuestions = activePhases.map((phase) => {
    const activeQuestions = phase.questions.filter((q) => {
      const content =
        typeof q.content === 'object' && q.content !== null
          ? (q.content as Record<string, unknown>)
          : {};
      return content.oculta !== true;
    });
    return {
      ...phase,
      questions: activeQuestions,
    };
  });

  const allActiveQuestions = phasesWithActiveQuestions.flatMap((p) => p.questions);
  const totalQuestoesAtivas = allActiveQuestions.length;

  // Busca todas as submissões dos alunos cadastrados ordenadas por data crescente
  const submissions = studentIds.length > 0
    ? await prisma.submission.findMany({
        where: { userId: { in: studentIds } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const studentMetricItems: StudentMetricItem[] = students.map((student) => {
    const studentSubs = submissions.filter((s) => s.userId === student.id);

    // Mapeamento de submissões por questão
    const subsByQuestion = new Map<string, typeof studentSubs>();
    for (const sub of studentSubs) {
      const existing = subsByQuestion.get(sub.questionId) || [];
      existing.push(sub);
      subsByQuestion.set(sub.questionId, existing);
    }

    // Questões ativas concluídas com pelo menos 1 acerto
    const completedQuestionIds = new Set<string>();
    let acertosDePrimeira = 0;

    for (const q of allActiveQuestions) {
      const qSubs = subsByQuestion.get(q.id) || [];
      const hasCorrect = qSubs.some((s) => s.isCorrect);
      if (hasCorrect) {
        completedQuestionIds.add(q.id);
        // Foi de primeira se a primeira tentativa já foi correta (0 erros antes)
        if (qSubs[0]?.isCorrect) {
          acertosDePrimeira++;
        }
      }
    }

    const questoesConcluidas = completedQuestionIds.size;
    const porcentagemConcluida =
      totalQuestoesAtivas > 0
        ? Number(((questoesConcluidas / totalQuestoesAtivas) * 100).toFixed(1))
        : 0;
    const porcentagemRestante =
      totalQuestoesAtivas > 0
        ? Number((100 - porcentagemConcluida).toFixed(1))
        : 100;

    const totalErros = studentSubs.filter((s) => !s.isCorrect).length;

    let ultimaAtividade: string | null = null;
    if (studentSubs.length > 0) {
      const lastSub = studentSubs[studentSubs.length - 1];
      ultimaAtividade =
        lastSub.createdAt instanceof Date
          ? lastSub.createdAt.toISOString()
          : String(lastSub.createdAt);
    }

    // Detalhamento do Raio-X por fase
    const fases: StudentPhaseDetail[] = phasesWithActiveQuestions.map((phase) => {
      let phaseCompletedCount = 0;
      const questoes: StudentQuestionDetail[] = phase.questions.map((q) => {
        const qSubs = subsByQuestion.get(q.id) || [];
        const tentativasTotal = qSubs.length;
        const errosCount = qSubs.filter((s) => !s.isCorrect).length;
        const isResolved = qSubs.some((s) => s.isCorrect);
        const ultimaResposta = qSubs.length > 0 ? qSubs[qSubs.length - 1].answer : null;

        let status: QuestionStudentStatus = 'nao_iniciada';
        if (isResolved && errosCount === 0) {
          status = 'de_primeira';
          phaseCompletedCount++;
        } else if (isResolved && errosCount > 0) {
          status = 'com_dificuldade';
          phaseCompletedCount++;
        } else if (!isResolved && errosCount > 0) {
          status = 'pendente_com_erros';
        }

        return {
          questionId: q.id,
          enunciado: q.enunciado,
          topico: q.topic,
          tipo: q.type.toLowerCase(),
          status,
          errosCount,
          tentativasTotal,
          ultimaResposta,
        };
      });

      return {
        phaseId: phase.id,
        titulo: phase.title,
        totalQuestoes: phase.questions.length,
        questoesConcluidas: phaseCompletedCount,
        questoes,
      };
    });

    return {
      id: student.id,
      name: student.name || 'Estudante sem nome',
      email: student.email || '',
      image: student.image,
      questoesConcluidas,
      totalQuestoesAtivas,
      porcentagemConcluida,
      porcentagemRestante,
      totalErros,
      acertosDePrimeira,
      ultimaAtividade,
      fases,
    };
  });

  const totalStudents = students.length;
  let sumRates = 0;
  let concluidosTotal = 0;
  let naoIniciadosTotal = 0;

  for (const s of studentMetricItems) {
    sumRates += s.porcentagemConcluida;
    if (s.porcentagemConcluida === 100) {
      concluidosTotal++;
    }
    if (s.questoesConcluidas === 0 && s.totalErros === 0) {
      naoIniciadosTotal++;
    }
  }

  const mediaConclusaoTurma =
    totalStudents > 0 ? Number((sumRates / totalStudents).toFixed(1)) : 0;

  return {
    totalStudents,
    mediaConclusaoTurma,
    concluidosTotal,
    naoIniciadosTotal,
    students: studentMetricItems,
  };
}

