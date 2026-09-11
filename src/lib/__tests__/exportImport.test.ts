/**
 * @file exportImport.test.ts
 * @description Suíte de testes unitários para Exportação e Importação de Pacotes de Fases (TDD - SPEC-005).
 * Valida geração de pacotes portáveis ("hidratação"), validação de schemas, e prevenção de colisão de IDs.
 */

import {
  exportPackage,
  validatePackage,
  importPackage,
} from '@/lib/exportImport';
import type {
  EditorState,
  Phase,
  DiagramacaoQuestion,
  FormalizacaoQuestion,
  TabelaVerdadeQuestion,
  PhasePackageExport,
} from '@/types';

// ─── Helpers de Fixtures ────────────────────────────────────────────────────────

function makeDiagramacaoQuestion(id: string = 'q-diag-1'): DiagramacaoQuestion {
  return {
    id,
    tipo: 'diagramacao',
    topico: 'Lógica Proposicional',
    enunciado: 'Classifique as frases em premissa ou conclusão.',
    frases: [
      { id: 'f1', texto: 'Todo homem é mortal.' },
      { id: 'f2', texto: 'Sócrates é homem.' },
      { id: 'f3', texto: 'Logo, Sócrates é mortal.' },
    ],
    resposta_esperada: { f1: 'P', f2: 'P', f3: 'C' },
  };
}

function makeFormalizacaoQuestion(id: string = 'q-form-1'): FormalizacaoQuestion {
  return {
    id,
    tipo: 'formalizacao',
    topico: 'Cálculo de Predicados',
    enunciado: 'Formalize: Todo número par maior que 2 é composto.',
    dicas: ['P(x): x é par', 'C(x): x é composto'],
    teclado_virtual: ['∀', '∃', '→', '∧'],
    resposta_esperada: '∀x(P(x) → C(x))',
  };
}

function makeTabelaVerdadeQuestion(id: string = 'q-tab-1'): TabelaVerdadeQuestion {
  return {
    id,
    tipo: 'tabela_verdade',
    topico: 'Tabela Verdade',
    enunciado: 'Complete a tabela-verdade para P ∧ Q.',
    expressao: 'P ∧ Q',
    variaveis: ['P', 'Q', 'P ∧ Q'],
    linhas: [
      { id: 'l1', valores: ['V', 'V', 'V'] },
      { id: 'l2', valores: ['V', 'F', 'F'] },
      { id: 'l3', valores: ['F', 'V', 'F'] },
      { id: 'l4', valores: ['F', 'F', 'F'] },
    ],
    resposta_esperada: ['V', 'F', 'F', 'F'],
  };
}

function makeSampleState(): EditorState {
  const phase1: Phase = {
    id: 'phase-1',
    titulo: 'Fase 1: Diagramação',
    icone: 'Network',
    questoes: [makeDiagramacaoQuestion('diag-1'), makeFormalizacaoQuestion('form-1')],
  };

  const phase2: Phase = {
    id: 'phase-2',
    titulo: 'Fase 2: Tabela-Verdade',
    icone: 'Table2',
    questoes: [makeTabelaVerdadeQuestion('tab-1')],
  };

  const phase3Empty: Phase = {
    id: 'phase-3',
    titulo: 'Fase 3: Vazia',
    icone: 'Target',
    questoes: [],
  };

  return {
    version: 1,
    updatedAt: '2026-09-11T12:00:00.000Z',
    phases: [phase1, phase2, phase3Empty],
  };
}

function makeValidPackageExport(): PhasePackageExport {
  return {
    metadata: {
      version: 1,
      type: 'logica-dinamica:package_export',
      exportedAt: '2026-09-11T12:00:00.000Z',
    },
    phases: [
      {
        titulo: 'Fase Importada 1',
        icone: 'Brain',
        originalQuestionIds: ['orig-q1', 'orig-q2'],
      },
    ],
    questions: [
      {
        ...makeDiagramacaoQuestion('orig-q1'),
        originalId: 'orig-q1',
      },
      {
        ...makeFormalizacaoQuestion('orig-q2'),
        originalId: 'orig-q2',
      },
    ],
  };
}

