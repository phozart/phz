/**
 * @phozart/phz-engine — Base Types
 *
 * Branded ID types, config layers, and shared types for the BI engine.
 */
// --- ID Factories ---
export function kpiId(id) { return id; }
export function metricId(id) { return id; }
export function reportId(id) { return id; }
export function dashboardId(id) { return id; }
export function widgetId(id) { return id; }
export function dataProductId(id) { return id; }
import { artefactId } from '@phozart/phz-core';
export function reportArtefactId(id) {
    return artefactId(`report:${id}`);
}
export function dashboardArtefactId(id) {
    return artefactId(`dashboard:${id}`);
}
export function widgetArtefactId(id) {
    return artefactId(`widget:${id}`);
}
export function parseArtefactId(id) {
    const str = id;
    const colonIdx = str.indexOf(':');
    if (colonIdx === -1)
        return { type: 'unknown', rawId: str };
    const prefix = str.slice(0, colonIdx);
    const rawId = str.slice(colonIdx + 1);
    if (prefix === 'report' || prefix === 'dashboard' || prefix === 'widget') {
        return { type: prefix, rawId };
    }
    return { type: 'unknown', rawId: str };
}
//# sourceMappingURL=types.js.map