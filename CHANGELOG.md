# Changelog

Este arquivo documenta todas as alterações notáveis, implementações de features e correções de usabilidade (UI/UX) realizadas no projeto Lógica Dinâmica.

O formato baseia-se no padrão da indústria para registros de alterações (Keep a Changelog).

## [2.9.0] - 2026-09-21 (Analytics Centrado no Estudante e Rastreio de Repetições/Erros - SPEC-007)

### Adicionado (Added)
- **Dashboard Analítico Centrado no Estudante (`/editor/analytics`):**
  - Painel dedicado ao professor para acompanhar o progresso individual de cada aluno da turma e subsidiar a atribuição de notas acadêmicas.
  - **KPIs da Turma:** Indicadores superiores com Total de Estudantes matriculados, Média Geral de Conclusão da Turma, Alunos que concluíram 100% e Alunos não iniciados (0%).
  - **Tabela Dinâmica de Estudantes:**
    - Exibição de Nome, E-mail, Avatar, Progresso duplo (`% concluído` e `% restante`), Questões concluídas/ativas, Total de Erros/Repetições, Acertos de 1ª tentativa e Data da Última Atividade.
    - Ordenação bidirecional por qualquer coluna da tabela.
    - Filtros de status rápidos em abas: `Todos`, `Em Andamento`, `100% Concluído` e `Não Iniciados`.
    - Busca textual em tempo real por nome ou e-mail.
- **Modal de Diagnóstico "Raio-X Acadêmico do Estudante" (`StudentDetailModal.tsx`):**
  - Visão detalhada do histórico de tentativas do estudante por fase e por exercício.
  - **Acordeões de Fases Recolhidos por Padrão:** Navegação limpa e executiva com contadores parciais de conclusão por fase (ex: `1/10 concluídas`), acessível via teclado e leitor de tela (`aria-expanded`).
  - **Classificação Pedagógica por Questão:**
    - 🟢 *Acertou de primeira* (resolvida na 1ª tentativa com 0 erros prévios).
    - 🟡 *Concluída após N erros* (resolvida com sucesso após repetições incorretas).
    - 🔴 *Pendente com N erros* (tentada pelo aluno com erros, mas ainda não resolvida).
    - ⚪ *Não iniciada* (nenhuma submissão realizada).
  - **Auditoria da Última Resposta Submetida:** Exibição do valor bruto enviado pelo aluno em sua última tentativa (tabela-verdade, premissas/conclusão, alternativa ou fórmula lógica).
- **Persistência Auditável de Tentativas e Erros (`prisma/schema.prisma` e `db.ts`):**
  - Registro de histórico completo no Neon PostgreSQL: cada clique em "Validar Resposta" no modo estudo (`src/app/page.tsx`), seja acerto ou erro (`isCorrect: false`), é gravado atomicamente como uma linha na tabela `Submission`.
  - Remoção da restrição `@@unique([userId, questionId])` e adoção de índice performático `@@index([userId, questionId])`.
  - Suporte total ao tipo de dado JSON do Prisma sem incompatibilidades TypeScript em `src/types/index.ts`.
- **Soberania Pedagógica do Professor:**
  - O sistema deliberadamente não gera notas arbitrárias ou fictícias (0 a 10), fornecendo fatos objetivos e auditáveis para que o professor lance as notas no sistema institucional conforme seus próprios critérios.

### Modificado (Changed)
- **Refinamento Visual da Coluna de Progresso:**
  - Largura mínima da coluna ajustada para `min-w-[210px]` no cabeçalho e nas células.
  - Adicionado espaçamento com `gap-2` e `shrink-0` nas legendas `% concluído` e `% restante`, garantindo respiração visual mesmo para alunos com `0% concluído` e `100% restante`.
- **Arquivamento do Painel Agregado Antigo:**
  - O componente anterior baseado em gráficos Recharts globais foi preservado e arquivado em `src/components/editor/analytics/legacy/LegacyAnalyticsDashboard.tsx`, sem rotas ativas ou links públicos na interface.

### Testes (Tests)
- **Expansão da Suíte de Testes Automatizados TDD:**
  - `src/lib/__tests__/studentAnalytics.test.ts`: 7 testes unitários cobrindo agregação individual, acertos de primeira, contagem de erros, ordenação e cálculo de percentuais.
  - `src/__tests__/StudentAnalytics.test.tsx`: 8 testes de integração validando renderização de KPIs, tabela, ausência de notas inventadas, busca, filtros de status, acordeões fechados por padrão e abertura do Raio-X.
  - `src/__tests__/submissionErrorTracking.test.tsx`: Teste de integração do ciclo de vida de persistência de tentativas incorretas no banco.
  - Suíte total do projeto expandida para **291 testes** em **24 suítes** com 100% de aprovação.

