/**
 * TDD RED — Unified GridPresentation config (Item 6.5)
 *
 * Tests for:
 * - GridPresentation type (table settings, column formatting, theme)
 * - SavedView capturing presentation alongside state
 * - ViewsManager round-trip with presentation
 * - GridConfig accepting presentation
 */
import { describe, it, expect, vi } from 'vitest';
import { ViewsManager } from '../views.js';
import type { SavedView } from '../types/views.js';
import type { SerializedGridState } from '../types/state.js';
import type { GridPresentation } from '../types/grid-presentation.js';
import { mergePresentation, createDefaultPresentation } from '../grid-presentation.js';

const baseState: SerializedGridState = {
  version: '0.1.0',
  sort: { columns: [] },
  filter: { filters: [], presets: {} },
  selection: { selectedRows: [], selectedCells: [] },
  columns: { order: ['name', 'age'], widths: { name: 150, age: 100 }, visibility: { name: true, age: true } },
  grouping: { groupBy: [], expandedGroups: [] },
};

// --- GridPresentation type ---

describe('GridPresentation type', () => {
  it('createDefaultPresentation returns sensible defaults', () => {
    const p = createDefaultPresentation();
    expect(p.density).toBe('comfortable');
    expect(p.colorScheme).toBe('auto');
    expect(p.gridLines).toBe(true);
    expect(p.rowBanding).toBe(false);
    expect(p.columnFormatting).toEqual({});
    expect(p.tokens).toEqual({});
  });

  it('mergePresentation deep-merges two presentations', () => {
    const base = createDefaultPresentation();
    const override: Partial<GridPresentation> = {
      density: 'compact',
      columnFormatting: { age: { align: 'right' } },
      tokens: { '--phz-bg': '#222' },
    };
    const merged = mergePresentation(base, override);
    expect(merged.density).toBe('compact');
    expect(merged.colorScheme).toBe('auto'); // from base
    expect(merged.columnFormatting).toEqual({ age: { align: 'right' } });
    expect(merged.tokens).toEqual({ '--phz-bg': '#222' });
  });

  it('mergePresentation does not mutate inputs', () => {
    const base = createDefaultPresentation();
    const override: Partial<GridPresentation> = { density: 'compact' };
    mergePresentation(base, override);
    expect(base.density).toBe('comfortable');
  });
});

// --- SavedView with presentation ---

describe('ViewsManager with presentation', () => {
  it('saveView captures presentation alongside state', () => {
    const vm = new ViewsManager();
    const pres: GridPresentation = {
      ...createDefaultPresentation(),
      density: 'compact',
    };
    const view = vm.saveView('My View', baseState, { presentation: pres });
    expect(view.presentation).toBeDefined();
    expect(view.presentation!.density).toBe('compact');
  });

  it('loadView returns presentation when saved', () => {
    const vm = new ViewsManager();
    const pres: GridPresentation = {
      ...createDefaultPresentation(),
      density: 'compact',
    };
    const view = vm.saveView('Compact View', baseState, { presentation: pres });
    const loaded = vm.loadView(view.id);
    expect(loaded.presentation).toBeDefined();
    expect(loaded.presentation!.density).toBe('compact');
  });

  it('loadView works without presentation (backward compat)', () => {
    const vm = new ViewsManager();
    const view = vm.saveView('No Pres', baseState);
    const loaded = vm.loadView(view.id);
    expect(loaded.presentation).toBeUndefined();
  });

  it('saveCurrentToView updates presentation', () => {
    const vm = new ViewsManager();
    const view = vm.saveView('V1', baseState);

    const newPres: GridPresentation = {
      ...createDefaultPresentation(),
      density: 'spacious',
    };
    const updated = vm.saveCurrentToView(view.id, baseState, { presentation: newPres });
    expect(updated.presentation!.density).toBe('spacious');
  });

  it('isViewDirty detects presentation changes', () => {
    const vm = new ViewsManager();
    const pres = createDefaultPresentation();
    const view = vm.saveView('V1', baseState, { presentation: pres });

    // Same state, same presentation → not dirty
    expect(vm.isViewDirty(baseState, pres)).toBe(false);

    // Changed presentation → dirty
    const changed = { ...pres, density: 'compact' as const };
    expect(vm.isViewDirty(baseState, changed)).toBe(true);
  });

  it('importViews/exportViews preserves presentation', () => {
    const vm = new ViewsManager();
    const pres: GridPresentation = { ...createDefaultPresentation(), density: 'compact' };
    vm.saveView('V1', baseState, { presentation: pres });

    const exported = vm.exportViews();
    expect(exported[0].presentation).toBeDefined();

    const vm2 = new ViewsManager();
    vm2.importViews(exported);
    const views = vm2.listViews();
    expect(views).toHaveLength(1);

    const loaded = vm2.loadView(exported[0].id);
    expect(loaded.presentation!.density).toBe('compact');
  });
});
