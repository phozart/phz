/**
 * @phozart/phz-engine — Criteria Resolution for Reports & Dashboards
 *
 * Auto-hydrates inline CriteriaConfig into the registry when no bindings
 * exist, then resolves filter fields. Implements divergence detection
 * when both inline config and registry bindings coexist.
 */

import type {
  SelectionFieldDef, ArtefactId, CriteriaConfig,
  FilterBinding, FilterDefinition, FilterDefinitionId,
} from '@phozart/phz-core';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';
import type { ReportId, DashboardId } from '../types.js';
import { reportArtefactId, dashboardArtefactId } from '../types.js';
import type { CriteriaEngine } from './criteria-engine.js';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';
import type { ReportConfigStore } from '../report.js';
import type { DashboardConfigStore } from '../dashboard.js';

// --- Divergence Detection ---

export interface DivergenceInfo {
  artefactId: ArtefactId;
  artefactType: 'report' | 'dashboard';
  artefactName: string;
  /** Fields in inline config but not in registry bindings */
  inlineOnly: string[];
  /** Fields in registry bindings but not in inline config */
  registryOnly: string[];
  /** Fields in both but with differing definitions */
  diverged: string[];
}

export type DivergenceCallback = (info: DivergenceInfo) => void;

// --- Resolution Result ---

export interface CriteriaResolutionResult {
  fields: SelectionFieldDef[];
  artefactId: ArtefactId;
  /** How the fields were resolved */
  source: 'registry' | 'hydrated' | 'none';
  /** If divergence was detected, details are here */
  divergence?: DivergenceInfo;
}

// --- Public Utility: Hydrate CriteriaConfig into registry + bindings ---

/**
 * Hydrate a CriteriaConfig into a filter registry and binding store.
 * Idempotent: skips definitions/bindings that already exist.
 */
export function hydrateCriteriaConfig(
  registry: FilterRegistry,
  bindings: FilterBindingStore,
  config: CriteriaConfig,
  artId: ArtefactId,
): void {
  const now = Date.now();

  for (let i = 0; i < config.fields.length; i++) {
    const field = config.fields[i];
    const defId = filterDefinitionId(field.id);

    // Only register if not already in registry
    if (!registry.get(defId)) {
      const def: FilterDefinition = {
        id: defId,
        label: field.label,
        type: field.type,
        sessionBehavior: 'reset',
        defaultValue: field.defaultValue,
        options: field.options,
        treeOptions: field.treeOptions,
        dateRangeConfig: field.dateRangeConfig,
        numericRangeConfig: field.numericRangeConfig,
        searchConfig: field.searchConfig,
        fieldPresenceConfig: field.fieldPresenceConfig,
        dataField: field.dataField,
        selectionMode: field.selectionMode,
        required: field.required,
        dependsOn: field.dependsOn ? [filterDefinitionId(field.dependsOn)] : undefined,
        createdAt: now,
        updatedAt: now,
      };
      registry.register(def);
    }

    // Bind to artefact
    const binding: FilterBinding = {
      filterDefinitionId: defId,
      artefactId: artId,
      visible: true,
      order: i,
      barConfigOverride: field.barConfig,
    };

    try {
      bindings.bind(binding);
    } catch {
      // Binding already exists — skip (idempotent)
    }
  }
}

// --- Internal Helpers ---

