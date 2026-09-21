/**
 * @file StudentAnalytics.test.tsx
 * @description Testes de integração da interface do Analytics de Estudantes (TDD - Fase Vermelha)
 * SPEC: analytics-spec.md — [SPEC-007 v2.8.0]
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { StudentAnalyticsDashboard } from '@/components/editor/analytics/StudentAnalyticsDashboard';
import type { StudentAnalyticsOverviewData } from '@/types';

const MOCK_STUDENT_ANALYTICS: StudentAnalyticsOverviewData = {
  totalStudents: 3,
  mediaConclusaoTurma: 58.3,
  concluidosTotal: 1,
  naoIniciadosTotal: 1,
  students: [
    {
      id: 'student-1',
      name: 'Alice Cooper',
      email: 'alice@faculdade.edu',
      image: null,
      questoesConcluidas: 4,
      totalQuestoesAtivas: 4,
      porcentagemConcluida: 100,
      porcentagemRestante: 0,
      totalErros: 1,
      acertosDePrimeira: 3,
      ultimaAtividade: '2026-09-20T14:30:00.000Z',
      fases: [
        {
          phaseId: 'phase-1',
          titulo: 'Fase Inicial de Dedução',
          totalQuestoes: 2,
          questoesConcluidas: 2,
          questoes: [
            {
              questionId: 'q-1',
              enunciado: 'Formalize: Se chove, a rua molha',
              topico: 'Condicional',
              tipo: 'formalizacao',
              status: 'de_primeira',
              errosCount: 0,
              tentativasTotal: 1,
              ultimaResposta: 'P → Q',
            },
            {
              questionId: 'q-2',
              enunciado: 'Valore a tabela-verdade de P ∧ Q',
              topico: 'Conjunção',
              tipo: 'tabela_verdade',
              status: 'com_dificuldade',
              errosCount: 1,
              tentativasTotal: 2,
              ultimaResposta: ['V', 'F', 'F', 'F'],
            },
          ],
        },
      ],
    },
    {
      id: 'student-2',
      name: 'Bob Marley',
      email: 'bob@faculdade.edu',
      image: null,
      questoesConcluidas: 3,
      totalQuestoesAtivas: 4,
      porcentagemConcluida: 75,
      porcentagemRestante: 25,
      totalErros: 4,
      acertosDePrimeira: 1,
      ultimaAtividade: '2026-09-20T16:45:00.000Z',
      fases: [
        {
          phaseId: 'phase-1',
          titulo: 'Fase Inicial de Dedução',
          totalQuestoes: 2,
          questoesConcluidas: 1,
          questoes: [
            {
              questionId: 'q-1',
              enunciado: 'Formalize: Se chove, a rua molha',
              topico: 'Condicional',
              tipo: 'formalizacao',
              status: 'de_primeira',
              errosCount: 0,
              tentativasTotal: 1,
              ultimaResposta: 'P → Q',
            },
            {
              questionId: 'q-2',
              enunciado: 'Valore a tabela-verdade de P ∧ Q',
              topico: 'Conjunção',
              tipo: 'tabela_verdade',
              status: 'pendente_com_erros',
              errosCount: 4,
              tentativasTotal: 4,
              ultimaResposta: ['V', 'V', 'F', 'F'],
            },
          ],
        },
      ],
    },
    {
      id: 'student-3',
      name: 'Charlie Brown',
      email: 'charlie@faculdade.edu',
      image: null,
      questoesConcluidas: 0,
      totalQuestoesAtivas: 4,
      porcentagemConcluida: 0,
      porcentagemRestante: 100,
      totalErros: 0,
      acertosDePrimeira: 0,
      ultimaAtividade: null,
      fases: [],
    },
  ],
};

describe('StudentAnalyticsDashboard Interface (SPEC-007 v2.8.0 - TDD Fase Vermelha)', () => {
  it('deve renderizar o título do painel e os cards de KPIs da turma', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    expect(
      screen.getByRole('heading', { name: /analytics dos estudantes|an[aá]lises dos alunos/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText('3')[0]).toBeInTheDocument(); // Total de Estudantes
    expect(screen.getByText(/58\.3%/i)).toBeInTheDocument(); // Média de Conclusão da Turma
  });

  it('deve renderizar a tabela com os estudantes, porcentagem concluída (% Concluído) e porcentagem restante (% Restante)', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    expect(screen.getByText('alice@faculdade.edu')).toBeInTheDocument();
    expect(screen.getByText('Bob Marley')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();

    // Bob Marley: 75% concluído e 25% restante
    expect(screen.getByText(/75%/i)).toBeInTheDocument();
    expect(screen.getByText(/25% restante/i)).toBeInTheDocument();

    // Charlie Brown: 0% concluído e 100% restante
    expect(screen.getByText(/100% restante/i)).toBeInTheDocument();
  });

  it('deve exibir a contagem de repetições / erros cometidos pelo aluno', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    // Bob Marley errou 4 vezes
    expect(screen.getByText(/4 erros|4 repeti[cç][oõ]es/i)).toBeInTheDocument();
  });

  it('NÃO deve calcular nem exibir nenhuma coluna de nota arbitrária para preservar a soberania do professor', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    // Garante que a tabela de estudantes está renderizada
    const table = screen.getByRole('table', { name: /tabela de estudantes|estudantes|alunos/i });
    expect(table).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /^nota$|^grade$|^pontua[cç][aã]o$/i })).not.toBeInTheDocument();
  });

  it('deve permitir buscar estudantes em tempo real por nome ou e-mail', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou e-mail|pesquisar aluno/i);
    expect(searchInput).toBeInTheDocument();

    // Buscar por Alice
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    expect(screen.queryByText('Bob Marley')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('deve permitir filtrar por status (Todos, Em Andamento, 100% Concluído, Não Iniciados)', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    // Filtrar por "Não Iniciados"
    const naoIniciadosTab = screen.getByRole('button', { name: /n[aã]o iniciados/i });
    fireEvent.click(naoIniciadosTab);

    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.queryByText('Alice Cooper')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Marley')).not.toBeInTheDocument();
  });

  it('deve abrir o modal de Raio-X ao clicar no estudante e exibir o detalhamento de fases e questões', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    // Clicar no botão de Raio-X da Alice Cooper
    const aliceRow = screen.getByText('Alice Cooper').closest('tr') || screen.getByText('Alice Cooper').closest('div');
    expect(aliceRow).toBeInTheDocument();

    const raioXBtn = within(aliceRow as HTMLElement).getByRole('button', { name: /raio-x|detalhes|ver/i });
    fireEvent.click(raioXBtn);

    // Modal aberto deve exibir o nome da Alice e a fase
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Fase Inicial de Dedução/i)).toBeInTheDocument();

    // Badges das questões no Raio-X
    expect(screen.getByText(/acertou de primeira/i)).toBeInTheDocument();
    expect(screen.getByText(/conclu[ií]da ap[oó]s 1 erro/i)).toBeInTheDocument();

    // Última resposta submetida no Raio-X
    expect(screen.getByText('P → Q')).toBeInTheDocument();
  });

  it('deve conter botão/link para voltar ao Editor (/editor)', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_STUDENT_ANALYTICS} />);

    const backLink = screen.getByRole('link', { name: /voltar ao editor/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/editor');
  });
});
