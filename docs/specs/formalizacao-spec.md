# [SPEC-004] Motor de Validação e Criação de Questões de Formalização Lógica

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Proposto / Spec Draft
- **Data de Criação:** 2026-09-11
- **Última Atualização:** 2026-09-11
- **Target Release / Milestone:** v2.2.0

---

## 1. Contexto & Objetivos

### 1.1 Problema / Motivação
Atualmente, as questões do tipo `formalizacao` apresentam limitações significativas tanto na experiência de criação do professor quanto na avaliação do estudante:

1. **Injustiça na Validação por Comparação Estrita de Texto:**
   A validação compara a resposta do aluno com o gabarito apenas removendo espaços em branco (`cleanUser === cleanExpected`). Isso faz com que respostas matematicamente perfeitas sejam rejeitadas como incorretas:
   - Comutatividade: `Q ∧ P` é rejeitado se o gabarito for `P ∧ Q`.
   - Equivalência por implicação: `~P ∨ Q` ou `~Q → ~P` é rejeitado se o gabarito for `P → Q`.
   - Renomeação de variáveis ligadas ($\alpha$-equivalência): `∀y(Py → Qy)` é rejeitado se o gabarito usar `x` (`∀x(Px → Qx)`).
2. **Criação Manual e Desconectada no Modo Editor (`/editor`):**
   - O professor precisa preencher individualmente cada campo de dica (`P: ...`, `Q: ...`).
   - O professor precisa selecionar manualmente cada tecla do teclado virtual do aluno, correndo o risco de omitir símbolos fundamentais da fórmula.
   - Os botões de atalho da fórmula ficam flutuando soltos, fora do padrão visual acoplado adotado na Tabela-Verdade.
   - Não há validação sintática prévia da fórmula (parênteses desbalanceados ou operadores soltos podem ser salvos inadvertidamente).

### 1.2 Objetivos (Goals)
- [ ] Implementar verificação de **Equivalência Semântica Proposicional** no validador do quiz utilizando o parser lógico (`(A) ↔ (B)` é tautologia).
- [ ] Implementar **$\alpha$-Normalização de Variáveis Ligadas** para exercícios de Lógica de Predicados com quantificadores (`∀`, `∃`).
- [ ] Permitir o cadastro de **Gabaritos Alternativos** (`respostas_alternativas?: string[]`) no schema e no formulário de edição.
- [ ] Disponibilizar seletor de **Rigor Pedagógico** (`modo_validacao: 'semantico' | 'estrito'`).
- [ ] Redesenhar o formulário `FormalizacaoForm.tsx`:
  - Barra de atalhos acoplada diretamente à borda superior do input de fórmula (seguindo o padrão da Tabela-Verdade).
  - Extrator automático de variáveis e predicados para pré-montar o dicionário de dicas.
  - Sincronização automática do teclado virtual do aluno a partir dos símbolos da fórmula, com recurso de inclusão de símbolos distratores.
  - Validador sintático em tempo real (aviso de parênteses abertos ou operadores consecutivos).

### 1.3 Fora de Escopo (Non-Goals)
- Solução de equivalência de primeira ordem completa e indecidível (teorema de Church-Turing). O escopo de predicados foca em $\alpha$-equivalência (renomeação de variáveis ligadas) e listas de equivalentes canônicos.
- Reescrita do componente de resolução do aluno (`Formalizacao.tsx`). A experiência de input do aluno é mantida intacta; a inteligência é adicionada ao validador e ao editor.

---

## 2. Arquitetura do Motor de Validação

### 2.1 Fluxo Decisório de Validação

Quando o aluno clica em "Validar", o sistema segue uma esteira de checagens em ordem de complexidade:

```
[Resposta do Aluno] vs [Gabarito]
       │
       ▼
1. Limpeza de Espaços
       │
       ▼
2. Igualdade Textual Direta com Gabarito Principal ou Alternativo?
       ├─► SIM ──► APROVADO (Sucesso imediato)
       └─► NÃO
             │
             ▼
3. A questão contém quantificadores ('∀' ou '∃')?
       ├─► SIM ──► Validação de Predicados (Alpha-Conversão)
       └─► NÃO ──► Validação Proposicional Semântica (Tautologia via Parser)
```

