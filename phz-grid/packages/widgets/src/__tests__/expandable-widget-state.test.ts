/**
 * @phozart/widgets — Expandable Widget State Tests
 */
import { describe, it, expect } from 'vitest';
import { createDefaultExpandableConfig } from '@phozart/shared/types';
import {
  createExpandableWidgetState,
  createDefaultExpandableWidgetState,
  toggleExpand,
  setExpanded,
  finishAnimation,
  shouldShowToggle,
  getCollapsedMaxHeight,
} from '../expandable-widget-state.js';

describe('createExpandableWidgetState', () => {
  it('creates state with defaultExpanded=false', () => {
    const config = createDefaultExpandableConfig();
    const state = createExpandableWidgetState(config);
    expect(state.expanded).toBe(false);
    expect(state.animating).toBe(false);
    expect(state.config.expandable).toBe(true);
  });

  it('creates state with defaultExpanded=true', () => {
    const config = createDefaultExpandableConfig({ defaultExpanded: true });
    const state = createExpandableWidgetState(config);
    expect(state.expanded).toBe(true);
  });
});

describe('createDefaultExpandableWidgetState', () => {
  it('uses default config values', () => {
    const state = createDefaultExpandableWidgetState();
    expect(state.config.animationDurationMs).toBe(200);
    expect(state.config.showToggle).toBe(true);
    expect(state.expanded).toBe(false);
  });

  it('applies overrides', () => {
    const state = createDefaultExpandableWidgetState({ animationDurationMs: 500 });
    expect(state.config.animationDurationMs).toBe(500);
  });
});

describe('toggleExpand', () => {
  it('expands a collapsed widget', () => {
    const state = createDefaultExpandableWidgetState();
    const toggled = toggleExpand(state);
    expect(toggled.expanded).toBe(true);
    expect(toggled.animating).toBe(true);
  });

  it('collapses an expanded widget', () => {
    const state = createDefaultExpandableWidgetState({ defaultExpanded: true });
    const toggled = toggleExpand(state);
    expect(toggled.expanded).toBe(false);
    expect(toggled.animating).toBe(true);
  });

  it('is a no-op when widget is not expandable', () => {
    const state = createDefaultExpandableWidgetState({ expandable: false });
    const same = toggleExpand(state);
    expect(same).toBe(state);
  });
});

describe('setExpanded', () => {
  it('sets expanded to true', () => {
    const state = createDefaultExpandableWidgetState();
    const expanded = setExpanded(state, true);
    expect(expanded.expanded).toBe(true);
    expect(expanded.animating).toBe(true);
  });

  it('sets expanded to false', () => {
    const state = createDefaultExpandableWidgetState({ defaultExpanded: true });
    const collapsed = setExpanded(state, false);
    expect(collapsed.expanded).toBe(false);
    expect(collapsed.animating).toBe(true);
  });

  it('is a no-op when already in target state', () => {
    const state = createDefaultExpandableWidgetState();
    const same = setExpanded(state, false);
    expect(same).toBe(state);
  });

  it('is a no-op when not expandable', () => {
    const state = createDefaultExpandableWidgetState({ expandable: false });
    const same = setExpanded(state, true);
    expect(same).toBe(state);
  });
});

describe('finishAnimation', () => {
  it('clears animating flag', () => {
    const state = toggleExpand(createDefaultExpandableWidgetState());
    expect(state.animating).toBe(true);
    const finished = finishAnimation(state);
    expect(finished.animating).toBe(false);
  });

  it('is a no-op when not animating', () => {
    const state = createDefaultExpandableWidgetState();
    expect(state.animating).toBe(false);
    const same = finishAnimation(state);
    expect(same).toBe(state);
  });
});

