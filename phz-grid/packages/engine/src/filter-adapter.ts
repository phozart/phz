/**
 * @phozart/engine — Filter Adapter
 *
 * Bridges CriteriaEngine output (ArtefactCriteria) to widget data filtering.
 * Provides:
 * - applyArtefactCriteria(): pure function that filters rows using FilterCriterion[]
 * - FilterAdapter: stateful adapter managing values, criteria, and subscriptions
 * - globalFiltersToCriteriaBindings(): converts GlobalFilter[] into CriteriaEngine registrations
 */

import type {
  ArtefactId, ArtefactCriteria, FilterCriterion,
  SelectionContext, FilterDefinitionId,
} from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';
import type { CriteriaEngine } from './criteria/criteria-engine.js';
import type { GlobalFilter, GlobalFilterType } from './dashboard-enhanced.js';
import type { SelectionFieldType } from '@phozart/core';

// --- FilterAdapter Interface ---

export interface FilterAdapter {
  /** Apply current filter state to a data array, returning filtered rows. */
  applyFilters(data: Record<string, unknown>[]): Record<string, unknown>[];
  /** Set filter values and rebuild criteria. Notifies subscribers. */
  setValues(values: SelectionContext): void;
  /** Get current filter values. */
  getValues(): SelectionContext;
  /** Get the latest ArtefactCriteria (or null if no values set). */
  getCurrentCriteria(): ArtefactCriteria | null;
  /** Reset all filter values. Notifies subscribers. */
  reset(): void;
  /** Subscribe to criteria changes. Returns unsubscribe function. */
  subscribe(listener: (criteria: ArtefactCriteria) => void): () => void;
}

// --- Pure Filter Application ---

/**
 * Apply ArtefactCriteria filters to a data array, returning matching rows.
 * All filters are combined with AND logic. Null values skip the filter.
 */
export function applyArtefactCriteria(
  data: Record<string, unknown>[],
  criteria: ArtefactCriteria,
): Record<string, unknown>[] {
  let filtered = data;

  for (const filter of criteria.filters) {
    if (!filter.dataField) continue;
    if (filter.value === null && filter.operator !== 'is_null' && filter.operator !== 'is_not_null') continue;

    filtered = applyFilterCriterion(filtered, filter);
  }

  return filtered;
}

function applyFilterCriterion(
  rows: Record<string, unknown>[],
  filter: FilterCriterion,
): Record<string, unknown>[] {
  const field = filter.dataField!;
  const value = filter.value;

  switch (filter.operator) {
    case 'equals':
      return rows.filter(row => String(row[field] ?? '') === String(value));

    case 'not_equals':
      return rows.filter(row => String(row[field] ?? '') !== String(value));

    case 'in': {
      const vals = Array.isArray(value) ? value : [value as string];
      return rows.filter(row => vals.includes(String(row[field] ?? '')));
    }

    case 'not_in': {
      const vals = Array.isArray(value) ? value : [value as string];
      return rows.filter(row => !vals.includes(String(row[field] ?? '')));
    }

    case 'like': {
      const search = String(value).toLowerCase();
      return rows.filter(row => String(row[field] ?? '').toLowerCase().includes(search));
    }

    case 'not_like': {
      const search = String(value).toLowerCase();
      return rows.filter(row => !String(row[field] ?? '').toLowerCase().includes(search));
    }

    case 'starts_with': {
      const prefix = String(value).toLowerCase();
      return rows.filter(row => String(row[field] ?? '').toLowerCase().startsWith(prefix));
    }

    case 'between': {
      if (!Array.isArray(value) || value.length < 2) return rows;
      const min = Number(value[0]);
      const max = Number(value[1]);
      return rows.filter(row => {
        const v = Number(row[field]);
        return !isNaN(v) && v >= min && v <= max;
      });
    }

    case 'greater_than': {
      const threshold = Number(value);
      return rows.filter(row => {
        const v = Number(row[field]);
        return !isNaN(v) && v > threshold;
      });
    }

    case 'less_than': {
      const threshold = Number(value);
      return rows.filter(row => {
        const v = Number(row[field]);
        return !isNaN(v) && v < threshold;
      });
    }

    case 'is_null':
      return rows.filter(row => row[field] === null || row[field] === undefined);

    case 'is_not_null':
      return rows.filter(row => row[field] !== null && row[field] !== undefined);

    default:
      return rows;
  }
}

// --- FilterAdapter Factory ---

export function createFilterAdapter(
  criteriaEngine: CriteriaEngine,
  artefactId: ArtefactId,
): FilterAdapter {
  let currentValues: SelectionContext = {};
  let currentCriteria: ArtefactCriteria | null = null;
  const listeners = new Set<(criteria: ArtefactCriteria) => void>();

  function rebuild(): void {
    currentCriteria = criteriaEngine.buildCriteria(artefactId, currentValues);
    for (const listener of listeners) {
      listener(currentCriteria);
    }
  }

  return {
    applyFilters(data: Record<string, unknown>[]): Record<string, unknown>[] {
      if (!currentCriteria) {
        // Build criteria on demand if not yet built
        currentCriteria = criteriaEngine.buildCriteria(artefactId, currentValues);
      }
      return applyArtefactCriteria(data, currentCriteria);
    },

    setValues(values: SelectionContext): void {
      currentValues = { ...currentValues, ...values };
      rebuild();
    },

    getValues(): SelectionContext {
      return { ...currentValues };
    },

    getCurrentCriteria(): ArtefactCriteria | null {
      return currentCriteria;
    },

    reset(): void {
      currentValues = {};
      currentCriteria = null;
    },

    subscribe(listener: (criteria: ArtefactCriteria) => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

// --- GlobalFilter to CriteriaEngine Bridge ---

const GLOBAL_FILTER_TYPE_MAP: Record<GlobalFilterType, SelectionFieldType> = {
  'select': 'single_select',
  'multi-select': 'multi_select',
  'date-range': 'date_range',
  'text-search': 'search',
  'number-range': 'numeric_range',
};

/**
 * Convert GlobalFilter[] from an EnhancedDashboardConfig into CriteriaEngine
 * filter definitions and bindings. This makes GlobalFilter a thin wrapper
 * over the CriteriaEngine, unifying both filter systems.
 */
export function globalFiltersToCriteriaBindings(
  criteriaEngine: CriteriaEngine,
  artId: ArtefactId,
  globalFilters: GlobalFilter[],
): void {
  const now = Date.now();

  for (let i = 0; i < globalFilters.length; i++) {
    const gf = globalFilters[i];
    const defId = filterDefinitionId(gf.id);
    const fieldType = GLOBAL_FILTER_TYPE_MAP[gf.filterType] ?? 'single_select';

    // Register definition if not already present
    if (!criteriaEngine.registry.get(defId)) {
      criteriaEngine.registry.register({
        id: defId,
        label: gf.label,
        type: fieldType,
        sessionBehavior: 'reset',
        dataField: gf.fieldKey,
        defaultValue: gf.defaultValue !== undefined ? String(gf.defaultValue) : undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Bind to artefact
    try {
      criteriaEngine.bindings.bind({
        filterDefinitionId: defId,
        artefactId: artId,
        visible: true,
        order: i,
        targetScope: gf.targetWidgetIds?.map(id => id as string),
      });
    } catch {
      // Already bound — skip
    }
  }
}
