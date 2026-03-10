import { formatDate, DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT } from './date-formatter.js';
export function formatCellValue(value, col, opts) {
    if (value == null)
        return '';
    const field = col.field;
    const numFmt = opts.numberFormats[field];
    const dateFmt = opts.dateFormats[field];
    if (col.type === 'date' || col.type === 'datetime') {
        if (value instanceof Date) {
            return formatDate(value, dateFmt ?? (col.type === 'datetime' ? DEFAULT_DATETIME_FORMAT : DEFAULT_DATE_FORMAT));
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return formatDate(new Date(value), dateFmt ?? (col.type === 'datetime' ? DEFAULT_DATETIME_FORMAT : DEFAULT_DATE_FORMAT));
        }
    }
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '')) {
        const num = Number(value);
        if (numFmt) {
            const { decimals, display, prefix = '', suffix = '' } = numFmt;
            const formatted = num.toLocaleString(opts.locale, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                style: display === 'percent' ? 'percent' : display === 'currency' ? 'currency' : undefined,
                currency: display === 'currency' ? 'USD' : undefined,
            });
            return `${prefix}${formatted}${suffix}`;
        }
        if (opts.compactNumbers) {
            if (Math.abs(num) >= 1_000_000)
                return (num / 1_000_000).toFixed(1) + 'M';
            if (Math.abs(num) >= 1_000)
                return (num / 1_000).toFixed(1) + 'K';
        }
    }
    if (col.renderer) {
        return String(col.renderer({ value, row: {}, column: col, rowIndex: 0, isSelected: false, isEditing: false }));
    }
    return String(value);
}
//# sourceMappingURL=cell-formatter.js.map