## [2.8.2] - 2026-09-21 (Ergonomia Mobile em Formalização de Argumentos: Teclado na Base, Sem Scroll Lateral & Botão Apagar)

### Adicionado (Added)
- **Ergonomia Mobile e Otimização de Espaço Vertical (`FormalizacaoArgumento.tsx`, `Formalizacao.tsx` e `page.tsx`):**
  - **Migração do Botão Validar para a Navbar:** O botão de validação (`Validar Resposta` / `Próxima Questão`) em questões de formalização e argumento foi transferido para a **Navbar superior** à direita. A barra de rodapé inferior foi completamente removida nesses exercícios, recuperando ~70-80px de espaço vertical útil no mobile.
  - **Feedback Flutuante Centralizado (Toast):** Alertas de erro, avisos de validação e confirmação de acerto agora aparecem em um toast flutuante suave (`fixed top-14 sm:top-16 z-50`) logo abaixo da navbar, evitando qualquer sobreposição ou empurrão do conteúdo.
  - **Teclado Virtual na Base (`sticky bottom-0 z-20`):** Reposicionamento do teclado virtual único para a base da tela, rente à borda inferior. Posicionamento natural na zona dos polegares (*thumb-zone*), permitindo digitar enquanto os olhos acompanham as premissas e a conclusão no centro da tela.
  - **Eliminação de Rolagens Laterais (Zero Scroll Horizontal):**
    - Dicas agora são renderizadas diretamente em chips compactos com quebra fluida (`flex-wrap gap-1.5`) sem o prefixo/título "Léxico:", reduzindo o ruído visual e eliminando qualquer necessidade de rolagem lateral.
    - O teclado virtual distribui as teclas e o botão de apagar em linhas equilibradas e simétricas (`keyboardRows`), garantindo que nenhuma tecla fique isolada em uma linha avulsa e mantendo espaçamento touch ideal sem scroll horizontal.
  - **Supressão do Teclado Nativo do Smartphone (`inputMode="none"`):** Todos os inputs de formalização foram configurados com `inputMode="none"`, impedindo que o teclado virtual do sistema operacional (iOS/Android) se abra ao tocar no campo, garantindo que o estudante utilize exclusivamente o teclado virtual da aplicação.
  - **Botão de Apagar (Backspace):** Adicionada tecla dedicada com ícone `Delete` (`⌫`) para apagar o caractere imediatamente anterior ao cursor (ou a seleção ativa) mantendo o foco e o cursor no campo ativo.
  - **Tipografia e Espaçamento Responsivos no Quiz:** Escala de fonte responsiva (`text-sm sm:text-lg md:text-2xl`) com espaçamento entre parágrafos (`gap-1.5 md:gap-4`) e suporte a elementos Markdown com cor branca forçada (`[&_p]:text-white [&_strong]:text-white [&_em]:text-white`).
  - **Visibilidade Integral sem Scroll:** Em telas de smartphone padrão (iPhone/Android), o enunciado, as dicas, a premissa 1, a conclusão e o teclado virtual cabem simultaneamente na tela com máximo aproveitamento vertical.
- **Prevenção de Blur e Retenção de Foco:**
  - Adição de `onMouseDown={(e) => e.preventDefault()}` nos botões do teclado para evitar perda de foco e cursor durante toques repetidos.

### Corrigido (Fixed)
- **Correção da Cor Preta do Enunciado no Desktop (`globals.css`, `page.tsx` e `QuestionPreview.tsx`):**
  - **Causa Raiz:** No Tailwind CSS v4, a declaração de `--color-base: #0A0A0A` dentro de `@theme` gerava automaticamente utilitários de cor como `.text-base { color: var(--color-base) }` e `.sm:text-base { color: var(--color-base) }`. Ao aplicar `sm:text-base` para definir o tamanho de fonte em telas maiores (>= 640px), o Tailwind aplicava a cor preta (`#0A0A0A`), sobrepondo a classe `text-white` no desktop e tornando o enunciado quase invisível sobre o fundo escuro (`#171717`).
  - **Solução:**
    1. Neutralizado o utilitário `.text-base`, `.sm:text-base` e `.md:text-base` em `globals.css` para sempre possuir `color: inherit; font-size: 1rem; line-height: 1.5rem;`.
    2. Substituído `sm:text-base` por `sm:text-lg` e adicionados modificadores explícitos `[&_p]:text-white [&_strong]:text-white [&_em]:text-white [&_span]:text-white` em `src/app/page.tsx` e `QuestionPreview.tsx`.

