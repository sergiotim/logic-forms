# [SPEC-007] Especificação do Dashboard de Análise (Analytics)

## 1. Visão Geral
Esta especificação define a arquitetura, estrutura de UI e os fluxos de dados para a nova página de Análises do Professor (`/editor/analytics`). Este painel será exclusivo para usuários com a *role* `TEACHER` e fornecerá métricas detalhadas sobre o engajamento da turma, progresso global e pontos de dificuldade em questões e tipos de exercícios.

## 2. Roteamento e Localização
- **Rota:** `/editor/analytics`
- **Acesso:** O acesso será feito através de um novo botão posicionado no header global do Editor de Conteúdo (`/editor`).
- **Proteção:** A rota utilizará o middleware de proteção existente para garantir que apenas usuários autenticados com `role === TEACHER` possam acessá-la.

## 3. Arquitetura de Dados (Data Fetching)
A página será desenvolvida primariamente como um **React Server Component (RSC)**.
- **Vantagem:** Permite chamadas diretas ao banco de dados utilizando a instância do Prisma (`src/lib/prisma.ts`), eliminando a necessidade de criar novas rotas em `/api/analytics` e reduzindo o *waterfall* de requisições no cliente.
- **Passagem de Dados:** Os dados brutos processados pelo servidor (métricas globais e por fase) serão repassados via `props` para componentes de cliente que cuidarão apenas da interatividade (filtros e gráficos).

## 4. Escopo das Métricas
A interface trará tanto uma visão **Global** quanto uma visão **Por Fase**, dispostas na mesma página para facilitar a análise comparativa.

### 4.1 Métricas Globais (Overview)
- **Total de Alunos Ativos:** Número de usuários distintos com `role === STUDENT` que possuem submissões.
- **Taxa Global de Conclusão:** Média de fases/questões finalizadas por aluno.
- **Desempenho por Tipo de Questão:** Gráfico comparando a taxa de acerto entre `DIAGRAMACAO`, `TABELA_VERDADE` e `FORMALIZACAO`.

### 4.2 Métricas Específicas por Fase / Questão
- **Seleção de Fase:** Um seletor (`select` ou abas) para que o professor foque em uma fase específica.
- **Mapa de Dificuldade:** Lista de questões da fase ranqueadas pelo número de falhas (`isCorrect === false`).
- **Análise Qualitativa de Erros:** Exibição das "respostas erradas mais comuns" extraídas do campo `answer` (JSON) na tabela `Submission`, ideal para correções pedagógicas.

## 5. Visualização de Dados e Dependências
- **Biblioteca de Gráficos:** Será introduzida a biblioteca `recharts` no projeto para viabilizar gráficos interativos, responsivos e acessíveis.
- **Tipos de Gráficos Previstos:**
  - Gráfico de Barras (*BarChart*): Para comparar o desempenho/taxa de acerto entre fases ou tipos de questões.
  - Gráfico de Linha (*LineChart*): Opcional, para visualizar a linha do tempo de submissões ao longo dos dias (`createdAt`), identificando picos de estudo.

## 6. Alterações Sugeridas (Futuras) no Banco
Atualmente, a entidade `Submission` possui uma *constraint* `@@unique([userId, questionId])`. Como estamos persistindo apenas o estado final de uma questão (ou a última tentativa salva), a análise não cobrirá o "número de tentativas por aluno" nesta fase inicial. Caso essa métrica seja desejada, sugere-se, no futuro, a inclusão de uma coluna `attemptsCount` na modelagem do Prisma.

