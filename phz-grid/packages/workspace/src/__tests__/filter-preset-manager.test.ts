import { describe, it, expect, vi } from 'vitest';
import {
  createFilterPresetManager,
  type FilterPreset,
} from '../filters/filter-preset-manager.js';
import type { FilterValue } from '../types.js';

function makeFilter(id: string, field: string, value: unknown): FilterValue {
  return { filterId: id, field, operator: 'equals', value, label: `${field}: ${value}` };
}

describe('FilterPresetManager (O.4)', () => {
  describe('createFilterPresetManager', () => {
    it('starts with no presets', () => {
      const manager = createFilterPresetManager();
      expect(manager.list()).toEqual([]);
    });
  });

  describe('save', () => {
    it('saves a named preset from current filters', () => {
      const manager = createFilterPresetManager();
      const filters: FilterValue[] = [
        makeFilter('f1', 'region', 'US'),
        makeFilter('f2', 'status', 'active'),
      ];
      const preset = manager.save('Q4 Default', filters);
      expect(preset.name).toBe('Q4 Default');
      expect(preset.filters).toHaveLength(2);
      expect(typeof preset.id).toBe('string');
    });

    it('generates unique IDs', () => {
      const manager = createFilterPresetManager();
      const p1 = manager.save('A', [makeFilter('f1', 'x', 1)]);
      const p2 = manager.save('B', [makeFilter('f2', 'y', 2)]);
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('list', () => {
    it('returns all saved presets', () => {
      const manager = createFilterPresetManager();
      manager.save('A', [makeFilter('f1', 'x', 1)]);
      manager.save('B', [makeFilter('f2', 'y', 2)]);
      expect(manager.list()).toHaveLength(2);
    });
  });

  describe('load', () => {
    it('returns preset filters by ID', () => {
      const manager = createFilterPresetManager();
      const preset = manager.save('Q4', [
        makeFilter('f1', 'region', 'US'),
      ]);
      const loaded = manager.load(preset.id);
      expect(loaded).toBeDefined();
      expect(loaded!.name).toBe('Q4');
      expect(loaded!.filters).toHaveLength(1);
    });

    it('returns undefined for unknown ID', () => {
      const manager = createFilterPresetManager();
      expect(manager.load('nonexistent')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes a preset', () => {
      const manager = createFilterPresetManager();
      const preset = manager.save('Q4', [makeFilter('f1', 'x', 1)]);
      manager.delete(preset.id);
      expect(manager.list()).toHaveLength(0);
    });

    it('does nothing for unknown ID', () => {
      const manager = createFilterPresetManager();
      manager.save('A', [makeFilter('f1', 'x', 1)]);
      manager.delete('nonexistent');
      expect(manager.list()).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('renames a preset', () => {
      const manager = createFilterPresetManager();
      const preset = manager.save('Old Name', [makeFilter('f1', 'x', 1)]);
      manager.update(preset.id, { name: 'New Name' });
      expect(manager.load(preset.id)?.name).toBe('New Name');
    });

    it('updates filters in a preset', () => {
      const manager = createFilterPresetManager();
      const preset = manager.save('Q4', [makeFilter('f1', 'x', 1)]);
      manager.update(preset.id, {
        filters: [makeFilter('f1', 'x', 1), makeFilter('f2', 'y', 2)],
      });
      expect(manager.load(preset.id)?.filters).toHaveLength(2);
    });
  });

  describe('subscribe', () => {
    it('notifies on save', () => {
      const manager = createFilterPresetManager();
      const listener = vi.fn();
      manager.subscribe(listener);
      manager.save('Q4', [makeFilter('f1', 'x', 1)]);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies on delete', () => {
      const manager = createFilterPresetManager();
      const listener = vi.fn();
      const preset = manager.save('Q4', [makeFilter('f1', 'x', 1)]);
      manager.subscribe(listener);
      manager.delete(preset.id);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('returns unsubscribe function', () => {
      const manager = createFilterPresetManager();
      const listener = vi.fn();
      const unsub = manager.subscribe(listener);
      unsub();
      manager.save('Q4', [makeFilter('f1', 'x', 1)]);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
