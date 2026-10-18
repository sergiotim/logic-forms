# [SPEC-009] Analytics de Conteúdo, Dificuldade e Diagnóstico Pedagógico

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Implementado e Validado (v2.10.0)
- **Data de Criação:** 2026-10-18
- **Última Atualização:** 2026-10-18
- **Target Release / Milestone:** v2.10.0
- **Especificação Relacionada:** `[SPEC-007]` (`docs/specs/analytics-spec.md`)

---

## 1. Visão Geral & Motivação

### 1.1 Contexto & Problema
Na `[SPEC-007]` (v2.9.0), o painel `/editor/analytics` foi reestruturado para focar no acompanhamento individual de cada estudante (progresso, repetições e modal "Raio-X do Estudante"). Embora essencial para avaliação acadêmica, essa visão responde apenas à pergunta *"Como o aluno X está indo?"*, deixando em aberto perguntas fundamentais para a curadoria pedagógica do professor:
1. **Quais fases e questões são as mais difíceis ou as mais fáceis do curso?**
2. **Onde os estudantes estão travando e desistindo (gargalos)?**
3. **Quais são os erros conceituais mais frequentes cometidos pela turma em cada questão?**
4. **Os alunos estão acertando por compreensão (de primeira) ou por tentativa e erro ("chute rápido")?**

### 1.2 Objetivos (Goals)
- [x] Adicionar uma **segunda perspectiva de visualização ("Conteúdo & Dificuldade")** dentro de `/editor/analytics`, acessível por um seletor segmentado limpo no topo da página, sem poluir a visão atual de estudantes.
- [x] Computar novas métricas pedagógicas para **Fases** e **Questões** diretamente a partir dos dados já existentes no Prisma (`User`, `Phase`, `Question`, `Submission`), com **zero queries extras** ao banco de dados.
- [x] Destacar executivamente a **Fase Mais Desafiadora**, a **Fase Mais Fluida (Mais Fácil)**, o **Maior Gargalo (Questão Crítica)** e a **Taxa Global de Acerto de 1ª**.
- [x] Exibir o **Panorama de Fases** com barras empilhadas de distribuição da turma que funcionam simultaneamente como resumo visual e **filtro interativo ao clique**.
- [x] Fornecer um **Explorador de Questões** com lentes rápidas (`Mais Difíceis`, `Mais Fáceis`, `Gargalos / Travados`, `Todas`), busca textual e filtro por tipo de exercício.
- [x] Disponibilizar o modal **"Raio-X da Questão"** (`QuestionDetailModal.tsx`) ao clicar em qualquer questão, exibindo as **respostas incorretas mais frequentes** da turma, a lista de estudantes por status e alertas de **tentativa e erro ("chute rápido")**.

### 1.3 Fora de Escopo (Non-Goals)
- **Alterações de Schema no Banco de Dados (Zero-DDL):** Nenhuma nova coluna ou tabela será adicionada ao PostgreSQL/Prisma nesta versão; todas as métricas derivam do histórico de submissões existente (`isCorrect`, `answer`, `createdAt`).
- **Gráficos pesados múltiplos na mesma tela:** Para manter a interface limpa, legível e responsiva em mobile e desktop, evita-se o empilhamento de múltiplos gráficos de pizza/barras em favor de barras de distribuição empilhadas (*Stacked Micro-Bars*) integradas aos cards e tabelas.

---

## 2. Princípios de Design e UX/UI ("Zero Poluição Visual")

Para apresentar métricas ricas sem sobrecarregar cognitivamente o professor, a interface segue **Revelação Progressiva (*Progressive Disclosure*) em 3 camadas**:

### 2.1 Camada 1: Alternador de Perspectiva (Segmented Switcher)
No topo do dashboard (`StudentAnalyticsDashboard.tsx`), o professor alterna entre duas visões independentes:
1. **`Estudantes` (Padrão):** Exibe os KPIs de matrícula/conclusão da turma, a tabela de alunos e o modal *Raio-X do Estudante*.
2. **`Conteúdo & Dificuldade`:** Exibe os KPIs de conteúdo, o panorama de fases, o ranking de questões e o modal *Raio-X da Questão*.

