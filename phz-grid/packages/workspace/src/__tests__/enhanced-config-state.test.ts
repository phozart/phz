/**
 * @phozart/phz-workspace — Enhanced Config Panel State Tests
 *
 * ~45 tests covering factory, section navigation, appearance updates,
 * behaviour, accordion, formatting rules, overlays, thresholds,
 * and apply-to-widget-config.
 */

import { describe, it, expect } from 'vitest';
import {
  initialEnhancedConfigFromWidget,
  setEnhancedConfigSection,
  updateEnhancedContainer,
  updateEnhancedTitleBar,
  updateEnhancedChart,
  updateEnhancedKpi,
  updateEnhancedScorecard,
  updateEnhancedBottomN,
  updateEnhancedBehaviour,
  toggleEnhancedAccordion,
  addEnhancedFormattingRule,
  removeEnhancedFormattingRule,
  updateEnhancedFormattingRule,
  addEnhancedOverlay,
  removeEnhancedOverlay,
  updateEnhancedOverlay,
  addEnhancedThreshold,
  removeEnhancedThreshold,
  applyEnhancedConfigToWidget,
  markEnhancedConfigClean,
} from '../authoring/enhanced-config-state.js';
import type { EnhancedConfigPanelState } from '../authoring/enhanced-config-state.js';

// ========================================================================
// Helpers
// ========================================================================

function barChartState(): EnhancedConfigPanelState {
  return initialEnhancedConfigFromWidget('w1', 'bar-chart');
}

function kpiState(): EnhancedConfigPanelState {
  return initialEnhancedConfigFromWidget('w2', 'kpi-card');
}

// ========================================================================
// 1. Factory
// ========================================================================

describe('initialEnhancedConfigFromWidget', () => {
  it('creates default state for bar-chart with chart appearance', () => {
    const state = barChartState();
    expect(state.widgetId).toBe('w1');
    expect(state.widgetType).toBe('bar-chart');
    expect(state.chart).toBeDefined();
    expect(state.chart!.height).toBe(300);
    expect(state.chart!.palette).toBe('phz-default');
    expect(state.kpi).toBeUndefined();
    expect(state.scorecard).toBeUndefined();
    expect(state.bottomN).toBeUndefined();
  });

  it('creates default state for kpi-card with kpi appearance', () => {
    const state = kpiState();
    expect(state.kpi).toBeDefined();
    expect(state.kpi!.valueSize).toBe(28);
    expect(state.kpi!.layout).toBe('vertical');
    expect(state.chart).toBeUndefined();
  });

  it('creates default state for unknown type with fallback defaults', () => {
    const state = initialEnhancedConfigFromWidget('w3', 'unknown-thing');
    expect(state.container.shadow).toBe('sm');
    expect(state.container.borderRadius).toBe(8);
    expect(state.titleBar.show).toBe(true);
    expect(state.titleBar.title).toBe('unknown-thing');
    expect(state.chart).toBeUndefined();
    expect(state.kpi).toBeUndefined();
    expect(state.scorecard).toBeUndefined();
    expect(state.bottomN).toBeUndefined();
  });

  it('merges existing config over defaults', () => {
    const state = initialEnhancedConfigFromWidget('w4', 'bar-chart', {
      container: { shadow: 'lg', borderRadius: 16 },
      chart: { height: 500 },
      behaviour: { exportCsv: true },
    });
    expect(state.container.shadow).toBe('lg');
    expect(state.container.borderRadius).toBe(16);
    // Merged defaults should still have background
    expect(state.container.background).toBe('#FFFFFF');
    expect(state.chart!.height).toBe(500);
    expect(state.behaviour.exportCsv).toBe(true);
  });

  it('default section is appearance', () => {
    const state = barChartState();
    expect(state.activeSection).toBe('appearance');
  });

  it('creates scorecard appearance for kpi-scorecard', () => {
    const state = initialEnhancedConfigFromWidget('w5', 'kpi-scorecard');
    expect(state.scorecard).toBeDefined();
    expect(state.scorecard!.density).toBe('compact');
    expect(state.scorecard!.rowBanding).toBe(true);
  });

  it('creates bottomN appearance for bottom-n', () => {
    const state = initialEnhancedConfigFromWidget('w6', 'bottom-n');
    expect(state.bottomN).toBeDefined();
    expect(state.bottomN!.mode).toBe('bottom');
    expect(state.bottomN!.count).toBe(5);
  });
});

