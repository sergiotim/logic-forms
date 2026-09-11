import { parse, extractSubexpressions, generateTruthTable } from '../parser';

describe('Auto-gerador de Tabela-Verdade (Parser Lógico)', () => {

  describe('Extração de Variáveis', () => {
    it('deve extrair variáveis simples', () => {
      const ast = parse('P ∧ Q');
      expect(Array.from(ast.getVariables()).sort()).toEqual(['P', 'Q']);
    });

    it('deve extrair variáveis únicas de expressões maiores', () => {
      const ast = parse('(P ∨ Q) → P');
      expect(Array.from(ast.getVariables()).sort()).toEqual(['P', 'Q']);
    });

    it('deve extrair 3 ou mais variáveis corretamente', () => {
      const ast = parse('(P ∨ Q) ∧ ¬R');
      expect(Array.from(ast.getVariables()).sort()).toEqual(['P', 'Q', 'R']);
    });
  });

  describe('Valoração e Precedência (Evaluate)', () => {
    it('deve avaliar Conjunção (∧) corretamente', () => {
      const ast = parse('P ∧ Q');
      expect(ast.evaluate({ P: true, Q: true })).toBe(true);
      expect(ast.evaluate({ P: true, Q: false })).toBe(false);
      expect(ast.evaluate({ P: false, Q: false })).toBe(false);
    });

    it('deve avaliar Disjunção (∨) corretamente', () => {
      const ast = parse('P ∨ Q');
      expect(ast.evaluate({ P: true, Q: false })).toBe(true);
      expect(ast.evaluate({ P: false, Q: false })).toBe(false);
    });

    it('deve avaliar Condicional (→) corretamente', () => {
      const ast = parse('P → Q');
      expect(ast.evaluate({ P: true, Q: false })).toBe(false); // V -> F = F
      expect(ast.evaluate({ P: false, Q: true })).toBe(true);  // F -> V = V
      expect(ast.evaluate({ P: false, Q: false })).toBe(true); // F -> F = V
    });

    it('deve avaliar Bicondicional (↔) corretamente', () => {
      const ast = parse('P ↔ Q');
      expect(ast.evaluate({ P: true, Q: true })).toBe(true);
      expect(ast.evaluate({ P: true, Q: false })).toBe(false);
      expect(ast.evaluate({ P: false, Q: false })).toBe(true);
    });

    it('deve avaliar Negação (¬ e ~) corretamente', () => {
      const ast1 = parse('¬P');
      expect(ast1.evaluate({ P: true })).toBe(false);
      expect(ast1.evaluate({ P: false })).toBe(true);

      const ast2 = parse('~P');
      expect(ast2.evaluate({ P: true })).toBe(false);
      expect(ast2.evaluate({ P: false })).toBe(true);
    });

    it('deve respeitar a ordem de precedência: Negação > Conjunção/Disjunção > Implicação', () => {
      // ¬P ∧ Q → R  deve ser interpretado como ((¬P) ∧ Q) → R
      const ast = parse('¬P ∧ Q → R');
      // Se P=F, Q=V, R=F => (V ∧ V) → F => V → F => Falso
      expect(ast.evaluate({ P: false, Q: true, R: false })).toBe(false);
      // Se P=V, Q=V, R=F => (F ∧ V) → F => F → F => Verdadeiro
      expect(ast.evaluate({ P: true, Q: true, R: false })).toBe(true);
    });

    it('deve respeitar parênteses forçando nova precedência', () => {
      // ¬(P ∧ Q) → R  deve ser diferente do anterior
      const ast = parse('¬(P ∧ Q) → R');
      // Se P=V, Q=V, R=F => ¬(V) → F => F → F => Verdadeiro
      expect(ast.evaluate({ P: true, Q: true, R: false })).toBe(true);
    });
  });

  describe('Formatação de Texto (formatText)', () => {
    it('deve formatar texto com parênteses redundantes limpos', () => {
      const ast = parse('(((P)))');
      expect(ast.formatText()).toBe('P');
    });

    it('deve manter a formatação padronizada para sub-expressões complexas', () => {
      const ast = parse('(P ∨ Q) ∧ ~R');
      expect(ast.formatText()).toBe('(P ∨ Q) ∧ ~R');
    });

    it('deve aninhar múltiplas negações corretamente', () => {
      const ast = parse('~~P');
      expect(ast.formatText()).toBe('~(~P)');
      expect(ast.evaluate({ P: true })).toBe(true);
      expect(ast.evaluate({ P: false })).toBe(false);
    });
  });

  describe('Extração de Sub-expressões e Conectivos Intermediários', () => {
    it('deve extrair 3 conectivos para (P ∨ Q) ∧ (~R)', () => {
      const ast = parse('(P ∨ Q) ∧ (~R)');
      const subexpressions = extractSubexpressions(ast);
      
      // Conectivos na ordem: P ∨ Q, ~R, e raiz
      expect(subexpressions.map(s => s.text)).toEqual([
        'P ∨ Q',
        '~R',
        '(P ∨ Q) ∧ ~R'
      ]);
    });

    it('deve extrair sub-expressões para P → (P ∧ Q)', () => {
      const ast = parse('P → (P ∧ Q)');
      const subexpressions = extractSubexpressions(ast);
      
      expect(subexpressions.map(s => s.text)).toEqual([
        'P ∧ Q',
        'P → P ∧ Q'
      ]);
    });
  });

  describe('Geração Completa da Tabela-Verdade (generateTruthTable)', () => {
    it('deve gerar 6 colunas para (P ∨ Q) ∧ (~R) (3 variáveis + 3 conectivos)', () => {
      const table = generateTruthTable('(P ∨ Q) ∧ (~R)');
      
      expect(table.baseVariables).toEqual(['P', 'Q', 'R']);
      expect(table.intermediateHeaders).toEqual(['P ∨ Q', '~R']);
      // 5 colunas pré-preenchidas + 1 coluna final
      expect(table.allHeaders).toEqual(['P', 'Q', 'R', 'P ∨ Q', '~R']);
      expect(table.totalColumns).toBe(6);

      // 8 linhas para 3 variáveis
      expect(table.rows).toHaveLength(8);
      // Cada linha deve ter 5 valores correspondentes a allHeaders
      expect(table.rows[0].valores).toHaveLength(5);
      // Gabarito da coluna final
      expect(table.expected).toHaveLength(8);

      // Linha 1: P=V, Q=V, R=V -> P ∨ Q = V, ~R = F, (P ∨ Q) ∧ ~R = F
      expect(table.rows[0].valores).toEqual(['V', 'V', 'V', 'V', 'F']);
      expect(table.expected[0]).toBe('F');

      // Linha 2: P=V, Q=V, R=F -> P ∨ Q = V, ~R = V, (P ∨ Q) ∧ ~R = V
      expect(table.rows[1].valores).toEqual(['V', 'V', 'F', 'V', 'V']);
      expect(table.expected[1]).toBe('V');
    });

    it('deve gerar 4 colunas para P → (P ∧ Q) (2 variáveis + 2 conectivos)', () => {
      const table = generateTruthTable('P → (P ∧ Q)');
      
      expect(table.baseVariables).toEqual(['P', 'Q']);
      expect(table.intermediateHeaders).toEqual(['P ∧ Q']);
      expect(table.allHeaders).toEqual(['P', 'Q', 'P ∧ Q']);
      expect(table.totalColumns).toBe(4);
      expect(table.rows).toHaveLength(4);
      expect(table.rows[0].valores).toHaveLength(3);
    });

    it('deve gerar 3 colunas para P ∧ Q (2 variáveis + 1 conectivo)', () => {
      const table = generateTruthTable('P ∧ Q');
      
      expect(table.baseVariables).toEqual(['P', 'Q']);
      expect(table.intermediateHeaders).toEqual([]);
      expect(table.allHeaders).toEqual(['P', 'Q']);
      expect(table.totalColumns).toBe(3);
      expect(table.rows).toHaveLength(4);
    });
  });

  describe('Tratamento de Erros e Casos Extremos (Malformed Syntax)', () => {
    it('deve lançar erro se a expressão terminar num conectivo', () => {
      expect(() => parse('P ∧')).toThrow();
      expect(() => parse('P → ')).toThrow();
    });

    it('deve lançar erro se houver conectivos consecutivos (sem variáveis)', () => {
      expect(() => parse('P ∧ ∧ Q')).toThrow();
    });

    it('deve lançar erro se parênteses não forem fechados', () => {
      expect(() => parse('(P ∨ Q')).toThrow();
    });

    it('deve lançar erro se parênteses forem fechados mas não abertos', () => {
      expect(() => parse('P ∨ Q)')).toThrow();
    });

    it('deve lançar erro para variáveis grudadas sem operador', () => {
      expect(() => parse('P Q')).toThrow();
    });
  });

});
