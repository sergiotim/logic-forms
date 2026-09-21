# [SPEC-008] Motor de Criação e Validação de Questões de Formalização de Argumentos

- **Autor(es):** Equipe Lógica Dinâmica
- **Status:** Aprovado / Implementado
- **Data de Criação:** 2026-09-15
- **Última Atualização:** 2026-09-15
- **Target Release / Milestone:** v2.5.0

---

## 1. Contexto & Objetivos

### 1.1 Problema / Motivação
Atualmente, as questões do tipo `formalizacao` (SPEC-004) focam em traduzir frases ou sentenças isoladas para linguagem simbólica. Embora eficaz para o ensino da sintaxe lógica, não cobre o próximo passo pedagógico fundamental: a **estruturação de argumentos dedutivos completos** compostos por múltiplas premissas e uma conclusão (ex: Modus Ponens, Silogismo Hipotético).

Se tentássemos adaptar a formalização atual para argumentos, o aluno teria que escrever tudo numa única linha (ex: `D -> V, D |- V`), o que pode ser engessado, focado demais na sintaxe dos conectivos de dedução, e pedagogicamente fraco no quesito "identificação das partes de um argumento".

### 1.2 Objetivos (Goals)
- [x] Criar um novo tipo de questão: `formalizacao_argumento`.
- [x] Implementar uma UI de Aluno que obrigue o estudante a segmentar o texto, identificando a quantidade exata de premissas antes de formalizá-las.
- [x] Implementar um Teclado Virtual Global com suporte a "Foco Ativo" para gerenciar múltiplos campos de input sem poluir a interface.
- [x] Desenvolver um validador de conjuntos (array matching) que suporte a avaliação de premissas independentemente da ordem inserida pelo aluno.
- [x] Reutilizar as configurações de Rigor Pedagógico (`modo_validacao: 'semantico' | 'estrito'`) da SPEC-004 para cada premissa/conclusão.
- [x] Suportar quantificadores (`∀`, `∃`) e $\alpha$-conversão de variáveis ligadas (`normalizeQuantifiedVariables`).
- [x] Alinhar estritamente o formulário do Editor (`FormalizacaoArgumentoForm.tsx`) com o padrão de UI/UX de `FormalizacaoForm.tsx` (barra de atalhos acoplada, validação sintática em tempo real, auto-sugestão e sincronização de dicas).

### 1.3 Fora de Escopo (Non-Goals)
- Criação de árvores de dedução natural (provas formais passo a passo). O escopo limita-se a extrair e formalizar a estrutura básica (Premissas e Conclusão) a partir de um texto em linguagem natural.

---

## 2. Arquitetura do Motor de Validação

O validador para `formalizacao_argumento` lida com uma estrutura de dados dividida em duas partes: uma lista de premissas e uma conclusão única.

### 2.1 Validação da Conclusão (1 para 1)
- O sistema compara a `conclusao` submetida pelo aluno com a `conclusao` esperada no gabarito.
- A validação herda as lógicas de normalização textual e equivalência semântica do `parser.ts` (conforme especificado na SPEC-004).

### 2.2 Validação das Premissas (N para N, Sem Ordem Definida)
Como a ordem das premissas não altera a validade lógica do argumento, o validador utiliza um algoritmo de correspondência de conjuntos:
1. **Verificação de Quantidade:** Verifica se o número de premissas inseridas pelo aluno é igual ao número de premissas no gabarito. Falhas aqui geram feedbacks específicos (ex: "Você identificou premissas a mais/a menos").
2. **Correspondência (Match):**
   - Um conjunto temporário `gabaritoPool` é criado contendo as premissas esperadas.
   - Para cada `premissaAluno`, o motor busca um "match" no `gabaritoPool` (utilizando validação estrita ou semântica, conforme a configuração da questão).
   - Ao encontrar um match, a premissa é removida do `gabaritoPool`.
3. **Critério de Aprovação:** A validação é bem-sucedida se, ao final do processo, o `gabaritoPool` estiver vazio e todas as premissas submetidas tiverem encontrado um match.

---

## 3. Extensões no Modelo de Dados (TypeScript)

Adição de uma nova interface `FormalizacaoArgumentoQuestion` em `src/types/index.ts`:

```typescript
export interface FormalizacaoArgumentoQuestion extends BaseQuestion {
  tipo: 'formalizacao_argumento';
  dicas: string[];
  teclado_virtual: string[];
  resposta_esperada: {
    premissas: string[]; // Array de premissas (a ordem não importará na validação)
    conclusao: string;
  };
  modo_validacao?: 'semantico' | 'estrito'; // Padrão: 'semantico'
}
```

---

## 4. Experiência do Usuário (UI/UX)

### 4.1 Visão do Professor (Modo Editor)
No componente `FormalizacaoArgumentoForm.tsx` (nova aba no modal de criação):
- O professor preenche o Enunciado normalmente.
- **Seção Gabarito:**
  - Existe uma área de "Premissas Esperadas" com um botão `[ + Adicionar Premissa ao Gabarito ]`.
  - O professor cria campos dinâmicos e digita a fórmula de cada premissa (ex: `D -> V` no primeiro, `D` no segundo).
  - Existe um campo isolado e fixo para a "Conclusão Esperada" (ex: `V`).
