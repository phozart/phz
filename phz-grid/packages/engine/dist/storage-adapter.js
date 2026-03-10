/**
 * @phozart/phz-engine — Pluggable Storage Adapter
 *
 * Allows BIEngine state (reports, dashboards, KPIs, metrics) to be
 * persisted and restored across page refreshes. Ships with two adapters:
 * - MemoryStorageAdapter  — in-memory (tests / ephemeral usage)
 * - LocalStorageAdapter   — browser localStorage with namespaced keys
 */
// --- Memory Adapter ---
export class MemoryStorageAdapter {
    reports = new Map();
    dashboards = new Map();
    kpis = new Map();
    metrics = new Map();
    async saveReport(report) {
        this.reports.set(report.id, report);
    }
    async loadReports() {
        return Array.from(this.reports.values());
    }
    async deleteReport(id) {
        this.reports.delete(id);
    }
    async saveDashboard(dashboard) {
        this.dashboards.set(dashboard.id, dashboard);
    }
    async loadDashboards() {
        return Array.from(this.dashboards.values());
    }
    async deleteDashboard(id) {
        this.dashboards.delete(id);
    }
    async saveKPI(kpi) {
        this.kpis.set(kpi.id, kpi);
    }
    async loadKPIs() {
        return Array.from(this.kpis.values());
    }
    async deleteKPI(id) {
        this.kpis.delete(id);
    }
    async saveMetric(metric) {
        this.metrics.set(metric.id, metric);
    }
    async loadMetrics() {
        return Array.from(this.metrics.values());
    }
    async deleteMetric(id) {
        this.metrics.delete(id);
    }
    async clear() {
        this.reports.clear();
        this.dashboards.clear();
        this.kpis.clear();
        this.metrics.clear();
    }
}
export class LocalStorageAdapter {
    storage;
    namespace;
    constructor(storage, namespace) {
        this.storage = storage;
        this.namespace = namespace;
    }
    key(slot) {
        return `${this.namespace}:${slot}`;
    }
    readSlot(slot) {
        try {
            const raw = this.storage.getItem(this.key(slot));
            if (!raw)
                return [];
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    writeSlot(slot, items) {
        this.storage.setItem(this.key(slot), JSON.stringify(items));
    }
    // Reports
    async saveReport(report) {
        const existing = this.readSlot('reports');
        const idx = existing.findIndex(r => r.id === report.id);
        if (idx >= 0)
            existing[idx] = report;
        else
            existing.push(report);
        this.writeSlot('reports', existing);
    }
    async loadReports() {
        return this.readSlot('reports');
    }
    async deleteReport(id) {
        const existing = this.readSlot('reports');
        this.writeSlot('reports', existing.filter(r => r.id !== id));
    }
    // Dashboards
    async saveDashboard(dashboard) {
        const existing = this.readSlot('dashboards');
        const idx = existing.findIndex(d => d.id === dashboard.id);
        if (idx >= 0)
            existing[idx] = dashboard;
        else
            existing.push(dashboard);
        this.writeSlot('dashboards', existing);
    }
    async loadDashboards() {
        return this.readSlot('dashboards');
    }
    async deleteDashboard(id) {
        const existing = this.readSlot('dashboards');
        this.writeSlot('dashboards', existing.filter(d => d.id !== id));
    }
    // KPIs
    async saveKPI(kpi) {
        const existing = this.readSlot('kpis');
        const idx = existing.findIndex(k => k.id === kpi.id);
        if (idx >= 0)
            existing[idx] = kpi;
        else
            existing.push(kpi);
        this.writeSlot('kpis', existing);
    }
    async loadKPIs() {
        return this.readSlot('kpis');
    }
    async deleteKPI(id) {
        const existing = this.readSlot('kpis');
        this.writeSlot('kpis', existing.filter(k => k.id !== id));
    }
    // Metrics
    async saveMetric(metric) {
        const existing = this.readSlot('metrics');
        const idx = existing.findIndex(m => m.id === metric.id);
        if (idx >= 0)
            existing[idx] = metric;
        else
            existing.push(metric);
        this.writeSlot('metrics', existing);
    }
    async loadMetrics() {
        return this.readSlot('metrics');
    }
    async deleteMetric(id) {
        const existing = this.readSlot('metrics');
        this.writeSlot('metrics', existing.filter(m => m.id !== id));
    }
    // Clear
    async clear() {
        this.storage.removeItem(this.key('reports'));
        this.storage.removeItem(this.key('dashboards'));
        this.storage.removeItem(this.key('kpis'));
        this.storage.removeItem(this.key('metrics'));
    }
}
//# sourceMappingURL=storage-adapter.js.map