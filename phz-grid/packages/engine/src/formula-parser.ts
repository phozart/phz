/**
 * @phozart/phz-engine — Formula Parser
 *
 * Recursive descent parser for formula text → ExpressionNode AST.
 * Also provides a formatter: ExpressionNode → formula text.
 *
 * Reference syntax:
 *   [field_name]  — dataset field
 *   $param_name   — parameter
 *   @metric_name  — metric reference
 *   ~calc_name    — calculated field reference
 *
 * Operator precedence (lowest to highest):
 *   OR → AND → equality (==, !=) → comparison (>, >=, <, <=) →
 *   addition (+, -) → multiplication (*, /, %) → power (^) → unary (-, NOT)
 *
 * Functions: FUNC_NAME(arg1, arg2, ...)
 * Null checks: [field] IS NULL, [field] IS NOT NULL
 * Conditionals: IF(cond, then, else)
 */

import type {
  ExpressionNode, BinaryOperator, UnaryOperator, BuiltinFunction, SourcePosition,
} from './expression-types.js';

// --- Parse Result ---

export interface ParseResult {
  node: ExpressionNode | null;
  errors: Array<{ message: string; pos: number }>;
}

// --- Tokenizer ---

type TokenType =
  | 'number' | 'string' | 'boolean' | 'null'
  | 'field_ref' | 'param_ref' | 'metric_ref' | 'calc_ref'
  | 'ident' | 'op' | 'paren' | 'comma' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const KEYWORDS = new Set(['true', 'false', 'null', 'and', 'or', 'not', 'is']);
const BUILTIN_FUNCTIONS = new Set<string>([
  'ABS', 'ROUND', 'FLOOR', 'CEIL',
  'UPPER', 'LOWER', 'TRIM', 'LEN', 'SUBSTR', 'CONCAT',
  'YEAR', 'MONTH', 'DAY',
  'COALESCE', 'IF', 'CLAMP',
]);

function tokenize(input: string): { tokens: Token[]; errors: Array<{ message: string; pos: number }> } {
  const tokens: Token[] = [];
  const errors: Array<{ message: string; pos: number }> = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Field reference: [field_name]
    if (ch === '[') {
      const start = i;
      i++;
      let name = '';
      while (i < input.length && input[i] !== ']') {
        name += input[i++];
      }
      if (i < input.length) i++; // skip ]
      else errors.push({ message: 'Unterminated field reference', pos: start });
      tokens.push({ type: 'field_ref', value: name, pos: start });
      continue;
    }

    // Parameter reference: $param_name
    if (ch === '$') {
      const start = i;
      i++;
      let name = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        name += input[i++];
      }
      tokens.push({ type: 'param_ref', value: name, pos: start });
      continue;
    }

    // Metric reference: @metric_name
    if (ch === '@') {
      const start = i;
      i++;
      let name = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        name += input[i++];
      }
      tokens.push({ type: 'metric_ref', value: name, pos: start });
      continue;
    }

    // Calc field reference: ~calc_name
    if (ch === '~') {
      const start = i;
      i++;
      let name = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        name += input[i++];
      }
      tokens.push({ type: 'calc_ref', value: name, pos: start });
      continue;
    }

    // String literal: "..." or '...'
    if (ch === '"' || ch === "'") {
      const start = i;
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          i++;
          str += input[i];
        } else {
          str += input[i];
        }
        i++;
      }
      if (i < input.length) i++; // skip closing quote
      else errors.push({ message: 'Unterminated string literal', pos: start });
      tokens.push({ type: 'string', value: str, pos: start });
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < input.length && /[0-9]/.test(input[i + 1]))) {
      const start = i;
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i++];
      }
      tokens.push({ type: 'number', value: num, pos: start });
      continue;
    }

    // Operators
    if ('+-*/%^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch, pos: i });
      i++;
      continue;
    }

    // Comparison operators
    if (ch === '=' && i + 1 < input.length && input[i + 1] === '=') {
      tokens.push({ type: 'op', value: '==', pos: i });
      i += 2;
      continue;
    }
    if (ch === '!' && i + 1 < input.length && input[i + 1] === '=') {
      tokens.push({ type: 'op', value: '!=', pos: i });
      i += 2;
      continue;
    }
    if (ch === '>' && i + 1 < input.length && input[i + 1] === '=') {
      tokens.push({ type: 'op', value: '>=', pos: i });
      i += 2;
      continue;
    }
    if (ch === '<' && i + 1 < input.length && input[i + 1] === '=') {
      tokens.push({ type: 'op', value: '<=', pos: i });
      i += 2;
      continue;
    }
    if (ch === '>') {
      tokens.push({ type: 'op', value: '>', pos: i });
      i++;
      continue;
    }
    if (ch === '<') {
      tokens.push({ type: 'op', value: '<', pos: i });
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch, pos: i });
      i++;
      continue;
    }

    // Comma
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',', pos: i });
      i++;
      continue;
    }

    // Identifiers / keywords
    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i++];
      }
      const lower = ident.toLowerCase();
      if (lower === 'true' || lower === 'false') {
        tokens.push({ type: 'boolean', value: lower, pos: start });
      } else if (lower === 'null') {
        tokens.push({ type: 'null', value: 'null', pos: start });
      } else {
        tokens.push({ type: 'ident', value: ident, pos: start });
      }
      continue;
    }

    errors.push({ message: `Unexpected character: '${ch}'`, pos: i });
    i++;
  }

  tokens.push({ type: 'eof', value: '', pos: input.length });
  return { tokens, errors };
}

