/**
 * @phozart/engine — Criteria Engine Facade
 *
 * Unified factory that wires all criteria engine layers together:
 * Registry → Bindings → State → Rules → Output → Admin
 */
import type { ArtefactId, CriteriaConfig, StateStorageAdapter, AdminPermissions, SelectionFieldDef, ArtefactCriteria, RuleEvaluationContext } from '@phozart/core';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';
import type { FilterStateManager } from './filter-state.js';
import type { FilterRuleEngine } from './filter-rules.js';
import type { CriteriaOutputManager, CriteriaSubscriber } from './criteria-output.js';
import type { FilterAdminService } from './filter-admin.js';
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
    buildCriteria(artId: ArtefactId, values: Record<string, string | string[] | null>, externalContext?: RuleEvaluationContext): ArtefactCriteria;
    /** Subscribe to criteria changes */
    subscribe(listener: CriteriaSubscriber): () => void;
}
export interface CriteriaEngineConfig {
    storage?: StateStorageAdapter;
    permissions?: AdminPermissions;
    debounceMs?: number;
}
export declare function createCriteriaEngine(config?: CriteriaEngineConfig): CriteriaEngine;
export declare function migrateFromCriteriaConfig(config: CriteriaConfig, artId: ArtefactId, engineConfig?: CriteriaEngineConfig): CriteriaEngine;
//# sourceMappingURL=criteria-engine.d.ts.map