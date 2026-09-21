# Lógica Dinâmica — Plataforma Interativa de Lógica Formal

O **Lógica Dinâmica** é uma plataforma educacional interativa projetada para desmistificar o aprendizado de Lógica Formal e Cálculo de Predicados para estudantes de Ciência da Computação. O sistema transforma exercícios acadêmicos tradicionais em experiências visuais, gamificadas e totalmente responsivas.

---

## Sobre o Projeto

O aprendizado de Lógica de Predicados e Tabelas-Verdade costuma ser um processo árido. O **Lógica Dinâmica** resolve essa dor ao oferecer uma interface moderna em **Dark Mode**, com validação em tempo real, teclado virtual com símbolos lógicos, gerenciamento completo de conteúdo via interface visual e uma experiência de estudo limpa e focada.

A aplicação divide-se em duas rotas principais:
- **Modo Estudo (`/`):** Voltado para o estudante resolver as fases e questões em uma sequência pedagógica estruturada, com salvamento de progresso e prevenção de desistência acidental.
- **Modo Editor (`/editor`):** Painel administrativo para professores e monitores gerenciarem o conteúdo da plataforma — criando fases personalizadas, formulando questões com preview ao vivo e reordenando elementos com drag-and-drop.

---

## Funcionalidades Principais

### Modo Estudo (`/`)
- **Lobby & Trilha de Fases:**
  - Visualização ordenada de fases com status de conclusão ("Concluído" / "0/2 concluídas").
  - Acesso direto para iniciar ou refazer qualquer fase concluída.
  - Tratamento inteligente de fases vazias e persistência no navegador via `localStorage`.
  - **Numeração Dinâmica e Filtragem de Conteúdo:** Fases e questões ocultadas pelo professor são excluídas da trilha do estudante, mantendo a numeração sequencial contínua (sem saltos) e recalculando o progresso automaticamente.
- **Modal de Saída Protegida:**
  - Confirmação de abandono ao clicar no ícone de saída durante uma fase para evitar perda inadvertida de progresso.
- **Feedback Imediato & Gamificação:**
  - Alertas visuais semânticos para acertos (Tautologia), erros (Contradição) e orientações pontuais.

### Modo Editor de Conteúdo (`/editor`)
- **Gestão Completa de Fases (CRUD):**
  - Criação de novas fases com título customizável e seleção de ícone através de um seletor popover compacto e flutuante.
  - Exclusão protegida de fases com modal de confirmação exibindo a contagem de questões afetadas.
  - **Controle de Visibilidade de Fases:** Botão de alternância rápida de visibilidade (`Eye`/`EyeOff`) na barra lateral com estilização em opacidade reduzida para rascunhos.
- **Gestão Completa de Questões (CRUD):**
  - Criação e edição dos 4 tipos de questão através de formulários especializados com validação em tempo real.
  - **Controle de Visibilidade de Questões:** Alternância rápida com 1 clique no card de questões e checkbox dedicada no modal de edição ("Visível para os alunos").
  - **Preview ao Vivo:** Painel espelho que renderiza a questão em tempo real exatamente como o aluno a verá.
  - **Interface em Guias Estilo Navegador:** Alternância fluida entre "Editor" (100% de largura para edição confortável de tabelas) e "Visão do Aluno" (preview interativo espelhado em tempo real).
  - Suporte a **fases heterogêneas** (questões de tipos diferentes coexistindo na mesma fase de revisão).
- **Motor Lógico & Auto-gerador de Tabelas-Verdade:**
  - Parser sintático de lógica proposicional client-side em TypeScript.
  - Decomposição automática de variáveis atômicas e subexpressões intermediárias em ordem topológica de resolução.
  - Geração estrita de $2^n$ permutações de linhas e cálculo de todas as valorações booleanas.
  - **Andaime Pedagógico (Scaffolding):** Professores podem alternar qualquer célula ou coluna inteira entre "Dica (revelada ao aluno)" e "Aluno responde".
- **Drag & Drop Reordenável (`@dnd-kit`):**
  - Reordenação livre de fases na barra lateral com atualização instantânea de numeração.
  - Reordenação livre de questões dentro de cada fase.
- **Persistência & Migração Automática:**
  - Armazenamento em `localStorage` sob a chave `"logica-dinamica:editor-state"`, com seed inicial automático a partir do banco de dados estático e controle de versão do schema.

