import { FormalizacaoQuestion } from '@/types';
import { parse, generateTruthTable } from '@/lib/parser';

/**
 * [SPEC-004] Motor de Validação e Criação de Formalização Lógica.
 * Fornece equivalência semântica proposicional, normalização de predicados (alpha-conversão),
 * validação sintática em tempo real e geração assistida de dicas e teclado virtual.
 */

const ALL_LOGICAL_SYMBOLS = ['~', '∧', '∨', '→', '↔', '∀', '∃'];

/**
 * Verifica se duas fórmulas da Lógica Proposicional são semanticamente equivalentes
 * testando se a bicondicional (A) ↔ (B) é uma Tautologia.
 */
export function areLogicallyEquivalent(
  userFormula: string,
  expectedFormula: string
): { equivalent: boolean; reason?: string } {
  const cleanUser = userFormula.trim();
  const cleanExp = expectedFormula.trim();

  if (!cleanUser || !cleanExp) {
    return { equivalent: false, reason: 'Fórmulas não preenchidas' };
  }

  try {
    const astUser = parse(cleanUser);
    const astExp = parse(cleanExp);

    const varsUser = Array.from(astUser.getVariables()).sort();
    const varsExp = Array.from(astExp.getVariables()).sort();

    // Em exercícios de formalização, as proposições atômicas devem coincidir
    if (varsUser.length !== varsExp.length || varsUser.some((v, i) => v !== varsExp[i])) {
      return { equivalent: false, reason: 'Conjunto de variáveis proposicionais não coincide' };
    }

    // Avalia a bicondicional sintética: (A) ↔ (B)
    const syntheticBiconditional = `(${cleanUser}) ↔ (${cleanExp})`;
    const truthTable = generateTruthTable(syntheticBiconditional);
    const isTautology = truthTable.expected.every((val) => val === 'V');

    if (isTautology) {
      return { equivalent: true };
    }

    return { equivalent: false, reason: 'Fórmulas não são logicamente equivalentes' };
  } catch (err: any) {
    return { equivalent: false, reason: err.message || 'Erro sintático no parsing' };
  }
}

/**
 * Normaliza variáveis individuais ligadas a quantificadores (alpha-conversão).
 * Transforma variáveis ligadas em identificadores canônicos (__v1__, __v2__...)
 * para que ∀x(Px → Qx) e ∀y(Py → Qy) produzam a mesma representação normalizada.
 */
export function normalizeQuantifiedVariables(formula: string): string {
  let normalized = formula.replace(/\s+/g, '');

  // Encontra quantificadores e suas variáveis ligadas
  const quantifierMatches = Array.from(normalized.matchAll(/([∀∃])([a-z])/g));
  const varMapping = new Map<string, string>();
  let counter = 1;

  for (const match of quantifierMatches) {
    const v = match[2];
    if (!varMapping.has(v)) {
      varMapping.set(v, `__v${counter}__`);
      counter++;
    }
  }

  // Substitui cada variável ligada pelo seu identificador canônico
  for (const [v, replacement] of varMapping.entries()) {
    const regex = new RegExp(v, 'g');
    normalized = normalized.replace(regex, replacement);
  }

  return normalized;
}

/**
 * Validador sintático em tempo real para o campo de resposta esperada do professor.
 * Detecta parênteses desbalanceados, operadores consecutivos e quantificadores órfãos.
 */
export function validateFormalizacaoSyntax(
  formula: string
): { isValid: boolean; error?: string } {
  const trimmed = formula.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Fórmula vazia' };
  }

  // 1. Balanceamento de parênteses
  let balance = 0;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === '(') balance++;
    else if (trimmed[i] === ')') balance--;
    if (balance < 0) {
      return { isValid: false, error: 'Parêntese fechado sem parêntese de abertura correspondente' };
    }
  }
  if (balance !== 0) {
    return { isValid: false, error: 'Parênteses não balanceados: parêntese aberto sem fechamento' };
  }

  const clean = trimmed.replace(/\s+/g, '');

  // 2. Quantificador sem variável associada: [∀∃] não seguido de letra minúscula
  if (/[∀∃](?![a-z])/.test(clean)) {
    return { isValid: false, error: 'Quantificador sem variável individual associada (ex: use ∀x ou ∃x)' };
  }

  // 3. Operador binário solto no início ou no fim
  if (/^[→↔∧∨&|^]/.test(clean)) {
    return { isValid: false, error: 'Operador binário no início da fórmula sem operando à esquerda' };
  }
  if (/[→↔∧∨&|^~¬]$/.test(clean)) {
    return { isValid: false, error: 'Operador lógico no final da fórmula sem operando à direita' };
  }

  // 4. Operadores binários consecutivos ilegais (ex: → →, ∧ ∨)
  if (/[→↔∧∨&|^]{2,}/.test(clean)) {
    return { isValid: false, error: 'Operadores lógicos binários consecutivos' };
  }

  return { isValid: true };
}

