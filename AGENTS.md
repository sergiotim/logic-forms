<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Diretrizes do Projeto Lógica Dinâmica

Este documento estabelece o guia definitivo de arquitetura, padrões de código, design system e convenções operacionais para agentes de IA e desenvolvedores que atuam no repositório **Lógica Dinâmica**.

---

## 1. Visão Geral do Projeto

O **Lógica Dinâmica** é uma plataforma educacional interativa projetada para desmistificar o aprendizado de Lógica Formal e Cálculo de Predicados para estudantes de Ciência da Computação. O sistema transforma exercícios tradicionais em experiências visuais, gamificadas e responsivas.

A plataforma opera em dois modos distintos por rota:
- **Modo Estudo (`/`):** Interface focada para o aluno resolver exercícios de fases ordenadas, com validação em tempo real e prevenção de abandono. Não possui ferramentas de edição nem drag-and-drop.
- **Modo Editor (`/editor`):** Painel administrativo para professores criarem, editarem, excluírem e reordenarem fases e questões (com drag-and-drop duplo, motor lógico para autogeração de tabelas-verdade, andaime pedagógico e guias com preview ao vivo), persistido em `localStorage`.

### Tech Stack Principal
- **Framework:** Next.js 16.3.4 (App Router)
- **Biblioteca de UI:** React 19.2.8 & React DOM 19.2.8
- **Linguagem:** TypeScript 5
- **Estilização:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`
- **Iconografia:** `lucide-react` (ícones escaláveis sem uso de emojis brutos na UI)
- **Testes & TDD:** Jest 30, `@testing-library/react`, `@testing-library/jest-dom`

---

## 2. Comandos do Projeto

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Next.js |
| `npm run build` | Executa o build de produção |
| `npm start` | Inicia o servidor em modo de produção |
| `npm run lint` | Executa a verificação estática com ESLint |
| `npm test` | Executa a suíte completa de testes automatizados com Jest |

---

## 3. Estrutura de Diretórios e Código

```
forms/
├── docs/                        # Documentação técnica e especificações do produto
│   ├── brand-kit.md             # Guia de marca, cores, tipografia e tom de voz
│   ├── Estrutura das Questões (JSON).md  # Schema JSON dos 3 tipos de questão
│   ├── regras-importacao-ia.md  # Diretrizes para importação de questões geradas por IA
│   ├── persistencia-submissoes-e-progresso.md # Arquitetura de submissões, progresso e integridade por UUID
│   └── specs/                   # Especificações técnicas detalhadas
│       ├── lobby-spec.md        # [SPEC-001] Especificação da tela de Lobby e sistema de fases
│       ├── editor-spec.md       # [SPEC-002] Especificação do Editor de Conteúdo (Fases e Questões)
│       ├── parser-spec.md       # [SPEC-003] Especificação do Parser Lógico e Tabela-Verdade
│       ├── formalizacao-spec.md # [SPEC-004] Motor de Validação e Criação de Formalização
│       ├── auth-db-spec.md      # [SPEC-005] Autenticação Google NextAuth, RBAC e Neon Postgres
│       ├── import-export-spec.md # [SPEC-006] Importação/Exportação em Lote e Sincronização
│       └── analytics-spec.md    # [SPEC-007] Dashboard de Análises do Professor (Analytics)
├── prisma/                      # Schema do Prisma ORM e migrações do PostgreSQL Neon
│   └── schema.prisma            # Modelos User, Account, Session, Phase, Question, Submission
├── src/
│   ├── __tests__/               # Testes automatizados de componentes e integração (Jest / RTL)
│   │   ├── Lobby.test.tsx       # Testes de integração do Lobby e fluxo de resolução de fases
│   │   ├── Editor.test.tsx      # Testes de integração do Modo Editor (CRUD, DnD, preview, abas, validação)
│   │   ├── Analytics.test.tsx   # Testes de integração do Dashboard de Análises
│   │   ├── Login.test.tsx       # Testes da página de login e redirecionamento NextAuth
│   │   ├── apiPhases.test.ts    # Testes dos endpoints de API de fases (GET/POST)
│   │   ├── apiSubmissions.test.ts # Testes dos endpoints de API de submissões (GET/POST)
│   │   └── middleware.test.ts   # Testes do middleware de proteção de rotas
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx             # Modo Estudo (Lobby, Quiz, Conclusão de Fase, Exit Modal)
│   │   ├── login/
│   │   │   └── page.tsx         # Tela de login com Google OAuth
│   │   ├── editor/
│   │   │   ├── page.tsx         # Modo Editor (Gerenciamento de fases e questões)
│   │   │   └── analytics/
│   │   │       └── page.tsx     # Dashboard de Análises (RSC)
│   │   ├── api/                 # Rotas de API do App Router (NextAuth, Phases, Submissions)
│   │   ├── layout.tsx           # Wrapper principal da aplicação com SessionProvider
│   │   └── globals.css          # Estilos globais e animações customizadas
│   ├── components/              # Componentes React
│   │   ├── editor/              # Componentes exclusivos do Modo Editor
│   │   │   ├── analytics/
│   │   │   │   └── AnalyticsDashboard.tsx # Painel com gráficos Recharts e diagnósticos
│   │   │   ├── EditorLayout.tsx       # Shell com Navbar e layout responsivo
│   │   │   ├── PhaseSidebar.tsx       # Sidebar de fases com DnD e botões de exportar/importar
│   │   │   ├── PhaseEditor.tsx        # Edição de fase e botão de exportação em lote
│   │   │   ├── QuestionList.tsx       # Lista de questões da fase com DnD (@dnd-kit)
│   │   │   ├── QuestionCard.tsx       # Card de questão com ações e drag handle
│   │   │   ├── QuestionFormModal.tsx  # Modal com abas (Editor vs Visão do Aluno) e formulário
│   │   │   ├── QuestionPreview.tsx    # Preview ao vivo da questão com sincronização em tempo real
│   │   │   └── forms/                 # Formulários especializados por tipo
│   │   ├── questions/           # Componentes de renderização por tipo de exercício
│   │   │   ├── Diagramacao.tsx  # Tipo "diagramacao" (Premissas vs Conclusão)
│   │   │   ├── TabelaVerdade.tsx # Tipo "tabela_verdade" (Matriz V/F com andaime pedagógico)
│   │   │   └── Formalizacao.tsx # Tipo "formalizacao" (Input + Teclado Lógico Virtual)
│   │   └── ui/                  # Componentes reutilizáveis de interface
│   │       ├── Button.tsx       # Variantes de botões (primary, outline, disabled)
│   │       ├── Feedback.tsx     # Alertas visuais (sucesso, aviso, erro)
│   │       └── ProfileMenu.tsx  # Menu suspenso de perfil do usuário com logout e atalho de editor
│   ├── data/
│   │   └── questions.ts         # Banco estático inicial / fallback de seed (bancoDeQuestoes)
│   ├── lib/                     # Camada lógica, utilitária e serviços
│   │   ├── auth.ts              # Configuração e callbacks do NextAuth
│   │   ├── prisma.ts            # Instância singleton do PrismaClient
│   │   ├── db.ts                # Camada de persistência relacional no Neon Postgres
│   │   ├── api.ts               # Cliente fetch de integração para fases e submissões
│   │   ├── analytics.ts         # Motor de métricas, agregação e diagnóstico de erros (SPEC-007)
│   │   ├── parser.ts            # Motor do Parser Proposicional, AST, extração topológica e matriz
│   │   ├── storage.ts           # CRUD do localStorage, migrações de versão e seed inicial
│   │   ├── icons.ts             # Mapeamento e opções de LucideIconName serializáveis
│   │   └── __tests__/           # Testes unitários da camada lógica e de dados
│   ├── middleware.ts            # Proteção de rotas do Next.js baseada em sessão e RBAC
│   └── types/
│       ├── index.ts             # Interfaces TypeScript (BaseQuestion, Phase, EditorState, etc.)
│       └── next-auth.d.ts       # Extensão de tipagem do NextAuth para Session e JWT
├── legacy/                      # Protótipos legados (referência estática apenas)
├── CHANGELOG.md                 # Histórico de alterações e releases
├── README.md                    # Documentação geral do repositório
└── AGENTS.md                    # Este arquivo de instruções para agentes de IA
```

---

## 4. Tipos de Questões & Schema de Dados

Toda questão estende `BaseQuestion` (`id`, `tipo`, `topico`, `enunciado`).

1. **Diagramação de Argumentos (`tipo: "diagramacao"`)**
   - **Objetivo:** Classificar frases como Premissa (`"P"`) ou Conclusão (`"C"`).
   - **Campos Específicos:** `frases: [{ id, texto }]`, `resposta_esperada: Record<string, "P" | "C">`.

2. **Tabela-Verdade (`tipo: "tabela_verdade"`)**
   - **Objetivo:** Preencher colunas de conectivos e valoração lógica para combinações de variáveis.
   - **Campos Específicos:**
     - `expressao: string`: Fórmula lógica completa (ex: `(P ∨ Q) ∧ (~R)`).
     - `variaveis: string[]`: Variáveis proposicionais atômicas e subexpressões intermediárias extraídas pelo parser.
     - `linhas: [{ id, valores: string[] }]`: $2^n$ permutações booleanas ($n$ = variáveis atômicas).
     - `resposta_esperada: string[]`: Gabarito de valoração da coluna final.
     - `celulas_reveladas?: Record<string, boolean>`: Andaime pedagógico (*scaffolding*) indicando quais células ou colunas aparecem resolvidas como dicas para o aluno.

3. **Formalização Lógica (`tipo: "formalizacao"`)**
   - **Objetivo:** Transcrever sentenças em linguagem simbólica usando um teclado virtual acoplado.
   - **Campos Específicos:** `dicas: string[]`, `teclado_virtual: string[]`, `resposta_esperada: string`.
   - **Campos Avançados (SPEC-004):** `respostas_alternativas?: string[]`, `modo_validacao?: 'semantico' | 'estrito'`.
   - **Regra de Validação:** Normalização de espaços em branco, suporte a equivalência semântica proposicional ($A \leftrightarrow B$) e $\alpha$-normalização de predicados quantificados.

### Entidades de Fases e Estado do Editor (`src/types/index.ts`)
- **`Phase`:** Representa uma fase configurável (`id`, `titulo`, `icone: LucideIconName`, `questoes: Question[]`). Suporta fases heterogêneas (questões de tipos diferentes na mesma fase).
- **`EditorState`:** Schema serializável armazenado no `localStorage` sob a chave `"logica-dinamica:editor-state"` (`version`, `phases`, `updatedAt`).

---

## 5. Design System e UX Guidelines

### Cores e Identidade Visual (Dark Mode)
- **Background Base:** `#0A0A0A` (`bg-base`)
- **Surface / Cards:** `#171717` (`bg-surface`)
- **Bordas Sutis:** `#374151` (`border-border-subtle`)
- **Primary Blue:** `#3B82F6` (`text-primary`, `bg-primary`)
- **Success (Tautologia):** `#10B981` (`text-success`)
- **Warning (Contingência):** `#F59E0B` (`text-warning`)
- **Error (Contradição):** `#EF4444` (`text-error`)

