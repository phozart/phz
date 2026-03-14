/**
 * @phozart/workspace — Data Config Panel State (B-3.05)
 *
 * Pure functions for managing multi-source data configuration UI.
 * Supports source mapping (field aliases), refresh interval configuration,
 * and loading strategy selection (preload vs full-load).
 */
export const REFRESH_PRESETS = [
    { label: 'Manual', ms: 0 },
    { label: '30 seconds', ms: 30_000 },
    { label: '1 minute', ms: 60_000 },
    { label: '5 minutes', ms: 300_000 },
    { label: '15 minutes', ms: 900_000 },
    { label: '1 hour', ms: 3_600_000 },
];
// ========================================================================
// Factory
// ========================================================================
export function initialDataConfigPanelState() {
    return {
        sources: [],
        defaultLoadingStrategy: 'preload',
        defaultRefreshIntervalMs: 300_000,
    };
}
// ========================================================================
// Source management
// ========================================================================
let sourceCounter = 0;
export function addDataSource(state, dataSourceId, name, maxDataSources) {
    // Capability gate: check max sources limit
    if (maxDataSources !== undefined && state.sources.length >= maxDataSources) {
        return state;
    }
    sourceCounter++;
    const id = `ds_${Date.now()}_${sourceCounter}`;
    const source = {
        id,
        name,
        dataSourceId,
        fieldAliases: [],
        refreshIntervalMs: state.defaultRefreshIntervalMs,
        loadingStrategy: state.defaultLoadingStrategy,
        enabled: true,
    };
    return {
        ...state,
        sources: [...state.sources, source],
        selectedSourceId: id,
    };
}
export function removeDataSource(state, id) {
    return {
        ...state,
        sources: state.sources.filter(s => s.id !== id),
        selectedSourceId: state.selectedSourceId === id ? undefined : state.selectedSourceId,
    };
}
export function selectConfigDataSource(state, id) {
    if (!state.sources.some(s => s.id === id))
        return state;
    return { ...state, selectedSourceId: id };
}
export function toggleDataSourceEnabled(state, id) {
    return {
        ...state,
        sources: state.sources.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    };
}
// ========================================================================
// Field aliases
// ========================================================================
export function addFieldAlias(state, sourceId, sourceField, alias) {
    return {
        ...state,
        sources: state.sources.map(s => {
            if (s.id !== sourceId)
                return s;
            // Replace existing alias for same field, or add new
            const aliases = s.fieldAliases.filter(a => a.sourceField !== sourceField);
            return { ...s, fieldAliases: [...aliases, { sourceField, alias }] };
        }),
    };
}
export function removeFieldAlias(state, sourceId, sourceField) {
    return {
        ...state,
        sources: state.sources.map(s => {
            if (s.id !== sourceId)
                return s;
            return {
                ...s,
                fieldAliases: s.fieldAliases.filter(a => a.sourceField !== sourceField),
            };
        }),
    };
}
// ========================================================================
// Refresh interval
// ========================================================================
export function setRefreshInterval(state, sourceId, ms) {
    if (ms < 0)
        return state;
    return {
        ...state,
        sources: state.sources.map(s => s.id === sourceId ? { ...s, refreshIntervalMs: ms } : s),
    };
}
// ========================================================================
// Loading strategy
// ========================================================================
export function setLoadingStrategy(state, sourceId, strategy) {
    return {
        ...state,
        sources: state.sources.map(s => s.id === sourceId ? { ...s, loadingStrategy: strategy } : s),
    };
}
// ========================================================================
// Max rows
// ========================================================================
export function setMaxRows(state, sourceId, maxRows) {
    if (maxRows !== undefined && maxRows < 0)
        return state;
    return {
        ...state,
        sources: state.sources.map(s => s.id === sourceId ? { ...s, maxRows } : s),
    };
}
// ========================================================================
// Getters
// ========================================================================
export function getSelectedSource(state) {
    return state.sources.find(s => s.id === state.selectedSourceId);
}
export function getEnabledSources(state) {
    return state.sources.filter(s => s.enabled);
}
export function resolveFieldName(source, sourceField) {
    const alias = source.fieldAliases.find(a => a.sourceField === sourceField);
    return alias?.alias ?? sourceField;
}
export function validateDataConfig(state) {
    const errors = [];
    if (state.sources.length === 0) {
        errors.push('At least one data source is required');
    }
    const enabledSources = getEnabledSources(state);
    if (state.sources.length > 0 && enabledSources.length === 0) {
        errors.push('At least one data source must be enabled');
    }
    for (const s of state.sources) {
        if (!s.name.trim()) {
            errors.push(`Data source "${s.id}" has no name`);
        }
        if (!s.dataSourceId.trim()) {
            errors.push(`Data source "${s.name || s.id}" has no data source ID`);
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Reset the source counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetSourceCounter() {
    sourceCounter = 0;
}
//# sourceMappingURL=data-config-panel-state.js.map