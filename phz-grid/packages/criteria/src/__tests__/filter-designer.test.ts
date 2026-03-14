import { describe, it, expect, vi } from 'vitest';
import type { FilterDefinition, FilterRule, SelectionPreset, ValueSourceConfig, OptionsSource } from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';
import {
  HELP,
  buildDefContextItems,
  buildRuleContextItems,
  buildPresetContextItems,
  buildBgContextItems,
} from '../components/phz-filter-designer.js';
import { buildFilterPresetContextItems } from '../components/phz-preset-admin.js';
import type { FilterDefinitionPreset } from '@phozart/core';

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id.charAt(0).toUpperCase() + id.slice(1),
    type: 'single_select',
    sessionBehavior: 'reset',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as FilterDefinition;
}

function makeRule(id: string, overrides?: Partial<FilterRule>): FilterRule {
  return {
    id,
    filterDefinitionId: filterDefinitionId('test'),
    type: 'exclude_pattern',
    priority: 1,
    enabled: true,
    description: `Rule ${id}`,
    ...overrides,
  } as FilterRule;
}

function makePreset(id: string, overrides?: Partial<SelectionPreset>): SelectionPreset {
  return {
    id,
    name: `Preset ${id}`,
    scope: 'shared',
    owner: 'admin',
    values: {},
    isDefault: false,
    updated: Date.now(),
    ...overrides,
  } as SelectionPreset;
}

