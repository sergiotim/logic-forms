# Changelog

Este arquivo documenta todas as alterações notáveis, implementações de features e correções de usabilidade (UI/UX) realizadas no projeto Lógica Dinâmica.

O formato baseia-se no padrão da indústria para registros de alterações (Keep a Changelog).

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