### 2.2 Camada 2: Barra de Distribuição Empilhada Semântica (3 Cores + Fundo)
Em vez de exibir 4 colunas numéricas separadas para cada fase ou questão, utiliza-se uma única **Barra Horizontal Empilhada** representando 100% dos estudantes ativos/matriculados:
- **Verde Esmeralda (`bg-success` / `#10B981`):** `% Acertaram de 1ª` (domínio imediato do conceito).
- **Âmbar (`bg-warning` / `#F59E0B`):** `% Concluíram após erros` (aprendizado por persistência).
- **Vermelho (`bg-error` / `#EF4444`):** `% Travados / Pendentes com erro` (tentaram, erraram e ainda não conseguiram resolver).
- **Cinza Escuro (`bg-base` / `#0A0A0A`):** `% Não iniciaram` a questão/fase.

### 2.3 Camada 3: Cards de Fase como Filtro Vivo + Raio-X Sob Demanda
- **Cards de Fase Interativos:** Clicar no card de uma fase no *Panorama de Fases* filtra instantaneamente o *Explorador de Questões* logo abaixo para exibir apenas as questões daquela fase (clicar novamente ou em *"Todas as fases"* remove o filtro).
- **Diagnóstico Profundo no Modal:** As respostas erradas detalhadas (`topErrors`) e a lista nominal de alunos travados na questão ficam encapsuladas no modal **Raio-X da Questão**, mantendo a tabela principal enxuta.

---

## 3. Fórmulas e Métricas Pedagógicas (`src/lib/analytics.ts`)

Consideram-se apenas estudantes (`role === 'STUDENT'`), fases ativas (`!fase.oculta`) e questões ativas (`!questao.oculta`).

### 3.1 Métricas por Questão (`QuestionAnalyticsItem`)

Para uma questão ativa $Q$ e o conjunto de estudantes matriculados $S$ ($N = |S|$):

1. **Classificação dos Estudantes na Questão:**
   - `firstTryCount` ($n_{\text{1a}}$): Alunos que concluíram $Q$ com $0$ erros prévios (`status === 'de_primeira'`).
   - `completedWithErrorsCount` ($n_{\text{dific}}$): Alunos que concluíram $Q$ após $\ge 1$ erro (`status === 'com_dificuldade'`).
   - `stuckCount` ($n_{\text{trav}}$): Alunos que realizaram $\ge 1$ tentativa incorreta em $Q$, mas ainda não possuem acerto (`status === 'pendente_com_erros'`).
   - `notStartedCount` ($n_{\text{virgem}}$): Alunos com $0$ submissões em $Q$ (`status === 'nao_iniciada'`).
   - `attemptedCount` ($n_{\text{tent}}$): $n_{\text{1a}} + n_{\text{dific}} + n_{\text{trav}}$ (total de alunos que interagiram com a questão).
   - `resolvedCount` ($n_{\text{res}}$): $n_{\text{1a}} + n_{\text{dific}}$ (total de alunos que concluíram a questão).

2. **Taxas Percentuais (0 a 100%, 1 casa decimal):**
   - **Taxa de Conclusão (`completionRate`):**
     $$\text{completionRate} = \frac{n_{\text{res}}}{N} \times 100$$
   - **Taxa de Acerto de 1ª (`firstTryRate`):** Medida entre os alunos que tentaram a questão (se $n_{\text{tent}} = 0$, vale $0$):
     $$\text{firstTryRate} = \frac{n_{\text{1a}}}{n_{\text{tent}}} \times 100$$
   - **Taxa de Bloqueio / Gargalo (`stuckRate`):** Proporção de alunos que tentaram e ficaram travados:
     $$\text{stuckRate} = \frac{n_{\text{trav}}}{n_{\text{tent}}} \times 100$$
   - **Taxa de Erro Bruta (`failureRate`):** Proporção de submissões incorretas sobre o total de submissões na questão:
     $$\text{failureRate} = \frac{\text{totalErrors}}{\text{totalAttempts}} \times 100$$

