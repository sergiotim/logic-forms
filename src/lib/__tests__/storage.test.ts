/**
 * @file storage.test.ts
 * @description Testes unitarios do modulo src/lib/storage.ts (TDD)
 * SPEC: editor-spec.md — Secao 3.4 e 5.2
 */

import {
  loadEditorState,
  saveEditorState,
  resetToDefaults,
  createPhase,
  deletePhase,
  updatePhase,
  reorderPhases,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  reorderQuestions,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
} from '@/lib/storage';
import type { EditorState, Phase } from '@/types';

// --- Helpers de Fixtures ---

function makePhase(overrides: Partial<Phase> = {}): Phase {
  return {
    id: 'fase-test-1',
    titulo: 'Fase de Teste',
    icone: 'Network',
    questoes: [],
    ...overrides,
  };
}

function makeValidEditorState(overrides: Partial<EditorState> = {}): EditorState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    updatedAt: '2026-09-10T14:00:00.000Z',
    phases: [makePhase()],
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// BLOCO 1 — loadEditorState
// ---------------------------------------------------------------------------

describe('loadEditorState()', () => {
  it('retorna seed padrao com 3 fases quando localStorage esta vazio', () => {
    const state = loadEditorState();
    expect(state.phases).toHaveLength(3);
    expect(state.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.updatedAt).toBeDefined();
  });

  it('os titulos das fases seed correspondem as fases padrao do projeto', () => {
    const state = loadEditorState();
    const titulos = state.phases.map((p) => p.titulo);
    expect(titulos).toContain('Diagramação');
    expect(titulos).toContain('Tabela-Verdade');
    expect(titulos).toContain('Formalização');
  });

  it('o seed padrao contem questoes em cada fase', () => {
    const state = loadEditorState();
    state.phases.forEach((phase) => {
      expect(phase.questoes.length).toBeGreaterThan(0);
    });
  });

  it('persiste o seed automaticamente no localStorage apos o primeiro carregamento', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    loadEditorState();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('retorna o estado salvo quando localStorage contem dados validos', () => {
    const saved = makeValidEditorState({ phases: [makePhase({ titulo: 'Fase Salva' })] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const state = loadEditorState();
    expect(state.phases).toHaveLength(1);
    expect(state.phases[0].titulo).toBe('Fase Salva');
  });

  it('retorna seed padrao e nao lanca erro quando JSON no localStorage esta corrompido', () => {
    localStorage.setItem(STORAGE_KEY, 'json-invalido-{{{{');
    expect(() => loadEditorState()).not.toThrow();
    const state = loadEditorState();
    expect(state.phases.length).toBeGreaterThan(0);
  });

  it('executa migracao de schema quando version do storage e diferente da CURRENT_SCHEMA_VERSION', () => {
    const oldState = { version: 0, updatedAt: '2026-01-01T00:00:00.000Z', phases: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldState));
    const state = loadEditorState();
    expect(state.version).toBe(CURRENT_SCHEMA_VERSION);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 2 — saveEditorState
// ---------------------------------------------------------------------------

describe('saveEditorState()', () => {
  it('persiste o estado no localStorage com a chave correta', () => {
    const state = makeValidEditorState();
    saveEditorState(state);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.phases[0].titulo).toBe('Fase de Teste');
  });

  it('atualiza o campo updatedAt ao salvar', () => {
    const state = makeValidEditorState({ updatedAt: '2020-01-01T00:00:00.000Z' });
    saveEditorState(state);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 3 — resetToDefaults
// ---------------------------------------------------------------------------

describe('resetToDefaults()', () => {
  it('retorna um EditorState com as 3 fases padrao do projeto', () => {
    const state = resetToDefaults();
    expect(state.phases).toHaveLength(3);
  });

  it('sobrescreve o localStorage com os dados padrao', () => {
    const customState = makeValidEditorState({ phases: [makePhase({ titulo: 'Customizada' })] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customState));
    resetToDefaults();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const titulos = stored.phases.map((p: Phase) => p.titulo);
    expect(titulos).not.toContain('Customizada');
    expect(titulos).toContain('Diagramação');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 4 — createPhase
// ---------------------------------------------------------------------------

describe('createPhase()', () => {
  it('cria uma fase com o titulo e icone informados', () => {
    const phase = createPhase('Nova Fase', 'Brain');
    expect(phase.titulo).toBe('Nova Fase');
    expect(phase.icone).toBe('Brain');
  });

  it('cria uma fase com array de questoes vazio', () => {
    const phase = createPhase('Vazia', 'Target');
    expect(phase.questoes).toEqual([]);
  });

  it('gera um id unico (UUID) a cada chamada', () => {
    const p1 = createPhase('Fase A', 'Network');
    const p2 = createPhase('Fase B', 'Network');
    expect(p1.id).toBeDefined();
    expect(p2.id).toBeDefined();
    expect(p1.id).not.toBe(p2.id);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 5 — deletePhase
// ---------------------------------------------------------------------------

describe('deletePhase()', () => {
  it('remove a fase pelo id e retorna novo estado', () => {
    const phase1 = makePhase({ id: 'f1', titulo: 'Fase 1' });
    const phase2 = makePhase({ id: 'f2', titulo: 'Fase 2' });
    const state = makeValidEditorState({ phases: [phase1, phase2] });
    const next = deletePhase(state, 'f1');
    expect(next.phases).toHaveLength(1);
    expect(next.phases[0].id).toBe('f2');
  });

  it('nao muta o estado original (imutabilidade)', () => {
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1' })] });
    const next = deletePhase(state, 'f1');
    expect(state.phases).toHaveLength(1);
    expect(next.phases).toHaveLength(0);
  });

  it('retorna estado inalterado quando o id nao existe', () => {
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1' })] });
    const next = deletePhase(state, 'id-inexistente');
    expect(next.phases).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 6 — updatePhase
// ---------------------------------------------------------------------------

describe('updatePhase()', () => {
  it('atualiza os campos da fase com o id correspondente', () => {
    const phase = makePhase({ id: 'f1', titulo: 'Antigo' });
    const state = makeValidEditorState({ phases: [phase] });
    const updated = { ...phase, titulo: 'Novo Titulo', icone: 'BookOpen' as const };
    const next = updatePhase(state, updated);
    expect(next.phases[0].titulo).toBe('Novo Titulo');
    expect(next.phases[0].icone).toBe('BookOpen');
  });

  it('nao altera outras fases ao atualizar uma', () => {
    const phase1 = makePhase({ id: 'f1', titulo: 'Fase 1' });
    const phase2 = makePhase({ id: 'f2', titulo: 'Fase 2' });
    const state = makeValidEditorState({ phases: [phase1, phase2] });
    const updated = { ...phase1, titulo: 'Fase 1 Editada' };
    const next = updatePhase(state, updated);
    expect(next.phases[1].titulo).toBe('Fase 2');
  });

  it('nao muta o estado original', () => {
    const phase = makePhase({ id: 'f1', titulo: 'Original' });
    const state = makeValidEditorState({ phases: [phase] });
    updatePhase(state, { ...phase, titulo: 'Alterado' });
    expect(state.phases[0].titulo).toBe('Original');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 7 — reorderPhases
// ---------------------------------------------------------------------------

describe('reorderPhases()', () => {
  it('move a fase do indice 2 para o indice 0', () => {
    const p1 = makePhase({ id: 'f1' });
    const p2 = makePhase({ id: 'f2' });
    const p3 = makePhase({ id: 'f3' });
    const state = makeValidEditorState({ phases: [p1, p2, p3] });
    const next = reorderPhases(state, 2, 0);
    expect(next.phases[0].id).toBe('f3');
    expect(next.phases[1].id).toBe('f1');
    expect(next.phases[2].id).toBe('f2');
  });

  it('mantem o comprimento total apos reordenacao', () => {
    const state = makeValidEditorState({
      phases: [makePhase({ id: 'f1' }), makePhase({ id: 'f2' }), makePhase({ id: 'f3' })],
    });
    const next = reorderPhases(state, 0, 2);
    expect(next.phases).toHaveLength(3);
  });

  it('nao muta o estado original', () => {
    const state = makeValidEditorState({
      phases: [makePhase({ id: 'f1' }), makePhase({ id: 'f2' })],
    });
    reorderPhases(state, 0, 1);
    expect(state.phases[0].id).toBe('f1');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 8 — createQuestion
// ---------------------------------------------------------------------------

describe('createQuestion()', () => {
  it('cria uma questao de diagramacao com campos padrao validos', () => {
    const q = createQuestion('diagramacao');
    expect(q.tipo).toBe('diagramacao');
    expect(q.id).toBeDefined();
    if (q.tipo === 'diagramacao') {
      expect(Array.isArray(q.frases)).toBe(true);
      expect(q.frases.length).toBeGreaterThanOrEqual(2);
      expect(q.resposta_esperada).toBeDefined();
    }
  });

  it('cria uma questao de tabela_verdade com campos padrao validos', () => {
    const q = createQuestion('tabela_verdade');
    expect(q.tipo).toBe('tabela_verdade');
    if (q.tipo === 'tabela_verdade') {
      expect(Array.isArray(q.variaveis)).toBe(true);
      expect(Array.isArray(q.linhas)).toBe(true);
      expect(typeof q.expressao).toBe('string');
    }
  });

  it('cria uma questao de formalizacao com campos padrao validos', () => {
    const q = createQuestion('formalizacao');
    expect(q.tipo).toBe('formalizacao');
    if (q.tipo === 'formalizacao') {
      expect(Array.isArray(q.dicas)).toBe(true);
      expect(Array.isArray(q.teclado_virtual)).toBe(true);
    }
  });

  it('gera ids unicos a cada chamada', () => {
    const q1 = createQuestion('diagramacao');
    const q2 = createQuestion('diagramacao');
    expect(q1.id).not.toBe(q2.id);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 9 — deleteQuestion
// ---------------------------------------------------------------------------

describe('deleteQuestion()', () => {
  it('remove a questao da fase correta', () => {
    const questao = createQuestion('diagramacao');
    const phase = makePhase({ id: 'f1', questoes: [questao] });
    const state = makeValidEditorState({ phases: [phase] });
    const next = deleteQuestion(state, 'f1', questao.id);
    expect(next.phases[0].questoes).toHaveLength(0);
  });

  it('nao afeta questoes de outras fases', () => {
    const q1 = createQuestion('diagramacao');
    const q2 = createQuestion('formalizacao');
    const state = makeValidEditorState({
      phases: [
        makePhase({ id: 'f1', questoes: [q1] }),
        makePhase({ id: 'f2', questoes: [q2] }),
      ],
    });
    const next = deleteQuestion(state, 'f1', q1.id);
    expect(next.phases[1].questoes).toHaveLength(1);
    expect(next.phases[1].questoes[0].id).toBe(q2.id);
  });

  it('nao muta o estado original', () => {
    const q = createQuestion('diagramacao');
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q] })] });
    deleteQuestion(state, 'f1', q.id);
    expect(state.phases[0].questoes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// BLOCO 10 — updateQuestion
// ---------------------------------------------------------------------------

describe('updateQuestion()', () => {
  it('atualiza os campos da questao correta dentro da fase', () => {
    const q = createQuestion('formalizacao');
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q] })] });
    const updated = { ...q, enunciado: 'Novo enunciado alterado' };
    const next = updateQuestion(state, 'f1', updated);
    expect(next.phases[0].questoes[0].enunciado).toBe('Novo enunciado alterado');
  });

  it('nao altera outras questoes na mesma fase', () => {
    const q1 = { ...createQuestion('diagramacao'), enunciado: 'Q1' };
    const q2 = { ...createQuestion('formalizacao'), enunciado: 'Q2' };
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q1, q2] })] });
    const next = updateQuestion(state, 'f1', { ...q1, enunciado: 'Q1 Editada' });
    expect(next.phases[0].questoes[1].enunciado).toBe('Q2');
  });

  it('nao muta o estado original', () => {
    const q = { ...createQuestion('diagramacao'), enunciado: 'Original' };
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q] })] });
    updateQuestion(state, 'f1', { ...q, enunciado: 'Alterado' });
    expect(state.phases[0].questoes[0].enunciado).toBe('Original');
  });
});

// ---------------------------------------------------------------------------
// BLOCO 11 — reorderQuestions
// ---------------------------------------------------------------------------

describe('reorderQuestions()', () => {
  it('move a questao do indice 2 para o indice 0 dentro da fase', () => {
    const q1 = { ...createQuestion('diagramacao'), id: 'q-1' };
    const q2 = { ...createQuestion('tabela_verdade'), id: 'q-2' };
    const q3 = { ...createQuestion('formalizacao'), id: 'q-3' };
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q1, q2, q3] })] });
    const next = reorderQuestions(state, 'f1', 2, 0);
    expect(next.phases[0].questoes[0].id).toBe('q-3');
    expect(next.phases[0].questoes[1].id).toBe('q-1');
    expect(next.phases[0].questoes[2].id).toBe('q-2');
  });

  it('mantem o comprimento da lista apos reordenacao', () => {
    const q1 = createQuestion('diagramacao');
    const q2 = createQuestion('formalizacao');
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q1, q2] })] });
    const next = reorderQuestions(state, 'f1', 0, 1);
    expect(next.phases[0].questoes).toHaveLength(2);
  });

  it('nao afeta questoes de outras fases ao reordenar', () => {
    const q1 = { ...createQuestion('diagramacao'), id: 'q-f1' };
    const q2 = { ...createQuestion('formalizacao'), id: 'q-f2-a' };
    const q3 = { ...createQuestion('tabela_verdade'), id: 'q-f2-b' };
    const state = makeValidEditorState({
      phases: [
        makePhase({ id: 'f1', questoes: [q1] }),
        makePhase({ id: 'f2', questoes: [q2, q3] }),
      ],
    });
    const next = reorderQuestions(state, 'f2', 0, 1);
    expect(next.phases[0].questoes[0].id).toBe('q-f1');
  });

  it('nao muta o estado original', () => {
    const q1 = { ...createQuestion('diagramacao'), id: 'q-1' };
    const q2 = { ...createQuestion('formalizacao'), id: 'q-2' };
    const state = makeValidEditorState({ phases: [makePhase({ id: 'f1', questoes: [q1, q2] })] });
    reorderQuestions(state, 'f1', 0, 1);
    expect(state.phases[0].questoes[0].id).toBe('q-1');
  });
});