---

### 2.2 Equivalência Semântica Proposicional (Tautologia $A \leftrightarrow B$)

Para sentenças sem quantificadores, duas fórmulas $A$ e $B$ expressam a mesma proposição se possuírem a mesma tabela-verdade.

#### Algoritmo `areLogicallyEquivalent(userFormula, expectedFormula)`:
1. **Verificação de Conjunto de Variáveis:**
   - Extrai as variáveis proposicionais de $A$ e de $B$ via AST (`getVariables()`).
   - Se $Vars(A) \neq Vars(B)$ (ex: o aluno usou letras não mencionadas no exercício como `R` em vez de `P`), a validação falha sem necessidade de cálculo de tautologia, retornando feedback específico.
2. **Construção da Bicondicional:**
   - Cria a fórmula sintética: `(${userFormula}) ↔ (${expectedFormula})`.
3. **Avaliação da Matriz:**
   - Executa `generateTruthTable(syntheticFormula)`.
   - Se **todas** as linhas de `resposta_esperada` forem `"V"`, a fórmula é uma **Tautologia**.
   - Conclusão: a resposta do aluno é logicamente equivalente ao gabarito.

#### Exemplos Aprovados Automaticamente:
- Comutação: `P ∧ Q` e `Q ∧ P`
- Implicação Material: `P → Q` e `~P ∨ Q`
- Contrapositiva: `P → Q` e `~Q → ~P`
- Leis de De Morgan: `~(P ∨ Q)` e `~P ∧ ~Q`
- Dupla Negação: `P` e `~~P`

---

### 2.3 Normalização de Predicados ($\alpha$-Equivalência)

Em sentenças de Cálculo de Predicados (ex: `∀x(Px → Qx)`), as variáveis individuais sob o escopo de um quantificador são **variáveis ligadas**. A escolha da letra (`x`, `y`, `z`) é puramente notacional.

#### Algoritmo `normalizeBoundVariables(formula)`:
1. Identifica ocorrências de quantificadores (`∀` e `∃`) seguidos de variável.
2. Mapeia as variáveis na ordem em que são declaradas para identificadores canônicos internos:
   - 1ª variável ligada $\rightarrow$ `$v1`
   - 2ª variável ligada $\rightarrow$ `$v2`
3. Substitui todas as aparições dessas variáveis na fórmula:
   - `∀x(Px → Qx)` $\rightarrow$ `∀$v1(P$v1 → Q$v1)`
   - `∀y(Py → Qy)` $\rightarrow$ `∀$v1(P$v1 → Q$v1)`
4. Compara a igualdade textual das representações normalizadas.

---

## 3. Extensões no Modelo de Dados (TypeScript)

Atualização da interface `FormalizacaoQuestion` em `src/types/index.ts`:

```typescript
export interface FormalizacaoQuestion extends BaseQuestion {
  tipo: 'formalizacao';
  dicas: string[];
  teclado_virtual: string[];
  resposta_esperada: string;
  respostas_alternativas?: string[]; // Fórmulas adicionais aceitas pelo professor
  modo_validacao?: 'semantico' | 'estrito'; // Padrão: 'semantico'
}
```

- **`respostas_alternativas`:** Lista opcional de strings com formulações equivalentes pré-aprovadas pelo professor (especialmente útil em predicados, ex: formas duais como `~∃x(Px ∧ ~Qx)`).
- **`modo_validacao`:**
  - `'semantico'` (Padrão): Aceita tautologias e $\alpha$-equivalências.
  - `'estrito'`: Aceita apenas igualdade textual direta contra o gabarito principal ou a lista de alternativas (útil quando o professor quer forçar o uso de um conectivo específico).

---

## 4. Experiência do Usuário (UI/UX) no Modo Editor

