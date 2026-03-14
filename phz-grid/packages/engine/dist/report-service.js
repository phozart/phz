/**
 * @phozart/engine — Report Service
 *
 * Per-route runtime orchestrator that connects a report's filter definitions
 * to the criteria engine, manages filter state, and produces grid-ready
 * filter parameters. This is the "glue" layer that wires everything together
 * at runtime.
 *
 * Usage:
 *   const service = createReportService(engine, reportId);
 *   service.subscribe((result) => { ... update grid ... });
 *   service.setValue('region', ['EMEA']);
 */
// --- Internal Shared Factory ---
function createArtefactService(resolution, engine) {
    const { artefactId } = resolution;
    const listeners = new Set();
    let currentValues = {};
    // Initialize default values from resolved fields
    for (const field of resolution.fields) {
        if (field.defaultValue !== undefined && field.defaultValue !== null) {
            currentValues[field.id] = field.defaultValue;
        }
    }
    function notify() {
        const params = buildFilterParams();
        for (const listener of listeners) {
            listener(params);
        }
    }
    function buildFilterParams() {
        const fields = resolution.fields;
        const isComplete = fields
            .filter(f => f.required)
            .every(f => {
            const val = currentValues[f.id];
            return val !== null && val !== undefined && val !== '';
        });
        let criteria = null;
        if (fields.length > 0) {
            criteria = engine.criteria.buildCriteria(artefactId, currentValues);
        }
        return {
            fields,
            values: { ...currentValues },
            criteria,
            isComplete,
            source: resolution.source,
            divergence: resolution.divergence,
        };
    }
    return {
        get artefactId() {
            return artefactId;
        },
        getFields() {
            return resolution.fields;
        },
        getValues() {
            return { ...currentValues };
        },
        setValue(fieldId, value) {
            currentValues[fieldId] = value;
            notify();
        },
        setValues(values) {
            currentValues = { ...currentValues, ...values };
            notify();
        },
        reset() {
            currentValues = {};
            for (const field of resolution.fields) {
                if (field.defaultValue !== undefined && field.defaultValue !== null) {
                    currentValues[field.id] = field.defaultValue;
                }
            }
            notify();
        },
        getFilterParams() {
            return buildFilterParams();
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        destroy() {
            listeners.clear();
        },
    };
}
// --- Public Factories ---
export function createReportService(engine, reportId) {
    const resolution = engine.getReportFilters(reportId);
    return createArtefactService(resolution, engine);
}
export function createDashboardService(engine, dashboardId) {
    const resolution = engine.getDashboardFilters(dashboardId);
    return createArtefactService(resolution, engine);
}
//# sourceMappingURL=report-service.js.map