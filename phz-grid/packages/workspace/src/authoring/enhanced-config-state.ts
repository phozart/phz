/**
 * @phozart/workspace — Enhanced Config Panel State (Canvas Phase 2A)
 *
 * Rich widget appearance/format/behavior configuration state machine.
 * Wraps the types from @phozart/engine/widget-config-enhanced
 * and provides pure state transition functions.
 */

import type {
  ContainerAppearance,
  TitleBarAppearance,
  ChartAppearance,
  KpiAppearance,
  ScorecardAppearance,
  BottomNAppearance,
  WidgetBehaviourConfig,
  Threshold,
} from '@phozart/engine';

// ========================================================================
// Types
// ========================================================================

export type EnhancedConfigSection = 'data' | 'appearance' | 'format' | 'overlays' | 'behavior';

export interface FormattingRuleEntry {
  id: string;
  field: string;
  condition: 'gt' | 'lt' | 'eq' | 'between';
  value: number;
  value2?: number;
  style: { color?: string; background?: string; bold?: boolean };
}

export interface OverlayEntry {
  id: string;
  type: 'reference-line' | 'trend-line' | 'threshold-band';
  label?: string;
  value?: number;
  color?: string;
}

export interface EnhancedConfigPanelState {
  activeSection: EnhancedConfigSection;
  widgetId: string;
  widgetType: string;
  // Appearance sub-configs
  container: ContainerAppearance;
  titleBar: TitleBarAppearance;
  chart?: ChartAppearance;
  kpi?: KpiAppearance;
  scorecard?: ScorecardAppearance;
  bottomN?: BottomNAppearance;
  // Behavior
  behaviour: WidgetBehaviourConfig;
  // Formatting rules
  formattingRules: FormattingRuleEntry[];
  // Overlays
  overlays: OverlayEntry[];
  // Thresholds
  thresholds: Threshold[];
  // Tracking
  dirty: boolean;
  expandedAccordions: string[];
}

// ========================================================================
// Smart Defaults (local mirror of SMART_DEFAULTS from widget-config-enhanced)
// ========================================================================

const CHART_TYPES = new Set(['bar-chart', 'line-chart', 'area-chart', 'trend-line', 'pie-chart']);
const KPI_TYPES = new Set(['kpi-card', 'gauge']);
const SCORECARD_TYPES = new Set(['kpi-scorecard', 'status-table']);

function defaultContainer(): ContainerAppearance {
  return { shadow: 'sm', borderRadius: 8, background: '#FFFFFF', border: false };
}

function defaultTitleBar(title: string): TitleBarAppearance {
  return { show: true, title, fontSize: 14, fontWeight: 600, color: '#1C1917' };
}

function defaultBehaviour(): WidgetBehaviourConfig {
  return { onClick: 'none', exportPng: true, exportCsv: false, autoRefresh: false };
}

function defaultChart(): ChartAppearance {
  return {
    height: 300,
    padding: 16,
    xAxis: { show: true, gridLines: false },
    yAxis: { show: true, gridLines: true },
    legend: { show: false, position: 'top' },
    dataLabels: { show: true, position: 'outside' },
    tooltip: { enabled: true },
    palette: 'phz-default',
  };
}

function defaultKpi(): KpiAppearance {
  return {
    valueSize: 28,
    layout: 'vertical',
    alignment: 'center',
    showTrend: true,
    showTarget: true,
    showSparkline: true,
  };
}

function defaultScorecard(): ScorecardAppearance {
  return { density: 'compact', rowBanding: true, stickyHeader: true };
}

function defaultBottomN(): BottomNAppearance {
  return { mode: 'bottom', count: 5, showRankNumber: true, highlightFirst: true };
}

// ========================================================================
// ID Generation
// ========================================================================

let _idCounter = 0;

