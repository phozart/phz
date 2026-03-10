/**
 * @phozart/phz-workspace — Filter Value Handling Admin State (B-3.07)
 *
 * Pure functions for configuring FilterValueSource (data-source, lookup-table, static),
 * transform configuration, default value setup, and display options
 * (multi-select, free text, count display).
 */
// ========================================================================
// Defaults
// ========================================================================
const DEFAULT_DISPLAY_OPTIONS = {
    showCount: false,
    allowFreeText: false,
    multiSelect: false,
    searchable: true,
    maxVisibleItems: 10,
};
// ========================================================================
// Factory
// ========================================================================
export function initialFilterValueAdminState(filterDefinitionId, valueSource) {
    return {
        filterDefinitionId,
        valueSource: valueSource ?? { type: 'static', values: [] },
        displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
        previewValues: [],
        previewLoading: false,
    };
}
// ========================================================================
// Value source configuration
// ========================================================================
export function setValueSourceType(state, type) {
    let valueSource;
    switch (type) {
        case 'data-source':
            valueSource = { type: 'data-source', dataSourceId: '', field: '' };
            break;
        case 'lookup-table':
            valueSource = { type: 'lookup-table', entries: [] };
            break;
        case 'static':
            valueSource = { type: 'static', values: [] };
            break;
    }
    return { ...state, valueSource };
}
export function updateDataSourceConfig(state, dataSourceId, field) {
    if (state.valueSource.type !== 'data-source')
        return state;
    return {
        ...state,
        valueSource: { ...state.valueSource, dataSourceId, field },
    };
}
export function setStaticValues(state, values) {
    if (state.valueSource.type !== 'static')
        return state;
    return {
        ...state,
        valueSource: { ...state.valueSource, values },
    };
}
export function addLookupEntry(state, entry) {
    if (state.valueSource.type !== 'lookup-table')
        return state;
    const existing = state.valueSource.entries ?? [];
    if (existing.some((e) => e.value === entry.value))
        return state;
    return {
        ...state,
        valueSource: { ...state.valueSource, entries: [...existing, entry] },
    };
}
export function removeLookupEntry(state, value) {
    if (state.valueSource.type !== 'lookup-table')
        return state;
    const entries = (state.valueSource.entries ?? []).filter((e) => e.value !== value);
    return {
        ...state,
        valueSource: { ...state.valueSource, entries },
    };
}
export function reorderLookupEntries(state, fromIndex, toIndex) {
    if (state.valueSource.type !== 'lookup-table')
        return state;
    const entries = [...(state.valueSource.entries ?? [])];
    if (fromIndex < 0 || fromIndex >= entries.length || toIndex < 0 || toIndex >= entries.length) {
        return state;
    }
    const [moved] = entries.splice(fromIndex, 1);
    entries.splice(toIndex, 0, moved);
    return {
        ...state,
        valueSource: { ...state.valueSource, entries },
    };
}
// ========================================================================
// Transform
// ========================================================================
export function setTransform(state, transform) {
    return { ...state, transform };
}
// ========================================================================
// Default value
// ========================================================================
export function setDefaultValue(state, defaultValue) {
    return { ...state, defaultValue };
}
export function setStaticDefault(state, value) {
    return { ...state, defaultValue: { type: 'static', value } };
}
export function setViewerAttributeDefault(state, attribute) {
    return { ...state, defaultValue: { type: 'viewer-attribute', attribute } };
}
export function setRelativeDateDefault(state, offset, unit) {
    return { ...state, defaultValue: { type: 'relative-date', offset, unit } };
}
// ========================================================================
// Display options
// ========================================================================
export function updateDisplayOptions(state, updates) {
    return {
        ...state,
        displayOptions: { ...state.displayOptions, ...updates },
    };
}
export function toggleMultiSelect(state) {
    return {
        ...state,
        displayOptions: {
            ...state.displayOptions,
            multiSelect: !state.displayOptions.multiSelect,
        },
    };
}
export function toggleShowCount(state) {
    return {
        ...state,
        displayOptions: {
            ...state.displayOptions,
            showCount: !state.displayOptions.showCount,
        },
    };
}
export function toggleFreeText(state) {
    return {
        ...state,
        displayOptions: {
            ...state.displayOptions,
            allowFreeText: !state.displayOptions.allowFreeText,
        },
    };
}
// ========================================================================
// Preview
// ========================================================================
export function setPreviewLoading(state, loading) {
    return { ...state, previewLoading: loading };
}
export function setPreviewValues(state, values) {
    return { ...state, previewValues: values, previewLoading: false, previewError: undefined };
}
export function setPreviewError(state, error) {
    return { ...state, previewError: error, previewLoading: false };
}
export function validateFilterValueConfig(state) {
    const errors = [];
    switch (state.valueSource.type) {
        case 'data-source':
            if (!state.valueSource.dataSourceId?.trim()) {
                errors.push('Data source ID is required');
            }
            if (!state.valueSource.field?.trim()) {
                errors.push('Field name is required');
            }
            break;
        case 'lookup-table':
            if (!state.valueSource.entries?.length) {
                errors.push('At least one lookup entry is required');
            }
            break;
        case 'static':
            // Static with empty values is valid (unusual but allowed)
            break;
    }
    if (state.displayOptions.maxVisibleItems < 1) {
        errors.push('Max visible items must be at least 1');
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=filter-value-admin-state.js.map