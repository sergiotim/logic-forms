# [SPEC-005] Autenticação, Controle de Acesso e Persistência de Dados

## 1. Visão Geral
Esta especificação detalha a arquitetura de produção do **Lógica Dinâmica**, integrando autenticação federada com Google Workspace, controle de acesso baseado em papéis (RBAC), banco de dados relacional em nuvem (Neon PostgreSQL) gerenciado via Prisma ORM, e persistência atômica tanto do conteúdo pedagógico (fases e questões) quanto do progresso dos estudantes (submissões).

---

## 2. Stack Tecnológica
- **Autenticação:** NextAuth.js (Auth.js) v4
- **Provedor de Identidade:** Google OAuth 2.0 (`GoogleProvider`)
- **Banco de Dados:** Neon (PostgreSQL Serverless)
- **ORM:** Prisma v6
- **Gerenciamento de Sessão:** Estratégia de Sessão híbrida (NextAuth com persistência no Prisma e JWT/Session tokens)
- **Proteção de Rotas:** Next.js Middleware (`src/middleware.ts`)

---

## 3. Fluxo de Autenticação e Experiência do Usuário

### 3.1. Provedor Google OAuth
O sistema autentica estudantes e docentes via conta Google institucional ou pessoal autorizada.

### 3.2. Middleware de Proteção de Rotas (`src/middleware.ts`)
1. **Rotas Protegidas (`/`, `/editor`):** Qualquer requisição sem token de sessão válido é automaticamente interceptada e redirecionada para `/login?callbackUrl=...`.
2. **Rota Administrativa (`/editor`):** Além de estar autenticado, o usuário deve possuir a role `TEACHER`. Usuários com papel `STUDENT` recebem redirecionamento ou bloqueio ao tentar acessar o editor.
3. **Página de Login (`/login`):** Tela minimalista contendo a identidade visual oficial do projeto (logo com gradiente e badge "Lógica Dinâmica"), informações sobre a plataforma e o botão oficial "Entrar com Google".

### 3.3. Menu de Perfil na Navbar (`ProfileMenu.tsx`)
A interface elimina links soltos e poluição visual na barra de navegação:
- Exibe o avatar do Google com fallback para as iniciais do usuário.
- Dropdown flutuante com:
  - Nome completo e e-mail institucional.
  - Pílula de perfil: `PROFESSOR` (badge azul) ou `ESTUDANTE` (badge cinza).
  - Atalho para o **Modo Editor** (exclusivo para quem possui role `TEACHER`).
  - Botão de **Sair da conta (Logout)** com confirmação e redirecionamento seguro para `/login`.

---

## 4. Regras de Negócio e Controle de Acesso (RBAC)

O sistema define duas roles no enum do Prisma: `STUDENT` e `TEACHER`.

### 4.1. Estudantes (`STUDENT`)
- **Atribuição:** Papel padrão atribuído a qualquer novo usuário criado no banco de dados.
- **Permissões:**
  - Acessar o lobby de fases (`/`).
  - Resolver exercícios (diagramação, tabela-verdade e formalização).
  - Registrar submissões corretas via `POST /api/submissions`.
  - Consultar seu progresso persistido via `GET /api/submissions`.
- **Restrições:** Acesso estritamente bloqueado à rota `/editor` e endpoints de escrita administrativa.

### 4.2. Professores (`TEACHER`)
- **Atribuição:** Gerenciada no código via variáveis de ambiente `TEACHER_EMAILS` e `ADMIN_EMAILS` (lista de e-mails separados por vírgula).
- **Mecanismo de Atribuição no Login:** No callback `signIn` e `session` do NextAuth, se o e-mail do usuário constar na lista configurada, a role é imediatamente promovida para `TEACHER` no banco de dados e refletida no token de sessão.
- **Permissões:**
  - Acesso total ao Modo Editor (`/editor`).
  - Criar, editar, reordenar e excluir fases e questões com persistência remota no Neon DB via `POST /api/phases`.
  - Exportar fases individuais ou todas as fases em pacote JSON único ("Exportar Tudo").
  - Importar pacotes JSON com sincronização atômica imediata para o banco de dados.