- **Suíte de Testes Automatizados TDD:**
  - `src/__tests__/Lobby.test.tsx`: Teste de integração verificando a renderização do botão Validar dentro da `<nav>`, ausência do rodapé inferior e aparição do toast flutuante de feedback em questões de formalização.
  - `src/components/questions/__tests__/FormalizacaoArgumento.test.tsx`: Testes cobrindo dicas no topo, teclado ancorado na base, ausência de scroll lateral (`not.toHaveClass('overflow-x-auto')`), configuração de `inputMode="none"`, funcionalidade do botão de apagar (Backspace) e retenção de foco.
  - `src/components/questions/__tests__/Formalizacao.test.tsx`: Testes de Backspace e `inputMode="none"` na formalização simples.

## [2.8.1] - 2026-09-21 (Gestão Automática de Variáveis no Teclado de Formalização)

### Corrigido (Fixed)
- **Inserção e Remoção Reativa de Variáveis no Teclado Virtual (`FormalizacaoForm` e `FormalizacaoArgumentoForm`):**
  - Variáveis e predicados atômicos (`[A-Za-z]`) agora são extraídos e atualizados de forma totalmente automática no teclado virtual a partir da resposta esperada digitada pelo professor.
  - Ao apagar ou corrigir uma variável (ex: substituindo `R` por `F`), as variáveis órfãs são automaticamente expurgadas do teclado virtual em tempo real, sem necessidade de acionar a auto-sugestão.
  - No formulário de argumentos, a remoção de premissas inteiras (`handleRemovePremissa`) sincroniza o teclado excluindo variáveis que deixaram de existir no argumento.
- **Desacoplamento Estrito do Teclado em Relação às Dicas (`Formalizacao.tsx` e `FormalizacaoArgumento.tsx`):**
  - O teclado virtual do estudante é alimentado **estritamente pela fórmula da resposta esperada** (e premissas/conclusão em argumentos). Variáveis presentes unicamente no campo `dicas` que não componham o gabarito não são inseridas como teclas no teclado virtual.
- **Prioridade Posicional das Variáveis no Teclado do Aluno:**
  - As variáveis e predicados agora são renderizados **obrigatoriamente no início do teclado virtual** (ex: `G`, `L`, seguidos pelos operadores conectivos `~`, `∧`, `∨`, `→` e parênteses `(`, `)`).
- **Limpeza Visual do Modo Editor:**
  - A seção "Teclado Virtual do Aluno" nos formulários de edição (`FormalizacaoForm.tsx` e `FormalizacaoArgumentoForm.tsx`) agora exibe exclusivamente os conectivos lógicos (`AVAILABLE_KEYS`) para controle manual de atalhos e distratores pelo professor, ocultando os botões de variáveis para evitar poluição visual, já que seu ciclo de vida é gerido de forma automática e transparente.

### Adicionado (Added)
- **Cobertura de Testes Automatizados TDD:**
  - `src/components/editor/forms/__tests__/FormalizacaoForm.test.tsx`: Testes de adição/remoção reativa de variáveis, ordenação inicial das variáveis no array do teclado e ocultação de botões de variáveis no modo de edição.
  - `src/components/questions/__tests__/Formalizacao.test.tsx`: Teste garantindo que variáveis são renderizadas no início do teclado na visão do aluno e que dicas não poluem o teclado com variáveis inexistentes na fórmula.
  - `src/lib/__tests__/formalizacao.test.ts`: Teste garantindo que `suggestVirtualKeyboard` posiciona variáveis antes dos operadores conectivos.

## [2.8.0] - 2026-09-19 (Questões de Múltipla Escolha e Refatoração do Banco)

### Adicionado (Added)
- **Novo Tipo de Questão: Múltipla Escolha (`multipla_escolha`):** Exercício clássico de seleção única, com renderização de opções como cartões expansíveis e suporte a Markdown.
- **Sistema de Anti-Cola (Fisher-Yates Shuffle):** O frontend agora embaralha automaticamente as posições das opções toda vez que o componente é renderizado para o aluno, inibindo respostas fixas por posição.
- **Formulário de Edição Dinâmico (`MultiplaEscolhaForm.tsx`):** Professor pode adicionar e remover n-opções e marcar visualmente o gabarito.

### Corrigido (Fixed)
- **Sincronização de Banco de Dados (`db.ts`):** Adicionado suporte explícito na camada de integração do Prisma ORM aos tipos `MULTIPLA_ESCOLHA` e `FORMALIZACAO_ARGUMENTO`, corrigindo o bug de herança silenciosa como diagrama.

## [2.7.0] - 2026-09-19 (Visibilidade e Ocultação de Fases e Questões - SPEC-008)

