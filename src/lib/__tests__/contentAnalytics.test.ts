/**
 * @file contentAnalytics.test.ts
 * @description Testes unitários do motor de analytics de conteúdo e dificuldade (TDD - Fase Vermelha)
 * SPEC: content-analytics-spec.md — [SPEC-009]
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

describe('contentAnalytics (SPEC-009 - TDD Fase Vermelha)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar estrutura contentAnalytics com métricas globais de fases e questões', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'aluno-1', name: 'Alice', email: 'alice@faculdade.edu', role: 'STUDENT', image: null },
      { id: 'aluno-2', name: 'Bob', email: 'bob@faculdade.edu', role: 'STUDENT', image: null },
    ]);

    (prisma.phase.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'fase-1',
        title: 'Introdução à Lógica',
        icon: 'Network',
        order: 0,
        questions: [
          { id: 'q1', type: 'FORMALIZACAO', topic: 'Proposições', enunciado: 'Formalize P', order: 0 },
        ],
      },
    ]);

    (prisma.submission.findMany as jest.Mock).mockResolvedValue([
      { id: 's1', userId: 'aluno-1', questionId: 'q1', isCorrect: true, answer: 'P', createdAt: new Date('2026-10-18T10:00:00Z') },
      { id: 's2', userId: 'aluno-2', questionId: 'q1', isCorrect: false, answer: 'Q', createdAt: new Date('2026-10-18T10:05:00Z') },
    ]);

    const result = await getStudentAnalyticsOverview();

    expect(result.contentAnalytics).toBeDefined();
    expect(result.contentAnalytics?.totalQuestionsActive).toBe(1);
    expect(result.contentAnalytics?.phases).toHaveLength(1);
    expect(result.contentAnalytics?.questions).toHaveLength(1);
  });

  it('deve calcular corretamente a taxa de acerto de 1ª tentativa e taxa de gargalo (alunos travados) da questão', async () => {
    // 3 estudantes:
    // Aluno 1: acertou q1 de primeira
    // Aluno 2: errou q1 uma vez e acertou depois
    // Aluno 3: errou q1 duas vezes e não acertou (travado)
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'STUDENT', image: null },
      { id: 'u2', name: 'User 2', email: 'u2@test.com', role: 'STUDENT', image: null },
      { id: 'u3', name: 'User 3', email: 'u3@test.com', role: 'STUDENT', image: null },
    ]);

    (prisma.phase.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'fase-1',
        title: 'Dedução',
        icon: 'Network',
        order: 0,
        questions: [
          { id: 'q1', type: 'FORMALIZACAO', topic: 'Condicional', enunciado: 'Se chove, molha', order: 0 },
        ],
      },
    ]);

    (prisma.submission.findMany as jest.Mock).mockResolvedValue([
      { id: 's1', userId: 'u1', questionId: 'q1', isCorrect: true, answer: 'P -> Q', createdAt: new Date('2026-10-18T10:00:00Z') },
      { id: 's2', userId: 'u2', questionId: 'q1', isCorrect: false, answer: 'P ^ Q', createdAt: new Date('2026-10-18T10:01:00Z') },
      { id: 's3', userId: 'u2', questionId: 'q1', isCorrect: true, answer: 'P -> Q', createdAt: new Date('2026-10-18T10:02:00Z') },
      { id: 's4', userId: 'u3', questionId: 'q1', isCorrect: false, answer: 'Q -> P', createdAt: new Date('2026-10-18T10:03:00Z') },
      { id: 's5', userId: 'u3', questionId: 'q1', isCorrect: false, answer: 'P v Q', createdAt: new Date('2026-10-18T10:04:00Z') },
    ]);

    const result = await getStudentAnalyticsOverview();
    const q1Metrics = result.contentAnalytics?.questions.find((q) => q.questionId === 'q1');

    expect(q1Metrics).toBeDefined();
    expect(q1Metrics?.totalStudents).toBe(3);
    expect(q1Metrics?.attemptedCount).toBe(3);
    expect(q1Metrics?.firstTryCount).toBe(1);
    expect(q1Metrics?.completedWithErrorsCount).toBe(1);
    expect(q1Metrics?.stuckCount).toBe(1);
    expect(q1Metrics?.resolvedCount).toBe(2);
    // firstTryRate: 1 de 3 tentaram = 33.3%
    expect(q1Metrics?.firstTryRate).toBe(33.3);
    // stuckRate: 1 de 3 tentaram = 33.3%
    expect(q1Metrics?.stuckRate).toBe(33.3);
    // avgAttemptsToSuccess: u1 levou 1 tent, u2 levou 2 tent. Média = (1 + 2)/2 = 1.5
    expect(q1Metrics?.avgAttemptsToSuccess).toBe(1.5);
  });

  it('deve detectar "chute rápido" (tentativas consecutivas incorretas com intervalo < 5 segundos)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'STUDENT', image: null },
      { id: 'u2', name: 'User 2', email: 'u2@test.com', role: 'STUDENT', image: null },
    ]);

    (prisma.phase.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'fase-1',
        title: 'Fase 1',
        icon: 'Network',
        order: 0,
        questions: [{ id: 'q1', type: 'FORMALIZACAO', topic: 'Topico', enunciado: 'Enunciado', order: 0 }],
      },
    ]);

    // u1 errou com intervalo de 2 segundos (chute rápido!)
    // u2 errou com intervalo de 15 segundos (pensou antes de tentar de novo)
    (prisma.submission.findMany as jest.Mock).mockResolvedValue([
      { id: 's1', userId: 'u1', questionId: 'q1', isCorrect: false, answer: 'A', createdAt: new Date('2026-10-18T10:00:00.000Z') },
      { id: 's2', userId: 'u1', questionId: 'q1', isCorrect: false, answer: 'B', createdAt: new Date('2026-10-18T10:00:02.000Z') },
      { id: 's3', userId: 'u2', questionId: 'q1', isCorrect: false, answer: 'C', createdAt: new Date('2026-10-18T10:00:00.000Z') },
      { id: 's4', userId: 'u2', questionId: 'q1', isCorrect: false, answer: 'D', createdAt: new Date('2026-10-18T10:00:15.000Z') },
    ]);

    const result = await getStudentAnalyticsOverview();
    const q1Metrics = result.contentAnalytics?.questions.find((q) => q.questionId === 'q1');

    expect(q1Metrics?.rapidGuessCount).toBe(1);
    const u1Breakdown = q1Metrics?.studentBreakdown.find((s) => s.studentId === 'u1');
    const u2Breakdown = q1Metrics?.studentBreakdown.find((s) => s.studentId === 'u2');
    expect(u1Breakdown?.hasRapidGuess).toBe(true);
    expect(u2Breakdown?.hasRapidGuess).toBe(false);
  });

  it('deve identificar corretamente a fase mais desafiadora, fase mais fluida e a questão crítica', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'STUDENT', image: null },
    ]);

    // Duas fases:
    // Fase 1: questão q1 teve 100% de acerto de 1ª
    // Fase 2: questão q2 teve 3 erros e 0 acertos (travado)
    (prisma.phase.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'fase-facil',
        title: 'Fase Fácil',
        icon: 'Network',
        order: 0,
        questions: [{ id: 'q1', type: 'FORMALIZACAO', topic: 'Facil', enunciado: 'E1', order: 0 }],
      },
      {
        id: 'fase-dificil',
        title: 'Fase Difícil',
        icon: 'Table2',
        order: 1,
        questions: [{ id: 'q2', type: 'TABELA_VERDADE', topic: 'Dificil', enunciado: 'E2', order: 0 }],
      },
    ]);

    (prisma.submission.findMany as jest.Mock).mockResolvedValue([
      { id: 's1', userId: 'u1', questionId: 'q1', isCorrect: true, answer: 'P', createdAt: new Date('2026-10-18T10:00:00Z') },
      { id: 's2', userId: 'u1', questionId: 'q2', isCorrect: false, answer: ['V'], createdAt: new Date('2026-10-18T10:01:00Z') },
      { id: 's3', userId: 'u1', questionId: 'q2', isCorrect: false, answer: ['F'], createdAt: new Date('2026-10-18T10:02:00Z') },
      { id: 's4', userId: 'u1', questionId: 'q2', isCorrect: false, answer: ['V'], createdAt: new Date('2026-10-18T10:03:00Z') },
    ]);

    const result = await getStudentAnalyticsOverview();
    const content = result.contentAnalytics;

    expect(content?.hardestPhase?.phaseId).toBe('fase-dificil');
    expect(content?.easiestPhase?.phaseId).toBe('fase-facil');
    expect(content?.criticalQuestion?.questionId).toBe('q2');
    expect(content?.criticalQuestion?.difficultyLevel).toBe('critica');
  });

  it('deve agrupar topErrors formatando respostas de array e objeto sem falhar', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'STUDENT', image: null },
    ]);

    (prisma.phase.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'fase-1',
        title: 'Fase 1',
        icon: 'Table2',
        order: 0,
        questions: [{ id: 'q1', type: 'TABELA_VERDADE', topic: 'Topico', enunciado: 'E1', order: 0 }],
      },
    ]);

    (prisma.submission.findMany as jest.Mock).mockResolvedValue([
      { id: 's1', userId: 'u1', questionId: 'q1', isCorrect: false, answer: ['V', 'V', 'F'], createdAt: new Date('2026-10-18T10:00:00Z') },
      { id: 's2', userId: 'u1', questionId: 'q1', isCorrect: false, answer: ['V', 'V', 'F'], createdAt: new Date('2026-10-18T10:01:00Z') },
      { id: 's3', userId: 'u1', questionId: 'q1', isCorrect: false, answer: ['F', 'F', 'F'], createdAt: new Date('2026-10-18T10:02:00Z') },
    ]);

    const result = await getStudentAnalyticsOverview();
    const q1 = result.contentAnalytics?.questions.find((q) => q.questionId === 'q1');

    expect(q1?.topErrors).toHaveLength(2);
    expect(q1?.topErrors[0].count).toBe(2);
    expect(q1?.topErrors[0].percentage).toBe(66.7);
  });
});

