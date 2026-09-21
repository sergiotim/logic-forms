/**
 * @file studentAnalytics.test.ts
 * @description Testes unitários do motor de analytics centrado no estudante (TDD - Fase Vermelha)
 * SPEC: analytics-spec.md — [SPEC-007 v2.8.0]
 */

import { getStudentAnalyticsOverview } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';

// Mock do Prisma Neon PostgreSQL
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

describe('studentAnalytics.ts (SPEC-007 v2.8.0 - TDD Fase Vermelha)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudentAnalyticsOverview()', () => {
    it('deve listar apenas usuários com role STUDENT e ignorar professores', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-1', name: 'Ana Silva', email: 'ana@faculdade.edu', role: 'STUDENT', image: null },
        { id: 'aluno-2', name: 'Bruno Souza', email: 'bruno@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getStudentAnalyticsOverview();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'STUDENT' },
        })
      );
      expect(result.totalStudents).toBe(2);
      expect(result.students).toHaveLength(2);
      expect(result.students.map((s) => s.id)).toEqual(['aluno-1', 'aluno-2']);
    });

    it('deve calcular porcentagem concluída (% Concluído) e porcentagem restante (% Restante) com base nas questões ativas', async () => {
      // 2 fases: Fase 1 com 2 questões, Fase 2 com 2 questões (Total: 4 questões ativas)
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-1', name: 'Carlos Lima', email: 'carlos@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-1',
          title: 'Introdução',
          icon: 'Network',
          order: 0,
          questions: [
            { id: 'q1', type: 'DIAGRAMACAO', topic: 'T1', enunciado: 'E1', order: 0 },
            { id: 'q2', type: 'DIAGRAMACAO', topic: 'T2', enunciado: 'E2', order: 1 },
          ],
        },
        {
          id: 'fase-2',
          title: 'Conectivos',
          icon: 'Table2',
          order: 1,
          questions: [
            { id: 'q3', type: 'TABELA_VERDADE', topic: 'T3', enunciado: 'E3', order: 0 },
            { id: 'q4', type: 'FORMALIZACAO', topic: 'T4', enunciado: 'E4', order: 1 },
          ],
        },
      ]);
      // Aluno completou 3 de 4 questões (75% concluído, 25% restante)
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', userId: 'aluno-1', questionId: 'q1', isCorrect: true, answer: {}, createdAt: new Date('2026-09-20T10:00:00Z') },
        { id: 'sub-2', userId: 'aluno-1', questionId: 'q2', isCorrect: true, answer: {}, createdAt: new Date('2026-09-20T10:05:00Z') },
        { id: 'sub-3', userId: 'aluno-1', questionId: 'q3', isCorrect: true, answer: {}, createdAt: new Date('2026-09-20T10:10:00Z') },
      ]);

      const result = await getStudentAnalyticsOverview();
      const aluno = result.students[0];

      expect(aluno.totalQuestoesAtivas).toBe(4);
      expect(aluno.questoesConcluidas).toBe(3);
      expect(aluno.porcentagemConcluida).toBe(75);
      expect(aluno.porcentagemRestante).toBe(25);
    });

    it('deve contabilizar todas as repetições e erros cometidos pelo aluno', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-1', name: 'Diana Prince', email: 'diana@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-1',
          title: 'Fase 1',
          icon: 'Network',
          order: 0,
          questions: [{ id: 'q1', type: 'FORMALIZACAO', topic: 'T1', enunciado: 'E1', order: 0 }],
        },
      ]);
      // Aluno errou a questão q1 3 vezes antes de acertar na 4ª tentativa
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { id: 's1', userId: 'aluno-1', questionId: 'q1', isCorrect: false, answer: 'P', createdAt: new Date('2026-09-20T10:00:00Z') },
        { id: 's2', userId: 'aluno-1', questionId: 'q1', isCorrect: false, answer: 'Q', createdAt: new Date('2026-09-20T10:01:00Z') },
        { id: 's3', userId: 'aluno-1', questionId: 'q1', isCorrect: false, answer: 'P ^ Q', createdAt: new Date('2026-09-20T10:02:00Z') },
        { id: 's4', userId: 'aluno-1', questionId: 'q1', isCorrect: true, answer: 'P v Q', createdAt: new Date('2026-09-20T10:03:00Z') },
      ]);

      const result = await getStudentAnalyticsOverview();
      const aluno = result.students[0];

      expect(aluno.totalErros).toBe(3);
      expect(aluno.acertosDePrimeira).toBe(0); // Não foi de primeira pois errou antes
    });

    it('deve computar acertos de primeira quando a questão não possui erros prévios', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-1', name: 'Eduardo M.', email: 'edu@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-1',
          title: 'Fase 1',
          icon: 'Network',
          order: 0,
          questions: [
            { id: 'q1', type: 'FORMALIZACAO', topic: 'T1', enunciado: 'E1', order: 0 },
            { id: 'q2', type: 'FORMALIZACAO', topic: 'T2', enunciado: 'E2', order: 1 },
          ],
        },
      ]);
      // q1 acertou de primeira (0 erros); q2 errou 1 vez antes de acertar
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        { id: 's1', userId: 'aluno-1', questionId: 'q1', isCorrect: true, answer: 'P', createdAt: new Date('2026-09-20T10:00:00Z') },
        { id: 's2', userId: 'aluno-1', questionId: 'q2', isCorrect: false, answer: 'X', createdAt: new Date('2026-09-20T10:05:00Z') },
        { id: 's3', userId: 'aluno-1', questionId: 'q2', isCorrect: true, answer: 'Y', createdAt: new Date('2026-09-20T10:06:00Z') },
      ]);

      const result = await getStudentAnalyticsOverview();
      const aluno = result.students[0];

      expect(aluno.questoesConcluidas).toBe(2);
      expect(aluno.acertosDePrimeira).toBe(1);
      expect(aluno.totalErros).toBe(1);
    });

    it('deve tratar adequadamente aluno sem submissões (não iniciado)', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-inativo', name: 'Fernando Inativo', email: 'fernando@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-1',
          title: 'Fase 1',
          icon: 'Network',
          order: 0,
          questions: [{ id: 'q1', type: 'DIAGRAMACAO', topic: 'T1', enunciado: 'E1', order: 0 }],
        },
      ]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getStudentAnalyticsOverview();
      const aluno = result.students[0];

      expect(aluno.questoesConcluidas).toBe(0);
      expect(aluno.porcentagemConcluida).toBe(0);
      expect(aluno.porcentagemRestante).toBe(100);
      expect(aluno.totalErros).toBe(0);
      expect(aluno.ultimaAtividade).toBeNull();
    });

    it('deve montar a estrutura hierárquica do Raio-X detalhando fases, status das questões e última resposta', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-1', name: 'Gabriela Ramos', email: 'gabi@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fase-1',
          title: 'Dedução Básica',
          icon: 'Network',
          order: 0,
          questions: [
            { id: 'q-primeira', type: 'FORMALIZACAO', topic: 'Formalização', enunciado: 'Questão Fácil', order: 0 },
            { id: 'q-dificil', type: 'TABELA_VERDADE', topic: 'Tabela', enunciado: 'Questão Difícil', order: 1 },
            { id: 'q-pendente', type: 'DIAGRAMACAO', topic: 'Diagrama', enunciado: 'Questão Pendente', order: 2 },
            { id: 'q-virgem', type: 'FORMALIZACAO', topic: 'Formalização', enunciado: 'Questão Nunca Vista', order: 3 },
          ],
        },
      ]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        // q-primeira: acerto direto
        { id: 's1', userId: 'aluno-1', questionId: 'q-primeira', isCorrect: true, answer: 'A ^ B', createdAt: new Date('2026-09-20T10:00:00Z') },
        // q-dificil: 2 erros e 1 acerto
        { id: 's2', userId: 'aluno-1', questionId: 'q-dificil', isCorrect: false, answer: ['V', 'F'], createdAt: new Date('2026-09-20T10:01:00Z') },
        { id: 's3', userId: 'aluno-1', questionId: 'q-dificil', isCorrect: false, answer: ['F', 'V'], createdAt: new Date('2026-09-20T10:02:00Z') },
        { id: 's4', userId: 'aluno-1', questionId: 'q-dificil', isCorrect: true, answer: ['V', 'V'], createdAt: new Date('2026-09-20T10:03:00Z') },
        // q-pendente: 1 erro e não concluiu
        { id: 's5', userId: 'aluno-1', questionId: 'q-pendente', isCorrect: false, answer: { f1: 'C' }, createdAt: new Date('2026-09-20T10:04:00Z') },
        // q-virgem: sem submissões
      ]);

      const result = await getStudentAnalyticsOverview();
      const aluno = result.students[0];
      const fase = aluno.fases[0];

      expect(fase.phaseId).toBe('fase-1');
      expect(fase.questoesConcluidas).toBe(2);
      expect(fase.totalQuestoes).toBe(4);

      const qPrimeira = fase.questoes.find((q) => q.questionId === 'q-primeira');
      const qDificil = fase.questoes.find((q) => q.questionId === 'q-dificil');
      const qPendente = fase.questoes.find((q) => q.questionId === 'q-pendente');
      const qVirgem = fase.questoes.find((q) => q.questionId === 'q-virgem');

      // Status esperados da SPEC-007
      expect(qPrimeira?.status).toBe('de_primeira');
      expect(qPrimeira?.errosCount).toBe(0);
      expect(qPrimeira?.ultimaResposta).toBe('A ^ B');

      expect(qDificil?.status).toBe('com_dificuldade');
      expect(qDificil?.errosCount).toBe(2);
      expect(qDificil?.ultimaResposta).toEqual(['V', 'V']);

      expect(qPendente?.status).toBe('pendente_com_erros');
      expect(qPendente?.errosCount).toBe(1);
      expect(qPendente?.ultimaResposta).toEqual({ f1: 'C' });

      expect(qVirgem?.status).toBe('nao_iniciada');
      expect(qVirgem?.errosCount).toBe(0);
    });

    it('critério de não-cálculo de nota: o objeto retornado NÃO deve possuir nota/grade calculada', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'aluno-1', name: 'Helena Costa', email: 'helena@faculdade.edu', role: 'STUDENT', image: null },
      ]);
      (prisma.phase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getStudentAnalyticsOverview();
      const aluno = result.students[0] as unknown as Record<string, unknown>;

      // A spec proíbe cálculo automático de notas para garantir a soberania do professor
      expect(aluno.nota).toBeUndefined();
      expect(aluno.grade).toBeUndefined();
      expect(aluno.score).toBeUndefined();
    });
  });
});

