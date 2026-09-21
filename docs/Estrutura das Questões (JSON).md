# Documentação da Estrutura de Dados (JSON) das Questões

Este documento detalha o formato esperado (schema) para cada tipo de questão suportada pela Plataforma de Lógica Dinâmica. O front-end lê essas propriedades para construir as interfaces corretamente em tempo real.

> [!TIP]
> **Para Agentes de IA geradores de conteúdo:** Consulte o [Guia de Especificação e Regras de Importação (IA)](./regras-importacao-ia.md) para obter os contratos restritos, checklist e modelo de pacote `.json` para importação direta no Modo Editor.

---

## 1. Propriedades Comuns (Base)

Toda questão, independentemente do tipo, estende `BaseQuestion` e possui os seguintes campos obrigatórios:

```json
{  
  "id": "q1",   
  "tipo": "diagramacao",   
  "topico": "Nome do Capítulo ou Módulo",  
  "enunciado": "Texto explicando o que o aluno deve fazer."  
}
```

- **id** (String): Identificador único da questão.  
- **tipo** (String): Define o componente de renderização. Opções: `"diagramacao"`, `"tabela_verdade"`, `"formalizacao"`.  
- **topico** (String): Tag informativa exibida no topo do exercício.  
- **enunciado** (String): Instrução principal apresentada ao aluno.

---

## 2. Tipo: Diagramação de Argumentos (`diagramacao`)

**Objetivo:** Permitir que o aluno classifique sentenças como Premissas (P) ou Conclusão (C).

**Campos Específicos:**
- **frases** (Array de Objetos): Sentenças do argumento contendo `id` único e `texto`.  
- **resposta_esperada** (Objeto): Mapeamento relacionando o `id` de cada frase com sua valoração esperada (`"P"` para premissa, `"C"` para conclusão).

**Exemplo Completo:**
```json
{  
  "id": "q1",  
  "tipo": "diagramacao",  
  "topico": "Estrutura de um Argumento",  
  "enunciado": "Classifique as partes do argumento abaixo:",  
  "frases": [  
    { "id": "f1", "texto": "Hoje é segunda-feira ou terça-feira." },  
    { "id": "f2", "texto": "Hoje não é segunda-feira." },  
    { "id": "f3", "texto": "Portanto, hoje é terça-feira." }  
  ],  
  "resposta_esperada": {  
    "f1": "P",  
    "f2": "P",  
    "f3": "C"  
  }  
}
```

---

## 3. Tipo: Tabela-Verdade (`tabela_verdade`)

**Objetivo:** Gerar uma matriz de valoração booleana para decompor e avaliar expressões lógicas proposicionais.

**Campos Específicos:**
- **variaveis** (Array de Strings): Lista ordenada contendo as variáveis atômicas base (ex: `"P"`, `"Q"`) seguidas das subexpressões intermediárias extraídas pelo parser (ex: `"P ∨ Q"`, `"~R"`).
- **linhas** (Array de Objetos): Matriz estrita de $2^n$ permutações booleanas ($n$ = total de variáveis atômicas). Cada linha possui `id` e array `valores` com o valor ("V" ou "F") de cada coluna.
- **expressao** (String): A fórmula lógica raiz da questão (ex: `(P ∨ Q) ∧ (~R)`).
- **resposta_esperada** (Array de Strings): Gabarito com o resultado booleano da coluna final (expressão raiz) para cada linha.
- **celulas_reveladas** (Objeto opcional, `Record<string, boolean>`): Andaime pedagógico (*scaffolding*). Mapeia identificadores de células para um booleano:
  - Se `true`: a célula é renderizada pré-preenchida para o aluno como dica e é ignorada na checagem de acertos.
  - Se `false` ou omitida: o aluno deve clicar nos botões interativos (V/F) para solucionar a célula.
  - **Padrão de chaves:** `${rowIndex}_${colName}` para colunas intermediárias (ex: `"0_P ∨ Q"`) e `${rowIndex}_final` para a coluna da fórmula raiz (ex: `"0_final"`).

