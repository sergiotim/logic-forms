/**
 * @file Editor.test.tsx
 * @description Testes de integração da página /editor (TDD)
 *
 * SPEC: editor-spec.md — Seção 5.2 (Testes de Integração - Editor)
 * Cenários cobertos da seção 5.1: Cenários 4, 5, 6, 7, 8, 9, 10, 11, 12
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// O módulo de storage é mockado para controlar o estado inicial de cada teste
jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage');
  return {
    ...actual,
    loadEditorState: jest.fn(),
    saveEditorState: jest.fn(),
  };
});

import EditorPage from '@/app/editor/page';
import { loadEditorState, saveEditorState } from '@/lib/storage';
import type { EditorState } from '@/types';

// --- Fixtures ---

const MOCK_STATE_3_PHASES: EditorState = {
  version: 1,
  updatedAt: '2026-09-10T14:00:00.000Z',
  phases: [
    {
      id: 'f-diag',
      titulo: 'Diagramação',
      icone: 'Network',
      questoes: [
        {
          id: 'q-1',
          tipo: 'diagramacao',
          topico: 'Tópico A',
          enunciado: 'Classifique as frases do argumento',
          frases: [
            { id: 'frase-1', texto: 'Premissa um' },
            { id: 'frase-2', texto: 'Conclusão aqui' },
          ],
          resposta_esperada: { 'frase-1': 'P', 'frase-2': 'C' },
        },
      ],
    },
    {
      id: 'f-tab',
      titulo: 'Tabela-Verdade',
      icone: 'Table2',
      questoes: [],
    },
    {
      id: 'f-form',
      titulo: 'Formalização',
      icone: 'PenLine',
      questoes: [],
    },
  ],
};

const MOCK_STATE_EMPTY: EditorState = {
  version: 1,
  updatedAt: '2026-09-10T14:00:00.000Z',
  phases: [],
};

// Helper para selecionar fase no sidebar
function getSidebarPhase(name: string | RegExp) {
  const sidebar = screen.getByTestId('phase-sidebar');
  return within(sidebar).getByText(name);
}

// --- Setup ---

beforeEach(() => {
  jest.clearAllMocks();
  (loadEditorState as jest.Mock).mockReturnValue(JSON.parse(JSON.stringify(MOCK_STATE_3_PHASES)));
});

// ---------------------------------------------------------------------------
// BLOCO 1 — Renderização Inicial
// ---------------------------------------------------------------------------

describe('Renderização inicial do Editor', () => {
  it('exibe o título "Editor de Conteúdo" no header', () => {
    render(<EditorPage />);
    expect(screen.getByText(/Editor de Conte[uú]do/i)).toBeInTheDocument();
  });

  it('exibe link "Voltar ao Modo Estudo" no header', () => {
    render(<EditorPage />);
    expect(screen.getByRole('link', { name: /Voltar ao Modo Estudo/i })).toBeInTheDocument();
  });

  it('[Cenário 4-base] exibe as 3 fases carregadas do storage no sidebar', () => {
    render(<EditorPage />);
    const sidebar = screen.getByTestId('phase-sidebar');
    expect(within(sidebar).getByText('Diagramação')).toBeInTheDocument();
    expect(within(sidebar).getByText('Tabela-Verdade')).toBeInTheDocument();
    expect(within(sidebar).getByText('Formalização')).toBeInTheDocument();
  });

  it('exibe estado vazio com mensagem quando não há fases', () => {
    (loadEditorState as jest.Mock).mockReturnValue(JSON.parse(JSON.stringify(MOCK_STATE_EMPTY)));
    render(<EditorPage />);
    expect(screen.getAllByText(/Nenhuma fase/i).length).toBeGreaterThanOrEqual(1);
  });

  it('exibe botão "+ Nova Fase" no sidebar', () => {
    render(<EditorPage />);
    expect(screen.getByRole('button', { name: /Nova Fase/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BLOCO 2 — Seleção e Edição de Fase
// ---------------------------------------------------------------------------

describe('Seleção e edição de fase', () => {
  it('seleciona uma fase ao clicar nela no sidebar e exibe sua área de edição', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));
    expect(screen.getByDisplayValue('Diagramação')).toBeInTheDocument();
  });

  it('[Cenário 5] atualiza o título da fase ao editar o campo de nome', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    const tituloInput = screen.getByDisplayValue('Diagramação');
    await userEvent.clear(tituloInput);
    await userEvent.type(tituloInput, 'Nova Diagramação');

    expect(saveEditorState).toHaveBeenCalled();
    expect(screen.getByDisplayValue('Nova Diagramação')).toBeInTheDocument();
  });

  it('exibe as questões da fase selecionada na área principal', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));
    expect(screen.getByText(/Classifique as frases do argumento/i)).toBeInTheDocument();
  });

  it('exibe estado vazio com botão "+ Nova Questão" quando fase não tem questões', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Tabela-Verdade'));
    expect(screen.getByRole('button', { name: /Nova Quest[aã]o/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BLOCO 3 — CRUD de Fases
// ---------------------------------------------------------------------------

describe('CRUD de Fases', () => {
  it('[Cenário 4] cria uma nova fase ao preencher o modal e confirmar', async () => {
    render(<EditorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Nova Fase/i }));

    const nomeInput = await screen.findByPlaceholderText(/Nome da fase/i);
    await userEvent.type(nomeInput, 'Fase de Revisão');

    const confirmarBtn = screen.getByRole('button', { name: /Criar|Confirmar|Salvar/i });
    fireEvent.click(confirmarBtn);

    await waitFor(() => {
      const sidebar = screen.getByTestId('phase-sidebar');
      expect(within(sidebar).getByText('Fase de Revisão')).toBeInTheDocument();
    });
    expect(saveEditorState).toHaveBeenCalled();
  });

  it('fecha o modal sem criar fase ao clicar em Cancelar', async () => {
    render(<EditorPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nova Fase/i }));

    const nomeInput = await screen.findByPlaceholderText(/Nome da fase/i);
    await userEvent.type(nomeInput, 'Fase Fantasma');

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(screen.queryByText('Fase Fantasma')).not.toBeInTheDocument();
    expect(saveEditorState).not.toHaveBeenCalled();
  });

  it('[Cenário 6] exibe modal de confirmação ao excluir fase com questões', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    const excluirFaseBtn = screen.getByRole('button', { name: /Excluir Fase/i });
    fireEvent.click(excluirFaseBtn);

    const modal = screen.getByText(/Tem certeza que deseja excluir a fase/i).closest('div');
    expect(within(modal!).getByText(/quest[aã]o|quest[oõ]es/i)).toBeInTheDocument();
    expect(within(modal!).getByRole('button', { name: /Confirmar|^Excluir$/i })).toBeInTheDocument();
    expect(within(modal!).getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('[Cenário 6] remove a fase do sidebar após confirmar exclusão', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    fireEvent.click(screen.getByRole('button', { name: /Excluir Fase/i }));
    const modal = screen.getByText(/Tem certeza que deseja excluir a fase/i).closest('div');
    fireEvent.click(within(modal!).getByRole('button', { name: /Confirmar|^Excluir$/i }));

    await waitFor(() => {
      const sidebar = screen.getByTestId('phase-sidebar');
      expect(within(sidebar).queryByText('Diagramação')).not.toBeInTheDocument();
    });
    expect(saveEditorState).toHaveBeenCalled();
  });

  it('impede exclusão da última fase restante', () => {
    (loadEditorState as jest.Mock).mockReturnValue({
      ...MOCK_STATE_EMPTY,
      phases: [{ id: 'f-unica', titulo: 'Única', icone: 'Network', questoes: [] }],
    });
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Única'));

    const excluirFaseBtn = screen.getByRole('button', { name: /Excluir Fase/i });
    fireEvent.click(excluirFaseBtn);

    expect(screen.getByText(/pelo menos 1 fase|n[aã]o [eé] poss[ií]vel excluir/i)).toBeInTheDocument();
    expect(saveEditorState).not.toHaveBeenCalled();
  });

  it('[Cenário 7] exibe os handles de arrasto para reordenar fases no sidebar', () => {
    render(<EditorPage />);
    const handles = screen.getAllByTitle(/Arraste para reordenar a fase/i);
    expect(handles).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 4 — CRUD de Questões
// ---------------------------------------------------------------------------

describe('CRUD de Questões', () => {
  it('[Cenário 8] abre o modal de criação ao clicar em "+ Nova Questão"', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Tabela-Verdade'));
    fireEvent.click(screen.getByRole('button', { name: /Nova Quest[aã]o/i }));

    await screen.findByText(/Escolha o tipo de quest[aã]o|Tipo de Quest[aã]o/i);
    expect(screen.getByTestId('type-btn-diagramacao')).toBeInTheDocument();
    expect(screen.getByTestId('type-btn-tabela_verdade')).toBeInTheDocument();
    expect(screen.getByTestId('type-btn-formalizacao')).toBeInTheDocument();
  });

  it('[Cenário 8] exibe formulário de Diagramação ao selecionar esse tipo', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Tabela-Verdade'));
    fireEvent.click(screen.getByRole('button', { name: /Nova Quest[aã]o/i }));

    await screen.findByText(/Escolha o tipo de quest[aã]o|Tipo de Quest[aã]o/i);
    fireEvent.click(screen.getByTestId('type-btn-diagramacao'));

    expect(screen.getByLabelText(/Enunciado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adicionar Frase/i })).toBeInTheDocument();
  });

  it('[Cenário 9] auto-gera linhas da tabela ao informar fórmula para Tabela-Verdade', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Tabela-Verdade'));
    fireEvent.click(screen.getByRole('button', { name: /Nova Quest[aã]o/i }));

    await screen.findByText(/Escolha o tipo de quest[aã]o|Tipo de Quest[aã]o/i);
    fireEvent.click(screen.getByTestId('type-btn-tabela_verdade'));

    const expressaoInput = await screen.findByPlaceholderText(/Ex: \(P ∨ Q\) ∧ \(~R\)|Ex: P ∧ Q/i);
    await userEvent.type(expressaoInput, 'P ∧ Q');

    // Com 2 variáveis (P e Q), devem aparecer pelo menos 4 linhas (2^2)
    await waitFor(() => {
      const linhas = screen.getAllByRole('row');
      expect(linhas.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('[Cenário 11] impede salvar questão de Formalização sem resposta_esperada', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Formalização'));
    fireEvent.click(screen.getByRole('button', { name: /Nova Quest[aã]o/i }));

    await screen.findByText(/Escolha o tipo de quest[aã]o|Tipo de Quest[aã]o/i);
    fireEvent.click(screen.getByTestId('type-btn-formalizacao'));

    const enunciadoInput = await screen.findByLabelText(/Enunciado/i);
    await userEvent.type(enunciadoInput, 'Formalize a sentença');

    // Deixa resposta_esperada vazia e tenta salvar
    const salvarBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(salvarBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/resposta esperada [eé] obrigat[oó]ria|campo obrigat[oó]rio/i),
      ).toBeInTheDocument();
    });
    expect(saveEditorState).not.toHaveBeenCalled();
  });

  it('[Cenário 10] abre modal de edição preenchido ao clicar em "Editar" em uma questão', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    const editarBtn = screen.getByRole('button', { name: /Editar/i });
    fireEvent.click(editarBtn);

    const enunciadoInput = await screen.findByDisplayValue(/Classifique as frases do argumento/i);
    expect(enunciadoInput).toBeInTheDocument();
  });

  it('[Cenário 10] salva alterações feitas em uma questão existente', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));

    const enunciadoInput = await screen.findByDisplayValue(/Classifique as frases do argumento/i);
    await userEvent.clear(enunciadoInput);
    await userEvent.type(enunciadoInput, 'Enunciado atualizado pelo professor');

    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() => {
      expect(screen.getByText('Enunciado atualizado pelo professor')).toBeInTheDocument();
    });
    expect(saveEditorState).toHaveBeenCalled();
  });

  it('exibe modal de confirmação ao clicar em "Excluir" em uma questão', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    const excluirQBtn = screen.getByRole('button', { name: /^Excluir$/i });
    fireEvent.click(excluirQBtn);

    const confirmModal = screen.getByText(/Excluir quest[aã]o/i).closest('div');
    expect(confirmModal).toBeInTheDocument();
    expect(within(confirmModal!).getByRole('button', { name: /Confirmar|^Excluir$/i })).toBeInTheDocument();
  });

  it('remove questão da lista após confirmar exclusão', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/i }));
    const confirmModal = screen.getByText(/Excluir quest[aã]o/i).closest('div');
    fireEvent.click(within(confirmModal!).getByRole('button', { name: /Confirmar|^Excluir$/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Classifique as frases do argumento/i)).not.toBeInTheDocument();
    });
    expect(saveEditorState).toHaveBeenCalled();
  });

  it('descarta alterações e fecha o modal ao clicar em Cancelar no formulário', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));

    const enunciadoInput = await screen.findByDisplayValue(/Classifique as frases do argumento/i);
    await userEvent.clear(enunciadoInput);
    await userEvent.type(enunciadoInput, 'Texto que não deve ser salvo');

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(screen.queryByText('Texto que não deve ser salvo')).not.toBeInTheDocument();
    expect(screen.getByText(/Classifique as frases do argumento/i)).toBeInTheDocument();
    expect(saveEditorState).not.toHaveBeenCalled();
  });

  it('exibe handles de arrasto para reordenar questões na lista da fase', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));
    const handles = screen.getAllByTitle(/Arraste para reordenar a questão/i);
    expect(handles.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 5 — Preview ao Vivo
// ---------------------------------------------------------------------------

describe('Preview ao vivo da questão', () => {
  it('exibe o painel de preview ao abrir o formulário de edição', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));

    await screen.findByDisplayValue(/Classifique as frases do argumento/i);
    expect(screen.getByText('Preview do Aluno')).toBeInTheDocument();
    expect(screen.getByTestId('question-preview')).toBeInTheDocument();
  });

  it('atualiza o preview em tempo real ao digitar no enunciado', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));
    fireEvent.click(screen.getByRole('button', { name: /Nova Quest[aã]o/i }));

    await screen.findByText(/Escolha o tipo de quest[aã]o|Tipo de Quest[aã]o/i);
    fireEvent.click(screen.getByTestId('type-btn-diagramacao'));

    const enunciadoInput = await screen.findByLabelText(/Enunciado/i);
    await userEvent.type(enunciadoInput, 'Meu novo enunciado de teste');

    await waitFor(() => {
      const preview = screen.getByTestId('question-preview');
      expect(within(preview).getByText(/Meu novo enunciado de teste/i)).toBeInTheDocument();
    });
  });

  it('alterna entre as guias de Editor e Visão do Aluno', async () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));

    const editorTab = await screen.findByRole('tab', { name: /Editor/i });
    const previewTab = screen.getByRole('tab', { name: /Visão do Aluno/i });

    expect(editorTab).toHaveAttribute('aria-selected', 'true');
    expect(previewTab).toHaveAttribute('aria-selected', 'false');

    // Alterna para Visão do Aluno
    fireEvent.click(previewTab);
    expect(previewTab).toHaveAttribute('aria-selected', 'true');
    expect(editorTab).toHaveAttribute('aria-selected', 'false');

    // Retorna para o Editor
    fireEvent.click(editorTab);
    expect(editorTab).toHaveAttribute('aria-selected', 'true');
    expect(previewTab).toHaveAttribute('aria-selected', 'false');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 6 — Compartilhamento de Fases (SPEC-005: Exportar e Importar)
// ---------------------------------------------------------------------------

describe('[SPEC-005] Exportação e Importação de Fases na UI', () => {
  beforeAll(() => {
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = jest.fn();
    }
  });

  it('exibe o botão de Exportar Fase no cabeçalho da fase selecionada', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    const exportBtn = screen.getByRole('button', { name: /Exportar Fase/i });
    expect(exportBtn).toBeInTheDocument();
  });

  it('exibe o botão de Importar na barra lateral de fases', () => {
    render(<EditorPage />);
    const importBtn = screen.getByRole('button', { name: /Importar/i });
    expect(importBtn).toBeInTheDocument();
  });

  it('dispara a exportação e gera feedback de sucesso ao clicar em Exportar Fase', () => {
    render(<EditorPage />);
    fireEvent.click(getSidebarPhase('Diagramação'));

    const exportBtn = screen.getByRole('button', { name: /Exportar Fase/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText(/Fase "Diagramação" exportada com sucesso!/i)).toBeInTheDocument();
  });
});

