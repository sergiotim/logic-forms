# Dashboard de Análises do Professor (Analytics)

Este documento registra a arquitetura, estrutura de dados, metodologia TDD e guia de utilização do **Dashboard de Análise do Professor** (`/editor/analytics`), implementado conforme a especificação [[SPEC-007]](file:///c:/Users/sergiogabriel/Desktop/Projetos/parser-logic/forms/docs/specs/analytics-spec.md).

---

## 1. Visão Geral e Propósito Pedagógico

O Dashboard de Análise foi desenvolvido para oferecer aos professores uma visão completa e em tempo real sobre o engajamento e as principais dificuldades dos estudantes de Ciência da Computação nos exercícios de Lógica Proposicional e Cálculo de Predicados.

O painel responde a três perguntas pedagógicas fundamentais:
1. **Quem está ativo e qual o ritmo da turma?** (Visão Geral de Engajamento)
2. **Em quais tipos de exercícios os alunos mais travam?** (Diagramação vs. Tabela-Verdade vs. Formalização)
3. **Onde e por que estão errando?** (Diagnóstico Qualitativo de Respostas Incorretas)

---

## 2. Arquitetura e Fluxo de Dados

A solução adota a arquitetura de **React Server Components (RSC)** em conjunto com **Client Components** interativos:

```
[ Neon PostgreSQL (Prisma ORM) ]
               │
               ▼
[ src/lib/analytics.ts ] (Agregação de Dados & Consultas)
  ├── getAnalyticsOverview()
  └── getPhaseAnalytics(phaseId)
               │
               ▼
[ src/app/editor/analytics/page.tsx ] (React Server Component - RSC)
               │
               ▼ (initialData via props)
[ src/components/editor/analytics/AnalyticsDashboard.tsx ] (Client Component)
  ├── KPI Cards (Alunos Ativos, Conclusão Global, Fases)
  ├── Gráfico de Barras Responsivo (Recharts)
  ├── Seletor de Fases
  ├── Ranking de Questões Mais Difíceis
  └── Análise Qualitativa de Erros (JSON answer grouping)
```

### 2.1 Por que Server Components (RSC)?
- **Acesso direto ao Prisma:** Elimina a necessidade de criar endpoints intermediários de API (`/api/analytics`), evitando *waterfalls* de requisição e diminuindo a latência inicial da página.
- **Segurança e RBAC:** A rota `/editor/analytics` é estritamente protegida no `src/middleware.ts`, garantindo que apenas usuários autenticados com o papel `TEACHER` possam carregá-la. Alunos e visitantes não autenticados são redirecionados automaticamente.

---

## 3. Métricas e Fórmulas Calculadas

### 3.1 Métricas Globais

| Métrica | Descrição | Cálculo / Origem |
| :--- | :--- | :--- |
| **Alunos Ativos** | Estudantes que já enviaram pelo menos uma submissão na plataforma | Contagem de `userId` distintos na tabela `Submission` pertencentes a usuários com `role === 'STUDENT'`. |
| **Taxa Global de Conclusão** | Média percentual do avanço da turma no currículo completo de questões | Para cada aluno, calcula-se: `(questões acertadas / total de questões da plataforma) * 100`. A métrica final é a média simples entre todos os estudantes. |
| **Desempenho por Tipo** | Taxa de acerto acumulada entre os modelos de exercício | Agrupamento por `QuestionType` (`DIAGRAMACAO`, `TABELA_VERDADE`, `FORMALIZACAO`): `(acertos / total de submissões) * 100`. |

### 3.2 Diagnósticos por Fase

| Métrica | Descrição | Comportamento |
| :--- | :--- | :--- |
| **Ranking de Dificuldade** | Lista de questões ordenadas pelo índice de erro | Questões com mais submissões `isCorrect === false` e maior `failureRate` aparecem no topo com destaque visual em vermelho. |
| **Análise Qualitativa de Erros** | Extração dos erros conceituais mais comuns | Agrupa o campo `answer` (JSON) das submissões incorretas de cada questão. O sistema calcula a quantidade e porcentagem de ocorrência de cada resposta errada (ex: `~∀x(P(x) → V(x))` com 66.7% de frequência). |

---

## 4. Metodologia de Desenvolvimento (TDD Estrito)

O desenvolvimento seguiu rigorosamente o ciclo **Red-Green-Refactor**:

### 4.1 Fase Vermelha (Red Phase)
Antes de qualquer código de produção, foram criadas duas suítes completas de testes automatizados:
- **`src/lib/__tests__/analytics.test.ts` (7 testes unitários):**
  - Métricas zeradas com banco limpo.
  - Contagem de alunos ativos com filtro por role.
  - Taxa global de conclusão.
  - Desempenho agrupado pelos 3 tipos de questão.
  - Ranquear questões mais difíceis da fase.
  - Agrupamento qualitativo de respostas erradas a partir do JSON.
  - Erro para fases inexistentes.
- **`src/__tests__/Analytics.test.tsx` (7 testes de integração de UI):**
  - Botão de atalho no header do `/editor`.
  - Renderização dos cards de KPIs e títulos.
  - Gráfico e taxas por tipo de questão.
  - Seletor de fases funcional.
  - Ranking de questões com falhas.
  - Painel de análise de erros frequentes.
  - Link de retorno ao `/editor`.
- **`src/__tests__/middleware.test.ts`:**
  - Testes de proteção RBAC para a rota `/editor/analytics`.

*Todos os 14 testes da nova feature falharam na primeira execução, confirmando o contrato do sistema.*

### 4.2 Fase Verde (Green Phase)
- Instalação da biblioteca `recharts` para renderização gráfica.
- Implementação dos serviços em `src/lib/analytics.ts`.
- Construção do componente `src/components/editor/analytics/AnalyticsDashboard.tsx`.
- Construção da página `src/app/editor/analytics/page.tsx`.
- Inclusão do link de navegação no header em `src/app/editor/page.tsx`.
- *Resultado:* 14 de 14 testes passaram com sucesso (`PASS`).

---

## 5. Arquivos Criados e Modificados

| Arquivo | Ação | Descrição |
| :--- | :--- | :--- |
| `package.json` | Modificado | Adicionada dependência `recharts` |
| `src/types/index.ts` | Modificado | Adicionadas interfaces `GlobalAnalyticsData`, `PhaseAnalytics`, `QuestionTypePerformance`, `HardestQuestionSummary`, `QuestionErrorAnalysis` e `CommonErrorItem` |
| `src/lib/analytics.ts` | Criado | Motor de métricas e consultas agregadas via Prisma |
| `src/app/editor/analytics/page.tsx` | Criado | Rota RSC do Dashboard de Análises |
| `src/components/editor/analytics/AnalyticsDashboard.tsx` | Criado | Componente cliente com gráficos Recharts, filtros e diagnóstico qualitativo |
| `src/app/editor/page.tsx` | Modificado | Botão "Análises" integrado ao header |
| `src/lib/__tests__/analytics.test.ts` | Criado | Testes unitários do motor analítico |
| `src/__tests__/Analytics.test.tsx` | Criado | Testes de integração de UI do dashboard |
| `src/__tests__/middleware.test.ts` | Modificado | Testes de proteção RBAC para `/editor/analytics` |
| `docs/specs/analytics-spec.md` | Criado | Especificação técnica original (SPEC-007) |
| `docs/analytics-dashboard.md` | Criado | Este documento de registro técnico e arquitetural |

---

## 6. Comandos de Verificação

Para reexecutar a suíte de testes do módulo de analytics:
```bash
npx jest analytics
```

Para validar a integridade estática de tipagem:
```bash
npx tsc --noEmit
```

