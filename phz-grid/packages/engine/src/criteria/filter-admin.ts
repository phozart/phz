/**
 * @phozart/phz-engine — Filter Admin Service
 *
 * Administrative operations for filter definitions and bindings,
 * with permission checks, immutability enforcement, and audit logging.
 */

import type {
  FilterDefinition, FilterDefinitionId, FilterBinding, ArtefactId,
  AdminPermissions, AuditLogEntry, AuditAction,
  SelectionFieldType, SessionBehavior,
  FilterDefinitionPreset,
} from '@phozart/phz-core';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';

// --- Admin Service Interface ---

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

// --- Factory ---

export function createFilterAdminService(
  registry: FilterRegistry,
  bindingStore: FilterBindingStore,
  permissions: AdminPermissions,
): FilterAdminService {
  const auditLog: AuditLogEntry[] = [];
  const filterPresets = new Map<string, FilterDefinitionPreset>();
  let auditSeq = 0;
  let presetSeq = 0;

  function addAudit(userId: string, action: AuditAction, entityType: AuditLogEntry['entityType'], entityId: string, details?: Record<string, unknown>): void {
    auditLog.push({
      id: `audit-${++auditSeq}`,
      timestamp: Date.now(),
      userId,
      action,
      entityType,
      entityId,
      details,
    });
  }

  function requirePermission(perm: keyof AdminPermissions, action: string): void {
    if (!permissions[perm]) {
      throw new Error(`Permission denied: ${action} requires ${perm}`);
    }
  }

  return {
    createDefinition(def: FilterDefinition, userId: string): void {
      requirePermission('canCreateDefinitions', 'create definition');
      registry.register(def);
      addAudit(userId, 'create', 'definition', def.id as string, { label: def.label, type: def.type });
    },

    updateDefinition(id: FilterDefinitionId, patch: Partial<Omit<FilterDefinition, 'id' | 'createdAt'>>, userId: string): void {
      requirePermission('canEditDefinitions', 'update definition');

      // Immutability enforcement: type and sessionBehavior locked if has bindings
      if (bindingStore.hasBindings(id)) {
        if (patch.type !== undefined) {
          const existing = registry.get(id);
          if (existing && patch.type !== existing.type) {
            throw new Error(`Cannot change type of definition "${id}" — it has active bindings`);
          }
        }
        if (patch.sessionBehavior !== undefined) {
          const existing = registry.get(id);
          if (existing && patch.sessionBehavior !== existing.sessionBehavior) {
            throw new Error(`Cannot change sessionBehavior of definition "${id}" — it has active bindings`);
          }
        }
      }

      registry.update(id, patch);
      addAudit(userId, 'update', 'definition', id as string, patch as Record<string, unknown>);
    },

    deprecateDefinition(id: FilterDefinitionId, userId: string): void {
      requirePermission('canDeprecateDefinitions', 'deprecate definition');
      registry.deprecate(id);
      addAudit(userId, 'deprecate', 'definition', id as string);
    },

    bindToArtefact(binding: FilterBinding, userId: string): void {
      requirePermission('canManageBindings', 'bind to artefact');
      bindingStore.bind(binding);
      addAudit(userId, 'bind', 'binding', `${binding.filterDefinitionId}:${binding.artefactId}`, { order: binding.order });
    },

    unbindFromArtefact(filterDefId: FilterDefinitionId, artId: ArtefactId, userId: string): void {
      requirePermission('canManageBindings', 'unbind from artefact');
      bindingStore.unbind(filterDefId, artId);
      addAudit(userId, 'unbind', 'binding', `${filterDefId}:${artId}`);
    },

    getAuditLog(entityId?: string): AuditLogEntry[] {
      if (entityId) {
        return auditLog.filter(e => e.entityId === entityId || e.entityId.startsWith(entityId + ':'));
      }
      return [...auditLog];
    },

    checkPermission(action: keyof AdminPermissions): boolean {
      return !!permissions[action];
    },

    createFilterPreset(preset: FilterDefinitionPreset, userId: string): void {
      requirePermission('canManagePresets', 'create filter preset');
      filterPresets.set(preset.id, { ...preset });
      addAudit(userId, 'create', 'preset', preset.id, { name: preset.name, filterDefinitionId: preset.filterDefinitionId as string });
    },

    updateFilterPreset(presetId: string, patch: Partial<Omit<FilterDefinitionPreset, 'id' | 'filterDefinitionId' | 'created'>>, userId: string): void {
      requirePermission('canManagePresets', 'update filter preset');
      const existing = filterPresets.get(presetId);
      if (!existing) throw new Error(`Filter preset "${presetId}" not found`);
      filterPresets.set(presetId, { ...existing, ...patch, id: existing.id, filterDefinitionId: existing.filterDefinitionId, created: existing.created, updated: Date.now() });
      addAudit(userId, 'update', 'preset', presetId, patch as Record<string, unknown>);
    },

    deleteFilterPreset(presetId: string, userId: string): void {
      requirePermission('canManagePresets', 'delete filter preset');
      if (!filterPresets.has(presetId)) throw new Error(`Filter preset "${presetId}" not found`);
      filterPresets.delete(presetId);
      addAudit(userId, 'delete', 'preset', presetId);
    },

    copyFilterPreset(sourcePresetId: string, targetDefId: FilterDefinitionId, userId: string): FilterDefinitionPreset {
      requirePermission('canManagePresets', 'copy filter preset');
      const source = filterPresets.get(sourcePresetId);
      if (!source) throw new Error(`Filter preset "${sourcePresetId}" not found`);
      const now = Date.now();
      const newPreset: FilterDefinitionPreset = {
        ...source,
        id: `fp-copy-${++presetSeq}-${now}`,
        filterDefinitionId: targetDefId,
        name: `${source.name} (Copy)`,
        isDefault: false,
        created: now,
        updated: now,
      };
      filterPresets.set(newPreset.id, newPreset);
      addAudit(userId, 'create', 'preset', newPreset.id, { copiedFrom: sourcePresetId, targetFilterDefinitionId: targetDefId as string });
      return { ...newPreset };
    },
  };
}

// --- Default Permissions ---

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  canCreateDefinitions: true,
  canEditDefinitions: true,
  canDeprecateDefinitions: true,
  canManageBindings: true,
  canManagePresets: true,
  canManageRules: true,
  canViewAuditLog: true,
  canViewUserPresets: true,
};

export const READONLY_PERMISSIONS: AdminPermissions = {
  canCreateDefinitions: false,
  canEditDefinitions: false,
  canDeprecateDefinitions: false,
  canManageBindings: false,
  canManagePresets: false,
  canManageRules: false,
  canViewAuditLog: true,
  canViewUserPresets: true,
};
