/**
 * @phozart/phz-local — Filesystem Workspace Adapter (R.2)
 *
 * Implements WorkspaceAdapter over the filesystem.
 * Artifacts stored as: {dataDir}/artifacts/{type}/{id}.json
 * History versions as: {dataDir}/artifacts/{type}/{id}.v{n}.json
 * Uses atomic writes (write .tmp, rename) to prevent corruption.
 */
import { readFile, writeFile, rename, readdir, mkdir, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createDefinitionId } from '@phozart/phz-shared/definitions';
export class FsWorkspaceAdapter {
    dataDir;
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    // --- Filesystem helpers ---
    artifactDir(type) {
        return join(this.dataDir, 'artifacts', type);
    }
    artifactPath(type, id) {
        return join(this.artifactDir(type), `${id}.json`);
    }
    versionPath(type, id, version) {
        return join(this.artifactDir(type), `${id}.v${version}.json`);
    }
    async ensureDir(dir) {
        await mkdir(dir, { recursive: true });
    }
    async atomicWrite(filePath, data) {
        const dir = join(filePath, '..');
        await this.ensureDir(dir);
        const tmpPath = filePath + '.tmp';
        await writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
        await rename(tmpPath, filePath);
    }
    async readJson(filePath) {
        try {
            const content = await readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return undefined;
        }
    }
    async listJsonFiles(dir) {
        try {
            const entries = await readdir(dir);
            return entries.filter(f => f.endsWith('.json') && !f.includes('.v') && !f.endsWith('.tmp'));
        }
        catch {
            return [];
        }
    }
    async loadAll(type) {
        const dir = this.artifactDir(type);
        const files = await this.listJsonFiles(dir);
        const results = [];
        for (const file of files) {
            const data = await this.readJson(join(dir, file));
            if (data)
                results.push(data);
        }
        return results;
    }
    // --- Initialize ---
    async initialize() {
        await this.ensureDir(this.artifactDir('reports'));
        await this.ensureDir(this.artifactDir('dashboards'));
        await this.ensureDir(this.artifactDir('kpis'));
        await this.ensureDir(this.artifactDir('metrics'));
        await this.ensureDir(this.artifactDir('definitions'));
        await this.ensureDir(this.artifactDir('placements'));
        await this.ensureDir(this.artifactDir('alert-rules'));
        await this.ensureDir(this.artifactDir('breaches'));
        await this.ensureDir(this.artifactDir('subscriptions'));
        await this.ensureDir(this.artifactDir('templates'));
    }
    // --- Reports ---
    async saveReport(report) {
        const id = report.id;
        await this.recordVersion('reports', id, report);
        await this.atomicWrite(this.artifactPath('reports', id), report);
    }
    async loadReports() {
        return this.loadAll('reports');
    }
    async deleteReport(id) {
        try {
            await unlink(this.artifactPath('reports', id));
        }
        catch { /* noop */ }
    }
    // --- Dashboards ---
    async saveDashboard(dashboard) {
        await this.atomicWrite(this.artifactPath('dashboards', dashboard.id), dashboard);
    }
    async loadDashboards() {
        return this.loadAll('dashboards');
    }
    async deleteDashboard(id) {
        try {
            await unlink(this.artifactPath('dashboards', id));
        }
        catch { /* noop */ }
    }
    // --- KPIs ---
    async saveKPI(kpi) {
        await this.atomicWrite(this.artifactPath('kpis', kpi.id), kpi);
    }
    async loadKPIs() {
        return this.loadAll('kpis');
    }
    async deleteKPI(id) {
        try {
            await unlink(this.artifactPath('kpis', id));
        }
        catch { /* noop */ }
    }
    // --- Metrics ---
    async saveMetric(metric) {
        await this.atomicWrite(this.artifactPath('metrics', metric.id), metric);
    }
    async loadMetrics() {
        return this.loadAll('metrics');
    }
    async deleteMetric(id) {
        try {
            await unlink(this.artifactPath('metrics', id));
        }
        catch { /* noop */ }
    }
    // --- Definitions ---
    async save(def) {
        const now = new Date().toISOString();
        const saved = {
            ...def,
            updatedAt: now,
            createdAt: def.createdAt || now,
        };
        await this.atomicWrite(this.artifactPath('definitions', def.id), saved);
        return saved;
    }
    async load(id) {
        return this.readJson(this.artifactPath('definitions', id));
    }
    async list() {
        const defs = await this.loadAll('definitions');
        return defs.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            updatedAt: d.updatedAt,
        }));
    }
    async delete(id) {
        try {
            await unlink(this.artifactPath('definitions', id));
            return true;
        }
        catch {
            return false;
        }
    }
    async duplicate(id, options) {
        const original = await this.load(id);
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
        await this.save(copy);
        return copy;
    }
    // --- Placements ---
    async savePlacement(placement) {
        await this.atomicWrite(this.artifactPath('placements', placement.id), placement);
        return placement;
    }
    async loadPlacements(filter) {
        let results = await this.loadAll('placements');
        if (filter?.artifactId)
            results = results.filter(p => p.artifactId === filter.artifactId);
        if (filter?.artifactType)
            results = results.filter(p => p.artifactType === filter.artifactType);
        if (filter?.target)
            results = results.filter(p => p.target === filter.target);
        return results;
    }
    async deletePlacement(id) {
        try {
            await unlink(this.artifactPath('placements', id));
        }
        catch { /* noop */ }
    }
    // --- Catalog ---
    async listArtifacts(filter) {
        const artifacts = [];
        const typeMap = [
            ['reports', 'report'],
            ['dashboards', 'dashboard'],
            ['kpis', 'kpi'],
            ['metrics', 'metric'],
            ['definitions', 'grid-definition'],
        ];
        for (const [dirName, artifactType] of typeMap) {
            const items = await this.loadAll(dirName);
            for (const item of items) {
                artifacts.push({
                    id: item.id,
                    type: artifactType,
                    name: item.name,
                    description: item.description,
                    createdAt: 0,
                    updatedAt: 0,
                });
            }
        }
        let results = artifacts;
        if (filter?.type)
            results = results.filter(a => a.type === filter.type);
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
        await this.atomicWrite(this.artifactPath('alert-rules', rule.id), rule);
    }
    async loadAlertRules(artifactId) {
        let results = await this.loadAll('alert-rules');
        if (artifactId)
            results = results.filter(r => r.artifactId === artifactId);
        return results;
    }
    async deleteAlertRule(ruleId) {
        try {
            await unlink(this.artifactPath('alert-rules', ruleId));
        }
        catch { /* noop */ }
    }
    async saveBreachRecord(breach) {
        await this.atomicWrite(this.artifactPath('breaches', breach.id), breach);
    }
    async loadActiveBreaches(artifactId) {
        let results = (await this.loadAll('breaches')).filter(b => b.status === 'active');
        if (artifactId)
            results = results.filter(b => b.artifactId === artifactId);
        return results;
    }
    async updateBreachStatus(breachId, status) {
        const breach = await this.readJson(this.artifactPath('breaches', breachId));
        if (!breach)
            return;
        breach.status = status;
        if (status === 'acknowledged')
            breach.acknowledgedAt = Date.now();
        if (status === 'resolved')
            breach.resolvedAt = Date.now();
        await this.atomicWrite(this.artifactPath('breaches', breachId), breach);
    }
    async saveSubscription(sub) {
        await this.atomicWrite(this.artifactPath('subscriptions', sub.id), sub);
    }
    async loadSubscriptions(ruleId) {
        let results = await this.loadAll('subscriptions');
        if (ruleId)
            results = results.filter(s => s.ruleId === ruleId);
        return results;
    }
    // --- Template Store ---
    async saveTemplate(template) {
        await this.atomicWrite(this.artifactPath('templates', template.id), template);
    }
    async loadTemplates() {
        return this.loadAll('templates');
    }
    async deleteTemplate(id) {
        try {
            await unlink(this.artifactPath('templates', id));
        }
        catch { /* noop */ }
    }
    // --- Artifact History ---
    async recordVersion(type, id, data) {
        const nextVersion = await this.getNextVersion(type, id);
        await this.atomicWrite(this.versionPath(type, id, nextVersion), data);
    }
    async getNextVersion(type, id) {
        const dir = this.artifactDir(type);
        try {
            const entries = await readdir(dir);
            const prefix = `${id}.v`;
            const versions = entries
                .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
                .map(f => parseInt(f.slice(prefix.length, -5), 10))
                .filter(n => !isNaN(n));
            return versions.length > 0 ? Math.max(...versions) + 1 : 1;
        }
        catch {
            return 1;
        }
    }
    async getArtifactHistory(id, options) {
        // Search all type directories for versions of this id
        const types = ['reports', 'dashboards', 'kpis', 'metrics', 'definitions'];
        const results = [];
        for (const type of types) {
            const dir = this.artifactDir(type);
            try {
                const entries = await readdir(dir);
                const prefix = `${id}.v`;
                for (const entry of entries) {
                    if (!entry.startsWith(prefix) || !entry.endsWith('.json'))
                        continue;
                    const version = parseInt(entry.slice(prefix.length, -5), 10);
                    if (isNaN(version))
                        continue;
                    if (options?.before !== undefined && version >= options.before)
                        continue;
                    const filePath = join(dir, entry);
                    const s = await stat(filePath);
                    results.push({
                        version,
                        savedAt: s.mtimeMs,
                        sizeBytes: s.size,
                    });
                }
            }
            catch { /* directory may not exist */ }
        }
        results.sort((a, b) => b.version - a.version);
        if (options?.limit)
            return results.slice(0, options.limit);
        return results;
    }
    async getArtifactVersion(id, version) {
        const types = ['reports', 'dashboards', 'kpis', 'metrics', 'definitions'];
        for (const type of types) {
            const data = await this.readJson(this.versionPath(type, id, version));
            if (data !== undefined)
                return data;
        }
        return undefined;
    }
    async restoreArtifactVersion(id, version) {
        const data = await this.getArtifactVersion(id, version);
        if (data === undefined)
            return;
        // Find which type this artifact belongs to and restore
        const types = ['reports', 'dashboards', 'kpis', 'metrics', 'definitions'];
        for (const type of types) {
            const existing = await this.readJson(this.artifactPath(type, id));
            if (existing !== undefined) {
                await this.atomicWrite(this.artifactPath(type, id), data);
                return;
            }
        }
    }
    // --- Clear ---
    async clear() {
        const types = [
            'reports', 'dashboards', 'kpis', 'metrics',
            'definitions', 'placements', 'alert-rules',
            'breaches', 'subscriptions', 'templates',
        ];
        for (const type of types) {
            const dir = this.artifactDir(type);
            try {
                const entries = await readdir(dir);
                for (const entry of entries) {
                    await unlink(join(dir, entry));
                }
            }
            catch { /* noop */ }
        }
    }
}
//# sourceMappingURL=fs-workspace-adapter.js.map