function generateId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${Date.now()}_${_idCounter}`;
}

// ========================================================================
// Factory
// ========================================================================

export function initialEnhancedConfigFromWidget(
  widgetId: string,
  widgetType: string,
  existingConfig?: Record<string, unknown>,
): EnhancedConfigPanelState {
  const state: EnhancedConfigPanelState = {
    activeSection: 'appearance',
    widgetId,
    widgetType,
    container: defaultContainer(),
    titleBar: defaultTitleBar(widgetType),
    behaviour: defaultBehaviour(),
    formattingRules: [],
    overlays: [],
    thresholds: [],
    dirty: false,
    expandedAccordions: [],
  };

  // Widget-type-specific appearance defaults
  if (CHART_TYPES.has(widgetType)) {
    state.chart = defaultChart();
  }
  if (KPI_TYPES.has(widgetType)) {
    state.kpi = defaultKpi();
  }
  if (SCORECARD_TYPES.has(widgetType)) {
    state.scorecard = defaultScorecard();
  }
  if (widgetType === 'bottom-n') {
    state.bottomN = defaultBottomN();
  }

  // Merge in existing config if provided
  if (existingConfig) {
    if (existingConfig.container && typeof existingConfig.container === 'object') {
      state.container = { ...state.container, ...(existingConfig.container as Partial<ContainerAppearance>) };
    }
    if (existingConfig.titleBar && typeof existingConfig.titleBar === 'object') {
      state.titleBar = { ...state.titleBar, ...(existingConfig.titleBar as Partial<TitleBarAppearance>) };
    }
    if (existingConfig.chart && typeof existingConfig.chart === 'object' && state.chart) {
      state.chart = { ...state.chart, ...(existingConfig.chart as Partial<ChartAppearance>) };
    }
    if (existingConfig.kpi && typeof existingConfig.kpi === 'object' && state.kpi) {
      state.kpi = { ...state.kpi, ...(existingConfig.kpi as Partial<KpiAppearance>) };
    }
    if (existingConfig.scorecard && typeof existingConfig.scorecard === 'object' && state.scorecard) {
      state.scorecard = { ...state.scorecard, ...(existingConfig.scorecard as Partial<ScorecardAppearance>) };
    }
    if (existingConfig.bottomN && typeof existingConfig.bottomN === 'object' && state.bottomN) {
      state.bottomN = { ...state.bottomN, ...(existingConfig.bottomN as Partial<BottomNAppearance>) };
    }
    if (existingConfig.behaviour && typeof existingConfig.behaviour === 'object') {
      state.behaviour = { ...state.behaviour, ...(existingConfig.behaviour as Partial<WidgetBehaviourConfig>) };
    }
  }

  return state;
}

// ========================================================================
// Section Navigation
// ========================================================================

export function setEnhancedConfigSection(
  state: EnhancedConfigPanelState,
  section: EnhancedConfigSection,
): EnhancedConfigPanelState {
  if (state.activeSection === section) return state;
  return { ...state, activeSection: section, dirty: true };
}

// ========================================================================
// Container Appearance
// ========================================================================

export function updateEnhancedContainer(
  state: EnhancedConfigPanelState,
  patch: Partial<ContainerAppearance>,
): EnhancedConfigPanelState {
  return {
    ...state,
    container: { ...state.container, ...patch },
    dirty: true,
  };
}

// ========================================================================
// Title Bar
// ========================================================================

export function updateEnhancedTitleBar(
  state: EnhancedConfigPanelState,
  patch: Partial<TitleBarAppearance>,
): EnhancedConfigPanelState {
  return {
    ...state,
    titleBar: { ...state.titleBar, ...patch },
    dirty: true,
  };
}

// ========================================================================
// Chart Appearance
// ========================================================================

export function updateEnhancedChart(
  state: EnhancedConfigPanelState,
  patch: Partial<ChartAppearance>,
): EnhancedConfigPanelState {
  if (!state.chart) return state;
  return {
    ...state,
    chart: { ...state.chart, ...patch },
    dirty: true,
  };
}

// ========================================================================
// KPI Appearance
// ========================================================================

export function updateEnhancedKpi(
  state: EnhancedConfigPanelState,
  patch: Partial<KpiAppearance>,
): EnhancedConfigPanelState {
  if (!state.kpi) return state;
  return {
    ...state,
    kpi: { ...state.kpi, ...patch },
    dirty: true,
  };
}

// ========================================================================
// Scorecard Appearance
// ========================================================================

export function updateEnhancedScorecard(
  state: EnhancedConfigPanelState,
  patch: Partial<ScorecardAppearance>,
): EnhancedConfigPanelState {
  if (!state.scorecard) return state;
  return {
    ...state,
    scorecard: { ...state.scorecard, ...patch },
    dirty: true,
  };
}

// ========================================================================
// BottomN Appearance
// ========================================================================

export function updateEnhancedBottomN(
  state: EnhancedConfigPanelState,
  patch: Partial<BottomNAppearance>,
): EnhancedConfigPanelState {
  if (!state.bottomN) return state;
  return {
    ...state,
    bottomN: { ...state.bottomN, ...patch },
    dirty: true,
  };
}

// ========================================================================
// Behaviour
// ========================================================================

export function updateEnhancedBehaviour(
  state: EnhancedConfigPanelState,
  patch: Partial<WidgetBehaviourConfig>,
): EnhancedConfigPanelState {
  return {
    ...state,
    behaviour: { ...state.behaviour, ...patch },
    dirty: true,
  };
}

// ========================================================================
// Accordion
// ========================================================================

export function toggleEnhancedAccordion(
  state: EnhancedConfigPanelState,
  id: string,
): EnhancedConfigPanelState {
  const existing = state.expandedAccordions.includes(id);
  return {
    ...state,
    expandedAccordions: existing
      ? state.expandedAccordions.filter(a => a !== id)
      : [...state.expandedAccordions, id],
    dirty: true,
  };
}

// ========================================================================
// Formatting Rules
// ========================================================================

export function addEnhancedFormattingRule(
  state: EnhancedConfigPanelState,
  rule: Omit<FormattingRuleEntry, 'id'>,
): EnhancedConfigPanelState {
  const entry: FormattingRuleEntry = { ...rule, id: generateId('fr') };
  return {
    ...state,
    formattingRules: [...state.formattingRules, entry],
    dirty: true,
  };
}

export function removeEnhancedFormattingRule(
  state: EnhancedConfigPanelState,
  ruleId: string,
): EnhancedConfigPanelState {
  return {
    ...state,
    formattingRules: state.formattingRules.filter(r => r.id !== ruleId),
    dirty: true,
  };
}

export function updateEnhancedFormattingRule(
  state: EnhancedConfigPanelState,
  ruleId: string,
  patch: Partial<FormattingRuleEntry>,
): EnhancedConfigPanelState {
  return {
    ...state,
    formattingRules: state.formattingRules.map(r =>
      r.id === ruleId ? { ...r, ...patch, id: r.id } : r,
    ),
    dirty: true,
  };
}

// ========================================================================
// Overlays
// ========================================================================

export function addEnhancedOverlay(
  state: EnhancedConfigPanelState,
  overlay: Omit<OverlayEntry, 'id'>,
): EnhancedConfigPanelState {
  const entry: OverlayEntry = { ...overlay, id: generateId('ov') };
  return {
    ...state,
    overlays: [...state.overlays, entry],
    dirty: true,
  };
}

export function removeEnhancedOverlay(
  state: EnhancedConfigPanelState,
  overlayId: string,
): EnhancedConfigPanelState {
  return {
    ...state,
    overlays: state.overlays.filter(o => o.id !== overlayId),
    dirty: true,
  };
}

export function updateEnhancedOverlay(
  state: EnhancedConfigPanelState,
  overlayId: string,
  patch: Partial<OverlayEntry>,
): EnhancedConfigPanelState {
  return {
    ...state,
    overlays: state.overlays.map(o =>
      o.id === overlayId ? { ...o, ...patch, id: o.id } : o,
    ),
    dirty: true,
  };
}

// ========================================================================
// Thresholds
// ========================================================================

export function addEnhancedThreshold(
  state: EnhancedConfigPanelState,
  threshold: Threshold,
): EnhancedConfigPanelState {
  return {
    ...state,
    thresholds: [...state.thresholds, threshold],
    dirty: true,
  };
}

export function removeEnhancedThreshold(
  state: EnhancedConfigPanelState,
  index: number,
): EnhancedConfigPanelState {
  if (index < 0 || index >= state.thresholds.length) return state;
  return {
    ...state,
    thresholds: state.thresholds.filter((_, i) => i !== index),
    dirty: true,
  };
}

// ========================================================================
// Apply to Widget Config
// ========================================================================

export function applyEnhancedConfigToWidget(
  state: EnhancedConfigPanelState,
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    container: { ...state.container },
    titleBar: { ...state.titleBar },
    behaviour: { ...state.behaviour },
  };

  if (state.chart) config.chart = { ...state.chart };
  if (state.kpi) config.kpi = { ...state.kpi };
  if (state.scorecard) config.scorecard = { ...state.scorecard };
  if (state.bottomN) config.bottomN = { ...state.bottomN };

  if (state.formattingRules.length > 0) {
    config.formattingRules = state.formattingRules.map(r => ({ ...r }));
  }

  if (state.overlays.length > 0) {
    config.overlays = state.overlays.map(o => ({ ...o }));
  }

  if (state.thresholds.length > 0) {
    config.thresholds = state.thresholds.map(t => ({ ...t }));
  }

  return config;
}

// ========================================================================
// Dirty Tracking
// ========================================================================

export function markEnhancedConfigClean(
  state: EnhancedConfigPanelState,
): EnhancedConfigPanelState {
  return { ...state, dirty: false };
}
