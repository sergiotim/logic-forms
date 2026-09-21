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
  if (upper === 'MULTIPLA_ESCOLHA') return PrismaQuestionType.MULTIPLA_ESCOLHA;
  if (upper === 'FORMALIZACAO_ARGUMENTO') return PrismaQuestionType.FORMALIZACAO_ARGUMENTO;
  if (upper.includes('FORMALIZACAO')) return PrismaQuestionType.FORMALIZACAO;
  return PrismaQuestionType.DIAGRAMACAO;
}

/**
 * Converte o Enum do Prisma (MAIÚSCULO) para o tipo do TypeScript (minúsculo).
 */
function fromPrismaQuestionType(type: PrismaQuestionType): QuestionType {
  return type.toLowerCase() as QuestionType;
}

/**
 * Resolve o tipo TypeScript da questão combinando o enum do Prisma e metadados no content.
 * Possui heurística de compatibilidade para identificar formalizacao_argumento persistidas no banco.
 */
function resolveQuestionType(prismaType: PrismaQuestionType, content: Record<string, unknown>): QuestionType {
  if (content.originalTipo && typeof content.originalTipo === 'string') {
    return content.originalTipo as QuestionType;
  }
  if (content.tipo && typeof content.tipo === 'string') {
    return content.tipo as QuestionType;
  }
  // Heurística de retrocompatibilidade para argumentos salvos no banco
  if (
    content.resposta_esperada &&
    typeof content.resposta_esperada === 'object' &&
    'premissas' in (content.resposta_esperada as object)
  ) {
    return 'formalizacao_argumento';
  }
  return fromPrismaQuestionType(prismaType);
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

  return dbPhases.map((p) => {
    const [rawIcon, flag] = (p.icon || 'Network').split(':');
    return {
      id: p.id,
      titulo: p.title,
      icone: (rawIcon || 'Network') as LucideIconName,
      ...(flag === 'oculta' ? { oculta: true } : {}),
      questoes: p.questions.map((q) => {
        const content =
          typeof q.content === 'object' && q.content !== null ? (q.content as Record<string, unknown>) : {};
        return {
          id: q.id,
          tipo: resolveQuestionType(q.type, content),
          topico: q.topic,
          enunciado: q.enunciado,
          ...content,
        } as Question;
      }),
    };
  });
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

        const phaseIcon = phase.oculta ? `${phase.icone}:oculta` : phase.icone;

        // Upsert da fase (atualiza título, ícone e a nova ordem)
        await tx.phase.upsert({
          where: { id: phase.id },
          update: {
            title: phase.titulo,
            icon: phaseIcon,
            order: pIndex,
          },
          create: {
            id: phase.id,
            title: phase.titulo,
            icon: phaseIcon,
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
            const isStandardPrismaType = tipo === 'diagramacao' || tipo === 'tabela_verdade' || tipo === 'formalizacao' || tipo === 'multipla_escolha' || tipo === 'formalizacao_argumento';
            const jsonContent = {
              ...(content || {}),
              ...(!isStandardPrismaType ? { originalTipo: tipo } : {}),
            } as Prisma.InputJsonObject;

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
 * Sincroniza uma única fase ativa e suas questões no banco Neon em transação atômica.
 * Usado para operações granulares do Editor (edição de título, ícone, adição/edição/remoção de questões).
 * Evita a reescrita monolítica de todo o currículo.
 */
export async function syncSinglePhaseToDb(phase: Phase): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      // 1. Busca a ordem atual da fase no banco (se já existir), ou calcula a próxima ordem disponível
      const existingPhase = await tx.phase.findUnique({
        where: { id: phase.id },
        select: { order: true },
      });

      let phaseOrder = existingPhase?.order;
      if (phaseOrder === undefined) {
        const count = await tx.phase.count();
        phaseOrder = count;
      }

      const phaseIcon = phase.oculta ? `${phase.icone}:oculta` : phase.icone;

      // 2. Upsert da fase (atualiza título e ícone preservando a ordem)
      await tx.phase.upsert({
        where: { id: phase.id },
        update: {
          title: phase.titulo,
          icon: phaseIcon,
          order: phaseOrder,
        },
        create: {
          id: phase.id,
          title: phase.titulo,
          icon: phaseIcon,
          order: phaseOrder,
        },
      });

      // 3. Exclui questões removidas desta fase
      const questionIds = phase.questoes.map((q) => q.id);
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

      // 4. Upsert de cada questão desta fase na ordem indicada via Promise.all
      await Promise.all(
        phase.questoes.map((question, qIndex) => {
          const { id, tipo, topico, enunciado, ...content } = question as Question & Record<string, unknown>;

          const prismaType = toPrismaQuestionType(tipo);
          const isStandardPrismaType = tipo === 'diagramacao' || tipo === 'tabela_verdade' || tipo === 'formalizacao';
          const jsonContent = {
            ...(content || {}),
            ...(!isStandardPrismaType ? { originalTipo: tipo } : {}),
          } as Prisma.InputJsonObject;

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

