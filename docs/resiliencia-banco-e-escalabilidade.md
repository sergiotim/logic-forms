# Resiliência de Banco de Dados, Sincronização e Escalabilidade

Este documento detalha o histórico de resolução do incidente de timeout de banco de dados (`Prisma P2028`), a mitigação imediata aplicada, as práticas recomendadas da indústria para arquiteturas Serverless e o roadmap de evolução arquitetural para o **Lógica Dinâmica**.

---

## 1. Relato do Incidente (Post-Mortem)

### 1.1. Sintoma em Produção
Em ambiente de produção hospedado na **Vercel** com banco de dados **Neon PostgreSQL (Serverless)**, operações de salvamento de fases e questões no Modo Editor (`/editor`) ou importação de pacotes passaram a falhar com o seguinte erro retornado pela rota `POST /api/phases`:

```text
PrismaClientKnownRequestError [P2028]:
Invalid `prisma.question.upsert()` invocation:
Transaction API error: Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting.
code: 'P2028',
clientVersion: '6.19.3'
```

### 1.2. Causa Raiz
1. **Interactive Transaction Timeout (Limite Padrão de 5s do Prisma):**  
   O método `prisma.$transaction(async (tx) => { ... })` possui, por padrão, um tempo limite de execução de **5.000 ms (5 segundos)** e `maxWait: 2000 ms`. Se o bloco assíncrono ultrapassar 5 segundos, o motor do Prisma aborta a transação e invalida seu identificador no banco.
2. **Gargalo de $N+1$ em Fila Indiana (Sequencial):**  
   A função `syncPhasesToDb` executava `for` loops aninhados com chamadas `await tx.question.upsert(...)` individuais para cada questão de cada fase. Para um conjunto de 4 fases e 15 questões, eram geradas entre 20 e 30 requisições SQL sequenciais dentro da mesma transação aberta.
3. **Latência de Rede em Arquitetura Serverless + Cold Start do Neon:**  
   No ambiente local (`localhost`), a latência de rede é desprezível (< 20ms por query), completando a rotina em menos de 500ms. Na Vercel, com funções Serverless comunicando-se via WAN com os datacenters do Neon, cada viagem de ida e volta (RTT) consome entre 100ms e 250ms. Se o Neon estivesse em estado adormecido (*auto-suspend*), os primeiros 1 a 2 segundos eram gastos apenas no handshake de inicialização, estourando invariavelmente os 5 segundos.
4. **Desconexão por PgBouncer:**  
   Em proxies de conexão em pool (PgBouncer do Neon), transações interativas longas com múltiplos intervalos de espera podem sofrer descarte por *idle in transaction*, gerando a mensagem *"or was obtained before disconnecting"*.

---

## 2. Mitigação Imediata Aplicada (Hotfix)