### Tipografia Strict
- **Inter (Sans-serif):** Navegação, títulos, enunciados, modais e botões.
- **JetBrains Mono (Monospace):** **ESTRITAMENTE** para fórmulas lógicas, variáveis, expressões e colunas de tabelas-verdade.

### Regras de Iconografia e UI
- **Zero Emojis na UI:** Substituir emojis por componentes da biblioteca `lucide-react` (ex: `Network`, `Table2`, `PenLine`, `GripVertical`, `GripHorizontal`, `CheckCircle2`, `X`, `Eye`, `EyeOff`).
- **Botões Acessíveis:** Garantir espaçamentos adequados para toque mobile (`py-2`, dimensões confortáveis).
- **Seletores Compactos:** O seletor de ícone de fase no editor utiliza um popover flutuante posicionado sobre o ícone atual para economizar espaço de tela.
- **Interface em Guias no Modal:** O modal de edição (`QuestionFormModal.tsx`) adota guias estilo navegador ("Editor" com 100% de largura e "Visão do Aluno" com preview espelhado), garantindo amplo espaço para tabelas-verdade complexas e compatibilidade móvel.

### Layout Responsivo & Behavior
- **Mobile (< 768px):** Mecânica de *Zero Page Scroll* (`100dvh`, `overflow-hidden` na main) no quiz. Apenas o container do exercício rola internamente e o rodapé é sticky (`shadow-[0_-10px_20px_rgba(0,0,0,0.5)]`). No Editor, a sidebar colapsa em seletor horizontal/dropdown.
- **Desktop (≥ 768px):** Layout de fluxo contínuo ou painéis divididos (Sidebar + Área Principal no Editor).

