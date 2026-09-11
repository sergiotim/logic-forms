/**
 * @file exportImport.ts
 * @description Módulo de Exportação e Importação de Pacotes de Fases (SPEC-005).
 * Permite compartilhamento descentralizado e offline entre professores com prevenção de colisão de IDs.
 */

import type {
  EditorState,
  Phase,
  Question,
  PhasePackageExport,
  ExportedPhase,
  ExportedQuestion,
  ImportPackageResult,
} from '@/types';
import { generateTruthTable } from '@/lib/parser';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Exporta uma ou mais fases selecionadas (ou todas) como um pacote portável com questões hidratadas.
 */
export function exportPackage(
  state: EditorState,
  phaseIds?: string[],
): PhasePackageExport {
  const targetPhases =
    phaseIds && phaseIds.length > 0
      ? state.phases.filter((p) => phaseIds.includes(p.id))
      : state.phases;

  const exportedPhases: ExportedPhase[] = targetPhases.map((phase) => ({
    titulo: phase.titulo,
    icone: phase.icone,
    originalQuestionIds: phase.questoes.map((q) => q.id),
  }));

  // Coleta todas as questões das fases selecionadas, removendo duplicatas por ID
  const seenQuestionIds = new Set<string>();
  const exportedQuestions: ExportedQuestion[] = [];

  for (const phase of targetPhases) {
    for (const question of phase.questoes) {
      if (!seenQuestionIds.has(question.id)) {
        seenQuestionIds.add(question.id);
        exportedQuestions.push({
          ...JSON.parse(JSON.stringify(question)),
          originalId: question.id,
        });
      }
    }
  }

  return {
    metadata: {
      version: 1,
      type: 'logica-dinamica:package_export',
      exportedAt: new Date().toISOString(),
    },
    phases: exportedPhases,
    questions: exportedQuestions,
  };
}

/**
 * Valida a integridade e o schema do pacote JSON recebido antes de processar a importação.
 */
export function validatePackage(
  data: unknown,
): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'O arquivo importado não é um objeto válido.' };
  }

  const pkg = data as Partial<PhasePackageExport>;

  if (!pkg.metadata || typeof pkg.metadata !== 'object') {
    return { isValid: false, error: 'Metadados ausentes no pacote.' };
  }

  if (pkg.metadata.type !== 'logica-dinamica:package_export') {
    return {
      isValid: false,
      error: `Tipo de pacote incompatível: esperado "logica-dinamica:package_export", recebido "${pkg.metadata.type}".`,
    };
  }

  if (!Array.isArray(pkg.phases) || pkg.phases.length === 0) {
    return { isValid: false, error: 'O pacote não contém nenhuma fase válida.' };
  }

  if (!Array.isArray(pkg.questions)) {
    return { isValid: false, error: 'Lista de questões ausente ou inválida no pacote.' };
  }

  const validTypes = ['diagramacao', 'tabela_verdade', 'formalizacao'];
  for (const q of pkg.questions) {
    if (!q || typeof q !== 'object') {
      return { isValid: false, error: 'Questão inválida no pacote.' };
    }
    if (!q.originalId || typeof q.originalId !== 'string') {
      return { isValid: false, error: 'Questão com identificador original (originalId) ausente.' };
    }
    if (!q.tipo || !validTypes.includes(q.tipo)) {
      return { isValid: false, error: `Tipo de questão "${q.tipo}" não suportado.` };
    }
    if (typeof q.enunciado !== 'string') {
      return { isValid: false, error: 'Enunciado inválido em questão do pacote.' };
    }
  }

  return { isValid: true };
}

/**
 * Importa um pacote de fases para o estado do Editor, gerando novos IDs únicos
 * para evitar qualquer risco de colisão e preservando o estado de forma imutável.
 */
export function importPackage(
  state: EditorState,
  packageData: unknown,
): ImportPackageResult {
  const validation = validatePackage(packageData);
  if (!validation.isValid) {
    throw new Error(`Pacote inválido: ${validation.error}`);
  }

  const pkg = packageData as PhasePackageExport;

  // Mapeia os IDs originais para novos IDs únicos gerados
  const idMap = new Map<string, string>();
  const newQuestionsMap = new Map<string, Question>();

  for (const rawQ of pkg.questions) {
    const newId = generateUuid();
    idMap.set(rawQ.originalId, newId);

    const questionCopy: Record<string, any> = { ...rawQ, id: newId };
    delete questionCopy.originalId;

    // Auto-hidratação inteligente para tabela_verdade caso a IA envie apenas a expressão
    if (questionCopy.tipo === 'tabela_verdade' && questionCopy.expressao) {
      if (!questionCopy.linhas || !questionCopy.variaveis || !questionCopy.resposta_esperada) {
        try {
          const generated = generateTruthTable(questionCopy.expressao);
          questionCopy.variaveis = questionCopy.variaveis || generated.allHeaders;
          questionCopy.linhas = questionCopy.linhas || generated.rows;
          questionCopy.resposta_esperada = questionCopy.resposta_esperada || generated.expected;
        } catch {
          // Mantém o que houver caso ocorra erro no parser
        }
      }
    }

    // Auto-hidratação inteligente para formalizacao caso o teclado_virtual não seja fornecido
    if (questionCopy.tipo === 'formalizacao' && questionCopy.resposta_esperada) {
      if (!questionCopy.teclado_virtual || questionCopy.teclado_virtual.length === 0) {
        const hasQuantifiers = /[∀∃]/.test(questionCopy.resposta_esperada);
        questionCopy.teclado_virtual = hasQuantifiers
          ? ['∀', '∃', '~', '∧', '∨', '→', '↔', '(', ')']
          : ['~', '∧', '∨', '→', '↔', '(', ')'];
      }
    }

    newQuestionsMap.set(newId, questionCopy as Question);
  }

  // Reconstrói as fases com os novos IDs
  const newPhases: Phase[] = pkg.phases.map((p) => {
    const newPhaseId = generateUuid();
    const phaseQuestions: Question[] = (p.originalQuestionIds || [])
      .map((oldId) => {
        const newId = idMap.get(oldId);
        return newId ? newQuestionsMap.get(newId) : undefined;
      })
      .filter((q): q is Question => q !== undefined);

    return {
      id: newPhaseId,
      titulo: p.titulo,
      icone: p.icone,
      questoes: phaseQuestions,
    };
  });

  const nextState: EditorState = {
    ...state,
    phases: [...state.phases, ...newPhases],
  };

  return {
    state: nextState,
    importedPhasesCount: newPhases.length,
    importedQuestionsCount: pkg.questions.length,
  };
}