- O professor pode definir as regras de `modo_validacao` (Estrito vs Semântico) herdadas da SPEC-004.
- **Teclado Virtual do Aluno no Editor:** Exibe exclusivamente os conectivos lógicos (`AVAILABLE_KEYS`) para controle de atalhos e distratores. As teclas de variáveis não poluem o formulário, pois são extraídas e sincronizadas automaticamente das fórmulas do gabarito (incluindo exclusão automática caso uma premissa seja apagada).

### 4.2 Visão do Aluno (Modo Estudo) — Ergonomia Mobile e Fluxo de Resolução
Para elevar o desafio cognitivo e não "dar a resposta", a interface do estudante não revela a quantidade inicial de premissas.
- **Estado Inicial:** Exibe 1 campo vazio de Premissa e 1 campo vazio de Conclusão separados por uma linha horizontal, e um botão `[ + Adicionar outra premissa ]`.
- **Ação:** O aluno deve segmentar o texto mentalmente. Se identificar mais de uma premissa, ele clica em "Adicionar", revelando novos inputs (que podem ser deletados via ícone de lixeira/X se adicionados acidentalmente).
- **Tipografia Responsiva do Enunciado:** Escala de fonte e espaçamento adaptados para telas pequenas (`text-sm sm:text-base md:text-2xl` e `gap-1.5 md:gap-4`), evitando que o enunciado consuma todo o espaço vertical visível no mobile.
- **Dicas sem Rolagem Lateral (Topo):**
  - O dicionário de variáveis/predicados é renderizado diretamente em chips compactos com quebra fluida (`flex-wrap gap-1.5`) sem prefixo ou título ("Léxico"), eliminando qualquer rolagem horizontal ou ruído visual.
- **Área Central de Trabalho (Workspace) com Supressão de Teclado Nativo:**
  - A lista dinâmica de premissas e a conclusão ocupam o centro da visualização.
  - **Exclusividade do Teclado Virtual (`inputMode="none"`):** Todos os campos de texto utilizam `inputMode="none"`, impedindo que o teclado nativo do celular (iOS/Android) se abra e cubra a interface, permitindo que a digitação ocorra 100% pelo teclado virtual acoplado.
- **Teclado Virtual Global Ancorado na Base (Thumb-Zone Ergonomics & Zero Rolagem Lateral):**
  - O teclado virtual único é ancorado na base da tela (`sticky bottom-0 z-20`), imediatamente acima do botão de validação, na zona ergonômica natural dos polegares em smartphones.
  - **Disposição sem Rolagem Lateral:** Teclas organizadas com quebra natural (`flex-wrap gap-1 sm:gap-1.5 justify-center`) e largura máxima delimitada (`max-w-[3.5rem]`), visíveis integralmente sem qualquer scroll lateral.
  - **Botão de Apagar (Backspace):** Inclui tecla dedicada de deleção (`Delete` icon) que apaga o caractere imediatamente anterior ao cursor (ou a seleção ativa) mantendo o foco no campo ativo.
  - **Foco Ativo Inteligente:** O teclado exibe um indicador dinâmico pulsante (`Editando Premissa X` ou `Editando Conclusão`). Cliques nas teclas inserem símbolos unicamente no input ativo.
  - **Retenção de Foco:** Teclas virtuais utilizam `onMouseDown={(e) => e.preventDefault()}` para evitar que o clique tire o foco do campo de texto ativo.
  - **Origem Estrita do Gabarito:** As variáveis disponíveis no teclado são extraídas estritamente das premissas e da conclusão esperadas. Letras exclusivas de `dicas` não entram no teclado.
  - **Prioridade Posicional:** As variáveis/predicados são renderizados obrigatoriamente no início da barra de teclas, antes dos operadores lógicos e parênteses.

---

## 5. Critérios de Aceite e Testes (TDD)

### 5.1 Testes Unitários (`src/lib/__tests__/formalizacao-argumento-validator.test.ts`)
- [ ] **Validação de Ordem:** Garante que submeter `["D", "D -> V"]` seja aprovado contra o gabarito `["D -> V", "D"]`.
- [ ] **Validação de Quantidade:** Garante que submeter 3 premissas para um gabarito de 2 premissas retorne erro (sem validar o conteúdo interno).
- [ ] **Validação Semântica Integrada:** Garante que submeter `["~D \/ V", "D"]` (modo semântico) passe contra `["D -> V", "D"]`.

### 5.2 Testes de Integração (`Editor.test.tsx`)
- [ ] Professor consegue adicionar, editar e remover premissas dinâmicas ao montar o gabarito.
- [ ] Live preview (Visão do Aluno) reflete exatamente o estado oculto (mostrando apenas 1 premissa inicial mesmo se o gabarito tiver 3).

### 5.3 Testes de Integração (`Lobby.test.tsx` / `Quiz`)
- [ ] Aluno consegue focar em campos de premissa diferentes e o Teclado Virtual insere o texto no input ativo (Foco Ativo).
- [ ] Aluno recebe feedback textual customizado se errar apenas na quantidade ("Você identificou premissas a menos").