O componente `FormalizacaoForm.tsx` receberá as seguintes modernizações:

### 4.1 Barra de Ferramentas Acoplada ao Input
- Integrada na borda superior do campo de texto da fórmula (idêntica à da Tabela-Verdade):
  - Quantificadores: `∀`, `∃`
  - Conectivos: `~`, `∧`, `∨`, `→`, `↔`
  - Delimitadores: `(`, `)`
- Clicar em qualquer botão insere o caractere no ponto de foco do cursor.

### 4.2 Auto-extração do Dicionário de Dicas
- Ao digitar a fórmula `∀x(Px → Qx)` ou `P → Q`:
  - O sistema analisa os tokens da fórmula.
  - Detecta predicados (`P`, `Q`) e variáveis (`x`).
  - Gera automaticamente os esqueletos de dicas que ainda não existirem:
    - `"P: [digite o predicado]"`
    - `"Q: [digite o predicado]"`
    - `"x: variável individual"`
- Um botão de atalho `"Sincronizar Dicas com a Fórmula"` permite regenerar ou ajustar a lista com 1 clique.

### 4.3 Teclado Virtual Sincronizado com Distratores
- Todos os operadores presentes na `resposta_esperada` são marcados automaticamente para compor o teclado do aluno.
- Adição de um botão de ação rápida:
  - **"Adicionar Distratores (+2 símbolos)":** Inclui símbolos que não fazem parte da resposta para elevar o desafio pedagógico (ex: adiciona `∨` e `∃` se a questão só usa `∧` e `→`).

### 4.4 Validação Sintática em Tempo Real (Feedback Visual)
- Checagem dinâmica durante a digitação:
  - Parênteses abertos sem fechamento correspondente (`(` $\neq$ `)`).
  - Operadores binários sem operando à esquerda ou direita (`P ∧`, `→ Q`).
  - Operadores consecutivos ilegais (`P → → Q`).
- Exibe mensagem em vermelho e borda de alerta antes que o professor salve a questão.

---

## 5. Critérios de Aceite e Testes (TDD)

### 5.1 Testes Unitários de Equivalência Semântica (`src/lib/__tests__/formalizacao-validator.test.ts`)
- [ ] Valida comutatividade: `P ∧ Q` aceita `Q ∧ P`.
- [ ] Valida comutatividade de disjunção: `P ∨ Q` aceita `Q ∨ P`.
- [ ] Valida condicional vs implicação: `P → Q` aceita `~P ∨ Q`.
- [ ] Valida contrapositiva: `P → Q` aceita `~Q → ~P`.
- [ ] Valida Leis de De Morgan: `~(P ∨ Q)` aceita `~P ∧ ~Q`.
- [ ] Rejeita fórmulas não equivalentes: `P → Q` rejeita `Q → P` (falácia da afirmação do consequente).
- [ ] Rejeita fórmulas com variáveis estranhas: `P ∧ Q` rejeita `P ∧ R`.

### 5.2 Testes Unitários de $\alpha$-Conversão em Predicados
- [ ] Reconhece que `∀x(Px → Qx)` equivale a `∀y(Py → Qy)`.
- [ ] Reconhece que `∃x(Ax ∧ Bx)` equivale a `∃z(Az ∧ Bz)`.
- [ ] Não confunde predicados diferentes: `∀x(Px → Qx)` não equivale a `∀x(Ax → Bx)`.

### 5.3 Testes de Integração do Editor (`Editor.test.tsx`)
- [ ] Verifica a inserção de símbolos pelo teclado virtual acoplado.
- [ ] Verifica a auto-extração de variáveis para o dicionário de dicas.
- [ ] Verifica o salvamento e carregamento de `respostas_alternativas` e `modo_validacao`.

### 5.4 Testes de Integração do Modo Estudo (`Lobby.test.tsx` / `Quiz`)
- [ ] Aluno digita resposta logicamente equivalente no quiz e recebe feedback de sucesso imediato.
- [ ] Aluno digita resposta com outra variável quantificada e recebe feedback de sucesso imediato.

