# [SPEC-007] Dashboard de Análises do Professor (Analytics Centrado no Aluno)

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Implementado e Validado (v2.9.0)
- **Data de Criação:** 2026-09-14
- **Última Atualização:** 2026-09-21
- **Target Release / Milestone:** v2.9.0

---

## 1. Visão Geral & Motivação

### 1.1 Contexto
Na versão inicial da SPEC-007, o painel de análises apresentava métricas agregadas gerais da turma (gráficos de pizza e barras com Recharts, questões mais difíceis globais). No entanto, para o professor corrigir tarefas, acompanhar o rendimento acadêmico e **atribuir notas da faculdade aos estudantes**, é indispensável uma visão individualizada e detalhada de cada aluno matriculado.

### 1.2 Objetivos (Goals)
- [x] Substituir o dashboard geral da rota `/editor/analytics` por um **painel analítico centrado no estudante**.
- [x] Preservar o código do dashboard agregado antigo (`AnalyticsDashboard.tsx`) em uma pasta de arquivo (`legacy/`), sem rotas ativas no site.
- [x] Rastrear e persistir no banco de dados **todas as tentativas de resolução de exercícios**, incluindo respostas incorretas (`isCorrect: false`), permitindo calcular o número de repetições e erros cometidos por aluno.
- [x] Exibir tabela completa de estudantes com métricas individuais de progresso (% concluído e % que falta para terminar), total de erros cometidos e data da última atividade.
- [x] Disponibilizar modal de **"Raio-X do Estudante"** ao clicar em um aluno, detalhando seu desempenho fase a fase e questão por questão (status, quantidade de erros e última resposta submetida).
- [x] Fornecer ferramentas de busca por nome/e-mail, ordenação por colunas e filtros de status para facilitar a navegação em turmas volumosas.

### 1.3 Fora de Escopo (Non-Goals)
- **Cálculo automático de nota (0 a 10):** O sistema deliberadamente **não calculará nota final** para o aluno. A plataforma fornece dados puros, auditáveis e honestos (% concluído, % restante, erros e histórico de respostas), deixando a ponderação e atribuição da nota sob a autoridade pedagógica do professor.
- **Exportação para CSV/Excel nesta versão:** A interface em tela com busca, ordenação e modal detalhado supre a demanda atual de visualização e atribuição de notas.

---

## 2. Roteamento, Permissões e Arquivamento

- **Rota Ativa:** `/editor/analytics`
- **Permissão de Acesso:** Exclusiva para usuários autenticados com `role === Role.TEACHER` via NextAuth e middleware RBAC (`src/middleware.ts`). Alunos que tentarem acessar a rota serão redirecionados para a tela de login ou página inicial.
- **Ponto de Entrada:** Botão "Análises" localizado no cabeçalho do Editor (`src/app/editor/page.tsx`).
- **Arquivamento do Dashboard Legado:**
  - O componente `AnalyticsDashboard.tsx` atual será movido para `src/components/editor/analytics/legacy/LegacyAnalyticsDashboard.tsx`.
  - Nenhuma rota ou link do site apontará para o painel legado, mas o código permanecerá preservado no repositório.

---

## 3. Modelo de Dados & Persistência de Erros

### 3.1 Diagnóstico do Sistema Atual
Anteriormente, o sistema sofria de duas limitações que impediam o rastreio de repetições/erros:
1. **Frontend (`src/app/page.tsx`):** Ao validar uma questão com erro (`isCorrect === false`), apenas disparava o feedback visual (`setFeedback`) e a animação de shake (`triggerShake()`). A função `saveUserSubmissionApi` nunca era acionada para erros.
2. **Banco de Dados (`prisma/schema.prisma`):** A tabela `Submission` possuía a constraint `@@unique([userId, questionId])` e realizava `upsert`. Mesmo que erros fossem enviados, ao acertar a questão em uma tentativa posterior, o registro era sobrescrito, eliminando qualquer histórico de erros passados.

### 3.2 Novo Esquema do Prisma (`prisma/schema.prisma`)
Para permitir o rastreio auditável de todas as repetições e erros:

```prisma
model Submission {
  id         String   @id @default(cuid())
  userId     String
  questionId String
  
  isCorrect  Boolean
  answer     Json     // Resposta bruta enviada pelo aluno naquela tentativa
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  // Remoção de @@unique([userId, questionId])
  // Adição de índice para consultas performáticas por aluno e questão:
  @@index([userId, questionId])
}
```

