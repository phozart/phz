/**
 * @phozart/workspace — Config Schemas
 *
 * Plain TypeScript validation functions for widget config types.
 * No Zod dependency — uses simple runtime checks.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function check(errors: string[], condition: boolean, msg: string): void {
  if (!condition) errors.push(msg);
}

// --- Chart Config ---

export const ChartConfigDefaults = {
  showLegend: true,
  showDataLabels: false,
  stacked: false,
  horizontal: false,
  colorPalette: [] as string[],
} as const;

export function validateChartConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  check(errors, typeof config.valueField === 'string', 'valueField is required and must be a string');
  check(errors, typeof config.categoryField === 'string', 'categoryField is required and must be a string');
  if (config.showLegend !== undefined) {
    check(errors, typeof config.showLegend === 'boolean', 'showLegend must be a boolean');
  }
  if (config.showDataLabels !== undefined) {
    check(errors, typeof config.showDataLabels === 'boolean', 'showDataLabels must be a boolean');
  }
  if (config.colorPalette !== undefined) {
    check(errors, Array.isArray(config.colorPalette), 'colorPalette must be an array');
  }
  return { valid: errors.length === 0, errors };
}

// --- KPI Config ---

export const KPIConfigDefaults = {
  showTrend: true,
  showComparison: false,
  format: 'number' as string,
} as const;

export function validateKPIConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  check(errors, typeof config.metricField === 'string', 'metricField is required and must be a string');
  if (config.trendField !== undefined) {
    check(errors, typeof config.trendField === 'string', 'trendField must be a string');
  }
  if (config.comparisonField !== undefined) {
    check(errors, typeof config.comparisonField === 'string', 'comparisonField must be a string');
  }
  if (config.format !== undefined) {
    check(errors, typeof config.format === 'string', 'format must be a string');
  }
  return { valid: errors.length === 0, errors };
}

// --- Table Config ---

export const TableConfigDefaults = {
  sortable: true,
  filterable: false,
  pageSize: 50,
  showRowNumbers: false,
} as const;

export function validateTableConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  check(errors, Array.isArray(config.columns), 'columns is required and must be an array');
  if (config.pageSize !== undefined) {
    check(errors, typeof config.pageSize === 'number', 'pageSize must be a number');
  }
  if (config.sortable !== undefined) {
    check(errors, typeof config.sortable === 'boolean', 'sortable must be a boolean');
  }
  return { valid: errors.length === 0, errors };
}