// ========================================================================
// 2. Section Navigation
// ========================================================================

describe('setEnhancedConfigSection', () => {
  it('changes active section', () => {
    const state = barChartState();
    const next = setEnhancedConfigSection(state, 'format');
    expect(next.activeSection).toBe('format');
  });

  it('sets dirty flag', () => {
    const state = barChartState();
    expect(state.dirty).toBe(false);
    const next = setEnhancedConfigSection(state, 'behavior');
    expect(next.dirty).toBe(true);
  });

  it('returns same state if same section', () => {
    const state = barChartState();
    const next = setEnhancedConfigSection(state, 'appearance');
    expect(next).toBe(state);
  });
});

// ========================================================================
// 3. Container Appearance
// ========================================================================

describe('updateEnhancedContainer', () => {
  it('updates shadow', () => {
    const state = barChartState();
    const next = updateEnhancedContainer(state, { shadow: 'lg' });
    expect(next.container.shadow).toBe('lg');
  });

  it('updates borderRadius', () => {
    const next = updateEnhancedContainer(barChartState(), { borderRadius: 16 });
    expect(next.container.borderRadius).toBe(16);
  });

  it('updates background color', () => {
    const next = updateEnhancedContainer(barChartState(), { background: '#000000' });
    expect(next.container.background).toBe('#000000');
  });

  it('updates border toggle', () => {
    const next = updateEnhancedContainer(barChartState(), { border: true });
    expect(next.container.border).toBe(true);
  });

  it('marks dirty', () => {
    const state = barChartState();
    expect(state.dirty).toBe(false);
    const next = updateEnhancedContainer(state, { shadow: 'none' });
    expect(next.dirty).toBe(true);
  });
});

// ========================================================================
// 4. Title Bar
// ========================================================================

describe('updateEnhancedTitleBar', () => {
  it('updates show/hide', () => {
    const next = updateEnhancedTitleBar(barChartState(), { show: false });
    expect(next.titleBar.show).toBe(false);
  });

  it('updates title text', () => {
    const next = updateEnhancedTitleBar(barChartState(), { title: 'Revenue by Region' });
    expect(next.titleBar.title).toBe('Revenue by Region');
  });

  it('updates font size', () => {
    const next = updateEnhancedTitleBar(barChartState(), { fontSize: 18 });
    expect(next.titleBar.fontSize).toBe(18);
  });

  it('updates color', () => {
    const next = updateEnhancedTitleBar(barChartState(), { color: '#FF0000' });
    expect(next.titleBar.color).toBe('#FF0000');
  });
});

// ========================================================================
// 5. Chart Appearance
// ========================================================================

describe('updateEnhancedChart', () => {
  it('updates height', () => {
    const next = updateEnhancedChart(barChartState(), { height: 500 });
    expect(next.chart!.height).toBe(500);
  });

  it('updates axis visibility', () => {
    const next = updateEnhancedChart(barChartState(), {
      xAxis: { show: false, gridLines: false },
    });
    expect(next.chart!.xAxis!.show).toBe(false);
  });

  it('updates legend position', () => {
    const next = updateEnhancedChart(barChartState(), {
      legend: { show: true, position: 'bottom' },
    });
    expect(next.chart!.legend!.position).toBe('bottom');
  });

  it('updates palette', () => {
    const next = updateEnhancedChart(barChartState(), { palette: 'warm-sunset' });
    expect(next.chart!.palette).toBe('warm-sunset');
  });

  it('no-op if chart is undefined (non-chart widget)', () => {
    const state = kpiState();
    expect(state.chart).toBeUndefined();
    const next = updateEnhancedChart(state, { height: 999 });
    expect(next).toBe(state);
    expect(next.chart).toBeUndefined();
  });
});

