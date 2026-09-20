# Guia de Especificação e Regras do JSON de Importação (Lógica Dinâmica)
> **Manual de Diretrizes para Agentes de IA Especialistas na Geração de Conteúdo Pedagógico**

Este documento estabelece as regras formais, contratos de campos, simplificações automáticas via parser e boas práticas para agentes de Inteligência Artificial que geram pacotes de exercícios em formato JSON para importação direta na plataforma **Lógica Dinâmica**.

---

## 1. Visão Geral do Formato do Pacote

O sistema de importação opera com processamento inteligente no cliente. A IA **NÃO precisa calcular matrizes booleanas ou configurar teclados virtuais manualmente**, pois o motor de inferência e parser lógico da plataforma resolvem tudo automaticamente a partir da fórmula fornecida.

O arquivo gerado deve ser um JSON válido contendo um objeto raiz com **três seções**:

1. `metadata`: Versão e assinatura do pacote.
2. `phases`: Lista de fases/módulos pedagógicos a serem importados (suporta múltiplas fases no mesmo arquivo).
3. `questions`: Banco de questões com enunciado, tipo e gabarito canônico.

### Estrutura Raiz do Pacote
```json
{
  "metadata": {
    "version": 1,
    "type": "logica-dinamica:package_export",
    "exportedAt": "2026-09-11T12:00:00.000Z"
  },
  "phases": [
    {
      "titulo": "Argumentos",
      "icone": "Network",
      "originalQuestionIds": ["q1", "q2"]
    },
    {
      "titulo": "Tabelas-Verdade",
      "icone": "Table2",
      "originalQuestionIds": ["q3", "q4"]
    }
  ],
  "questions": [
    {
      "originalId": "q1",
      "tipo": "diagramacao"
      /* ... propriedades ... */
    }
  ]
}
```

---

## 2. Metadados Globais (`metadata`)

| Campo | Tipo | Obrigatório | Valor Fixo / Regra | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `version` | `number` | **Sim** | `1` | Versão do schema de exportação. Deve ser sempre o inteiro `1`. |
| `type` | `string` | **Sim** | `"logica-dinamica:package_export"` | **Assinatura fixa**. O validador rejeita qualquer outro valor. |
| `exportedAt` | `string` | **Sim** | Formato ISO 8601 UTC (ex: `"2026-09-11T12:00:00.000Z"`) | Carimbo de data/hora da geração do arquivo. |

---

## 3. Estrutura e Importação de Múltiplas Fases (`phases`)

O pacote suporta a importação de **uma única fase** ou de **múltiplas fases de estudo de uma só vez** (ex: um currículo ou unidade didática inteira com 3, 4, 5 ou mais fases).

### Como Funciona a Importação de Múltiplas Fases:
- O array `phases` contém a lista sequencial de fases. Cada objeto define uma fase independente no editor.
- Cada fase possui seu próprio `titulo`, `icone` e lista de questões através do array `originalQuestionIds`.
- A ordem das fases no array `phases` define a ordem inicial em que elas aparecerão na barra lateral do editor e na trilha do aluno.

### Campos do Objeto Fase:
| Campo | Tipo | Obrigatório | Valores Aceitos | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `titulo` | `string` | **Sim** | Texto legível de 3 a 60 caracteres | Nome temático da fase (ex: `"Diagramação"`, `"Conectivos"`). **NÃO inclua o prefixo "Fase X:"**, pois a plataforma insere a numeração ordinal dinamicamente na interface. |
| `icone` | `string` | **Sim** | *Enum restrito* (ver tabela abaixo) | Identificador visual do ícone da fase. |
| `originalQuestionIds` | `string[]` | **Sim** | Array de strings não-vazio | Lista de IDs correspondentes ao campo `originalId` das questões contidas em `questions`. |

### Catálogo Restrito de Ícones (`icone`):
Apenas estes 10 ícones são suportados pelo sistema:

