/**
 * @phozart/ai — Natural Language KPI Parser
 *
 * Tokenizes and extracts structured KPI components from natural language descriptions.
 * Uses pattern matching — no LLM calls.
 */
export type KPIAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max';
export type KPIComparison = 'above' | 'below';
export type KPIPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type KPIDirection = 'higher_is_better' | 'lower_is_better';
export type KPIUnit = 'percent' | 'currency' | 'count' | 'duration' | 'custom';
export interface ParsedKPIDescription {
    name: string;
    aggregation: KPIAggregation;
    fieldHint: string;
    comparison?: KPIComparison;
    threshold?: number;
    period?: KPIPeriod;
    direction: KPIDirection;
    unit?: KPIUnit;
}
export declare function parseKPIDescription(text: string): ParsedKPIDescription;
//# sourceMappingURL=nl-parser.d.ts.map