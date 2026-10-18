/**
 * @file ContentAnalytics.test.tsx
 * @description Testes de integração da visão de Conteúdo & Dificuldade (TDD - Fase Vermelha)
 * SPEC: content-analytics-spec.md — [SPEC-009]
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { StudentAnalyticsDashboard } from '@/components/editor/analytics/StudentAnalyticsDashboard';
import type { StudentAnalyticsOverviewData } from '@/types';

const MOCK_ANALYTICS_WITH_CONTENT: StudentAnalyticsOverviewData = {
  totalStudents: 3,
  mediaConclusaoTurma: 60,
  concluidosTotal: 1,
  naoIniciadosTotal: 0,
  students: [
    {
      id: 'aluno-1',
      name: 'Alice Cooper',
      email: 'alice@faculdade.edu',
      questoesConcluidas: 2,
      totalQuestoesAtivas: 2,
      porcentagemConcluida: 100,
      porcentagemRestante: 0,
      totalErros: 0,
      acertosDePrimeira: 2,
      ultimaAtividade: '2026-10-18T14:00:00Z',
      fases: [],
    },
    {
      id: 'aluno-2',
      name: 'Bob Marley',
      email: 'bob@faculdade.edu',
      questoesConcluidas: 1,
      totalQuestoesAtivas: 2,
      porcentagemConcluida: 50,
      porcentagemRestante: 50,
      totalErros: 3,
      acertosDePrimeira: 0,
      ultimaAtividade: '2026-10-18T15:00:00Z',
      fases: [],
    },
    {
      id: 'aluno-3',
      name: 'Charlie Brown',
      email: 'charlie@faculdade.edu',
      questoesConcluidas: 0,
      totalQuestoesAtivas: 2,
      porcentagemConcluida: 0,
      porcentagemRestante: 100,
      totalErros: 2,
      acertosDePrimeira: 0,
      ultimaAtividade: '2026-10-18T16:00:00Z',
      fases: [],
    },
  ],
  contentAnalytics: {
    globalFirstTryRate: 50,
    totalQuestionsActive: 2,
    hardestPhase: {
      phaseId: 'fase-deducao',
      titulo: 'Dedução Natural',
      ordem: 0,
      totalQuestions: 2,
      attemptedQuestionsCount: 2,
      completionRate: 50,
      firstTryRate: 33.3,
      failureRate: 62.5,
      totalErrors: 5,
      totalAttempts: 8,
      stuckStudentsCount: 1,
      avgAttemptsToSuccess: 2.5,
      difficultyScore: 70,
      difficultyLevel: 'dificil',
      distribution: {
        firstTryPct: 33.3,
        completedWithErrorsPct: 33.3,
        stuckPct: 33.4,
        notStartedPct: 0,
      },
    },
    easiestPhase: {
      phaseId: 'fase-deducao',
      titulo: 'Dedução Natural',
      ordem: 0,
      totalQuestions: 2,
      attemptedQuestionsCount: 2,
      completionRate: 50,
      firstTryRate: 33.3,
      failureRate: 62.5,
      totalErrors: 5,
      totalAttempts: 8,
      stuckStudentsCount: 1,
      avgAttemptsToSuccess: 2.5,
      difficultyScore: 70,
      difficultyLevel: 'dificil',
      distribution: {
        firstTryPct: 33.3,
        completedWithErrorsPct: 33.3,
        stuckPct: 33.4,
        notStartedPct: 0,
      },
    },
    criticalQuestion: {
      questionId: 'q-critica',
      phaseId: 'fase-deducao',
      phaseTitle: 'Dedução Natural',
      phaseOrder: 0,
      questionOrder: 1,
      enunciado: 'Formalize o argumento complexo',
      topico: 'Modus Ponens',
      tipo: 'formalizacao',
      totalStudents: 3,
      attemptedCount: 3,
      resolvedCount: 1,
      firstTryCount: 0,
      completedWithErrorsCount: 1,
      stuckCount: 2,
      notStartedCount: 0,
      completionRate: 33.3,
      firstTryRate: 0,
      failureRate: 75,
      stuckRate: 66.7,
      avgAttemptsToSuccess: 3.0,
      totalAttempts: 6,
      totalErrors: 5,
      rapidGuessCount: 1,
      difficultyScore: 85,
      difficultyLevel: 'critica',
      topErrors: [
        { answer: 'P ^ Q', count: 3, percentage: 60 },
        { answer: 'P v Q', count: 2, percentage: 40 },
      ],
      studentBreakdown: [
        {
          studentId: 'aluno-3',
          name: 'Charlie Brown',
          email: 'charlie@faculdade.edu',
          status: 'pendente_com_erros',
          errosCount: 2,
          tentativasTotal: 2,
          ultimaResposta: 'P ^ Q',
          hasRapidGuess: true,
        },
        {
          studentId: 'aluno-2',
          name: 'Bob Marley',
          email: 'bob@faculdade.edu',
          status: 'com_dificuldade',
          errosCount: 3,
          tentativasTotal: 4,
          ultimaResposta: 'P -> Q',
          hasRapidGuess: false,
        },
      ],
    },
    phases: [
      {
        phaseId: 'fase-deducao',
        titulo: 'Dedução Natural',
        ordem: 0,
        totalQuestions: 2,
        attemptedQuestionsCount: 2,
        completionRate: 50,
        firstTryRate: 33.3,
        failureRate: 62.5,
        totalErrors: 5,
        totalAttempts: 8,
        stuckStudentsCount: 1,
        avgAttemptsToSuccess: 2.5,
        difficultyScore: 70,
        difficultyLevel: 'dificil',
        distribution: {
          firstTryPct: 33.3,
          completedWithErrorsPct: 33.3,
          stuckPct: 33.4,
          notStartedPct: 0,
        },
      },
    ],
    questions: [
      {
        questionId: 'q-facil',
        phaseId: 'fase-deducao',
        phaseTitle: 'Dedução Natural',
        phaseOrder: 0,
        questionOrder: 0,
        enunciado: 'Formalize: Se chove, a rua molha',
        topico: 'Condicional',
        tipo: 'formalizacao',
        totalStudents: 3,
        attemptedCount: 2,
        resolvedCount: 2,
        firstTryCount: 2,
        completedWithErrorsCount: 0,
        stuckCount: 0,
        notStartedCount: 1,
        completionRate: 66.7,
        firstTryRate: 100,
        failureRate: 0,
        stuckRate: 0,
        avgAttemptsToSuccess: 1.0,
        totalAttempts: 2,
        totalErrors: 0,
        rapidGuessCount: 0,
        difficultyScore: 0,
        difficultyLevel: 'facil',
        topErrors: [],
        studentBreakdown: [
          {
            studentId: 'aluno-1',
            name: 'Alice Cooper',
            email: 'alice@faculdade.edu',
            status: 'de_primeira',
            errosCount: 0,
            tentativasTotal: 1,
            ultimaResposta: 'P -> Q',
            hasRapidGuess: false,
          },
        ],
      },
      {
        questionId: 'q-critica',
        phaseId: 'fase-deducao',
        phaseTitle: 'Dedução Natural',
        phaseOrder: 0,
        questionOrder: 1,
        enunciado: 'Formalize o argumento complexo',
        topico: 'Modus Ponens',
        tipo: 'formalizacao',
        totalStudents: 3,
        attemptedCount: 3,
        resolvedCount: 1,
        firstTryCount: 0,
        completedWithErrorsCount: 1,
        stuckCount: 2,
        notStartedCount: 0,
        completionRate: 33.3,
        firstTryRate: 0,
        failureRate: 75,
        stuckRate: 66.7,
        avgAttemptsToSuccess: 3.0,
        totalAttempts: 6,
        totalErrors: 5,
        rapidGuessCount: 1,
        difficultyScore: 85,
        difficultyLevel: 'critica',
        topErrors: [
          { answer: 'P ^ Q', count: 3, percentage: 60 },
          { answer: 'P v Q', count: 2, percentage: 40 },
        ],
        studentBreakdown: [
          {
            studentId: 'aluno-3',
            name: 'Charlie Brown',
            email: 'charlie@faculdade.edu',
            status: 'pendente_com_erros',
            errosCount: 2,
            tentativasTotal: 2,
            ultimaResposta: 'P ^ Q',
            hasRapidGuess: true,
          },
        ],
      },
    ],
  },
};

describe('ContentAnalytics Integration Tests (SPEC-009 - TDD Fase Vermelha)', () => {
  it('deve permitir alternar para a aba "Conteúdo & Dificuldade" através do seletor segmentado', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_ANALYTICS_WITH_CONTENT} />);

    // Deve possuir os botões de alternância
    const tabConteudo = screen.getByRole('button', { name: /conte[uú]do.*dificuldade/i });
    expect(tabConteudo).toBeInTheDocument();

    fireEvent.click(tabConteudo);

    // Na aba de conteúdo, deve exibir títulos e seções de conteúdo
    expect(screen.getByText(/panorama de fases/i)).toBeInTheDocument();
    expect(screen.getByText(/explorador de quest[oõ]es/i)).toBeInTheDocument();
  });

  it('deve renderizar os cards Spotlight de Destaque Executivo (Fase Mais Desafiadora, Gargalo, etc.)', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_ANALYTICS_WITH_CONTENT} />);

    const tabConteudo = screen.getByRole('button', { name: /conte[uú]do.*dificuldade/i });
    fireEvent.click(tabConteudo);

    expect(screen.getByText(/fase mais desafiadora/i)).toBeInTheDocument();
    expect(screen.getByText(/maior gargalo|quest[aã]o cr[ií]tica/i)).toBeInTheDocument();
    expect(screen.getByText('Dedução Natural')).toBeInTheDocument();
    expect(screen.getByText('Formalize o argumento complexo')).toBeInTheDocument();
  });

  it('deve permitir filtrar a tabela de questões ao clicar em um card de fase no Panorama de Fases', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_ANALYTICS_WITH_CONTENT} />);

    const tabConteudo = screen.getByRole('button', { name: /conte[uú]do.*dificuldade/i });
    fireEvent.click(tabConteudo);

    // Clicar no card da fase "Dedução Natural"
    const phaseCard = screen.getByRole('button', { name: /Dedução Natural/i });
    fireEvent.click(phaseCard);

    // Deve exibir indicação de filtro ativo
    expect(screen.getByText(/filtrando por: dedução natural|fase: dedução natural/i)).toBeInTheDocument();
  });

  it('deve ordenar e alternar questões através das lentes rápidas (Mais Difíceis, Mais Fáceis, Gargalos)', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_ANALYTICS_WITH_CONTENT} />);

    const tabConteudo = screen.getByRole('button', { name: /conte[uú]do.*dificuldade/i });
    fireEvent.click(tabConteudo);

    const btnMaisFaceis = screen.getByRole('button', { name: /mais f[aá]ceis/i });
    fireEvent.click(btnMaisFaceis);

    // A questão fácil deve aparecer no topo
    const table = screen.getByRole('table', { name: /tabela de quest[oõ]es/i });
    const rows = within(table).getAllByRole('row');
    expect(rows[1]).toHaveTextContent(/Formalize: Se chove, a rua molha/i);
  });

  it('deve abrir o modal "Raio-X da Questão" com as respostas incorretas mais frequentes e situação dos alunos', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_ANALYTICS_WITH_CONTENT} />);

    const tabConteudo = screen.getByRole('button', { name: /conte[uú]do.*dificuldade/i });
    fireEvent.click(tabConteudo);

    // Clicar no botão Raio-X da questão crítica
    const rowCritica = screen.getByText('Formalize o argumento complexo').closest('tr')!;
    const btnRaioX = within(rowCritica).getByRole('button', { name: /raio-x|ver detalhes/i });
    fireEvent.click(btnRaioX);

    // Modal deve abrir
    const modal = screen.getByRole('dialog', { name: /raio-x da quest[aã]o/i });
    expect(modal).toBeInTheDocument();

    // Deve listar erros frequentes da turma
    expect(within(modal).getByText('P ^ Q')).toBeInTheDocument();
    expect(within(modal).getByText(/3x|60%/i)).toBeInTheDocument();

    // Deve indicar aluno travado e alerta de chute rápido
    expect(within(modal).getByText('Charlie Brown')).toBeInTheDocument();
    expect(within(modal).getByText(/chute r[aá]pido/i)).toBeInTheDocument();
  });
});