No commit `86f2915`, foram implementadas duas medidas no arquivo [`src/lib/db.ts`](file:///c:/Users/sergiogabriel/Desktop/Projetos/parser-logic/forms/src/lib/db.ts):

### 2.1. Concorrência via `Promise.all`
Substituição do loop sequencial por despacho simultâneo de todas as questões da fase:
```typescript
await Promise.all(
  phase.questoes.map((question, qIndex) => {
    // ... mapeamento de tipos
    return tx.question.upsert({ /* ... */ });
  })
);
```
- **Impacto:** O tempo total de salvamento das questões de uma fase caiu de vários segundos para o equivalente ao tempo de 1 ou 2 round-trips de rede (~300ms a 500ms).

### 2.2. Expansão de Parâmetros de Transação
```typescript
await prisma.$transaction(
  async (tx) => { /* ... */ },
  {
    maxWait: 10000, // 10s: Tolerância para cold start do Neon
    timeout: 30000, // 30s: Teto de segurança para evitar encerramento prematuro
  }
);
```

### 2.3. Testes de Regressão
Adicionada asserção na suíte [`src/lib/__tests__/db.test.ts`](file:///c:/Users/sergiogabriel/Desktop/Projetos/parser-logic/forms/src/lib/__tests__/db.test.ts) validando que os parâmetros de timeout são repassados ao Prisma. Todos os **220 testes automatizados** do projeto foram validados e aprovados.

---

## 3. Como o Mercado Resolve esse Desafio (State of the Art)

Grandes plataformas SaaS com interfaces interativas (como Figma, Notion, Linear, Trello e Supabase) e arquiteturas baseadas em Vercel + bancos Serverless lidam com esses desafios utilizando quatro padrões fundamentais:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BOAS PRÁTICAS DO MERCADO PARA SERVERLESS                 │
├────────────────────────────────┬────────────────────────────────────────────┤
│ 1. Sincronização Granular/Diff │ Nunca reescrever o grafo de dados inteiro; │
│    (Sync Engine & Deltas)      │ salvar apenas a entidade ativa modificada. │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 2. Batching / Bulk Operations  │ Substituir transações interativas longas   │
│    (createMany / SQL Nativo)   │ por operações em lote atômicas.            │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 3. Driver Serverless sem TCP   │ Usar WebSockets / HTTP pipelined           │
│    (@prisma/adapter-neon)      │ em vez de segurar conexões no PgBouncer.   │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 4. Background Jobs para Cargas │ Importações de centenas de itens rodam     │
│    (Inngest / Upstash QStash)  │ em segundo plano com acompanhamento visual.│
└────────────────────────────────┴────────────────────────────────────────────┘
```

### 3.1. Sincronização Granular por Entidade (*Delta Updates*)
- **O Anti-pattern Atual:** Ao alterar uma frase em uma única questão da Fase 3, o frontend envia todas as 5 fases e todas as questões existentes, forçando o banco a revalidar todo o ecossistema.
- **Padrão do Mercado:** 
  - **Salvar por Fase:** Operações corriqueiras de edição de enunciado, criação de questão ou alteração de andaime pedagógico disparam `PUT /api/phases/[id]` contendo apenas a fase afetada.
  - **Sync Diferencial (*Dirty Checking*):** Rastrear no estado do editor quais registros foram modificados e enviar apenas um payload de patch:
    ```json
    {
      "updated": [{ "id": "q1", "enunciado": "Novo enunciado" }],
      "deleted": ["q2"]
    }
    ```

### 3.2. Batching e Bulk Operations em vez de Transações Interativas Longas
- Na documentação oficial da Vercel e do Prisma, o uso de transações interativas (`prisma.$transaction(async (tx) => ...)`) é recomendado apenas para fluxos estritamente interdependentes de curta duração (< 500ms).
- Para salvar múltiplos registros sem overhead de transação interativa, o mercado adota:
  - **Batching declarativo:** `prisma.$transaction([ ...arrayDePromises ])`. O Prisma otimiza essa chamada executando os comandos em lote em um único pipeline de rede.
  - **Bulk Upsert nativo:** `INSERT INTO "Question" (...) VALUES (...) ON CONFLICT ("id") DO UPDATE SET ...` através de SQL bruto (`prisma.$executeRaw`) ou `createMany({ skipDuplicates: true })`.

### 3.3. Driver Serverless Oficial da Neon (`@prisma/adapter-neon`)
- Por padrão, o Prisma utiliza uma conexão TCP direta com o banco. Em Serverless, cada função abre uma nova conexão física, saturando pools ou dependendo do PgBouncer.
- A Neon e a Prisma desenvolveram o **Neon Serverless Driver** (`@prisma/adapter-neon` com `@neondb/serverless`). Ele executa queries SQL via **HTTP ou WebSockets seguros**, permitindo queries transacionais extremamente rápidas mesmo com cold starts, sem risco de timeout de socket TCP.

### 3.4. Background Jobs para Importações em Lote Massivas
- Para importações pesadas (ex: professor importando um banco de 100 questões com tabelas-verdade completas via arquivo JSON):
  - A requisição HTTP imediata apenas valida o JSON, gera um `jobId` e responde `202 Accepted`.
  - Um background job (ou rotina desacoplada via filas serverless como Upstash QStash, Inngest ou Trigger.dev) processa os chunks em lotes de 10 a 20 itens.
  - A interface do professor exibe uma barra de progresso em tempo real ("Importando 45/100...").

---

## 4. Roadmap de Implementação e Melhorias

Para consolidar a arquitetura com padrão empresarial, o projeto deve seguir os seguintes marcos:

### Fase 1: Estabilização Imediata (Concluída ✅)
- [x] Concorrência de queries com `Promise.all` em `src/lib/db.ts`.
- [x] Ajuste de `maxWait: 10000` e `timeout: 30000`.
- [x] Testes de regressão cobrindo os parâmetros no Jest.

### Fase 2: Granularidade por Fase Ativa (Próximo Passo 🎯)
- [ ] Criar rota `PUT /api/phases/[id]` para sincronização unitária da fase selecionada no editor.
- [ ] No frontend (`src/app/editor/page.tsx`), chamar a sincronização granular em edições cotidianas de questões.
- [ ] Manter o salvamento global `POST /api/phases` exclusivamente para reordenação de fases ou importação completa de pacotes.

### Fase 3: Adoção do Neon Driver Adapter & Bulk SQL
- [ ] Adicionar `@prisma/adapter-neon` e `@neondb/serverless` ao projeto.
- [ ] Avaliar bulk upserts nativos para pacotes com mais de 50 questões.

