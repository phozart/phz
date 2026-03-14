/**
 * @phozart/engine — Widget Data Processor
 *
 * Pipeline: filter → group by category → aggregate measures → sort → limit (with "Others" grouping).
 * Pure functions, no DOM dependency.
 */

import type { AggregationFunction } from '@phozart/core';
import type { WidgetDataConfig, WidgetFilterRule, FilterOperator, MeasureRef } from './widget-config-enhanced.js';
import { computeAggregation } from './aggregation.js';

// --- Output types ---

export interface ProcessedRow {
  label: string;
  values: Record<string, number | null>;
  children?: ProcessedRow[];
}

export interface ProcessedWidgetData {
  rows: ProcessedRow[];
  totals?: Record<string, number | null>;
}

// --- Filter evaluation ---

function matchesFilter(row: Record<string, unknown>, rule: WidgetFilterRule): boolean {
  const val = row[rule.field];
  const cmp = rule.value;

  switch (rule.operator) {
    case 'eq': return val === cmp;
    case 'neq': return val !== cmp;
    case 'gt': return typeof val === 'number' && typeof cmp === 'number' && val > cmp;
    case 'gte': return typeof val === 'number' && typeof cmp === 'number' && val >= cmp;
    case 'lt': return typeof val === 'number' && typeof cmp === 'number' && val < cmp;
    case 'lte': return typeof val === 'number' && typeof cmp === 'number' && val <= cmp;
    case 'contains': return typeof val === 'string' && typeof cmp === 'string' && val.toLowerCase().includes(cmp.toLowerCase());
    case 'not_contains': return typeof val === 'string' && typeof cmp === 'string' && !val.toLowerCase().includes(cmp.toLowerCase());
    case 'starts_with': return typeof val === 'string' && typeof cmp === 'string' && val.toLowerCase().startsWith(cmp.toLowerCase());
    case 'ends_with': return typeof val === 'string' && typeof cmp === 'string' && val.toLowerCase().endsWith(cmp.toLowerCase());
    case 'in': return Array.isArray(cmp) && cmp.includes(val);
    case 'not_in': return Array.isArray(cmp) && !cmp.includes(val);
    case 'between': {
      if (typeof val !== 'number' || typeof cmp !== 'number' || typeof rule.value2 !== 'number') return false;
      return val >= cmp && val <= rule.value2;
    }
    case 'is_null': return val === null || val === undefined;
    case 'is_not_null': return val !== null && val !== undefined;
    default: return true;
  }
}

function applyFilters(rows: Record<string, unknown>[], filters?: WidgetFilterRule[]): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return rows;
  return rows.filter(row => filters.every(rule => matchesFilter(row, rule)));
}

// --- Grouping ---

function groupByCategory(rows: Record<string, unknown>[], categoryField: string): Map<string, Record<string, unknown>[]> {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row[categoryField] ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return groups;
}

// --- Aggregation ---

function aggregateGroup(rows: Record<string, unknown>[], measures: MeasureRef[]): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const m of measures) {
    const val = computeAggregation(rows, m.fieldKey, m.aggregation);
    result[m.fieldKey] = typeof val === 'number' ? val : null;
  }
  return result;
}

// --- Main pipeline ---

export function processWidgetData(
  rows: Record<string, unknown>[],
  dataConfig: WidgetDataConfig,
): ProcessedWidgetData {
  const { bindings, filters, sort, limit, groupOthers } = dataConfig;

  // Step 1: Filter
  const filtered = applyFilters(rows, filters);

  // Only chart-like bindings have category + values grouping
  if (bindings.type === 'chart') {
    const { category, values } = bindings;
    const categoryField = category.fieldKey;

    if (!categoryField || values.length === 0) {
      return { rows: [] };
    }

    // Step 2: Group by category
    const groups = groupByCategory(filtered, categoryField);

    // Step 3: Aggregate each group
    let processedRows: ProcessedRow[] = Array.from(groups.entries()).map(([label, groupRows]) => ({
      label,
      values: aggregateGroup(groupRows, values),
    }));

    // Step 4: Sort
    const sortField = sort?.field || values[0].fieldKey;
    const sortDir = sort?.direction ?? 'desc';
    processedRows.sort((a, b) => {
      const av = a.values[sortField] ?? 0;
      const bv = b.values[sortField] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    // Step 5: Limit with optional "Others" grouping
    if (limit && limit > 0 && processedRows.length > limit) {
      const visible = processedRows.slice(0, limit);
      if (groupOthers) {
        const othersRows = processedRows.slice(limit);
        const othersValues: Record<string, number | null> = {};
        for (const m of values) {
          let sum = 0;
          let count = 0;
          for (const r of othersRows) {
            const v = r.values[m.fieldKey];
            if (v !== null) { sum += v; count++; }
          }
          othersValues[m.fieldKey] = count > 0 ? sum / count : null;
        }
        visible.push({ label: 'Others', values: othersValues, children: othersRows });
      }
      processedRows = visible;
    }

    // Compute totals
    const totals: Record<string, number | null> = {};
    for (const m of values) {
      const val = computeAggregation(filtered, m.fieldKey, m.aggregation);
      totals[m.fieldKey] = typeof val === 'number' ? val : null;
    }

    return { rows: processedRows, totals };
  }

  // For non-chart bindings, just return filtered rows as-is
  return {
    rows: filtered.map((row, i) => ({
      label: String(i),
      values: Object.fromEntries(
        Object.entries(row).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, v as number])
      ),
    })),
  };
}
