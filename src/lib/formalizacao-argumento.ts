import { FormalizacaoArgumentoQuestion } from '@/types';
import { areLogicallyEquivalent, normalizeQuantifiedVariables } from '@/lib/formalizacao';

export interface ArgumentoValidationResult {
  isValid: boolean;
  error?: string;
  premiseCountValid?: boolean;
  matchedPremisesCount?: number;
  expectedPremisesCount?: number;
  conclusionValid?: boolean;
}

/**
 * Remove todos os espaços em branco de uma fórmula.
 */
function cleanFormula(formula: string): string {
  return (formula || '').replace(/\s+/g, '');
}

/**
 * Remove parênteses externos redundantes preservando a integridade interna da fórmula.
 * Ex: "((P → Q))" -> "P → Q", "(D)" -> "D"
 */
function removeOuterParens(formula: string): string {
  let s = cleanFormula(formula);
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      if (depth === 0) {
        balanced = false;
        break;
      }
    }
    if (balanced) {
      s = s.slice(1, -1);
    } else {
      break;
    }
  }
  return s;
}

/**
 * Compara uma fórmula do estudante contra uma fórmula esperada do gabarito.
 * Suporta equivalência textual direta, remoção de parênteses, alpha-conversão de quantificadores
 * e equivalência semântica proposicional.
 */
function compareFormula(
  userFormula: string,
  expectedFormula: string,
  mode: 'semantico' | 'estrito' = 'semantico'
): { matches: boolean; rejectedByStrictMode?: boolean } {
  const cleanUser = cleanFormula(userFormula);
  const cleanExp = cleanFormula(expectedFormula);

  if (!cleanUser || !cleanExp) {
    return { matches: false };
  }

  // 1. Identidade textual direta
  if (cleanUser === cleanExp) {
    return { matches: true };
  }

  // 2. Identidade após remoção de parênteses externos redundantes
  if (removeOuterParens(cleanUser) === removeOuterParens(cleanExp)) {
    return { matches: true };
  }

  // 3. Checagem de quantificadores (alpha-conversão de predicados)
  const isQuantified = /[∀∃]/.test(cleanExp) || /[∀∃]/.test(cleanUser);
  if (isQuantified) {
    if (mode === 'estrito') {
      return { matches: false, rejectedByStrictMode: true };
    }
    const normUser = normalizeQuantifiedVariables(cleanUser);
    const normExp = normalizeQuantifiedVariables(cleanExp);
    if (normUser === normExp || removeOuterParens(normUser) === removeOuterParens(normExp)) {
      return { matches: true };
    }
    return { matches: false };
  }

  // 4. Checagem de equivalência semântica via parser lógico (apenas lógica proposicional)
  const eqResult = areLogicallyEquivalent(userFormula, expectedFormula);
  if (eqResult.equivalent) {
    if (mode === 'estrito') {
      return { matches: false, rejectedByStrictMode: true };
    }
    return { matches: true };
  }

  return { matches: false };
}

/**
 * [SPEC-008] Validador de Formalização de Argumentos.
 * Valida a correspondência 1-para-1 da conclusão e N-para-N (sem ordem) das premissas
 * contra o gabarito configurado pelo professor.
 */
export function validateFormalizacaoArgumentoAnswer(
  studentPremises: string[],
  studentConclusion: string,
  question: FormalizacaoArgumentoQuestion
): ArgumentoValidationResult {
  const expectedPremises = question.resposta_esperada.premissas || [];
  const expectedConclusion = question.resposta_esperada.conclusao || '';
  const mode = question.modo_validacao || 'semantico';

  // ---------------------------------------------------------------------------
  // 1. Validação de Quantidade de Premissas
  // ---------------------------------------------------------------------------
  if (!studentPremises || studentPremises.length === 0) {
    return {
      isValid: false,
      error: 'Nenhuma premissa informada. Pelo menos uma premissa é obrigatória.',
      premiseCountValid: false,
      matchedPremisesCount: 0,
      expectedPremisesCount: expectedPremises.length,
      conclusionValid: false,
    };
  }

  if (studentPremises.length > expectedPremises.length) {
    return {
      isValid: false,
      error:
        'Você identificou premissas a mais do que o esperado pelo texto (excesso de premissas).',
      premiseCountValid: false,
      matchedPremisesCount: 0,
      expectedPremisesCount: expectedPremises.length,
      conclusionValid: false,
    };
  }

  if (studentPremises.length < expectedPremises.length) {
    return {
      isValid: false,
      error:
        'Você identificou menos premissas do que o esperado. Estão faltando premissas para completar o argumento.',
      premiseCountValid: false,
      matchedPremisesCount: 0,
      expectedPremisesCount: expectedPremises.length,
      conclusionValid: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Validação da Conclusão
  // ---------------------------------------------------------------------------
  const cleanConclusion = cleanFormula(studentConclusion);
  if (!cleanConclusion) {
    return {
      isValid: false,
      error: 'Conclusão vazia. Por favor, preencha a conclusão do argumento.',
      premiseCountValid: true,
      matchedPremisesCount: 0,
      expectedPremisesCount: expectedPremises.length,
      conclusionValid: false,
    };
  }

  const conclusionComparison = compareFormula(studentConclusion, expectedConclusion, mode);
  if (!conclusionComparison.matches) {
    const errorMsg = conclusionComparison.rejectedByStrictMode
      ? 'No modo estrito, a conclusão deve utilizar a sintaxe exata do gabarito.'
      : 'Conclusão incorreta: a conclusão não coincide com o argumento dedutivo.';

    return {
      isValid: false,
      error: errorMsg,
      premiseCountValid: true,
      matchedPremisesCount: 0,
      expectedPremisesCount: expectedPremises.length,
      conclusionValid: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Validação das Premissas (Array Pool Matching - Ordem Independente)
  // ---------------------------------------------------------------------------
  const expectedPool = [...expectedPremises];
  let matchedCount = 0;
  let rejectedByStrictModeCount = 0;

  for (const userPremise of studentPremises) {
    let matchedIndex = -1;

    for (let i = 0; i < expectedPool.length; i++) {
      const cmp = compareFormula(userPremise, expectedPool[i], mode);
      if (cmp.matches) {
        matchedIndex = i;
        break;
      }
      if (cmp.rejectedByStrictMode) {
        rejectedByStrictModeCount++;
      }
    }

    if (matchedIndex !== -1) {
      expectedPool.splice(matchedIndex, 1);
      matchedCount++;
    }
  }

  const allPremisesMatched = matchedCount === expectedPremises.length;

  if (!allPremisesMatched) {
    const errorMsg =
      rejectedByStrictModeCount > 0
        ? 'No modo estrito, símbolos diferentes do gabarito não são aceitos (exata).'
        : 'Uma ou mais premissas não coincidem com o gabarito do argumento.';

    return {
      isValid: false,
      error: errorMsg,
      premiseCountValid: true,
      matchedPremisesCount: matchedCount,
      expectedPremisesCount: expectedPremises.length,
      conclusionValid: true,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Sucesso Completo
  // ---------------------------------------------------------------------------
  return {
    isValid: true,
    premiseCountValid: true,
    matchedPremisesCount: matchedCount,
    expectedPremisesCount: expectedPremises.length,
    conclusionValid: true,
  };
}
