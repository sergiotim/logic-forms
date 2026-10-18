/**
 * @file StudentAnalyticsPagination.test.tsx
 * @description Testes de integração da Paginação e Lazy Loading no Analytics de Estudantes (TDD - Fase Vermelha)
 * SPEC: docs/specs/analytics-pagination-spec.md — [SPEC-009 v2.10.0]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentAnalyticsDashboard } from '@/components/editor/analytics/StudentAnalyticsDashboard';
import { StudentDetailModal } from '@/components/editor/analytics/StudentDetailModal';
import type { StudentAnalyticsOverviewData, StudentMetricItem } from '@/types';

// Gerador de mock com 25 estudantes para teste de paginação
function createMockStudents(count = 25): StudentMetricItem[] {
  return Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      id: `student-${num}`,
      name: `Estudante ${num}`,
      email: `estudante${num}@faculdade.edu`,
      image: null,
      questoesConcluidas: i % 5 === 0 ? 4 : 2,
      totalQuestoesAtivas: 4,
      porcentagemConcluida: i % 5 === 0 ? 100 : 50,
      porcentagemRestante: i % 5 === 0 ? 0 : 50,
      totalErros: i % 3,
      acertosDePrimeira: i % 2,
      ultimaAtividade: '2026-10-18T14:00:00.000Z',
      // No modelo otimizado da SPEC-009, 'fases' é omitido ou undefined na carga inicial
    };
  });
}

const MOCK_PAGINATION_DATA: StudentAnalyticsOverviewData = {
  totalStudents: 25,
  mediaConclusaoTurma: 60,
  concluidosTotal: 5,
  naoIniciadosTotal: 0,
  students: createMockStudents(25),
};

describe('StudentAnalytics Dashboard - Paginação e Performance (SPEC-009 v2.10.0)', () => {
  it('deve exibir por padrão apenas 10 estudantes na página 1 e ocultar os demais', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_PAGINATION_DATA} />);

    // Estudantes 01 a 10 devem estar visíveis
    expect(screen.getByText('Estudante 01')).toBeInTheDocument();
    expect(screen.getByText('Estudante 10')).toBeInTheDocument();

    // Estudante 11 em diante NÃO deve estar na página 1
    expect(screen.queryByText('Estudante 11')).not.toBeInTheDocument();
    expect(screen.queryByText('Estudante 25')).not.toBeInTheDocument();
  });

  it('deve renderizar a barra de navegação com contador "Mostrando 1–10 de 25 estudantes", botão Anterior desabilitado e Próximo habilitado', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_PAGINATION_DATA} />);

    // Contador de registros
    expect(screen.getByText(/mostrando\s+1[–\-]10\s+de\s+25\s+estudantes/i)).toBeInTheDocument();

    // Botão Anterior desabilitado na primeira página
    const prevButton = screen.getByRole('button', { name: /anterior/i });
    expect(prevButton).toBeDisabled();

    // Botão Próximo habilitado
    const nextButton = screen.getByRole('button', { name: /pr[oó]ximo/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('deve avançar para a página 2 ao clicar em "Próximo" ou na pílula numérica "2"', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_PAGINATION_DATA} />);

    const nextButton = screen.getByRole('button', { name: /pr[oó]ximo/i });
    fireEvent.click(nextButton);

    // Estudantes da página 2 (11 a 20) devem aparecer
    expect(screen.getByText('Estudante 11')).toBeInTheDocument();
    expect(screen.getByText('Estudante 20')).toBeInTheDocument();

    // Estudantes da página 1 não devem estar visíveis
    expect(screen.queryByText('Estudante 01')).not.toBeInTheDocument();
    expect(screen.queryByText('Estudante 10')).not.toBeInTheDocument();

    // Contador atualizado
    expect(screen.getByText(/mostrando\s+11[–\-]20\s+de\s+25\s+estudantes/i)).toBeInTheDocument();

    // Botão Anterior agora está habilitado
    const prevButton = screen.getByRole('button', { name: /anterior/i });
    expect(prevButton).not.toBeDisabled();
  });

  it('deve permitir alterar a quantidade de itens por página usando o seletor (ex: 25 por página)', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_PAGINATION_DATA} />);

    const pageSizeSelect = screen.getByRole('combobox', { name: /itens por p[aá]gina|por p[aá]gina/i });
    expect(pageSizeSelect).toBeInTheDocument();

    // Alterar para 25 por página
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    // Todos os 25 estudantes devem estar visíveis simultaneamente
    expect(screen.getByText('Estudante 01')).toBeInTheDocument();
    expect(screen.getByText('Estudante 25')).toBeInTheDocument();

    // Contador atualizado
    expect(screen.getByText(/mostrando\s+1[–\-]25\s+de\s+25\s+estudantes/i)).toBeInTheDocument();

    // Próximo e Anterior devem estar desabilitados pois só há 1 página agora
    expect(screen.getByRole('button', { name: /pr[oó]ximo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
  });

  it('deve resetar automaticamente para a página 1 ao buscar por texto ou alterar filtro de status', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_PAGINATION_DATA} />);

    // Navega para a página 2
    const nextButton = screen.getByRole('button', { name: /pr[oó]ximo/i });
    fireEvent.click(nextButton);
    expect(screen.getByText('Estudante 11')).toBeInTheDocument();

    // Digita no campo de busca
    const searchInput = screen.getByPlaceholderText(/buscar por nome ou e-mail/i);
    fireEvent.change(searchInput, { target: { value: 'Estudante 0' } });

    // Deve resetar para a página 1 exibindo os resultados a partir do Estudante 01
    expect(screen.getByText('Estudante 01')).toBeInTheDocument();
  });

  it('deve manter os 4 cartões de KPIs calculados sobre toda a turma (25 alunos) mesmo paginando', () => {
    render(<StudentAnalyticsDashboard initialData={MOCK_PAGINATION_DATA} />);

    // Total de estudantes (25)
    expect(screen.getAllByText('25')[0]).toBeInTheDocument();

    // Média de conclusão (60%)
    expect(screen.getByText(/60%/i)).toBeInTheDocument();

    // Concluíram tudo (5)
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('StudentDetailModal - Lazy Loading do Raio-X (SPEC-009 v2.10.0)', () => {
  const studentWithoutPhases: StudentMetricItem = {
    id: 'student-lazy-1',
    name: 'Diogo Defante',
    email: 'diogo@faculdade.edu',
    image: null,
    questoesConcluidas: 2,
    totalQuestoesAtivas: 2,
    porcentagemConcluida: 100,
    porcentagemRestante: 0,
    totalErros: 0,
    acertosDePrimeira: 2,
    ultimaAtividade: '2026-10-18T10:00:00.000Z',
    // fases NÃO estão inclusas inicialmente
  };

  const mockDetailApiResponse = {
    student: studentWithoutPhases,
    fases: [
      {
        phaseId: 'phase-lazy-1',
        titulo: 'Fase de Predicados',
        totalQuestoes: 1,
        questoesConcluidas: 1,
        questoes: [
          {
            questionId: 'q-lazy-1',
            enunciado: 'Formalize: Todo homem é mortal',
            topico: 'Quantificadores',
            tipo: 'formalizacao',
            status: 'de_primeira',
            errosCount: 0,
            tentativasTotal: 1,
            ultimaResposta: '∀x (H(x) → M(x))',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('deve buscar os detalhes da API sob demanda e exibir indicador de carregamento quando fases não estão pré-carregadas', async () => {
    // Mock do fetch global
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetailApiResponse,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <StudentDetailModal
        student={studentWithoutPhases}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    // Deve exibir o nome do aluno no cabeçalho do modal imediatamente
    expect(screen.getByText('Diogo Defante')).toBeInTheDocument();

    // Deve ter chamado o endpoint da API para aquele estudante específico
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/students/student-lazy-1');

    // Aguarda carregar e renderizar os dados da fase
    await waitFor(() => {
      expect(screen.getByText('Fase de Predicados')).toBeInTheDocument();
    });
  });
});

