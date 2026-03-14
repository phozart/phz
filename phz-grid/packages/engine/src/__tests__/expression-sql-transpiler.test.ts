import { describe, it, expect } from 'vitest';
import { expressionToSQL, FUNCTION_SQL_MAP } from '../expression-sql-transpiler.js';
import type { ExpressionNode } from '../expression-types.js';

describe('expressionToSQL', () => {
  // --- Literals ---

  describe('literals', () => {
    it('transpiles null literal', () => {
      expect(expressionToSQL({ kind: 'literal', value: null })).toBe('NULL');
    });

    it('transpiles number literal', () => {
      expect(expressionToSQL({ kind: 'literal', value: 42 })).toBe('42');
    });

    it('transpiles negative number literal', () => {
      expect(expressionToSQL({ kind: 'literal', value: -3.14 })).toBe('-3.14');
    });

    it('transpiles string literal', () => {
      expect(expressionToSQL({ kind: 'literal', value: 'hello' })).toBe("'hello'");
    });

    it('escapes single quotes in string literals', () => {
      expect(expressionToSQL({ kind: 'literal', value: "it's" })).toBe("'it''s'");
    });

    it('transpiles boolean true', () => {
      expect(expressionToSQL({ kind: 'literal', value: true })).toBe('TRUE');
    });

    it('transpiles boolean false', () => {
      expect(expressionToSQL({ kind: 'literal', value: false })).toBe('FALSE');
    });
  });

  // --- References ---

  describe('references', () => {
    it('transpiles field_ref with quoted identifier', () => {
      expect(expressionToSQL({ kind: 'field_ref', fieldName: 'total_amount' })).toBe('"total_amount"');
    });

    it('escapes double quotes in field names', () => {
      expect(expressionToSQL({ kind: 'field_ref', fieldName: 'my"field' })).toBe('"my""field"');
    });

    it('transpiles param_ref', () => {
      expect(expressionToSQL({ kind: 'param_ref', parameterId: 'threshold' })).toBe('$threshold');
    });

    it('throws on metric_ref', () => {
      expect(() => expressionToSQL({ kind: 'metric_ref', metricId: 'revenue' }))
        .toThrow('metric_ref "revenue" must be resolved before SQL transpilation');
    });

    it('throws on calc_ref', () => {
      expect(() => expressionToSQL({ kind: 'calc_ref', calculatedFieldId: 'profit' }))
        .toThrow('calc_ref "profit" must be resolved before SQL transpilation');
    });
  });

  // --- Unary Operators ---

  describe('unary operators', () => {
    it('transpiles negate', () => {
      const expr: ExpressionNode = {
        kind: 'unary_op',
        operator: 'negate',
        operand: { kind: 'field_ref', fieldName: 'amount' },
      };
      expect(expressionToSQL(expr)).toBe('(-("amount"))');
    });

    it('transpiles NOT', () => {
      const expr: ExpressionNode = {
        kind: 'unary_op',
        operator: 'not',
        operand: { kind: 'field_ref', fieldName: 'active' },
      };
      expect(expressionToSQL(expr)).toBe('(NOT ("active"))');
    });
  });

  // --- Binary Operators ---

  describe('binary operators', () => {
    it('transpiles arithmetic +', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '+',
        left: { kind: 'field_ref', fieldName: 'a' },
        right: { kind: 'literal', value: 10 },
      };
      expect(expressionToSQL(expr)).toBe('("a" + 10)');
    });

    it('transpiles arithmetic -', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '-',
        left: { kind: 'literal', value: 100 },
        right: { kind: 'field_ref', fieldName: 'discount' },
      };
      expect(expressionToSQL(expr)).toBe('(100 - "discount")');
    });

    it('transpiles arithmetic *', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '*',
        left: { kind: 'field_ref', fieldName: 'price' },
        right: { kind: 'field_ref', fieldName: 'qty' },
      };
      expect(expressionToSQL(expr)).toBe('("price" * "qty")');
    });

    it('transpiles arithmetic /', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '/',
        left: { kind: 'field_ref', fieldName: 'total' },
        right: { kind: 'literal', value: 2 },
      };
      expect(expressionToSQL(expr)).toBe('("total" / 2)');
    });

    it('transpiles arithmetic %', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '%',
        left: { kind: 'field_ref', fieldName: 'val' },
        right: { kind: 'literal', value: 3 },
      };
      expect(expressionToSQL(expr)).toBe('("val" % 3)');
    });

    it('transpiles ^ to POWER function', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '^',
        left: { kind: 'literal', value: 2 },
        right: { kind: 'literal', value: 3 },
      };
      expect(expressionToSQL(expr)).toBe('POWER(2, 3)');
    });

    it('transpiles eq to =', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'eq',
        left: { kind: 'field_ref', fieldName: 'status' },
        right: { kind: 'literal', value: 'active' },
      };
      expect(expressionToSQL(expr)).toBe('("status" = \'active\')');
    });

    it('transpiles neq to <>', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'neq',
        left: { kind: 'field_ref', fieldName: 'x' },
        right: { kind: 'literal', value: 0 },
      };
      expect(expressionToSQL(expr)).toBe('("x" <> 0)');
    });

    it('transpiles gt to >', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'gt',
        left: { kind: 'field_ref', fieldName: 'score' },
        right: { kind: 'literal', value: 90 },
      };
      expect(expressionToSQL(expr)).toBe('("score" > 90)');
    });

    it('transpiles gte to >=', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'gte',
        left: { kind: 'field_ref', fieldName: 'score' },
        right: { kind: 'literal', value: 90 },
      };
      expect(expressionToSQL(expr)).toBe('("score" >= 90)');
    });

    it('transpiles lt to <', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'lt',
        left: { kind: 'field_ref', fieldName: 'age' },
        right: { kind: 'literal', value: 18 },
      };
      expect(expressionToSQL(expr)).toBe('("age" < 18)');
    });

    it('transpiles lte to <=', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'lte',
        left: { kind: 'field_ref', fieldName: 'age' },
        right: { kind: 'literal', value: 65 },
      };
      expect(expressionToSQL(expr)).toBe('("age" <= 65)');
    });

    it('transpiles AND', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'and',
        left: { kind: 'literal', value: true },
        right: { kind: 'literal', value: false },
      };
      expect(expressionToSQL(expr)).toBe('(TRUE AND FALSE)');
    });

    it('transpiles OR', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'or',
        left: { kind: 'literal', value: true },
        right: { kind: 'literal', value: false },
      };
      expect(expressionToSQL(expr)).toBe('(TRUE OR FALSE)');
    });

    it('transpiles concat to ||', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: 'concat',
        left: { kind: 'field_ref', fieldName: 'first' },
        right: { kind: 'field_ref', fieldName: 'last' },
      };
      expect(expressionToSQL(expr)).toBe('("first" || "last")');
    });
  });

  // --- Conditionals ---

  describe('conditional', () => {
    it('transpiles conditional to CASE WHEN', () => {
      const expr: ExpressionNode = {
        kind: 'conditional',
        condition: { kind: 'binary_op', operator: 'gt', left: { kind: 'field_ref', fieldName: 'x' }, right: { kind: 'literal', value: 0 } },
        thenBranch: { kind: 'literal', value: 'positive' },
        elseBranch: { kind: 'literal', value: 'non-positive' },
      };
      expect(expressionToSQL(expr)).toBe("(CASE WHEN (\"x\" > 0) THEN 'positive' ELSE 'non-positive' END)");
    });
  });

  // --- Null Checks ---

  describe('null checks', () => {
    it('transpiles IS NULL', () => {
      const expr: ExpressionNode = {
        kind: 'null_check',
        operand: { kind: 'field_ref', fieldName: 'email' },
        isNull: true,
      };
      expect(expressionToSQL(expr)).toBe('("email" IS NULL)');
    });

    it('transpiles IS NOT NULL', () => {
      const expr: ExpressionNode = {
        kind: 'null_check',
        operand: { kind: 'field_ref', fieldName: 'email' },
        isNull: false,
      };
      expect(expressionToSQL(expr)).toBe('("email" IS NOT NULL)');
    });
  });

  // --- Original Builtin Functions ---

  describe('original builtin functions', () => {
    it('transpiles ABS', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'ABS',
        args: [{ kind: 'field_ref', fieldName: 'val' }],
      };
      expect(expressionToSQL(expr)).toBe('ABS("val")');
    });

    it('transpiles ROUND with 2 args', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'ROUND',
        args: [{ kind: 'field_ref', fieldName: 'price' }, { kind: 'literal', value: 2 }],
      };
      expect(expressionToSQL(expr)).toBe('ROUND("price", 2)');
    });

    it('transpiles FLOOR', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'FLOOR',
        args: [{ kind: 'literal', value: 3.7 }],
      };
      expect(expressionToSQL(expr)).toBe('FLOOR(3.7)');
    });

    it('transpiles CEIL', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'CEIL',
        args: [{ kind: 'literal', value: 3.2 }],
      };
      expect(expressionToSQL(expr)).toBe('CEIL(3.2)');
    });

    it('transpiles UPPER', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'UPPER',
        args: [{ kind: 'field_ref', fieldName: 'name' }],
      };
      expect(expressionToSQL(expr)).toBe('UPPER("name")');
    });

    it('transpiles LOWER', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LOWER',
        args: [{ kind: 'field_ref', fieldName: 'name' }],
      };
      expect(expressionToSQL(expr)).toBe('LOWER("name")');
    });

    it('transpiles TRIM', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'TRIM',
        args: [{ kind: 'field_ref', fieldName: 'name' }],
      };
      expect(expressionToSQL(expr)).toBe('TRIM("name")');
    });

    it('transpiles LEN to LENGTH', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LEN',
        args: [{ kind: 'field_ref', fieldName: 'name' }],
      };
      expect(expressionToSQL(expr)).toBe('LENGTH("name")');
    });

    it('transpiles SUBSTR to SUBSTRING', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'SUBSTR',
        args: [
          { kind: 'field_ref', fieldName: 'name' },
          { kind: 'literal', value: 0 },
          { kind: 'literal', value: 3 },
        ],
      };
      expect(expressionToSQL(expr)).toBe('SUBSTRING("name", 0, 3)');
    });

    it('transpiles CONCAT', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'CONCAT',
        args: [
          { kind: 'field_ref', fieldName: 'first' },
          { kind: 'literal', value: ' ' },
          { kind: 'field_ref', fieldName: 'last' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("CONCAT(\"first\", ' ', \"last\")");
    });

    it('transpiles YEAR', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'YEAR',
        args: [{ kind: 'field_ref', fieldName: 'order_date' }],
      };
      expect(expressionToSQL(expr)).toBe('YEAR("order_date")');
    });

    it('transpiles MONTH', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'MONTH',
        args: [{ kind: 'field_ref', fieldName: 'order_date' }],
      };
      expect(expressionToSQL(expr)).toBe('MONTH("order_date")');
    });

    it('transpiles DAY', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'DAY',
        args: [{ kind: 'field_ref', fieldName: 'order_date' }],
      };
      expect(expressionToSQL(expr)).toBe('DAY("order_date")');
    });

    it('transpiles COALESCE with multiple args', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'COALESCE',
        args: [
          { kind: 'field_ref', fieldName: 'nickname' },
          { kind: 'field_ref', fieldName: 'name' },
          { kind: 'literal', value: 'Unknown' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("COALESCE(\"nickname\", \"name\", 'Unknown')");
    });
  });

  // --- Special Functions ---

  describe('special functions', () => {
    it('transpiles IF to CASE WHEN', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'IF',
        args: [
          { kind: 'binary_op', operator: 'gt', left: { kind: 'field_ref', fieldName: 'age' }, right: { kind: 'literal', value: 18 } },
          { kind: 'literal', value: 'adult' },
          { kind: 'literal', value: 'minor' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("(CASE WHEN (\"age\" > 18) THEN 'adult' ELSE 'minor' END)");
    });

    it('transpiles CLAMP to GREATEST/LEAST', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'CLAMP',
        args: [
          { kind: 'field_ref', fieldName: 'val' },
          { kind: 'literal', value: 0 },
          { kind: 'literal', value: 100 },
        ],
      };
      expect(expressionToSQL(expr)).toBe('GREATEST(0, LEAST(100, "val"))');
    });
  });

  // --- New Math Functions ---

  describe('new math functions', () => {
    it('transpiles SQRT', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'SQRT',
        args: [{ kind: 'literal', value: 16 }],
      };
      expect(expressionToSQL(expr)).toBe('SQRT(16)');
    });

    it('transpiles POWER', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'POWER',
        args: [{ kind: 'literal', value: 2 }, { kind: 'literal', value: 10 }],
      };
      expect(expressionToSQL(expr)).toBe('POWER(2, 10)');
    });

    it('transpiles MOD', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'MOD',
        args: [{ kind: 'literal', value: 10 }, { kind: 'literal', value: 3 }],
      };
      expect(expressionToSQL(expr)).toBe('MOD(10, 3)');
    });

    it('transpiles LOG', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LOG',
        args: [{ kind: 'literal', value: 100 }],
      };
      expect(expressionToSQL(expr)).toBe('LOG(100)');
    });

    it('transpiles LOG with base', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LOG',
        args: [{ kind: 'literal', value: 10 }, { kind: 'literal', value: 100 }],
      };
      expect(expressionToSQL(expr)).toBe('LOG(10, 100)');
    });

    it('transpiles EXP', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'EXP',
        args: [{ kind: 'literal', value: 1 }],
      };
      expect(expressionToSQL(expr)).toBe('EXP(1)');
    });
  });

  // --- New String Functions ---

  describe('new string functions', () => {
    it('transpiles LEFT', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LEFT',
        args: [{ kind: 'field_ref', fieldName: 'name' }, { kind: 'literal', value: 3 }],
      };
      expect(expressionToSQL(expr)).toBe('LEFT("name", 3)');
    });

    it('transpiles RIGHT', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'RIGHT',
        args: [{ kind: 'field_ref', fieldName: 'name' }, { kind: 'literal', value: 3 }],
      };
      expect(expressionToSQL(expr)).toBe('RIGHT("name", 3)');
    });

    it('transpiles REPLACE', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'REPLACE',
        args: [
          { kind: 'field_ref', fieldName: 'name' },
          { kind: 'literal', value: 'foo' },
          { kind: 'literal', value: 'bar' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("REPLACE(\"name\", 'foo', 'bar')");
    });

    it('transpiles REPEAT', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'REPEAT',
        args: [{ kind: 'literal', value: 'ab' }, { kind: 'literal', value: 3 }],
      };
      expect(expressionToSQL(expr)).toBe("REPEAT('ab', 3)");
    });
  });

  // --- New Date Functions ---

  describe('new date functions', () => {
    it('transpiles DATE_DIFF', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'DATE_DIFF',
        args: [
          { kind: 'literal', value: 'day' },
          { kind: 'field_ref', fieldName: 'start_date' },
          { kind: 'field_ref', fieldName: 'end_date' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("DATE_DIFF('day', \"start_date\", \"end_date\")");
    });

    it('transpiles DATE_ADD', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'DATE_ADD',
        args: [
          { kind: 'literal', value: 'month' },
          { kind: 'literal', value: 3 },
          { kind: 'field_ref', fieldName: 'order_date' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("DATE_ADD('month', 3, \"order_date\")");
    });

    it('transpiles FORMAT_DATE to STRFTIME', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'FORMAT_DATE',
        args: [
          { kind: 'literal', value: '%Y-%m-%d' },
          { kind: 'field_ref', fieldName: 'order_date' },
        ],
      };
      expect(expressionToSQL(expr)).toBe("STRFTIME('%Y-%m-%d', \"order_date\")");
    });
  });

  // --- Statistical Functions ---

  describe('statistical functions', () => {
    it('transpiles STDDEV to STDDEV_SAMP', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'STDDEV',
        args: [{ kind: 'field_ref', fieldName: 'amount' }],
      };
      expect(expressionToSQL(expr)).toBe('STDDEV_SAMP("amount")');
    });

    it('transpiles VARIANCE to VAR_SAMP', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'VARIANCE',
        args: [{ kind: 'field_ref', fieldName: 'amount' }],
      };
      expect(expressionToSQL(expr)).toBe('VAR_SAMP("amount")');
    });

    it('transpiles PERCENTILE to PERCENTILE_CONT', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'PERCENTILE',
        args: [{ kind: 'literal', value: 0.5 }, { kind: 'field_ref', fieldName: 'amount' }],
      };
      expect(expressionToSQL(expr)).toBe('PERCENTILE_CONT(0.5, "amount")');
    });
  });

  // --- Window Functions ---

  describe('window functions', () => {
    it('transpiles RANK', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'RANK',
        args: [{ kind: 'field_ref', fieldName: 'score' }],
      };
      expect(expressionToSQL(expr)).toBe('RANK("score")');
    });

    it('transpiles DENSE_RANK', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'DENSE_RANK',
        args: [{ kind: 'field_ref', fieldName: 'score' }],
      };
      expect(expressionToSQL(expr)).toBe('DENSE_RANK("score")');
    });

    it('transpiles LAG', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LAG',
        args: [
          { kind: 'field_ref', fieldName: 'amount' },
          { kind: 'literal', value: 1 },
        ],
      };
      expect(expressionToSQL(expr)).toBe('LAG("amount", 1)');
    });

    it('transpiles LEAD with default', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'LEAD',
        args: [
          { kind: 'field_ref', fieldName: 'amount' },
          { kind: 'literal', value: 1 },
          { kind: 'literal', value: 0 },
        ],
      };
      expect(expressionToSQL(expr)).toBe('LEAD("amount", 1, 0)');
    });

    it('transpiles RUNNING_SUM to SUM', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'RUNNING_SUM',
        args: [{ kind: 'field_ref', fieldName: 'amount' }],
      };
      expect(expressionToSQL(expr)).toBe('SUM("amount")');
    });

    it('transpiles NTILE', () => {
      const expr: ExpressionNode = {
        kind: 'function_call', functionName: 'NTILE',
        args: [{ kind: 'literal', value: 4 }, { kind: 'field_ref', fieldName: 'score' }],
      };
      expect(expressionToSQL(expr)).toBe('NTILE(4, "score")');
    });
  });

  // --- Nested expressions ---

  describe('nested expressions', () => {
    it('transpiles deeply nested expression', () => {
      const expr: ExpressionNode = {
        kind: 'binary_op', operator: '+',
        left: {
          kind: 'function_call', functionName: 'ABS',
          args: [{ kind: 'field_ref', fieldName: 'delta' }],
        },
        right: {
          kind: 'binary_op', operator: '*',
          left: { kind: 'field_ref', fieldName: 'rate' },
          right: { kind: 'literal', value: 100 },
        },
      };
      expect(expressionToSQL(expr)).toBe('(ABS("delta") + ("rate" * 100))');
    });
  });

  // --- FUNCTION_SQL_MAP completeness ---

  describe('FUNCTION_SQL_MAP', () => {
    it('maps all original functions', () => {
      const originals = ['ABS', 'ROUND', 'FLOOR', 'CEIL', 'UPPER', 'LOWER', 'TRIM', 'LEN', 'SUBSTR', 'CONCAT', 'YEAR', 'MONTH', 'DAY', 'COALESCE'];
      for (const fn of originals) {
        expect(FUNCTION_SQL_MAP[fn]).toBeDefined();
      }
    });

    it('maps all new functions', () => {
      const newFns = [
        'SQRT', 'POWER', 'MOD', 'LOG', 'EXP',
        'LEFT', 'RIGHT', 'REPLACE', 'REPEAT',
        'DATE_DIFF', 'DATE_ADD', 'FORMAT_DATE',
        'STDDEV', 'VARIANCE', 'PERCENTILE',
        'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'RUNNING_SUM', 'NTILE',
      ];
      for (const fn of newFns) {
        expect(FUNCTION_SQL_MAP[fn]).toBeDefined();
      }
    });

    it('maps FORMAT_DATE to STRFTIME', () => {
      expect(FUNCTION_SQL_MAP['FORMAT_DATE']).toBe('STRFTIME');
    });

    it('maps LEN to LENGTH', () => {
      expect(FUNCTION_SQL_MAP['LEN']).toBe('LENGTH');
    });

    it('maps SUBSTR to SUBSTRING', () => {
      expect(FUNCTION_SQL_MAP['SUBSTR']).toBe('SUBSTRING');
    });
  });
});