3. **Esforço Médio até o Acerto (`avgAttemptsToSuccess`):**
   - Para cada aluno que concluiu a questão ($n_{\text{res}}$), conta-se o número de tentativas realizadas até (e incluindo) o primeiro acerto.
   - `avgAttemptsToSuccess` é a média aritmética dessas tentativas (ex: `1.0` se todos acertaram de primeira; `3.5` se exigiu múltiplas repetições). Se $n_{\text{res}} = 0$, vale `0`.

4. **Índice Composto de Dificuldade (`difficultyScore` e `difficultyLevel`):**
   - Se `attemptedCount === 0`, `difficultyScore = 0` e `difficultyLevel = 'facil'`.
   - Caso contrário, combina a perda de acerto de 1ª tentativa ($40\%$), a taxa de erro bruta ($40\%$) e a taxa de alunos travados ($20\%$):
     $$\text{difficultyScore} = \text{round}\Big(0.4 \times (100 - \text{firstTryRate}) + 0.4 \times \text{failureRate} + 0.2 \times \text{stuckRate}\Big)$$
   - Classificação semântica (`difficultyLevel`):
     - `'facil'`: `difficultyScore < 25`
     - `'moderada'`: `25 <= difficultyScore < 50`
     - `'dificil'`: `50 <= difficultyScore < 75`
     - `'critica'`: `difficultyScore >= 75` (ou quando `stuckRate >= 50%` com pelo menos 2 alunos travados)

5. **Detector de "Chute Rápido" / Tentativa e Erro (`rapidGuessCount`):**
   - Analisa os timestamps (`createdAt`) das submissões de cada aluno na questão $Q$ (ordenadas cronologicamente).
   - Se um aluno possui duas submissões consecutivas na mesma questão onde a anterior foi incorreta (`!sub[i-1].isCorrect`) e o intervalo de tempo entre elas é **menor que 5 segundos** ($\Delta t < 5000\text{ ms}$), o aluno é marcado com `hasRapidGuess = true` naquela questão.
   - `rapidGuessCount` soma quantos alunos apresentaram comportamento de chute rápido na questão.

6. **Top Respostas Incorretas (`topErrors`):**
   - Agrupa todas as submissões com `isCorrect === false` na questão $Q$ pela representação normalizada de `answer` (string direta ou JSON serializado).
   - Ordena decrescentemente por frequência (`count`) e retorna as **5 respostas erradas mais comuns** com `answer`, `count` e `percentage` (sobre o total de erros da questão).

### 3.2 Métricas por Fase (`PhaseAnalyticsSummaryItem`)

Para cada fase ativa, agrega os dados de suas questões ativas:
- `completionRate`: Média das taxas de conclusão das questões da fase.
- `firstTryRate`: Média das taxas de acerto de 1ª das questões tentadas na fase.
- `failureRate`: `(somaDeErrosDaFase / somaDeTentativasDaFase) * 100`.
- `avgAttemptsToSuccess`: Média do esforço médio das questões resolvidas na fase.
- `stuckStudentsCount`: Quantidade de alunos distintos que possuem pelo menos 1 questão com status `pendente_com_erros` naquela fase.
- `difficultyScore` e `difficultyLevel`: Média dos `difficultyScore` das questões tentadas na fase.
- `distribution`: Percentuais médios (`firstTryPct`, `completedWithErrorsPct`, `stuckPct`, `notStartedPct`) para renderização da barra empilhada do card da fase.

### 3.3 Destaques Executivos Globais (`ContentAnalyticsOverviewData`)