### 3.3 Ciclo de Submissão
1. **No Acerto:** `src/app/page.tsx` chama `saveUserSubmissionApi(question.id, true, rawAnswer)`. Cria-se um novo registro em `Submission` com `isCorrect: true`.
2. **No Erro:** `src/app/page.tsx` chama `saveUserSubmissionApi(question.id, false, rawAnswer)`. Cria-se um novo registro em `Submission` com `isCorrect: false`.
3. **Cálculo de Conclusão:** Uma questão é considerada concluída pelo aluno se houver pelo menos um registro com `isCorrect: true` associado ao seu `userId`.

---

## 4. Métricas e Agregação de Dados (`src/lib/analytics.ts`)

A função servidora `getStudentAnalyticsOverview()` agrega os dados da seguinte forma:

### 4.1 Métricas por Estudante (`StudentMetricItem`)
Para cada usuário com `role === 'STUDENT'`:
- **Identificação:** `id`, `name`, `email`, `image`.
- **Total de Questões Ativas do Curso:** Total de questões em fases que não estão ocultas (`!fase.oculta && !questao.oculta`).
- **Questões Concluídas:** Quantidade de questões distintas com pelo menos uma submissão `isCorrect: true`.
- **Porcentagem Concluída (% Concluído):** `(questoesConcluidas / totalQuestoesAtivas) * 100`.
- **Porcentagem Restante (% Restante):** `100 - porcentagemConcluida` (garantindo precisão de quanto falta para o aluno terminar).
- **Total de Erros / Repetições:** Contagem de todas as submissões com `isCorrect: false` feitas pelo estudante.
- **Acertos de Primeira (First-Try):** Quantidade de questões concluídas cujo primeiro registro no banco já possuía `isCorrect: true` (0 erros prévios).
- **Última Atividade:** `DateTime` da submissão mais recente do aluno (ou `null` se nunca submeteu nada).

### 4.2 Detalhamento para o Raio-X (`StudentDetailData`)
Estrutura hierárquica por fases e questões para exibição no modal:
- **Fase:**
  - `phaseId`, `titulo`, `totalQuestoes`, `questoesConcluidas`.
- **Questão:**
  - `questionId`, `enunciado`, `topico`, `tipo`.
  - `status`:
    - `'de_primeira'`: Concluída com 0 erros.
    - `'com_dificuldade'`: Concluída após 1 ou mais erros.
    - `'pendente_com_erros'`: Não concluída, mas possui 1 ou mais erros registrados.
    - `'nao_iniciada'`: 0 submissões registradas.
  - `errosCount`: Total de tentativas incorretas nesta questão específica.
  - `tentativasTotal`: Total de submissões nesta questão.
  - `ultimaResposta`: Snapshot do campo `answer` da última tentativa do aluno.

---

## 5. Experiência do Usuário & Telas (UX/UI)

### 5.1 Tela Principal do Analytics (`StudentAnalyticsDashboard`)
1. **Cabeçalho:**
   - Título: "Analytics dos Estudantes".
   - Subtítulo: "Acompanhe o progresso individual e o histórico de tentativas para avaliação acadêmica".
   - Botão "Voltar ao Editor" direcionando para `/editor`.
2. **Cards de KPIs da Turma:**
   - **Total de Estudantes:** Contagem total de alunos cadastrados.
   - **Média de Conclusão da Turma:** Porcentagem média concluída entre todos os alunos.
   - **Concluíram Tudo (100%):** Número de alunos com 100% das questões feitas.
   - **Alunos sem Atividade (0%):** Alunos que ainda não iniciaram nenhuma questão.
3. **Barra de Ferramentas e Filtros:**
   - Campo de busca textual rápida (filtra por Nome ou E-mail em tempo real).
   - Filtros de estado via abas/pills:
     - `Todos` (padrão)
     - `Em Andamento` (> 0% e < 100%)
     - `100% Concluído`
     - `Não Iniciados` (0%)