**Exemplo Completo:**
```json
{  
  "id": "q3",  
  "tipo": "tabela_verdade",  
  "topico": "Cálculo Proposicional",  
  "enunciado": "Preencha os conectivos e a coluna final da expressão:",  
  "expressao": "(P ∨ Q) ∧ (~P)",  
  "variaveis": ["P", "Q", "P ∨ Q", "~P"],  
  "linhas": [  
    { "id": "row_1", "valores": ["V", "V", "V", "F"] },  
    { "id": "row_2", "valores": ["V", "F", "V", "F"] },  
    { "id": "row_3", "valores": ["F", "V", "V", "V"] },  
    { "id": "row_4", "valores": ["F", "F", "F", "V"] }  
  ],  
  "resposta_esperada": ["F", "F", "V", "F"],
  "celulas_reveladas": {
    "0_P ∨ Q": true,
    "1_P ∨ Q": true
  }
}
```

---

## 4. Tipo: Formalização (`formalizacao`)

**Objetivo:** Transcrever sentenças em linguagem natural para linguagem simbólica utilizando teclado lógico virtual integrado.

**Campos Específicos:**
- **dicas** (Array de Strings): Dicionário contextual mapeando letras e predicados (ex: `"P: é peculatário"`).
- **teclado_virtual** (Array de Strings): Lista de caracteres lógicos exibidos como botões de atalho no quiz (ex: `["~", "∧", "∨", "→"]`). *(Nota: No Modo Estudo, as variáveis da fórmula esperada são injetadas automaticamente no início do teclado virtual, mesmo que o array armazene prioritariamente os conectivos e operadores selecionados no Modo Editor. Letras exclusivas de `dicas` não poluem o teclado.)*
- **resposta_esperada** (String): A fórmula lógica exata esperada. *A validação ignora espaços em branco.*

**Exemplo Completo:**
```json
{  
  "id": "q6",  
  "tipo": "formalizacao",  
  "topico": "Lógica de Predicados",  
  "enunciado": "Formalize: 'Todo peculatário é repulsivo.'",  
  "dicas": [  
    "P: é peculatário",  
    "R: é repulsivo",  
    "x: variável individual"  
  ],  
  "teclado_virtual": ["∀", "∃", "~", "∧", "∨", "→"],  
  "resposta_esperada": "∀x(Px → Rx)"  
}
```

---

## 5. Tipo: Formalização de Argumentos (`formalizacao_argumento`)

**Objetivo:** Permitir ao aluno extrair, segmentar e formalizar individualmente premissas e conclusão de argumentos dedutivos completos.

**Campos Específicos:**
- **dicas** (Array de Strings): Dicionário de proposições, predicados e variáveis (ex: `"D: Deus existe"`, `"x: variável individual"`).
- **teclado_virtual** (Array de Strings): Símbolos lógicos ativos no teclado virtual (ex: `["~", "∧", "∨", "→", "↔"]`). *(Nota: No Modo Estudo, as variáveis das premissas e conclusão são injetadas automaticamente no início do teclado virtual, sem necessidade de configuração manual no Modo Editor.)*
- **resposta_esperada** (Objeto):
  - **premissas** (Array de Strings): Lista de fórmulas correspondentes às premissas do argumento (a ordem de preenchimento pelo aluno é indiferente).
  - **conclusao** (String): Fórmula correspondente à conclusão dedutiva do argumento.
- **modo_validacao** (String opcional, `"semantico"` | `"estrito"`): Define se o motor lógico aceita tautologias/equivalências e $\alpha$-conversão de predicados (`"semantico"`) ou exige correspondência textual direta (`"estrito"`). Padrão: `"semantico"`.

**Exemplo Completo (Argumento Proposicional - Modus Ponens):**
```json
{  
  "id": "q-mp-1",  
  "tipo": "formalizacao_argumento",  
  "topico": "Modus Ponens",  
  "enunciado": "Se Deus existe, então a vida tem significado. Deus existe. Portanto, a vida tem significado.",  
  "dicas": [  
    "D: Deus existe",  
    "V: A vida tem significado"  
  ],  
  "teclado_virtual": ["~", "∧", "∨", "→", "↔"],  
  "resposta_esperada": {  
    "premissas": ["D → V", "D"],  
    "conclusao": "V"  
  },  
  "modo_validacao": "semantico"  
}
```