- **`hardestPhase`:** Fase ativa (com pelo menos 1 tentativa registrada) que possui o maior `difficultyScore` (desempate por maior `failureRate`).
- **`easiestPhase`:** Fase ativa (com pelo menos 1 tentativa registrada) que possui o menor `difficultyScore` (desempate por maior `firstTryRate`). Caso haja apenas 1 fase com tentativas no curso, `easiestPhase` pode apontar para ela ou exibir seu índice de fluidez.
- **`criticalQuestion`:** Questão ativa (com pelo menos 1 tentativa) com maior `difficultyScore` (desempate por maior `stuckCount` e maior `totalErrors`).
- **`globalFirstTryRate`:** Percentual global de resoluções do curso que ocorreram na 1ª tentativa sem erros prévios.

---

## 4. Contratos de Tipos TypeScript (`src/types/index.ts`)

```typescript
export type DifficultyLevel = 'facil' | 'moderada' | 'dificil' | 'critica';

export interface QuestionStudentBreakdownItem {
  studentId: string;
  name: string;
  email: string;
  status: QuestionStudentStatus;
  errosCount: number;
  tentativasTotal: number;
  ultimaResposta: unknown;
  hasRapidGuess: boolean;
}

export interface QuestionAnalyticsItem {
  questionId: string;
  phaseId: string;
  phaseTitle: string;
  phaseOrder: number;
  questionOrder: number;
  enunciado: string;
  topico: string;
  tipo: QuestionType | string;
  totalStudents: number;
  attemptedCount: number;
  resolvedCount: number;
  firstTryCount: number;
  completedWithErrorsCount: number;
  stuckCount: number;
  notStartedCount: number;
  completionRate: number;
  firstTryRate: number;
  failureRate: number;
  stuckRate: number;
  avgAttemptsToSuccess: number;
  totalAttempts: number;
  totalErrors: number;
  rapidGuessCount: number;
  difficultyScore: number;
  difficultyLevel: DifficultyLevel;
  topErrors: CommonErrorItem[];
  studentBreakdown: QuestionStudentBreakdownItem[];
}

export interface PhaseAnalyticsSummaryItem {
  phaseId: string;
  titulo: string;
  ordem: number;
  totalQuestions: number;
  attemptedQuestionsCount: number;
  completionRate: number;
  firstTryRate: number;
  failureRate: number;
  totalErrors: number;
  totalAttempts: number;
  stuckStudentsCount: number;
  avgAttemptsToSuccess: number;
  difficultyScore: number;
  difficultyLevel: DifficultyLevel;
  distribution: {
    firstTryPct: number;
    completedWithErrorsPct: number;
    stuckPct: number;
    notStartedPct: number;
  };
}

export interface ContentAnalyticsOverviewData {
  globalFirstTryRate: number;
  totalQuestionsActive: number;
  hardestPhase: PhaseAnalyticsSummaryItem | null;
  easiestPhase: PhaseAnalyticsSummaryItem | null;
  criticalQuestion: QuestionAnalyticsItem | null;
  phases: PhaseAnalyticsSummaryItem[];
  questions: QuestionAnalyticsItem[];
}
```

A interface `StudentAnalyticsOverviewData` passa a incluir `contentAnalytics?: ContentAnalyticsOverviewData` (opcional na assinatura de tipo para preservar retrocompatibilidade com mocks de testes legados, porém sempre populada por `getStudentAnalyticsOverview()`).

---

## 5. Experiência do Usuário & Telas (UX/UI)

### 5.1 Seletor de Perspectiva (`StudentAnalyticsDashboard.tsx`)
- No cabeçalho (ou barra de navegação superior do Analytics), exibe um controle segmentado com dois botões acessíveis:
  - **`Estudantes`** (ícone `Users`)
  - **`Conteúdo & Dificuldade`** (ícone `Layers`)
