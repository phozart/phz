/**
 * @phozart/phz-workspace — Enhanced Config Panel State (Canvas Phase 2A)
 *
 * Rich widget appearance/format/behavior configuration state machine.
 * Wraps the types from @phozart/phz-engine/widget-config-enhanced
 * and provides pure state transition functions.
 */
// ========================================================================
// Smart Defaults (local mirror of SMART_DEFAULTS from widget-config-enhanced)
// ========================================================================
const CHART_TYPES = new Set(['bar-chart', 'line-chart', 'area-chart', 'trend-line', 'pie-chart']);
const KPI_TYPES = new Set(['kpi-card', 'gauge']);
const SCORECARD_TYPES = new Set(['kpi-scorecard', 'status-table']);
function defaultContainer() {
    return { shadow: 'sm', borderRadius: 8, background: '#FFFFFF', border: false };
}
function defaultTitleBar(title) {
    return { show: true, title, fontSize: 14, fontWeight: 600, color: '#1C1917' };
}
function defaultBehaviour() {
    return { onClick: 'none', exportPng: true, exportCsv: false, autoRefresh: false };
}
function defaultChart() {
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
function defaultKpi() {
    return {
        valueSize: 28,
        layout: 'vertical',
        alignment: 'center',
        showTrend: true,
        showTarget: true,
        showSparkline: true,
    };
}
function defaultScorecard() {
    return { density: 'compact', rowBanding: true, stickyHeader: true };
}
function defaultBottomN() {
    return { mode: 'bottom', count: 5, showRankNumber: true, highlightFirst: true };
}
// ========================================================================
// ID Generation
// ========================================================================
let _idCounter = 0;
function generateId(prefix) {
    _idCounter += 1;
    return `${prefix}_${Date.now()}_${_idCounter}`;
}
// ========================================================================
// Factory
// ========================================================================
export function initialEnhancedConfigFromWidget(widgetId, widgetType, existingConfig) {
    const state = {
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
            state.container = { ...state.container, ...existingConfig.container };
        }
        if (existingConfig.titleBar && typeof existingConfig.titleBar === 'object') {
            state.titleBar = { ...state.titleBar, ...existingConfig.titleBar };
        }
        if (existingConfig.chart && typeof existingConfig.chart === 'object' && state.chart) {
            state.chart = { ...state.chart, ...existingConfig.chart };
        }
        if (existingConfig.kpi && typeof existingConfig.kpi === 'object' && state.kpi) {
            state.kpi = { ...state.kpi, ...existingConfig.kpi };
        }
        if (existingConfig.scorecard && typeof existingConfig.scorecard === 'object' && state.scorecard) {
            state.scorecard = { ...state.scorecard, ...existingConfig.scorecard };
        }
        if (existingConfig.bottomN && typeof existingConfig.bottomN === 'object' && state.bottomN) {
            state.bottomN = { ...state.bottomN, ...existingConfig.bottomN };
        }
        if (existingConfig.behaviour && typeof existingConfig.behaviour === 'object') {
            state.behaviour = { ...state.behaviour, ...existingConfig.behaviour };
        }
    }
    return state;
}
// ========================================================================
// Section Navigation
// ========================================================================
export function setEnhancedConfigSection(state, section) {
    if (state.activeSection === section)
        return state;
    return { ...state, activeSection: section, dirty: true };
}
// ========================================================================
// Container Appearance
// ========================================================================
export function updateEnhancedContainer(state, patch) {
    return {
        ...state,
        container: { ...state.container, ...patch },
        dirty: true,
    };
}
// ========================================================================
// Title Bar
// ========================================================================
export function updateEnhancedTitleBar(state, patch) {
    return {
        ...state,
        titleBar: { ...state.titleBar, ...patch },
        dirty: true,
    };
}
// ========================================================================
// Chart Appearance
// ========================================================================
export function updateEnhancedChart(state, patch) {
    if (!state.chart)
        return state;
    return {
        ...state,
        chart: { ...state.chart, ...patch },
        dirty: true,
    };
}
// ========================================================================
// KPI Appearance
// ========================================================================
export function updateEnhancedKpi(state, patch) {
    if (!state.kpi)
        return state;
    return {
        ...state,
        kpi: { ...state.kpi, ...patch },
        dirty: true,
    };
}
// ========================================================================
// Scorecard Appearance
// ========================================================================
export function updateEnhancedScorecard(state, patch) {
    if (!state.scorecard)
        return state;
    return {
        ...state,
        scorecard: { ...state.scorecard, ...patch },
        dirty: true,
    };
}
// ========================================================================
// BottomN Appearance
// ========================================================================
export function updateEnhancedBottomN(state, patch) {
    if (!state.bottomN)
        return state;
    return {
        ...state,
        bottomN: { ...state.bottomN, ...patch },
        dirty: true,
    };
}
// ========================================================================
// Behaviour
// ========================================================================
export function updateEnhancedBehaviour(state, patch) {
    return {
        ...state,
        behaviour: { ...state.behaviour, ...patch },
        dirty: true,
    };
}
// ========================================================================
// Accordion
// ========================================================================
export function toggleEnhancedAccordion(state, id) {
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
export function addEnhancedFormattingRule(state, rule) {
    const entry = { ...rule, id: generateId('fr') };
    return {
        ...state,
        formattingRules: [...state.formattingRules, entry],
        dirty: true,
    };
}
export function removeEnhancedFormattingRule(state, ruleId) {
    return {
        ...state,
        formattingRules: state.formattingRules.filter(r => r.id !== ruleId),
        dirty: true,
    };
}
export function updateEnhancedFormattingRule(state, ruleId, patch) {
    return {
        ...state,
        formattingRules: state.formattingRules.map(r => r.id === ruleId ? { ...r, ...patch, id: r.id } : r),
        dirty: true,
    };
}
// ========================================================================
// Overlays
// ========================================================================
export function addEnhancedOverlay(state, overlay) {
    const entry = { ...overlay, id: generateId('ov') };
    return {
        ...state,
        overlays: [...state.overlays, entry],
        dirty: true,
    };
}
export function removeEnhancedOverlay(state, overlayId) {
    return {
        ...state,
        overlays: state.overlays.filter(o => o.id !== overlayId),
        dirty: true,
    };
}
export function updateEnhancedOverlay(state, overlayId, patch) {
    return {
        ...state,
        overlays: state.overlays.map(o => o.id === overlayId ? { ...o, ...patch, id: o.id } : o),
        dirty: true,
    };
}
// ========================================================================
// Thresholds
// ========================================================================
export function addEnhancedThreshold(state, threshold) {
    return {
        ...state,
        thresholds: [...state.thresholds, threshold],
        dirty: true,
    };
}
export function removeEnhancedThreshold(state, index) {
    if (index < 0 || index >= state.thresholds.length)
        return state;
    return {
        ...state,
        thresholds: state.thresholds.filter((_, i) => i !== index),
        dirty: true,
    };
}
// ========================================================================
// Apply to Widget Config
// ========================================================================
export function applyEnhancedConfigToWidget(state) {
    const config = {
        container: { ...state.container },
        titleBar: { ...state.titleBar },
        behaviour: { ...state.behaviour },
    };
    if (state.chart)
        config.chart = { ...state.chart };
    if (state.kpi)
        config.kpi = { ...state.kpi };
    if (state.scorecard)
        config.scorecard = { ...state.scorecard };
    if (state.bottomN)
        config.bottomN = { ...state.bottomN };
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
export function markEnhancedConfigClean(state) {
    return { ...state, dirty: false };
}
//# sourceMappingURL=enhanced-config-state.js.map