export class GroupController {
    constructor(host) {
        this.groups = [];
        this.isGrouped = false;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    applyGrouping() {
        if (!this.host.gridApi)
            return;
        const fields = this.host.groupByLevels.length > 0
            ? this.host.groupByLevels.flat()
            : this.host.groupBy;
        if (fields.length > 0) {
            this.host.gridApi.groupBy(fields);
            const model = this.host.gridApi.getGroupedRowModel();
            this.groups = model.groups;
            this.isGrouped = true;
        }
        else {
            this.groups = [];
            this.isGrouped = false;
        }
        this.host.requestUpdate();
    }
    groupByField(field) {
        this.host.groupBy = [field];
        this.applyGrouping();
    }
    ungroupBy() {
        this.host.groupBy = [];
        this.host.groupByLevels = [];
        this.applyGrouping();
    }
}
//# sourceMappingURL=group.controller.js.map