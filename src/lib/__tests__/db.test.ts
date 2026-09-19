import { getPhasesFromDb, syncPhasesToDb, syncSinglePhaseToDb, getUserSubmissions, saveUserSubmission } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import type { Phase, DiagramacaoQuestion } from '@/types';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    phase: {
      findMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('db.ts (Neon PostgreSQL Service)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPhasesFromDb()', () => {
    it('carrega fases e questões ordenadas corretamente do banco', async () => {
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-1',
          title: 'Diagramação',
          icon: 'Network',
          order: 0,
          questions: [
            {
              id: 'q-1',
              type: 'DIAGRAMACAO',
              topic: 'Argumentos',
              enunciado: 'Classifique as frases',
              order: 0,
              content: {
                frases: [{ id: '1', texto: 'A' }],
                resposta_esperada: { '1': 'P' },
              },
            },
          ],
        },
      ]);

      const result = await getPhasesFromDb();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('fase-1');
      expect(result[0].titulo).toBe('Diagramação');
      expect(result[0].icone).toBe('Network');
      expect(result[0].questoes).toHaveLength(1);
      expect(result[0].questoes[0].tipo).toBe('diagramacao');
      expect((result[0].questoes[0] as DiagramacaoQuestion).frases).toEqual([{ id: '1', texto: 'A' }]);
    });

    it('reconhece a flag de fase oculta persistida no icon', async () => {
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-oculta',
          title: 'Fase Oculta',
          icon: 'Table2:oculta',
          order: 0,
          questions: [],
        },
      ]);

      const result = await getPhasesFromDb();
      expect(result[0].icone).toBe('Table2');
      expect(result[0].oculta).toBe(true);
    });
  });

  describe('syncPhasesToDb()', () => {
    it('apaga todas as fases se a lista for vazia', async () => {
      const mockTx = {
        phase: { deleteMany: jest.fn(), upsert: jest.fn() },
        question: { deleteMany: jest.fn(), upsert: jest.fn() },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await syncPhasesToDb([]);
      expect(mockTx.phase.deleteMany).toHaveBeenCalledWith({});
      expect(mockTx.phase.upsert).not.toHaveBeenCalled();
    });

    it('sincroniza fases, remove excluídas e faz upsert das questões', async () => {
      const mockTx = {
        phase: { deleteMany: jest.fn(), upsert: jest.fn() },
        question: { deleteMany: jest.fn(), upsert: jest.fn() },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const phases: Phase[] = [
        {
          id: 'fase-1',
          titulo: 'Diagramação Atualizada',
          icone: 'Network',
          questoes: [
            {
              id: 'q-1',
              tipo: 'diagramacao',
              topico: 'Premissas',
              enunciado: 'Enunciado 1',
              frases: [],
              resposta_esperada: {},
            },
          ],
        },
      ];

      await syncPhasesToDb(phases);

      // Garante que o timeout de 30s e maxWait de 10s foram repassados ao Prisma
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { maxWait: 10000, timeout: 30000 }
      );

      // Exclui fases que não estão na lista
      expect(mockTx.phase.deleteMany).toHaveBeenCalledWith({
        where: { id: { notIn: ['fase-1'] } },
      });

      // Upsert da fase com order: 0
      expect(mockTx.phase.upsert).toHaveBeenCalledWith({
        where: { id: 'fase-1' },
        update: { title: 'Diagramação Atualizada', icon: 'Network', order: 0 },
        create: { id: 'fase-1', title: 'Diagramação Atualizada', icon: 'Network', order: 0 },
      });

      // Exclui questões que não estão na lista da fase
      expect(mockTx.question.deleteMany).toHaveBeenCalledWith({
        where: { phaseId: 'fase-1', id: { notIn: ['q-1'] } },
      });

      // Upsert da questão com order: 0
      expect(mockTx.question.upsert).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        update: {
          phaseId: 'fase-1',
          type: 'DIAGRAMACAO',
          topic: 'Premissas',
          enunciado: 'Enunciado 1',
          order: 0,
          content: { frases: [], resposta_esperada: {} },
        },
        create: {
          id: 'q-1',
          phaseId: 'fase-1',
          type: 'DIAGRAMACAO',
          topic: 'Premissas',
          enunciado: 'Enunciado 1',
          order: 0,
          content: { frases: [], resposta_esperada: {} },
        },
      });
    });
  });

  describe('syncSinglePhaseToDb()', () => {
    it('sincroniza uma única fase preservando a ordem existente e atualizando questões', async () => {
      const mockTx = {
        phase: {
          findUnique: jest.fn().mockResolvedValue({ order: 2 }),
          count: jest.fn(),
          upsert: jest.fn(),
        },
        question: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const phase: Phase = {
        id: 'fase-2',
        titulo: 'Fase 2 Atualizada',
        icone: 'Table2',
        questoes: [
          {
            id: 'q-2',
            tipo: 'diagramacao',
            topico: 'Premissas',
            enunciado: 'Enunciado 2',
            frases: [],
            resposta_esperada: {},
          },
        ],
      };

      await syncSinglePhaseToDb(phase);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { maxWait: 5000, timeout: 10000 }
      );

      // Garante que buscou a ordem existente
      expect(mockTx.phase.findUnique).toHaveBeenCalledWith({
        where: { id: 'fase-2' },
        select: { order: true },
      });

      // Upsert da fase com a ordem preservada (2)
      expect(mockTx.phase.upsert).toHaveBeenCalledWith({
        where: { id: 'fase-2' },
        update: { title: 'Fase 2 Atualizada', icon: 'Table2', order: 2 },
        create: { id: 'fase-2', title: 'Fase 2 Atualizada', icon: 'Table2', order: 2 },
      });

      // Exclui questões que não estão mais na fase
      expect(mockTx.question.deleteMany).toHaveBeenCalledWith({
        where: { phaseId: 'fase-2', id: { notIn: ['q-2'] } },
      });

      // Upsert da questão
      expect(mockTx.question.upsert).toHaveBeenCalledWith({
        where: { id: 'q-2' },
        update: {
          phaseId: 'fase-2',
          type: 'DIAGRAMACAO',
          topic: 'Premissas',
          enunciado: 'Enunciado 2',
          order: 0,
          content: { frases: [], resposta_esperada: {} },
        },
        create: {
          id: 'q-2',
          phaseId: 'fase-2',
          type: 'DIAGRAMACAO',
          topic: 'Premissas',
          enunciado: 'Enunciado 2',
          order: 0,
          content: { frases: [], resposta_esperada: {} },
        },
      });
    });

    it('calcula nova ordem para fase inédita e remove todas as questões se a lista estiver vazia', async () => {
      const mockTx = {
        phase: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest.fn().mockResolvedValue(5),
          upsert: jest.fn(),
        },
        question: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const phase: Phase = {
        id: 'fase-nova',
        titulo: 'Fase Inédita',
        icone: 'PenLine',
        questoes: [],
      };

      await syncSinglePhaseToDb(phase);

      expect(mockTx.phase.count).toHaveBeenCalled();
      expect(mockTx.phase.upsert).toHaveBeenCalledWith({
        where: { id: 'fase-nova' },
        update: { title: 'Fase Inédita', icon: 'PenLine', order: 5 },
        create: { id: 'fase-nova', title: 'Fase Inédita', icon: 'PenLine', order: 5 },
      });

      // Quando não há questões, apaga todas as questões da fase
      expect(mockTx.question.deleteMany).toHaveBeenCalledWith({
        where: { phaseId: 'fase-nova' },
      });
      expect(mockTx.question.upsert).not.toHaveBeenCalled();
    });

    it('persiste a flag :oculta no icon quando a fase for oculta', async () => {
      const mockTx = {
        phase: {
          findUnique: jest.fn().mockResolvedValue({ order: 2 }),
          upsert: jest.fn(),
        },
        question: {
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const phase: Phase = {
        id: 'fase-1',
        titulo: 'Fase 1',
        icone: 'PenLine',
        oculta: true,
        questoes: [],
      };

      await syncSinglePhaseToDb(phase);

      expect(mockTx.phase.upsert).toHaveBeenCalledWith({
        where: { id: 'fase-1' },
        update: { title: 'Fase 1', icon: 'PenLine:oculta', order: 2 },
        create: { id: 'fase-1', title: 'Fase 1', icon: 'PenLine:oculta', order: 2 },
      });
    });
  });

  describe('getUserSubmissions()', () => {
    it('retorna a lista de submissões do usuário', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { questionId: 'q-1', isCorrect: true, answer: { f1: 'P' } },
      ]);

      const subs = await getUserSubmissions('user-1');
      expect(subs).toHaveLength(1);
      expect(subs[0].questionId).toBe('q-1');
      expect(prisma.submission.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          questionId: true,
          isCorrect: true,
          answer: true,
        },
      });
    });
  });

  describe('saveUserSubmission()', () => {
    it('executa upsert atômico da submissão com userId e questionId', async () => {
      (prisma.submission.upsert as jest.Mock).mockResolvedValue({});

      await saveUserSubmission({
        userId: 'user-1',
        questionId: 'q-1',
        isCorrect: true,
        answer: { f1: 'P' },
      });

      expect(prisma.submission.upsert).toHaveBeenCalledWith({
        where: {
          userId_questionId: {
            userId: 'user-1',
            questionId: 'q-1',
          },
        },
        update: {
          isCorrect: true,
          answer: { f1: 'P' },
        },
        create: {
          userId: 'user-1',
          questionId: 'q-1',
          isCorrect: true,
          answer: { f1: 'P' },
        },
      });
    });
  });
});
