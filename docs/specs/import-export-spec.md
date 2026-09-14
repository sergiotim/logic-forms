# [SPEC-006] Sistema de Importação e Exportação de Fases e Questões

## 1. Visão Geral
O sistema de **Importação e Exportação** do **Lógica Dinâmica** permite que professores realizem backup, compartilhem pacotes didáticos com outros docentes e migrem conteúdos entre ambientes de desenvolvimento e produção com facilidade.

A partir da versão 2.3.0, o sistema opera de forma integrada à persistência em nuvem (Neon PostgreSQL) e mantém suporte a arquivos portáveis no formato `.json` ("Pacote Hidratado"), com exportação individual de fase e **exportação em lote de todas as fases em um único arquivo**.

---

## 2. Estrutura do Pacote de Exportação ("Pacote Hidratado")

O arquivo de exportação empacota os metadados de uma ou mais fases e anexa os objetos completos de todas as questões associadas, preservando as ligações relacionais originais através do campo `originalQuestionIds`.

### Schema do Pacote JSON (Ex: `logica-dinamica-todas-fases-2026-09-14.json`)
```json
{
  "metadata": {
    "version": 1,
    "type": "logica-dinamica:package_export",
    "exportedAt": "2026-09-14T03:00:00.000Z"
  },
  "phases": [
    {
      "titulo": "Fase 1: Introdução aos Conectivos",
      "icone": "Brain",
      "originalQuestionIds": ["q-uuid-1", "q-uuid-2"]
    },
    {
      "titulo": "Fase 2: Tabela-Verdade e Tautologia",
      "icone": "Table2",
      "originalQuestionIds": ["q-uuid-3"]
    }
  ],
  "questions": [
    {
      "originalId": "q-uuid-1",
      "tipo": "diagramacao",
      "topico": "Lógica Proposicional",
      "enunciado": "Classifique as frases do argumento:",
      "frases": [
        { "id": "f1", "texto": "Se chove, a rua molha." },
        { "id": "f2", "texto": "Choveu." },
        { "id": "f3", "texto": "Logo, a rua está molhada." }
      ],
      "resposta_esperada": { "f1": "P", "f2": "P", "f3": "C" }
    },
    {
      "originalId": "q-uuid-2",
      "tipo": "formalizacao",
      "topico": "Predicados",
      "enunciado": "Formalize: 'Todo homem é mortal.'",
      "resposta_esperada": "∀x(Hx → Mx)"
    },
    {
      "originalId": "q-uuid-3",
      "tipo": "tabela_verdade",
      "topico": "Cálculo Proposicional",
      "enunciado": "Preencha a tabela-verdade da fórmula:",
      "expressao": "P ∧ Q",
      "variaveis": ["P", "Q", "P ∧ Q"],
      "linhas": [
        { "id": "row-0", "valores": ["V", "V", "V"] },
        { "id": "row-1", "valores": ["V", "F", "F"] },
        { "id": "row-2", "valores": ["F", "V", "F"] },
        { "id": "row-3", "valores": ["F", "F", "F"] }
      ],
      "resposta_esperada": ["V", "F", "F", "F"],
      "celulas_reveladas": {}
    }
  ]
}
```

---

## 3. Modalidades de Exportação

O Modo Editor (`/editor`) organiza os pontos de contato de exportação com clara separação de responsabilidades:

### 3.1. Exportação em Lote ("Exportar Tudo")
- **Onde se localiza:** No cabeçalho da barra lateral de fases (`PhaseSidebar.tsx`), integrado ao grid de utilitários ao lado do botão "Importar".
- **Comportamento:**
  - Varre o estado completo de fases e questões (`exportPackage(editorState)`).
  - Gera um arquivo unificado nomeado automaticamente com carimbo de data: `logica-dinamica-todas-fases-<YYYY-MM-DD>.json`.
  - Permite que o professor salve todo o currículo da disciplina com apenas um clique.

### 3.2. Exportação Individual de Fase ("Exportar")
- **Onde se localiza:** No cabeçalho do formulário da fase ativa (`PhaseEditor.tsx`), através do botão secundário `"Exportar"`.
- **Comportamento:**
  - Empacota apenas a fase selecionada e suas respectivas questões.
  - Gera um arquivo específico: `<titulo-da-fase>.json`.

---

## 4. Fluxo de Importação e Prevenção de Colisões

Ao importar um arquivo `.json`, o sistema adota um algoritmo defensivo para garantir a integridade dos dados locais e remotos:

### Algoritmo de Importação Segura:
1. **Validação do Arquivo:** Verifica se o JSON contém o cabeçalho esperado (`metadata.type === "logica-dinamica:package_export"`).
2. **Geração de Novos UUIDs:**
   - Cria um mapa de tradução: `idMap = new Map()`.
   - Para cada questão contida no pacote, gera um novo UUID (`crypto.randomUUID()`), registra `idMap.set(originalId, novoId)` e remove `originalId`.
3. **Reconstrução das Fases:**
   - Para cada fase no pacote, gera um novo UUID de fase.
   - Substitui o array `originalQuestionIds` pelos novos IDs gerados através do `idMap`.
   - Adiciona as novas fases à lista existente (sem sobrescrever as fases que o professor já possui).
4. **Sincronização Dupla (Local + Neon DB):**
   - Salva o novo estado consolidado no `localStorage` do navegador para funcionamento offline imediato.
   - Dispara uma chamada automática assíncrona para `POST /api/phases` (`syncPhasesApi`), persistindo a nova estrutura diretamente no banco de dados Neon PostgreSQL.
   - Assim que a sincronização no banco é concluída, todos os estudantes autenticados no Modo Estudo passam a ver as novas fases instantaneamente.
5. **Feedback Visual:** Exibe toast de sucesso informando a quantidade exata de fases e questões importadas com sucesso.

---

## 5. Requisitos de Acessibilidade e Interface (UI/UX)
- Botões de exportação com ícones Lucide adequados (`Download`, `Package`, `Upload`).
- Labels e `aria-label` distintos para evitar colisões em tecnologias assistivas e testes automatizados.
- Input de arquivo invisível (`<input type="file" accept=".json" className="hidden" />`) ativado programmaticamente pelo clique nos botões estilizados.