### Dashboard Analítico dos Estudantes (`/editor/analytics`)
- **Acompanhamento de Desempenho Individual:**
  - Tabela completa de alunos matriculados com KPIs gerais da turma (média de conclusão, alunos 100% e não iniciados).
  - Métricas transparentes de progresso duplo (`% concluído` e `% restante`), total de erros/repetições acumulados, acertos de 1ª tentativa e timestamp da última atividade.
  - Ordenação por qualquer coluna, busca em tempo real por nome/e-mail e filtros rápidos de status (`Todos`, `Em Andamento`, `100% Concluído`, `Não Iniciados`).
- **Modal de Diagnóstico "Raio-X Acadêmico":**
  - Auditoria minuciosa das resoluções por fase e exercício com acordeões recolhidos por padrão para visualização limpa e executiva.
  - Classificação pedagógica por questão: *Acertou de primeira* (verde), *Concluída após N erros* (amarelo), *Pendente com N erros* (vermelho) e *Não iniciada* (cinza).
  - Exibição literal da **última resposta submetida** pelo estudante em sua tentativa.
- **Soberania Pedagógica:** Ausência deliberada de notas arbitrárias geradas pelo sistema, assegurando que o professor avalie o percurso do aluno de forma justa e lance as notas no sistema acadêmico conforme seus próprios critérios.

### 5 Tipos de Exercícios Interativos
1. **Diagramação de Argumentos:** Classificação de frases entre Premissa ($P$) e Conclusão ($C$) com botões seletores ergonômicos e suporte a markdown.
2. **Tabela-Verdade:** Matrizes de valoração onde o aluno preenche os valores lógicos ($V$ / $F$) para expressões proposicionais com conectivos intermediários e andaime pedagógico. O editor inclui auto-geração das $2^n$ combinações de linhas a partir das variáveis declaradas.
3. **Formalização Lógica (Sentenças):** Transcrição de sentenças em linguagem simbólica com apoio de um **teclado virtual customizado** ($\sim, \land, \lor, \rightarrow, \leftrightarrow, \forall, \exists$), suporte a equivalência semântica e $\alpha$-conversão de predicados.
4. **Formalização de Argumentos (Dedutivos):** Decomposição e formalização de argumentos com múltiplas premissas e conclusão. O estudante segmenta o texto, conta as premissas e digita utilizando um teclado virtual global com foco ativo. A validação independe da ordem de inserção das premissas e suporta quantificadores e equivalência lógica.

---

## Design System & UX Guidelines

- **Dark Mode Nativo:** Paleta escura de alto contraste (`#0A0A0A` / `#171717`) reduzindo fadiga ocular.
- **Tipografia Strict:** **Inter** para a interface geral e **JetBrains Mono** estritamente para fórmulas, variáveis e matrizes lógicas.
- **Iconografia Escalável:** Componentes da biblioteca `lucide-react` (zero emojis brutos na UI).
- **Layout Adaptativo:**
  - **Mobile (< 768px):** Mecânica *Zero Page Scroll* (`100dvh` + rodapé *sticky*) na resolução de exercícios e sidebar retrátil no editor.
  - **Desktop (≥ 768px):** Painéis divididos, abas com 100% de largura e fluxo de leitura contínuo.

