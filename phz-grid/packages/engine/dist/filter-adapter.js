/**
 * @phozart/engine — Filter Adapter
 *
 * Bridges CriteriaEngine output (ArtefactCriteria) to widget data filtering.
 * Provides:
 * - applyArtefactCriteria(): pure function that filters rows using FilterCriterion[]
 * - FilterAdapter: stateful adapter managing values, criteria, and subscriptions
 * - globalFiltersToCriteriaBindings(): converts GlobalFilter[] into CriteriaEngine registrations
 */
import { filterDefinitionId } from '@phozart/core';
// --- Pure Filter Application ---
/**
 * Apply ArtefactCriteria filters to a data array, returning matching rows.
 * All filters are combined with AND logic. Null values skip the filter.
 */
export function applyArtefactCriteria(data, criteria) {
    let filtered = data;
    for (const filter of criteria.filters) {
        if (!filter.dataField)
            continue;
        if (filter.value === null && filter.operator !== 'is_null' && filter.operator !== 'is_not_null')
            continue;
        filtered = applyFilterCriterion(filtered, filter);
    }
    return filtered;
}
function applyFilterCriterion(rows, filter) {
    const field = filter.dataField;
    const value = filter.value;
    switch (filter.operator) {
        case 'equals':
            return rows.filter(row => String(row[field] ?? '') === String(value));
        case 'not_equals':
            return rows.filter(row => String(row[field] ?? '') !== String(value));
        case 'in': {
            const vals = Array.isArray(value) ? value : [value];
            return rows.filter(row => vals.includes(String(row[field] ?? '')));
        }
        case 'not_in': {
            const vals = Array.isArray(value) ? value : [value];
            return rows.filter(row => !vals.includes(String(row[field] ?? '')));
        }
        case 'like': {
            const search = String(value).toLowerCase();
            return rows.filter(row => String(row[field] ?? '').toLowerCase().includes(search));
        }
        case 'not_like': {
            const search = String(value).toLowerCase();
            return rows.filter(row => !String(row[field] ?? '').toLowerCase().includes(search));
        }
        case 'starts_with': {
            const prefix = String(value).toLowerCase();
            return rows.filter(row => String(row[field] ?? '').toLowerCase().startsWith(prefix));
        }
        case 'between': {
            if (!Array.isArray(value) || value.length < 2)
                return rows;
            const min = Number(value[0]);
            const max = Number(value[1]);
            return rows.filter(row => {
                const v = Number(row[field]);
                return !isNaN(v) && v >= min && v <= max;
            });
        }
        case 'greater_than': {
            const threshold = Number(value);
            return rows.filter(row => {
                const v = Number(row[field]);
                return !isNaN(v) && v > threshold;
            });
        }
        case 'less_than': {
            const threshold = Number(value);
            return rows.filter(row => {
                const v = Number(row[field]);
                return !isNaN(v) && v < threshold;
            });
        }
        case 'is_null':
            return rows.filter(row => row[field] === null || row[field] === undefined);
        case 'is_not_null':
            return rows.filter(row => row[field] !== null && row[field] !== undefined);
        default:
            return rows;
    }
}
// --- FilterAdapter Factory ---
export function createFilterAdapter(criteriaEngine, artefactId) {
    let currentValues = {};
    let currentCriteria = null;
    const listeners = new Set();
    function rebuild() {
        currentCriteria = criteriaEngine.buildCriteria(artefactId, currentValues);
        for (const listener of listeners) {
            listener(currentCriteria);
        }
    }
    return {
        applyFilters(data) {
            if (!currentCriteria) {
                // Build criteria on demand if not yet built
                currentCriteria = criteriaEngine.buildCriteria(artefactId, currentValues);
            }
            return applyArtefactCriteria(data, currentCriteria);
        },
        setValues(values) {
            currentValues = { ...currentValues, ...values };
            rebuild();
        },
        getValues() {
            return { ...currentValues };
        },
        getCurrentCriteria() {
            return currentCriteria;
        },
        reset() {
            currentValues = {};
            currentCriteria = null;
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}
// --- GlobalFilter to CriteriaEngine Bridge ---
const GLOBAL_FILTER_TYPE_MAP = {
    'select': 'single_select',
    'multi-select': 'multi_select',
    'date-range': 'date_range',
    'text-search': 'search',
    'number-range': 'numeric_range',
};
/**
 * Convert GlobalFilter[] from an EnhancedDashboardConfig into CriteriaEngine
 * filter definitions and bindings. This makes GlobalFilter a thin wrapper
 * over the CriteriaEngine, unifying both filter systems.
 */
export function globalFiltersToCriteriaBindings(criteriaEngine, artId, globalFilters) {
    const now = Date.now();
    for (let i = 0; i < globalFilters.length; i++) {
        const gf = globalFilters[i];
        const defId = filterDefinitionId(gf.id);
        const fieldType = GLOBAL_FILTER_TYPE_MAP[gf.filterType] ?? 'single_select';
        // Register definition if not already present
        if (!criteriaEngine.registry.get(defId)) {
            criteriaEngine.registry.register({
                id: defId,
                label: gf.label,
                type: fieldType,
                sessionBehavior: 'reset',
                dataField: gf.fieldKey,
                defaultValue: gf.defaultValue !== undefined ? String(gf.defaultValue) : undefined,
                createdAt: now,
                updatedAt: now,
            });
        }
        // Bind to artefact
        try {
            criteriaEngine.bindings.bind({
                filterDefinitionId: defId,
                artefactId: artId,
                visible: true,
                order: i,
                targetScope: gf.targetWidgetIds?.map(id => id),
            });
        }
        catch {
            // Already bound — skip
        }
    }
}
//# sourceMappingURL=filter-adapter.js.map