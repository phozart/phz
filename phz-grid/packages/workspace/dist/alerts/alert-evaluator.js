/**
 * @phozart/workspace — Alert Evaluator (N.1)
 *
 * Pure functions for evaluating alert rules against current metric values.
 * No DOM, no network, no side effects.
 */
import { breachId } from '../types.js';
// --- Condition evaluation ---
export function evaluateCondition(condition, values) {
    switch (condition.kind) {
        case 'threshold': return evaluateThreshold(condition, values);
        case 'compound': return evaluateCompound(condition, values);
    }
}
function evaluateThreshold(cond, values) {
    const value = values.get(cond.metric);
    if (value === undefined || isNaN(value)) {
        return { triggered: false, metric: cond.metric };
    }
    let triggered;
    switch (cond.operator) {
        case '>':
            triggered = value > cond.value;
            break;
        case '<':
            triggered = value < cond.value;
            break;
        case '>=':
            triggered = value >= cond.value;
            break;
        case '<=':
            triggered = value <= cond.value;
            break;
        case '==':
            triggered = value === cond.value;
            break;
        case '!=':
            triggered = value !== cond.value;
            break;
        default: triggered = false;
    }
    return {
        triggered,
        currentValue: value,
        thresholdValue: cond.value,
        metric: cond.metric,
    };
}
function evaluateCompound(cond, values) {
    const childResults = cond.children.map(c => evaluateCondition(c, values));
    let triggered;
    switch (cond.op) {
        case 'AND':
            triggered = childResults.every(r => r.triggered);
            break;
        case 'OR':
            triggered = childResults.some(r => r.triggered);
            break;
        case 'NOT':
            triggered = !childResults[0]?.triggered;
            break;
        default: triggered = false;
    }
    return { triggered };
}
// --- Rule evaluation ---
export function evaluateRule(rule, values) {
    if (!rule.enabled) {
        return { triggered: false, breachedConditions: [], message: '' };
    }
    const result = evaluateCondition(rule.condition, values);
    const breachedConditions = [];
    if (result.triggered) {
        breachedConditions.push(result);
    }
    return {
        triggered: result.triggered,
        breachedConditions,
        currentValue: result.currentValue,
        thresholdValue: result.thresholdValue,
        message: result.triggered
            ? `${rule.name}: ${result.metric ?? 'condition'} ${result.currentValue ?? ''} breached threshold ${result.thresholdValue ?? ''}`
            : '',
    };
}
// --- Batch evaluation ---
let breachCounter = 0;
export function evaluateRules(rules, values, existingBreaches) {
    const now = Date.now();
    const results = [];
    for (const rule of rules) {
        // Cooldown check
        if (rule.cooldownMs > 0 && existingBreaches) {
            const lastBreach = existingBreaches
                .filter(b => b.ruleId === rule.id)
                .sort((a, b) => b.detectedAt - a.detectedAt)[0];
            if (lastBreach && (now - lastBreach.detectedAt) < rule.cooldownMs) {
                continue;
            }
        }
        const evaluation = evaluateRule(rule, values);
        if (evaluation.triggered) {
            results.push({
                id: breachId(`breach_${now}_${++breachCounter}`),
                ruleId: rule.id,
                artifactId: rule.artifactId,
                widgetId: rule.widgetId,
                status: 'active',
                detectedAt: now,
                currentValue: evaluation.currentValue ?? 0,
                thresholdValue: evaluation.thresholdValue ?? 0,
                severity: rule.severity,
                message: evaluation.message,
            });
        }
    }
    return results;
}
//# sourceMappingURL=alert-evaluator.js.map