// ─── BLOCO 1: exportPackage (SPEC-005 Seção 2 e 3) ──────────────────────────────

describe('[SPEC-005] exportPackage()', () => {
  it('exporta pacote de uma única fase especificada por ID com suas questões hidratadas', () => {
    const state = makeSampleState();
    const pkg = exportPackage(state, ['phase-1']);

    expect(pkg.phases).toHaveLength(1);
    expect(pkg.phases[0].titulo).toBe('Fase 1: Diagramação');
    expect(pkg.phases[0].icone).toBe('Network');
    expect(pkg.phases[0].originalQuestionIds).toEqual(['diag-1', 'form-1']);

    expect(pkg.questions).toHaveLength(2);
    expect(pkg.questions[0].originalId).toBe('diag-1');
    expect(pkg.questions[1].originalId).toBe('form-1');
  });

  it('gera metadados padronizados do pacote (version 1, tipo package_export e timestamp válido)', () => {
    const state = makeSampleState();
    const pkg = exportPackage(state, ['phase-1']);

    expect(pkg.metadata).toBeDefined();
    expect(pkg.metadata.version).toBe(1);
    expect(pkg.metadata.type).toBe('logica-dinamica:package_export');
    expect(new Date(pkg.metadata.exportedAt).getTime()).not.toBeNaN();
  });

  it('exporta múltiplas fases quando fornecido um array com múltiplos IDs', () => {
    const state = makeSampleState();
    const pkg = exportPackage(state, ['phase-1', 'phase-2']);

    expect(pkg.phases).toHaveLength(2);
    expect(pkg.phases.map((p) => p.titulo)).toEqual([
      'Fase 1: Diagramação',
      'Fase 2: Tabela-Verdade',
    ]);
    expect(pkg.questions).toHaveLength(3);
  });

  it('exporta todas as fases do estado quando o parâmetro phaseIds é omitido ou vazio', () => {
    const state = makeSampleState();
    const pkg = exportPackage(state);

    expect(pkg.phases).toHaveLength(3);
    expect(pkg.questions).toHaveLength(3);
  });

  it('suporta exportar fase sem questões (array vazio) sem lançar exceção', () => {
    const state = makeSampleState();
    const pkg = exportPackage(state, ['phase-3']);

    expect(pkg.phases).toHaveLength(1);
    expect(pkg.phases[0].originalQuestionIds).toEqual([]);
    expect(pkg.questions).toHaveLength(0);
  });

  it('não inclui questões de fases que não foram selecionadas para exportação', () => {
    const state = makeSampleState();
    const pkg = exportPackage(state, ['phase-2']);

    expect(pkg.phases).toHaveLength(1);
    const questionIds = pkg.questions.map((q) => q.originalId);
    expect(questionIds).toEqual(['tab-1']);
    expect(questionIds).not.toContain('diag-1');
    expect(questionIds).not.toContain('form-1');
  });
});

// ─── BLOCO 2: validatePackage (SPEC-005 Seção 4) ───────────────────────────────

