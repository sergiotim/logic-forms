/**
 * @file analytics.test.ts
 * @description Testes unitários do motor de métricas e analytics (TDD - Fase Vermelha)
 * SPEC: analytics-spec.md — [SPEC-007]
 */

import { getAnalyticsOverview, getPhaseAnalytics } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';

// Mock do prisma para simular dados do Neon PostgreSQL
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    phase: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
    },
  },
}));

describe('analytics.ts (Motor de Métricas do Professor - SPEC-007)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalyticsOverview()', () => {
    it('deve retornar métricas zeradas quando não há submissões ou alunos', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.question.count as jest.Mock).mockResolvedValue(0);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const overview = await getAnalyticsOverview();

      expect(overview.totalActiveStudents).toBe(0);
      expect(overview.totalStudents).toBe(0);
      expect(overview.globalCompletionRate).toBe(0);
      expect(overview.performanceByType).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'DIAGRAMACAO', totalSubmissions: 0, successRate: 0 }),
          expect.objectContaining({ type: 'TABELA_VERDADE', totalSubmissions: 0, successRate: 0 }),
          expect.objectContaining({ type: 'FORMALIZACAO', totalSubmissions: 0, successRate: 0 }),
        ])
      );
    });

    it('deve calcular o total de alunos ativos considerando apenas role STUDENT com submissões', async () => {
      // Mock de 3 estudantes e 1 professor
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u-1', role: 'STUDENT' },
        { id: 'u-2', role: 'STUDENT' },
        { id: 'u-3', role: 'STUDENT' },
      ]);
      (prisma.question.count as jest.Mock).mockResolvedValue(5);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([]);
      
      // Submissões apenas de u-1 e u-2 (u-3 é inativo, prof-1 é professor)
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', userId: 'u-1', questionId: 'q-1', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        { id: 'sub-2', userId: 'u-2', questionId: 'q-1', isCorrect: false, question: { type: 'DIAGRAMACAO' } },
        { id: 'sub-3', userId: 'prof-1', questionId: 'q-1', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
      ]);

      const overview = await getAnalyticsOverview();

      expect(overview.totalStudents).toBe(3);
      expect(overview.totalActiveStudents).toBe(2);
    });

    it('deve calcular a taxa global de conclusão baseada nas questões resolvidas com sucesso pelos alunos', async () => {
      // 2 alunos, total de 4 questões no sistema.
      // u-1 acertou 4 questões (100% de conclusão)
      // u-2 acertou 2 questões (50% de conclusão)
      // Conclusão global média esperada: (100 + 50) / 2 = 75%
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u-1', role: 'STUDENT' },
        { id: 'u-2', role: 'STUDENT' },
      ]);
      (prisma.question.count as jest.Mock).mockResolvedValue(4);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', userId: 'u-1', questionId: 'q-1', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        { id: 'sub-2', userId: 'u-1', questionId: 'q-2', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        { id: 'sub-3', userId: 'u-1', questionId: 'q-3', isCorrect: true, question: { type: 'TABELA_VERDADE' } },
        { id: 'sub-4', userId: 'u-1', questionId: 'q-4', isCorrect: true, question: { type: 'FORMALIZACAO' } },
        { id: 'sub-5', userId: 'u-2', questionId: 'q-1', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        { id: 'sub-6', userId: 'u-2', questionId: 'q-2', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        { id: 'sub-7', userId: 'u-2', questionId: 'q-3', isCorrect: false, question: { type: 'TABELA_VERDADE' } },
      ]);

      const overview = await getAnalyticsOverview();

      expect(overview.globalCompletionRate).toBe(75);
    });

    it('deve calcular o desempenho e taxa de acerto por tipo de questão', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u-1', role: 'STUDENT' }]);
      (prisma.question.count as jest.Mock).mockResolvedValue(3);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        // DIAGRAMACAO: 2 certas de 2 (100%)
        { id: 's1', userId: 'u-1', questionId: 'q-1', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        { id: 's2', userId: 'u-1', questionId: 'q-2', isCorrect: true, question: { type: 'DIAGRAMACAO' } },
        // TABELA_VERDADE: 1 certa de 2 (50%)
        { id: 's3', userId: 'u-1', questionId: 'q-3', isCorrect: true, question: { type: 'TABELA_VERDADE' } },
        { id: 's4', userId: 'u-1', questionId: 'q-4', isCorrect: false, question: { type: 'TABELA_VERDADE' } },
        // FORMALIZACAO: 0 certas de 1 (0%)
        { id: 's5', userId: 'u-1', questionId: 'q-5', isCorrect: false, question: { type: 'FORMALIZACAO' } },
      ]);

      const overview = await getAnalyticsOverview();

      const diag = overview.performanceByType.find((p) => p.type === 'DIAGRAMACAO');
      const tab = overview.performanceByType.find((p) => p.type === 'TABELA_VERDADE');
      const form = overview.performanceByType.find((p) => p.type === 'FORMALIZACAO');

      expect(diag?.totalSubmissions).toBe(2);
      expect(diag?.successRate).toBe(100);

      expect(tab?.totalSubmissions).toBe(2);
      expect(tab?.successRate).toBe(50);

      expect(form?.totalSubmissions).toBe(1);
      expect(form?.successRate).toBe(0);
    });
  });

  describe('getPhaseAnalytics(phaseId)', () => {
    it('deve ranquear as questões mais difíceis da fase pela quantidade e taxa de falhas', async () => {
      (prisma.phase.findUnique as jest.Mock).mockResolvedValue({
        id: 'phase-1',
        title: 'Fase de Dedução',
        questions: [
          { id: 'q-1', enunciado: 'Enunciado Fácil', topic: 'Topico 1', type: 'FORMALIZACAO' },
          { id: 'q-2', enunciado: 'Enunciado Difícil', topic: 'Topico 2', type: 'TABELA_VERDADE' },
        ],
      });

      // q-1: 1 erro, 3 acertos (4 tentativas, 25% taxa de erro)
      // q-2: 3 erros, 1 acerto (4 tentativas, 75% taxa de erro)
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { questionId: 'q-1', isCorrect: false, answer: 'P v Q' },
        { questionId: 'q-1', isCorrect: true, answer: 'P ^ Q' },
        { questionId: 'q-1', isCorrect: true, answer: 'P ^ Q' },
        { questionId: 'q-1', isCorrect: true, answer: 'P ^ Q' },

        { questionId: 'q-2', isCorrect: false, answer: ['V', 'F'] },
        { questionId: 'q-2', isCorrect: false, answer: ['V', 'F'] },
        { questionId: 'q-2', isCorrect: false, answer: ['F', 'V'] },
        { questionId: 'q-2', isCorrect: true, answer: ['V', 'V'] },
      ]);

      const phaseMetrics = await getPhaseAnalytics('phase-1');

      expect(phaseMetrics.phaseId).toBe('phase-1');
      expect(phaseMetrics.hardestQuestions).toHaveLength(2);
      // A questão mais difícil deve vir primeiro no ranking
      expect(phaseMetrics.hardestQuestions[0].questionId).toBe('q-2');
      expect(phaseMetrics.hardestQuestions[0].failureCount).toBe(3);
      expect(phaseMetrics.hardestQuestions[0].failureRate).toBe(75);

      expect(phaseMetrics.hardestQuestions[1].questionId).toBe('q-1');
      expect(phaseMetrics.hardestQuestions[1].failureCount).toBe(1);
      expect(phaseMetrics.hardestQuestions[1].failureRate).toBe(25);
    });

    it('deve agrupar e calcular a frequência dos erros mais comuns da questão (análise qualitativa do JSON)', async () => {
      (prisma.phase.findUnique as jest.Mock).mockResolvedValue({
        id: 'phase-1',
        title: 'Fase de Formalização',
        questions: [
          { id: 'q-form', enunciado: 'Formalize a proposição', topic: 'Lógica', type: 'FORMALIZACAO' },
        ],
      });

      // 4 submissões erradas com 3 variações:
      // 'P v Q' (2 vezes = 50%)
      // 'P -> Q' (1 vez = 25%)
      // '~P' (1 vez = 25%)
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { questionId: 'q-form', isCorrect: false, answer: 'P v Q' },
        { questionId: 'q-form', isCorrect: false, answer: 'P v Q' },
        { questionId: 'q-form', isCorrect: false, answer: 'P -> Q' },
        { questionId: 'q-form', isCorrect: false, answer: '~P' },
      ]);

      const phaseMetrics = await getPhaseAnalytics('phase-1');
      const errorAnalysis = phaseMetrics.errorAnalysis.find((ea) => ea.questionId === 'q-form');

      expect(errorAnalysis).toBeDefined();
      expect(errorAnalysis?.totalErrors).toBe(4);
      expect(errorAnalysis?.topErrors[0]).toEqual({
        answer: 'P v Q',
        count: 2,
        percentage: 50,
      });
    });

    it('deve lançar erro quando a fase informada não existir no banco', async () => {
      (prisma.phase.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getPhaseAnalytics('fase-inexistente')).rejects.toThrow(/fase n[aã]o encontrada/i);
    });
  });
});

