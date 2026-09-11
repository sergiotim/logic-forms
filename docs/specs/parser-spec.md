# [SPEC-003] Auto-gerador de Tabela-Verdade (Parser Lógico)

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Implementado / Concluído
- **Data de Criação:** 2026-09-10
- **Última Atualização:** 2026-09-10
- **Target Release / Milestone:** v2.1.0

---

## 1. Contexto & Objetivos

### 1.1 Problema / Motivação
Anteriormente, a criação de questões do tipo `tabela_verdade` no Modo Editor (`/editor`) exigia que o professor configurasse manualmente as variáveis, linhas e valores lógicos da tabela. Isso era propenso a erros, tedioso e inviabilizava exercícios com fórmulas complexas ou compostas por múltiplas etapas de conectivos.
O objetivo desta especificação foi desenvolver um motor de parsing de lógica proposicional 100% executado no cliente (TypeScript), capaz de decompor qualquer fórmula bem formada em suas variáveis atômicas e subexpressões intermediárias, gerando automaticamente a matriz de valorações com rigor formal e suporte a andaime pedagógico.

### 1.2 Objetivos (Goals)
- [x] Construir um Parser Lógico 100% em TypeScript (Client-side) para analisar fórmulas digitadas pelo usuário no Modo Editor.
- [x] Implementar uma Árvore de Sintaxe Abstrata (AST) com nós especializados (`VariableNode`, `NegationNode`, `ConjunctionNode`, `DisjunctionNode`, `ConditionalNode`, `BiconditionalNode`).
- [x] Extrair variáveis atômicas únicas (ex: `P`, `Q`, `R`) e ordenar subexpressões intermediárias por precedência topológica.
- [x] Garantir estritamente $2^n$ linhas na tabela-verdade, onde $n$ é o total de variáveis atômicas declaradas na fórmula.
- [x] Automatizar a valoração booleana completa de todas as linhas para cada coluna de conectivo e para a fórmula raiz.
- [x] Implementar sistema de Andaime Pedagógico (*scaffolding*), permitindo ao professor alternar colunas ou células individuais entre "Dica (revelada ao aluno)" e "Aluno responde".
- [x] Fornecer feedback visual instantâneo para erros sintáticos de fórmula.

### 1.3 Fora de Escopo (Non-Goals)
- Suporte para lógica de primeira ordem (cálculo de predicados com quantificadores existenciais ou universais). O escopo é restrito à Lógica Proposicional.
- Processamento via backend ou API remota. Toda a execução ocorre localmente no navegador em benefício de performance e privacidade.

---

## 2. Arquitetura do Parser

### 2.1 Pipeline de Processamento
O ciclo de autogeração ocorre de forma reativa a cada caractere inserido ou alterado no campo de fórmula:

1. **Tokenização (`tokenize`):**
   - Converte a string bruta em uma sequência de tokens léxicos (`VAR`, `NOT`, `AND`, `OR`, `COND`, `BICOND`, `LPAREN`, `RPAREN`).
   - Normaliza caracteres alternativos:
     - Negação: `~`, `¬`
     - Conjunção: `^`, `∧`, `&`
     - Disjunção: `v`, `V`, `∨`, `|` (atenção: `V` maiúsculo ou minúsculo é tratado como disjunção antes da leitura de variáveis, evitando conflito com valoração booleana)
     - Condicional: `->`, `→`
     - Bicondicional: `<->`, `↔`
   - Valida caracteres ilegais e reporta mensagem de erro explicativa.

2. **Análise Sintática (`parse`):**
   - Utiliza análise sintática descendente recursiva respeitando a hierarquia de operadores lógicos:
     - Nível 1: Bicondicional (`↔`)
     - Nível 2: Condicional (`→`)
     - Nível 3: Disjunção (`∨`)
     - Nível 4: Conjunção (`∧`)
     - Nível 5: Negação (`~`)
     - Nível 6: Fator primário (Variável ou subexpressão entre parênteses)

3. **Extração Topológica de Subexpressões (`extractSubexpressions`):**
   - Percorre a AST em pós-ordem para identificar subfórmulas compostas que merecem colunas de passo intermediário na tabela.
   - Elimina variáveis atômicas e a fórmula raiz dessa lista (deixando apenas os conectivos intermediários).
   - Garante ordenação lógica de complexidade crescente (ex: para `(P ∨ Q) ∧ (~R)`, extrai `P ∨ Q` e `~R` antes do nó raiz).

