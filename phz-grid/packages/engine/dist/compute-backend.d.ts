/**
 * @phozart/engine — ComputeBackend Strategy
 *
 * Abstraction layer for computation: aggregation, pivot, filter, calculated fields.
 * BIEngine uses this to delegate work to either the JS engine or DuckDB-WASM.
 */
import type { AggregationConfig, PivotConfig, FilterOperator } from '@phozart/core';
import type { AggregationResult } from './aggregation.js';
import type { PivotResult } from './pivot.js';
import type { ExpressionNode } from './expression-types.js';
export interface ComputeFilterInput {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
export interface CalculatedFieldInput {
    name: string;
    expression: string | ExpressionNode;
}
export interface ComputeBackend {
    aggregate(data: Record<string, unknown>[], config: AggregationConfig): Promise<AggregationResult>;
    pivot(data: Record<string, unknown>[], config: PivotConfig): Promise<PivotResult>;
    filter(data: Record<string, unknown>[], criteria: ComputeFilterInput[]): Promise<Record<string, unknown>[]>;
    computeCalculatedFields(data: Record<string, unknown>[], fields: CalculatedFieldInput[]): Promise<Record<string, unknown>[]>;
}
export declare class JSComputeBackend implements ComputeBackend {
    aggregate(data: Record<string, unknown>[], config: AggregationConfig): Promise<AggregationResult>;
    pivot(data: Record<string, unknown>[], config: PivotConfig): Promise<PivotResult>;
    filter(data: Record<string, unknown>[], criteria: ComputeFilterInput[]): Promise<Record<string, unknown>[]>;
    computeCalculatedFields(data: Record<string, unknown>[], fields: CalculatedFieldInput[]): Promise<Record<string, unknown>[]>;
}
export declare function createJSComputeBackend(): ComputeBackend;
//# sourceMappingURL=compute-backend.d.ts.map