// ========================================================================
// 6. KPI Appearance
// ========================================================================

describe('updateEnhancedKpi', () => {
  it('updates valueSize', () => {
    const next = updateEnhancedKpi(kpiState(), { valueSize: 36 });
    expect(next.kpi!.valueSize).toBe(36);
  });

  it('updates layout direction', () => {
    const next = updateEnhancedKpi(kpiState(), { layout: 'horizontal' });
    expect(next.kpi!.layout).toBe('horizontal');
  });

  it('updates trend/target/sparkline toggles', () => {
    const next = updateEnhancedKpi(kpiState(), {
      showTrend: false,
      showTarget: false,
      showSparkline: false,
    });
    expect(next.kpi!.showTrend).toBe(false);
    expect(next.kpi!.showTarget).toBe(false);
    expect(next.kpi!.showSparkline).toBe(false);
  });
});

// ========================================================================
// 7. Scorecard Appearance
// ========================================================================

describe('updateEnhancedScorecard', () => {
  it('updates density', () => {
    const state = initialEnhancedConfigFromWidget('w5', 'kpi-scorecard');
    const next = updateEnhancedScorecard(state, { density: 'comfortable' });
    expect(next.scorecard!.density).toBe('comfortable');
  });

  it('updates row banding', () => {
    const state = initialEnhancedConfigFromWidget('w5', 'kpi-scorecard');
    const next = updateEnhancedScorecard(state, { rowBanding: false });
    expect(next.scorecard!.rowBanding).toBe(false);
  });
});

// ========================================================================
// 8. BottomN Appearance
// ========================================================================

describe('updateEnhancedBottomN', () => {
  it('updates mode and count', () => {
    const state = initialEnhancedConfigFromWidget('w6', 'bottom-n');
    const next = updateEnhancedBottomN(state, { mode: 'top', count: 10 });
    expect(next.bottomN!.mode).toBe('top');
    expect(next.bottomN!.count).toBe(10);
  });

  it('no-op if bottomN is undefined', () => {
    const state = barChartState();
    const next = updateEnhancedBottomN(state, { mode: 'top' });
    expect(next).toBe(state);
  });
});

// ========================================================================
// 9. Behaviour
// ========================================================================

describe('updateEnhancedBehaviour', () => {
  it('updates onClick action', () => {
    const next = updateEnhancedBehaviour(barChartState(), { onClick: 'filter-others' });
    expect(next.behaviour.onClick).toBe('filter-others');
  });

  it('updates export toggles', () => {
    const next = updateEnhancedBehaviour(barChartState(), { exportPng: false, exportCsv: true });
    expect(next.behaviour.exportPng).toBe(false);
    expect(next.behaviour.exportCsv).toBe(true);
  });

  it('updates autoRefresh', () => {
    const next = updateEnhancedBehaviour(barChartState(), { autoRefresh: true });
    expect(next.behaviour.autoRefresh).toBe(true);
  });

  it('updates refreshInterval', () => {
    const next = updateEnhancedBehaviour(barChartState(), { autoRefresh: true, refreshInterval: 30000 });
    expect(next.behaviour.refreshInterval).toBe(30000);
  });
});

// ========================================================================
// 10. Accordion
// ========================================================================

describe('toggleEnhancedAccordion', () => {
  it('toggles open (adds to expandedAccordions)', () => {
    const state = barChartState();
    expect(state.expandedAccordions).toEqual([]);
    const next = toggleEnhancedAccordion(state, 'container');
    expect(next.expandedAccordions).toContain('container');
  });

  it('toggles closed (removes from expandedAccordions)', () => {
    let state = barChartState();
    state = toggleEnhancedAccordion(state, 'container');
    expect(state.expandedAccordions).toContain('container');
    const next = toggleEnhancedAccordion(state, 'container');
    expect(next.expandedAccordions).not.toContain('container');
  });

  it('independent accordion state', () => {
    let state = barChartState();
    state = toggleEnhancedAccordion(state, 'container');
    state = toggleEnhancedAccordion(state, 'titleBar');
    expect(state.expandedAccordions).toContain('container');
    expect(state.expandedAccordions).toContain('titleBar');
    state = toggleEnhancedAccordion(state, 'container');
    expect(state.expandedAccordions).not.toContain('container');
    expect(state.expandedAccordions).toContain('titleBar');
  });
});