function detectDivergence(
  engine: CriteriaEngine,
  inlineConfig: CriteriaConfig,
  artId: ArtefactId,
  artefactType: 'report' | 'dashboard',
  artefactName: string,
): DivergenceInfo | undefined {
  const existingBindings = engine.bindings.getBindingsForArtefact(artId);
  if (existingBindings.length === 0) return undefined;

  const inlineFieldIds = new Set(inlineConfig.fields.map(f => f.id));
  const registryFieldIds = new Set(existingBindings.map(b => b.filterDefinitionId as string));

  const inlineOnly = [...inlineFieldIds].filter(id => !registryFieldIds.has(id));
  const registryOnly = [...registryFieldIds].filter(id => !inlineFieldIds.has(id));

  const diverged: string[] = [];
  for (const field of inlineConfig.fields) {
    if (!registryFieldIds.has(field.id)) continue;
    const def = engine.registry.get(filterDefinitionId(field.id));
    if (!def) continue;

    // Check key properties for divergence
    if (
      def.label !== field.label ||
      def.type !== field.type ||
      def.dataField !== field.dataField ||
      JSON.stringify(def.defaultValue) !== JSON.stringify(field.defaultValue)
    ) {
      diverged.push(field.id);
    }
  }

  if (inlineOnly.length === 0 && registryOnly.length === 0 && diverged.length === 0) {
    return undefined;
  }

  return {
    artefactId: artId,
    artefactType,
    artefactName,
    inlineOnly,
    registryOnly,
    diverged,
  };
}

/**
 * Shared resolution logic for both reports and dashboards.
 *
 * Strategy (Option D — Pragmatic Hybrid):
 * 1. Registry bindings exist, no inline → use registry (source: 'registry')
 * 2. No bindings, inline config → auto-hydrate then resolve (source: 'hydrated')
 * 3. Both exist → use registry, detect divergence
 * 4. Neither → return empty (source: 'none')
 */
function resolveArtefactCriteria(
  artId: ArtefactId,
  artefactType: 'report' | 'dashboard',
  artefactName: string,
  inlineConfig: CriteriaConfig | undefined,
  engine: CriteriaEngine,
  onDivergence?: DivergenceCallback,
): CriteriaResolutionResult {
  const existingBindings = engine.bindings.getBindingsForArtefact(artId);
  const hasBindings = existingBindings.length > 0;
  const hasInline = !!inlineConfig && inlineConfig.fields.length > 0;

  // Case 1: Registry bindings exist, no inline
  if (hasBindings && !hasInline) {
    return {
      fields: engine.resolveFields(artId),
      artefactId: artId,
      source: 'registry',
    };
  }

  // Case 2: Only inline config — auto-hydrate
  if (!hasBindings && hasInline) {
    hydrateCriteriaConfig(engine.registry, engine.bindings, inlineConfig!, artId);
    return {
      fields: engine.resolveFields(artId),
      artefactId: artId,
      source: 'hydrated',
    };
  }

  // Case 3: Both exist — use registry, detect divergence
  if (hasBindings && hasInline) {
    const divergence = detectDivergence(engine, inlineConfig!, artId, artefactType, artefactName);
    if (divergence && onDivergence) {
      onDivergence(divergence);
    }
    return {
      fields: engine.resolveFields(artId),
      artefactId: artId,
      source: 'registry',
      divergence,
    };
  }

  // Case 4: Neither
  return { fields: [], artefactId: artId, source: 'none' };
}

// --- Public API ---

/**
 * Resolve filter fields for a report.
 */
export function resolveReportCriteria(
  reportId: ReportId,
  engine: CriteriaEngine,
  reports: ReportConfigStore,
  onDivergence?: DivergenceCallback,
): CriteriaResolutionResult {
  const report = reports.get(reportId);
  if (!report) {
    return { fields: [], artefactId: reportArtefactId(reportId), source: 'none' };
  }
  return resolveArtefactCriteria(
    reportArtefactId(reportId), 'report', report.name,
    report.criteriaConfig, engine, onDivergence,
  );
}

/**
 * Resolve filter fields for a dashboard.
 */
export function resolveDashboardCriteria(
  dashboardId: DashboardId,
  engine: CriteriaEngine,
  dashboards: DashboardConfigStore,
  onDivergence?: DivergenceCallback,
): CriteriaResolutionResult {
  const dashboard = dashboards.get(dashboardId);
  if (!dashboard) {
    return { fields: [], artefactId: dashboardArtefactId(dashboardId), source: 'none' };
  }
  return resolveArtefactCriteria(
    dashboardArtefactId(dashboardId), 'dashboard', dashboard.name,
    dashboard.criteriaConfig, engine, onDivergence,
  );
}