- Caso `initialData.contentAnalytics` não tenha sido injetado (ex: em um teste unitário antigo que passa apenas `students`), o componente reconstrói automaticamente um `ContentAnalyticsOverviewData` a partir de `initialData.students` via helper client-safe.

### 5.2 Aba "Conteúdo & Dificuldade" (`ContentAnalyticsView.tsx`)

#### Bloco 1: 4 Cards Spotlight (Destaques Executivos)
1. **Fase Mais Desafiadora:** Nome da fase, badge de dificuldade, taxa de erro e média de tentativas.
2. **Fase Mais Fluida (Mais Fácil):** Nome da fase, taxa de acerto de 1ª tentativa e taxa de conclusão.
3. **Maior Gargalo (Questão Crítica):** Enunciado resumido, nome da fase, contagem de alunos travados/taxa de erro e botão rápido `"Inspecionar"` que abre o modal *Raio-X da Questão*.
4. **Acerto de 1ª Global (Clareza):** Percentual global de questões concluídas sem erros prévios na turma.

#### Bloco 2: Panorama de Fases (Funil & Filtro Interativo)
- Lista em grid responsivo os cards de todas as fases ativas na ordem do curso.
- Cada card apresenta:
  - Número e Título da Fase + Badge de Dificuldade (`Fácil`, `Moderada`, `Difícil`, `Crítica`).
  - **Barra Empilhada de 3 Cores** (`1ª Tentativa` em verde, `Após Erros` em âmbar, `Travados` em vermelho) com legenda compacta.
  - Métricas de rodapé: `Conclusão: X%`, `Acerto 1ª: Y%`, `Erros: Z`.
- **Interação:** Ao clicar em um card de fase, ele recebe destaque (`border-primary ring-1 ring-primary/40`) e filtra a tabela de questões abaixo para mostrar apenas as questões daquela fase. Um botão `"Limpar filtro de fase"` permite voltar a ver todas as questões do curso.

#### Bloco 3: Explorador de Questões (Lentes Rápidas & Tabela)
- **Barra de Ferramentas:**
  - **Lentes Rápidas (Pills):**
    - `Mais Difíceis` (padrão — ordena por `difficultyScore` decrescente)
    - `Mais Fáceis` (ordena por `firstTryRate` decrescente e menor `difficultyScore`)
    - `Gargalos (Travados)` (filtra questões com `stuckCount > 0` ou ordena por `stuckCount` decrescente)
    - `Ordem do Curso` (ordena por `phaseOrder` e `questionOrder`)
  - **Filtro por Tipo:** `Todos os Tipos`, `Diagramação`, `Tabela-Verdade`, `Formalização`, `Argumento`, `Múltipla Escolha`.
  - **Busca Textual:** Filtra por enunciado, tópico ou nome da fase.
- **Colunas da Tabela de Questões:**
  1. **Questão & Contexto:** Enunciado, badge da Fase, Tópico e Tipo.
  2. **Dificuldade:** Badge semântico (`Crítica` / `Difícil` / `Moderada` / `Fácil`) + Taxa de Erro (`failureRate%`).
  3. **Distribuição da Turma:** Mini barra empilhada horizontal + resumo numérico compacto (`1ª: X` • `Erros: Y` • `Travados: Z`).
  4. **Esforço & Alertas:** Média de tentativas até acertar (`avgAttemptsToSuccess`x), total de erros e badge de alerta se houver chute rápido (`rapidGuessCount > 0`).
  5. **Ação:** Botão `"Raio-X"` (`Eye` icon).

### 5.3 Modal "Raio-X da Questão" (`QuestionDetailModal.tsx`)
Ao clicar em uma questão ou no botão `"Raio-X"`:
- **Header:** Enunciado completo da questão, Fase, Tópico, Tipo e Badge de Dificuldade.
- **Barra de 4 KPIs da Questão:**
  1. `Taxa de Acerto de 1ª` (`%` e contagem)
  2. `Esforço Médio` (`X.X tentativas` até acertar)
  3. `Alunos Travados` (`N estudantes` pendentes com erro)
  4. `Chute Rápido (< 5s)` (`N estudantes` com submissões em rajada)
