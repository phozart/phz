/**
 * @phozart/phz-workspace — MemoryWorkspaceAdapter
 *
 * In-memory implementation of WorkspaceAdapter for testing and ephemeral usage.
 */
import { createDefinitionId } from '@phozart/phz-shared/definitions';
export class MemoryWorkspaceAdapter {
    constructor() {
        this.reports = new Map();
        this.dashboards = new Map();
        this.kpis = new Map();
        this.metrics = new Map();
        this.definitions = new Map();
        this.placements = new Map();
        this.alertRules = new Map();
        this.breaches = new Map();
        this.subscriptions = new Map();
        this.templates = new Map();
        this.history = new Map();
    }
    // --- Initialize ---
    async initialize() {
        // No-op for memory adapter
    }
    // --- EngineStorageAdapter: Reports ---
    async saveReport(report) {
        this.reports.set(report.id, report);
        this.recordVersion(report.id, structuredClone(report));
    }
    async loadReports() {
        return Array.from(this.reports.values());
    }
    async deleteReport(id) {
        this.reports.delete(id);
    }
    // --- EngineStorageAdapter: Dashboards ---
    async saveDashboard(dashboard) {
        this.dashboards.set(dashboard.id, dashboard);
    }
    async loadDashboards() {
        return Array.from(this.dashboards.values());
    }
    async deleteDashboard(id) {
        this.dashboards.delete(id);
    }
    // --- EngineStorageAdapter: KPIs ---
    async saveKPI(kpi) {
        this.kpis.set(kpi.id, kpi);
    }
    async loadKPIs() {
        return Array.from(this.kpis.values());
    }
    async deleteKPI(id) {
        this.kpis.delete(id);
    }
    // --- EngineStorageAdapter: Metrics ---
    async saveMetric(metric) {
        this.metrics.set(metric.id, metric);
    }
    async loadMetrics() {
        return Array.from(this.metrics.values());
    }
    async deleteMetric(id) {
        this.metrics.delete(id);
    }
    // --- AsyncDefinitionStore ---
    async save(def) {
        const now = new Date().toISOString();
        const saved = {
            ...def,
            updatedAt: now,
            createdAt: def.createdAt || now,
        };
        this.definitions.set(def.id, saved);
        return saved;
    }
    async load(id) {
        return this.definitions.get(id);
    }
    async list() {
        return Array.from(this.definitions.values()).map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            updatedAt: d.updatedAt,
        }));
    }
    async delete(id) {
        return this.definitions.delete(id);
    }
    async duplicate(id, options) {
        const original = this.definitions.get(id);
        if (!original)
            return undefined;
        const now = new Date().toISOString();
        const copy = {
            ...structuredClone(original),
            id: createDefinitionId(),
            name: options?.name ?? `${original.name} (Copy)`,
            createdAt: now,
            updatedAt: now,
        };
        this.definitions.set(copy.id, copy);
        return copy;
    }
    // --- Placements ---
    async savePlacement(placement) {
        this.placements.set(placement.id, placement);
        return placement;
    }
    async loadPlacements(filter) {
        let results = Array.from(this.placements.values());
        if (filter?.artifactId) {
            results = results.filter(p => p.artifactId === filter.artifactId);
        }
        if (filter?.artifactType) {
            results = results.filter(p => p.artifactType === filter.artifactType);
        }
        if (filter?.target) {
            results = results.filter(p => p.target === filter.target);
        }
        return results;
    }
    async deletePlacement(id) {
        this.placements.delete(id);
    }
    // --- Catalog ---
    async listArtifacts(filter) {
        const artifacts = [];
        for (const r of this.reports.values()) {
            artifacts.push({
                id: r.id,
                type: 'report',
                name: r.name,
                description: r.description,
                createdAt: 0,
                updatedAt: 0,
            });
        }
        for (const d of this.dashboards.values()) {
            artifacts.push({
                id: d.id,
                type: 'dashboard',
                name: d.name,
                description: d.description,
                createdAt: 0,
                updatedAt: 0,
            });
        }
        for (const k of this.kpis.values()) {
            artifacts.push({
                id: k.id,
                type: 'kpi',
                name: k.name,
                description: k.description,
                createdAt: 0,
                updatedAt: 0,
            });
        }
        for (const m of this.metrics.values()) {
            artifacts.push({
                id: m.id,
                type: 'metric',
                name: m.name,
                description: m.description,
                createdAt: 0,
                updatedAt: 0,
            });
        }
        for (const def of this.definitions.values()) {
            artifacts.push({
                id: def.id,
                type: 'grid-definition',
                name: def.name,
                description: def.description,
                createdAt: Date.parse(def.createdAt) || 0,
                updatedAt: Date.parse(def.updatedAt) || 0,
            });
        }
        let results = artifacts;
        if (filter?.type) {
            results = results.filter(a => a.type === filter.type);
        }
        if (filter?.search) {
            const q = filter.search.toLowerCase();
            results = results.filter(a => a.name.toLowerCase().includes(q));
        }
        if (filter?.published !== undefined) {
            results = results.filter(a => a.published === filter.published);
        }
        return results;
    }
    // --- Breach Store ---
    async saveAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
    }
    async loadAlertRules(artifactId) {
        let results = Array.from(this.alertRules.values());
        if (artifactId) {
            results = results.filter(r => r.artifactId === artifactId);
        }
        return results;
    }
    async deleteAlertRule(ruleId) {
        this.alertRules.delete(ruleId);
    }
    async saveBreachRecord(breach) {
        this.breaches.set(breach.id, breach);
    }
    async loadActiveBreaches(artifactId) {
        let results = Array.from(this.breaches.values()).filter(b => b.status === 'active');
        if (artifactId) {
            results = results.filter(b => b.artifactId === artifactId);
        }
        return results;
    }
    async updateBreachStatus(breachId, status) {
        const breach = this.breaches.get(breachId);
        if (breach) {
            breach.status = status;
            if (status === 'acknowledged') {
                breach.acknowledgedAt = Date.now();
            }
            else if (status === 'resolved') {
                breach.resolvedAt = Date.now();
            }
        }
    }
    async saveSubscription(sub) {
        this.subscriptions.set(sub.id, sub);
    }
    async loadSubscriptions(ruleId) {
        let results = Array.from(this.subscriptions.values());
        if (ruleId) {
            results = results.filter(s => s.ruleId === ruleId);
        }
        return results;
    }
    // --- Template Store ---
    async saveTemplate(template) {
        this.templates.set(template.id, template);
    }
    async loadTemplates() {
        return Array.from(this.templates.values());
    }
    async deleteTemplate(id) {
        this.templates.delete(id);
    }
    // --- Artifact History ---
    recordVersion(id, data) {
        const entries = this.history.get(id) ?? [];
        entries.push({
            version: entries.length + 1,
            savedAt: Date.now(),
            data,
        });
        this.history.set(id, entries);
    }
    async getArtifactHistory(id, options) {
        const entries = this.history.get(id) ?? [];
        let filtered = [...entries];
        if (options?.before !== undefined) {
            filtered = filtered.filter(e => e.version < options.before);
        }
        // Most recent first
        filtered.sort((a, b) => b.version - a.version);
        if (options?.limit !== undefined) {
            filtered = filtered.slice(0, options.limit);
        }
        return filtered.map(e => ({
            version: e.version,
            savedAt: e.savedAt,
            sizeBytes: JSON.stringify(e.data).length,
        }));
    }
    async getArtifactVersion(id, version) {
        const entries = this.history.get(id) ?? [];
        const entry = entries.find(e => e.version === version);
        return entry?.data;
    }
    async restoreArtifactVersion(id, version) {
        const data = await this.getArtifactVersion(id, version);
        if (data === undefined)
            return;
        // Restore into the appropriate store based on what was stored
        const obj = structuredClone(data);
        if (this.reports.has(id)) {
            this.reports.set(id, obj);
        }
        else if (this.dashboards.has(id)) {
            this.dashboards.set(id, obj);
        }
        else if (this.kpis.has(id)) {
            this.kpis.set(id, obj);
        }
        else if (this.metrics.has(id)) {
            this.metrics.set(id, obj);
        }
    }
    // --- Clear ---
    async clear() {
        this.reports.clear();
        this.dashboards.clear();
        this.kpis.clear();
        this.metrics.clear();
        this.definitions.clear();
        this.placements.clear();
        this.alertRules.clear();
        this.breaches.clear();
        this.subscriptions.clear();
        this.templates.clear();
        this.history.clear();
    }
}
//# sourceMappingURL=memory-adapter.js.map