### Adicionado (Added)
- **Controle de Visibilidade de Fases e Questões:**
  - Botão de alternância rápida de visibilidade (`Eye` / `EyeOff`) diretamente no card de fases na barra lateral (`src/components/editor/PhaseSidebar.tsx`).
  - Botão de alternância rápida de visibilidade no card de questões da fase (`src/components/editor/QuestionCard.tsx`).
  - Caixa de seleção "Visível para os alunos" integrada ao cabeçalho do formulário de edição de questão (`src/components/editor/QuestionFormModal.tsx`).
- **Feedback Visual no Modo Editor:**
  - Fases e questões ocultadas permanecem visíveis e editáveis pelo docente, identificadas com opacidade reduzida (`opacity-50`) e ícones de visibilidade distintivos.
- **Modo Estudo Dinâmico (`src/app/page.tsx`):**
  - Filtragem instantânea das fases (`visiblePhases`) e questões (`visibleQuestoes`) para o estudante.
  - **Numeração Contínua de Fases:** Eliminação de saltos numéricos na interface do aluno quando fases intermediárias estão ocultas (ex: se a Fase 2 estiver oculta, a Fase 3 torna-se visualmente "Fase 2").
  - **Recálculo Dinâmico de Progresso:** Progresso e badges de conclusão da fase recalculados com base exclusiva no total de questões visíveis.
- **Persistência Zero-DDL no Neon PostgreSQL (`src/lib/db.ts`):**
  - Compatibilidade e paridade imediata entre as branches de banco de dados (`dev` e `prod`) sem necessidade de migrações DDL (`prisma db push` / `prisma migrate`).
  - A visibilidade de questões é armazenada diretamente dentro da coluna `content Json`.
  - A visibilidade de fases é serializada de forma transparente através do sufixo `:oculta` no campo `icon` do modelo `Phase` (ex: `Network:oculta`), sendo extraída e formatada automaticamente nas funções `getPhasesFromDb()`, `syncSinglePhaseToDb()` e `syncPhasesToDb()`.
- **Suíte de Testes Automatizados TDD:** 15 novos testes adicionados em `Editor.test.tsx` e `Lobby.test.tsx` cobrindo alternância de visibilidade, estilização com opacidade, ausência no Modo Estudo, recálculo de progresso e numeração sequencial. Suíte total do projeto expandida para **246 testes** e **17 test suites** com 100% de aprovação.
- **Documentação Técnica:** Especificação de requisitos e modelo de dados em [[SPEC-008] Visibilidade de Fases e Questões](docs/specs/visibility-spec.md).

## [2.6.0] - 2026-09-19 (Sincronização Granular de Fases/Questões & Neon Serverless Driver Adapter)

### Adicionado (Added)
- **Endpoint Granular de Sincronização de Fase (`PUT /api/phases/[id]`):** Rota dedicada para atualização atômica de uma fase ativa e suas questões associadas, protegida por RBAC (`role: TEACHER`).
- **Funções de Persistência Granular (`src/lib/db.ts` e `src/lib/api.ts`):**
  - `syncSinglePhaseToDb(phase: Phase)`: Transação atômica escopada estritamente à fase ativa, mantendo o `order` da fase existente e realizando upsert concorrente apenas das questões da fase via `Promise.all`.
  - `saveSinglePhaseApi(phase: Phase)`: Cliente de integração HTTP apontando para `PUT /api/phases/[id]`.
- **Neon Serverless Driver Adapter (`@prisma/adapter-neon` e `@neondatabase/serverless`):** Integração do driver serverless da Neon com WebSockets (`ws`) no `src/lib/prisma.ts`, eliminando a dependência de conexões TCP estaduais travadas no PgBouncer em funções Serverless da Vercel.
- **Registro Formal de Decisão de Arquitetura (ADR-001):** Documento técnico formal detalhando o problema, análise de causa raiz (RCA) e especificações em `docs/specs/adr-001-granular-sync-neon-adapter.md`.

### Otimizado (Performance)
- **Redução Drástica de Sobrecarga de Rede e Banco:** Operações cotidianas no Modo Editor (`handleUpdatePhase`, `handleSaveQuestion`, `handleDeleteQuestion`, `handleReorderQuestions`) agora enviam apenas o payload da fase ativa, reduzindo em mais de 75% o tráfego de dados e garantindo tempos de resposta inferiores a 300ms.
- **Eliminação de Erros de Timeout em Produção:** Prevenção definitiva de falhas `PrismaClientKnownRequestError [P2028]: Transaction not found` causadas por reescrita monolítica de todo o currículo em ambientes serverless.
- **Resolução da Issue #1:** Closes #1.

