/**
 * @phozart/phz-engine — Filter Admin Service
 *
 * Administrative operations for filter definitions and bindings,
 * with permission checks, immutability enforcement, and audit logging.
 */
import type { FilterDefinition, FilterDefinitionId, FilterBinding, ArtefactId, AdminPermissions, AuditLogEntry, FilterDefinitionPreset } from '@phozart/phz-core';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';
export interface FilterAdminService {
    createDefinition(def: FilterDefinition, userId: string): void;
    updateDefinition(id: FilterDefinitionId, patch: Partial<Omit<FilterDefinition, 'id' | 'createdAt'>>, userId: string): void;
    deprecateDefinition(id: FilterDefinitionId, userId: string): void;
    bindToArtefact(binding: FilterBinding, userId: string): void;
    unbindFromArtefact(filterDefId: FilterDefinitionId, artId: ArtefactId, userId: string): void;
    getAuditLog(entityId?: string): AuditLogEntry[];
    checkPermission(action: keyof AdminPermissions): boolean;
    createFilterPreset(preset: FilterDefinitionPreset, userId: string): void;
    updateFilterPreset(presetId: string, patch: Partial<Omit<FilterDefinitionPreset, 'id' | 'filterDefinitionId' | 'created'>>, userId: string): void;
    deleteFilterPreset(presetId: string, userId: string): void;
    copyFilterPreset(sourcePresetId: string, targetDefId: FilterDefinitionId, userId: string): FilterDefinitionPreset;
}
export declare function createFilterAdminService(registry: FilterRegistry, bindingStore: FilterBindingStore, permissions: AdminPermissions): FilterAdminService;
export declare const FULL_ADMIN_PERMISSIONS: AdminPermissions;
export declare const READONLY_PERMISSIONS: AdminPermissions;
//# sourceMappingURL=filter-admin.d.ts.map