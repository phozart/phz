/**
 * @phozart/phz-engine — Report Configuration
 *
 * Reports define how data is displayed: columns, sorting, filtering,
 * aggregation, grouping, and conditional formatting.
 */
import { reportId, dataProductId } from './types.js';
export function createReportConfigStore() {
    const reports = new Map();
    let blankCounter = 0;
    return {
        createBlank(name) {
            blankCounter++;
            const id = reportId(`rpt-${Date.now()}-${blankCounter}`);
            const now = Date.now();
            return {
                id,
                name: name ?? 'Untitled Report',
                dataProductId: dataProductId(''),
                columns: [],
                created: now,
                updated: now,
            };
        },
        save(config) {
            reports.set(config.id, { ...config, updated: Date.now() });
        },
        get(id) {
            return reports.get(id);
        },
        list() {
            return Array.from(reports.values());
        },
        delete(id) {
            reports.delete(id);
        },
        validate(config) {
            const errors = [];
            if (!config.id)
                errors.push({ path: 'id', message: 'ID is required' });
            if (!config.name)
                errors.push({ path: 'name', message: 'Name is required' });
            if (!config.dataProductId)
                errors.push({ path: 'dataProductId', message: 'Data product is required' });
            if (!config.columns || config.columns.length === 0) {
                errors.push({ path: 'columns', message: 'At least one column is required' });
            }
            return { valid: errors.length === 0, errors };
        },
        toGridConfig(config) {
            const result = {
                columns: config.columns.map(c => ({
                    field: c.field,
                    header: c.header,
                    width: c.width,
                    visible: c.visible,
                })),
                sort: config.sort,
                filter: config.filter,
            };
            if (config.presentation) {
                result.presentation = config.presentation;
            }
            return result;
        },
    };
}
//# sourceMappingURL=report.js.map