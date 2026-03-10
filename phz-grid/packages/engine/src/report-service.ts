/**
 * @phozart/phz-engine — Report Service
 *
 * Per-route runtime orchestrator that connects a report's filter definitions
 * to the criteria engine, manages filter state, and produces grid-ready
 * filter parameters. This is the "glue" layer that wires everything together
 * at runtime.
 *
 * Usage:
 *   const service = createReportService(engine, reportId);
 *   service.subscribe((result) => { ... update grid ... });
 *   service.setValue('region', ['EMEA']);
 */

import type {
  SelectionContext, SelectionFieldDef, ArtefactId,
  FilterDefinitionId, ArtefactCriteria,
} from '@phozart/phz-core';
import { filterDefinitionId } from '@phozart/phz-core';
import type { ReportId, DashboardId } from './types.js';
import type { BIEngine } from './engine.js';
import type { CriteriaResolutionResult, DivergenceInfo } from './criteria/resolve-criteria.js';

// --- Grid Filter Params ---

export interface GridFilterParams {
  /** Filter fields resolved for the current artefact */
  fields: SelectionFieldDef[];
  /** Current filter values */
  values: SelectionContext;
  /** Structured criteria output for API/SQL generation */
  criteria: ArtefactCriteria | null;
  /** Whether all required fields have values */
  isComplete: boolean;
  /** How filters were resolved */
  source: 'registry' | 'hydrated' | 'none';
  /** Divergence info if both inline and registry exist */
  divergence?: DivergenceInfo;
}

export type FilterChangeListener = (params: GridFilterParams) => void;

// --- Report Service Interface ---

export interface ReportService {
  /** The resolved ArtefactId for this report */
  readonly artefactId: ArtefactId;

  /** Get the current resolved fields */
  getFields(): SelectionFieldDef[];

  /** Get the current filter values */
  getValues(): SelectionContext;

  /** Set a single filter value */
  setValue(fieldId: string, value: string | string[] | null): void;

  /** Set multiple filter values at once */
  setValues(values: SelectionContext): void;

  /** Reset all filters to defaults */
  reset(): void;

  /** Build current GridFilterParams snapshot */
  getFilterParams(): GridFilterParams;

  /** Subscribe to filter changes */
  subscribe(listener: FilterChangeListener): () => void;

  /** Destroy the service and clean up subscriptions */
  destroy(): void;
}

// --- Dashboard Service (same interface) ---

export interface DashboardService {
  readonly artefactId: ArtefactId;
  getFields(): SelectionFieldDef[];
  getValues(): SelectionContext;
  setValue(fieldId: string, value: string | string[] | null): void;
  setValues(values: SelectionContext): void;
  reset(): void;
  getFilterParams(): GridFilterParams;
  subscribe(listener: FilterChangeListener): () => void;
  destroy(): void;
}

// --- Internal Shared Factory ---

function createArtefactService(
  resolution: CriteriaResolutionResult,
  engine: BIEngine,
): ReportService {
  const { artefactId } = resolution;
  const listeners: Set<FilterChangeListener> = new Set();
  let currentValues: SelectionContext = {};

  // Initialize default values from resolved fields
  for (const field of resolution.fields) {
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      currentValues[field.id] = field.defaultValue;
    }
  }

  function notify(): void {
    const params = buildFilterParams();
    for (const listener of listeners) {
      listener(params);
    }
  }

  function buildFilterParams(): GridFilterParams {
    const fields = resolution.fields;
    const isComplete = fields
      .filter(f => f.required)
      .every(f => {
        const val = currentValues[f.id];
        return val !== null && val !== undefined && val !== '';
      });

    let criteria: ArtefactCriteria | null = null;
    if (fields.length > 0) {
      criteria = engine.criteria.buildCriteria(artefactId, currentValues);
    }

    return {
      fields,
      values: { ...currentValues },
      criteria,
      isComplete,
      source: resolution.source,
      divergence: resolution.divergence,
    };
  }

  return {
    get artefactId() {
      return artefactId;
    },

    getFields(): SelectionFieldDef[] {
      return resolution.fields;
    },

    getValues(): SelectionContext {
      return { ...currentValues };
    },

    setValue(fieldId: string, value: string | string[] | null): void {
      currentValues[fieldId] = value;
      notify();
    },

    setValues(values: SelectionContext): void {
      currentValues = { ...currentValues, ...values };
      notify();
    },

    reset(): void {
      currentValues = {};
      for (const field of resolution.fields) {
        if (field.defaultValue !== undefined && field.defaultValue !== null) {
          currentValues[field.id] = field.defaultValue;
        }
      }
      notify();
    },

    getFilterParams(): GridFilterParams {
      return buildFilterParams();
    },

    subscribe(listener: FilterChangeListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    destroy(): void {
      listeners.clear();
    },
  };
}

// --- Public Factories ---

export function createReportService(
  engine: BIEngine,
  reportId: ReportId,
): ReportService {
  const resolution = engine.getReportFilters(reportId);
  return createArtefactService(resolution, engine);
}

export function createDashboardService(
  engine: BIEngine,
  dashboardId: DashboardId,
): DashboardService {
  const resolution = engine.getDashboardFilters(dashboardId);
  return createArtefactService(resolution, engine);
}
