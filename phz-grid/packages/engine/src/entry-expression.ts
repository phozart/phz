/**
 * @phozart/phz-engine/expression — Expression-focused entry point
 *
 * Expression parser, evaluator, validator, dependency graph, and AST types.
 */

// Expression Types & AST
export { parameterId, calculatedFieldId } from './expression-types.js';
export type {
  ParameterId, CalculatedFieldId,
  SourcePosition, BinaryOperator, UnaryOperator, BuiltinFunction,
  ExpressionNode, FieldRefNode, ParamRefNode, MetricRefNode, CalcRefNode,
  LiteralNode, UnaryOpNode, BinaryOpNode, ConditionalNode, FunctionCallNode, NullCheckNode,
  ExpressionMetricFormula,
  ParameterType, ParameterDef,
  CalculatedFieldOutputType, CalculatedFieldDef,
  ThresholdSource, ThresholdBand,
  DataModelField, DashboardDataModel,
} from './expression-types.js';

// Dependency Graph
export { createDependencyGraph, extractDependencies } from './dependency-graph.js';
export type {
  DependencyNodeType, DependencyRef, DependencyNode, CanDeleteResult, DependencyGraph,
} from './dependency-graph.js';

// Expression Evaluator
export { evaluateRowExpression, evaluateMetricExpression } from './expression-evaluator.js';
export type { RowExpressionContext, MetricExpressionContext } from './expression-evaluator.js';

// Expression Validator
export { validateExpression } from './expression-validator.js';
export type { ExpressionError, ExpressionValidationContext } from './expression-validator.js';

// Formula Parser
export { parseFormula, formatFormula } from './formula-parser.js';
export type { ParseResult } from './formula-parser.js';
