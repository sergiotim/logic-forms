export interface LogicalContext {
  [variableName: string]: boolean;
}

export interface LogicalNode {
  evaluate(context: LogicalContext): boolean;
  getVariables(): Set<string>;
  formatText(parentPrecedence?: number): string;
}

export class VariableNode implements LogicalNode {
  constructor(public name: string) {}
  evaluate(context: LogicalContext): boolean { return !!context[this.name]; }
  getVariables(): Set<string> { return new Set([this.name]); }
  formatText(parentPrecedence: number = 0): string { return this.name; }
}

export class NegationNode implements LogicalNode {
  constructor(public child: LogicalNode, public symbol: string = '~') {}
  evaluate(context: LogicalContext): boolean { return !this.child.evaluate(context); }
  getVariables(): Set<string> { return this.child.getVariables(); }
  formatText(parentPrecedence: number = 0): string {
    if (this.child instanceof VariableNode) {
      return `${this.symbol}${this.child.formatText()}`;
    }
    return `${this.symbol}(${this.child.formatText(5)})`;
  }
}

export class ConjunctionNode implements LogicalNode {
  constructor(public left: LogicalNode, public right: LogicalNode) {}
  evaluate(context: LogicalContext): boolean { return this.left.evaluate(context) && this.right.evaluate(context); }
  getVariables(): Set<string> { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  formatText(parentPrecedence: number = 0): string {
    const text = `${this.left.formatText(4)} ∧ ${this.right.formatText(4)}`;
    return parentPrecedence > 4 ? `(${text})` : text;
  }
}

export class DisjunctionNode implements LogicalNode {
  constructor(public left: LogicalNode, public right: LogicalNode) {}
  evaluate(context: LogicalContext): boolean { return this.left.evaluate(context) || this.right.evaluate(context); }
  getVariables(): Set<string> { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  formatText(parentPrecedence: number = 0): string {
    const text = `${this.left.formatText(3)} ∨ ${this.right.formatText(3)}`;
    return parentPrecedence > 3 ? `(${text})` : text;
  }
}

export class ConditionalNode implements LogicalNode {
  constructor(public left: LogicalNode, public right: LogicalNode) {}
  evaluate(context: LogicalContext): boolean { return !this.left.evaluate(context) || this.right.evaluate(context); }
  getVariables(): Set<string> { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  formatText(parentPrecedence: number = 0): string {
    const text = `${this.left.formatText(2)} → ${this.right.formatText(2)}`;
    return parentPrecedence > 2 ? `(${text})` : text;
  }
}

export class BiconditionalNode implements LogicalNode {
  constructor(public left: LogicalNode, public right: LogicalNode) {}
  evaluate(context: LogicalContext): boolean { return this.left.evaluate(context) === this.right.evaluate(context); }
  getVariables(): Set<string> { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  formatText(parentPrecedence: number = 0): string {
    const text = `${this.left.formatText(1)} ↔ ${this.right.formatText(1)}`;
    return parentPrecedence > 1 ? `(${text})` : text;
  }
}

type TokenType = 'VAR' | 'NOT' | 'AND' | 'OR' | 'IMPLIES' | 'IFF' | 'LPAREN' | 'RPAREN';
interface Token { type: TokenType; value: string; }

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) { i++; continue; }
    
    // Negação
    if (char === '~' || char === '¬') { tokens.push({ type: 'NOT', value: char }); i++; continue; }
    
    // Conjunção
    if (char === '^' || char === '∧' || char === '&') { tokens.push({ type: 'AND', value: char }); i++; continue; }
    
    // Bicondicional e Condicional de múltiplos caracteres
    if (input.substring(i, i+3) === '<->') { tokens.push({ type: 'IFF', value: '<->' }); i+=3; continue; }
    if (input.substring(i, i+2) === '->') { tokens.push({ type: 'IMPLIES', value: '->' }); i+=2; continue; }
    
    if (char === '↔') { tokens.push({ type: 'IFF', value: char }); i++; continue; }
    if (char === '→') { tokens.push({ type: 'IMPLIES', value: char }); i++; continue; }
    
    // Disjunção (suporta v, V, ∨, |) - DEVE vir antes de checar variáveis
    if (char === 'v' || char === 'V' || char === '∨' || char === '|') {
      tokens.push({ type: 'OR', value: '∨' });
      i++;
      continue;
    }
    
    if (char === '(') { tokens.push({ type: 'LPAREN', value: char }); i++; continue; }
    if (char === ')') { tokens.push({ type: 'RPAREN', value: char }); i++; continue; }
    
    // Variáveis proposicionais (ex: P, Q, R, P1)
    if (/[a-zA-Z]/.test(char)) {
       let varName = char;
       let j = i + 1;
       while (j < input.length && /[a-zA-Z0-9_]/.test(input[j])) {
           varName += input[j];
           j++;
       }
       tokens.push({ type: 'VAR', value: varName });
       i = j;
       continue;
    }
    