// --- Parser ---

class Parser {
  private tokens: Token[];
  private pos = 0;
  errors: Array<{ message: string; pos: number }> = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    if (t.type !== 'eof') this.pos++;
    return t;
  }

  private expect(type: TokenType, value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      this.errors.push({ message: `Expected ${value ?? type}, got "${t.value}"`, pos: t.pos });
      return t;
    }
    return this.advance();
  }

  parse(): ExpressionNode | null {
    const node = this.parseOr();
    if (this.peek().type !== 'eof') {
      this.errors.push({ message: `Unexpected token: "${this.peek().value}"`, pos: this.peek().pos });
    }
    return node;
  }

  private parseOr(): ExpressionNode | null {
    let left = this.parseAnd();
    if (!left) return null;

    while (this.peek().type === 'ident' && this.peek().value.toLowerCase() === 'or') {
      const opToken = this.advance();
      const right = this.parseAnd();
      if (!right) return left;
      left = {
        kind: 'binary_op',
        operator: 'or' as BinaryOperator,
        left,
        right,
        pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos },
      };
    }
    return left;
  }

  private parseAnd(): ExpressionNode | null {
    let left = this.parseEquality();
    if (!left) return null;

    while (this.peek().type === 'ident' && this.peek().value.toLowerCase() === 'and') {
      const opToken = this.advance();
      const right = this.parseEquality();
      if (!right) return left;
      left = {
        kind: 'binary_op',
        operator: 'and' as BinaryOperator,
        left,
        right,
        pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos },
      };
    }
    return left;
  }

  private parseEquality(): ExpressionNode | null {
    let left = this.parseComparison();
    if (!left) return null;

    while (this.peek().type === 'op' && (this.peek().value === '==' || this.peek().value === '!=')) {
      const opToken = this.advance();
      const op: BinaryOperator = opToken.value === '==' ? 'eq' : 'neq';
      const right = this.parseComparison();
      if (!right) return left;
      left = { kind: 'binary_op', operator: op, left, right, pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos } };
    }
    return left;
  }

  private parseComparison(): ExpressionNode | null {
    let left = this.parseAddition();
    if (!left) return null;

    // Handle IS NULL / IS NOT NULL
    if (this.peek().type === 'ident' && this.peek().value.toLowerCase() === 'is') {
      const isToken = this.advance();
      let isNull = true;
      if (this.peek().type === 'ident' && this.peek().value.toLowerCase() === 'not') {
        this.advance();
        isNull = false;
      }
      this.expect('null');
      return {
        kind: 'null_check',
        operand: left,
        isNull,
        pos: { start: isToken.pos, end: this.tokens[this.pos - 1]?.pos ?? isToken.pos },
      };
    }

    while (this.peek().type === 'op' && ['>', '>=', '<', '<='].includes(this.peek().value)) {
      const opToken = this.advance();
      const opMap: Record<string, BinaryOperator> = { '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte' };
      const right = this.parseAddition();
      if (!right) return left;
      left = { kind: 'binary_op', operator: opMap[opToken.value], left, right, pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos } };
    }
    return left;
  }

  private parseAddition(): ExpressionNode | null {
    let left = this.parseMultiplication();
    if (!left) return null;

    while (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const opToken = this.advance();
      const right = this.parseMultiplication();
      if (!right) return left;
      left = { kind: 'binary_op', operator: opToken.value as BinaryOperator, left, right, pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos } };
    }
    return left;
  }

  private parseMultiplication(): ExpressionNode | null {
    let left = this.parsePower();
    if (!left) return null;

    while (this.peek().type === 'op' && ['*', '/', '%'].includes(this.peek().value)) {
      const opToken = this.advance();
      const right = this.parsePower();
      if (!right) return left;
      left = { kind: 'binary_op', operator: opToken.value as BinaryOperator, left, right, pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos } };
    }
    return left;
  }

  private parsePower(): ExpressionNode | null {
    let left = this.parseUnary();
    if (!left) return null;

    if (this.peek().type === 'op' && this.peek().value === '^') {
      const opToken = this.advance();
      const right = this.parseUnary(); // right-associative
      if (!right) return left;
      left = { kind: 'binary_op', operator: '^' as BinaryOperator, left, right, pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos } };
    }
    return left;
  }

  private parseUnary(): ExpressionNode | null {
    // Unary minus
    if (this.peek().type === 'op' && this.peek().value === '-') {
      const opToken = this.advance();
      const operand = this.parseUnary();
      if (!operand) return null;
      return {
        kind: 'unary_op',
        operator: 'negate' as UnaryOperator,
        operand,
        pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos },
      };
    }

    // NOT
    if (this.peek().type === 'ident' && this.peek().value.toLowerCase() === 'not') {
      const opToken = this.advance();
      const operand = this.parseUnary();
      if (!operand) return null;
      return {
        kind: 'unary_op',
        operator: 'not' as UnaryOperator,
        operand,
        pos: { start: opToken.pos, end: this.tokens[this.pos - 1]?.pos ?? opToken.pos },
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode | null {
    const token = this.peek();

    // Number
    if (token.type === 'number') {
      this.advance();
      return { kind: 'literal', value: Number(token.value), pos: { start: token.pos, end: token.pos + token.value.length } };
    }

    // String
    if (token.type === 'string') {
      this.advance();
      return { kind: 'literal', value: token.value, pos: { start: token.pos, end: token.pos + token.value.length + 2 } };
    }

    // Boolean
    if (token.type === 'boolean') {
      this.advance();
      return { kind: 'literal', value: token.value === 'true', pos: { start: token.pos, end: token.pos + token.value.length } };
    }

    // Null
    if (token.type === 'null') {
      this.advance();
      return { kind: 'literal', value: null, pos: { start: token.pos, end: token.pos + 4 } };
    }

    // Field ref
    if (token.type === 'field_ref') {
      this.advance();
      return { kind: 'field_ref', fieldName: token.value, pos: { start: token.pos, end: token.pos + token.value.length + 2 } };
    }

    // Param ref
    if (token.type === 'param_ref') {
      this.advance();
      return { kind: 'param_ref', parameterId: token.value, pos: { start: token.pos, end: token.pos + token.value.length + 1 } };
    }

    // Metric ref
    if (token.type === 'metric_ref') {
      this.advance();
      return { kind: 'metric_ref', metricId: token.value, pos: { start: token.pos, end: token.pos + token.value.length + 1 } };
    }

    // Calc ref
    if (token.type === 'calc_ref') {
      this.advance();
      return { kind: 'calc_ref', calculatedFieldId: token.value, pos: { start: token.pos, end: token.pos + token.value.length + 1 } };
    }

    // Function call or identifier
    if (token.type === 'ident') {
      const upper = token.value.toUpperCase();
      if (BUILTIN_FUNCTIONS.has(upper) && this.tokens[this.pos + 1]?.value === '(') {
        return this.parseFunctionCall();
      }
      // Unknown identifier — treat as error
      this.advance();
      this.errors.push({ message: `Unexpected identifier: "${token.value}"`, pos: token.pos });
      return { kind: 'literal', value: null, pos: { start: token.pos, end: token.pos + token.value.length } };
    }

    // Parenthesized expression
    if (token.type === 'paren' && token.value === '(') {
      this.advance();
      const expr = this.parseOr();
      this.expect('paren', ')');
      return expr;
    }

    // Error recovery
    this.errors.push({ message: `Unexpected token: "${token.value}"`, pos: token.pos });
    this.advance();
    return null;
  }

  private parseFunctionCall(): ExpressionNode | null {
    const nameToken = this.advance();
    const fnName = nameToken.value.toUpperCase() as BuiltinFunction;
    this.expect('paren', '(');

    const args: ExpressionNode[] = [];
    if (this.peek().value !== ')') {
      const firstArg = this.parseOr();
      if (firstArg) args.push(firstArg);

      while (this.peek().type === 'comma') {
        this.advance();
        const arg = this.parseOr();
        if (arg) args.push(arg);
      }
    }

    this.expect('paren', ')');

    return {
      kind: 'function_call',
      functionName: fnName,
      args,
      pos: { start: nameToken.pos, end: this.tokens[this.pos - 1]?.pos ?? nameToken.pos },
    };
  }
}

// --- Public API ---

export function parseFormula(text: string): ParseResult {
  const { tokens, errors: tokenErrors } = tokenize(text);
  const parser = new Parser(tokens);
  const node = parser.parse();
  return {
    node,
    errors: [...tokenErrors, ...parser.errors],
  };
}

// --- Formatter: AST → text ---

export function formatFormula(node: ExpressionNode): string {
  switch (node.kind) {
    case 'literal':
      if (node.value === null) return 'null';
      if (typeof node.value === 'string') return `"${node.value}"`;
      if (typeof node.value === 'boolean') return node.value ? 'true' : 'false';
      return String(node.value);

    case 'field_ref':
      return `[${node.fieldName}]`;

    case 'param_ref':
      return `$${node.parameterId}`;

    case 'metric_ref':
      return `@${node.metricId}`;

    case 'calc_ref':
      return `~${node.calculatedFieldId}`;

    case 'unary_op':
      if (node.operator === 'negate') return `-${wrapIfNeeded(node.operand)}`;
      if (node.operator === 'not') return `NOT ${wrapIfNeeded(node.operand)}`;
      return formatFormula(node.operand);

    case 'binary_op': {
      const opStr = binaryOpToString(node.operator);
      const left = wrapIfNeeded(node.left, node);
      const right = wrapIfNeeded(node.right, node);
      return `${left} ${opStr} ${right}`;
    }

    case 'conditional':
      return `IF(${formatFormula(node.condition)}, ${formatFormula(node.thenBranch)}, ${formatFormula(node.elseBranch)})`;

    case 'function_call':
      return `${node.functionName}(${node.args.map(formatFormula).join(', ')})`;

    case 'null_check':
      return `${wrapIfNeeded(node.operand)} IS ${node.isNull ? '' : 'NOT '}NULL`;

    default:
      return '';
  }
}

function binaryOpToString(op: BinaryOperator): string {
  const map: Record<string, string> = {
    '+': '+', '-': '-', '*': '*', '/': '/', '%': '%', '^': '^',
    eq: '==', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=',
    and: 'AND', or: 'OR', concat: '++',
  };
  return map[op] ?? op;
}

function wrapIfNeeded(node: ExpressionNode, parent?: ExpressionNode): string {
  const formatted = formatFormula(node);
  if (parent && node.kind === 'binary_op') {
    return `(${formatted})`;
  }
  return formatted;
}
