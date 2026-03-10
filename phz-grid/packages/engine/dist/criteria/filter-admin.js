/**
 * @phozart/phz-engine — Filter Admin Service
 *
 * Administrative operations for filter definitions and bindings,
 * with permission checks, immutability enforcement, and audit logging.
 */
// --- Factory ---
export function createFilterAdminService(registry, bindingStore, permissions) {
    const auditLog = [];
    const filterPresets = new Map();
    let auditSeq = 0;
    let presetSeq = 0;
    function addAudit(userId, action, entityType, entityId, details) {
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
    function requirePermission(perm, action) {
        if (!permissions[perm]) {
            throw new Error(`Permission denied: ${action} requires ${perm}`);
        }
    }
    return {
        createDefinition(def, userId) {
            requirePermission('canCreateDefinitions', 'create definition');
            registry.register(def);
            addAudit(userId, 'create', 'definition', def.id, { label: def.label, type: def.type });
        },
        updateDefinition(id, patch, userId) {
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
            addAudit(userId, 'update', 'definition', id, patch);
        },
        deprecateDefinition(id, userId) {
            requirePermission('canDeprecateDefinitions', 'deprecate definition');
            registry.deprecate(id);
            addAudit(userId, 'deprecate', 'definition', id);
        },
        bindToArtefact(binding, userId) {
            requirePermission('canManageBindings', 'bind to artefact');
            bindingStore.bind(binding);
            addAudit(userId, 'bind', 'binding', `${binding.filterDefinitionId}:${binding.artefactId}`, { order: binding.order });
        },
        unbindFromArtefact(filterDefId, artId, userId) {
            requirePermission('canManageBindings', 'unbind from artefact');
            bindingStore.unbind(filterDefId, artId);
            addAudit(userId, 'unbind', 'binding', `${filterDefId}:${artId}`);
        },
        getAuditLog(entityId) {
            if (entityId) {
                return auditLog.filter(e => e.entityId === entityId || e.entityId.startsWith(entityId + ':'));
            }
            return [...auditLog];
        },
        checkPermission(action) {
            return !!permissions[action];
        },
        createFilterPreset(preset, userId) {
            requirePermission('canManagePresets', 'create filter preset');
            filterPresets.set(preset.id, { ...preset });
            addAudit(userId, 'create', 'preset', preset.id, { name: preset.name, filterDefinitionId: preset.filterDefinitionId });
        },
        updateFilterPreset(presetId, patch, userId) {
            requirePermission('canManagePresets', 'update filter preset');
            const existing = filterPresets.get(presetId);
            if (!existing)
                throw new Error(`Filter preset "${presetId}" not found`);
            filterPresets.set(presetId, { ...existing, ...patch, id: existing.id, filterDefinitionId: existing.filterDefinitionId, created: existing.created, updated: Date.now() });
            addAudit(userId, 'update', 'preset', presetId, patch);
        },
        deleteFilterPreset(presetId, userId) {
            requirePermission('canManagePresets', 'delete filter preset');
            if (!filterPresets.has(presetId))
                throw new Error(`Filter preset "${presetId}" not found`);
            filterPresets.delete(presetId);
            addAudit(userId, 'delete', 'preset', presetId);
        },
        copyFilterPreset(sourcePresetId, targetDefId, userId) {
            requirePermission('canManagePresets', 'copy filter preset');
            const source = filterPresets.get(sourcePresetId);
            if (!source)
                throw new Error(`Filter preset "${sourcePresetId}" not found`);
            const now = Date.now();
            const newPreset = {
                ...source,
                id: `fp-copy-${++presetSeq}-${now}`,
                filterDefinitionId: targetDefId,
                name: `${source.name} (Copy)`,
                isDefault: false,
                created: now,
                updated: now,
            };
            filterPresets.set(newPreset.id, newPreset);
            addAudit(userId, 'create', 'preset', newPreset.id, { copiedFrom: sourcePresetId, targetFilterDefinitionId: targetDefId });
            return { ...newPreset };
        },
    };
}
// --- Default Permissions ---
export const FULL_ADMIN_PERMISSIONS = {
    canCreateDefinitions: true,
    canEditDefinitions: true,
    canDeprecateDefinitions: true,
    canManageBindings: true,
    canManagePresets: true,
    canManageRules: true,
    canViewAuditLog: true,
    canViewUserPresets: true,
};
export const READONLY_PERMISSIONS = {
    canCreateDefinitions: false,
    canEditDefinitions: false,
    canDeprecateDefinitions: false,
    canManageBindings: false,
    canManagePresets: false,
    canManageRules: false,
    canViewAuditLog: true,
    canViewUserPresets: true,
};
//# sourceMappingURL=filter-admin.js.map