import {
  areLogicallyEquivalent,
  normalizeQuantifiedVariables,
  validateFormalizacaoSyntax,
  extractFormalizacaoDicas,
  suggestVirtualKeyboard,
  validateFormalizacaoAnswer,
} from '@/lib/formalizacao';
import { FormalizacaoQuestion } from '@/types';

describe('[SPEC-004] Motor de Formalização Lógica', () => {
  // -------------------------------------------------------------------------
  // 1. Testes de Equivalência Semântica Proposicional (Tautologia A ↔ B)
  // -------------------------------------------------------------------------
  describe('areLogicallyEquivalent (Equivalência Proposicional)', () => {
    it('reconhece comutatividade da conjunção (P ∧ Q ≡ Q ∧ P)', () => {
      const result = areLogicallyEquivalent('P ∧ Q', 'Q ∧ P');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece comutatividade da disjunção (P ∨ Q ≡ Q ∨ P)', () => {
      const result = areLogicallyEquivalent('P ∨ Q', 'Q ∨ P');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece implicação material como disjunção (P → Q ≡ ~P ∨ Q)', () => {
      const result = areLogicallyEquivalent('~P ∨ Q', 'P → Q');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece a contrapositiva da condicional (P → Q ≡ ~Q → ~P)', () => {
      const result = areLogicallyEquivalent('~Q → ~P', 'P → Q');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece Leis de De Morgan para disjunção (~(P ∨ Q) ≡ ~P ∧ ~Q)', () => {
      const result = areLogicallyEquivalent('~P ∧ ~Q', '~(P ∨ Q)');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece Leis de De Morgan para conjunção (~(P ∧ Q) ≡ ~P ∨ ~Q)', () => {
      const result = areLogicallyEquivalent('~P ∨ ~Q', '~(P ∧ Q)');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece eliminação de dupla negação (~~P ≡ P)', () => {
      const result = areLogicallyEquivalent('~~P', 'P');
      expect(result.equivalent).toBe(true);
    });

    it('reconhece definição de bicondicional (P ↔ Q ≡ (P → Q) ∧ (Q → P))', () => {
      const result = areLogicallyEquivalent('(P → Q) ∧ (Q → P)', 'P ↔ Q');
      expect(result.equivalent).toBe(true);
    });

    it('rejeita fórmulas não equivalentes (P → Q não equivale a Q → P)', () => {
      const result = areLogicallyEquivalent('Q → P', 'P → Q');
      expect(result.equivalent).toBe(false);
    });

    it('rejeita conjunção versus disjunção (P ∧ Q não equivale a P ∨ Q)', () => {
      const result = areLogicallyEquivalent('P ∧ Q', 'P ∨ Q');
      expect(result.equivalent).toBe(false);
    });

    it('rejeita fórmulas com variáveis discrepantes (P ∧ Q não equivale a P ∧ R)', () => {
      const result = areLogicallyEquivalent('P ∧ R', 'P ∧ Q');
      expect(result.equivalent).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Testes de Normalização de Predicados (Alpha-Equivalência)
  // -------------------------------------------------------------------------
  describe('normalizeQuantifiedVariables (Alpha-Conversão em Predicados)', () => {
    it('normaliza a mesma sentença quantificada com letras de variáveis diferentes (x vs y)', () => {
      const normX = normalizeQuantifiedVariables('∀x(Px → Qx)');
      const normY = normalizeQuantifiedVariables('∀y(Py → Qy)');
      expect(normX).toBe(normY);
    });

    it('normaliza quantificador existencial com diferentes variáveis (x vs z)', () => {
      const normX = normalizeQuantifiedVariables('∃x(Ax ∧ Bx)');
      const normZ = normalizeQuantifiedVariables('∃z(Az ∧ Bz)');
      expect(normX).toBe(normZ);
    });

    it('normaliza múltiplos quantificadores na ordem de declaração', () => {
      const normXY = normalizeQuantifiedVariables('∀x∃y(Rxy)');
      const normAB = normalizeQuantifiedVariables('∀a∃b(Rab)');
      expect(normXY).toBe(normAB);
    });

    it('não confunde predicados distintos mesmo com a mesma variável normalizada', () => {
      const normP = normalizeQuantifiedVariables('∀x(Px → Qx)');
      const normA = normalizeQuantifiedVariables('∀x(Ax → Bx)');
      expect(normP).not.toBe(normA);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Testes de Validação Sintática em Tempo Real (Syntax Checker)
  // -------------------------------------------------------------------------
  describe('validateFormalizacaoSyntax', () => {
    it('valida fórmulas sintaticamente corretas', () => {
      expect(validateFormalizacaoSyntax('P → Q').isValid).toBe(true);
      expect(validateFormalizacaoSyntax('∀x(Px → Qx)').isValid).toBe(true);
      expect(validateFormalizacaoSyntax('(P ∧ Q) ∨ ~R').isValid).toBe(true);
    });

    it('detecta parênteses não balanceados (abertos sem fechar)', () => {
      const result = validateFormalizacaoSyntax('(P → Q');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/parêntese/i);
    });

    it('detecta parênteses fechados a mais', () => {
      const result = validateFormalizacaoSyntax('P → Q)');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/parêntese/i);
    });

    it('detecta operadores binários consecutivos ilegais (ex: → → ou ∧ ∨)', () => {
      const result = validateFormalizacaoSyntax('P → → Q');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/operador/i);
    });

    it('detecta operador solto no início ou no fim da fórmula', () => {
      expect(validateFormalizacaoSyntax('P ∧').isValid).toBe(false);
      expect(validateFormalizacaoSyntax('→ Q').isValid).toBe(false);
    });

    it('detecta quantificador sem variável associada (ex: ∀() ou ∃)', () => {
      const result = validateFormalizacaoSyntax('∀(Px)');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/quantificador|variável/i);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Testes de Extração Inteligente de Dicas (Smart Dictionary)
  // -------------------------------------------------------------------------
  describe('extractFormalizacaoDicas', () => {
    it('extrai predicados e variáveis de fórmulas quantificadas', () => {
      const dicas = extractFormalizacaoDicas('∀x(Px → Qx)');
      expect(dicas).toContainEqual(expect.stringMatching(/^P:/));
      expect(dicas).toContainEqual(expect.stringMatching(/^Q:/));
      expect(dicas).toContainEqual(expect.stringMatching(/x:.*variável/i));
    });

    it('extrai proposições de fórmulas do cálculo proposicional', () => {
      const dicas = extractFormalizacaoDicas('P → Q');
      expect(dicas).toContainEqual(expect.stringMatching(/^P:/));
      expect(dicas).toContainEqual(expect.stringMatching(/^Q:/));
      expect(dicas).not.toContainEqual(expect.stringMatching(/variável individual/i));
    });

    it('desduplica predicados e variáveis repetidas na mesma fórmula', () => {
      const dicas = extractFormalizacaoDicas('∀x(Px ∧ Qx) → Px');
      const pDicas = dicas.filter((d) => d.startsWith('P:'));
      expect(pDicas.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Testes de Sugestão de Teclado Virtual com Distratores
  // -------------------------------------------------------------------------
  describe('suggestVirtualKeyboard', () => {
    it('inclui os operadores utilizados na fórmula esperada', () => {
      const keys = suggestVirtualKeyboard('∀x(Px → ~Qx)');
      expect(keys).toContain('∀');
      expect(keys).toContain('→');
      expect(keys).toContain('~');
    });

    it('adiciona símbolos distratores quando addDistractors é verdadeiro', () => {
      const formula = 'P ∧ Q';
      const withoutDistractors = suggestVirtualKeyboard(formula, false);
      const withDistractors = suggestVirtualKeyboard(formula, true);

      expect(withoutDistractors).toContain('∧');
      expect(withDistractors.length).toBeGreaterThan(withoutDistractors.length);
      // Deve conter símbolos não presentes na fórmula original como distratores
      expect(withDistractors.some((k) => k === '∨' || k === '→' || k === '~')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Testes do Validador Completo do Aluno (validateFormalizacaoAnswer)
  // -------------------------------------------------------------------------
  describe('validateFormalizacaoAnswer (Validação Pedagógica no Quiz)', () => {
    const questionProposicional: FormalizacaoQuestion = {
      id: 'q1',
      tipo: 'formalizacao',
      topico: 'Cálculo Proposicional',
      enunciado: 'Se chover, então levo o guarda-chuva.',
      dicas: ['P: Chove', 'Q: Levo guarda-chuva'],
      teclado_virtual: ['~', '∧', '∨', '→'],
      resposta_esperada: 'P → Q',
    };

    const questionPredicados: FormalizacaoQuestion = {
      id: 'q2',
      tipo: 'formalizacao',
      topico: 'Lógica de Predicados',
      enunciado: 'Todo ser humano é mortal.',
      dicas: ['H: É ser humano', 'M: É mortal', 'x: Variável individual'],
      teclado_virtual: ['∀', '∃', '→'],
      resposta_esperada: '∀x(Hx → Mx)',
    };

    it('aceita resposta idêntica independentemente de espaços em branco', () => {
      const res1 = validateFormalizacaoAnswer('P → Q', questionProposicional);
      const res2 = validateFormalizacaoAnswer('P→Q', questionProposicional);
      const res3 = validateFormalizacaoAnswer('  P   →   Q  ', questionProposicional);

      expect(res1.isValid).toBe(true);
      expect(res2.isValid).toBe(true);
      expect(res3.isValid).toBe(true);
    });

    it('aceita resposta semanticamente equivalente por implicação material (~P ∨ Q)', () => {
      const res = validateFormalizacaoAnswer('~P ∨ Q', questionProposicional);
      expect(res.isValid).toBe(true);
    });

    it('aceita resposta semanticamente equivalente por contraposição (~Q → ~P)', () => {
      const res = validateFormalizacaoAnswer('~Q → ~P', questionProposicional);
      expect(res.isValid).toBe(true);
    });

    it('aceita resposta cadastrada em respostas_alternativas', () => {
      const questionComAlternativas: FormalizacaoQuestion = {
        ...questionProposicional,
        respostas_alternativas: ['~P ∨ Q', '~(P ∧ ~Q)'],
      };

      const res = validateFormalizacaoAnswer('~(P ∧ ~Q)', questionComAlternativas);
      expect(res.isValid).toBe(true);
    });

    it('rejeita equivalente quando modo_validacao for estrito', () => {
      const questionEstrita: FormalizacaoQuestion = {
        ...questionProposicional,
        modo_validacao: 'estrito',
      };

      // No modo estrito, ~P ∨ Q não deve ser aceito automaticamente
      const res = validateFormalizacaoAnswer('~P ∨ Q', questionEstrita);
      expect(res.isValid).toBe(false);
    });

    it('aceita resposta quantificada com outra variável ligada (alpha-conversão y em vez de x)', () => {
      const res = validateFormalizacaoAnswer('∀y(Hy → My)', questionPredicados);
      expect(res.isValid).toBe(true);
    });

    it('rejeita resposta incorreta', () => {
      const res = validateFormalizacaoAnswer('P ∧ Q', questionProposicional);
      expect(res.isValid).toBe(false);
    });

    it('rejeita resposta vazia', () => {
      const res = validateFormalizacaoAnswer('', questionProposicional);
      expect(res.isValid).toBe(false);
    });
  });
});

