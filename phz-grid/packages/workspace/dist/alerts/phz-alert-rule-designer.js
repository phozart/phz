/**
 * @phozart/phz-workspace — Alert Rule Designer (N.2)
 *
 * Pure logic functions for building and validating AlertRules.
 * The Lit component wraps these for visual authoring.
 */
import { alertRuleId } from '../types.js';
let ruleCounter = 0;
export function buildDefaultAlertRule(artifactId) {
    return {
        id: alertRuleId(`rule_${Date.now()}_${++ruleCounter}`),
        name: '',
        description: '',
        artifactId,
        condition: {
            kind: 'threshold',
            metric: '',
            operator: '>',
            value: 0,
        },
        severity: 'warning',
        cooldownMs: 300000, // 5 minutes
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}
export function validateAlertRule(rule) {
    const errors = [];
    if (!rule.name || rule.name.trim() === '') {
        errors.push('Name is required');
    }
    if (rule.cooldownMs < 0) {
        errors.push('Cooldown must be non-negative');
    }
    validateCondition(rule.condition, errors);
    return errors;
}
function validateCondition(condition, errors) {
    if (condition.kind === 'threshold') {
        if (!condition.metric || condition.metric.trim() === '') {
            errors.push('Metric is required for threshold condition');
        }
    }
    else if (condition.kind === 'compound') {
        if (condition.children.length === 0) {
            errors.push('Compound condition must have at least one child');
        }
        for (const child of condition.children) {
            validateCondition(child, errors);
        }
    }
}
export function buildThresholdCondition(metric, operator, value) {
    return { kind: 'threshold', metric, operator, value };
}
export function buildCompoundCondition(op, children) {
    return { kind: 'compound', op, children };
}
//# sourceMappingURL=phz-alert-rule-designer.js.map