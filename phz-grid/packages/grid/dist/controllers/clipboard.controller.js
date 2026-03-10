import { formatCellForCopy, copyToClipboard, buildCopyText } from '../clipboard/copy-engine.js';
export class ClipboardController {
    constructor(host) {
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    copyCell(rowId, field) {
        const row = this.host.visibleRows.find(r => r.__id === rowId);
        if (!row)
            return;
        const col = this.host.columnDefs.find(c => c.field === field);
        const colType = col?.type ?? 'string';
        const text = formatCellForCopy(row[field], colType, this.host.copyFormatted, this.host.dateFormats[field]);
        copyToClipboard(text);
        this.host.toast.show('Cell copied', 'success');
    }
    copyRow(rowId) {
        const row = this.host.visibleRows.find(r => r.__id === rowId);
        if (!row)
            return;
        const cols = this.host.columnDefs.filter(c => !this.host.excludeFieldsFromCopy.includes(c.field));
        const result = buildCopyText([row], cols, { includeHeaders: this.host.copyHeaders, formatted: this.host.copyFormatted, dateFormats: this.host.dateFormats });
        copyToClipboard(result.text);
        this.host.toast.show('Row copied', 'success');
    }
    copyCellRange(includeHeaders) {
        if (!this.host.cellRangeAnchor || !this.host.cellRangeEnd)
            return;
        const { rowIndex: r1, colIndex: c1 } = this.host.cellRangeAnchor;
        const { rowIndex: r2, colIndex: c2 } = this.host.cellRangeEnd;
        const minR = Math.min(r1, r2);
        const maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);
        const rows = this.host.visibleRows.slice(minR, maxR + 1);
        const cols = this.host.columnDefs.slice(minC, maxC + 1).filter(c => !this.host.excludeFieldsFromCopy.includes(c.field));
        const result = buildCopyText(rows, cols, { includeHeaders, formatted: this.host.copyFormatted, dateFormats: this.host.dateFormats });
        copyToClipboard(result.text);
        this.host.toast.show(`${rows.length * cols.length} cells copied`, 'success');
    }
    copySelectedRows(includeHeaders) {
        const rows = this.host.visibleRows.filter(r => this.host.selectedRowIds.has(r.__id));
        const cols = this.host.columnDefs.filter(c => !this.host.excludeFieldsFromCopy.includes(c.field));
        if (this.host.maxCopyRows > 0 && rows.length > this.host.maxCopyRows) {
            this.host.toast.show(`Cannot copy more than ${this.host.maxCopyRows} rows`, 'error');
            return;
        }
        const result = buildCopyText(rows, cols, { includeHeaders, formatted: this.host.copyFormatted, dateFormats: this.host.dateFormats });
        copyToClipboard(result.text);
        this.host.toast.show(`${rows.length} rows copied`, 'success');
    }
}
//# sourceMappingURL=clipboard.controller.js.map