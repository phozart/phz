/**
 * @phozart/phz-engine — Criteria Resolution for Reports & Dashboards
 *
 * Auto-hydrates inline CriteriaConfig into the registry when no bindings
 * exist, then resolves filter fields. Implements divergence detection
 * when both inline config and registry bindings coexist.
 */
import { filterDefinitionId } from '@phozart/phz-core';
import { reportArtefactId, dashboardArtefactId } from '../types.js';
// --- Public Utility: Hydrate CriteriaConfig into registry + bindings ---
/**
 * Hydrate a CriteriaConfig into a filter registry and binding store.
 * Idempotent: skips definitions/bindings that already exist.
 */
export function hydrateCriteriaConfig(registry, bindings, config, artId) {
    const now = Date.now();
    for (let i = 0; i < config.fields.length; i++) {
        const field = config.fields[i];
        const defId = filterDefinitionId(field.id);
        // Only register if not already in registry
        if (!registry.get(defId)) {
            const def = {
                id: defId,
                label: field.label,
                type: field.type,
                sessionBehavior: 'reset',
                defaultValue: field.defaultValue,
                options: field.options,
                treeOptions: field.treeOptions,
                dateRangeConfig: field.dateRangeConfig,
                numericRangeConfig: field.numericRangeConfig,
                searchConfig: field.searchConfig,
                fieldPresenceConfig: field.fieldPresenceConfig,
                dataField: field.dataField,
                selectionMode: field.selectionMode,
                required: field.required,
                dependsOn: field.dependsOn ? [filterDefinitionId(field.dependsOn)] : undefined,
                createdAt: now,
                updatedAt: now,
            };
            registry.register(def);
        }
        // Bind to artefact
        const binding = {
            filterDefinitionId: defId,
            artefactId: artId,
            visible: true,
            order: i,
            barConfigOverride: field.barConfig,
        };
        try {
            bindings.bind(binding);
        }
        catch {
            // Binding already exists — skip (idempotent)
        }
    }
}
// --- Internal Helpers ---
function detectDivergence(engine, inlineConfig, artId, artefactType, artefactName) {
    const existingBindings = engine.bindings.getBindingsForArtefact(artId);
    if (existingBindings.length === 0)
        return undefined;
    const inlineFieldIds = new Set(inlineConfig.fields.map(f => f.id));
    const registryFieldIds = new Set(existingBindings.map(b => b.filterDefinitionId));
    const inlineOnly = [...inlineFieldIds].filter(id => !registryFieldIds.has(id));
    const registryOnly = [...registryFieldIds].filter(id => !inlineFieldIds.has(id));
    const diverged = [];
    for (const field of inlineConfig.fields) {
        if (!registryFieldIds.has(field.id))
            continue;
        const def = engine.registry.get(filterDefinitionId(field.id));
        if (!def)
            continue;
        // Check key properties for divergence
        if (def.label !== field.label ||
            def.type !== field.type ||
            def.dataField !== field.dataField ||
            JSON.stringify(def.defaultValue) !== JSON.stringify(field.defaultValue)) {
            diverged.push(field.id);
        }
    }
    if (inlineOnly.length === 0 && registryOnly.length === 0 && diverged.length === 0) {
        return undefined;
    }
    return {
        artefactId: artId,
        artefactType,
        artefactName,
        inlineOnly,
        registryOnly,
        diverged,
    };
}
/**
 * Shared resolution logic for both reports and dashboards.
 *
 * Strategy (Option D — Pragmatic Hybrid):
 * 1. Registry bindings exist, no inline → use registry (source: 'registry')
 * 2. No bindings, inline config → auto-hydrate then resolve (source: 'hydrated')
 * 3. Both exist → use registry, detect divergence
 * 4. Neither → return empty (source: 'none')
 */
function resolveArtefactCriteria(artId, artefactType, artefactName, inlineConfig, engine, onDivergence) {
    const existingBindings = engine.bindings.getBindingsForArtefact(artId);
    const hasBindings = existingBindings.length > 0;
    const hasInline = !!inlineConfig && inlineConfig.fields.length > 0;
    // Case 1: Registry bindings exist, no inline
    if (hasBindings && !hasInline) {
        return {
            fields: engine.resolveFields(artId),
            artefactId: artId,
            source: 'registry',
        };
    }
    // Case 2: Only inline config — auto-hydrate
    if (!hasBindings && hasInline) {
        hydrateCriteriaConfig(engine.registry, engine.bindings, inlineConfig, artId);
        return {
            fields: engine.resolveFields(artId),
            artefactId: artId,
            source: 'hydrated',
        };
    }
    // Case 3: Both exist — use registry, detect divergence
    if (hasBindings && hasInline) {
        const divergence = detectDivergence(engine, inlineConfig, artId, artefactType, artefactName);
        if (divergence && onDivergence) {
            onDivergence(divergence);
        }
        return {
            fields: engine.resolveFields(artId),
            artefactId: artId,
            source: 'registry',
            divergence,
        };
    }
    // Case 4: Neither
    return { fields: [], artefactId: artId, source: 'none' };
}
// --- Public API ---
/**
 * Resolve filter fields for a report.
 */
export function resolveReportCriteria(reportId, engine, reports, onDivergence) {
    const report = reports.get(reportId);
    if (!report) {
        return { fields: [], artefactId: reportArtefactId(reportId), source: 'none' };
    }
    return resolveArtefactCriteria(reportArtefactId(reportId), 'report', report.name, report.criteriaConfig, engine, onDivergence);
}
/**
 * Resolve filter fields for a dashboard.
 */
export function resolveDashboardCriteria(dashboardId, engine, dashboards, onDivergence) {
    const dashboard = dashboards.get(dashboardId);
    if (!dashboard) {
        return { fields: [], artefactId: dashboardArtefactId(dashboardId), source: 'none' };
    }
    return resolveArtefactCriteria(dashboardArtefactId(dashboardId), 'dashboard', dashboard.name, dashboard.criteriaConfig, engine, onDivergence);
}
//# sourceMappingURL=resolve-criteria.js.map