// ========================================================================
// 11. Formatting Rules
// ========================================================================

describe('Formatting rules', () => {
  it('adds rule with auto-generated id', () => {
    const state = barChartState();
    const next = addEnhancedFormattingRule(state, {
      field: 'revenue',
      condition: 'gt',
      value: 1000,
      style: { color: '#00FF00', bold: true },
    });
    expect(next.formattingRules).toHaveLength(1);
    expect(next.formattingRules[0].id).toMatch(/^fr_/);
    expect(next.formattingRules[0].field).toBe('revenue');
    expect(next.dirty).toBe(true);
  });

  it('removes rule by id', () => {
    let state = barChartState();
    state = addEnhancedFormattingRule(state, {
      field: 'revenue',
      condition: 'gt',
      value: 1000,
      style: { color: '#00FF00' },
    });
    const ruleId = state.formattingRules[0].id;
    const next = removeEnhancedFormattingRule(state, ruleId);
    expect(next.formattingRules).toHaveLength(0);
  });

  it('updates rule field', () => {
    let state = barChartState();
    state = addEnhancedFormattingRule(state, {
      field: 'revenue',
      condition: 'gt',
      value: 1000,
      style: { color: '#00FF00' },
    });
    const ruleId = state.formattingRules[0].id;
    const next = updateEnhancedFormattingRule(state, ruleId, { field: 'profit' });
    expect(next.formattingRules[0].field).toBe('profit');
    expect(next.formattingRules[0].id).toBe(ruleId); // ID must not change
  });

  it('handles multiple rules', () => {
    let state = barChartState();
    state = addEnhancedFormattingRule(state, {
      field: 'revenue',
      condition: 'gt',
      value: 1000,
      style: { color: '#00FF00' },
    });
    state = addEnhancedFormattingRule(state, {
      field: 'cost',
      condition: 'lt',
      value: 500,
      style: { background: '#FF0000' },
    });
    expect(state.formattingRules).toHaveLength(2);
    expect(state.formattingRules[0].field).toBe('revenue');
    expect(state.formattingRules[1].field).toBe('cost');
  });
});

// ========================================================================
// 12. Overlays
// ========================================================================

describe('Overlays', () => {
  it('adds overlay with auto-generated id', () => {
    const state = barChartState();
    const next = addEnhancedOverlay(state, {
      type: 'reference-line',
      label: 'Target',
      value: 100,
      color: '#0000FF',
    });
    expect(next.overlays).toHaveLength(1);
    expect(next.overlays[0].id).toMatch(/^ov_/);
    expect(next.overlays[0].label).toBe('Target');
    expect(next.dirty).toBe(true);
  });

  it('removes overlay by id', () => {
    let state = barChartState();
    state = addEnhancedOverlay(state, {
      type: 'reference-line',
      label: 'Target',
      value: 100,
    });
    const ovId = state.overlays[0].id;
    const next = removeEnhancedOverlay(state, ovId);
    expect(next.overlays).toHaveLength(0);
  });

  it('updates overlay', () => {
    let state = barChartState();
    state = addEnhancedOverlay(state, {
      type: 'reference-line',
      label: 'Target',
      value: 100,
    });
    const ovId = state.overlays[0].id;
    const next = updateEnhancedOverlay(state, ovId, { value: 200, label: 'New Target' });
    expect(next.overlays[0].value).toBe(200);
    expect(next.overlays[0].label).toBe('New Target');
    expect(next.overlays[0].id).toBe(ovId); // ID must not change
  });

  it('handles multiple overlays', () => {
    let state = barChartState();
    state = addEnhancedOverlay(state, { type: 'reference-line', value: 100 });
    state = addEnhancedOverlay(state, { type: 'trend-line', color: '#FF0000' });
    state = addEnhancedOverlay(state, { type: 'threshold-band', value: 50 });
    expect(state.overlays).toHaveLength(3);
    expect(state.overlays[0].type).toBe('reference-line');
    expect(state.overlays[1].type).toBe('trend-line');
    expect(state.overlays[2].type).toBe('threshold-band');
  });
});

