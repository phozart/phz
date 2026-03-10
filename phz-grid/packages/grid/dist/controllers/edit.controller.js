export class EditController {
    constructor(host) {
        this.editingCell = null;
        this.editValue = '';
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    startInlineEdit(row, field) {
        const col = this.host.columnDefs.find(c => c.field === field);
        if (!col || col.editable === false)
            return;
        const value = col.valueGetter ? col.valueGetter(row) : row[field];
        this.editingCell = { rowId: row.__id, field, value };
        this.editValue = String(value ?? '');
        this.host.requestUpdate();
    }
    commitInlineEdit(rawValue) {
        if (!this.editingCell || !this.host.gridApi)
            return;
        const { rowId, field } = this.editingCell;
        const col = this.host.columnDefs.find(c => c.field === field);
        if (col?.type === 'number') {
            if (rawValue.trim() === '') {
                this.host.gridApi.updateRow(rowId, { [field]: null });
            }
            else {
                const num = Number(rawValue);
                if (Number.isNaN(num)) {
                    this.host.toast.show('Invalid number', 'error');
                    return;
                }
                this.host.gridApi.updateRow(rowId, { [field]: num });
            }
        }
        else {
            this.host.gridApi.updateRow(rowId, { [field]: rawValue });
        }
        this.editingCell = null;
        this.host.toast.show('Cell updated', 'success');
        this.host.requestUpdate();
    }
    cancelInlineEdit() {
        this.editingCell = null;
        this.host.requestUpdate();
    }
    isEditing(rowId, field) {
        return this.editingCell?.rowId === rowId && this.editingCell?.field === field;
    }
}
//# sourceMappingURL=edit.controller.js.map