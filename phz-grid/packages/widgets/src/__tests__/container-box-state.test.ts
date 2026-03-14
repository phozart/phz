/**
 * @phozart/widgets — Container Box State Tests
 */
import { describe, it, expect } from 'vitest';
import { createDefaultContainerBoxConfig } from '@phozart/shared/types';
import {
  createContainerBoxState,
  createDefaultContainerBoxState,
  toggleContainerCollapse,
  addChildWidget,
  removeChildWidget,
  reorderChildWidget,
  updateContainerConfig,
} from '../container-box-state.js';

describe('createContainerBoxState', () => {
  it('creates state with given config', () => {
    const config = createDefaultContainerBoxConfig({ padding: 24 });
    const state = createContainerBoxState(config);
    expect(state.config.padding).toBe(24);
    expect(state.childWidgetIds).toEqual([]);
    expect(state.collapsed).toBe(false);
  });
});

describe('createDefaultContainerBoxState', () => {
  it('creates state with default config', () => {
    const state = createDefaultContainerBoxState();
    expect(state.config.padding).toBe(16);
    expect(state.config.borderRadius).toBe(8);
    expect(state.collapsed).toBe(false);
  });

  it('applies overrides to default config', () => {
    const state = createDefaultContainerBoxState({ padding: 32 });
    expect(state.config.padding).toBe(32);
    expect(state.config.borderRadius).toBe(8); // default kept
  });
});

describe('toggleContainerCollapse', () => {
  it('toggles from expanded to collapsed', () => {
    const state = createDefaultContainerBoxState();
    expect(state.collapsed).toBe(false);
    const toggled = toggleContainerCollapse(state);
    expect(toggled.collapsed).toBe(true);
  });

  it('toggles from collapsed to expanded', () => {
    const state = createDefaultContainerBoxState();
    const collapsed = toggleContainerCollapse(state);
    const expanded = toggleContainerCollapse(collapsed);
    expect(expanded.collapsed).toBe(false);
  });

  it('returns new state object (immutable)', () => {
    const state = createDefaultContainerBoxState();
    const toggled = toggleContainerCollapse(state);
    expect(toggled).not.toBe(state);
  });
});

describe('addChildWidget', () => {
  it('adds a widget ID to the list', () => {
    const state = createDefaultContainerBoxState();
    const updated = addChildWidget(state, 'w1');
    expect(updated.childWidgetIds).toEqual(['w1']);
  });

  it('appends to existing children', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    expect(state.childWidgetIds).toEqual(['w1', 'w2']);
  });

  it('does not add duplicate widget IDs', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    const same = addChildWidget(state, 'w1');
    expect(same.childWidgetIds).toEqual(['w1']);
    expect(same).toBe(state); // same reference (no-op)
  });
});

describe('removeChildWidget', () => {
  it('removes a widget by ID', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    const updated = removeChildWidget(state, 'w1');
    expect(updated.childWidgetIds).toEqual(['w2']);
  });

  it('is a no-op when widget ID not found', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    const same = removeChildWidget(state, 'w99');
    expect(same).toBe(state);
  });
});

describe('reorderChildWidget', () => {
  it('moves a widget to a new position', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    state = addChildWidget(state, 'w3');

    const reordered = reorderChildWidget(state, 'w3', 0);
    expect(reordered.childWidgetIds).toEqual(['w3', 'w1', 'w2']);
  });

  it('moves a widget to the end', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    state = addChildWidget(state, 'w3');

    const reordered = reorderChildWidget(state, 'w1', 2);
    expect(reordered.childWidgetIds).toEqual(['w2', 'w3', 'w1']);
  });

  it('clamps target index to valid range', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');

    const reordered = reorderChildWidget(state, 'w1', 100);
    expect(reordered.childWidgetIds).toEqual(['w2', 'w1']);
  });

  it('is a no-op if widget not in list', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    const same = reorderChildWidget(state, 'w99', 0);
    expect(same).toBe(state);
  });
});

describe('updateContainerConfig', () => {
  it('updates specific config properties', () => {
    const state = createDefaultContainerBoxState();
    const updated = updateContainerConfig(state, { padding: 32, borderRadius: 16 });
    expect(updated.config.padding).toBe(32);
    expect(updated.config.borderRadius).toBe(16);
    expect(updated.config.background).toBe(state.config.background); // unchanged
  });

  it('returns a new state (immutable)', () => {
    const state = createDefaultContainerBoxState();
    const next = updateContainerConfig(state, { padding: 0 });
    expect(next).not.toBe(state);
    expect(next.config).not.toBe(state.config);
  });

  it('preserves children and collapsed state', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = toggleContainerCollapse(state);
    const next = updateContainerConfig(state, { minHeight: 200 });
    expect(next.childWidgetIds).toEqual(['w1']);
    expect(next.collapsed).toBe(true);
  });

  it('can update all config fields', () => {
    const state = createDefaultContainerBoxState();
    const next = updateContainerConfig(state, {
      background: 'red',
      borderRadius: 0,
      padding: 0,
      shadow: 'none',
      border: 'none',
      minHeight: 0,
      showHeader: false,
      clipOverflow: true,
    });
    expect(next.config.background).toBe('red');
    expect(next.config.borderRadius).toBe(0);
    expect(next.config.showHeader).toBe(false);
    expect(next.config.clipOverflow).toBe(true);
  });
});

// ========================================================================
// Additional edge-case coverage for Wave 2
// ========================================================================

describe('reorderChildWidget — additional edge cases', () => {
  it('clamps negative target index to 0', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    const next = reorderChildWidget(state, 'w2', -5);
    expect(next.childWidgetIds).toEqual(['w2', 'w1']);
  });

  it('handles reorder to same position', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    state = addChildWidget(state, 'w3');
    // w2 is at index 1, move to index 1
    const next = reorderChildWidget(state, 'w2', 1);
    expect(next.childWidgetIds).toEqual(['w1', 'w2', 'w3']);
  });
});

describe('toggleContainerCollapse — additional', () => {
  it('preserves config and children across toggle', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    const next = toggleContainerCollapse(state);
    expect(next.config).toEqual(state.config);
    expect(next.childWidgetIds).toEqual(['w1']);
  });
});

describe('removeChildWidget — additional', () => {
  it('handles removing the last widget', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    const next = removeChildWidget(state, 'w1');
    expect(next.childWidgetIds).toEqual([]);
  });

  it('preserves order of remaining widgets', () => {
    let state = createDefaultContainerBoxState();
    state = addChildWidget(state, 'w1');
    state = addChildWidget(state, 'w2');
    state = addChildWidget(state, 'w3');
    const next = removeChildWidget(state, 'w2');
    expect(next.childWidgetIds).toEqual(['w1', 'w3']);
  });
});

describe('createDefaultContainerBoxState — additional', () => {
  it('works with undefined argument', () => {
    const state = createDefaultContainerBoxState(undefined);
    expect(state.config.padding).toBe(16);
  });

  it('default config has expected CSS variable values', () => {
    const state = createDefaultContainerBoxState();
    expect(state.config.background).toContain('phz-surface');
    expect(state.config.shadow).toContain('phz-shadow');
    expect(state.config.border).toContain('phz-border');
  });
});