---

## 6. Regras de Interatividade e Drag & Drop (`dnd-kit`)

> **Regra de Ouro:** O Drag & Drop é **EXCLUSIVO do Modo Editor (`/editor`)**. O Modo Estudo (`/`) apresenta as fases em ordem fixa determinada pelo professor, sem manipuladores de arrasto.

Ao trabalhar com itens arrastáveis no Editor (`PhaseSidebar` e `QuestionList`):
1. **Nunca usar `transition-all`:** Evitar conflitos de transição CSS no `@dnd-kit` que causam lentidão/arrasto elástico ("rubber-banding"). Utilize transições específicas como `transition-colors`.
2. **Touch Safety:** Sempre adicionar `touch-none` nos manipuladores de pega (`GripVertical` / `GripHorizontal`).
3. **Limites de Contêiner:** Utilizar modificadores apropriados (`restrictToVerticalAxis`, `restrictToWindowEdges`) para evitar que itens sejam arrastados para fora da área visível.
4. **Z-Index Dinâmico:** Elevar o `zIndex` do elemento durante o arrasto (`isDragging ? 50 : 'auto'`) para evitar sobreposição por outros cartões.

---

## 7. Metodologia de Testes (TDD)

- A suíte de testes automatizados com Jest é a **fonte da verdade** de comportamento do sistema:
  - `src/lib/__tests__/parser.test.ts`: Testes unitários do motor sintático, precedência, AST e geração de tabelas.
  - `src/lib/__tests__/storage.test.ts`: Testes unitários de persistência, seed, migrações e ordenação.
  - `src/__tests__/Lobby.test.tsx`: Testes de integração do Modo Estudo (Lobby, fluxo de quiz, exit modal, badges).
  - `src/__tests__/Editor.test.tsx`: Testes de integração do Modo Editor (criação/edição/exclusão de fases e questões, preview, navegação por guias, validação, DnD).
- Antes de dar qualquer tarefa como concluída, **SEMPRE** execute `npm test` e garanta 100% de aprovação em todos os testes.
- Qualquer adição de funcionalidade deve ser acompanhada por testes unitários/integração equivalentes no Jest.

---

## 8. Regras para Agentes de IA

1. **Preservação do Bloco Next.js:** O bloco `<!-- BEGIN:nextjs-agent-rules -->` até `<!-- END:nextjs-agent-rules -->` no topo deste arquivo **DEVE** permanecer intacto.
2. **Manutenção de Contratos de Tipos:** Ao criar ou modificar componentes, garanta que os tipos em `src/types/index.ts` sejam respeitados e mantidos atualizados.
3. **Não Mascarar Erros:** Em caso de falha de teste ou build, analise a causa raiz no código/componente ao invés de alterar asserções ou suprimir erros.
4. **Documentação como Referência:** Sempre consulte os arquivos em `docs/` e `docs/specs/` antes de alterar schemas ou comportamentos da interface.
