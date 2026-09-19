# [SPEC-008] Visibilidade de Fases e Questões

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Draft / Planejamento
- **Data de Criação:** 2026-09-19
- **Target Release / Milestone:** TBD

---

## 1. Contexto & Objetivos

### 1.1 Problema / Motivação

Atualmente, qualquer fase ou questão criada e salva no Modo Editor é imediatamente disponibilizada para os alunos no Modo Estudo. Isso limita o fluxo de trabalho do professor, que não pode:
1. Criar "rascunhos" de questões para finalizar depois.
2. Preparar todo o conteúdo do semestre e ir liberando aos poucos.
3. Ocultar temporariamente uma questão que os alunos reportaram erro, sem perder os dados de submissão.

### 1.2 Objetivos (Goals)

- [ ] Adicionar um controle de visibilidade (Mostrar/Ocultar) individual para **Fases** e **Questões**.
- [ ] No **Modo Editor**, sinalizar visualmente de forma clara quais conteúdos estão ocultos, permitindo que o professor continue interagindo e editando-os normalmente.
- [ ] No **Modo Estudo**, remover completamente os itens ocultos da visão do aluno.
- [ ] Garantir que o progresso do aluno (fases concluídas) e a numeração das fases se ajustem dinamicamente e de forma contínua para compensar as ausências.

### 1.3 Fora de Escopo (Non-Goals)

- Programação automática de publicação (ex: agendar uma fase para ficar visível na próxima terça-feira). A visibilidade será apenas um toggle manual.

---

## 2. Experiência do Usuário & Fluxo (UX/UI)

### 2.1 Visão do Professor (Modo Editor)

- **Identidade Visual:** Fases e questões ocultas não desaparecem do editor. Elas são exibidas na mesma posição da lista, mas com **opacidade reduzida** (ex: `opacity-50`) e um badge ou ícone indicativo (`EyeOff` do Lucide).
- **Controles Rápidos e Detalhados:**
  - Haverá um botão de "olho" (toggle de visibilidade) diretamente no **card da questão/fase** na listagem, permitindo alternar rapidamente com apenas um clique.
  - Haverá também um "switch" detalhado (`Visível para os alunos: Sim/Não`) dentro do **Modal de Edição**.

### 2.2 Visão do Aluno (Modo Estudo)

- **Para Questões Ocultas:**
  - A questão não será renderizada no quiz.
  - **Recálculo de Progresso:** O progresso do aluno na fase é recalculado dinamicamente baseando-se apenas nas questões visíveis restantes. Se o aluno resolveu 3 questões e a fase tinha 5, o progresso era "3 de 5". Se o professor ocultar a questão 5, o progresso passa instantaneamente a ser "3 de 4".
- **Para Fases Ocultas:**
  - A fase não aparece no Lobby.
  - **Numeração Dinâmica:** A numeração visual das fases para o aluno deve ser sempre contínua. Se a "Fase 2" original for ocultada, a "Fase 3" assumirá o nome "Fase 2" na interface do aluno, evitando "buracos" (saltos numéricos) na progressão.

---

## 3. Arquitetura Técnica & Modelo de Dados

### 3.1 Tipos TypeScript

Adicionar uma nova propriedade de estado, como `oculta: boolean` (ou `isOculta`), nas interfaces `Phase` e `BaseQuestion`.

```typescript
// src/types/index.ts

export interface Phase {
  id: string;
  titulo: string;
  icone: LucideIconName;
  questoes: Question[];
  oculta?: boolean; // NOVO: undefined ou false = visível. true = oculta.
}

export interface BaseQuestion {
  id: string;
  tipo: QuestionType;
  topico: string;
  enunciado: string;
  oculta?: boolean; // NOVO: undefined ou false = visível. true = oculta.
}
```
*Nota: optou-se por usar um campo opcional `oculta?: boolean` para manter compatibilidade com versões antigas do state do localStorage sem forçar uma migração complexa; se for `undefined`, considera-se visível.*

### 3.2 Lógica de Renderização

- **Modo Editor:** Lista o `state.phases` e `phase.questoes` integralmente, independente do status, apenas aplicando classes CSS condicionais (`className={oculta ? 'opacity-50' : ''}`).
- **Modo Estudo (Seletores/Filtros):**
  - No Lobby, as fases exibidas derivam de `state.phases.filter(p => !p.oculta)`.
  - No Quiz, as questões da fase atual derivam de `phase.questoes.filter(q => !q.oculta)`.
  - O cálculo do índice e "Fase Atual" no UI do aluno deve utilizar a array filtrada para garantir a numeração dinâmica.

---

## 4. Casos de Borda & Tratamento de Erros

| Cenário | Comportamento |
| :--- | :--- |
| **Aluno no meio do quiz, e o professor oculta a questão seguinte:** | O client-side aplicará o novo state (via polling ou sync em tempo real se existir, ou no refresh da página). Se a página atualizar, a questão já será filtrada. |
| **Aluno resolveu a questão, e depois ela foi oculta:** | A questão deixa de contar no divisor total da fase. O progresso do aluno é recalculado (ex: completou 4 de 5; uma não-resolvida é oculta; progresso sobe para 4 de 4 = 100% completo). |
| **Todas as questões de uma fase são ocultas:** | No Lobby, o card da fase pode exibir "Sem questões disponíveis" e ter o botão "Iniciar" desabilitado, idêntico a uma fase vazia. |
| **Professor tenta excluir uma questão/fase oculta:** | O comportamento é igual ao de itens visíveis, usando o mesmo modal de confirmação. |

---

## 5. Critérios de Aceite (Given / When / Then)

- **Cenário 1: Ocultar Fase pelo Editor**
  - **Dado** que há 3 fases (1, 2, 3),
  - **Quando** o professor clica em "Ocultar" no card da Fase 2,
  - **Então** o card da Fase 2 fica com opacidade reduzida no Editor, e no Lobby do Aluno apenas aparecem 2 Fases (a Fase 3 passa a se chamar visualmente "Fase 2").

- **Cenário 2: Ocultar Questão afeta Progresso**
  - **Dado** que um aluno completou 2 de 3 questões ativas,
  - **Quando** o professor oculta a 3ª questão (não resolvida),
  - **Então** o progresso da fase para aquele aluno passa a ser 100% (2/2) e a fase marca como concluída.

- **Cenário 3: Toggle Rápido**
  - **Dado** que o professor está vendo a lista de questões da fase,
  - **Quando** ele clica diretamente no ícone de "olho" no card da questão,
  - **Então** a visibilidade é alterada e salva no localStorage instantaneamente sem abrir nenhum modal.

