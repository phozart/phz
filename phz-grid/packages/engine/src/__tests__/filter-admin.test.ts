import { describe, it, expect } from 'vitest';
import { createFilterAdminService, FULL_ADMIN_PERMISSIONS, READONLY_PERMISSIONS } from '../criteria/filter-admin.js';
import { createFilterRegistry } from '../criteria/filter-registry.js';
import { createFilterBindingStore } from '../criteria/filter-bindings.js';
import type { FilterDefinition, AdminPermissions, FilterDefinitionPreset } from '@phozart/phz-core';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';

const ART_A = artefactId('report-1');

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id,
    type: 'single_select',
    sessionBehavior: 'reset',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as FilterDefinition;
}

function setupAdmin(perms: AdminPermissions = FULL_ADMIN_PERMISSIONS) {
  const registry = createFilterRegistry();
  const bindingStore = createFilterBindingStore();
  const admin = createFilterAdminService(registry, bindingStore, perms);
  return { registry, bindingStore, admin };
}

describe('FilterAdminService', () => {
  describe('createDefinition', () => {
    it('creates a definition and records audit', () => {
      const { registry, admin } = setupAdmin();
      admin.createDefinition(makeDef('region'), 'user-1');
      expect(registry.get(filterDefinitionId('region'))).toBeDefined();
      const log = admin.getAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].action).toBe('create');
      expect(log[0].userId).toBe('user-1');
    });

    it('throws when permission denied', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      expect(() => admin.createDefinition(makeDef('region'), 'user-1')).toThrow('Permission denied');
    });
  });

  describe('updateDefinition', () => {
    it('updates a definition and records audit', () => {
      const { registry, admin } = setupAdmin();
      admin.createDefinition(makeDef('region', { label: 'Region' }), 'user-1');
      admin.updateDefinition(filterDefinitionId('region'), { label: 'Area' }, 'user-1');
      expect(registry.get(filterDefinitionId('region'))!.label).toBe('Area');
      expect(admin.getAuditLog()).toHaveLength(2);
    });

    it('throws when permission denied', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      expect(() => admin.updateDefinition(filterDefinitionId('x'), { label: 'y' }, 'u')).toThrow('Permission denied');
    });
  });

  describe('immutability checks', () => {
    it('blocks type change when bindings exist', () => {
      const { admin } = setupAdmin();
      admin.createDefinition(makeDef('region', { type: 'single_select' }), 'user-1');
      admin.bindToArtefact({
        filterDefinitionId: filterDefinitionId('region'),
        artefactId: ART_A,
        visible: true,
        order: 0,
      }, 'user-1');

      expect(() => {
        admin.updateDefinition(filterDefinitionId('region'), { type: 'multi_select' }, 'user-1');
      }).toThrow('Cannot change type');
    });

    it('blocks sessionBehavior change when bindings exist', () => {
      const { admin } = setupAdmin();
      admin.createDefinition(makeDef('region', { sessionBehavior: 'reset' }), 'user-1');
      admin.bindToArtefact({
        filterDefinitionId: filterDefinitionId('region'),
        artefactId: ART_A,
        visible: true,
        order: 0,
      }, 'user-1');

      expect(() => {
        admin.updateDefinition(filterDefinitionId('region'), { sessionBehavior: 'persist' }, 'user-1');
      }).toThrow('Cannot change sessionBehavior');
    });

    it('allows same type when bindings exist', () => {
      const { admin } = setupAdmin();
      admin.createDefinition(makeDef('region', { type: 'single_select' }), 'user-1');
      admin.bindToArtefact({
        filterDefinitionId: filterDefinitionId('region'),
        artefactId: ART_A,
        visible: true,
        order: 0,
      }, 'user-1');

      // Should not throw — same type
      admin.updateDefinition(filterDefinitionId('region'), { type: 'single_select', label: 'New' }, 'user-1');
    });

    it('allows type change when no bindings', () => {
      const { admin, registry } = setupAdmin();
      admin.createDefinition(makeDef('region', { type: 'single_select' }), 'user-1');
      admin.updateDefinition(filterDefinitionId('region'), { type: 'multi_select' }, 'user-1');
      expect(registry.get(filterDefinitionId('region'))!.type).toBe('multi_select');
    });
  });

  describe('deprecateDefinition', () => {
    it('deprecates and records audit', () => {
      const { registry, admin } = setupAdmin();
      admin.createDefinition(makeDef('old'), 'user-1');
      admin.deprecateDefinition(filterDefinitionId('old'), 'user-1');
      expect(registry.get(filterDefinitionId('old'))!.deprecated).toBe(true);
      expect(admin.getAuditLog().pop()!.action).toBe('deprecate');
    });
  });

  describe('bind / unbind', () => {
    it('binds and records audit', () => {
      const { bindingStore, admin } = setupAdmin();
      admin.createDefinition(makeDef('region'), 'user-1');
      admin.bindToArtefact({
        filterDefinitionId: filterDefinitionId('region'),
        artefactId: ART_A,
        visible: true,
        order: 0,
      }, 'user-1');
      expect(bindingStore.getBindingsForArtefact(ART_A)).toHaveLength(1);
      expect(admin.getAuditLog().pop()!.action).toBe('bind');
    });

    it('unbinds and records audit', () => {
      const { bindingStore, admin } = setupAdmin();
      admin.createDefinition(makeDef('region'), 'user-1');
      admin.bindToArtefact({
        filterDefinitionId: filterDefinitionId('region'),
        artefactId: ART_A,
        visible: true,
        order: 0,
      }, 'user-1');
      admin.unbindFromArtefact(filterDefinitionId('region'), ART_A, 'user-1');
      expect(bindingStore.getBindingsForArtefact(ART_A)).toHaveLength(0);
      expect(admin.getAuditLog().pop()!.action).toBe('unbind');
    });

    it('throws when permission denied', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      expect(() => admin.bindToArtefact({
        filterDefinitionId: filterDefinitionId('x'),
        artefactId: ART_A,
        visible: true,
        order: 0,
      }, 'u')).toThrow('Permission denied');
    });
  });

  describe('getAuditLog', () => {
    it('returns full log without filter', () => {
      const { admin } = setupAdmin();
      admin.createDefinition(makeDef('a'), 'user-1');
      admin.createDefinition(makeDef('b'), 'user-2');
      expect(admin.getAuditLog()).toHaveLength(2);
    });

    it('filters by entityId', () => {
      const { admin } = setupAdmin();
      admin.createDefinition(makeDef('a'), 'user-1');
      admin.createDefinition(makeDef('b'), 'user-1');
      const filtered = admin.getAuditLog('a');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].entityId).toBe('a');
    });
  });

  describe('checkPermission', () => {
    it('returns true for allowed actions', () => {
      const { admin } = setupAdmin(FULL_ADMIN_PERMISSIONS);
      expect(admin.checkPermission('canCreateDefinitions')).toBe(true);
    });

    it('returns false for denied actions', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      expect(admin.checkPermission('canCreateDefinitions')).toBe(false);
    });
  });

  describe('filter preset management', () => {
    function makeFilterPreset(id: string, defId: string, overrides?: Partial<FilterDefinitionPreset>): FilterDefinitionPreset {
      return {
        id,
        filterDefinitionId: filterDefinitionId(defId),
        name: `Preset ${id}`,
        scope: 'shared',
        owner: 'admin',
        value: ['us-east'],
        isDefault: false,
        created: Date.now(),
        updated: Date.now(),
        ...overrides,
      };
    }

    it('creates a filter preset and records audit', () => {
      const { admin } = setupAdmin();
      const preset = makeFilterPreset('fp1', 'region');
      admin.createFilterPreset(preset, 'user-1');
      const log = admin.getAuditLog('fp1');
      expect(log).toHaveLength(1);
      expect(log[0].action).toBe('create');
      expect(log[0].entityType).toBe('preset');
    });

    it('updates a filter preset and records audit', () => {
      const { admin } = setupAdmin();
      admin.createFilterPreset(makeFilterPreset('fp1', 'region'), 'user-1');
      admin.updateFilterPreset('fp1', { name: 'Updated Name' }, 'user-1');
      const log = admin.getAuditLog('fp1');
      expect(log).toHaveLength(2);
      expect(log[1].action).toBe('update');
    });

    it('deletes a filter preset and records audit', () => {
      const { admin } = setupAdmin();
      admin.createFilterPreset(makeFilterPreset('fp1', 'region'), 'user-1');
      admin.deleteFilterPreset('fp1', 'user-1');
      const log = admin.getAuditLog('fp1');
      expect(log).toHaveLength(2);
      expect(log[1].action).toBe('delete');
    });

    it('throws on create when permission denied (READONLY)', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      const preset = makeFilterPreset('fp1', 'region');
      expect(() => admin.createFilterPreset(preset, 'user-1')).toThrow('Permission denied');
    });

    it('throws on update when permission denied (READONLY)', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      expect(() => admin.updateFilterPreset('fp1', { name: 'X' }, 'user-1')).toThrow('Permission denied');
    });

    it('throws on delete when permission denied (READONLY)', () => {
      const { admin } = setupAdmin(READONLY_PERMISSIONS);
      expect(() => admin.deleteFilterPreset('fp1', 'user-1')).toThrow('Permission denied');
    });

    it('copies a preset to a different filter definition', () => {
      const { admin } = setupAdmin();
      admin.createFilterPreset(makeFilterPreset('fp1', 'region', { value: ['us', 'eu'] }), 'user-1');
      const copied = admin.copyFilterPreset('fp1', filterDefinitionId('status'), 'user-1');
      expect(copied.filterDefinitionId).toBe(filterDefinitionId('status'));
      expect(copied.value).toEqual(['us', 'eu']);
      expect(copied.name).toBe('Preset fp1 (Copy)');
      expect(copied.id).not.toBe('fp1');
      expect(copied.isDefault).toBe(false);
    });

    it('copy records audit with source info', () => {
      const { admin } = setupAdmin();
      admin.createFilterPreset(makeFilterPreset('fp1', 'region'), 'user-1');
      admin.copyFilterPreset('fp1', filterDefinitionId('status'), 'user-1');
      const log = admin.getAuditLog();
      const copyEntry = log.find(e => e.details?.copiedFrom === 'fp1');
      expect(copyEntry).toBeDefined();
      expect(copyEntry!.action).toBe('create');
    });

    it('throws when updating nonexistent preset', () => {
      const { admin } = setupAdmin();
      expect(() => admin.updateFilterPreset('nonexistent', { name: 'X' }, 'user-1')).toThrow('not found');
    });

    it('throws when deleting nonexistent preset', () => {
      const { admin } = setupAdmin();
      expect(() => admin.deleteFilterPreset('nonexistent', 'user-1')).toThrow('not found');
    });

    it('throws when copying nonexistent preset', () => {
      const { admin } = setupAdmin();
      expect(() => admin.copyFilterPreset('nonexistent', filterDefinitionId('x'), 'user-1')).toThrow('not found');
    });
  });
});
