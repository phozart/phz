/**
 * @phozart/phz-engine — Expression AST Types & Data Model
 *
 * All types for the 5-layer computation DAG:
 * Fields → Parameters → Calculated Fields → Metrics → KPIs
 */

import type { MetricId, KPIId } from './types.js';

// --- Branded IDs ---

export type ParameterId = string & { readonly __brand: 'ParameterId' };
export type CalculatedFieldId = string & { readonly __brand: 'CalculatedFieldId' };

export function parameterId(id: string): ParameterId { return id as ParameterId; }
export function calculatedFieldId(id: string): CalculatedFieldId { return id as CalculatedFieldId; }

// --- Source Position (for error reporting) ---

export interface SourcePosition {
  start: number;
  end: number;
}

// --- Expression AST Node Types ---

export type BinaryOperator =
  // Arithmetic
  | '+' | '-' | '*' | '/' | '%' | '^'
  // Comparison
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  // Logic
  | 'and' | 'or'
  // String
  | 'concat';

export type UnaryOperator = 'negate' | 'not';

export type BuiltinFunction =
  // Math
  | 'ABS' | 'ROUND' | 'FLOOR' | 'CEIL'
  // String
  | 'UPPER' | 'LOWER' | 'TRIM' | 'LEN' | 'SUBSTR' | 'CONCAT'
  // Date
  | 'YEAR' | 'MONTH' | 'DAY'
  // Utility
  | 'COALESCE' | 'IF' | 'CLAMP';

export interface FieldRefNode {
  kind: 'field_ref';
  fieldName: string;
  pos?: SourcePosition;
}

export interface ParamRefNode {
  kind: 'param_ref';
  parameterId: string;
  pos?: SourcePosition;
}

export interface MetricRefNode {
  kind: 'metric_ref';
  metricId: string;
  pos?: SourcePosition;
}

export interface CalcRefNode {
  kind: 'calc_ref';
  calculatedFieldId: string;
  pos?: SourcePosition;
}

export interface LiteralNode {
  kind: 'literal';
  value: number | string | boolean | null;
  pos?: SourcePosition;
}

export interface UnaryOpNode {
  kind: 'unary_op';
  operator: UnaryOperator;
  operand: ExpressionNode;
  pos?: SourcePosition;
}

export interface BinaryOpNode {
  kind: 'binary_op';
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
  pos?: SourcePosition;
}

export interface ConditionalNode {
  kind: 'conditional';
  condition: ExpressionNode;
  thenBranch: ExpressionNode;
  elseBranch: ExpressionNode;
  pos?: SourcePosition;
}

export interface FunctionCallNode {
  kind: 'function_call';
  functionName: BuiltinFunction;
  args: ExpressionNode[];
  pos?: SourcePosition;
}

export interface NullCheckNode {
  kind: 'null_check';
  operand: ExpressionNode;
  isNull: boolean;
  pos?: SourcePosition;
}

export type ExpressionNode =
  | FieldRefNode
  | ParamRefNode
  | MetricRefNode
  | CalcRefNode
  | LiteralNode
  | UnaryOpNode
  | BinaryOpNode
  | ConditionalNode
  | FunctionCallNode
  | NullCheckNode;

// --- Expression Metric Formula ---

export interface ExpressionMetricFormula {
  type: 'expression';
  expression: ExpressionNode;
}

// --- Parameter Definitions ---

export type ParameterType = 'number' | 'string' | 'date' | 'boolean' | 'select';

export interface ParameterDef {
  id: ParameterId;
  name: string;
  type: ParameterType;
  defaultValue: unknown;
  options?: Array<{ label: string; value: unknown }>;
  min?: number;
  max?: number;
  step?: number;
}

// --- Calculated Field Definitions ---

export type CalculatedFieldOutputType = 'number' | 'string' | 'boolean' | 'date';

export interface CalculatedFieldDef {
  id: CalculatedFieldId;
  name: string;
  outputType: CalculatedFieldOutputType;
  expression: ExpressionNode;
}

// --- Threshold Bands ---

export interface ThresholdSource {
  type: 'static' | 'parameter' | 'metric';
  value?: number;
  parameterId?: string;
  metricId?: string;
}

export interface ThresholdBand {
  label: string;
  color: string;
  upTo: ThresholdSource;
}

// --- Data Model Field ---

export interface DataModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
}

// --- Dashboard Data Model ---

export interface DashboardDataModel {
  fields: DataModelField[];
  parameters: ParameterDef[];
  calculatedFields: CalculatedFieldDef[];
}