---

## 5. Modelagem do Banco de Dados (Schema Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ROLES & TIPOS
// ==========================================
enum Role {
  STUDENT
  TEACHER
}

enum QuestionType {
  DIAGRAMACAO
  TABELA_VERDADE
  FORMALIZACAO
}

// ==========================================
// NEXTAUTH & USUÁRIOS
// ==========================================
model User {
  id            String       @id @default(cuid())
  name          String?
  email         String?      @unique
  emailVerified DateTime?
  image         String?
  role          Role         @default(STUDENT) 

  accounts      Account[]
  sessions      Session[]
  submissions   Submission[]

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==========================================
// DOMÍNIO PEDAGÓGICO (LÓGICA DINÂMICA)
// ==========================================
model Phase {
  id        String     @id @default(cuid())
  title     String
  icon      String
  order     Int
  
  questions Question[]

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Question {
  id        String       @id @default(cuid())
  phaseId   String
  type      QuestionType
  topic     String
  enunciado String
  order     Int
  
  // JSON estruturado correspondente à interface TypeScript BaseQuestion
  content   Json         

  phase       Phase        @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  submissions Submission[]

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model Submission {
  id         String   @id @default(cuid())
  userId     String
  questionId String
  
  isCorrect  Boolean
  answer     Json     // Resposta submetida pelo aluno
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())
  
  @@unique([userId, questionId]) 
}
```

---

## 6. Endpoints de API Criados

### 6.1. Fases e Questões
- **`GET /api/phases`:**
  - Retorna todas as fases ordenadas pelo campo `order` com suas respectivas questões.
  - Se o banco estiver vazio, aciona a carga inicial (*seed*) a partir de `src/data/questions.ts`.
- **`POST /api/phases`:**
  - Exclusivo para docentes (`role: TEACHER`).
  - Recebe o array completo de fases e sincroniza atomicamente com o PostgreSQL, inserindo/atualizando fases e questões com integridade e executando limpeza de entidades removidas (usado para criação/exclusão de fases, reordenação global e importação em lote).
- **`PUT /api/phases/[id]`:**
  - Exclusivo para docentes (`role: TEACHER`).
  - Recebe os dados de uma única fase ativa (`{ phase: Phase }`) e sincroniza atomicamente apenas a fase e suas questões associadas via `syncSinglePhaseToDb`.
  - Reduz em mais de 75% o tráfego de rede e a latência de salvamento nas operações rotineiras do Modo Editor.

### 6.2. Driver de Conexão Neon Serverless (@prisma/adapter-neon)
- O Prisma Client utiliza o `@prisma/adapter-neon` em conjunto com `@neondatabase/serverless` e `ws`.
- As transações interativas e consultas executam sobre conexões de WebSocket/HTTP otimizadas para ambientes Serverless (Vercel Lambdas), prevenindo esgotamento de conexões TCP e erros de timeout (`P2028: Transaction not found`).

### 6.2. Submissões e Progresso
- **`GET /api/submissions`:**
  - Retorna as submissões corretas do usuário logado (`{ submissions: [{ questionId, isCorrect, ... }] }`).
- **`POST /api/submissions`:**
  - Registra a resolução de uma questão (`{ questionId, isCorrect, answer }`) usando `upsert` na chave `[userId, questionId]`.

---

## 7. Variáveis de Ambiente Necessárias

```env
# Banco de Dados Neon (PostgreSQL)
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="chave-criptografica-gerada-com-openssl"

# Provedor Google OAuth
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# E-mails de Professores / Administradores
TEACHER_EMAILS="professor@exemplo.com,admin@exemplo.com"
ADMIN_EMAILS="coordenador@exemplo.com"
```
