/**
 * @phozart/phz-workspace — FetchWorkspaceAdapter
 *
 * REST client implementing WorkspaceAdapter that delegates to a server.
 */
export class FetchWorkspaceAdapter {
    constructor(options) {
        // Strip trailing slash
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
    }
    async request(path, options = {}) {
        const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: { ...this.headers, ...options.headers },
        });
        if (!response.ok) {
            throw new Error(`Workspace API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    async requestOptional(path, options = {}) {
        const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: { ...this.headers, ...options.headers },
        });
        if (response.status === 404)
            return undefined;
        if (!response.ok) {
            throw new Error(`Workspace API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    buildQueryString(params) {
        const entries = Object.entries(params).filter((e) => e[1] !== undefined);
        if (entries.length === 0)
            return '';
        return '?' + new URLSearchParams(entries).toString();
    }
    // --- Initialize ---
    async initialize() {
        await this.request('/health', { method: 'GET' });
    }
    // --- Reports ---
    async saveReport(report) {
        await this.request('/reports', { method: 'POST', body: JSON.stringify(report) });
    }
    async loadReports() {
        return this.request('/reports', { method: 'GET' });
    }
    async deleteReport(id) {
        await this.request(`/reports/${id}`, { method: 'DELETE' });
    }
    // --- Dashboards ---
    async saveDashboard(dashboard) {
        await this.request('/dashboards', { method: 'POST', body: JSON.stringify(dashboard) });
    }
    async loadDashboards() {
        return this.request('/dashboards', { method: 'GET' });
    }
    async deleteDashboard(id) {
        await this.request(`/dashboards/${id}`, { method: 'DELETE' });
    }
    // --- KPIs ---
    async saveKPI(kpi) {
        await this.request('/kpis', { method: 'POST', body: JSON.stringify(kpi) });
    }
    async loadKPIs() {
        return this.request('/kpis', { method: 'GET' });
    }
    async deleteKPI(id) {
        await this.request(`/kpis/${id}`, { method: 'DELETE' });
    }
    // --- Metrics ---
    async saveMetric(metric) {
        await this.request('/metrics', { method: 'POST', body: JSON.stringify(metric) });
    }
    async loadMetrics() {
        return this.request('/metrics', { method: 'GET' });
    }
    async deleteMetric(id) {
        await this.request(`/metrics/${id}`, { method: 'DELETE' });
    }
    // --- Definitions (AsyncDefinitionStore) ---
    async save(def) {
        return this.request('/definitions', { method: 'POST', body: JSON.stringify(def) });
    }
    async load(id) {
        return this.requestOptional(`/definitions/${id}`, { method: 'GET' });
    }
    async list() {
        return this.request('/definitions', { method: 'GET' });
    }
    async delete(id) {
        const result = await this.request(`/definitions/${id}`, { method: 'DELETE' });
        return result.deleted;
    }
    async duplicate(id, options) {
        return this.requestOptional(`/definitions/${id}/duplicate`, { method: 'POST', body: JSON.stringify(options ?? {}) });
    }
    // --- Placements ---
    async savePlacement(placement) {
        return this.request('/placements', { method: 'POST', body: JSON.stringify(placement) });
    }
    async loadPlacements(filter) {
        const qs = filter
            ? this.buildQueryString({
                artifactId: filter.artifactId,
                artifactType: filter.artifactType,
                target: filter.target,
            })
            : '';
        return this.request(`/placements${qs}`, { method: 'GET' });
    }
    async deletePlacement(id) {
        await this.request(`/placements/${id}`, { method: 'DELETE' });
    }
    // --- Catalog ---
    async listArtifacts(filter) {
        const qs = filter
            ? this.buildQueryString({
                type: filter.type,
                search: filter.search,
                published: filter.published !== undefined ? String(filter.published) : undefined,
            })
            : '';
        return this.request(`/artifacts${qs}`, { method: 'GET' });
    }
    // --- Breach Store ---
    async saveAlertRule(rule) {
        await this.request('/alert-rules', { method: 'POST', body: JSON.stringify(rule) });
    }
    async loadAlertRules(artifactId) {
        const qs = artifactId ? this.buildQueryString({ artifactId }) : '';
        return this.request(`/alert-rules${qs}`, { method: 'GET' });
    }
    async deleteAlertRule(ruleId) {
        await this.request(`/alert-rules/${ruleId}`, { method: 'DELETE' });
    }
    async saveBreachRecord(breach) {
        await this.request('/breaches', { method: 'POST', body: JSON.stringify(breach) });
    }
    async loadActiveBreaches(artifactId) {
        const qs = artifactId ? this.buildQueryString({ artifactId }) : '';
        return this.request(`/breaches/active${qs}`, { method: 'GET' });
    }
    async updateBreachStatus(breachId, status) {
        await this.request(`/breaches/${breachId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }
    async saveSubscription(sub) {
        await this.request('/subscriptions', { method: 'POST', body: JSON.stringify(sub) });
    }
    async loadSubscriptions(ruleId) {
        const qs = ruleId ? this.buildQueryString({ ruleId: ruleId }) : '';
        return this.request(`/subscriptions${qs}`, { method: 'GET' });
    }
    // --- Template Store ---
    async saveTemplate(template) {
        await this.request('/templates', { method: 'POST', body: JSON.stringify(template) });
    }
    async loadTemplates() {
        return this.request('/templates', { method: 'GET' });
    }
    async deleteTemplate(id) {
        await this.request(`/templates/${id}`, { method: 'DELETE' });
    }
    // --- Clear ---
    async clear() {
        await this.request('/clear', { method: 'POST' });
    }
}
//# sourceMappingURL=fetch-adapter.js.map