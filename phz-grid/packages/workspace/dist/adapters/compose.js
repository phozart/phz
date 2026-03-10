/**
 * @phozart/phz-workspace — composeWorkspaceAdapter
 *
 * Composes existing EngineStorageAdapter + AsyncDefinitionStore instances
 * into a unified WorkspaceAdapter, adding placement/catalog methods
 * via in-memory defaults.
 */
import { MemoryStorageAdapter } from '@phozart/phz-engine';
// In-memory definition store fallback
class MemoryDefinitionStore {
    constructor() {
        this.defs = new Map();
    }
    async save(def) {
        this.defs.set(def.id, def);
        return def;
    }
    async load(id) {
        return this.defs.get(id);
    }
    async list() {
        return Array.from(this.defs.values()).map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            updatedAt: d.updatedAt,
        }));
    }
    async delete(id) {
        return this.defs.delete(id);
    }
    async duplicate(id, options) {
        const original = this.defs.get(id);
        if (!original)
            return undefined;
        const copy = { ...structuredClone(original), name: options?.name ?? `${original.name} (Copy)` };
        this.defs.set(copy.id, copy);
        return copy;
    }
    async clear() {
        this.defs.clear();
    }
}
export function composeWorkspaceAdapter(options) {
    const engine = options.engine ?? new MemoryStorageAdapter();
    const definitions = options.definitions ?? new MemoryDefinitionStore();
    const placements = new Map();
    return {
        // --- Initialize ---
        async initialize() {
            // No-op for composed adapter
        },
        // --- EngineStorageAdapter ---
        async saveReport(report) {
            return engine.saveReport(report);
        },
        async loadReports() {
            return engine.loadReports();
        },
        async deleteReport(id) {
            return engine.deleteReport(id);
        },
        async saveDashboard(dashboard) {
            return engine.saveDashboard(dashboard);
        },
        async loadDashboards() {
            return engine.loadDashboards();
        },
        async deleteDashboard(id) {
            return engine.deleteDashboard(id);
        },
        async saveKPI(kpi) {
            return engine.saveKPI(kpi);
        },
        async loadKPIs() {
            return engine.loadKPIs();
        },
        async deleteKPI(id) {
            return engine.deleteKPI(id);
        },
        async saveMetric(metric) {
            return engine.saveMetric(metric);
        },
        async loadMetrics() {
            return engine.loadMetrics();
        },
        async deleteMetric(id) {
            return engine.deleteMetric(id);
        },
        // --- AsyncDefinitionStore ---
        async save(def) {
            return definitions.save(def);
        },
        async load(id) {
            return definitions.load(id);
        },
        async list() {
            return definitions.list();
        },
        async delete(id) {
            return definitions.delete(id);
        },
        async duplicate(id, opts) {
            return definitions.duplicate(id, opts);
        },
        // --- Placements ---
        async savePlacement(placement) {
            placements.set(placement.id, placement);
            return placement;
        },
        async loadPlacements(filter) {
            let results = Array.from(placements.values());
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
        },
        async deletePlacement(id) {
            placements.delete(id);
        },
        // --- Catalog ---
        async listArtifacts(filter) {
            const artifacts = [];
            for (const r of await engine.loadReports()) {
                artifacts.push({
                    id: r.id,
                    type: 'report',
                    name: r.name,
                    description: r.description,
                    createdAt: 0,
                    updatedAt: 0,
                });
            }
            for (const d of await engine.loadDashboards()) {
                artifacts.push({
                    id: d.id,
                    type: 'dashboard',
                    name: d.name,
                    description: d.description,
                    createdAt: 0,
                    updatedAt: 0,
                });
            }
            for (const k of await engine.loadKPIs()) {
                artifacts.push({
                    id: k.id,
                    type: 'kpi',
                    name: k.name,
                    description: k.description,
                    createdAt: 0,
                    updatedAt: 0,
                });
            }
            for (const m of await engine.loadMetrics()) {
                artifacts.push({
                    id: m.id,
                    type: 'metric',
                    name: m.name,
                    description: m.description,
                    createdAt: 0,
                    updatedAt: 0,
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
        },
        // --- Clear ---
        async clear() {
            await engine.clear();
            await definitions.clear();
            placements.clear();
        },
    };
}
//# sourceMappingURL=compose.js.map