**Exemplo Completo (Argumento com Quantificadores - Silogismo Categórico):**
```json
{  
  "id": "q-pred-1",  
  "tipo": "formalizacao_argumento",  
  "topico": "Lógica de Predicados",  
  "enunciado": "Todo homem é mortal. Sócrates é homem. Portanto, Sócrates é mortal.",  
  "dicas": [  
    "H: é homem",  
    "M: é mortal",  
    "s: Sócrates",  
    "x: variável individual"  
  ],  
  "teclado_virtual": ["∀", "∃", "~", "∧", "∨", "→"],  
  "resposta_esperada": {  
    "premissas": ["∀x(Hx → Mx)", "Hs"],  
    "conclusao": "Ms"  
  },  
  "modo_validacao": "semantico"  
}
```

---

## 6. Tipo: Múltipla Escolha (`multipla_escolha`)

**Objetivo:** Permitir ao aluno escolher uma única alternativa correta entre várias opções.

**Campos Específicos:**
- **opcoes** (Array de Objetos): Lista de opções disponíveis. Cada objeto possui um `id` único e um `texto`.
- **resposta_esperada** (String): O `id` correspondente à opção correta.

**Exemplo Completo:**
```json
{
  "id": "q-multi-1",
  "tipo": "multipla_escolha",
  "topico": "Semântica Proposicional",
  "enunciado": "Qual das seguintes fórmulas é uma Tautologia?",
  "opcoes": [
    { "id": "opt_1", "texto": "P ∨ Q" },
    { "id": "opt_2", "texto": "P ∧ ~P" },
    { "id": "opt_3", "texto": "P ∨ ~P" }
  ],
  "resposta_esperada": "opt_3"
}
```

---

## 7. Estrutura de Fases, Persistência & Banco de Questões (`EditorState`)

No Modo Editor, os dados são persistidos no `localStorage` sob a chave `"logica-dinamica:editor-state"`.
Para garantir escalabilidade e reaproveitamento, adotamos uma **Estrutura Relacional**: as questões vivem em um banco central (`questionBank`), enquanto as fases apenas referenciam essas questões através de IDs.

### Schema da Fase (`Phase`):
```json
{
  "id": "fase-tabela-verdade",
  "titulo": "Tabela-Verdade",
  "icone": "Table2",
  "questionIds": ["q3", "q6"] // Apenas referências (IDs)
}
```

**Ícones Suportados (`LucideIconName`):**
`"Network"`, `"Table2"`, `"PenLine"`, `"BookOpen"`, `"Brain"`, `"Target"`, `"Lightbulb"`, `"GraduationCap"`, `"Puzzle"`, `"FlaskConical"`.

### Schema de Persistência (`EditorState`):
```json
{
  "version": 2,
  "updatedAt": "2026-09-11T10:00:00.000Z",
  "phases": [
    {
      "id": "fase-1",
      "titulo": "Fase 1: Tabela-Verdade",
      "icone": "Table2",
      "questionIds": ["q3"]
    },
    {
      "id": "fase-2",
      "titulo": "Fase 2: Formalização",
      "icone": "Brain",
      "questionIds": ["q6"]
    }
  ],
  "questionBank": {
    "q3": { 
      "id": "q3", 
      "tipo": "tabela_verdade" 
      /* ... demais propriedades da questão ... */ 
    },
    "q6": { 
      "id": "q6", 
      "tipo": "formalizacao" 
      /* ... demais propriedades da questão ... */ 
    }
  }
}
```

> **Nota de Implementação (Formalização "Zero Config"):** No caso da Formalização, campos como `dicas` e `teclado_virtual` continuam existindo no JSON para fins de renderização, porém, no modo Editor, eles são populados automaticamente pelo sistema baseados na `resposta_esperada`, ficando ocultos do professor sob uma aba de "Opções Avançadas".