---

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Biblioteca de UI:** [React 19](https://react.dev/) & React DOM 19
- **Linguagem:** [TypeScript 5](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/postcss`)
- **Drag & Drop:** [`@dnd-kit/core`](https://dndkit.com/), `@dnd-kit/sortable`, `@dnd-kit/modifiers`
- **Iconografia:** [`lucide-react`](https://lucide.dev/)
- **Testes Automatizados:** [Jest 30](https://jestjs.io/), `@testing-library/react` & `@testing-library/jest-dom`

---

## Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm, yarn ou pnpm

### Passos para execução

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd forms
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   - Modo Estudo: [http://localhost:3000](http://localhost:3000)
    - Modo Editor: [http://localhost:3000/editor](http://localhost:3000/editor)
    - Modo Analytics: [http://localhost:3000/editor/analytics](http://localhost:3000/editor/analytics)

---

## Suíte de Testes (TDD)

O projeto adota Test-Driven Development (TDD) rigoroso, com 291 testes automatizados cobrindo todas as camadas da aplicação:

```bash
npm test
```

#### Estrutura de Testes
- `src/lib/__tests__/parser.test.ts`: Tokenização, parsing de AST, precedência de operadores, extração topológica de subexpressões e autogeração de matrizes da tabela-verdade.
- `src/lib/__tests__/studentAnalytics.test.ts`: Agregação de métricas por aluno, contagem de erros/repetições, acertos de 1ª e percentuais de conclusão.
- `src/lib/__tests__/storage.test.ts`: Operações CRUD, seed, reordenação de fases/questões e migrações de schema no `localStorage`.
- `src/__tests__/StudentAnalytics.test.tsx`: Fluxo completo do Dashboard de Estudantes (KPIs, tabela, ordenação, busca, filtros de status e modal Raio-X com acordeões).
- `src/__tests__/submissionErrorTracking.test.tsx`: Ciclo de vida e persistência atômica de tentativas incorretas na camada de banco Neon.
- `src/__tests__/Lobby.test.tsx`: Fluxo completo do Modo Estudo (Lobby, Quiz, Exit Modal, conclusão de fases, badges, visibilidade e numeração contínua).
- `src/__tests__/Editor.test.tsx`: Fluxo completo do Modo Editor (criação/edição/remoção de fases e questões, navegação por guias estilo navegador, preview ao vivo, visibilidade com opacidade e DnD).

### Outros Comandos Úteis
- `npm run lint` — Executa a verificação estática de código (ESLint)
- `npm run build` — Cria o build otimizado de produção
- `npm start` — Inicia o servidor em modo de produção

---

## Estrutura de Diretórios

```
forms/
├── docs/                        # Documentação técnica e especificações
│   ├── brand-kit.md             # Guia de marca, cores, tipografia e tom de voz
│   ├── Estrutura das Questões (JSON).md # Schema JSON dos tipos de questões
│   └── specs/                   # Especificações de produto detalhadas
│       ├── lobby-spec.md        # [SPEC-001] Especificação do Lobby de Fases
│       ├── editor-spec.md       # [SPEC-002] Especificação do Editor de Conteúdo
│       ├── parser-spec.md       # [SPEC-003] Especificação do Parser Lógico e Tabela-Verdade
│       ├── formalizacao-spec.md # [SPEC-004] Motor de Validação e Criação de Formalização
│       ├── analytics-spec.md    # [SPEC-007] Dashboard de Análises do Professor (Centrado no Aluno)
│       └── visibility-spec.md   # [SPEC-008] Visibilidade de Fases e Questões
├── src/
│   ├── __tests__/               # Testes de integração (Lobby, Editor, StudentAnalytics)
│   ├── app/                     # Next.js App Router (page.tsx, editor/page.tsx, editor/analytics/page.tsx)
│   ├── components/              # Componentes React
│   │   ├── editor/              # Componentes do Modo Editor e Analytics (StudentAnalyticsDashboard, StudentDetailModal)
│   │   ├── questions/           # Componentes de exercícios (Diagramacao, TabelaVerdade, Formalizacao, etc.)
│   │   └── ui/                  # Componentes reutilizáveis (Button, Feedback)
│   ├── data/                    # Banco estático de fallback (questions.ts)
│   ├── lib/                     # Camada lógica e serviços (analytics.ts, parser.ts, storage.ts, db.ts)
│   └── types/                   # Tipos TypeScript (Question, Phase, StudentAnalyticsOverviewData, etc.)
├── AGENTS.md                    # Diretrizes e regras para Agentes de IA
├── CHANGELOG.md                 # Histórico detalhado de mudanças
└── README.md                    # Documentação principal do projeto
```

---

## Documentação Complementar

- [Brand Kit & Design System](docs/brand-kit.md)
- [[SPEC-001] Especificação do Lobby de Fases](docs/specs/lobby-spec.md)
- [[SPEC-002] Especificação do Editor de Conteúdo](docs/specs/editor-spec.md)
- [[SPEC-003] Especificação do Parser Lógico e Tabela-Verdade](docs/specs/parser-spec.md)
- [[SPEC-004] Motor de Validação e Criação de Formalização](docs/specs/formalizacao-spec.md)
- [[SPEC-007] Dashboard de Análises do Professor](docs/specs/analytics-spec.md)
- [[SPEC-008] Visibilidade de Fases e Questões](docs/specs/visibility-spec.md)
- [Estrutura de Dados das Questões (JSON)](docs/Estrutura%20das%20Quest%C3%B5es%20(JSON).md)
- [Diretrizes de Agentes (AGENTS.md)](AGENTS.md)