    throw new Error(`Token inválido na posição ${i}: ${char}`);
  }
  return tokens;
}

export function parse(input: string): LogicalNode {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error("Fórmula vazia");
  
  let current = 0;
  
  function match(...types: TokenType[]): boolean {
    if (current < tokens.length && types.includes(tokens[current].type)) {
      current++;
      return true;
    }
    return false;
  }
  
  function peek(): Token | null {
    if (current < tokens.length) return tokens[current];
    return null;
  }
  
  function previous(): Token {
    return tokens[current - 1];
  }
  
  function consume(type: TokenType, message: string): Token {
    if (match(type)) return previous();
    throw new Error(message);
  }
  
  function expression(): LogicalNode {
    return iff();
  }
  
  function iff(): LogicalNode {
    let expr = implies();
    while (match('IFF')) {
      const right = implies();
      expr = new BiconditionalNode(expr, right);
    }
    return expr;
  }
  
  function implies(): LogicalNode {
    let expr = or();
    while (match('IMPLIES')) {
      const right = or();
      expr = new ConditionalNode(expr, right);
    }
    return expr;
  }
  
  function or(): LogicalNode {
    let expr = and();
    while (match('OR')) {
      const right = and();
      expr = new DisjunctionNode(expr, right);
    }
    return expr;
  }
  
  function and(): LogicalNode {
    let expr = not();
    while (match('AND')) {
      const right = not();
      expr = new ConjunctionNode(expr, right);
    }
    return expr;
  }
  
  function not(): LogicalNode {
    if (match('NOT')) {
      const sym = previous().value;
      const right = not();
      return new NegationNode(right, sym);
    }
    return primary();
  }
  
  function primary(): LogicalNode {
    if (match('VAR')) {
      return new VariableNode(previous().value);
    }
    
    if (match('LPAREN')) {
      const expr = expression();
      consume('RPAREN', "Esperado ')' após a expressão.");
      return expr;
    }
    
    const t = peek();
    if (t) {
        throw new Error(`Sintaxe inválida: inesperado token ${t.value}`);
    }
    throw new Error("Sintaxe inválida: expressão incompleta.");
  }
  
  const ast = expression();
  
  if (current < tokens.length) {
    if (tokens[current].type === 'VAR' && tokens[current - 1] && tokens[current - 1].type === 'VAR') {
        throw new Error("Variáveis consecutivas sem operador (ex: P Q).");
    }
    throw new Error("Sintaxe inválida: existem tokens adicionais após a expressão.");
  }
  
  return ast;
}

export interface SubExpression {
  text: string;
  node: LogicalNode;
}

/**
 * Extrai todas as sub-expressões (operações/conectivos) da AST em ordem de dependência (bottom-up).
 * O último elemento retornado é a expressão raiz.
 */
export function extractSubexpressions(root: LogicalNode): SubExpression[] {
  const result: SubExpression[] = [];
  const seen = new Set<string>();

  function traverse(node: LogicalNode) {
    if (node instanceof VariableNode) {
      return;
    }

    if (node instanceof NegationNode) {
      traverse(node.child);
    } else if (
      node instanceof ConjunctionNode ||
      node instanceof DisjunctionNode ||
      node instanceof ConditionalNode ||
      node instanceof BiconditionalNode
    ) {
      traverse(node.left);
      traverse(node.right);
    }

    const text = node.formatText();
    if (!seen.has(text)) {
      seen.add(text);
      result.push({ text, node });
    }
  }

  traverse(root);
  return result;
}

export interface TruthTableData {
  baseVariables: string[];
  intermediateHeaders: string[];
  allHeaders: string[]; // baseVariables + intermediateHeaders
  finalExpression: string;
  totalColumns: number;
  rows: { id: string; valores: string[] }[];
  expected: string[];
}

/**
 * Auto-gera todas as colunas (variáveis + conectivos intermediários + fórmula final)
 * e calcula as matrizes de linhas e gabarito.
 * O número de linhas geradas é ESTRITAMENTE 2^(número de variáveis base), NÃO 2^(colunas).
 */
export function generateTruthTable(expression: string): TruthTableData {
  const ast = parse(expression);
  // Garante que apenas as variáveis base (ex: P, Q, R) determinam o número de linhas (2^n)
  const baseVariables = Array.from(ast.getVariables()).sort();
  const subexpressions = extractSubexpressions(ast);

  // Sub-expressões intermediárias (todas exceto o nó raiz final)
  const intermediate = subexpressions.slice(0, -1);
  const intermediateHeaders = intermediate.map(s => s.text);
  const allHeaders = [...baseVariables, ...intermediateHeaders];

  // ESTRITAMENTE 2^(número de variáveis base). Ex: 3 variáveis => 2^3 = 8 linhas!
  const totalRows = Math.pow(2, baseVariables.length);
  const rows: { id: string; valores: string[] }[] = [];
  const expected: string[] = [];

  for (let i = 0; i < totalRows; i++) {
    const valores: string[] = [];
    const context: Record<string, boolean> = {};

    // 1. Preenche as colunas de variáveis base (P, Q, R)
    for (let j = 0; j < baseVariables.length; j++) {
      const bit = (i >> (baseVariables.length - 1 - j)) & 1;
      const valStr = bit === 0 ? 'V' : 'F';
      valores.push(valStr);
      context[baseVariables[j]] = valStr === 'V';
    }

    // 2. Preenche as colunas de conectivos intermediários (ex: P ∨ Q, ~R)
    for (let k = 0; k < intermediate.length; k++) {
      const res = intermediate[k].node.evaluate(context);
      valores.push(res ? 'V' : 'F');
    }

    rows.push({
      id: `row_${i + 1}`,
      valores,
    });

    // 3. Calcula o resultado da coluna final (expressão completa)
    const finalResult = ast.evaluate(context);
    expected.push(finalResult ? 'V' : 'F');
  }

  return {
    baseVariables,
    intermediateHeaders,
    allHeaders,
    finalExpression: expression,
    totalColumns: allHeaders.length + 1,
    rows,
    expected,
  };
}
