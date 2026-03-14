import { describe, it, expect } from 'vitest';
import {
  type DashboardEditorMode,
  type DashboardEditorState,
  type EditorWidgetPlacement,
  type EditorGlobalFilter,
  createDashboardEditorState,
  enableAdvancedMode,
  toggleDataModel,
  toggleToolbar,
  addWidget,
  removeWidget,
  selectWidget,
  updateWidgetConfig,
  setName,
  setDescription,
  isAdvancedFeatureUsed,
} from '../dashboard-editor-state.js';

function makeWidget(id: string, type = 'kpi-card'): EditorWidgetPlacement {
  return { id, type, config: {} };
}

function makeFilter(id: string, field = 'region'): EditorGlobalFilter {
  return { id, field, operator: 'equals', value: 'US' };
}

describe('dashboard-editor-state', () => {
  // ── createDashboardEditorState ──

  describe('createDashboardEditorState', () => {
    it('defaults to mode:"simple", empty widgets', () => {
      const s = createDashboardEditorState();
      expect(s.mode).toBe('simple');
      expect(s.widgets).toEqual([]);
      expect(s.selectedWidgetId).toBeNull();
      expect(s.name).toBe('');
      expect(s.description).toBe('');
      expect(s.layoutColumns).toBe(3);
      expect(s.showDataModel).toBe(false);
      expect(s.showToolbar).toBe(false);
      expect(s.globalFilters).toEqual([]);
    });

    it('starts in advanced mode when passed "advanced"', () => {
      const s = createDashboardEditorState('advanced');
      expect(s.mode).toBe('advanced');
    });
  });

  // ── enableAdvancedMode ──

  describe('enableAdvancedMode', () => {
    it('switches mode to "advanced" and shows toolbar', () => {
      const s = createDashboardEditorState();
      const next = enableAdvancedMode(s);
      expect(next.mode).toBe('advanced');
      expect(next.showToolbar).toBe(true);
    });

    it('is a no-op when already in advanced mode', () => {
      const s = createDashboardEditorState('advanced');
      const next = enableAdvancedMode(s);
      expect(next).toBe(s);
    });
  });

  // ── toggleDataModel ──

  describe('toggleDataModel', () => {
    it('toggles showDataModel in advanced mode', () => {
      const s = enableAdvancedMode(createDashboardEditorState());
      expect(s.showDataModel).toBe(false);

      const toggled = toggleDataModel(s);
      expect(toggled.showDataModel).toBe(true);

      const toggledBack = toggleDataModel(toggled);
      expect(toggledBack.showDataModel).toBe(false);
    });

    it('does nothing in simple mode', () => {
      const s = createDashboardEditorState();
      const next = toggleDataModel(s);
      expect(next).toBe(s);
    });
  });

  // ── toggleToolbar ──

  describe('toggleToolbar', () => {
    it('toggles showToolbar in advanced mode', () => {
      const s = enableAdvancedMode(createDashboardEditorState());
      expect(s.showToolbar).toBe(true);

      const toggled = toggleToolbar(s);
      expect(toggled.showToolbar).toBe(false);

      const toggledBack = toggleToolbar(toggled);
      expect(toggledBack.showToolbar).toBe(true);
    });
  });

  // ── addWidget ──

  describe('addWidget', () => {
    it('appends widget to array', () => {
      const s = createDashboardEditorState();
      const w = makeWidget('w-1');
      const next = addWidget(s, w);
      expect(next.widgets).toHaveLength(1);
      expect(next.widgets[0]).toEqual(w);
    });

    it('auto-selects the new widget', () => {
      const s = createDashboardEditorState();
      const w = makeWidget('w-1');
      const next = addWidget(s, w);
      expect(next.selectedWidgetId).toBe('w-1');
    });
  });

  // ── removeWidget ──

  describe('removeWidget', () => {
    it('removes by id', () => {
      let s = createDashboardEditorState();
      s = addWidget(s, makeWidget('w-1'));
      s = addWidget(s, makeWidget('w-2'));
      const next = removeWidget(s, 'w-1');
      expect(next.widgets).toHaveLength(1);
      expect(next.widgets[0].id).toBe('w-2');
    });

    it('clears selection if removed widget was selected', () => {
      let s = createDashboardEditorState();
      s = addWidget(s, makeWidget('w-1'));
      expect(s.selectedWidgetId).toBe('w-1');

      const next = removeWidget(s, 'w-1');
      expect(next.selectedWidgetId).toBeNull();
    });

    it('on non-existent id is safe', () => {
      const s = createDashboardEditorState();
      const next = removeWidget(s, 'does-not-exist');
      expect(next).toBe(s);
    });
  });

  // ── selectWidget ──

  describe('selectWidget', () => {
    it('sets selectedWidgetId', () => {
      let s = createDashboardEditorState();
      s = addWidget(s, makeWidget('w-1'));
      s = addWidget(s, makeWidget('w-2'));

      const next = selectWidget(s, 'w-1');
      expect(next.selectedWidgetId).toBe('w-1');
    });

    it('selectWidget(null) clears selection', () => {
      let s = createDashboardEditorState();
      s = addWidget(s, makeWidget('w-1'));
      expect(s.selectedWidgetId).toBe('w-1');

      const next = selectWidget(s, null);
      expect(next.selectedWidgetId).toBeNull();
    });
  });

  // ── updateWidgetConfig ──

  describe('updateWidgetConfig', () => {
    it('merges config into widget', () => {
      let s = createDashboardEditorState();
      s = addWidget(s, makeWidget('w-1'));

      const next = updateWidgetConfig(s, 'w-1', { title: 'Revenue', color: 'blue' });
      expect(next.widgets[0].config).toEqual({ title: 'Revenue', color: 'blue' });
    });

    it('on non-existent widget is safe', () => {
      const s = createDashboardEditorState();
      const next = updateWidgetConfig(s, 'missing', { title: 'nope' });
      expect(next).toBe(s);
    });
  });

  // ── setName / setDescription ──

  describe('setName', () => {
    it('updates name', () => {
      const s = createDashboardEditorState();
      const next = setName(s, 'Sales Dashboard');
      expect(next.name).toBe('Sales Dashboard');
    });
  });

  describe('setDescription', () => {
    it('updates description', () => {
      const s = createDashboardEditorState();
      const next = setDescription(s, 'Monthly sales overview');
      expect(next.description).toBe('Monthly sales overview');
    });
  });

  // ── isAdvancedFeatureUsed ──

  describe('isAdvancedFeatureUsed', () => {
    it('returns false for simple empty state', () => {
      const s = createDashboardEditorState();
      expect(isAdvancedFeatureUsed(s)).toBe(false);
    });

    it('returns true when globalFilters non-empty', () => {
      const s: DashboardEditorState = {
        ...createDashboardEditorState(),
        globalFilters: [makeFilter('f-1')],
      };
      expect(isAdvancedFeatureUsed(s)).toBe(true);
    });

    it('returns false when advanced mode but no advanced features used', () => {
      const s = createDashboardEditorState('advanced');
      expect(isAdvancedFeatureUsed(s)).toBe(false);
    });

    it('returns true when showDataModel is true', () => {
      let s = createDashboardEditorState('advanced');
      s = toggleDataModel(s);
      expect(isAdvancedFeatureUsed(s)).toBe(true);
    });
  });

  // ── Immutability ──

  describe('immutability', () => {
    it('all functions return new state objects', () => {
      const s = createDashboardEditorState();
      const w = makeWidget('w-1');

      // Each function that modifies state should return a new object
      const s1 = enableAdvancedMode(s);
      expect(s1).not.toBe(s);

      const s2 = addWidget(s, w);
      expect(s2).not.toBe(s);

      const s3 = addWidget(s2, makeWidget('w-2'));
      const s4 = removeWidget(s3, 'w-2');
      expect(s4).not.toBe(s3);

      const s5 = selectWidget(s2, null);
      expect(s5).not.toBe(s2);

      const s6 = updateWidgetConfig(s2, 'w-1', { x: 1 });
      expect(s6).not.toBe(s2);

      const s7 = setName(s, 'Test');
      expect(s7).not.toBe(s);

      const s8 = setDescription(s, 'Test desc');
      expect(s8).not.toBe(s);

      // Original state unchanged
      expect(s.mode).toBe('simple');
      expect(s.widgets).toHaveLength(0);
      expect(s.name).toBe('');
    });
  });
});
