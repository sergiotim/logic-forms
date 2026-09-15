import { prisma } from '@/lib/prisma';
import type { Phase, Question, QuestionType, LucideIconName } from '@/types';
import { Prisma, QuestionType as PrismaQuestionType } from '@prisma/client';

/**
 * Converte o tipo do TypeScript (minúsculo) para o Enum do Prisma (MAIÚSCULO).
 */
function toPrismaQuestionType(tipo: string): PrismaQuestionType {
  const upper = tipo.toUpperCase();
  if (upper === 'DIAGRAMACAO') return PrismaQuestionType.DIAGRAMACAO;
  if (upper === 'TABELA_VERDADE') return PrismaQuestionType.TABELA_VERDADE;
  if (upper === 'FORMALIZACAO') return PrismaQuestionType.FORMALIZACAO;
  return PrismaQuestionType.DIAGRAMACAO;
}

/**
 * Converte o Enum do Prisma (MAIÚSCULO) para o tipo do TypeScript (minúsculo).
 */
function fromPrismaQuestionType(type: PrismaQuestionType): QuestionType {
  return type.toLowerCase() as QuestionType;
}

/**
 * Busca todas as fases e questões do banco Neon, ordenadas por `order`.
 */
export async function getPhasesFromDb(): Promise<Phase[]> {
  const dbPhases = await prisma.phase.findMany({
    orderBy: { order: 'asc' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return dbPhases.map((p) => ({
    id: p.id,
    titulo: p.title,
    icone: (p.icon || 'Network') as LucideIconName,
    questoes: p.questions.map((q) => {
      const content =
        typeof q.content === 'object' && q.content !== null ? (q.content as Record<string, unknown>) : {};
      return {
        id: q.id,
        tipo: fromPrismaQuestionType(q.type),
        topico: q.topic,
        enunciado: q.enunciado,
        ...content,
      } as Question;
    }),
  }));
}

/**
 * Sincroniza uma lista completa de fases e questões no banco Neon em transação atômica.
 * Lida com criação, edição, exclusão e reordenação (order).
 */
export async function syncPhasesToDb(phases: Phase[]): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const phaseIds = phases.map((p) => p.id);

      // 1. Se não houver fases, apaga todas as fases (e questões por cascade)
      if (phaseIds.length === 0) {
        await tx.phase.deleteMany({});
        return;
      }

      // 2. Exclui fases que foram removidas pelo professor
      await tx.phase.deleteMany({
        where: {
          id: { notIn: phaseIds },
        },
      });

      // 3. Itera sobre as fases na ordem atual
      for (let pIndex = 0; pIndex < phases.length; pIndex++) {
        const phase = phases[pIndex];

        // Upsert da fase (atualiza título, ícone e a nova ordem)
        await tx.phase.upsert({
          where: { id: phase.id },
          update: {
            title: phase.titulo,
            icon: phase.icone,
            order: pIndex,
          },
          create: {
            id: phase.id,
            title: phase.titulo,
            icon: phase.icone,
            order: pIndex,
          },
        });

        const questionIds = phase.questoes.map((q) => q.id);

        // Exclui questões removidas desta fase
        if (questionIds.length === 0) {
          await tx.question.deleteMany({
            where: { phaseId: phase.id },
          });
        } else {
          await tx.question.deleteMany({
            where: {
              phaseId: phase.id,
              id: { notIn: questionIds },
            },
          });
        }

        // Upsert de cada questão na ordem atual em paralelo via Promise.all
        await Promise.all(
          phase.questoes.map((question, qIndex) => {
            const { id, tipo, topico, enunciado, ...content } = question as Question & Record<string, unknown>;

            const prismaType = toPrismaQuestionType(tipo);
            const jsonContent = (content || {}) as Prisma.InputJsonObject;

            return tx.question.upsert({
              where: { id },
              update: {
                phaseId: phase.id,
                type: prismaType,
                topic: topico,
                enunciado,
                order: qIndex,
                content: jsonContent,
              },
              create: {
                id,
                phaseId: phase.id,
                type: prismaType,
                topic: topico,
                enunciado,
                order: qIndex,
                content: jsonContent,
              },
            });
          })
        );
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );
}

/**
 * Busca todas as submissões de um usuário específico no banco Neon.
 */
export async function getUserSubmissions(
  userId: string,
): Promise<{ questionId: string; isCorrect: boolean; answer: unknown }[]> {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    select: {
      questionId: true,
      isCorrect: true,
      answer: true,
    },
  });
  return submissions;
}

/**
 * Registra ou atualiza a resolução de uma questão por um aluno (upsert atômico).
 */
export async function saveUserSubmission(data: {
  userId: string;
  questionId: string;
  isCorrect: boolean;
  answer: unknown;
}): Promise<void> {
  const { userId, questionId, isCorrect, answer } = data;
  await prisma.submission.upsert({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
    update: {
      isCorrect,
      answer: (answer ?? null) as Prisma.InputJsonValue,
    },
    create: {
      userId,
      questionId,
      isCorrect,
      answer: (answer ?? null) as Prisma.InputJsonValue,
    },
  });
}