| Ícone | Propósito Pedagógico Recomendado |
| :--- | :--- |
| `"Network"` | Diagramação de argumentos, silogismos, estrutura premissa-conclusão. |
| `"Table2"` | Tabelas-verdade, matrizes de valoração booleana, contingências. |
| `"PenLine"` | Formalização lógica, tradução simbólica de sentenças. |
| `"BookOpen"` | Conceitos introdutórios, definições, leitura teórica. |
| `"Brain"` | Raciocínio integrado, desafios compostos, problemas mistos. |
| `"Target"` | Exercícios de fixação direcionados, simulados. |
| `"Lightbulb"` | Intuição lógica, quebra-cabeças iniciais. |
| `"GraduationCap"` | Provas, avaliações somativas, fechamento de módulo. |
| `"Puzzle"` | Paradoxos lógicos, charadas e aplicações práticas. |
| `"FlaskConical"` | Laboratório lógico, testes de tautologias e contradições. |

### Compartilhamento e Reutilização de Questões Entre Fases:
- **Questões Exclusivas:** A Fase 1 referencia `["q1", "q2"]` e a Fase 2 referencia `["q3", "q4"]`.
- **Questões Compartilhadas:** Uma mesma questão de revisão ou desafio pode constar simultaneamente em mais de uma fase (ex: a Fase 3 de "Revisão Geral" pode referenciar `["q1", "q3", "q5"]`). A questão só precisa ser declarada **uma única vez** no array global `questions`.

---

## 4. O Sistema de Identificadores Relacionais (`originalId`)

Para evitar conflitos com dados preexistentes no navegador do professor:
- Cada questão no array `questions` possui um identificador temporário e amigável `originalId` (ex: `"q1"`, `"q2"`, `"q_diag_1"`).
- O motor de importação gera automaticamente novos `UUIDs` criptográficos seguros para cada questão e fase no momento da importação, mantendo as associações perfeitamente intactas.

---

## 5. Especificação dos 3 Tipos de Questões (Modo Simplificado / Auto-Parser)

Toda questão compartilha 4 propriedades base obrigatórias:

```typescript
interface BaseQuestion {
  originalId: string; // Ex: "q1", "q2"
  tipo: "diagramacao" | "tabela_verdade" | "formalizacao";
  topico: string;     // Ex: "Cálculo Proposicional"
  enunciado: string;  // Instrução detalhada para o estudante
}
```

---

### 5.1 Tipo 1: Diagramação de Argumentos (`"tipo": "diagramacao"`)

Classificação de sentenças de um argumento como Premissa (`"P"`) ou Conclusão (`"C"`).

#### Campos Obrigatórios:
| Campo | Tipo | Descrição e Regras |
| :--- | :--- | :--- |
| `frases` | `Array<{ id: string; texto: string }>` | Mínimo de 2 frases. Cada frase deve ter um `id` único e o `texto` da sentença. |
| `resposta_esperada` | `Record<string, "P" \| "C">` | Dicionário mapeando cada `id` da frase para `"P"` (Premissa) ou `"C"` (Conclusão). |

#### Exemplo JSON:
```json
{
  "originalId": "q_diag_1",
  "tipo": "diagramacao",
  "topico": "Identificação de Argumentos",
  "enunciado": "Leia o argumento e classifique cada sentença como Premissa (P) ou Conclusão (C):",
  "frases": [
    { "id": "f1", "texto": "Se chover, o trânsito fica congestionado." },
    { "id": "f2", "texto": "Está chovendo." },
    { "id": "f3", "texto": "Logo, o trânsito ficará congestionado." }
  ],
  "resposta_esperada": {
    "f1": "P",
    "f2": "P",
    "f3": "C"
  }
}
```

---

### 5.2 Tipo 2: Tabela-Verdade (`"tipo": "tabela_verdade"`) — **Zero Configuração de Matriz**

> [!IMPORTANT]
> **Automação Total via Parser:** A IA **NÃO precisa calcular linhas, valores booleanos V/F ou colunas intermediárias**.
> O motor da plataforma analisa a `expressao`, extrai as variáveis atômicas, cria a topologia das subexpressões, gera as $2^n$ permutações e calcula o gabarito final automaticamente.

#### Campos da Questão:
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `expressao` | `string` | **Sim** | A fórmula lógica a ser resolvida (ex: `"(P ∨ Q) ∧ ~R"` ou `"P → Q"`). |
| `celulas_reveladas` | `Record<string, boolean>` | *Opcional* | Andaime pedagógico (*Scaffolding*). Indique quais células aparecem preenchidas como dica para o aluno (ex: `{"0_P ∨ Q": true}`). Se não quiser dar dicas, omita ou deixe `{}`. |

