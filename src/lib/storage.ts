/**
 * @file storage.ts
 * @description Módulo de persistência do Editor — CRUD puro e imutável para EditorState no localStorage.
 * SPEC: editor-spec.md — Seção 3.4
 */

import { bancoDeQuestoes } from '@/data/questions';
import type { EditorState, Phase, Question, QuestionType, LucideIconName } from '@/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'logica-dinamica:editor-state';
export const CURRENT_SCHEMA_VERSION = 1;

// ─── Helpers internos ─────────────────────────────────────────────────────────

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID (ex: jsdom antigo)
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function arrayMove<T>(arr: T[], oldIndex: number, newIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(oldIndex, 1);
  result.splice(newIndex, 0, removed);
  return result;
}

function generateSeed(): EditorState {
  const phases: Phase[] = [
    {
      id: 'fase-diagramacao',
      titulo: 'Diagramação',
      icone: 'Network',
      questoes: bancoDeQuestoes.filter((q) => q.tipo === 'diagramacao'),
    },
    {
      id: 'fase-tabela',
      titulo: 'Tabela-Verdade',
      icone: 'Table2',
      questoes: bancoDeQuestoes.filter((q) => q.tipo === 'tabela_verdade'),
    },
    {
      id: 'fase-formalizacao',
      titulo: 'Formalização',
      icone: 'PenLine',
      questoes: bancoDeQuestoes.filter((q) => q.tipo === 'formalizacao'),
    },
  ];

  return {
    version: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    phases,
  };
}

function migrateSchema(raw: EditorState): EditorState {
  // v0 → v1: apenas atualizar version
  return { ...raw, version: CURRENT_SCHEMA_VERSION };
}

// ─── API Pública — Estado Global ──────────────────────────────────────────────

export function loadEditorState(): EditorState {
  if (typeof window === 'undefined') return generateSeed();

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const seed = generateSeed();
    saveEditorState(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as EditorState;

    if (parsed.version !== CURRENT_SCHEMA_VERSION) {
      const migrated = migrateSchema(parsed);
      saveEditorState(migrated);
      return migrated;
    }

    return parsed;
  } catch {
    // JSON corrompido — retorna seed
    const seed = generateSeed();
    saveEditorState(seed);
    return seed;
  }
}

export function saveEditorState(state: EditorState): void {
  if (typeof window === 'undefined') return;
  const toSave: EditorState = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function resetToDefaults(): EditorState {
  const seed = generateSeed();
  saveEditorState(seed);
  return seed;
}

// ─── API Pública — Fases ──────────────────────────────────────────────────────

export function createPhase(titulo: string, icone: LucideIconName): Phase {
  return { id: uuid(), titulo, icone, questoes: [] };
}

export function deletePhase(state: EditorState, phaseId: string): EditorState {
  return {
    ...state,
    phases: state.phases.filter((p) => p.id !== phaseId),
  };
}

export function updatePhase(state: EditorState, phase: Phase): EditorState {
  return {
    ...state,
    phases: state.phases.map((p) => (p.id === phase.id ? { ...phase } : p)),
  };
}

export function reorderPhases(
  state: EditorState,
  oldIndex: number,
  newIndex: number,
): EditorState {
  return {
    ...state,
    phases: arrayMove(state.phases, oldIndex, newIndex),
  };
}

// ─── API Pública — Questões ───────────────────────────────────────────────────

export function createQuestion(type: QuestionType): Question {
  const base = {
    id: uuid(),
    topico: '',
    enunciado: '',
  };

  if (type === 'diagramacao') {
    const f1 = uuid();
    const f2 = uuid();
    return {
      ...base,
      tipo: 'diagramacao',
      frases: [
        { id: f1, texto: '' },
        { id: f2, texto: '' },
      ],
      resposta_esperada: { [f1]: 'P', [f2]: 'C' },
    };
  }

  if (type === 'tabela_verdade') {
    return {
      ...base,
      tipo: 'tabela_verdade',
      variaveis: ['P'],
      linhas: [
        { id: uuid(), valores: ['V'] },
        { id: uuid(), valores: ['F'] },
      ],
      expressao: '',
      resposta_esperada: ['', ''],
    };
  }

  if (type === 'formalizacao_argumento') {
    return {
      ...base,
      tipo: 'formalizacao_argumento',
      dicas: [''],
      teclado_virtual: ['~', '∧', '∨', '→', '(', ')'],
      resposta_esperada: {
        premissas: [''],
        conclusao: '',
      },
      modo_validacao: 'semantico',
    };
  }

  // formalizacao
  if (type === 'formalizacao') {
    return {
      ...base,
      tipo: 'formalizacao',
      dicas: [''],
      teclado_virtual: ['~', '∧', '∨', '→', '(', ')'],
      resposta_esperada: '',
    };
  }

  // multipla_escolha
  const opt1 = uuid();
  const opt2 = uuid();
  return {
    ...base,
    tipo: 'multipla_escolha',
    opcoes: [
      { id: opt1, texto: '' },
      { id: opt2, texto: '' }
    ],
    resposta_esperada: ''
  };
}

export function deleteQuestion(
  state: EditorState,
  phaseId: string,
  questionId: string,
): EditorState {
  return {
    ...state,
    phases: state.phases.map((p) =>
      p.id === phaseId
        ? { ...p, questoes: p.questoes.filter((q) => q.id !== questionId) }
        : p,
    ),
  };
}

export function updateQuestion(
  state: EditorState,
  phaseId: string,
  question: Question,
): EditorState {
  return {
    ...state,
    phases: state.phases.map((p) =>
      p.id === phaseId
        ? { ...p, questoes: p.questoes.map((q) => (q.id === question.id ? { ...question } : q)) }
        : p,
    ),
  };
}

export function reorderQuestions(
  state: EditorState,
  phaseId: string,
  oldIndex: number,
  newIndex: number,
): EditorState {
  return {
    ...state,
    phases: state.phases.map((p) =>
      p.id === phaseId ? { ...p, questoes: arrayMove(p.questoes, oldIndex, newIndex) } : p,
    ),
  };
}