## [2.5.0] - 2026-09-15 (Formalização de Argumentos Dedutivos, UI/UX Alinhada & Quantificadores com Alpha-Conversão)

### Adicionado (Added)
- **Novo Tipo de Questão: Formalização de Argumentos (`formalizacao_argumento`):** Exercício avançado no qual o estudante segmenta o texto, identifica as premissas independentemente da ordem e formaliza a conclusão dedutiva.
- **Motor de Validação de Argumentos (`src/lib/formalizacao-argumento.ts`):**
  - Validação de correspondência de premissas baseada em pool independente de ordem (permutação livre).
  - Feedback pedagógico granular para excesso ou escassez de premissas identificadas pelo aluno.
  - Suporte completo a **Lógica de Predicados com Quantificadores (`∀`, `∃`)** e $\alpha$-normalização de variáveis ligadas (`normalizeQuantifiedVariables`).
  - Avaliação de equivalência semântica proposicional ($A \leftrightarrow B$) no modo semântico e verificação textual rigorosa no modo estrito.
- **Redesign e Alinhamento Estrito de UI/UX no Editor (`src/components/editor/forms/FormalizacaoArgumentoForm.tsx`):**
  - Adoção das mesmas nomenclaturas (`Enunciado`, `Tópico`, `Dicionário de Variáveis (Dicas)`, `Teclado Virtual do Aluno`).
  - Seletor de rigor compacto no canto direito da seção de fórmulas: dropdown com opções `Semântico (Automático)` e `Estrito (Exato)`.
  - Barra de atalhos de símbolos acoplada diretamente à borda superior de cada premissa e da conclusão: `Símbolos: [ ∀ ] [ ∃ ] [ ~ ] [ ∧ ] [ ∨ ] [ → ] [ ↔ ] [ ( ] [ ) ]`.
  - Validação sintática em tempo real com `validateFormalizacaoSyntax`, alertando visualmente parênteses desbalanceados ou operadores soltos.
  - Botão `✨ Sincronizar Dicas` para extrair variáveis e predicados do argumento para o dicionário automaticamente (`extractFormalizacaoDicas`).
  - Botão `🪄 Auto-sugerir` para sugerir operadores e distratores para o teclado virtual (`suggestVirtualKeyboard`).
- **Componente do Estudante com Foco Ativo (`src/components/questions/FormalizacaoArgumento.tsx`):**
  - Teclado lógico virtual global único no topo do contêiner, direcionando os caracteres dinamicamente para o campo ativo em foco (premissa ou conclusão).
  - Extração inteligente de predicados maiúsculos (`[A-Z]`) e variáveis/constantes minúsculas (`[a-z]`), com parênteses `(` e `)` garantidos.
  - Adição e remoção dinâmica de campos de premissa com atalhos acessíveis.
- **Nova Suíte de Testes Automatizados TDD (`FormalizacaoArgumentoForm.test.tsx` e `formalizacao-argumento.test.ts`):** 25 testes cobrindo integração do formulário, validação sintática, comutatividade de premissas, quantificadores e equivalência lógica. Suíte total expandida para **231 testes** e **16 test suites** com 100% de aprovação.
- **Documentação Técnica:** Especificação técnica completa [[SPEC-008]](docs/specs/formalizacao-argumento-spec.md) e atualização do schema JSON em `docs/Estrutura das Questões (JSON).md`.

## [2.4.0] - 2026-09-14 (Dashboard de Análises do Professor & Diagnóstico Qualitativo com Recharts)

### Adicionado (Added)
- **Página do Dashboard de Análises (`/editor/analytics`):** Rota dedicada e segura para docentes acompanharem métricas globais e diagnósticos detalhados de fases.
- **Arquitetura React Server Component (RSC) (`src/app/editor/analytics/page.tsx`):** Acesso direto e performático ao Prisma ORM sem intermediários ou APIs adicionais.
- **Visualização de Dados com Recharts (`src/components/editor/analytics/AnalyticsDashboard.tsx`):** Gráfico de barras interativo demonstrando a taxa de sucesso acumulada por tipo de questão (`Diagramação`, `Tabela-Verdade` e `Formalização`).
- **Cards de Métricas Globais (KPIs):** Indicadores de alunos ativos com submissões, taxa média de conclusão da turma e total de fases monitoradas.
- **Ranking das Questões Mais Difíceis:** Tabela com ordenação decrescente de questões por volume de submissões incorretas e taxa de erro.
- **Análise Qualitativa de Erros Conceituais:** Motor pedagógico que agrupa e calcula a frequência de respostas incorretas enviadas pelos alunos (campo `answer` JSON), permitindo ao professor identificar distorções comuns.
- **Filtro Dinâmico por Fase:** Seletor de fases para alternar diagnósticos de maneira instantânea na interface.
- **Atalho de Navegação no Editor (`src/app/editor/page.tsx`):** Botão "Análises" com ícone `BarChart3` adicionado ao header do Editor.
- **Proteção RBAC Completa (`src/middleware.ts`):** Rota `/editor/analytics` restrita a usuários com perfil `TEACHER`, com redirecionamento de estudantes para `/`.
- **Suíte de Testes Automatizados TDD (`analytics.test.ts`, `Analytics.test.tsx`, `middleware.test.ts`):** 16 novos testes automatizados cobrindo agregações no banco, renderização de UI, filtros e regras de acesso no middleware.
- **Documentação Técnica e de Produto:** Especificação [[SPEC-007]](docs/specs/analytics-spec.md) e guia de arquitetura [[docs/analytics-dashboard.md]](docs/analytics-dashboard.md).