*Campos omitidos pela IA que o parser preenche sozinho:* `variaveis`, `linhas` e `resposta_esperada`.

#### Conectivos Aceitos na Fórmula (`expressao`):
- **Negação:** `~` ou `¬`
- **Conjunção:** `∧`, `^` ou `&`
- **Disjunção:** `∨` ou `v` ou `|`
- **Implicação (Condicional):** `→` ou `->`
- **Bicondicional:** `↔` ou `<->`
- **Parênteses de agrupamento:** `(` e `)`

#### Exemplo JSON Mínimo e Suficiente:
```json
{
  "originalId": "q_tab_1",
  "tipo": "tabela_verdade",
  "topico": "Cálculo Proposicional",
  "enunciado": "Construa e preencha a tabela-verdade para a fórmula abaixo:",
  "expressao": "(P ∨ Q) ∧ ~P",
  "celulas_reveladas": {
    "0_P ∨ Q": true
  }
}
```

---

### 5.3 Tipo 3: Formalização Lógica (`"tipo": "formalizacao"`) — **Tradução Direta**

> [!IMPORTANT]
> **Teclado Virtual e Respostas Alternativas Automáticos:** 
> - A IA **NÃO precisa fornecer `teclado_virtual`**: os símbolos correspondentes (conectivos proposicionais ou quantificadores) são acoplados automaticamente pela plataforma na tela do aluno.
> - A IA **NÃO precisa de `respostas_alternativas`**: o motor de validação semântica verifica equivalência lógica por tautologia proposicional ($A \leftrightarrow B$) e $\alpha$-conversão de quantificadores de primeira ordem.

#### Campos da Questão:
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `resposta_esperada` | `string` | **Sim** | A fórmula canônica correta (ex: `"∀x(Hx → Mx)"` ou `"P ∧ ~Q"`). |
| `dicas` | `string[]` | **Sim** | Dicionário de tradução explicando as variáveis ou predicados para o aluno. |
| `modo_validacao` | `'semantico' \| 'estrito'` | *Opcional* | Padrão: `'semantico'`. Em modo semântico, o aluno pode responder variações equivalentes (como `Q ∧ P` em vez de `P ∧ Q`, ou `∀y(Hy → My)`) e a plataforma valida com sucesso. |

#### Símbolos e Operadores Suportados na Fórmula:
- Proposicional: `~`, `∧`, `∨`, `→`, `↔`, parênteses e letras maiúsculas (`P`, `Q`, `R`, etc.).
- Predicados (1ª Ordem): Quantificadores universal (`∀`) e existencial (`∃`), variáveis (`x`, `y`, `z`) e predicados (`Px`, `Hx`, `M(x)`).

#### Exemplo JSON Mínimo e Suficiente:
```json
{
  "originalId": "q_form_1",
  "tipo": "formalizacao",
  "topico": "Lógica de Predicados",
  "enunciado": "Formalize a sentença: 'Todo filósofo é curioso.'",
  "dicas": [
    "F(x): x é filósofo",
    "C(x): x é curioso"
  ],
  "resposta_esperada": "∀x(Fx → Cx)",
  "modo_validacao": "semantico"
}
```

---

### 5.4 Tipo 4: Múltipla Escolha (`"tipo": "multipla_escolha"`)

Permite criar questões teóricas ou desafios com alternativas fechadas, suportando formatação Markdown (negrito, símbolos) nas opções.

#### Campos Obrigatórios:
| Campo | Tipo | Descrição e Regras |
| :--- | :--- | :--- |
| `opcoes` | `Array<{ id: string; texto: string }>` | Mínimo de 2 opções. Cada opção deve ter um `id` único e o `texto` correspondente. |
| `resposta_esperada` | `string` | O `id` exato da opção que é o gabarito correto. |

#### Exemplo JSON Mínimo e Suficiente:
```json
{
  "originalId": "q_multi_1",
  "tipo": "multipla_escolha",
  "topico": "Conceitos Básicos",
  "enunciado": "Qual alternativa representa a lei do Terceiro Excluído?",
  "opcoes": [
    { "id": "opt1", "texto": "P ∨ ~P" },
    { "id": "opt2", "texto": "P ∧ ~P" },
    { "id": "opt3", "texto": "P → Q" }
  ],
  "resposta_esperada": "opt1"
}
```

