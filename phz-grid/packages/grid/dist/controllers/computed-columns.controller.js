export class ComputedColumnsController {
    constructor(host) {
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    applyComputedColumns(computedColumns) {
        if (computedColumns.length === 0)
            return;
        const existingFields = new Set(this.host.columnDefs.map(c => c.field));
        const newCols = [];
        for (const cc of computedColumns) {
            if (existingFields.has(cc.field))
                continue;
            newCols.push({ field: cc.field, header: cc.header, type: 'string' });
            for (const row of this.host.visibleRows) {
                row[cc.field] = cc.formula(row);
            }
        }
        if (newCols.length > 0) {
            this.host.setColumnDefs([...this.host.columnDefs, ...newCols]);
        }
    }
}
//# sourceMappingURL=computed-columns.controller.js.map