## [2.3.0] - 2026-09-14 (Autenticação NextAuth, Banco Neon DB, Persistência de Submissões & Exportação em Lote)

### Adicionado (Added)
- **Autenticação com NextAuth.js e Google OAuth (`src/lib/auth.ts`):** Suporte a login seguro com contas Google institucionais e pessoais autorizadas.
- **Controle de Acesso Baseado em Papéis (RBAC):** Papéis `STUDENT` e `TEACHER` definidos no schema do Prisma e identificação de docentes via variáveis de ambiente `TEACHER_EMAILS` e `ADMIN_EMAILS`.
- **Proteção de Rotas com Middleware (`src/middleware.ts`):** Redirecionamento automático de usuários não logados para `/login` e restrição estrita da rota `/editor` para usuários com perfil `TEACHER`.
- **Página de Login Dedicada (`src/app/login/page.tsx`):** Interface dark mode integrada ao Brand Kit com logo estilizada, badge de versão e botão "Entrar com Google".
- **Menu Suspenso de Perfil (`src/components/ui/ProfileMenu.tsx`):** Componente de perfil na barra de navegação com avatar do Google, exibição do papel (`PROFESSOR` / `ESTUDANTE`), acesso exclusivo ao Modo Editor para docentes e botão de logout.
- **Banco de Dados Relacional Neon PostgreSQL (`prisma/schema.prisma`):** Modelos `User`, `Account`, `Session`, `VerificationToken`, `Phase`, `Question` e `Submission`.
- **Persistência Atômica de Fases e Questões (`src/lib/db.ts` e `/api/phases`):** Endpoints `GET /api/phases` (com auto-seed fallback) e `POST /api/phases` para salvar e sincronizar o conteúdo diretamente no PostgreSQL.
- **Persistência de Submissões e Progresso do Aluno (`/api/submissions`):** Tabela `Submission` com chave única composta `@@unique([userId, questionId])` e deleção em cascata (`onDelete: Cascade`), garantindo idempotência e integridade referencial.
- **Cálculo Dinâmico de Progresso por Questão (Sem Falso Positivo):** Progresso de fases derivado diretamente das submissões de cada questão por UUID. A remoção e recriação de fases pelo professor não gera falsos positivos de conclusão para o aluno.
- **Badges de Progresso no Lobby (`src/app/page.tsx`):** Exibição de status detalhado (`0/N concluídas`, `X/N concluídas` ou `Concluído` com ícone de check).
- **Exportação em Lote de Todas as Fases ("Exportar Tudo"):** Botões na barra lateral (`PhaseSidebar.tsx`) e no cabeçalho do editor (`PhaseEditor.tsx`) permitindo exportar todo o currículo de fases e questões em um único pacote `.json` com carimbo de data.
- **Sincronização Dupla ao Importar:** Ao importar um pacote JSON no editor, o estado é imediatamente salvo no `localStorage` e propagado para o banco de dados Neon PostgreSQL via API.
- **Suíte Abrangente de Testes de Autenticação e Banco:** 49 novos testes automatizados cobrindo `Login.test.tsx`, `apiPhases.test.ts`, `apiSubmissions.test.ts`, `middleware.test.ts` e `db.test.ts`. Suíte total expandida para 185 testes no Jest.

### Alterado (Changed)
- **Otimização da Barra de Navegação:** Remoção do botão duplicado "Modo Editor" da linha principal da navbar, centralizando o acesso no menu suspenso do perfil do usuário.
- **Documentação Técnica Expandida (`docs/`):** Adicionado `docs/persistencia-submissoes-e-progresso.md` e atualizadas as especificações `docs/specs/auth-db-spec.md` e `docs/specs/import-export-spec.md`.