---

## 6. Exemplo de Pacote Completo com Múltiplas Fases (Pronto para Importação)

Abaixo está um exemplo de pacote completo contendo **3 fases pedagógicas independentes**, demonstrando a importação em lote com os 4 tipos de questão simplificados:

```json
{
  "metadata": {
    "version": 1,
    "type": "logica-dinamica:package_export",
    "exportedAt": "2026-09-11T14:30:00.000Z"
  },
  "phases": [
    {
      "titulo": "Reconhecimento de Argumentos",
      "icone": "Network",
      "originalQuestionIds": ["q_diag_01", "q_diag_02"]
    },
    {
      "titulo": "Valoração Booleana",
      "icone": "Table2",
      "originalQuestionIds": ["q_tab_01", "q_tab_02"]
    },
    {
      "titulo": "Tradução em Predicados",
      "icone": "PenLine",
      "originalQuestionIds": ["q_form_01"]
    }
  ],
  "questions": [
    {
      "originalId": "q_diag_01",
      "tipo": "diagramacao",
      "topico": "Argumentos Dedutivos",
      "enunciado": "Classifique as sentenças em Premissa (P) ou Conclusão (C):",
      "frases": [
        { "id": "s1", "texto": "Se Sócrates é homem, então Sócrates é mortal." },
        { "id": "s2", "texto": "Sócrates é homem." },
        { "id": "s3", "texto": "Portanto, Sócrates é mortal." }
      ],
      "resposta_esperada": {
        "s1": "P",
        "s2": "P",
        "s3": "C"
      }
    },
    {
      "originalId": "q_diag_02",
      "tipo": "diagramacao",
      "topico": "Argumentação Cotidiana",
      "enunciado": "Identifique a premissa e a conclusão:",
      "frases": [
        { "id": "a1", "texto": "O tráfego aéreo foi suspenso porque a tempestade está muito forte." },
        { "id": "a2", "texto": "Logo, nenhum voo decolará esta manhã." }
      ],
      "resposta_esperada": {
        "a1": "P",
        "a2": "C"
      }
    },
    {
      "originalId": "q_tab_01",
      "tipo": "tabela_verdade",
      "topico": "Disjunção e Condicional",
      "enunciado": "Construa e complete a tabela-verdade da fórmula P → (P ∨ Q):",
      "expressao": "P → (P ∨ Q)"
    },
    {
      "originalId": "q_tab_02",
      "tipo": "tabela_verdade",
      "topico": "Negação e Conjunção",
      "enunciado": "Avalie a fórmula ~(P ∧ Q):",
      "expressao": "~(P ∧ Q)",
      "celulas_reveladas": {
        "0_P ∧ Q": true
      }
    },
    {
      "originalId": "q_form_01",
      "tipo": "formalizacao",
      "topico": "Quantificadores",
      "enunciado": "Formalize a sentença: 'Existe pelo menos um estudante que programa.'",
      "dicas": [
        "E(x): x é estudante",
        "P(x): x programa"
      ],
      "resposta_esperada": "∃x(Ex ∧ Px)",
      "modo_validacao": "semantico"
    }
  ]
}
```

---

## 7. Checklist Final para a IA

- [ ] `metadata.type` é rigorosamente `"logica-dinamica:package_export"`.
- [ ] `metadata.version` é o número `1`.
- [ ] O array `phases` contém os módulos desejados, com `titulo`, `icone` da lista oficial e os `originalQuestionIds`.
- [ ] Em `tabela_verdade`, forneceu apenas `expressao` (com parênteses balanceados) e opcionalmente `celulas_reveladas`. Não enviou arrays manuais de linhas ou valores.
- [ ] Em `formalizacao`, forneceu apenas `resposta_esperada` e `dicas`. Não incluiu `teclado_virtual` nem `respostas_alternativas`.
- [ ] Todos os IDs listados em `originalQuestionIds` existem como `originalId` em `questions`.
- [ ] O JSON gerado é puro e estritamente válido (sem comentários `//` no interior do código).
