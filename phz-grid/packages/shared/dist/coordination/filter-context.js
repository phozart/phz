/**
 * @phozart/phz-shared — FilterContext (A-1.05)
 *
 * Centralized filter state manager for dashboards. Merges four filter levels:
 * global -> dashboard defaults -> user/widget filters -> cross-filters.
 *
 * Supports multi-source field mapping resolution and debounced dispatch.
 * Join-aware filter propagation respects SourceRelationship join directions.
 *
 * Extracted from workspace/filters/filter-context.ts as pure types + functions.
 */
import { isJoinPropagationAllowed } from '../types/source-relationship.js';
// ========================================================================
// Field resolution
// ========================================================================
export function resolveFieldForSource(canonicalField, dataSourceId, mappings) {
    const mapping = mappings.find(m => m.canonicalField === canonicalField);
    if (!mapping)
        return canonicalField;
    const source = mapping.sources.find(s => s.dataSourceId === dataSourceId);
    return source ? source.field : canonicalField;
}
// ========================================================================
// createFilterContext
// ========================================================================
export function createFilterContext(options) {
    const dashboardFilters = options?.dashboardFilters ?? [];
    const fieldMappings = options?.fieldMappings ?? [];
    const sourceRelationships = options?.sourceRelationships ?? [];
    const values = new Map();
    const activeFilterIds = new Set();
    let crossFilters = [];
    let lastUpdated = Date.now();
    let source = 'default';
    const listeners = new Set();
    function notify() {
        lastUpdated = Date.now();
        for (const listener of listeners) {
            listener();
        }
    }
    function getState() {
        return {
            values: new Map(values),
            activeFilterIds: new Set(activeFilterIds),
            crossFilters: [...crossFilters],
            lastUpdated,
            source,
        };
    }
    function setFilter(filter) {
        values.set(filter.filterId, filter);
        activeFilterIds.add(filter.filterId);
        if (source === 'default')
            source = 'user';
        notify();
    }
    function clearFilter(filterId) {
        if (values.delete(filterId)) {
            activeFilterIds.delete(filterId);
            notify();
        }
    }
    function clearAll() {
        values.clear();
        activeFilterIds.clear();
        crossFilters = [];
        notify();
    }
    function applyCrossFilter(entry) {
        crossFilters = crossFilters.filter(cf => cf.sourceWidgetId !== entry.sourceWidgetId);
        crossFilters.push(entry);
        notify();
    }
    function clearCrossFilter(widgetId) {
        crossFilters = crossFilters.filter(cf => cf.sourceWidgetId !== widgetId);
        notify();
    }
    function resolveFilters(widgetId) {
        const result = [];
        const seenFields = new Set();
        // Layer 1+2: User/widget filters (highest priority)
        for (const filter of values.values()) {
            result.push(filter);
            seenFields.add(filter.field);
        }
        // Layer 3: Cross-filters (exclude ones from requesting widget)
        for (const cf of crossFilters) {
            if (widgetId && cf.sourceWidgetId === widgetId)
                continue;
            if (!seenFields.has(cf.field)) {
                result.push({
                    filterId: `_cross_${cf.sourceWidgetId}_${cf.field}`,
                    field: cf.field,
                    operator: 'equals',
                    value: cf.value,
                    label: `Cross-filter: ${cf.field}`,
                });
                seenFields.add(cf.field);
            }
        }
        // Layer 4: Dashboard defaults (lowest priority, only if not overridden)
        for (const def of dashboardFilters) {
            if (!seenFields.has(def.field) && def.defaultValue !== undefined) {
                result.push({
                    filterId: `_default_${def.id}`,
                    field: def.field,
                    operator: 'equals',
                    value: def.defaultValue,
                    label: `${def.label}: ${def.defaultValue}`,
                });
                seenFields.add(def.field);
            }
        }
        return result;
    }
    function resolveFiltersForSource(dataSourceId, widgetId) {
        const filters = resolveFilters(widgetId);
        if (fieldMappings.length === 0)
            return filters;
        return filters.map(f => ({
            ...f,
            field: resolveFieldForSource(f.field, dataSourceId, fieldMappings),
        }));
    }
    function resolveFiltersForSourceWithJoins(targetSourceId, filterOriginSourceId, widgetId) {
        const allFilters = resolveFilters(widgetId);
        if (sourceRelationships.length === 0 || !filterOriginSourceId) {
            // No join constraints — fall back to standard field mapping resolution
            return resolveFiltersForSource(targetSourceId, widgetId);
        }
        // If same source, no join check needed
        if (filterOriginSourceId === targetSourceId) {
            return allFilters.map(f => ({
                ...f,
                field: resolveFieldForSource(f.field, targetSourceId, fieldMappings),
            }));
        }
        // Check join propagation permission
        if (!isJoinPropagationAllowed(sourceRelationships, filterOriginSourceId, targetSourceId)) {
            return []; // Propagation not allowed by join direction
        }
        // Propagation allowed — resolve field mappings for target source
        return allFilters.map(f => ({
            ...f,
            field: resolveFieldForSource(f.field, targetSourceId, fieldMappings),
        }));
    }
    function subscribe(listener) {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }
    function setSourceFn(s) {
        source = s;
    }
    return {
        getState,
        setFilter,
        clearFilter,
        clearAll,
        applyCrossFilter,
        clearCrossFilter,
        resolveFilters,
        resolveFiltersForSource,
        resolveFiltersForSourceWithJoins,
        subscribe,
        setSource: setSourceFn,
    };
}
export function createDebouncedFilterDispatch(handler, intervalMs = 150) {
    let timer = null;
    let abortListener = null;
    function cleanup() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        abortListener = null;
    }
    function dispatch(value, signal) {
        cleanup();
        if (signal?.aborted)
            return;
        if (signal) {
            abortListener = () => cleanup();
            signal.addEventListener('abort', abortListener, { once: true });
        }
        timer = setTimeout(() => {
            timer = null;
            if (signal) {
                signal.removeEventListener('abort', abortListener);
            }
            if (!signal?.aborted) {
                handler(value);
            }
        }, intervalMs);
    }
    dispatch.cancel = cleanup;
    return dispatch;
}
//# sourceMappingURL=filter-context.js.map