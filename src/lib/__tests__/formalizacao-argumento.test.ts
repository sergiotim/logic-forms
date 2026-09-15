import { validateFormalizacaoArgumentoAnswer } from '@/lib/formalizacao-argumento';
import { FormalizacaoArgumentoQuestion } from '@/types';

describe('[SPEC-008] Motor de Formalização de Argumentos - TDD (Fase Red)', () => {
  const questaoModusPonens: FormalizacaoArgumentoQuestion = {
    id: 'q-mp-1',
    tipo: 'formalizacao_argumento',
    topico: 'Lógica Proposicional - Modus Ponens',
    enunciado:
      'Se Deus existe, então a vida tem significado. Deus existe. Portanto, a vida tem significado.',
    dicas: ['D: Deus existe', 'V: A vida tem significado'],
    teclado_virtual: ['D', 'V', '→', '~', '∨', '∧', '(', ')'],
    resposta_esperada: {
      premissas: ['D → V', 'D'],
      conclusao: 'V',
    },
    modo_validacao: 'semantico',
  };

  const questaoTresPremissas: FormalizacaoArgumentoQuestion = {
    id: 'q-silogismo-1',
    tipo: 'formalizacao_argumento',
    topico: 'Silogismo e Conjunção',
    enunciado: 'Se A então B. Se B então C. A é verdade. Logo, C é verdade.',
    dicas: ['A: Proposição A', 'B: Proposição B', 'C: Proposição C'],
    teclado_virtual: ['A', 'B', 'C', '→', '(', ')'],
    resposta_esperada: {
      premissas: ['A → B', 'B → C', 'A'],
      conclusao: 'C',
    },
    modo_validacao: 'semantico',
  };

  // -------------------------------------------------------------------------
  // 1. Validação de Ordem das Premissas (Comutatividade do Conjunto)
  // -------------------------------------------------------------------------
  describe('1. Validação de Ordem das Premissas', () => {
    it('aceita premissas na mesma ordem do gabarito', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V', 'D'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(true);
      expect(res.conclusionValid).toBe(true);
      expect(res.premiseCountValid).toBe(true);
      expect(res.matchedPremisesCount).toBe(2);
    });

    it('aceita premissas em ordem invertida em relação ao gabarito', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D', 'D → V'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(true);
      expect(res.conclusionValid).toBe(true);
      expect(res.matchedPremisesCount).toBe(2);
    });

    it('aceita qualquer permutação em argumentos com 3 premissas', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['A', 'B → C', 'A → B'],
        'C',
        questaoTresPremissas
      );
      expect(res.isValid).toBe(true);
      expect(res.matchedPremisesCount).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Validação de Quantidade de Premissas e Feedback Pedagógico
  // -------------------------------------------------------------------------
  describe('2. Validação de Quantidade de Premissas', () => {
    it('rejeita quando o estudante envia mais premissas do que o esperado', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V', 'D', 'V'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(false);
      expect(res.premiseCountValid).toBe(false);
      expect(res.error).toMatch(/mais|excesso|quantidade/i);
    });

    it('rejeita quando o estudante envia menos premissas do que o esperado', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(false);
      expect(res.premiseCountValid).toBe(false);
      expect(res.error).toMatch(/menos|faltando|quantidade/i);
    });

    it('rejeita quando nenhuma premissa é informada', () => {
      const res = validateFormalizacaoArgumentoAnswer([], 'V', questaoModusPonens);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/nenhuma premissa|vazia|obrigatór/i);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Validação da Conclusão
  // -------------------------------------------------------------------------
  describe('3. Validação da Conclusão', () => {
    it('rejeita quando as premissas estão certas mas a conclusão está errada', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V', 'D'],
        'D', // Incorreto, esperado era V
        questaoModusPonens
      );
      expect(res.isValid).toBe(false);
      expect(res.conclusionValid).toBe(false);
      expect(res.error).toMatch(/conclusão incorreta|conclusão não coincide/i);
    });

    it('rejeita quando a conclusão está vazia', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V', 'D'],
        '',
        questaoModusPonens
      );
      expect(res.isValid).toBe(false);
      expect(res.conclusionValid).toBe(false);
      expect(res.error).toMatch(/conclusão vazia|preencha a conclusão/i);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Validação Semântica Integrada (Equivalência Lógica)
  // -------------------------------------------------------------------------
  describe('4. Validação Semântica vs Estrita', () => {
    it('aceita premissa equivalente por implicação material (~D ∨ V ≡ D → V) no modo semântico', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['~D ∨ V', 'D'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(true);
    });

    it('aceita premissa com dupla negação (~~D ≡ D) no modo semântico', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V', '~~D'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(true);
    });

    it('aceita conclusão semanticamente equivalente (~~V ≡ V) no modo semântico', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['D → V', 'D'],
        '~~V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(true);
      expect(res.conclusionValid).toBe(true);
    });

    it('rejeita equivalente semântico quando modo_validacao for estrito', () => {
      const questaoEstrita: FormalizacaoArgumentoQuestion = {
        ...questaoModusPonens,
        modo_validacao: 'estrito',
      };

      const res = validateFormalizacaoArgumentoAnswer(
        ['~D ∨ V', 'D'],
        'V',
        questaoEstrita
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/modo estrito|símbolo diferente|exata/i);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Prevenção de Reuso de Premissas (Casos de Borda do Gabarito Pool)
  // -------------------------------------------------------------------------
  describe('5. Integridade do Pool de Premissas', () => {
    it('rejeita premissas duplicadas que tentam dar match no mesmo item do gabarito', () => {
      // O aluno repetiu 'D' duas vezes em vez de formular 'D → V'
      const res = validateFormalizacaoArgumentoAnswer(
        ['D', 'D'],
        'V',
        questaoModusPonens
      );
      expect(res.isValid).toBe(false);
      expect(res.matchedPremisesCount).toBe(1); // apenas 1 'D' deu match, a 2ª sobrou
    });
  });

  // -------------------------------------------------------------------------
  // 6. Normalização de Espaços e Parênteses
  // -------------------------------------------------------------------------
  describe('6. Normalização de Espaços e Parênteses', () => {
    it('aceita premissas e conclusão com espaços em branco extras e parênteses redundantes', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['  ( D → V )  ', ' (D) '],
        ' (V) ',
        questaoModusPonens
      );
      expect(res.isValid).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Lógica de Predicados com Quantificadores (Alpha-Conversão)
  // -------------------------------------------------------------------------
  describe('7. Quantificadores e Alpha-Conversão em Argumentos', () => {
    const questaoSilogismoCategorico: FormalizacaoArgumentoQuestion = {
      id: 'q-pred-1',
      tipo: 'formalizacao_argumento',
      topico: 'Lógica de Predicados - Silogismo Categórico',
      enunciado:
        'Todo homem é mortal. Sócrates é homem. Portanto, Sócrates é mortal.',
      dicas: [
        'H: é homem',
        'M: é mortal',
        's: Sócrates',
        'x: variável individual',
      ],
      teclado_virtual: ['H', 'M', 's', 'x', '∀', '→', '(', ')'],
      resposta_esperada: {
        premissas: ['∀x(Hx → Mx)', 'Hs'],
        conclusao: 'Ms',
      },
      modo_validacao: 'semantico',
    };

    it('aceita premissas quantificadas com variáveis alfa-equivalentes (troca de x por y)', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['∀y(Hy → My)', 'Hs'],
        'Ms',
        questaoSilogismoCategorico
      );
      expect(res.isValid).toBe(true);
      expect(res.conclusionValid).toBe(true);
      expect(res.matchedPremisesCount).toBe(2);
    });

    it('aceita conclusão quantificada alfa-equivalente', () => {
      const questaoConcQuantificada: FormalizacaoArgumentoQuestion = {
        ...questaoSilogismoCategorico,
        resposta_esperada: {
          premissas: ['∀x(Hx → Mx)', '∀x(Mx → Px)'],
          conclusao: '∀x(Hx → Px)',
        },
      };

      const res = validateFormalizacaoArgumentoAnswer(
        ['∀z(Hz → Mz)', '∀y(My → Py)'],
        '∀w(Hw → Pw)',
        questaoConcQuantificada
      );
      expect(res.isValid).toBe(true);
      expect(res.conclusionValid).toBe(true);
      expect(res.matchedPremisesCount).toBe(2);
    });

    it('rejeita alfa-conversão no modo estrito se a variável for diferente do gabarito', () => {
      const questaoEstrita: FormalizacaoArgumentoQuestion = {
        ...questaoSilogismoCategorico,
        modo_validacao: 'estrito',
      };

      const res = validateFormalizacaoArgumentoAnswer(
        ['∀y(Hy → My)', 'Hs'],
        'Ms',
        questaoEstrita
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/modo estrito|símbolo diferente|exata/i);
    });

    it('rejeita predicados diferentes mesmo que a estrutura de quantificação seja idêntica', () => {
      const res = validateFormalizacaoArgumentoAnswer(
        ['∀x(Ax → Mx)', 'Hs'],
        'Ms',
        questaoSilogismoCategorico
      );
      expect(res.isValid).toBe(false);
    });
  });
});