describe('[SPEC-005] validatePackage()', () => {
  it('retorna { isValid: true } para um pacote íntegro e formatado corretamente', () => {
    const valid = makeValidPackageExport();
    const result = validatePackage(valid);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('retorna { isValid: false } quando o payload for nulo, indefinido ou primitivo', () => {
    expect(validatePackage(null).isValid).toBe(false);
    expect(validatePackage(undefined).isValid).toBe(false);
    expect(validatePackage('string invalida').isValid).toBe(false);
    expect(validatePackage(12345).isValid).toBe(false);
  });

  it('rejeita pacote com metadata.type incompatível', () => {
    const invalid = {
      ...makeValidPackageExport(),
      metadata: { version: 1, type: 'outro_formato', exportedAt: new Date().toISOString() },
    };
    const result = validatePackage(invalid);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/tipo|type/i);
  });

  it('rejeita pacote quando phases não for um array ou for vazio', () => {
    const noPhases = { ...makeValidPackageExport(), phases: [] };
    const notArray = { ...makeValidPackageExport(), phases: 'nao-array' };

    expect(validatePackage(noPhases).isValid).toBe(false);
    expect(validatePackage(notArray).isValid).toBe(false);
  });

  it('rejeita pacote quando questions não for um array', () => {
    const invalid = { ...makeValidPackageExport(), questions: null };
    expect(validatePackage(invalid).isValid).toBe(false);
  });

  it('rejeita pacote quando uma questão não possui campos obrigatórios mínimos (tipo, enunciado, originalId)', () => {
    const invalid = makeValidPackageExport();
    invalid.questions = [
      {
        ...makeDiagramacaoQuestion('q1'),
        originalId: '',
        tipo: undefined as any,
      },
    ];

    const result = validatePackage(invalid);
    expect(result.isValid).toBe(false);
  });
});

// ─── BLOCO 3: importPackage (SPEC-005 Seção 4) ─────────────────────────────────

describe('[SPEC-005] importPackage()', () => {
  it('importa uma fase com sucesso adicionando-a ao final de state.phases', () => {
    const state = makeSampleState();
    const pkg = makeValidPackageExport();

    const result = importPackage(state, pkg);

    expect(result.importedPhasesCount).toBe(1);
    expect(result.importedQuestionsCount).toBe(2);
    expect(result.state.phases).toHaveLength(state.phases.length + 1);

    const importedPhase = result.state.phases[result.state.phases.length - 1];
    expect(importedPhase.titulo).toBe('Fase Importada 1');
    expect(importedPhase.icone).toBe('Brain');
  });

  it('PREVENÇÃO DE COLISÃO: gera novos IDs únicos para a fase e todas as questões importadas', () => {
    const state = makeSampleState();
    const pkg = makeValidPackageExport();

    const result = importPackage(state, pkg);
    const importedPhase = result.state.phases[result.state.phases.length - 1];

    // Novo ID para a fase
    expect(importedPhase.id).toBeDefined();
    expect(importedPhase.id).not.toBe('phase-1');
    expect(importedPhase.id).not.toBe('phase-2');

    // Novos IDs para as questões
    const importedQuestions = importedPhase.questoes;
    expect(importedQuestions).toHaveLength(2);

    importedQuestions.forEach((q) => {
      expect(q.id).not.toBe('orig-q1');
      expect(q.id).not.toBe('orig-q2');
      expect(q.id).toBeDefined();
    });

    // Os IDs das questões importadas devem ser únicos entre si
    expect(importedQuestions[0].id).not.toBe(importedQuestions[1].id);
  });

  it('mapeia perfeitamente as questões para a fase importada correspondente', () => {
    const state = makeSampleState();
    const pkg = makeValidPackageExport();

    const result = importPackage(state, pkg);
    const importedPhase = result.state.phases[result.state.phases.length - 1];

    const q1 = importedPhase.questoes[0];
    const q2 = importedPhase.questoes[1];

    expect(q1.tipo).toBe('diagramacao');
    expect(q1.enunciado).toBe('Classifique as frases em premissa ou conclusão.');

    expect(q2.tipo).toBe('formalizacao');
    expect(q2.enunciado).toBe('Formalize: Todo número par maior que 2 é composto.');
  });

  it('suporta importação de pacote com múltiplas fases com contagem correta', () => {
    const state = makeSampleState();
    const pkg: PhasePackageExport = {
      metadata: {
        version: 1,
        type: 'logica-dinamica:package_export',
        exportedAt: new Date().toISOString(),
      },
      phases: [
        { titulo: 'Pacote A', icone: 'Puzzle', originalQuestionIds: ['qA'] },
        { titulo: 'Pacote B', icone: 'FlaskConical', originalQuestionIds: ['qB'] },
      ],
      questions: [
        { ...makeDiagramacaoQuestion('qA'), originalId: 'qA' },
        { ...makeFormalizacaoQuestion('qB'), originalId: 'qB' },
      ],
    };

    const result = importPackage(state, pkg);

    expect(result.importedPhasesCount).toBe(2);
    expect(result.importedQuestionsCount).toBe(2);
    expect(result.state.phases).toHaveLength(state.phases.length + 2);

    const phaseA = result.state.phases[result.state.phases.length - 2];
    const phaseB = result.state.phases[result.state.phases.length - 1];

    expect(phaseA.titulo).toBe('Pacote A');
    expect(phaseA.questoes[0].tipo).toBe('diagramacao');

    expect(phaseB.titulo).toBe('Pacote B');
    expect(phaseB.questoes[0].tipo).toBe('formalizacao');
  });

  it('mantém imutabilidade do estado original', () => {
    const state = makeSampleState();
    const initialPhasesCount = state.phases.length;
    const pkg = makeValidPackageExport();

    const result = importPackage(state, pkg);

    expect(state.phases).toHaveLength(initialPhasesCount);
    expect(result.state).not.toBe(state);
    expect(result.state.phases).not.toBe(state.phases);
  });

  it('preserva integridade e ordem das fases e questões preexistentes', () => {
    const state = makeSampleState();
    const pkg = makeValidPackageExport();

    const result = importPackage(state, pkg);

    expect(result.state.phases[0].id).toBe('phase-1');
    expect(result.state.phases[0].titulo).toBe('Fase 1: Diagramação');
    expect(result.state.phases[1].id).toBe('phase-2');
    expect(result.state.phases[1].titulo).toBe('Fase 2: Tabela-Verdade');
    expect(result.state.phases[2].id).toBe('phase-3');
  });

  it('lança exceção descritiva quando fornecido um pacote inválido', () => {
    const state = makeSampleState();
    const corruptedPkg = { metadata: { type: 'invalido' } };

    expect(() => {
      importPackage(state, corruptedPkg);
    }).toThrow(/inválido|invalido|invalid/i);
  });

  it('auto-hidrata questoes de tabela_verdade que fornecem apenas expressao', () => {
    const state = makeSampleState();
    const minimalTabelaPkg = {
      metadata: {
        version: 1,
        type: 'logica-dinamica:package_export',
        exportedAt: '2026-09-11T12:00:00.000Z',
      },
      phases: [
        {
          titulo: 'Fase Tabela Auto',
          icone: 'Table2',
          originalQuestionIds: ['q-auto-tab'],
        },
      ],
      questions: [
        {
          originalId: 'q-auto-tab',
          tipo: 'tabela_verdade',
          topico: 'Conjunção',
          enunciado: 'Resolva a tabela',
          expressao: 'P ∧ Q',
        },
      ],
    };

    const result = importPackage(state, minimalTabelaPkg);
    const importedPhase = result.state.phases[result.state.phases.length - 1];
    const importedQ = importedPhase.questoes[0] as any;

    expect(importedQ.expressao).toBe('P ∧ Q');
    expect(importedQ.variaveis).toEqual(expect.arrayContaining(['P', 'Q']));
    expect(importedQ.linhas).toHaveLength(4);
    expect(importedQ.resposta_esperada).toEqual(['V', 'F', 'F', 'F']);
  });

  it('auto-hidrata teclado_virtual em questoes de formalizacao quando omitido', () => {
    const state = makeSampleState();
    const minimalFormPkg = {
      metadata: {
        version: 1,
        type: 'logica-dinamica:package_export',
        exportedAt: '2026-09-11T12:00:00.000Z',
      },
      phases: [
        {
          titulo: 'Fase Formalizacao Auto',
          icone: 'PenLine',
          originalQuestionIds: ['q-auto-form'],
        },
      ],
      questions: [
        {
          originalId: 'q-auto-form',
          tipo: 'formalizacao',
          topico: 'Predicados',
          enunciado: 'Formalize a sentença',
          dicas: ['H(x): homem', 'M(x): mortal'],
          resposta_esperada: '∀x(Hx → Mx)',
        },
      ],
    };

    const result = importPackage(state, minimalFormPkg);
    const importedPhase = result.state.phases[result.state.phases.length - 1];
    const importedQ = importedPhase.questoes[0] as any;

    expect(importedQ.teclado_virtual).toEqual(
      expect.arrayContaining(['∀', '∃', '~', '∧', '∨', '→', '↔', '(', ')']),
    );
  });
});