- **Corpo em 2 Colunas:**
  - **Coluna Esquerda — Respostas Incorretas Mais Frequentes (`topErrors`):**
    - Lista as respostas erradas mais comuns enviadas pela turma, formatadas com fonte monoespaçada (`JetBrains Mono`), quantidade de ocorrências (`Nx`) e proporção (`Y% dos erros`).
  - **Coluna Direita — Desempenho dos Estudantes na Questão (`studentBreakdown`):**
    - Lista os alunos ordenados por prioridade de atenção pedagógica: primeiro os **Travados (`pendente_com_erros`)**, depois **Concluída após erros (`com_dificuldade`)**, **Acertou de primeira (`de_primeira`)** e **Não iniciada (`nao_iniciada`)**.
    - Exibe para cada aluno seu status, número de erros, badge de `"Chute rápido"` (se aplicável) e sua última resposta enviada.

---

## 6. Casos de Borda & Tratamento de Erros

| Cenário | Comportamento Esperado |
| :--- | :--- |
| **Curso sem nenhuma submissão ainda:** | Todos os cards Spotlight exibem estado neutro (`"Sem dados suficientes"`), `difficultyLevel` inicia como `'facil'` (`0%` erro) e as tabelas mostram `0 tentativas` sem divisão por zero (`NaN`). |
| **Apenas 1 fase ativa possui submissões:** | A fase aparece como referência com suas métricas reais, sem erro de referência nula em `hardestPhase` ou `easiestPhase`. |
| **Questão de Tabela-Verdade ou Diagramação no Top Erros:** | O formatador converte arrays (`["V", "F", ...]`) e objetos (`{"f1": "P", "f2": "C"}`) em strings legíveis (`V | F | ...` ou `f1: P, f2: C`) em vez de exibir `[object Object]`. |
| **Fases ou questões ocultas (`oculta: true`):** | São ignoradas nos cálculos de dificuldade ativa, mantendo total consistência com a visão de estudantes. |

---

## 7. Critérios de Aceite (BDD / Given-When-Then)

- **Cenário 1: Alternância entre visões sem perda de estado**
  - **Dado** que o professor acessa `/editor/analytics`,
  - **Quando** ele clica na aba `"Conteúdo & Dificuldade"`,
  - **Então** a interface alterna para a visão de fases e questões exibindo os cards de destaque (Fase Mais Desafiadora, Fase Mais Fluida, Maior Gargalo) e a tabela de questões.

- **Cenário 2: Identificação de questões mais difíceis e mais fáceis**
  - **Dado** que a Questão A teve 80% de taxa de erro e 1 aluno travado, e a Questão B teve 100% de acerto de 1ª tentativa,
  - **Quando** o professor seleciona a lente `"Mais Difíceis"`, a Questão A aparece no topo;
  - **E quando** seleciona a lente `"Mais Fáceis"`, a Questão B aparece no topo.

- **Cenário 3: Filtragem de questões ao clicar no Card da Fase**
  - **Dado** que existem questões da "Fase 1" e da "Fase 2" na tabela,
  - **Quando** o professor clica no card da "Fase 1" no Panorama de Fases,
  - **Então** a tabela de questões passa a listar exclusivamente as questões pertencentes à "Fase 1".

- **Cenário 4: Abertura do Raio-X da Questão e Top Respostas Incorretas**
  - **Dado** que 3 alunos erraram uma questão de formalização enviando `P ∧ Q` no lugar de `P → Q`,
  - **Quando** o professor clica em `"Raio-X"` nessa questão,
  - **Então** o modal exibe `P ∧ Q` como a resposta incorreta mais frequente com a respectiva contagem e lista a situação individual dos alunos naquela questão.