/**
 * Extrai automaticamente predicados (letras maiúsculas) e variáveis ligadas a quantificadores
 * para gerar os campos do dicionário de dicas do formulário.
 */
export function extractFormalizacaoDicas(formula: string): string[] {
  const dicas: string[] = [];
  const seenPredicates = new Set<string>();
  const seenVariables = new Set<string>();

  // Encontra variáveis individuais ligadas a quantificadores: [∀∃]\s*([a-z])
  const quantifierMatches = Array.from(formula.matchAll(/[∀∃]\s*([a-z])/g));
  for (const match of quantifierMatches) {
    seenVariables.add(match[1]);
  }

  // Encontra predicados / variáveis proposicionais: letras maiúsculas [A-Z]
  const predicateMatches = Array.from(formula.matchAll(/[A-Z]/g));
  for (const match of predicateMatches) {
    seenPredicates.add(match[0]);
  }

  // Ordena alfabeticamente para consistência
  const sortedPredicates = Array.from(seenPredicates).sort();
  for (const p of sortedPredicates) {
    dicas.push(`${p}: `);
  }

  const sortedVariables = Array.from(seenVariables).sort();
  for (const v of sortedVariables) {
    dicas.push(`${v}: variável individual`);
  }

  return dicas;
}

/**
 * Sugere os símbolos do teclado virtual com base na fórmula esperada,
 * podendo adicionar operadores distratores para elevar o desafio pedagógico.
 */
export function suggestVirtualKeyboard(
  formula: string,
  addDistractors: boolean = false
): string[] {
  const variables = new Set<string>();
  const operators = new Set<string>();

  const variablesAndPredicates = formula.match(/[a-zA-Z]/g) || [];
  for (const sym of variablesAndPredicates) {
    variables.add(sym);
  }

  for (const sym of ALL_LOGICAL_SYMBOLS) {
    if (formula.includes(sym)) {
      operators.add(sym);
    }
  }

  if (addDistractors) {
    const unused = ALL_LOGICAL_SYMBOLS.filter((s) => !operators.has(s));
    // Inclui até 3 símbolos distratores não presentes na fórmula
    const distractorsToAdd = unused.slice(0, 3);
    for (const d of distractorsToAdd) {
      operators.add(d);
    }
  }

  const sortedVariables = Array.from(variables).sort((a, b) => {
    const aUpper = a === a.toUpperCase();
    const bUpper = b === b.toUpperCase();
    if (aUpper && !bUpper) return -1;
    if (!aUpper && bUpper) return 1;
    return a.localeCompare(b);
  });

  return [...sortedVariables, ...Array.from(operators)];
}

/**
 * Valida a resposta do estudante para uma questão de formalização.
 * Executa limpeza de espaços, checagem de gabarito estrito ou alternativos,
 * normalização de quantificadores e equivalência semântica proposicional.
 */
export function validateFormalizacaoAnswer(
  userAnswer: string,
  question: FormalizacaoQuestion
): { isValid: boolean; message?: string } {
  if (!userAnswer || !userAnswer.trim()) {
    return { isValid: false, message: 'Resposta vazia' };
  }

  const cleanUser = userAnswer.replace(/\s+/g, '');
  const cleanExpected = question.resposta_esperada.replace(/\s+/g, '');
  const cleanAlternatives = (question.respostas_alternativas || []).map((alt) =>
    alt.replace(/\s+/g, '')
  );

  // 1. Correspondência textual direta com o gabarito principal ou alternativas
  if (cleanUser === cleanExpected || cleanAlternatives.includes(cleanUser)) {
    return { isValid: true };
  }

  // 2. Se o modo de validação for estrito, encerra sem análise semântica
  if (question.modo_validacao === 'estrito') {
    return { isValid: false, message: 'Resposta incorreta' };
  }

  // 3. Validação para Lógica de Predicados com quantificadores (alpha-conversão)
  const isQuantified = /[∀∃]/.test(cleanExpected) || /[∀∃]/.test(cleanUser);
  if (isQuantified) {
    const normUser = normalizeQuantifiedVariables(cleanUser);
    const normExpected = normalizeQuantifiedVariables(cleanExpected);
    const normAlternatives = cleanAlternatives.map((alt) => normalizeQuantifiedVariables(alt));

    if (normUser === normExpected || normAlternatives.includes(normUser)) {
      return { isValid: true };
    }

    return { isValid: false, message: 'Resposta incorreta' };
  }

  // 4. Validação para Lógica Proposicional via Equivalência Semântica (Tautologia)
  const eqPrincipal = areLogicallyEquivalent(cleanUser, cleanExpected);
  if (eqPrincipal.equivalent) {
    return { isValid: true };
  }

  for (const alt of cleanAlternatives) {
    const eqAlt = areLogicallyEquivalent(cleanUser, alt);
    if (eqAlt.equivalent) {
      return { isValid: true };
    }
  }

  return { isValid: false, message: 'Resposta incorreta' };
}