## [2.2.0] - 2026-09-11 (Motor de Formalização Lógica, Validação Semântica & Alpha-Conversão)

### Adicionado (Added)
- **Motor de Validação Semântica Proposicional (`src/lib/formalizacao.ts`):** Verificação de equivalência lógica profunda via teste de tautologia $(A \leftrightarrow B)$ integrado ao gerador de tabelas-verdade. Respostas logicamente equivalentes (ex: `P → Q` e `~P ∨ Q`, ou comutatividade `P ∧ Q` e `Q ∧ P`) são aceitas automaticamente.
- **Normalização de Variáveis Quantificadas ($\alpha$-conversão):** Reconhecimento de equivalência de variáveis ligadas em lógica de predicados de primeira ordem (`∀x(Px → Qx)` equivale a `∀y(Py → Qy)` e `∃x(Px ∧ Qx)` equivale a `∃z(Pz ∧ Qz)`).
- **Suporte a Respostas Alternativas Cadastradas:** Campo opcional `respostas_alternativas` na interface e no schema de dados para fornecer gabaritos múltiplos aceitos explicitamente pelo professor.
- **Seletor de Rigor de Validação:** Alternância entre validação semântica profunda (`'semantico'`) e validação estrutural restrita (`'estrito'`).
- **Barra de Atalhos Acoplada no Editor:** Teclado de operadores e quantificadores (`∀`, `∃`, `~`, `∧`, `∨`, `→`, `↔`, `(`, `)`) acoplado ao campo de resposta esperada para inserção rápida de caracteres formais.
- **Sincronização e Extração Automática de Dicas:** Botão para extrair automaticamente predicados e variáveis da fórmula e popular o dicionário de dicas.
- **Configuração Inteligente do Teclado do Aluno com Distratores:** Algoritmo que detecta os operadores da fórmula e sugere operadores complementares para desafiar o raciocínio do estudante.
- **Validação de Sintaxe em Tempo Real no Editor:** Detecção instantânea de parênteses desbalanceados, operadores no fim de sentenças ou variáveis quantificadas malformadas.
- **Suíte de Testes Unitários de Formalização (`src/lib/__tests__/formalizacao.test.ts`):** 34 novos testes cobrindo todas as nuances de equivalência proposicional, comutatividade, leis de De Morgan, contrapositiva, quantificadores universais/existenciais e modos estrito/semântico. Suíte total do projeto expandida para 136 testes.

### Alterado (Changed)
- **Validação de Exercícios no Modo Estudo (`src/app/page.tsx`):** A função `handleValidate()` agora delega a correção do tipo `formalizacao` ao motor `validateFormalizacaoAnswer`, fornecendo ao estudante mensagens de erro detalhadas em caso de sintaxe inválida.

## [2.1.0] - 2026-09-10 (Parser Lógico, Andaime Pedagógico & Guias Estilo Navegador)

### Adicionado (Added)
- **Parser de Lógica Proposicional (`src/lib/parser.ts`):** Tokenizador e árvore sintática abstrata (AST) com suporte a negação (`~`), conjunção (`∧`), disjunção (`∨`), condicional (`→`) e bicondicional (`↔`).
- **Extração Topológica de Expressões:** Decomposição automática de subexpressões intermediárias e fórmula raiz para gerar colunas da tabela-verdade em ordem de precedência.
- **Valoração Booleana Automática da Tabela-Verdade:** Geração automática e estrita de $2^n$ linhas ($n$ = variáveis proposicionais atômicas), preenchendo todos os valores lógicos esperados.
- **Sistema de Andaime Pedagógico (Scaffolding):** Professores podem alternar qualquer célula individual ou coluna inteira entre "Dica / Revelada" e "Aluno Responde" via ícones `Eye` / `EyeOff`.
- **Interface em Guias Estilo Navegador no Modal (`QuestionFormModal.tsx`):** Substituição da divisão 50/50 por abas superiores ("Editor" e "Visão do Aluno"), proporcionando 100% de largura útil para edição de tabelas complexas e suporte completo a mobile.

### Alterado (Changed)
- **Zero Emojis na Interface:** Padronização integral com ícones vetoriais da biblioteca `lucide-react`.
- **Validação de Exercícios da Tabela-Verdade:** Células marcadas como reveladas são omitidas da validação, exigindo do aluno apenas o preenchimento das células ativas.
- **Suíte de Testes Expandida:** Total de 102 testes automatizados aprovados no Jest, cobrindo o parser, integração de andaime e alternância de guias.

## [2.0.0] - 2026-09-10 (Editor de Conteúdo & Separação de Modos)

