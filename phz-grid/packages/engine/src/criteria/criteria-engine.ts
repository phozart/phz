/**
 * @phozart/phz-engine — Criteria Engine Facade
 *
 * Unified factory that wires all criteria engine layers together:
 * Registry → Bindings → State → Rules → Output → Admin
 */

import type {
  FilterDefinition, FilterDefinitionId, FilterBinding, ArtefactId,
  CriteriaConfig, StateStorageAdapter, AdminPermissions,
  SelectionFieldDef, ArtefactCriteria, StateResolutionLevel,
  RuleEvaluationContext,
} from '@phozart/phz-core';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';

import { createFilterRegistry } from './filter-registry.js';
import type { FilterRegistry } from './filter-registry.js';
import { createFilterBindingStore, resolveArtefactFields } from './filter-bindings.js';
import type { FilterBindingStore } from './filter-bindings.js';
import { hydrateCriteriaConfig } from './resolve-criteria.js';
import { createFilterStateManager, createMemoryStorageAdapter, resolveFilterValue } from './filter-state.js';
import type { FilterStateManager } from './filter-state.js';
import { createFilterRuleEngine } from './filter-rules.js';
import type { FilterRuleEngine } from './filter-rules.js';
import { createCriteriaOutputManager } from './criteria-output.js';
import type { CriteriaOutputManager, CriteriaSubscriber } from './criteria-output.js';
import { createFilterAdminService, FULL_ADMIN_PERMISSIONS } from './filter-admin.js';
import type { FilterAdminService } from './filter-admin.js';

// --- Criteria Engine Interface ---

export interface CriteriaEngine {
  registry: FilterRegistry;
  bindings: FilterBindingStore;
  stateManager: FilterStateManager;
  ruleEngine: FilterRuleEngine;
  output: CriteriaOutputManager;
  admin: FilterAdminService;

  /** Resolve fields for an artefact (definition + binding merge) */
  resolveFields(artId: ArtefactId): SelectionFieldDef[];

  /** Build ArtefactCriteria from current values */
  buildCriteria(
    artId: ArtefactId,
    values: Record<string, string | string[] | null>,
    externalContext?: RuleEvaluationContext,
  ): ArtefactCriteria;

  /** Subscribe to criteria changes */
  subscribe(listener: CriteriaSubscriber): () => void;
}

// --- Engine Config ---

export interface CriteriaEngineConfig {
  storage?: StateStorageAdapter;
  permissions?: AdminPermissions;
  debounceMs?: number;
}

// --- Factory ---

export function createCriteriaEngine(config?: CriteriaEngineConfig): CriteriaEngine {
  const registry = createFilterRegistry();
  const bindings = createFilterBindingStore();
  const stateManager = createFilterStateManager(config?.storage);
  const ruleEngine = createFilterRuleEngine();
  const output = createCriteriaOutputManager(registry, bindings);
  const admin = createFilterAdminService(
    registry,
    bindings,
    config?.permissions ?? FULL_ADMIN_PERMISSIONS,
  );

  if (config?.debounceMs) {
    output.setDebounceMs(config.debounceMs);
  }

  return {
    registry,
    bindings,
    stateManager,
    ruleEngine,
    output,
    admin,

    resolveFields(artId: ArtefactId): SelectionFieldDef[] {
      return resolveArtefactFields(registry, bindings, artId);
    },

    buildCriteria(
      artId: ArtefactId,
      values: Record<string, string | string[] | null>,
      externalContext?: RuleEvaluationContext,
    ): ArtefactCriteria {
      const artBindings = bindings.getBindingsForArtefact(artId);
      const resolvedLevels: Record<string, StateResolutionLevel> = {};
      const ruleResults: Record<string, { isApplied: boolean; ruleIds: string[] }> = {};

      for (const binding of artBindings) {
        const key = binding.filterDefinitionId as string;
        const def = registry.get(binding.filterDefinitionId);
        if (!def) continue;

        // Resolve state level
        const resolved = resolveFilterValue(binding.filterDefinitionId, {
          definitionDefaults: def.defaultValue !== undefined
            ? { [key]: def.defaultValue }
            : undefined,
          bindingDefaults: binding.defaultValueOverride !== undefined
            ? { [key]: binding.defaultValueOverride }
            : undefined,
        });
        resolvedLevels[key] = resolved.level;

        // Evaluate rules — merge external context with current filter values
        const mergedContext: RuleEvaluationContext = { ...externalContext, ...values };
        const ruleResult = ruleEngine.evaluate(
          binding.filterDefinitionId,
          def.options ?? [],
          def.treeOptions,
          mergedContext,
        );
        ruleResults[key] = {
          isApplied: ruleResult.appliedRuleIds.length > 0,
          ruleIds: ruleResult.appliedRuleIds,
        };
      }

      return output.buildCriteria(artId, values, resolvedLevels, ruleResults);
    },

    subscribe(listener: CriteriaSubscriber): () => void {
      return output.subscribe(listener);
    },
  };
}

// --- Migration from Legacy CriteriaConfig ---

export function migrateFromCriteriaConfig(
  config: CriteriaConfig,
  artId: ArtefactId,
  engineConfig?: CriteriaEngineConfig,
): CriteriaEngine {
  const engine = createCriteriaEngine(engineConfig);
  hydrateCriteriaConfig(engine.registry, engine.bindings, config, artId);
  return engine;
}
