# [SPEC-001] Especificação da Tela de Lobby e Trilha de Fases

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Implemented / Concluído
- **Data de Criação:** 2026-09-10
- **Última Atualização:** 2026-09-10
- **Target Release:** v1.0.0 (MVP Inicial) / v2.0.0 (Integração com Editor)

---

## 1. Visão Geral
O fluxo inicial da aplicação entrava diretamente na primeira questão do questionário (SPA contínua). O objetivo desta especificação foi introduzir uma tela inicial ("Lobby") que atua como um mapa de progresso, dividindo os exercícios em **Fases** com objetivos pedagógicos claros.

### Configuração Padrão de Fases (Seed):
- **Fase 1: Diagramação** (Ícone: `Network`) — 2 questões de classificação de premissas e conclusão.
- **Fase 2: Tabela-Verdade** (Ícone: `Table2`) — 2 questões de preenchimento de matriz proposicional.
- **Fase 3: Formalização** (Ícone: `PenLine`) — 2 questões de transcrição em linguagem lógica com teclado virtual.

---

## 2. Fluxo do Usuário (UX)

1. **Tela Inicial (Lobby):** O aluno acessa a plataforma em `/` e visualiza os cards das fases disponíveis em ordem sequencial.
2. **Seleção de Fase:** Todas as fases iniciam desbloqueadas para permitir estudo flexível. O aluno clica em "Iniciar" ou "Refazer".
3. **Execução:** O sistema entra no modo `playing`, renderizando as questões sequenciais pertencentes àquela fase específica.
4. **Modal de Saída Protegida:** Se o aluno clicar no ícone de saída (`X`) na barra de navegação durante os exercícios, um modal de confirmação previne a perda acidental do progresso.
5. **Conclusão de Fase:** Ao validar a última questão da fase com sucesso, o sistema exibe a tela de conclusão com feedback motivacional e o botão para "Voltar ao Lobby".
6. **Progresso & Badges:** No Lobby, fases já completadas exibem badge verde "Concluído" com ícone de verificação (`CheckCircle2`). Fases sem questões exibem badge "Sem questões" com botão desabilitado.
7. **Navegação para o Editor:** Um link discreto no rodapé permite transitar rapidamente para o Modo Editor (`/editor`).

---

## 3. Estrutura de Interface (UI)

### Componente: `Lobby` (`src/app/page.tsx`)
- **Header:** Título da plataforma ("Lógica Dinâmica") e subtítulo ("Escolha uma fase para treinar suas habilidades matemáticas").
- **Grid de Fases:** Grid responsivo (`grid-cols-1 md:grid-cols-3 gap-6`) com cards elegantes em Dark Mode (`#171717`).
- **Card de Fase:**
  - Ícone renderizado dinamicamente via `ICON_MAP` a partir de `LucideIconName`.
  - Título numerado dinamicamente: `"Fase {i + 1}: {titulo}"`.
  - Badge de status: `"Concluído"` (verde), `"{n} concluídas"` (azul/cinza) ou `"Sem questões"` (vermelho/âmbar).
  - Botão de ação: `"Iniciar"`, `"Refazer"` ou desabilitado caso não haja questões.
- **Empty State:** Caso não haja fases cadastradas no storage, o Lobby exibe uma mensagem amigável convidando o usuário a acessar o Editor.

---

## 4. Gerenciamento de Estado & Arquitetura

O estado principal no Modo Estudo (`src/app/page.tsx`) é modelado da seguinte forma:

```typescript
type ViewState = 'lobby' | 'playing' | 'phase_finished';

// Controle da visualização ativa
const [currentView, setCurrentView] = useState<ViewState>('lobby');

// Fase selecionada atualmente para execução
const [activePhase, setActivePhase] = useState<Phase | null>(null);

// Registro de fases concluídas na sessão (armazenado por ID)
const [completedPhases, setCompletedPhases] = useState<string[]>([]);

// Lista de fases carregadas dinamicamente do localStorage
const [fases, setFases] = useState<Phase[]>([]);
```

---

## 5. Evolução da Arquitetura (Do MVP à v2.0.0)

Durante o desenvolvimento do projeto e a introdução da [SPEC-002 (Editor de Conteúdo)](editor-spec.md), foram consolidadas as seguintes melhorias em relação à proposta original:

1. **Substituição de Emojis:** Todos os emojis da interface (🧩, 🧮, ✍️) foram substituídos por ícones vetoriais escaláveis da biblioteca `lucide-react`, mantendo consistência visual independente de SO.
2. **Origem dos Dados Dinâmica:** A lista de fases deixou de ser um filtro estático no código (`bancoDeQuestoes.filter(...)`) e passou a ser gerada via `loadEditorState()` no `localStorage`, permitindo fases dinâmicas, customizáveis e heterogêneas.
3. **Isolamento de Drag & Drop:** No protótipo inicial, o DnD de fases foi testado no Lobby do estudante. Com a separação arquitetural de papéis (Aluno vs Professor), **o Drag & Drop foi tornado EXCLUSIVO do Modo Editor (`/editor`)**. O Lobby do aluno apresenta uma trilha ordenada, estável e livre de interações acidentais de arrasto.


