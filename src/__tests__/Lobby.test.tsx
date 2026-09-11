/**
 * @file Lobby.test.tsx
 * @description Testes de integração do Lobby — Modo Estudo (TDD)
 *
 * SPEC: editor-spec.md — Seção 5.1 (Cenários 1, 2, 3) e lobby-spec.md
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';

// Mock do módulo de storage para controle total nos testes
jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage');
  return {
    ...actual,
    loadEditorState: jest.fn(),
  };
});

import Home from '@/app/page';
import { loadEditorState } from '@/lib/storage';
import type { EditorState } from '@/types';

// --- Fixtures ---

const MOCK_3_PHASES: EditorState = {
  version: 1,
  updatedAt: '2026-09-10T14:00:00.000Z',
  phases: [
    {
      id: 'fase-diagramacao',
      titulo: 'Diagramação',
      icone: 'Network',
      questoes: [
        {
          id: 'q1',
          tipo: 'diagramacao',
          topico: 'Estrutura de um Argumento',
          enunciado: 'Analise o argumento disjuntivo abaixo e classifique suas partes estruturais',
          frases: [
            { id: 'f1', texto: 'Hoje é segunda-feira ou terça-feira.' },
            { id: 'f2', texto: 'Hoje não é segunda-feira.' },
            { id: 'f3', texto: 'Portanto, hoje é terça-feira.' },
          ],
          resposta_esperada: { f1: 'P', f2: 'P', f3: 'C' },
        },
        {
          id: 'q2',
          tipo: 'diagramacao',
          topico: 'Estrutura de um Argumento',
          enunciado: 'Identifique premissas e conclusão no argumento hipotético',
          frases: [
            { id: 'f1', texto: 'Se chove, a rua fica molhada.' },
            { id: 'f2', texto: 'A rua ficou molhada.' },
            { id: 'f3', texto: 'Logo, choveu.' },
          ],
          resposta_esperada: { f1: 'P', f2: 'P', f3: 'C' },
        },
      ],
    },
    {
      id: 'fase-tabela',
      titulo: 'Tabela-Verdade',
      icone: 'Table2',
      questoes: [
        {
          id: 'q3',
          tipo: 'tabela_verdade',
          topico: 'Cálculo Proposicional',
          enunciado: 'Preencha a coluna final para a Conjunção (P ∧ Q)',
          variaveis: ['P', 'Q'],
          linhas: [
            { id: 'l1', valores: ['V', 'V'] },
            { id: 'l2', valores: ['V', 'F'] },
            { id: 'l3', valores: ['F', 'V'] },
            { id: 'l4', valores: ['F', 'F'] },
          ],
          expressao: 'P ∧ Q',
          resposta_esperada: ['V', 'F', 'F', 'F'],
        },
        {
          id: 'q4',
          tipo: 'tabela_verdade',
          topico: 'Cálculo Proposicional',
          enunciado: 'Preencha a coluna final para a Disjunção (P ∨ Q)',
          variaveis: ['P', 'Q'],
          linhas: [
            { id: 'l1', valores: ['V', 'V'] },
            { id: 'l2', valores: ['V', 'F'] },
            { id: 'l3', valores: ['F', 'V'] },
            { id: 'l4', valores: ['F', 'F'] },
          ],
          expressao: 'P ∨ Q',
          resposta_esperada: ['V', 'V', 'V', 'F'],
        },
      ],
    },
    {
      id: 'fase-formalizacao',
      titulo: 'Formalização',
      icone: 'PenLine',
      questoes: [
        {
          id: 'q5',
          tipo: 'formalizacao',
          topico: 'Lógica de Predicados',
          enunciado: 'Formalize: Todo estudante aprende.',
          dicas: ['E: é estudante', 'A: aprende'],
          teclado_virtual: ['~', '∧', '∨', '→'],
          resposta_esperada: '∀x(Ex→Ax)',
        },
        {
          id: 'q6',
          tipo: 'formalizacao',
          topico: 'Lógica de Predicados',
          enunciado: 'Formalize: Existe um estudante que aprende.',
          dicas: ['E: é estudante', 'A: aprende'],
          teclado_virtual: ['~', '∧', '∨', '→'],
          resposta_esperada: '∃x(Ex∧Ax)',
        },
      ],
    },
  ],
};

// --- Setup ---

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (loadEditorState as jest.Mock).mockReturnValue(structuredClone(MOCK_3_PHASES));
});

// ---------------------------------------------------------------------------
// BLOCO 1 — Lobby — Renderização e Seed
// ---------------------------------------------------------------------------

describe('Lobby — Renderização Inicial', () => {
  it('[Cenário 1] exibe o Lobby com as 3 fases carregadas do localStorage', () => {
    render(<Home />);
    expect(screen.getByText(/Fase 1: Diagramação/i)).toBeInTheDocument();
    expect(screen.getByText(/Fase 2: Tabela-Verdade/i)).toBeInTheDocument();
    expect(screen.getByText(/Fase 3: Formalização/i)).toBeInTheDocument();
  });

  it('[Cenário 1] exibe 3 botões "Iniciar" no estado inicial', () => {
    render(<Home />);
    const iniciarBtns = screen.getAllByRole('button', { name: /Iniciar/i });
    expect(iniciarBtns).toHaveLength(3);
  });

  it('[Cenário 1] NÃO exibe handles ou instruções de drag-and-drop para o aluno', () => {
    render(<Home />);
    expect(screen.queryByText(/Arraste os cart/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reordenar/i)).not.toBeInTheDocument();
  });

  it('[Cenário 1] exibe status "0/2 concluídas" para cada fase inicialmente', () => {
    render(<Home />);
    const statuses = screen.getAllByText(/0\/2 concluídas/i);
    expect(statuses).toHaveLength(3);
  });

  it('[Cenário 2] chama loadEditorState para buscar os dados do storage ao montar', () => {
    render(<Home />);
    expect(loadEditorState).toHaveBeenCalledTimes(1);
  });

  it('[Cenário 3] exibe link ou botão para o "Modo Editor" no header ou rodapé', () => {
    render(<Home />);
    const editorLink = screen.getByRole('link', { name: /Editor|Admin/i });
    expect(editorLink).toHaveAttribute('href', '/editor');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 2 — Lobby — Estado Vazio
// ---------------------------------------------------------------------------

describe('Lobby — Estado Vazio', () => {
  it('[Cenário estado vazio] exibe mensagem quando não há fases no storage', () => {
    (loadEditorState as jest.Mock).mockReturnValue({
      version: 1,
      updatedAt: '2026-09-10T14:00:00.000Z',
      phases: [],
    });
    render(<Home />);
    expect(screen.getByText(/Nenhuma fase disponível|Acesse o Editor/i)).toBeInTheDocument();
  });

  it('[Cenário fase sem questões] exibe botão desabilitado para fase sem questões', () => {
    (loadEditorState as jest.Mock).mockReturnValue({
      version: 1,
      updatedAt: '2026-09-10T14:00:00.000Z',
      phases: [{ id: 'f1', titulo: 'Fase Vazia', icone: 'Network', questoes: [] }],
    });
    render(<Home />);
    const btn = screen.getByRole('button', { name: /Sem questões/i });
    expect(btn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// BLOCO 3 — Navegação Lobby -> Fase
// ---------------------------------------------------------------------------

describe('Navegação Lobby -> Fase', () => {
  it('navega para a Fase 1 ao clicar em Iniciar e exibe a primeira questão', () => {
    render(<Home />);

    const phase1Card = screen.getByText(/Fase 1: Diagramação/i).closest('[data-testid="phase-card"]');
    const iniciarBtn = phase1Card
      ? within(phase1Card as HTMLElement).getByRole('button', { name: /Iniciar/i })
      : screen.getAllByRole('button', { name: /Iniciar/i })[0];

    fireEvent.click(iniciarBtn);

    expect(screen.queryByText(/Fase 1: Diagramação/i)).not.toBeInTheDocument(); // saiu do lobby
    expect(screen.getByText(/Fase 1: Questão 1\/2/i)).toBeInTheDocument();
    expect(screen.getByText(/Analise o argumento disjuntivo/i)).toBeInTheDocument();
  });

  it('exibe a barra de progresso correta ao iniciar uma fase', () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole('button', { name: /Iniciar/i })[0]);
    expect(screen.getByText(/Questão 1\/2/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BLOCO 4 — Fluxo Completo de uma Fase
// ---------------------------------------------------------------------------

describe('Fluxo completo de uma Fase (Diagramação)', () => {
  it('conclui a Fase 1 e retorna ao Lobby com status atualizado', () => {
    render(<Home />);

    // Inicia Fase 1
    fireEvent.click(screen.getAllByRole('button', { name: /Iniciar/i })[0]);

    // Questão 1: f1=P, f2=P, f3=C
    const premissas = screen.getAllByRole('button', { name: /Premissa/i });
    const conclusoes = screen.getAllByRole('button', { name: /Conclusão/i });
    fireEvent.click(premissas[0]);
    fireEvent.click(premissas[1]);
    fireEvent.click(conclusoes[2]);
    fireEvent.click(screen.getByRole('button', { name: /Validar Resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /Próxima Questão/i }));

    // Questão 2: f1=P, f2=P, f3=C
    const premissasQ2 = screen.getAllByRole('button', { name: /Premissa/i });
    const conclusoesQ2 = screen.getAllByRole('button', { name: /Conclusão/i });
    fireEvent.click(premissasQ2[0]);
    fireEvent.click(premissasQ2[1]);
    fireEvent.click(conclusoesQ2[2]);
    fireEvent.click(screen.getByRole('button', { name: /Validar Resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /Próxima Questão/i }));

    // Tela de fase concluída
    expect(screen.getByText(/Fase Concluída/i)).toBeInTheDocument();

    // Volta ao Lobby
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao Lobby/i }));

    // Fase 1 deve mostrar "Concluído" e botão "Refazer"
    const phase1Card = screen.getByText(/Fase 1: Diagramação/i).closest('div');
    expect(phase1Card?.textContent).toMatch(/Concluído/i);
    const refazerBtn = within(phase1Card as HTMLElement).getByRole('button', { name: /Refazer/i });
    expect(refazerBtn).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BLOCO 5 — Modal de Saída
// ---------------------------------------------------------------------------

describe('Modal de saída durante a fase', () => {
  it('exibe modal de confirmação ao clicar no botão de sair', () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole('button', { name: /Iniciar/i })[1]); // Fase 2

    const fecharBtn = screen.getByRole('button', { name: /Fechar/i });
    fireEvent.click(fecharBtn);

    expect(screen.getByText(/Tem certeza de que deseja sair/i)).toBeInTheDocument();
  });

  it('volta para a fase ao clicar em "Continuar jogando"', () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole('button', { name: /Iniciar/i })[1]);

    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar jogando/i }));

    expect(screen.queryByText(/Tem certeza de que deseja sair/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Questão 1\/2/i)).toBeInTheDocument();
  });

  it('retorna ao Lobby ao confirmar saída', () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole('button', { name: /Iniciar/i })[1]);

    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/i }));

    expect(screen.getByText(/Fase 1:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fase 2:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fase 3:/i)).toBeInTheDocument();
  });
});
