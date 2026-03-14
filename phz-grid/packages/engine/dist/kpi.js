/**
 * @phozart/engine — KPI Definitions & Registry
 *
 * KPIs are first-class entities with targets, thresholds, status classification,
 * breakdowns, delta comparison, and visualization defaults.
 */
export function createKPIRegistry(dataProducts) {
    const kpis = new Map();
    let orderedIds = [];
    return {
        register(kpi) {
            kpis.set(kpi.id, kpi);
            if (!orderedIds.includes(kpi.id)) {
                orderedIds.push(kpi.id);
            }
        },
        get(id) {
            return kpis.get(id);
        },
        list() {
            return orderedIds
                .map(id => kpis.get(id))
                .filter((k) => k !== undefined);
        },
        listByCategory(category) {
            return this.list().filter(k => k.category === category);
        },
        remove(id) {
            kpis.delete(id);
            orderedIds = orderedIds.filter(i => i !== id);
        },
        validate(kpi) {
            const errors = [];
            if (!kpi.id)
                errors.push({ path: 'id', message: 'ID is required' });
            if (!kpi.name)
                errors.push({ path: 'name', message: 'Name is required' });
            if (kpi.target === undefined)
                errors.push({ path: 'target', message: 'Target is required' });
            if (!kpi.unit)
                errors.push({ path: 'unit', message: 'Unit is required' });
            if (!kpi.direction)
                errors.push({ path: 'direction', message: 'Direction is required' });
            if (!kpi.thresholds) {
                errors.push({ path: 'thresholds', message: 'Thresholds are required' });
            }
            else {
                if (kpi.thresholds.ok === undefined)
                    errors.push({ path: 'thresholds.ok', message: 'OK threshold is required' });
                if (kpi.thresholds.warn === undefined)
                    errors.push({ path: 'thresholds.warn', message: 'Warn threshold is required' });
            }
            if (!kpi.dataSource)
                errors.push({ path: 'dataSource', message: 'Data source is required' });
            return { valid: errors.length === 0, errors };
        },
        reorder(ids) {
            orderedIds = ids.filter(id => kpis.has(id));
            // Append any registered KPIs not in the provided order
            for (const id of kpis.keys()) {
                if (!orderedIds.includes(id)) {
                    orderedIds.push(id);
                }
            }
        },
    };
}
//# sourceMappingURL=kpi.js.map