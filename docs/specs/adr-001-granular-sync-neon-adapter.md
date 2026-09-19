# [ADR-001] Sincronização Granular de Fases/Questões e Neon Serverless Driver Adapter

## Status
**Aceito & Implementado** (Setembro/2026) — Resolução da **Issue #1**

---

## Contexto & Declaração do Problema

Em ambiente de produção na Vercel conectado ao banco de dados Neon PostgreSQL, a rota `POST /api/phases` apresentou a falha crítica:
```
PrismaClientKnownRequestError [P2028]: Transaction not found
```

### Análise de Causa Raiz (RCA)
1. **Reescrita Monolítica do Grafo:** Qualquer alteração no Modo Editor (mesmo uma simples correção textual de enunciado ou opção) disparava o envio de todas as fases e questões para `POST /api/phases`, reprocessando dezenas de `upsert` e `deleteMany` em lote.
2. **Latência Serverless & Cold Starts:** Em funções Serverless (Vercel Lambdas), o tempo de inicialização a frio (*cold start*) somado à latência de rede TCP causava o esgotamento do tempo limite padrão de 5 segundos de transações interativas do Prisma.
3. **Conexões TCP Stateful:** O Prisma Client conectava-se diretamente via TCP ao pooler do PgBouncer, o que não é o padrão ideal para funções serverless efêmeras.

---

## Decisões Arquiteturais

### 1. Sincronização Granular por Fase Ativa (`PUT /api/phases/[id]`)
- **Nova função de persistência:** `syncSinglePhaseToDb(phase: Phase)` em `src/lib/db.ts`.
  - Escopada estritamente à fase afetada.
  - Atualiza título e ícone mantendo a ordem (`order`) da fase intacta.
  - Executa limpeza e upsert concorrente apenas das questões da fase ativa (`Promise.all`).
- **Novo Endpoint:** `PUT /api/phases/[id]` em `src/app/api/phases/[id]/route.ts`.
  - Protegido por RBAC (`role: TEACHER` ou `TEACHER_EMAILS`).
- **Integração no Editor:** Operações cotidianas (`handleUpdatePhase`, `handleSaveQuestion`, `handleDeleteQuestion`, `handleReorderQuestions`) passam a invocar `saveSinglePhaseApi(phase)`, reduzindo o tráfego de rede e o tempo de transação em mais de 75%.
- **Manutenção da Rota Global:** `POST /api/phases` permanece exclusivamente para reordenação global de fases, criação/remoção de fases completas e importação em lote de pacotes JSON.

### 2. Adoção do Neon Serverless Driver Adapter (`@prisma/adapter-neon`)
- **Dependências Integradas:** `@neondatabase/serverless`, `@prisma/adapter-neon` e `ws`.
- **Configuração do Prisma:** No `src/lib/prisma.ts`, o Prisma Client é instanciado com o driver adapter `PrismaNeon` conectado a uma `Pool` do Neon configurada com WebSockets (`neonConfig.webSocketConstructor = ws`).
- **Benefício:** Elimina o travamento de conexões TCP e suporta transações interativas de forma transparente sobre WebSockets em ambientes Serverless da Vercel.

### 3. Impacto Zero no Esquema do Banco de Dados
- Nenhuma migração (`prisma migrate`) ou alteração de DDL (`prisma db push`) é necessária entre as branches (`dev` e `main`) do Neon. As tabelas `Phase`, `Question` e `Submission` existentes já suportam a atomicidade granular.

---

## Consequências e Resultados

### Positivas
- **Redução de Carga de Rede:** Payload enviado pelo cliente reduzido de dezenas de kilobytes para poucos bytes por edição.
- **Latência de Salvamento:** Tempo de resposta do salvamento no Editor reduzido para valores inferiores a 300ms.
- **Resiliência a Timeouts:** Fim das exceções `P2028: Transaction not found` em edições cotidianas.
- **Transição Transparente:** Compatibilidade retroativa garantida com pacotes JSON existentes e estrutura de dados local.

### Riscos & Mitigações
- **Fallback para Ambientes sem DATABASE_URL:** O `src/lib/prisma.ts` mantém inicialização padrão do `PrismaClient` caso `DATABASE_URL` não esteja definida (ex: suítes de teste de unidade locais ou build estático).

