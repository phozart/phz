/**
 * @phozart/workspace — Data Source Enrichment Admin State (B-3.09)
 *
 * Pure functions for field enrichment editing — semantic hints, units, labels.
 * Supports bulk enrichment via CSV import and enrichment preview.
 */
// ========================================================================
// Factory
// ========================================================================
export function initialEnrichmentAdminState(dataSourceId, enrichments = []) {
    return {
        dataSourceId,
        enrichments,
        search: '',
        dirty: false,
        importErrors: [],
    };
}
// ========================================================================
// Search
// ========================================================================
export function setEnrichmentSearch(state, search) {
    return { ...state, search };
}
export function getFilteredEnrichments(state) {
    if (!state.search)
        return state.enrichments;
    const q = state.search.toLowerCase();
    return state.enrichments.filter(e => e.field.toLowerCase().includes(q) ||
        (e.label?.toLowerCase().includes(q) ?? false) ||
        (e.description?.toLowerCase().includes(q) ?? false));
}
// ========================================================================
// Selection
// ========================================================================
export function selectField(state, field) {
    return { ...state, selectedField: field };
}
export function clearFieldSelection(state) {
    return { ...state, selectedField: undefined };
}
// ========================================================================
// CRUD
// ========================================================================
export function addEnrichment(state, enrichment) {
    if (state.enrichments.some(e => e.field === enrichment.field))
        return state;
    return {
        ...state,
        enrichments: [...state.enrichments, enrichment],
        dirty: true,
    };
}
export function updateEnrichment(state, field, updates) {
    return {
        ...state,
        enrichments: state.enrichments.map(e => e.field === field ? { ...e, ...updates, field: e.field } : e),
        dirty: true,
    };
}
export function removeEnrichment(state, field) {
    return {
        ...state,
        enrichments: state.enrichments.filter(e => e.field !== field),
        selectedField: state.selectedField === field ? undefined : state.selectedField,
        dirty: true,
    };
}
const VALID_HINTS = new Set([
    'currency', 'percentage', 'temperature', 'timestamp', 'email', 'url',
    'phone', 'address', 'geo-lat', 'geo-lng', 'identifier', 'category',
    'measure', 'dimension', 'none',
]);
export function parseCSVEnrichments(rows) {
    const enrichments = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.field?.trim()) {
            errors.push(`Row ${i + 1}: field name is required`);
            continue;
        }
        if (row.semanticHint && !VALID_HINTS.has(row.semanticHint)) {
            errors.push(`Row ${i + 1}: invalid semantic hint "${row.semanticHint}"`);
            continue;
        }
        enrichments.push({
            field: row.field.trim(),
            label: row.label?.trim() || undefined,
            description: row.description?.trim() || undefined,
            semanticHint: row.semanticHint,
            unit: row.unit?.trim() || undefined,
            format: row.format?.trim() || undefined,
        });
    }
    return { enrichments, errors };
}
export function applyBulkEnrichment(state, rows) {
    const { enrichments, errors } = parseCSVEnrichments(rows);
    if (errors.length > 0) {
        return { ...state, importErrors: errors };
    }
    // Merge: update existing, add new
    const existingMap = new Map(state.enrichments.map(e => [e.field, e]));
    for (const enrichment of enrichments) {
        existingMap.set(enrichment.field, {
            ...existingMap.get(enrichment.field),
            ...enrichment,
        });
    }
    return {
        ...state,
        enrichments: [...existingMap.values()],
        dirty: true,
        importErrors: [],
    };
}
export function buildEnrichmentPreview(fields, enrichments) {
    const enrichmentMap = new Map(enrichments.map(e => [e.field, e]));
    return fields.map(f => {
        const e = enrichmentMap.get(f.field);
        return {
            field: f.field,
            originalLabel: f.label ?? f.field,
            enrichedLabel: e?.label ?? f.label ?? f.field,
            semanticHint: e?.semanticHint ?? 'none',
            unit: e?.unit ?? '',
            format: e?.format ?? '',
        };
    });
}
// ========================================================================
// Mark saved
// ========================================================================
export function markEnrichmentSaved(state) {
    return { ...state, dirty: false };
}
//# sourceMappingURL=enrichment-admin-state.js.map