/**
 * @phozart/phz-workspace — Filter Ownership Model (U.5)
 *
 * Bridges FilterDefinitions, ArtifactFilterContracts, security bindings,
 * and filter rules into the existing FilterContextManager system.
 *
 * Admin defines FilterDefinitions -> binds to dashboards via ArtifactFilterContract.
 * End users can only use admin-defined filters + create personal presets within constraints.
 */

import type {
  ArtifactFilterContract,
  ViewerContext,
  FilterDefault,
} from '../types.js';
import type {
  FilterDefinition,
  SecurityBinding,
  FilterBinding,
} from './filter-definition.js';
import {
  resolveFilterDefault,
  evaluateSecurityBinding,
} from './filter-definition.js';
import {
  resolveFilterContract,
  validateFilterValues,
} from './filter-contract-resolver.js';

// ========================================================================
// Contract-based filter resolution
// ========================================================================

export interface ContractFilterResolution {
  filters: Array<{
    definition: FilterDefinition;
    queryLayer: 'server' | 'client' | 'auto';
    label: string;
    required: boolean;
  }>;
  defaults: Record<string, unknown>;
  effectiveValues: Record<string, unknown>;
}

export function resolveFiltersFromContract(
  contract: ArtifactFilterContract,
  definitions: FilterDefinition[],
  viewerContext?: ViewerContext,
  presetValues?: Record<string, unknown>,
): ContractFilterResolution {
  const resolved = resolveFilterContract(contract, definitions, viewerContext);

  const filters: ContractFilterResolution['filters'] = [];
  const defaults: Record<string, unknown> = {};
  const effectiveValues: Record<string, unknown> = {};

  for (const rf of resolved.filters) {
    const label = rf.overrides?.label ?? rf.definition.label;
    const required = rf.overrides?.required ?? rf.definition.required ?? false;

    filters.push({
      definition: rf.definition,
      queryLayer: rf.queryLayer,
      label,
      required,
    });

    // Resolve default
    if (rf.resolvedDefault !== undefined) {
      defaults[rf.definition.id] = rf.resolvedDefault;
    }

    // Effective value: preset takes precedence over default
    const presetVal = presetValues?.[rf.definition.id];
    if (presetVal !== undefined) {
      effectiveValues[rf.definition.id] = presetVal;
    } else if (rf.resolvedDefault !== undefined) {
      effectiveValues[rf.definition.id] = rf.resolvedDefault;
    }
  }

  return { filters, defaults, effectiveValues };
}

// ========================================================================
// Preset pruning
// ========================================================================

export interface PruneResult {
  pruned: Record<string, unknown>;
  removed: string[];
}

export function prunePresetValues(
  presetValues: Record<string, unknown>,
  contract: ArtifactFilterContract,
  definitions: FilterDefinition[],
): PruneResult {
  const acceptedIds = new Set(
    (contract.acceptedFilters ?? []).map(r => r.filterDefinitionId),
  );

  const defMap = new Map<string, FilterDefinition>();
  for (const d of definitions) {
    defMap.set(d.id, d);
  }

  const onInvalid = contract.validation?.onInvalid ?? 'prune';
  const pruned: Record<string, unknown> = {};
  const removed: string[] = [];

  for (const [filterId, value] of Object.entries(presetValues)) {
    // Remove filters no longer in the contract
    if (!acceptedIds.has(filterId)) {
      removed.push(filterId);
      continue;
    }

    const def = defMap.get(filterId);
    if (!def) {
      removed.push(filterId);
      continue;
    }

    // Validate value against static source if using prune strategy
    if (onInvalid === 'prune' && def.valueSource.type === 'static') {
      const allowed = new Set(def.valueSource.values);
      if (!allowed.has(String(value))) {
        removed.push(filterId);
        continue;
      }
    }

    pruned[filterId] = value;
  }

  return { pruned, removed };
}

// ========================================================================
// Security restrictions
// ========================================================================

export function applySecurityRestrictions(
  definition: FilterDefinition,
  viewer: ViewerContext | undefined,
  allValues: unknown[],
): unknown[] {
  if (!definition.securityBinding) return allValues;
  return evaluateSecurityBinding(definition.securityBinding, viewer, allValues);
}

// ========================================================================
// Filter bar entry builder from contract
// ========================================================================

export interface FilterBarEntry {
  id: string;
  label: string;
  filterType: FilterDefinition['filterType'];
  required: boolean;
  defaultValue?: unknown;
  bindings: FilterBinding[];
}

export function buildFilterBarFromContract(
  contract: ArtifactFilterContract,
  definitions: FilterDefinition[],
): FilterBarEntry[] {
  const defMap = new Map<string, FilterDefinition>();
  for (const d of definitions) {
    defMap.set(d.id, d);
  }

  const entries: FilterBarEntry[] = [];

  for (const ref of contract.acceptedFilters ?? []) {
    const def = defMap.get(ref.filterDefinitionId);
    if (!def) continue;

    entries.push({
      id: def.id,
      label: ref.overrides?.label ?? def.label,
      filterType: def.filterType,
      required: ref.overrides?.required ?? def.required ?? false,
      defaultValue: def.defaultValue,
      bindings: def.bindings,
    });
  }

  return entries;
}
