/**
 * @phozart/workspace — Alert Rule Designer (N.2)
 *
 * Pure logic functions for building and validating AlertRules.
 * The Lit component wraps these for visual authoring.
 */
import type { AlertRule, AlertCondition, SimpleThreshold, CompoundCondition } from '../types.js';
export interface AlertRuleFormState {
    name: string;
    description: string;
    severity: AlertRule['severity'];
    cooldownMs: number;
    conditionMode: 'simple' | 'compound';
}
export declare function buildDefaultAlertRule(artifactId: string): AlertRule;
export declare function validateAlertRule(rule: AlertRule): string[];
export declare function buildThresholdCondition(metric: string, operator: SimpleThreshold['operator'], value: number): SimpleThreshold;
export declare function buildCompoundCondition(op: CompoundCondition['op'], children: AlertCondition[]): CompoundCondition;
//# sourceMappingURL=phz-alert-rule-designer.d.ts.map