/**
 * @phozart/workspace — Alert Evaluator (N.1)
 *
 * Pure functions for evaluating alert rules against current metric values.
 * No DOM, no network, no side effects.
 */
import type { AlertRule, AlertCondition, BreachRecord } from '../types.js';
export interface ConditionResult {
    triggered: boolean;
    currentValue?: number;
    thresholdValue?: number;
    metric?: string;
}
export interface EvaluationResult {
    triggered: boolean;
    breachedConditions: ConditionResult[];
    currentValue?: number;
    thresholdValue?: number;
    message: string;
}
export declare function evaluateCondition(condition: AlertCondition, values: Map<string, number>): ConditionResult;
export declare function evaluateRule(rule: AlertRule, values: Map<string, number>): EvaluationResult;
export declare function evaluateRules(rules: AlertRule[], values: Map<string, number>, existingBreaches?: BreachRecord[]): BreachRecord[];
//# sourceMappingURL=alert-evaluator.d.ts.map