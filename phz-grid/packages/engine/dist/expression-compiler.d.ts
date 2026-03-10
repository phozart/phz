/**
 * @phozart/phz-engine — Expression Compiler
 *
 * Compiles ExpressionNode ASTs into JS closure functions for fast evaluation.
 * Compiled functions avoid tree traversal overhead, yielding 5-10x speedup
 * for row-level evaluation over large datasets.
 *
 * Maintains identical SQL-style null propagation semantics as the tree-walk evaluator.
 */
import type { ExpressionNode } from './expression-types.js';
import type { RowExpressionContext, MetricExpressionContext } from './expression-evaluator.js';
export type CompiledRowExpression = (ctx: RowExpressionContext) => unknown;
export type CompiledMetricExpression = (ctx: MetricExpressionContext) => number | null;
/**
 * Compile a row-level expression AST into a reusable closure.
 * The returned function evaluates the expression without tree traversal.
 */
export declare function compileRowExpression(ast: ExpressionNode): CompiledRowExpression;
/**
 * Compile a metric-level expression AST into a reusable closure.
 * The returned function coerces the result to number | null.
 */
export declare function compileMetricExpression(ast: ExpressionNode): CompiledMetricExpression;
//# sourceMappingURL=expression-compiler.d.ts.map