### Adicionado (Added)
- **Modo Editor de Conteúdo (`/editor`):** Nova rota administrativa para criação, edição e organização de conteúdo sem necessidade de alteração de código.
- **Gestão de Fases (CRUD):** Criação, edição (título e ícone) e exclusão protegida de fases com contagem de questões associadas.
- **Seletor de Ícone Compacto:** Seletor de ícone flutuante via popover sobre o ícone ativo, economizando espaço em tela e evitando grids estáticos desnecessários.
- **Gestão de Questões (CRUD):** Criação e edição dos 3 tipos de questão (`diagramacao`, `tabela_verdade`, `formalizacao`) com formulários especializados e validações de campos obrigatórios em tempo real.
- **Auto-Geração de Linhas na Tabela-Verdade:** Geração automática das $2^n$ combinações de valores lógicos (V/F) conforme as variáveis proposicionais são adicionadas ou removidas.
- **Fases Heterogêneas:** Suporte para que uma mesma fase contenha questões de tipos diferentes (ex: revisão mista de lógica).
- **Preview ao Vivo:** Visualização instantânea e espelhada da questão sendo formulada, utilizando os próprios componentes de renderização do aluno.
- **Drag & Drop Duplo no Editor (`@dnd-kit`):** Suporte a reordenação fluida de fases no sidebar e de questões na lista de cada fase.
- **Camada de Persistência Local (`src/lib/storage.ts`):** Módulo centralizado para gerenciar leitura, gravação, auto-seed a partir do `bancoDeQuestoes` e migração versionada do schema no `localStorage`.
- **Mapeamento de Ícones Serializáveis (`src/lib/icons.ts`):** Suporte a ícones Lucide serializáveis (`LucideIconName`) com labels amigáveis.
- **Suíte Abrangente de Testes Automatizados (TDD):** Total de 78 testes passando no Jest, cobrindo `storage.test.ts` (operações de dados), `Lobby.test.tsx` (fluxos do aluno) e `Editor.test.tsx` (fluxos do professor).

### Alterado (Changed)
- **Modo Estudo (`/`) Focado:** Remoção do Drag & Drop do Lobby do estudante. A trilha agora segue estritamente a ordem definida no Editor pelo professor.
- **Carga Dinâmica de Fases no Lobby:** O Lobby agora consome as fases dinamicamente do `localStorage` com fallback para o seed inicial, em vez de filtrar arrays estáticos.
- **Tratamento de Casos de Borda no Lobby:** Fases vazias (sem questões) exibem badge "Sem questões" e botão desabilitado. Ausência total de fases exibe empty state amigável com atalho para o Editor.
- **Navegação Bidirecional:** Link de acesso rápido "Modo Editor" no rodapé do Lobby e botão "Voltar ao Modo Estudo" no cabeçalho do Editor.
- **Reorganização de Especificações:** Especificações técnicas movidas e estruturadas em `docs/specs/` (`lobby-spec.md` como SPEC-001 e `editor-spec.md` como SPEC-002).

## [1.1.0] - Sessão Anterior (MVP UI/UX & DnD Inicial)

### Adicionado (Added)
- **Drag & Drop de Fases:** Implementação inicial com `@dnd-kit` para reordenação livre dos cartões de Fases no Lobby (posteriormente movido exclusivamente para o Editor).
- **Numeração Dinâmica:** Título das fases calculando dinamicamente sua posição visual no array.
- **Novo Fluxo de Abandono (Exit Modal):** Ícone de saída na Navbar durante os exercícios com modal responsivo de confirmação.
- **Testes Automatizados Iniciais:** Criação da primeira suíte com `Lobby.test.tsx`.

### Alterado (Changed)
- **Ícones Modernos:** Remoção total dos emojis em favor de iconografia escalável com a biblioteca `lucide-react`.
- **Arquitetura da Visualização Principal (Page Scroll):** 
  - **Mobile:** Introduzida a mecânica de "Zero Scroll de Página" (`100dvh`), mantendo navbar e rodapé fixos e scroll interno no exercício.
  - **Desktop:** Retornada a mecânica fluida tradicional (`h-auto` e `overflow-y-auto`).
- **Dimensões Táteis (Acessibilidade):** Pílulas de alternância com `py-2` para toque mobile e `md:w-32` para desktop.

### Corrigido (Fixed)
- **Atraso no Drag & Drop (Rubber-banding):** Remoção da classe CSS `transition-all` no `@dnd-kit`.
- **Scroll Horizontal Fantasma:** Adicionado `overflow-x-hidden` e `touch-none` nos manipuladores de pega.
- **Vazamento do Teclado Virtual:** Adicionado flex-wrap no contêiner do teclado para não quebrar telas estreitas (390px).

