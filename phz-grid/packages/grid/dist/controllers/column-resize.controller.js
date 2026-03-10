export class ColumnResizeController {
    constructor(host) {
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    startResize(e, field) {
        if (!this.host.gridApi)
            return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const colState = this.host.gridApi.getColumnState();
        const startWidth = colState.widths[field] ?? 150;
        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(60, startWidth + deltaX);
            this.host.gridApi?.setColumnWidth(field, newWidth);
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    autoFitColumn(e, field) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.host.gridApi)
            return;
        const col = this.host.columnDefs.find(c => c.field === field);
        if (!col)
            return;
        let maxWidth = 60;
        for (const row of this.host.visibleRows.slice(0, 100)) {
            const val = row[col.field];
            if (val != null) {
                maxWidth = Math.max(maxWidth, String(val).length * 8 + 32);
            }
        }
        const headerMinWidth = Math.min((col.header ?? col.field).length * 5 + 40, 180);
        maxWidth = Math.max(maxWidth, headerMinWidth);
        maxWidth = Math.min(maxWidth, 500);
        maxWidth = Math.max(maxWidth, 60);
        this.host.gridApi.setColumnWidth(field, maxWidth);
    }
    autoSizeAllColumns() {
        if (!this.host.gridApi)
            return;
        for (const col of this.host.columnDefs) {
            this.autoFitColumn(new MouseEvent('dblclick'), col.field);
        }
    }
}
//# sourceMappingURL=column-resize.controller.js.map