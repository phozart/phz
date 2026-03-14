/**
 * @phozart/engine — Selection Criteria Logic
 *
 * Pure headless functions for criteria resolution, validation,
 * dependency management, export metadata, and URL serialization.
 */

import type {
  SelectionContext,
  SelectionFieldDef,
  SelectionFieldType,
  SelectionValidationResult,
  SelectionValidationError,
  CriteriaConfig,
  CriteriaBehavior,
  CriteriaExportMetadata,
  CriteriaExportEntry,
  DateRangeValue,
  NumericRangeValue,
  DynamicDatePreset,
  TreeNode,
  SelectionFieldOption,
  BuiltinDatePresetId,
  DatePresetDef,
  DatePresetGroup,
  DateGranularity,
  DateRangeFieldConfig,
  ComparisonType,
  WeekStartDay,
  ColumnType,
  PresenceState,
  CriteriaSelectionMode,
  OptionsSource,
  DataSet,
} from '@phozart/core';

// --- Dynamic Defaults ---

function padTwo(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

function resolveAnchor(anchor: DynamicDatePreset['anchor'], now: Date): Date {
  switch (anchor) {
    case 'start_of_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'start_of_year':
      return new Date(now.getFullYear(), 0, 1);
    case 'today':
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

function subtractUnits(d: Date, unit: DynamicDatePreset['unit'], count: number): Date {
  const result = new Date(d);
  switch (unit) {
    case 'day':
      result.setDate(result.getDate() - count);
      break;
    case 'week':
      result.setDate(result.getDate() - count * 7);
      break;
    case 'month':
      result.setMonth(result.getMonth() - count);
      break;
    case 'quarter':
      result.setMonth(result.getMonth() - count * 3);
      break;
    case 'year':
      result.setFullYear(result.getFullYear() - count);
      break;
  }
  return result;
}

/** Resolve a single dynamic date preset to a concrete DateRangeValue */
export function resolveDynamicPreset(preset: DynamicDatePreset, now?: Date): DateRangeValue {
  const ref = now ?? new Date();
  const anchorDate = resolveAnchor(preset.anchor, ref);
  const startDate = subtractUnits(anchorDate, preset.unit, preset.count);
  return {
    startDate: toISODate(startDate),
    endDate: toISODate(anchorDate),
    presetId: preset.id,
  };
}

// --- Built-in Date Presets ---

/** All built-in preset definitions grouped by category */
export const BUILTIN_DATE_PRESETS: DatePresetDef[] = [
  { id: 'today', label: 'Today', group: 'relative' },
  { id: 'yesterday', label: 'Yesterday', group: 'relative' },
  { id: 'last-7d', label: 'Last 7 days', group: 'relative' },
  { id: 'last-30d', label: 'Last 30 days', group: 'relative' },
  { id: 'last-90d', label: 'Last 90 days', group: 'relative' },
  { id: 'last-3m', label: 'Last 3 months', group: 'rolling' },
  { id: 'last-6m', label: 'Last 6 months', group: 'rolling' },
  { id: 'last-12m', label: 'Last 12 months', group: 'rolling' },
  { id: 'wtd', label: 'Week to date', group: 'to_date' },
  { id: 'mtd', label: 'Month to date', group: 'to_date' },
  { id: 'qtd', label: 'Quarter to date', group: 'to_date' },
  { id: 'ytd', label: 'Year to date', group: 'to_date' },
  { id: 'prev-week', label: 'Previous week', group: 'previous_complete' },
  { id: 'prev-month', label: 'Previous month', group: 'previous_complete' },
  { id: 'prev-quarter', label: 'Previous quarter', group: 'previous_complete' },
  { id: 'prev-year', label: 'Previous year', group: 'previous_complete' },
];

export const DATE_PRESET_GROUP_LABELS: Record<DatePresetGroup, string> = {
  relative: 'Relative',
  rolling: 'Rolling',
  to_date: 'To Date',
  previous_complete: 'Previous Complete',
};

/** Get the start of the fiscal year containing the given date */
function getFiscalYearStart(d: Date, fiscalStartMonth: number): Date {
  const month = d.getMonth(); // 0-based
  const fsm = fiscalStartMonth - 1; // convert 1-based to 0-based
  if (month >= fsm) {
    return new Date(d.getFullYear(), fsm, 1);
  }
  return new Date(d.getFullYear() - 1, fsm, 1);
}

/** Get the fiscal quarter (1-4) for a date */
export function getFiscalQuarter(d: Date, fiscalStartMonth: number = 1): number {
  const fsm = fiscalStartMonth - 1;
  const month = d.getMonth();
  const offset = (month - fsm + 12) % 12;
  return Math.floor(offset / 3) + 1;
}

/** Get the start and end dates of a fiscal quarter */
export function getFiscalQuarterBounds(
  year: number,
  quarter: number,
  fiscalStartMonth: number = 1,
): { start: Date; end: Date } {
  const fsm = fiscalStartMonth - 1;
  const startMonth = fsm + (quarter - 1) * 3;
  let startYear = year;
  let actualMonth = startMonth;
  if (actualMonth >= 12) {
    actualMonth -= 12;
    startYear++;
  }
  const start = new Date(startYear, actualMonth, 1);
  let endMonth = actualMonth + 3;
  let endYear = startYear;
  if (endMonth >= 12) {
    endMonth -= 12;
    endYear++;
  }
  const end = new Date(endYear, endMonth, 0); // last day of previous month = last day of quarter
  return { start, end };
}

/** Get start of the week containing the given date */
export function getWeekStart(d: Date, weekStartDay: WeekStartDay = 'monday'): Date {
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const startOffset = weekStartDay === 'monday' ? ((day + 6) % 7) : day;
  const result = new Date(d);
  result.setDate(result.getDate() - startOffset);
  return result;
}

/** Get end of the week containing the given date */
export function getWeekEnd(d: Date, weekStartDay: WeekStartDay = 'monday'): Date {
  const start = getWeekStart(d, weekStartDay);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

/** Get ISO week number (ISO 8601) */
export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get sequential week number (simple count from Jan 1) */
export function getSequentialWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

/** Get the bounds of a specific month */
export function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0),
  };
}

/** Get the bounds of a calendar quarter (non-fiscal) */
export function getCalendarQuarterBounds(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 0),
  };
}

