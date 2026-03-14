/**
 * Tests for cross-filter-highlight-state.ts — Cross-Filter Source Highlighting (UX-024)
 */
import { describe, it, expect } from 'vitest';
import {
  createCrossFilterHighlightState,
  activateHighlighting,
  deactivateHighlighting,
  setHoverWidget,
  clearHoverWidget,
  getWidgetRole,
  isHighlightActive,
  getHighlightedWidgetIds,
} from '../screens/cross-filter-highlight-state.js';

describe('cross-filter-highlight-state', () => {
  // ======================================================================
  // createCrossFilterHighlightState
  // ======================================================================
  describe('createCrossFilterHighlightState', () => {
    it('creates default inactive state', () => {
      const state = createCrossFilterHighlightState();
      expect(state.active).toBe(false);
      expect(state.sourceWidgetId).toBeNull();
      expect(state.targetWidgetIds.size).toBe(0);
      expect(state.sourceField).toBeNull();
      expect(state.hoverWidgetId).toBeNull();
    });
  });

  // ======================================================================
  // activateHighlighting
  // ======================================================================
  describe('activateHighlighting', () => {
    it('activates highlighting with source and targets', () => {
      const initial = createCrossFilterHighlightState();
      const state = activateHighlighting(initial, 'widget-1', ['widget-2', 'widget-3'], 'category');

      expect(state.active).toBe(true);
      expect(state.sourceWidgetId).toBe('widget-1');
      expect(state.targetWidgetIds).toEqual(new Set(['widget-2', 'widget-3']));
      expect(state.sourceField).toBe('category');
      expect(state.hoverWidgetId).toBeNull();
    });

    it('returns a new reference', () => {
      const initial = createCrossFilterHighlightState();
      const state = activateHighlighting(initial, 'w1', ['w2'], 'field');
      expect(state).not.toBe(initial);
    });

    it('clears hoverWidgetId when activating', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');
      state = setHoverWidget(state, 'w2');
      expect(state.hoverWidgetId).toBe('w2');

      // Re-activate with different source; hover should be cleared
      const reactivated = activateHighlighting(state, 'w3', ['w4'], 'other');
      expect(reactivated.hoverWidgetId).toBeNull();
    });

    it('converts target array to ReadonlySet', () => {
      const initial = createCrossFilterHighlightState();
      const state = activateHighlighting(initial, 'w1', ['w2', 'w3', 'w2'], 'f');
      // Duplicates should be deduplicated by Set
      expect(state.targetWidgetIds.size).toBe(2);
      expect(state.targetWidgetIds.has('w2')).toBe(true);
      expect(state.targetWidgetIds.has('w3')).toBe(true);
    });

    it('works with empty targets array', () => {
      const initial = createCrossFilterHighlightState();
      const state = activateHighlighting(initial, 'w1', [], 'field');
      expect(state.active).toBe(true);
      expect(state.sourceWidgetId).toBe('w1');
      expect(state.targetWidgetIds.size).toBe(0);
    });
  });

  // ======================================================================
  // deactivateHighlighting
  // ======================================================================
  describe('deactivateHighlighting', () => {
    it('deactivates and clears all fields', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2', 'w3'], 'field');
      state = setHoverWidget(state, 'w2');

      const deactivated = deactivateHighlighting(state);
      expect(deactivated.active).toBe(false);
      expect(deactivated.sourceWidgetId).toBeNull();
      expect(deactivated.targetWidgetIds.size).toBe(0);
      expect(deactivated.sourceField).toBeNull();
      expect(deactivated.hoverWidgetId).toBeNull();
    });

    it('returns same reference if already inactive (no-op)', () => {
      const state = createCrossFilterHighlightState();
      const result = deactivateHighlighting(state);
      expect(result).toBe(state);
    });
  });

  // ======================================================================
  // setHoverWidget
  // ======================================================================
  describe('setHoverWidget', () => {
    it('sets hover widget ID when active', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');

      const hovered = setHoverWidget(state, 'w2');
      expect(hovered.hoverWidgetId).toBe('w2');
    });

    it('returns same reference if not active (no-op)', () => {
      const state = createCrossFilterHighlightState();
      const result = setHoverWidget(state, 'w2');
      expect(result).toBe(state);
    });

    it('returns same reference if same widgetId (no-op)', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');
      state = setHoverWidget(state, 'w2');

      const result = setHoverWidget(state, 'w2');
      expect(result).toBe(state);
    });

    it('returns new reference when widget changes', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2', 'w3'], 'field');
      state = setHoverWidget(state, 'w2');

      const result = setHoverWidget(state, 'w3');
      expect(result).not.toBe(state);
      expect(result.hoverWidgetId).toBe('w3');
    });
  });

  // ======================================================================
  // clearHoverWidget
  // ======================================================================
  describe('clearHoverWidget', () => {
    it('clears hover widget ID', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');
      state = setHoverWidget(state, 'w2');

      const cleared = clearHoverWidget(state);
      expect(cleared.hoverWidgetId).toBeNull();
    });

    it('returns same reference if already null (no-op)', () => {
      const state = createCrossFilterHighlightState();
      const result = clearHoverWidget(state);
      expect(result).toBe(state);
    });

    it('returns same reference if active but hover already null', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');
      // hoverWidgetId is null after activation
      const result = clearHoverWidget(state);
      expect(result).toBe(state);
    });
  });

  // ======================================================================
  // getWidgetRole
  // ======================================================================
  describe('getWidgetRole', () => {
    it('returns "none" when not active', () => {
      const state = createCrossFilterHighlightState();
      expect(getWidgetRole(state, 'w1')).toBe('none');
    });

    it('returns "source" for the source widget', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2', 'w3'], 'field');
      expect(getWidgetRole(state, 'w1')).toBe('source');
    });

    it('returns "target" for a target widget', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2', 'w3'], 'field');
      expect(getWidgetRole(state, 'w2')).toBe('target');
      expect(getWidgetRole(state, 'w3')).toBe('target');
    });

    it('returns "none" for an unrelated widget', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2', 'w3'], 'field');
      expect(getWidgetRole(state, 'w99')).toBe('none');
    });
  });

  // ======================================================================
  // isHighlightActive
  // ======================================================================
  describe('isHighlightActive', () => {
    it('returns false for initial state', () => {
      const state = createCrossFilterHighlightState();
      expect(isHighlightActive(state)).toBe(false);
    });

    it('returns true after activation', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');
      expect(isHighlightActive(state)).toBe(true);
    });

    it('returns false after deactivation', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2'], 'field');
      state = deactivateHighlighting(state);
      expect(isHighlightActive(state)).toBe(false);
    });
  });

  // ======================================================================
  // getHighlightedWidgetIds
  // ======================================================================
  describe('getHighlightedWidgetIds', () => {
    it('returns empty array when not active', () => {
      const state = createCrossFilterHighlightState();
      expect(getHighlightedWidgetIds(state)).toEqual([]);
    });

    it('returns source + target IDs when active', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', ['w2', 'w3'], 'field');

      const ids = getHighlightedWidgetIds(state);
      expect(ids).toHaveLength(3);
      expect(ids).toContain('w1');
      expect(ids).toContain('w2');
      expect(ids).toContain('w3');
    });

    it('returns only source when no targets', () => {
      let state = createCrossFilterHighlightState();
      state = activateHighlighting(state, 'w1', [], 'field');

      const ids = getHighlightedWidgetIds(state);
      expect(ids).toEqual(['w1']);
    });

    it('does not include duplicates if source is also in targets', () => {
      let state = createCrossFilterHighlightState();
      // Edge case: source widget listed as its own target
      state = activateHighlighting(state, 'w1', ['w1', 'w2'], 'field');

      const ids = getHighlightedWidgetIds(state);
      // source is w1, targets Set has w1 and w2
      // getHighlightedWidgetIds should combine without duplicates
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
      expect(ids).toContain('w1');
      expect(ids).toContain('w2');
    });
  });
});
