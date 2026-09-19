# [SPEC-008] Questão de Múltipla Escolha (`multipla_escolha`)

## 1. Visão Geral
Este documento especifica o novo tipo de questão padrão para formulários e avaliações: a **Múltipla Escolha** de resposta única. Este tipo é focado em apresentar um enunciado (já coberto por `BaseQuestion`) e uma lista de opções onde apenas uma é a correta.

## 2. Schema e Estrutura de Dados

### 2.1. TypeScript (em `src/types/index.ts`)
A estrutura flexível que será salva dentro do campo JSON no banco de dados obedecerá à seguinte interface:

```typescript
export interface MultiplaEscolhaQuestion extends BaseQuestion {
  tipo: 'multipla_escolha';
  opcoes: { 
    id: string;      // Identificador único (UUID) da opção
    texto: string;   // Texto da opção (com suporte a formatação Markdown)
  }[];
  resposta_esperada: string; // ID da opção que é o gabarito correto
}
```
*Note que `BaseQuestion` já garante os campos obrigatórios: `id`, `tipo`, `topico` e `enunciado`.*

### 2.2. Prisma e Banco de Dados (Neon)
Será necessário alterar o `schema.prisma` para acomodar o novo tipo, exigindo uma migração de banco. O enum `QuestionType` será expandido:
```prisma
enum QuestionType {
  DIAGRAMACAO
  TABELA_VERDADE
  FORMALIZACAO
  FORMALIZACAO_ARGUMENTO // (Garantir que esse também esteja presente)
  MULTIPLA_ESCOLHA       // <-- Novo Tipo
}
```

## 3. Visão do Editor (Painel do Professor)
No modo editor (`/editor`), o componente de formulário para essa questão possuirá os seguintes requisitos:
- **Campos Dinâmicos:** Um botão primário "Adicionar Opção" permitirá criar novas alternativas dinamicamente.
- **Inserção de Texto:** Cada opção terá um campo de texto. **Regra de preenchimento:** O professor deve inserir apenas o conteúdo real da resposta, sem numerar ou colocar "A)", "B)".
- **Suporte a Markdown:** Assim como o enunciado, as opções poderão interpretar formatações como negrito, itálico e fórmulas/símbolos.
- **Seletor de Gabarito:** Ao lado de cada campo de texto, haverá um *radio button* que, ao ser selecionado, atribui o ID daquela opção à variável `resposta_esperada`.
- **Validação:** A questão não pode ser salva sem que possua pelo menos 2 opções e uma delas selecionada como resposta correta.

## 4. Visão do Aluno (Modo Estudo)
A experiência do estudante focará em usabilidade (UX) e integridade da avaliação:
- **Design de Cards:** As alternativas não serão apenas "bolinhas" pequenas, mas sim Cards retangulares clicáveis que se expandem pela largura disponível. Ao clicar, o card ganha destaque (cor primária do tema) facilitando o toque em telas móveis.
- **Embaralhamento (Shuffling):** Sempre que a questão for carregada, um algoritmo embaralhará a ordem das opções daquele aluno para dificultar o comportamento de "cola" por posicionamento.
- **Letras Dinâmicas:** Independentemente de como as opções foram embaralhadas, o sistema injetará os prefixos visuais "A)", "B)", "C)", "D)" em ordem fixa para cada card renderizado, garantindo a estética clássica de prova enquanto esconde a randomização.

## 5. Avaliação e Submissão
A lógica de checagem do gabarito é estrita e determinística:
- O sistema comparará o ID da opção selecionada pelo aluno com o ID definido em `resposta_esperada`.
- O resultado (acerto/erro) e as submissões serão rastreados normalmente pela camada de Analytics existente no sistema, sob o tipo de `MULTIPLA_ESCOLHA`.