interface DateResolveOptions {
  fiscalYearStartMonth?: number;
  weekStartDay?: WeekStartDay;
}

/** Resolve a built-in preset ID to a concrete DateRangeValue */
export function resolveBuiltinPreset(
  presetId: BuiltinDatePresetId,
  now?: Date,
  options?: DateResolveOptions,
): DateRangeValue {
  const ref = now ?? new Date();
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const fiscal = options?.fiscalYearStartMonth ?? 1;
  const weekStart = options?.weekStartDay ?? 'monday';
  const presetDef = BUILTIN_DATE_PRESETS.find(p => p.id === presetId);
  const label = presetDef?.label ?? presetId;

  switch (presetId) {
    case 'today':
      return { startDate: toISODate(today), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };

    case 'yesterday': {
      const yd = new Date(today);
      yd.setDate(yd.getDate() - 1);
      return { startDate: toISODate(yd), endDate: toISODate(yd), presetId, presetLabel: label, isDynamic: true };
    }

    case 'last-7d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { startDate: toISODate(s), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'last-30d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { startDate: toISODate(s), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'last-90d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 89);
      return { startDate: toISODate(s), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'last-3m': {
      const s = new Date(today);
      s.setMonth(s.getMonth() - 3);
      s.setDate(s.getDate() + 1);
      return { startDate: toISODate(s), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'last-6m': {
      const s = new Date(today);
      s.setMonth(s.getMonth() - 6);
      s.setDate(s.getDate() + 1);
      return { startDate: toISODate(s), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'last-12m': {
      const s = new Date(today);
      s.setFullYear(s.getFullYear() - 1);
      s.setDate(s.getDate() + 1);
      return { startDate: toISODate(s), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'wtd': {
      const ws = getWeekStart(today, weekStart);
      return { startDate: toISODate(ws), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'mtd': {
      const ms = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISODate(ms), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'qtd': {
      const q = getFiscalQuarter(today, fiscal);
      const qb = getFiscalQuarterBounds(today.getFullYear() - (today.getMonth() < fiscal - 1 ? 1 : 0), q, fiscal);
      return { startDate: toISODate(qb.start), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'ytd': {
      const ys = getFiscalYearStart(today, fiscal);
      return { startDate: toISODate(ys), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };
    }

    case 'prev-week': {
      const lastWeekDay = new Date(today);
      lastWeekDay.setDate(lastWeekDay.getDate() - 7);
      const s = getWeekStart(lastWeekDay, weekStart);
      const e = getWeekEnd(lastWeekDay, weekStart);
      return { startDate: toISODate(s), endDate: toISODate(e), presetId, presetLabel: label, isDynamic: true };
    }

    case 'prev-month': {
      const pm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const pmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toISODate(pm), endDate: toISODate(pmEnd), presetId, presetLabel: label, isDynamic: true };
    }

    case 'prev-quarter': {
      const cq = getFiscalQuarter(today, fiscal);
      const prevQ = cq === 1 ? 4 : cq - 1;
      const fyYear = today.getFullYear() - (today.getMonth() < fiscal - 1 ? 1 : 0);
      const prevQYear = cq === 1 ? fyYear - 1 : fyYear;
      const qb = getFiscalQuarterBounds(prevQYear, prevQ, fiscal);
      return { startDate: toISODate(qb.start), endDate: toISODate(qb.end), presetId, presetLabel: label, isDynamic: true };
    }

    case 'prev-year': {
      const currFYS = getFiscalYearStart(today, fiscal);
      const prevYS = new Date(currFYS);
      prevYS.setFullYear(prevYS.getFullYear() - 1);
      const prevYE = new Date(currFYS);
      prevYE.setDate(prevYE.getDate() - 1);
      return { startDate: toISODate(prevYS), endDate: toISODate(prevYE), presetId, presetLabel: label, isDynamic: true };
    }

    case 'same-period-last-year':
      // This is contextual — returns a 1-day range centered on today-1y by default
      // Actual use should pass the primary range to resolveComparisonPeriod
      return { startDate: toISODate(today), endDate: toISODate(today), presetId, presetLabel: label, isDynamic: true };

    default:
      return { startDate: toISODate(today), endDate: toISODate(today), presetId, presetLabel: presetId, isDynamic: true };
  }
}

/** Resolve a comparison period from a primary date range */
export function resolveComparisonPeriod(
  primary: DateRangeValue,
  type: ComparisonType,
): { startDate: string; endDate: string } {
  const ps = new Date(primary.startDate);
  const pe = new Date(primary.endDate);

  if (type === 'previous_period') {
    const durationMs = pe.getTime() - ps.getTime();
    const newEnd = new Date(ps);
    newEnd.setDate(newEnd.getDate() - 1);
    const newStart = new Date(newEnd.getTime() - durationMs);
    return { startDate: toISODate(newStart), endDate: toISODate(newEnd) };
  }

  // same_period_last_year or custom — shift back 1 year
  const s = new Date(ps);
  s.setFullYear(s.getFullYear() - 1);
  const e = new Date(pe);
  e.setFullYear(e.getFullYear() - 1);
  return { startDate: toISODate(s), endDate: toISODate(e) };
}

/** Get the presets available for a given config, respecting filters */
export function getAvailablePresets(config: DateRangeFieldConfig): DatePresetDef[] {
  if (config.availablePresets) {
    return BUILTIN_DATE_PRESETS.filter(p => config.availablePresets!.includes(p.id));
  }
  if (config.availablePresetGroups) {
    return BUILTIN_DATE_PRESETS.filter(p => config.availablePresetGroups!.includes(p.group));
  }
  // All except same-period-last-year (contextual)
  return BUILTIN_DATE_PRESETS.filter(p => p.id !== 'same-period-last-year');
}

/** Format a date range for human-readable summary display.
 *  `locale` defaults to the runtime locale (browser language).
 *  Pass an explicit locale (e.g. 'en-GB') for deterministic output in tests. */
export function formatDateRangeDisplay(value: DateRangeValue, locale?: string): string {
  const s = new Date(value.startDate);
  const e = new Date(value.endDate);

  const fmtDay = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });

  const formatDate = (d: Date) => fmtDay.format(d);
  const formatMonth = (d: Date) => fmtMonth.format(d);

  const wrap = (rangeStr: string) =>
    value.presetLabel ? `${value.presetLabel} (${rangeStr})` : rangeStr;

  // Same day
  if (value.startDate === value.endDate) {
    return wrap(formatDate(s));
  }

  // Full month
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
    if (s.getDate() === 1 && e.getDate() === lastDay) {
      return wrap(formatMonth(s));
    }
    return wrap(`${formatDate(s)} – ${formatDate(e)}`);
  }

  // Same year — show full dates
  if (s.getFullYear() === e.getFullYear()) {
    return wrap(`${formatDate(s)} – ${formatDate(e)}`);
  }

  // Different years — month + year for brevity
  return wrap(`${formatMonth(s)} – ${formatMonth(e)}`);
}

/** Resolve dynamic defaults for all fields in a criteria config */
export function resolveDynamicDefaults(config: CriteriaConfig, now?: Date): SelectionContext {
  const values: SelectionContext = {};

  for (const field of config.fields) {
    if (field.lockedValue != null) {
      values[field.id] = field.lockedValue;
      continue;
    }

    if (field.defaultValue != null) {
      values[field.id] = field.defaultValue;
      continue;
    }

    // Resolve date_range defaults: prefer defaultPresetId, fallback to legacy dynamicPresets
    if (field.type === 'date_range') {
      if (field.dateRangeConfig?.defaultPresetId) {
        const range = resolveBuiltinPreset(field.dateRangeConfig.defaultPresetId, now, {
          fiscalYearStartMonth: field.dateRangeConfig.fiscalYearStartMonth,
          weekStartDay: field.dateRangeConfig.weekStartDay,
        });
        values[field.id] = JSON.stringify(range);
        continue;
      }
      if (field.dateRangeConfig?.dynamicPresets?.length) {
        const preset = field.dateRangeConfig.dynamicPresets[0];
        const range = resolveDynamicPreset(preset, now);
        values[field.id] = JSON.stringify(range);
        continue;
      }
    }

    values[field.id] = null;
  }

  return values;
}

// --- Dependency Resolution ---

/** Filter tree nodes by a parent field's value (cascading filter) */
export function filterTreeByParent(
  nodes: TreeNode[],
  parentValue: string | string[] | null,
): TreeNode[] {
  if (!parentValue) return nodes;
  const parentValues = Array.isArray(parentValue) ? parentValue : [parentValue];

  function filterRecursive(nodeList: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodeList) {
      if (parentValues.includes(node.value)) {
        result.push(node);
      } else if (node.children) {
        const filtered = filterRecursive(node.children);
        if (filtered.length > 0) {
          result.push({ ...node, children: filtered });
        }
      }
    }
    return result;
  }

  return filterRecursive(nodes);
}

/** Resolve filtered options for each field based on current selections and dependency chain */
export function resolveDependencies(
  config: CriteriaConfig,
  currentValues: SelectionContext,
): Map<string, SelectionFieldOption[]> {
  const result = new Map<string, SelectionFieldOption[]>();
  const deps = config.dependencies ?? [];

  for (const field of config.fields) {
    const dep = deps.find(d => d.childFieldId === field.id);
    if (!dep) {
      if (field.options) {
        result.set(field.id, field.options);
      }
      continue;
    }

    const parentValue = currentValues[dep.parentFieldId];

    if (field.type === 'tree_select' && field.treeOptions) {
      const filtered = filterTreeByParent(field.treeOptions, parentValue);
      const flatOptions = flattenTree(filtered);
      result.set(field.id, flatOptions);
    } else if (field.options) {
      if (!parentValue) {
        result.set(field.id, field.options);
      } else {
        const parentValues = Array.isArray(parentValue) ? parentValue : [parentValue];
        const filtered = field.options.filter(opt => parentValues.includes(opt.value));
        result.set(field.id, filtered.length > 0 ? filtered : field.options);
      }
    }
  }

  return result;
}

function flattenTree(nodes: TreeNode[]): SelectionFieldOption[] {
  const result: SelectionFieldOption[] = [];
  for (const node of nodes) {
    result.push({ value: node.value, label: node.label });
    if (node.children) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

// --- Validation ---

/** Validate criteria values against field definitions */
export function validateCriteria(
  config: CriteriaConfig,
  values: SelectionContext,
): SelectionValidationResult {
  const errors: SelectionValidationError[] = [];

  for (const field of config.fields) {
    const val = values[field.id];
    const mode = field.selectionMode;

    // selectionMode: 'none' — skip required check, value must be empty
    if (mode === 'none') {
      if (val != null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
        errors.push({ field: field.id, message: `${field.label} does not allow selection` });
      }
      continue;
    }

    // Required check
    if (field.required && (val == null || val === '' || (Array.isArray(val) && val.length === 0))) {
      errors.push({ field: field.id, message: `${field.label} is required` });
      continue;
    }

    // selectionMode: 'single' — reject multi-value arrays
    if (mode === 'single' && Array.isArray(val) && val.length > 1) {
      errors.push({ field: field.id, message: `${field.label} allows only a single selection` });
      continue;
    }

    // Date range validation
    if (field.type === 'date_range' && val != null && typeof val === 'string' && val !== '') {
      try {
        const range = JSON.parse(val) as DateRangeValue;
        if (range.startDate && range.endDate && range.startDate > range.endDate) {
          errors.push({ field: field.id, message: `${field.label}: start date must be before end date` });
        }
        if (field.dateRangeConfig?.minDate && range.startDate < field.dateRangeConfig.minDate) {
          errors.push({ field: field.id, message: `${field.label}: date is before minimum allowed` });
        }
        if (field.dateRangeConfig?.maxDate && range.endDate > field.dateRangeConfig.maxDate) {
          errors.push({ field: field.id, message: `${field.label}: date exceeds maximum allowed` });
        }
      } catch {
        errors.push({ field: field.id, message: `${field.label}: invalid date range value` });
      }
    }

    // Numeric range validation
    if (field.type === 'numeric_range' && val != null && typeof val === 'string' && val !== '') {
      try {
        const range = JSON.parse(val) as NumericRangeValue;
        if (range.min > range.max) {
          errors.push({ field: field.id, message: `${field.label}: min must be less than max` });
        }
        if (field.numericRangeConfig?.min != null && range.min < field.numericRangeConfig.min) {
          errors.push({ field: field.id, message: `${field.label}: value below minimum` });
        }
        if (field.numericRangeConfig?.max != null && range.max > field.numericRangeConfig.max) {
          errors.push({ field: field.id, message: `${field.label}: value exceeds maximum` });
        }
      } catch {
        errors.push({ field: field.id, message: `${field.label}: invalid numeric range value` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Export Metadata ---

/** Format a single criterion value for display */
export function formatCriteriaValue(field: SelectionFieldDef, value: string | string[] | null, locale?: string): string {
  if (value == null || value === '') return '(All)';

  if (field.type === 'date_range' && typeof value === 'string') {
    try {
      const range = JSON.parse(value) as DateRangeValue;
      const display = formatDateRangeDisplay(range, locale);
      if (range.comparisonStartDate && range.comparisonEndDate) {
        const compRange: DateRangeValue = { startDate: range.comparisonStartDate, endDate: range.comparisonEndDate };
        return `${display} vs ${formatDateRangeDisplay(compRange, locale)}`;
      }
      return display;
    } catch {
      return String(value);
    }
  }

  if (field.type === 'numeric_range' && typeof value === 'string') {
    try {
      const range = JSON.parse(value) as NumericRangeValue;
      const unit = field.numericRangeConfig?.unit ? ` ${field.numericRangeConfig.unit}` : '';
      return `${range.min}${unit} – ${range.max}${unit}`;
    } catch {
      return String(value);
    }
  }

  if (field.type === 'field_presence' && typeof value === 'string') {
    try {
      const map = JSON.parse(value) as Record<string, PresenceState>;
      const active = Object.entries(map).filter(([_, s]) => s !== 'any');
      if (active.length === 0) return '(All)';
      return active.map(([f, s]) => `${f}: ${s === 'has_value' ? 'has value' : 'empty'}`).join(', ');
    } catch {
      return String(value);
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '(All)';
    const optionMap = new Map(
      (field.options ?? []).map(o => [o.value, o.label]),
    );
    return value.map(v => optionMap.get(v) ?? v).join(', ');
  }

  // single value — try to find label from options
  if (field.options) {
    const opt = field.options.find(o => o.value === value);
    if (opt) return opt.label;
  }

  return String(value);
}

/** Build export metadata for including in CSV/Excel headers */
export function buildExportMetadata(
  config: CriteriaConfig,
  values: SelectionContext,
): CriteriaExportMetadata {
  const entries: CriteriaExportEntry[] = [];

  for (const field of config.fields) {
    const val = values[field.id];
    entries.push({
      fieldLabel: field.label,
      displayValue: formatCriteriaValue(field, val),
    });
  }

  return {
    label: 'Selection Criteria',
    entries,
    generatedAt: Date.now(),
  };
}

// --- URL Serialization ---

/** Serialize criteria values to URL search params */
export function serializeCriteria(
  values: SelectionContext,
  config: CriteriaConfig,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const field of config.fields) {
    const val = values[field.id];
    if (val == null) continue;
    if (Array.isArray(val)) {
      params.set(field.id, val.join(','));
    } else {
      params.set(field.id, val);
    }
  }

  return params;
}

/** Deserialize URL search params back to criteria values */
export function deserializeCriteria(
  params: URLSearchParams,
  config: CriteriaConfig,
): SelectionContext {
  const values: SelectionContext = {};

  for (const field of config.fields) {
    const raw = params.get(field.id);
    if (raw == null) {
      values[field.id] = null;
      continue;
    }

    if (field.type === 'multi_select' || field.type === 'chip_group' || field.type === 'tree_select') {
      values[field.id] = raw.split(',').filter(Boolean);
    } else {
      values[field.id] = raw;
    }
  }

  return values;
}

// --- Data-Binding Utilities ---

/** Infer the best criteria field type from a column's data type and cardinality */
export function inferCriteriaType(
  columnType: ColumnType | undefined,
  distinctCount: number,
): SelectionFieldType {
  switch (columnType) {
    case 'date':
      return 'date_range';
    case 'number':
      return distinctCount <= 20 ? 'single_select' : 'numeric_range';
    case 'boolean':
      return 'single_select';
    default:
      // string or custom
      if (distinctCount <= 6) return 'chip_group';
      if (distinctCount <= 30) return 'multi_select';
      return 'search';
  }
}

/** Extract distinct values from a data array for a given field, returned as options */
export function deriveOptionsFromData(
  data: Record<string, unknown>[],
  dataField: string,
): SelectionFieldOption[] {
  const seen = new Set<string>();
  const options: SelectionFieldOption[] = [];

  for (const row of data) {
    const raw = row[dataField];
    if (raw == null || raw === '') continue;
    const val = String(raw);
    if (!seen.has(val)) {
      seen.add(val);
      options.push({ value: val, label: val });
    }
  }

  options.sort((a, b) => a.label.localeCompare(b.label));
  return options;
}

/** Resolve options from an external dataset via OptionsSource config */
export function resolveOptionsSource(
  source: OptionsSource,
  dataSources: Record<string, DataSet>,
): SelectionFieldOption[] {
  const ds = dataSources[source.dataSetId];
  if (!ds) {
    console.warn(`[phozart] OptionsSource references unknown dataSetId "${source.dataSetId}"`);
    return [];
  }

  const seen = new Set<string>();
  const options: SelectionFieldOption[] = [];
  const labelField = source.labelField ?? source.valueField;

  for (const row of ds.rows) {
    const rawVal = row[source.valueField];
    if (rawVal == null || rawVal === '') continue;
    const val = String(rawVal);
    if (seen.has(val)) continue;
    seen.add(val);
    const label = labelField !== source.valueField ? String(row[labelField] ?? val) : val;
    options.push({ value: val, label });
  }

  const sortBy = source.sortBy ?? 'label';
  if (sortBy === 'label') {
    options.sort((a, b) => a.label.localeCompare(b.label));
  } else if (sortBy === 'value') {
    options.sort((a, b) => a.value.localeCompare(b.value));
  }

  return options;
}

/** Unified option resolver with priority: optionsSource > static options > derive from data */
export function resolveFieldOptions(
  field: SelectionFieldDef,
  dataSources?: Record<string, DataSet>,
  currentData?: Record<string, unknown>[],
): SelectionFieldOption[] {
  // Priority 1: external dataset via optionsSource
  if (field.optionsSource && dataSources) {
    return resolveOptionsSource(field.optionsSource, dataSources);
  }

  // Priority 2: static options
  if (field.options && field.options.length > 0) {
    return field.options;
  }

  // Priority 3: derive from current data via dataField
  if (currentData && field.dataField) {
    return deriveOptionsFromData(currentData, field.dataField);
  }

  return [];
}

/** Apply criteria filter values to a dataset using dataField bindings */
export function applyCriteriaToData(
  data: Record<string, unknown>[],
  config: CriteriaConfig,
  values: SelectionContext,
): Record<string, unknown>[] {
  let filtered = data;

  for (const field of config.fields) {
    // selectionMode: 'none' — skip filtering entirely
    if (field.selectionMode === 'none') continue;

    const val = values[field.id];
    if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) continue;

    const key = field.dataField ?? field.id;

    switch (field.type) {
      case 'single_select':
      case 'period_picker':
      case 'text': {
        if (typeof val === 'string') {
          filtered = filtered.filter(row => String(row[key] ?? '') === val);
        }
        break;
      }

      case 'multi_select':
      case 'chip_group':
      case 'tree_select': {
        const vals = Array.isArray(val) ? val : [val];
        filtered = filtered.filter(row => vals.includes(String(row[key] ?? '')));
        break;
      }

      case 'search': {
        if (typeof val === 'string') {
          const q = val.toLowerCase();
          filtered = filtered.filter(row => String(row[key] ?? '').toLowerCase().includes(q));
        }
        break;
      }

      case 'numeric_range': {
        if (typeof val === 'string') {
          try {
            const range = JSON.parse(val) as NumericRangeValue;
            filtered = filtered.filter(row => {
              const n = Number(row[key]);
              return !isNaN(n) && n >= range.min && n <= range.max;
            });
          } catch { /* skip invalid */ }
        }
        break;
      }

      case 'date_range': {
        if (typeof val === 'string') {
          try {
            const range = JSON.parse(val) as DateRangeValue;
            filtered = filtered.filter(row => {
              const d = String(row[key] ?? '');
              return d >= range.startDate && d <= range.endDate;
            });
          } catch { /* skip invalid */ }
        }
        break;
      }

      case 'field_presence': {
        if (typeof val === 'string') {
          try {
            const presenceMap = JSON.parse(val) as Record<string, PresenceState>;
            const active = Object.entries(presenceMap).filter(([_, s]) => s !== 'any');
            if (active.length > 0) {
              filtered = filtered.filter(row => {
                for (const [f, state] of active) {
                  const v = row[f];
                  const hasValue = v != null && v !== '';
                  if (state === 'has_value' && !hasValue) return false;
                  if (state === 'empty' && hasValue) return false;
                }
                return true;
              });
            }
          } catch { /* skip invalid */ }
        }
        break;
      }
    }
  }

  return filtered;
}

// --- Field Presence Filter ---

/** Apply presence filters (has_value / empty) to a dataset.
 *  Fields with state 'any' are skipped. */
export function applyPresenceFilter(
  data: Record<string, unknown>[],
  filters: Record<string, PresenceState>,
): Record<string, unknown>[] {
  const active = Object.entries(filters).filter(([_, s]) => s !== 'any');
  if (active.length === 0) return data;

  return data.filter(row => {
    for (const [field, state] of active) {
      const val = row[field];
      const hasValue = val != null && val !== '';
      if (state === 'has_value' && !hasValue) return false;
      if (state === 'empty' && hasValue) return false;
    }
    return true;
  });
}