4. **Tabela de Alunos:**
    - Cabeçalhos clicáveis para ordenação ascendente/descendente:
      - **Estudante** (Nome e E-mail com avatar)
      - **Progresso** (Barra visual com cor dinâmica + labels: ex: `75% concluído • 25% restante`, largura mínima de `210px` e `gap-2` para respiro perfeito)
      - **Questões** (ex: `15/20`)
      - **Erros / Repetições** (Badge numérico indicando total de erros)
      - **Acertos de 1ª** (Badge com taxa de acerto sem re-tentativa)
      - **Última Atividade** (Data relativa ou absoluta: ex: "há 2 horas" ou "18/09/2026")
      - **Ação** (Botão interativo "Ver Raio-X" com ícone de lupa/chevron).

### 5.2 Modal de Detalhamento ("Raio-X do Estudante")
- Ao clicar em uma linha da tabela ou no botão "Ver Raio-X", abre-se um modal responsivo em tela cheia/diálogo amplo:
  - **Header do Modal:** Foto, Nome e E-mail do aluno, progresso geral e total de erros acumulados.
  - **Corpo:** Lista de fases em formato de acordeão (expandir/recolher):
    - **Recolhidas por Padrão:** Todas as fases iniciam fechadas para navegação executiva e panorâmica, exibindo o contador parcial (ex: `1/10 concluídas`).
    - **Acessibilidade:** Botão de acordeão com atributo `aria-expanded` dinâmico e alternância de ícones `ChevronDown`/`ChevronUp`.
  - **Dentro de cada fase:** Cada questão é apresentada com:
    - Enunciado e tópico formatados.
    - Tag/Badge com cores semânticas:
      - `Acertou de primeira` (Verde / `bg-success/10 text-success border-success/20`)
      - `Concluída após N erros` (Âmbar / `bg-warning/10 text-warning border-warning/20`)
      - `Pendente (N erros)` (Vermelho / `bg-error/10 text-error border-error/20`)
      - `Não iniciada` (Cinza / `bg-neutral-800 text-text-muted`)
    - Contador de repetições: "X tentativa(s) incorreta(s)".
    - Card com a **última resposta submetida** pelo estudante (formatada de forma limpa conforme o tipo de questão: tabela-verdade, premissas/conclusão, ou fórmula lógica com `JetBrains Mono`).

---

## 6. Casos de Borda & Tratamento de Erros

| Cenário | Comportamento Esperado |
| :--- | :--- |
| **Aluno registrado no Google Auth mas que nunca abriu o quiz:** | Aparece na tabela com `0% concluído`, `100% restante`, `0 erros` e status "Não iniciado". Permite ao professor cobrar o aluno. |
| **Professor oculta uma fase ou questão:** | O total de questões ativas é recalculado instantaneamente. Questões ocultas não entram na contagem de progresso dos alunos. |
| **Queda de conexão ao submeter erro:** | O hook `saveUserSubmissionApi` captura a falha silenciosamente sem interromper o quiz do aluno (continua permitindo tentar novamente). |
| **Turma com dezenas de estudantes:** | A interface inclui paginação ou virtualização leve com busca/ordenação instantânea no client-side. |

---

## 7. Critérios de Aceite (BDD / Given-When-Then)

- **Cenário 1: Registro de erro e repetição no banco**
  - **Dado** que um aluno responde incorretamente a uma questão e clica em "Validar Resposta",
  - **Quando** o validador identifica o erro,
  - **Então** o sistema exibe o feedback de erro E envia uma requisição `POST /api/submissions` com `isCorrect: false`, registrando a tentativa no banco.

- **Cenário 2: Acerto após múltiplos erros**
  - **Dado** que um aluno errou uma questão 2 vezes e acertou na 3ª tentativa,
  - **Quando** o professor abre o Analytics e visualiza o Raio-X daquele aluno,
  - **Então** a questão é exibida com badge "Concluída após 2 erros", indicando 2 falhas antes do sucesso.

- **Cenário 3: Exibição da métrica de porcentagem restante**
  - **Dado** que o curso possui 20 questões ativas e o aluno completou 15 questões,
  - **Quando** o professor visualiza o card do aluno na tabela,
  - **Então** o progresso exibe claramente "75% concluído" e "25% restante".

- **Cenário 4: Não cálculo de nota arbitrária**
  - **Dado** que o professor acessa o Analytics para avaliar a turma,
  - **Quando** a tabela de estudantes é renderizada,
  - **Então** não há nenhuma coluna de nota arbitrária sugerida pelo sistema; o professor visualiza apenas os fatos objetivos (progresso, repetições e erros) para lançar a nota no sistema da universidade.