4. **Geração da Tabela-Verdade (`generateTruthTable`):**
   - Determina as variáveis base atômicas ordenadas alfabeticamente.
   - Calcula o número de permutações: $\text{totalRows} = 2^n$ (onde $n = \text{baseVariables.length}$).
   - Constrói as colunas na ordem:
     `[...baseVariables, ...intermediateHeaders, finalExpression]`
   - Para cada linha, gera a valoração estática das variáveis base via deslocamento binário e avalia o contexto booleano correspondente nos nós da AST.
   - Retorna a estrutura `TruthTableData`:
     ```typescript
     export interface TruthTableData {
       baseVariables: string[];
       intermediateHeaders: string[];
       allHeaders: string[];
       rows: { id: string; valores: string[] }[];
       expected: string[];
     }
     ```

---

## 3. Modelo de Dados da AST

```typescript
export interface LogicalContext {
  [variableName: string]: boolean;
}

export interface LogicalNode {
  evaluate(context: LogicalContext): boolean;
  getVariables(): Set<string>;
  formatText(): string;
}
```

### Classes Implementadas:
- **`VariableNode`:** Representa proposições atômicas (`P`, `Q`, `R`).
- **`NegationNode`:** Inverte o valor booleano do nó filho (`!child.evaluate(context)`). Formata como `~A`.
- **`ConjunctionNode`:** Conjunção lógica (`left && right`). Formata como `(A ∧ B)`.
- **`DisjunctionNode`:** Disjunção lógica (`left || right`). Formata como `(A ∨ B)`.
- **`ConditionalNode`:** Implicação material (`!left || right`). Formata como `(A → B)`.
- **`BiconditionalNode`:** Equivalência lógica (`left === right`). Formata como `(A ↔ B)`.

---

## 4. Andaime Pedagógico (Scaffolding)

Para permitir que professores adaptem o nível de dificuldade do exercício, a estrutura da questão suporta o campo opcional `celulas_reveladas`:

```typescript
celulas_reveladas?: Record<string, boolean>;
```

### Formato das Chaves:
- Colunas intermediárias: `${rowIndex}_${colName}` (ex: `0_P ∨ Q`)
- Coluna final (raiz): `${rowIndex}_final` (ex: `0_final`)

### Comportamento Visual e Interativo:
- **Revelada (`true`):** Renderiza badge de dica com a valoração correta (V ou F) e ícone `Eye`. No Modo Estudo (`/`), aparece preenchida estaticamente para o aluno e é ignorada na checagem de acertos.
- **Aluno responde (`false` ou omitido):** Renderiza badge pontilhado com interrogação (`?`) e ícone `EyeOff`. No Modo Estudo, exibe botões interativos (V/F) que o aluno precisa responder para concluir a questão.

### Controles no Editor:
- **No Cabeçalho:** Botão global para alternar todas as linhas daquela coluna de uma só vez.
- **Em Cada Célula:** Botão individual para ajuste granular de auxílio linha por linha.

---

## 5. Suíte de Testes Automatizados (TDD)

A camada do parser é validada por 23 testes unitários dedicados em `src/lib/__tests__/parser.test.ts`:

1. **Tokenização:** Validação de espaços, parênteses, caracteres alternativos (`¬`, `^`, `v`, `->`, `<->`) e tratamento de erros para caracteres desconhecidos.
2. **Avaliação Booleana da AST:** Testes para tabelas completas de todos os conectivos (`NOT`, `AND`, `OR`, `COND`, `BICOND`).
3. **Precedência e Fórmulas Complexas:** Avaliação de expressões com múltiplos níveis de aninhamento como `(P ∨ Q) ∧ ~R` e `(P → Q) ↔ (~P ∨ Q)`.
4. **Extração Topológica:** Verificação de que subexpressões intermediárias são extraídas sem duplicidade e na ordem correta de resolução.
5. **Geração de Matriz:** Validação de que fórmulas com 3 variáveis proposicionais geram exatamente 8 linhas ($2^3$), 3 colunas base e as respectivas colunas intermediárias.
