# [RFC / Performance] Sincronização Granular de Fases e Questões e Otimização do Neon Serverless Driver

## 1. Contexto & Histórico
Recentemente, a rota `POST /api/phases` apresentou o erro `PrismaClientKnownRequestError [P2028]: Transaction not found` em produção na Vercel conectado ao Neon PostgreSQL. A causa raiz foi o esgotamento do tempo limite padrão de 5 segundos (`timeout: 5000ms`) de transações interativas do Prisma, provocado por um loop sequencial com dezenas de `tx.question.upsert(...)` individuais somado à latência de rede Serverless e cold starts da computação do Neon.

Um hotfix emergencial foi aplicado (commit `86f2915`), aumentando o timeout para 30s (`timeout: 30000`) e paralelizando os upserts de questões com `Promise.all`. Embora o hotfix tenha estabilizado a aplicação imediatamente, a sincronização atual ainda opera de forma monolítica (reescrevendo o currículo inteiro a cada alteração).

---

## 2. Problema Atual
1. **Reescrita Monolítica do Grafo:** Ao editar uma única questão ou título de fase, o frontend envia todas as fases e questões para o backend (`POST /api/phases`), executando dezenas de operações redundantes no PostgreSQL.
2. **Conexões TCP Stateful via PgBouncer:** O Prisma Client ainda se conecta via TCP direto ao pooler do Neon, consumindo recursos de conexão em lambdas serverless.
3. **Risco em Importações Massivas:** A importação em lote de grandes pacotes pedagógicos (ex: 50+ questões) pode eventualmente se aproximar do teto de timeout de 15 segundos do plano Hobby da Vercel.

---

## 3. Proposta Arquitetural (Baseada nas Melhores Práticas de Mercado)

### 3.1. Sincronização Granular por Fase Ativa
- Criar endpoint `PUT /api/phases/[id]` e função `syncSinglePhaseToDb(phase: Phase)` em `src/lib/db.ts`.
- No Editor (`src/app/editor/page.tsx`), direcionar as operações cotidianas (`handleSaveQuestion`, `handleDeleteQuestion`, `handleUpdatePhase`) para a rota granular da fase selecionada.
- Reservar a rota global `POST /api/phases` apenas para reordenação de fases, criação/exclusão de fase inteira ou importação de pacotes JSON.

### 3.2. Adoção do Neon Serverless Driver (`@prisma/adapter-neon`)
- Integrar `@neondb/serverless` e `@prisma/adapter-neon` no Prisma Client (`src/lib/prisma.ts`).
- Utilizar pooling sobre HTTP/WebSockets, eliminando a dependência de conexões TCP travadas e acelerando transações em ambientes Serverless da Vercel.

### 3.3. Bulk Operations com SQL Nativo ou `createMany`
- Nas rotas de lote (importação de pacotes), avaliar o uso de `INSERT INTO "Question" ... ON CONFLICT ("id") DO UPDATE` nativo em vez de múltiplos `upsert` individuais.

---

## 4. Critérios de Aceitação
- [ ] O salvamento cotidiano de uma questão no Editor deve enviar apenas o payload da fase ativa, reduzindo a carga de rede em mais de 75%.
- [ ] O tempo de resposta de salvamento no Editor deve permanecer abaixo de 300ms em produção.
- [ ] Importações de pacotes JSON com 50+ questões devem ser executadas com sucesso sem atingir timeouts de transação ou de lambda da Vercel.
- [ ] A suíte completa de testes (`npm test`) deve cobrir os novos fluxos granulares com 100% de aprovação.