// ========================================================================
// 13. Thresholds
// ========================================================================

describe('Thresholds', () => {
  it('adds threshold', () => {
    const state = barChartState();
    const next = addEnhancedThreshold(state, { value: 90, color: '#00FF00', label: 'Good' });
    expect(next.thresholds).toHaveLength(1);
    expect(next.thresholds[0].value).toBe(90);
    expect(next.thresholds[0].color).toBe('#00FF00');
    expect(next.thresholds[0].label).toBe('Good');
    expect(next.dirty).toBe(true);
  });

  it('removes threshold by index', () => {
    let state = barChartState();
    state = addEnhancedThreshold(state, { value: 90, color: '#00FF00', label: 'Good' });
    state = addEnhancedThreshold(state, { value: 70, color: '#FFFF00', label: 'Warning' });
    state = addEnhancedThreshold(state, { value: 50, color: '#FF0000', label: 'Bad' });
    const next = removeEnhancedThreshold(state, 1);
    expect(next.thresholds).toHaveLength(2);
    expect(next.thresholds[0].label).toBe('Good');
    expect(next.thresholds[1].label).toBe('Bad');
  });

  it('no-op for out-of-range index', () => {
    const state = barChartState();
    const next = removeEnhancedThreshold(state, 5);
    expect(next).toBe(state);
  });
});

// ========================================================================
// 14. Apply to Widget Config
// ========================================================================

describe('applyEnhancedConfigToWidget', () => {
  it('converts appearance to config', () => {
    const state = barChartState();
    const config = applyEnhancedConfigToWidget(state);
    expect(config.container).toEqual(state.container);
    expect(config.titleBar).toEqual(state.titleBar);
    expect(config.chart).toEqual(state.chart);
    expect(config.kpi).toBeUndefined();
  });

  it('includes behaviour', () => {
    let state = barChartState();
    state = updateEnhancedBehaviour(state, { onClick: 'filter-others', autoRefresh: true });
    const config = applyEnhancedConfigToWidget(state);
    expect((config.behaviour as Record<string, unknown>).onClick).toBe('filter-others');
    expect((config.behaviour as Record<string, unknown>).autoRefresh).toBe(true);
  });

  it('includes formatting rules and overlays', () => {
    let state = barChartState();
    state = addEnhancedFormattingRule(state, {
      field: 'revenue',
      condition: 'gt',
      value: 1000,
      style: { color: '#00FF00' },
    });
    state = addEnhancedOverlay(state, { type: 'reference-line', value: 500 });
    state = addEnhancedThreshold(state, { value: 80, color: '#00FF00' });
    const config = applyEnhancedConfigToWidget(state);
    expect(config.formattingRules).toHaveLength(1);
    expect(config.overlays).toHaveLength(1);
    expect(config.thresholds).toHaveLength(1);
  });
});

// ========================================================================
// 15. markEnhancedConfigClean
// ========================================================================

describe('markEnhancedConfigClean', () => {
  it('clears dirty flag', () => {
    let state = barChartState();
    state = updateEnhancedContainer(state, { shadow: 'lg' });
    expect(state.dirty).toBe(true);
    const clean = markEnhancedConfigClean(state);
    expect(clean.dirty).toBe(false);
  });

  it('preserves all other state', () => {
    let state = barChartState();
    state = updateEnhancedContainer(state, { shadow: 'lg' });
    state = updateEnhancedTitleBar(state, { title: 'My Chart' });
    const clean = markEnhancedConfigClean(state);
    expect(clean.container.shadow).toBe('lg');
    expect(clean.titleBar.title).toBe('My Chart');
    expect(clean.widgetId).toBe('w1');
  });
});
