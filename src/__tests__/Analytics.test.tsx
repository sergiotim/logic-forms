/**
 * @file Analytics.test.tsx
 * @description Testes de integração do Dashboard de Análises do Professor (TDD - Fase Vermelha)
 * SPEC: analytics-spec.md — [SPEC-007]
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import EditorPage from '@/app/editor/page';
import { LegacyAnalyticsDashboard as AnalyticsDashboard } from '@/components/editor/analytics/legacy/LegacyAnalyticsDashboard';
import type { GlobalAnalyticsData } from '@/types';

// Mock do storage e API para renderização segura do EditorPage
jest.mock('@/lib/storage', () => ({
  loadEditorState: jest.fn(() => ({
    version: 1,
    updatedAt: '2026-09-14T00:00:00.000Z',
    phases: [
      {
        id: 'phase-1',
        titulo: 'Fase Inicial',
        icone: 'Network',
        questoes: [],
      },
    ],
  })),
  saveEditorState: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchPhasesApi: jest.fn().mockResolvedValue([]),
  savePhasesApi: jest.fn().mockResolvedValue([]),
}));

// Mock de dados analíticos para os testes do Dashboard
const MOCK_ANALYTICS_DATA: GlobalAnalyticsData = {
  totalActiveStudents: 42,
  totalStudents: 50,
  globalCompletionRate: 68.5,
  performanceByType: [
    { type: 'DIAGRAMACAO', totalSubmissions: 120, correctSubmissions: 96, successRate: 80 },
    { type: 'TABELA_VERDADE', totalSubmissions: 80, correctSubmissions: 48, successRate: 60 },
    { type: 'FORMALIZACAO', totalSubmissions: 60, correctSubmissions: 24, successRate: 40 },
  ],
  phases: [
    {
      phaseId: 'phase-1',
      phaseTitle: 'Fase de Dedução Lógica',
      totalQuestions: 2,
      totalSubmissions: 50,
      hardestQuestions: [
        {
          questionId: 'q-dif-1',
          enunciado: 'Formalize: Nem todo pássaro voa',
          topic: 'Predicados',
          type: 'FORMALIZACAO',
          failureCount: 18,
          totalAttempts: 25,
          failureRate: 72,
        },
        {
          questionId: 'q-facil-1',
          enunciado: 'Classifique a conclusão',
          topic: 'Argumentação',
          type: 'DIAGRAMACAO',
          failureCount: 4,
          totalAttempts: 25,
          failureRate: 16,
        },
      ],
      errorAnalysis: [
        {
          questionId: 'q-dif-1',
          enunciado: 'Formalize: Nem todo pássaro voa',
          totalErrors: 18,
          topErrors: [
            { answer: '~∀x(P(x) → V(x))', count: 12, percentage: 66.7 },
            { answer: '∃x(~P(x) ∧ V(x))', count: 6, percentage: 33.3 },
          ],
        },
      ],
    },
    {
      phaseId: 'phase-2',
      phaseTitle: 'Fase de Conectivos',
      totalQuestions: 1,
      totalSubmissions: 20,
      hardestQuestions: [],
      errorAnalysis: [],
    },
  ],
};

describe('Dashboard de Análises do Professor (SPEC-007)', () => {
  describe('Header de Navegação do Editor', () => {
    it('deve conter um botão/link no Header do Editor direcionando para /editor/analytics', () => {
      render(<EditorPage />);

      // Deve existir um link de navegação que leve para /editor/analytics
      const analyticsLink = screen.getByRole('link', { name: /an[aá]lises|analytics|dashboard/i });
      expect(analyticsLink).toBeInTheDocument();
      expect(analyticsLink).toHaveAttribute('href', '/editor/analytics');
    });
  });

  describe('Interface do AnalyticsDashboard', () => {
    it('deve renderizar o título do painel e os cards de métricas globais (KPIs)', () => {
      render(<AnalyticsDashboard initialData={MOCK_ANALYTICS_DATA} />);

      expect(screen.getByRole('heading', { name: /dashboard de an[aá]lise|m[eé]tricas/i })).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument(); // Alunos ativos
      expect(screen.getByText(/68.5%/i)).toBeInTheDocument(); // Taxa de conclusão
    });

    it('deve renderizar o comparativo de desempenho por tipo de questão', () => {
      render(<AnalyticsDashboard initialData={MOCK_ANALYTICS_DATA} />);

      // Gráfico / cartões por tipo
      expect(screen.getByText(/diagrama[cç][aã]o/i)).toBeInTheDocument();
      expect(screen.getByText(/80%/i)).toBeInTheDocument();

      expect(screen.getByText(/tabela-verdade/i)).toBeInTheDocument();
      expect(screen.getByText(/60%/i)).toBeInTheDocument();

      expect(screen.getByText(/formaliza[cç][aã]o/i)).toBeInTheDocument();
      expect(screen.getByText(/40%/i)).toBeInTheDocument();
    });

    it('deve permitir selecionar e filtrar métricas por fase específica', () => {
      render(<AnalyticsDashboard initialData={MOCK_ANALYTICS_DATA} />);

      const phaseSelect = screen.getByRole('combobox', { name: /selecionar fase|fase/i });
      expect(phaseSelect).toBeInTheDocument();

      // Alternar para fase 2
      fireEvent.change(phaseSelect, { target: { value: 'phase-2' } });
      expect(screen.getByText('Fase de Conectivos')).toBeInTheDocument();
    });

    it('deve exibir o ranking das questões mais difíceis da fase com maior índice de erros', () => {
      render(<AnalyticsDashboard initialData={MOCK_ANALYTICS_DATA} />);

      const rankingSection = screen.getByTestId('hardest-questions-ranking');
      expect(rankingSection).toBeInTheDocument();

      // A questão com 72% de erro deve estar presente
      expect(within(rankingSection).getByText(/Nem todo pássaro voa/i)).toBeInTheDocument();
      expect(within(rankingSection).getByText(/72%/i)).toBeInTheDocument();
    });

    it('deve exibir a análise qualitativa com as respostas erradas mais frequentes dos alunos', () => {
      render(<AnalyticsDashboard initialData={MOCK_ANALYTICS_DATA} />);

      const errorSection = screen.getByTestId('common-errors-analysis');
      expect(errorSection).toBeInTheDocument();

      // Erro mais comum identificado
      expect(within(errorSection).getByText('~∀x(P(x) → V(x))')).toBeInTheDocument();
      expect(within(errorSection).getByText(/66.7%/i)).toBeInTheDocument();
    });

    it('deve conter um botão/link para voltar à edição de fases (/editor)', () => {
      render(<AnalyticsDashboard initialData={MOCK_ANALYTICS_DATA} />);

      const backLink = screen.getByRole('link', { name: /voltar ao editor/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/editor');
    });
  });
});