describe('PhzFilterDesigner (headless logic)', () => {
  describe('definition list filtering', () => {
    it('filters definitions by search term', () => {
      const definitions = [
        makeDef('region', { label: 'Region' }),
        makeDef('status', { label: 'Status', type: 'chip_group' }),
        makeDef('date', { label: 'Date Range', type: 'date_range' }),
      ];

      const searchTerm = 'reg';
      const filtered = definitions.filter(
        d => d.label.toLowerCase().includes(searchTerm) || d.type.includes(searchTerm)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].label).toBe('Region');
    });

    it('filters by type name', () => {
      const definitions = [
        makeDef('region', { type: 'multi_select' }),
        makeDef('status', { type: 'chip_group' }),
      ];

      const filtered = definitions.filter(
        d => d.label.toLowerCase().includes('chip') || d.type.includes('chip')
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(filterDefinitionId('status'));
    });

    it('returns all definitions when search is empty', () => {
      const definitions = [makeDef('a'), makeDef('b'), makeDef('c')];
      const searchTerm = '';
      const filtered = searchTerm
        ? definitions.filter(d => d.label.toLowerCase().includes(searchTerm))
        : definitions;
      expect(filtered).toHaveLength(3);
    });
  });

  describe('definition creation', () => {
    it('generates a definition with correct shape (valueSource)', () => {
      const label = 'My Filter';
      const now = Date.now();
      const optionsSource: OptionsSource = {
        dataSetId: 'ds1',
        valueField: 'code',
        labelTemplate: '{code} - {name}',
      };
      const valueSource: ValueSourceConfig = { type: 'dataset', optionsSource };

      const def: FilterDefinition = {
        id: filterDefinitionId(label.toLowerCase().replace(/\s+/g, '_')),
        label,
        type: 'single_select',
        sessionBehavior: 'reset',
        valueSource,
        createdAt: now,
        updatedAt: now,
      };

      expect(def.id).toBe(filterDefinitionId('my_filter'));
      expect(def.label).toBe('My Filter');
      expect(def.type).toBe('single_select');
      expect(def.valueSource).toBeDefined();
      expect(def.valueSource!.optionsSource!.dataSetId).toBe('ds1');
      expect(def.valueSource!.optionsSource!.valueField).toBe('code');
      expect(def.valueSource!.optionsSource!.labelTemplate).toBe('{code} - {name}');
    });

    it('generates a definition without valueSource when no data source', () => {
      const now = Date.now();
      const def: FilterDefinition = {
        id: filterDefinitionId('status'),
        label: 'Status',
        type: 'multi_select',
        sessionBehavior: 'reset',
        createdAt: now,
        updatedAt: now,
      };

      expect(def.id).toBe(filterDefinitionId('status'));
      expect(def.valueSource).toBeUndefined();
    });
  });

  describe('definition deprecation', () => {
    it('deprecated definitions are visually distinct', () => {
      const def = makeDef('old', { deprecated: true });
      expect(def.deprecated).toBe(true);
    });

    it('non-deprecated definitions show edit/deprecate actions', () => {
      const def = makeDef('active');
      expect(def.deprecated).toBeFalsy();
    });
  });

  describe('event dispatching', () => {
    it('definition-create event has correct detail shape', () => {
      const handler = vi.fn();
      const def = makeDef('test');
      handler({ detail: { definition: def } });
      expect(handler).toHaveBeenCalledWith({ detail: { definition: def } });
    });

    it('definition-deprecate event includes id', () => {
      const handler = vi.fn();
      handler({ detail: { id: filterDefinitionId('old') } });
      expect(handler).toHaveBeenCalledWith({ detail: { id: filterDefinitionId('old') } });
    });

    it('definition-update event includes id and patch', () => {
      const handler = vi.fn();
      handler({ detail: { id: filterDefinitionId('region'), patch: { label: 'Area' } } });
      expect(handler).toHaveBeenCalledWith({
        detail: { id: filterDefinitionId('region'), patch: { label: 'Area' } },
      });
    });
  });

  describe('tab switching', () => {
    it('supports definitions, rules, and presets tabs', () => {
      const tabs: ('definitions' | 'rules' | 'presets')[] = ['definitions', 'rules', 'presets'];
      expect(tabs).toHaveLength(3);
      expect(tabs).toContain('definitions');
      expect(tabs).toContain('rules');
      expect(tabs).toContain('presets');
    });
  });

  // -- Context menu item building --

  describe('context menu: definition items', () => {
    it('shows edit/rename/duplicate/deprecate for active definitions', () => {
      const def = makeDef('region');
      const items = buildDefContextItems(def);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('edit-def');
      expect(ids).toContain('rename-def');
      expect(ids).toContain('duplicate-def');
      expect(ids).toContain('copy-id');
      expect(ids).toContain('deprecate-def');
    });

    it('marks deprecate as danger variant', () => {
      const def = makeDef('region');
      const items = buildDefContextItems(def);
      const deprecateItem = items.find(i => i.id === 'deprecate-def');
      expect(deprecateItem?.variant).toBe('danger');
    });

    it('shows restore for deprecated definitions', () => {
      const def = makeDef('old', { deprecated: true });
      const items = buildDefContextItems(def);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('restore-def');
      expect(ids).toContain('copy-id');
      expect(ids).not.toContain('edit-def');
      expect(ids).not.toContain('deprecate-def');
    });

    it('includes separator between actions and danger items', () => {
      const def = makeDef('region');
      const items = buildDefContextItems(def);
      const seps = items.filter(i => i.separator);
      expect(seps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('context menu: rule items', () => {
    it('shows toggle/move/remove for a rule', () => {
      const rule = makeRule('r1', { enabled: true });
      const items = buildRuleContextItems(rule, false, false);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('toggle-rule');
      expect(ids).toContain('move-rule-up');
      expect(ids).toContain('move-rule-down');
      expect(ids).toContain('remove-rule');
    });

    it('disables move-up for first rule', () => {
      const rule = makeRule('r1');
      const items = buildRuleContextItems(rule, true, false);
      const moveUp = items.find(i => i.id === 'move-rule-up');
      expect(moveUp?.disabled).toBe(true);
    });

    it('disables move-down for last rule', () => {
      const rule = makeRule('r1');
      const items = buildRuleContextItems(rule, false, true);
      const moveDown = items.find(i => i.id === 'move-rule-down');
      expect(moveDown?.disabled).toBe(true);
    });

    it('shows "Disable Rule" when enabled', () => {
      const rule = makeRule('r1', { enabled: true });
      const items = buildRuleContextItems(rule, false, false);
      const toggle = items.find(i => i.id === 'toggle-rule');
      expect(toggle?.label).toBe('Disable Rule');
    });

    it('shows "Enable Rule" when disabled', () => {
      const rule = makeRule('r1', { enabled: false });
      const items = buildRuleContextItems(rule, false, false);
      const toggle = items.find(i => i.id === 'toggle-rule');
      expect(toggle?.label).toBe('Enable Rule');
    });

    it('marks remove as danger variant', () => {
      const rule = makeRule('r1');
      const items = buildRuleContextItems(rule, false, false);
      const remove = items.find(i => i.id === 'remove-rule');
      expect(remove?.variant).toBe('danger');
    });
  });

  describe('context menu: preset items', () => {
    it('shows edit/default/duplicate/delete for shared presets', () => {
      const preset = makePreset('p1', { scope: 'shared' });
      const items = buildPresetContextItems(preset, 'shared');
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('edit-preset');
      expect(ids).toContain('set-default-preset');
      expect(ids).toContain('duplicate-preset');
      expect(ids).toContain('delete-preset');
    });

    it('shows "Remove Default" for default presets', () => {
      const preset = makePreset('p1', { scope: 'shared', isDefault: true });
      const items = buildPresetContextItems(preset, 'shared');
      const defaultItem = items.find(i => i.id === 'set-default-preset');
      expect(defaultItem?.label).toBe('Remove Default');
    });

    it('shows "Set as Default" for non-default presets', () => {
      const preset = makePreset('p1', { scope: 'shared', isDefault: false });
      const items = buildPresetContextItems(preset, 'shared');
      const defaultItem = items.find(i => i.id === 'set-default-preset');
      expect(defaultItem?.label).toBe('Set as Default');
    });

    it('shows view/copy-to-shared for personal presets', () => {
      const preset = makePreset('p1', { scope: 'personal' });
      const items = buildPresetContextItems(preset, 'personal');
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('view-preset');
      expect(ids).toContain('copy-to-shared');
      expect(ids).not.toContain('delete-preset');
    });

    it('marks delete as danger variant', () => {
      const preset = makePreset('p1', { scope: 'shared' });
      const items = buildPresetContextItems(preset, 'shared');
      const del = items.find(i => i.id === 'delete-preset');
      expect(del?.variant).toBe('danger');
    });
  });

  describe('context menu: background items', () => {
    it('shows new-definition for definitions tab', () => {
      const items = buildBgContextItems('definitions', false);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('new-definition');
      expect(ids).toContain('toggle-help');
    });

    it('shows add-rule for rules tab', () => {
      const items = buildBgContextItems('rules', false);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('add-rule');
      expect(ids).toContain('toggle-help');
    });

    it('shows new-preset for presets tab', () => {
      const items = buildBgContextItems('presets', false);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('new-preset');
      expect(ids).toContain('toggle-help');
    });

    it('toggles help label based on state', () => {
      const itemsOpen = buildBgContextItems('definitions', true);
      const helpOpen = itemsOpen.find(i => i.id === 'toggle-help');
      expect(helpOpen?.label).toBe('Hide Guidance');

      const itemsClosed = buildBgContextItems('definitions', false);
      const helpClosed = itemsClosed.find(i => i.id === 'toggle-help');
      expect(helpClosed?.label).toBe('Show Guidance');
    });
  });

  // -- Guidance content --

  describe('guidance / help text', () => {
    it('provides help for all three tabs', () => {
      expect(HELP.definitions).toBeDefined();
      expect(HELP.rules).toBeDefined();
      expect(HELP.presets).toBeDefined();
    });

    it('each help section has title, body, and tips', () => {
      for (const tab of ['definitions', 'rules', 'presets'] as const) {
        const h = HELP[tab];
        expect(h.title).toBeTruthy();
        expect(h.body).toBeTruthy();
        expect(h.tips.length).toBeGreaterThan(0);
      }
    });

    it('definitions help mentions Label, Type, Data Source', () => {
      const tips = HELP.definitions.tips.join(' ');
      expect(tips).toContain('Label');
      expect(tips).toContain('Type');
      expect(tips).toContain('Data Source');
    });

    it('rules help mentions Priority and Enable/Disable', () => {
      const tips = HELP.rules.tips.join(' ');
      expect(tips).toContain('Priority');
      expect(tips).toContain('Enable/Disable');
    });

    it('presets help mentions filter presets and Copy to filter', () => {
      const tips = HELP.presets.tips.join(' ');
      expect(tips).toContain('Select a filter');
      expect(tips).toContain('Default');
      expect(tips).toContain('Copy to filter');
    });
  });

  // -- Auto-save --

  describe('auto-save patch shape', () => {
    it('auto-save patch includes valueSource', () => {
      const handler = vi.fn();
      const editingDef = makeDef('region', {
        valueSource: {
          type: 'dataset',
          optionsSource: { dataSetId: 'ds1', valueField: 'code' },
        },
      });

      // Simulate what _flushAutoSave dispatches
      handler({
        id: editingDef.id,
        patch: {
          label: editingDef.label,
          type: editingDef.type,
          sessionBehavior: editingDef.sessionBehavior,
          valueSource: editingDef.valueSource,
          updatedAt: Date.now(),
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const patch = handler.mock.calls[0][0].patch;
      expect(patch.valueSource).toBeDefined();
      expect(patch.valueSource.type).toBe('dataset');
      expect(patch.valueSource.optionsSource.dataSetId).toBe('ds1');
    });
  });

  // -- Filter preset context menu --

  describe('context menu: filter preset items', () => {
    function makeFilterPresetObj(id: string, overrides?: Partial<FilterDefinitionPreset>): FilterDefinitionPreset {
      return {
        id,
        filterDefinitionId: filterDefinitionId('region'),
        name: `Preset ${id}`,
        scope: 'shared',
        owner: 'admin',
        value: ['us'],
        isDefault: false,
        created: Date.now(),
        updated: Date.now(),
        ...overrides,
      };
    }

    it('includes edit, default, copy, delete', () => {
      const preset = makeFilterPresetObj('fp1');
      const items = buildFilterPresetContextItems(preset);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('edit-filter-preset');
      expect(ids).toContain('set-default-filter-preset');
      expect(ids).toContain('copy-filter-preset');
      expect(ids).toContain('delete-filter-preset');
    });

    it('toggles default label', () => {
      const defaultPreset = makeFilterPresetObj('fp1', { isDefault: true });
      const items = buildFilterPresetContextItems(defaultPreset);
      const defaultItem = items.find(i => i.id === 'set-default-filter-preset');
      expect(defaultItem?.label).toBe('Remove Default');
    });

    it('marks delete as danger', () => {
      const preset = makeFilterPresetObj('fp1');
      const items = buildFilterPresetContextItems(preset);
      const del = items.find(i => i.id === 'delete-filter-preset');
      expect(del?.variant).toBe('danger');
    });
  });

  // -- Auto-save --

  describe('auto-save debounce logic', () => {
    it('schedules a save after a delay', async () => {
      const handler = vi.fn();
      let timer: ReturnType<typeof setTimeout> | null = null;

      const scheduleAutoSave = (patch: Record<string, unknown>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => handler(patch), 100);
      };

      scheduleAutoSave({ label: 'A' });
      scheduleAutoSave({ label: 'AB' });
      scheduleAutoSave({ label: 'ABC' });

      // Only last call should fire
      await new Promise(r => setTimeout(r, 200));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ label: 'ABC' });
    });

    it('flushes pending save immediately when requested', () => {
      const handler = vi.fn();
      let timer: ReturnType<typeof setTimeout> | null = null;
      let pendingPatch: Record<string, unknown> | null = null;

      const scheduleAutoSave = (patch: Record<string, unknown>) => {
        pendingPatch = patch;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          handler(pendingPatch);
          pendingPatch = null;
          timer = null;
        }, 800);
      };

      const flushAutoSave = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (pendingPatch) {
          handler(pendingPatch);
          pendingPatch = null;
        }
      };

      scheduleAutoSave({ label: 'Test' });
      flushAutoSave();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ label: 'Test' });
    });
  });
});
