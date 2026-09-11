# Brand Kit & Design System - Lógica Dinâmica

**Missão:** Desmistificar a lógica formal e o cálculo de predicados para estudantes de Ciência da Computação, transformando um aprendizado historicamente árido em uma experiência interativa, sem atritos matemáticos e visualmente gratificante.

## 1. Marca e Missão
* **Uso da Logo:** O símbolo (Cubo Isométrico) deve sempre preceder o nome. Em fundos escuros, o texto "Lógica" é branco e "Dinâmica" é azul primário. Sempre mantenha uma margem de respiro ("clear space") equivalente ao tamanho do próprio símbolo ao redor da logo.

## 2. Paleta de Cores
O tema padrão é o "Dark Mode". Isso reduz a fadiga ocular comum em IDEs e plataformas de estudo de exatas, além de criar uma estética de alto valor percebido.

### Identidade Primária
* **Primary Blue:** #3B82F6 (Usado em botões principais, destaques)
* **Blue Hover:** #2563EB (Usado para hover de interações primárias)

### Superfícies e Fundos (Neutras)
* **Background Base:** #0A0A0A (Fundo principal da tela)
* **Surface / Cards:** #171717 (Fundo de painéis, formulários e seções)
* **Borders:** #374151 (Linhas de divisão, bordas de cards e inputs)

### Feedback Semântico
* **Success (Tautologia):** #10B981
* **Warning (Contingência):** #F59E0B
* **Error (Contradição):** #EF4444

## 3. Tipografia

### UI e Leitura: Inter (Sans-serif)
Usada para navegação, enunciados, botões e textos de marketing.
* **Heading 1 (40px):** Títulos principais de páginas e heros. Peso: Bold (700).
* **Heading 2 (24px):** Títulos de seções e modais. Peso: Semi-Bold (600).
* **Body Text (16px):** Parágrafos base, usados para enunciados de exercícios e instruções de apoio ao usuário. Peso: Regular (400).

### Lógica e Código: JetBrains Mono (Monospace)
Usada ESTRITAMENTE para fórmulas lógicas, variáveis e tabelas-verdade. Alinha caracteres verticalmente.
* *Exemplo:* ∀x (Fx → Gx) ∧ ∃y (Hy ∨ ~Ky)

## 4. Tom de Voz
Como a nossa plataforma se comunica com os alunos através de microcópias, botões e feedbacks de correção.

* **✅ Encorajador, mas direto**
  A lógica já é difícil o suficiente. O sistema deve celebrar os acertos e ser claro nos erros, sem jargões desnecessários fora do escopo da matéria.
  * *Use:* "Quase lá! Verifique a linha 3 da sua tabela."
  * *Evite:* "Erro de Sintaxe. Input Inválido."

* **✅ Técnico, porém moderno**
  Use termos como "Validar", "Derivar", "Console" e "Deploy". Os usuários são alunos de computação; eles gostam de se sentir em um ambiente de desenvolvimento real.
  * *Use:* "Rodar Teste de Validade"
  * *Evite:* "Corrigir a minha tarefinha"

## 5. Componentes de UI (Comportamento)

### Botões de Ação
* **Primary:** Fundo primário, texto branco. Para ações principais (ex: "Validar Resposta").
* **Outline:** Fundo transparente, borda padrão, texto base. Fica com borda/texto primário no hover. Para navegação ou ações secundárias (ex: "Próxima Questão").
* **Disabled:** Fundo escurecido, texto silenciado, cursor bloqueado. Para ações indisponíveis (ex: "Bloqueado (Falta XP)").

### Inputs
* **Padrão:** Fundo "base" escuro, bordas sutis. Fonte Inter para textos comuns. Borda primária no foco.
* **Híbrido de Formalização:** Input com "Lógica Toolbar" acoplado ao topo. A toolbar contém botões com símbolos lógicos monospaçados (~, ∧, ∨, →, ↔, ∀, ∃) que injetam o caractere no input.
