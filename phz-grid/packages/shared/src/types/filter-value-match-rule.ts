/**
 * @phozart/phz-shared — FilterValueMatchRule (A-1.09)
 *
 * Rules for matching and validating filter values, with support for
 * expression-based value transformations (UPPER, LOWER, TRIM, LEFT,
 * RIGHT, SUBSTRING, REPLACE).
 */

// ========================================================================
// MatchOperator
// ========================================================================

export type MatchOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'notIn'
  | 'greaterThan' | 'lessThan'
  | 'between' | 'isNull' | 'isNotNull';

// ========================================================================
// ExpressionFunction — supported string transformation functions
// ========================================================================

export type ExpressionFunction =
  | 'UPPER'
  | 'LOWER'
  | 'TRIM'
  | 'LEFT'
  | 'RIGHT'
  | 'SUBSTRING'
  | 'REPLACE';

// ========================================================================
// FilterValueMatchRule
// ========================================================================

export interface FilterValueMatchRule {
  field: string;
  operator: MatchOperator;
  value: unknown;
  caseSensitive?: boolean;
  /**
   * Optional expression to apply to the actual value before matching.
   * Format: "FUNCTION_NAME" or "FUNCTION_NAME(arg1, arg2, ...)"
   * Supported: UPPER, LOWER, TRIM, LEFT(n), RIGHT(n),
   * SUBSTRING(start, length), REPLACE(search, replacement).
   */
  expression?: string;
}

// ========================================================================
// applyExpression — transform a value using an expression function
// ========================================================================

/**
 * Apply a string transformation expression to a value.
 * Returns the transformed value, or the original value if the
 * expression is not applicable (e.g., non-string input).
 *
 * Supported expressions:
 * - UPPER — convert to uppercase
 * - LOWER — convert to lowercase
 * - TRIM — remove leading/trailing whitespace
 * - LEFT(n) — take first n characters
 * - RIGHT(n) — take last n characters
 * - SUBSTRING(start, length) — extract substring (0-based start)
 * - REPLACE(search, replacement) — replace all occurrences
 */
export function applyExpression(value: unknown, expression: string): unknown {
  if (typeof value !== 'string') return value;
  if (!expression) return value;

  const trimmedExpr = expression.trim();

  // Simple function names (no arguments)
  switch (trimmedExpr) {
    case 'UPPER':
      return value.toUpperCase();
    case 'LOWER':
      return value.toLowerCase();
    case 'TRIM':
      return value.trim();
  }

  // Functions with arguments: FUNC(args)
  const match = trimmedExpr.match(/^(\w+)\((.+)\)$/);
  if (!match) return value;

  const funcName = match[1];
  const argsStr = match[2];

  switch (funcName) {
    case 'LEFT': {
      const n = parseInt(argsStr.trim(), 10);
      if (isNaN(n) || n < 0) return value;
      return value.slice(0, n);
    }
    case 'RIGHT': {
      const n = parseInt(argsStr.trim(), 10);
      if (isNaN(n) || n < 0) return value;
      if (n >= value.length) return value;
      return value.slice(-n);
    }
    case 'SUBSTRING': {
      const parts = splitArgs(argsStr);
      if (parts.length < 2) return value;
      const start = parseInt(parts[0], 10);
      const length = parseInt(parts[1], 10);
      if (isNaN(start) || isNaN(length) || start < 0 || length < 0) return value;
      return value.substring(start, start + length);
    }
    case 'REPLACE': {
      const parts = splitArgs(argsStr);
      if (parts.length < 2) return value;
      const search = unquote(parts[0]);
      const replacement = unquote(parts[1]);
      return value.split(search).join(replacement);
    }
    default:
      return value;
  }
}

/**
 * Split comma-separated arguments, respecting quoted strings.
 */
function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      }
      current += ch;
    } else if (ch === "'" || ch === '"') {
      inQuote = true;
      quoteChar = ch;
      current += ch;
    } else if (ch === ',') {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Remove surrounding quotes from a string argument.
 */
function unquote(s: string): string {
  const trimmed = s.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// ========================================================================
// evaluateMatchRule — evaluate a match rule against an actual value
// ========================================================================

/**
 * Evaluate a FilterValueMatchRule against an actual value.
 * If the rule has an expression, it is applied to the actual value
 * before comparison.
 */
export function evaluateMatchRule(
  rule: FilterValueMatchRule,
  actual: unknown,
): boolean {
  // Apply expression transformation if present
  const transformed = rule.expression
    ? applyExpression(actual, rule.expression)
    : actual;

  // Case sensitivity handling for string comparisons
  const normalize = (v: unknown): unknown => {
    if (!rule.caseSensitive && typeof v === 'string') {
      return v.toLowerCase();
    }
    return v;
  };

  const normalizedActual = normalize(transformed);
  const normalizedValue = normalize(rule.value);

  switch (rule.operator) {
    case 'equals':
      return normalizedActual === normalizedValue;
    case 'notEquals':
      return normalizedActual !== normalizedValue;
    case 'isNull':
      return transformed == null;
    case 'isNotNull':
      return transformed != null;
    case 'in':
      if (!Array.isArray(rule.value)) return false;
      return rule.value.map(normalize).includes(normalizedActual);
    case 'notIn':
      if (!Array.isArray(rule.value)) return true;
      return !rule.value.map(normalize).includes(normalizedActual);
    case 'contains':
      return typeof normalizedActual === 'string' && typeof normalizedValue === 'string'
        ? normalizedActual.includes(normalizedValue)
        : false;
    case 'startsWith':
      return typeof normalizedActual === 'string' && typeof normalizedValue === 'string'
        ? normalizedActual.startsWith(normalizedValue)
        : false;
    case 'endsWith':
      return typeof normalizedActual === 'string' && typeof normalizedValue === 'string'
        ? normalizedActual.endsWith(normalizedValue)
        : false;
    case 'greaterThan':
      return typeof transformed === 'number' && typeof rule.value === 'number'
        ? transformed > rule.value
        : false;
    case 'lessThan':
      return typeof transformed === 'number' && typeof rule.value === 'number'
        ? transformed < rule.value
        : false;
    case 'between': {
      if (typeof transformed !== 'number') return false;
      if (!Array.isArray(rule.value) || rule.value.length < 2) return false;
      const [lo, hi] = rule.value as [number, number];
      return transformed >= lo && transformed <= hi;
    }
    default:
      return false;
  }
}