describe('shouldShowToggle', () => {
  it('returns true when expandable and showToggle are both true', () => {
    const state = createDefaultExpandableWidgetState();
    expect(shouldShowToggle(state)).toBe(true);
  });

  it('returns false when not expandable', () => {
    const state = createDefaultExpandableWidgetState({ expandable: false });
    expect(shouldShowToggle(state)).toBe(false);
  });

  it('returns false when showToggle is false', () => {
    const state = createDefaultExpandableWidgetState({ showToggle: false });
    expect(shouldShowToggle(state)).toBe(false);
  });
});

describe('getCollapsedMaxHeight', () => {
  it('returns undefined when expanded', () => {
    const state = createDefaultExpandableWidgetState({ defaultExpanded: true, collapsedMaxHeight: 200 });
    expect(getCollapsedMaxHeight(state)).toBeUndefined();
  });

  it('returns max height when collapsed and value > 0', () => {
    const state = createDefaultExpandableWidgetState({ collapsedMaxHeight: 200 });
    expect(getCollapsedMaxHeight(state)).toBe(200);
  });

  it('returns undefined when collapsed but value is 0 (auto)', () => {
    const state = createDefaultExpandableWidgetState({ collapsedMaxHeight: 0 });
    expect(getCollapsedMaxHeight(state)).toBeUndefined();
  });

  it('returns height after collapsing an expanded widget', () => {
    let state = createDefaultExpandableWidgetState({
      defaultExpanded: true,
      collapsedMaxHeight: 150,
    });
    state = toggleExpand(state); // collapse it
    expect(getCollapsedMaxHeight(state)).toBe(150);
  });
});

// ========================================================================
// Additional edge-case coverage for Wave 2
// ========================================================================

describe('toggleExpand — additional edge cases', () => {
  it('toggle twice returns to original expanded state', () => {
    const state = createDefaultExpandableWidgetState();
    const toggled = toggleExpand(toggleExpand(state));
    expect(toggled.expanded).toBe(state.expanded);
  });

  it('returns a new state (immutable)', () => {
    const state = createDefaultExpandableWidgetState();
    const next = toggleExpand(state);
    expect(next).not.toBe(state);
  });
});

describe('setExpanded — additional edge cases', () => {
  it('returns a new state when value changes', () => {
    const state = createDefaultExpandableWidgetState();
    const next = setExpanded(state, true);
    expect(next).not.toBe(state);
  });
});

describe('finishAnimation — additional edge cases', () => {
  it('preserves expanded state after finishing', () => {
    const state = toggleExpand(createDefaultExpandableWidgetState());
    const next = finishAnimation(state);
    expect(next.expanded).toBe(true);
  });

  it('returns a new state when transitioning from animating', () => {
    const state = toggleExpand(createDefaultExpandableWidgetState());
    const next = finishAnimation(state);
    expect(next).not.toBe(state);
  });
});

describe('shouldShowToggle — additional', () => {
  it('returns false when both expandable and showToggle are false', () => {
    const state = createDefaultExpandableWidgetState({ expandable: false, showToggle: false });
    expect(shouldShowToggle(state)).toBe(false);
  });
});

describe('expandable widget full lifecycle', () => {
  it('create -> expand -> animate -> collapse -> animate', () => {
    // Step 1: Create
    let state = createDefaultExpandableWidgetState({ collapsedMaxHeight: 100 });
    expect(state.expanded).toBe(false);
    expect(state.animating).toBe(false);
    expect(getCollapsedMaxHeight(state)).toBe(100);

    // Step 2: Expand
    state = toggleExpand(state);
    expect(state.expanded).toBe(true);
    expect(state.animating).toBe(true);
    expect(getCollapsedMaxHeight(state)).toBeUndefined();

    // Step 3: Finish animation
    state = finishAnimation(state);
    expect(state.expanded).toBe(true);
    expect(state.animating).toBe(false);

    // Step 4: Collapse
    state = toggleExpand(state);
    expect(state.expanded).toBe(false);
    expect(state.animating).toBe(true);
    expect(getCollapsedMaxHeight(state)).toBe(100);

    // Step 5: Finish animation
    state = finishAnimation(state);
    expect(state.expanded).toBe(false);
    expect(state.animating).toBe(false);
  });
});
