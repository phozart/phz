/**
 * @phozart/phz-workspace — Validation Feedback (L.14)
 *
 * Pure functions for inline field validation, panel status,
 * cross-reference validation, and config diffing.
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  message: string;
  severity?: 'error' | 'warning';
}

export interface FieldValidationResult {
  field: string;
  valid: boolean;
  message?: string;
  severity?: 'error' | 'warning';
}

export type PanelStatus = 'valid' | 'warning' | 'error';
export type FieldStatus = 'valid' | 'warning' | 'error';

export interface ConfigDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'changed' | 'added' | 'removed';
}

export function validateFields(
  data: Record<string, unknown>,
  rules: ValidationRule[],
): FieldValidationResult[] {
  return rules.map(rule => {
    const value = data[rule.field];
    const severity = rule.severity ?? 'error';

    if (rule.required) {
      if (value === undefined || value === null || value === '') {
        return { field: rule.field, valid: false, message: rule.message, severity };
      }
    }

    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return { field: rule.field, valid: false, message: rule.message, severity };
      }
    }

    if (rule.min !== undefined && typeof value === 'number') {
      if (value < rule.min) {
        return { field: rule.field, valid: false, message: rule.message, severity };
      }
    }

    if (rule.max !== undefined && typeof value === 'number') {
      if (value > rule.max) {
        return { field: rule.field, valid: false, message: rule.message, severity };
      }
    }

    return { field: rule.field, valid: true };
  });
}

export function getFieldStatus(result: FieldValidationResult): FieldStatus {
  if (result.valid) return 'valid';
  return result.severity ?? 'error';
}

export function computePanelStatus(results: FieldValidationResult[]): PanelStatus {
  let worst: PanelStatus = 'valid';
  for (const r of results) {
    if (!r.valid) {
      const sev = r.severity ?? 'error';
      if (sev === 'error') return 'error';
      if (sev === 'warning') worst = 'warning';
    }
  }
  return worst;
}

export function diffConfigs(
  oldConfig: Record<string, unknown>,
  newConfig: Record<string, unknown>,
): ConfigDiff[] {
  const diffs: ConfigDiff[] = [];
  const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);

  for (const key of allKeys) {
    const hasOld = key in oldConfig;
    const hasNew = key in newConfig;

    if (hasOld && hasNew) {
      if (oldConfig[key] !== newConfig[key]) {
        diffs.push({ field: key, oldValue: oldConfig[key], newValue: newConfig[key], changeType: 'changed' });
      }
    } else if (!hasOld && hasNew) {
      diffs.push({ field: key, oldValue: undefined, newValue: newConfig[key], changeType: 'added' });
    } else if (hasOld && !hasNew) {
      diffs.push({ field: key, oldValue: oldConfig[key], newValue: undefined, changeType: 'removed' });
    }
  }

  return diffs;
}
