import { downloadCSV } from '../export/csv-exporter.js';
import { downloadExcel } from '../export/excel-exporter.js';
export class ExportController {
    constructor(host) {
        this.exportIncludeFormatting = false;
        this.exportIncludeGroupHeaders = true;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    exportCSV(options) {
        if (!this.host.gridApi)
            return;
        const colGroups = this.host.columnGroups.length > 0 ? this.host.columnGroups : undefined;
        const groupRows = (options?.includeGroupHeaders !== false && this.host.isGrouped && this.host.groups.length > 0)
            ? this.buildExportGroupRows()
            : undefined;
        const columnTypes = Object.fromEntries(this.host.columnDefs.map(c => [c.field, c.type ?? 'string']));
        // Pass search-filtered rows so export respects toolbar search query.
        const filteredRows = this.host.filteredRows;
        downloadCSV(this.host.gridApi, this.host.columnDefs, {
            ...options,
            rows: filteredRows,
            columnGroups: colGroups,
            groupRows,
            columnTypes,
            dateFormats: options?.includeFormatting ? this.host.dateFormats : undefined,
            numberFormats: options?.includeFormatting ? this.host.numberFormats : undefined,
            compactNumbers: this.host.compactNumbers || undefined,
            dataSetMeta: this.host._dataSetMeta,
        });
        this.host.toast.show(`Exported ${options?.selectedOnly ? 'selected' : filteredRows.length} rows`, 'success', { icon: 'export' });
    }
    exportExcel(options) {
        if (!this.host.gridApi)
            return;
        const colGroups = this.host.columnGroups.length > 0 ? this.host.columnGroups : undefined;
        const groupRows = (options?.includeGroupHeaders !== false && this.host.isGrouped && this.host.groups.length > 0)
            ? this.buildExportGroupRows()
            : undefined;
        const columnTypes = Object.fromEntries(this.host.columnDefs.map(c => [c.field, c.type ?? 'string']));
        // Pass search-filtered rows so export respects toolbar search query.
        const filteredRows = this.host.filteredRows;
        downloadExcel(this.host.gridApi, this.host.columnDefs, {
            ...options,
            rows: filteredRows,
            columnGroups: colGroups,
            groupRows,
            columnTypes,
            dateFormats: options?.includeFormatting ? this.host.dateFormats : undefined,
            numberFormats: options?.includeFormatting ? this.host.numberFormats : undefined,
            statusColors: options?.includeFormatting ? this.host.statusColors : undefined,
            barThresholds: options?.includeFormatting ? this.host.barThresholds : undefined,
            gridLines: this.host.gridLines !== 'none' ? this.host.gridLines : undefined,
            gridLineColor: this.host.gridLineColor,
            compactNumbers: this.host.compactNumbers || undefined,
            dataSetMeta: this.host._dataSetMeta,
        });
        this.host.toast.show('Exported to Excel', 'success', { icon: 'export' });
    }
    buildExportGroupRows() {
        const result = [];
        const fn = this.host.aggregationFn;
        const walkGroups = (groups, depth) => {
            for (const group of groups) {
                const aggregations = {};
                const allRows = group.rows;
                for (const col of this.host.columnDefs) {
                    aggregations[col.field] = this.computeGroupColumnAgg(allRows, col, fn);
                }
                const indent = '\u00A0\u00A0'.repeat(depth);
                result.push({
                    type: 'group-header',
                    label: `${indent}${String(group.value)} (${allRows.length})`,
                    depth,
                    aggregations,
                });
                if (group.subGroups && group.subGroups.length > 0) {
                    walkGroups(group.subGroups, depth + 1);
                }
                else {
                    for (const row of allRows) {
                        result.push({ type: 'data', data: row });
                    }
                }
            }
        };
        walkGroups(this.host.groups, 0);
        return result;
    }
    computeGroupColumnAgg(rows, col, fn) {
        const values = rows
            .map(r => col.valueGetter ? col.valueGetter(r) : r[col.field])
            .filter(v => v != null && v !== '');
        switch (fn) {
            case 'count': return String(values.length);
            case 'sum': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                return nums.reduce((s, n) => s + n, 0).toLocaleString();
            }
            case 'avg': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                if (nums.length === 0)
                    return '0';
                return (nums.reduce((s, n) => s + n, 0) / nums.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
            }
            case 'min': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                return nums.length ? nums.reduce((m, v) => v < m ? v : m, Infinity).toLocaleString() : '';
            }
            case 'max': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                return nums.length ? nums.reduce((m, v) => v > m ? v : m, -Infinity).toLocaleString() : '';
            }
            default: return String(values.length);
        }
    }
}
//# sourceMappingURL=export.controller.js.map