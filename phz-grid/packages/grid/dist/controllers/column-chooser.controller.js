export class ColumnChooserController {
    constructor(host) {
        this.columnChooserOpen = false;
        this.colPanelOpen = false;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    open() {
        this.columnChooserOpen = true;
        this.host.requestUpdate();
    }
    close() {
        this.columnChooserOpen = false;
        this.host.requestUpdate();
    }
    handleColumnChooserChange(detail) {
        const { visibility, order } = detail;
        const newDefs = this.host.columnDefs
            .map(c => ({ ...c, hidden: visibility[c.field] === false }))
            .sort((a, b) => {
            const ai = order.indexOf(a.field);
            const bi = order.indexOf(b.field);
            return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
        });
        this.host.setColumnDefs(newDefs);
    }
    hideColumn(field) {
        const newDefs = this.host.columnDefs.map(c => c.field === field ? { ...c, hidden: true } : c);
        this.host.setColumnDefs(newDefs);
    }
}
//# sourceMappingURL=column-chooser.controller.js.map