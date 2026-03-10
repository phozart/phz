import { formatCellForCopy } from '../clipboard/copy-engine.js';
/** Format a number in compact form: 1234 → 1.2K, 1500000 → 1.5M, 2000000000 → 2B */
export function formatCompactNumber(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9)
        return sign + (abs / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (abs >= 1e6)
        return sign + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3)
        return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}
function sanitizeFormulaInjection(str) {
    if (str.length > 0 && /^[=+\-@\t\r|]/.test(str)) {
        return "'" + str;
    }
    return str;
}
function escapeCSV(value, separator) {
    if (value == null)
        return '';
    let str = String(value);
    str = sanitizeFormulaInjection(str);
    if (str.includes(separator) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
function formatCellValue(value, col, options) {
    if (!options.includeFormatting) {
        const formatted = col.valueFormatter ? col.valueFormatter(value) : value;
        return String(formatted ?? '');
    }
    const colType = options.columnTypes?.[col.field] ?? col.type ?? 'string';
    const dateFormat = options.dateFormats?.[col.field];
    let text = formatCellForCopy(value, colType, true, dateFormat);
    // Compact numbers
    if (options.compactNumbers && colType === 'number' && typeof value === 'number') {
        return formatCompactNumber(value);
    }
    // Apply number formatting
    if (colType === 'number' && typeof value === 'number' && options.numberFormats?.[col.field]) {
        const nf = options.numberFormats[col.field];
        const formatted = nf.decimals !== undefined ? value.toFixed(nf.decimals) : value.toLocaleString();
        const prefix = nf.prefix || '';
        let suffix = nf.suffix || '';
        if (nf.display === 'percent')
            suffix = '%';
        if (nf.display === 'currency' && !prefix)
            text = '$' + formatted + suffix;
        else
            text = prefix + formatted + suffix;
    }
    return text;
}
export function exportToCSV(gridApi, columnDefs, options = {}) {
    const { includeHeaders = true, separator = ',', selectedOnly = false, columns, } = options;
    let cols = columns
        ? columnDefs.filter(c => columns.includes(c.field))
        : columnDefs;
    // Exclude restricted fields
    if (options.excludeFields?.size) {
        cols = cols.filter(c => !options.excludeFields.has(c.field));
    }
    const lines = [];
    // Criteria metadata header
    if (options.criteriaMetadata) {
        lines.push(escapeCSV(options.criteriaMetadata.label, separator));
        for (const entry of options.criteriaMetadata.entries) {
            lines.push(`${escapeCSV(entry.fieldLabel, separator)}${separator}${escapeCSV(entry.displayValue, separator)}`);
        }
        lines.push(''); // blank line separator
    }
    // DataSet metadata header (when no criteria metadata already present)
    if (!options.criteriaMetadata && options.dataSetMeta) {
        const meta = options.dataSetMeta;
        if (meta.source)
            lines.push(`Source${separator}${escapeCSV(meta.source, separator)}`);
        if (meta.lastUpdated)
            lines.push(`Generated${separator}${escapeCSV(meta.lastUpdated, separator)}`);
        if (meta.source || meta.lastUpdated)
            lines.push('');
    }
    if (includeHeaders) {
        // Add column group header row if groups are present
        if (options.columnGroups && options.columnGroups.length > 0) {
            const fieldToGroup = new Map();
            for (const group of options.columnGroups) {
                for (const child of group.children) {
                    fieldToGroup.set(child, group.header);
                }
            }
            lines.push(cols.map(c => escapeCSV(fieldToGroup.get(c.field) ?? '', separator)).join(separator));
        }
        lines.push(cols.map(c => escapeCSV(c.header ?? c.field, separator)).join(separator));
    }
    // If grouped rows are provided, use them instead of flat rows
    if (options.groupRows && options.groupRows.length > 0) {
        for (const gr of options.groupRows) {
            if (gr.type === 'group-header') {
                // Group header: label in first column, aggregation values in subsequent columns
                const cells = cols.map((col, i) => {
                    if (i === 0)
                        return escapeCSV(gr.label ?? '', separator);
                    const aggVal = gr.aggregations?.[col.field];
                    return escapeCSV(aggVal ?? '', separator);
                });
                lines.push(cells.join(separator));
            }
            else if (gr.type === 'data' && gr.data) {
                const row = gr.data;
                const values = cols.map(col => {
                    const val = col.valueGetter ? col.valueGetter(row) : row[col.field];
                    return escapeCSV(formatCellValue(val, col, options), separator);
                });
                lines.push(values.join(separator));
            }
        }
    }
    else {
        // Flat rows — use sorted row model
        const allRows = gridApi.getSortedRowModel().rows;
        let dataRows;
        if (selectedOnly) {
            const sel = gridApi.getSelection();
            const selectedSet = new Set(sel.rows);
            dataRows = allRows.filter(r => selectedSet.has(r.__id));
        }
        else {
            dataRows = allRows;
        }
        for (const row of dataRows) {
            const values = cols.map(col => {
                const val = col.valueGetter ? col.valueGetter(row) : row[col.field];
                // Apply mask function for sensitive columns
                const maskFn = options.maskFields?.get(col.field);
                if (maskFn)
                    return escapeCSV(maskFn(val), separator);
                return escapeCSV(formatCellValue(val, col, options), separator);
            });
            lines.push(values.join(separator));
        }
    }
    return lines.join('\n');
}
export function downloadCSV(gridApi, columnDefs, options = {}) {
    const { filename = 'export.csv' } = options;
    const csv = exportToCSV(gridApi, columnDefs, options);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=csv-exporter.js.map