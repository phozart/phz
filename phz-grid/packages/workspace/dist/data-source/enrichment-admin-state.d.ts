/**
 * @phozart/phz-workspace — Data Source Enrichment Admin State (B-3.09)
 *
 * Pure functions for field enrichment editing — semantic hints, units, labels.
 * Supports bulk enrichment via CSV import and enrichment preview.
 */
export type EnrichmentSemanticHint = 'currency' | 'percentage' | 'temperature' | 'timestamp' | 'email' | 'url' | 'phone' | 'address' | 'geo-lat' | 'geo-lng' | 'identifier' | 'category' | 'measure' | 'dimension' | 'none';
export interface FieldEnrichment {
    field: string;
    label?: string;
    description?: string;
    semanticHint?: EnrichmentSemanticHint;
    unit?: string;
    format?: string;
    displayOrder?: number;
    hidden?: boolean;
}
export interface EnrichmentAdminState {
    dataSourceId: string;
    enrichments: FieldEnrichment[];
    selectedField?: string;
    search: string;
    dirty: boolean;
    importErrors: string[];
}
export declare function initialEnrichmentAdminState(dataSourceId: string, enrichments?: FieldEnrichment[]): EnrichmentAdminState;
export declare function setEnrichmentSearch(state: EnrichmentAdminState, search: string): EnrichmentAdminState;
export declare function getFilteredEnrichments(state: EnrichmentAdminState): FieldEnrichment[];
export declare function selectField(state: EnrichmentAdminState, field: string): EnrichmentAdminState;
export declare function clearFieldSelection(state: EnrichmentAdminState): EnrichmentAdminState;
export declare function addEnrichment(state: EnrichmentAdminState, enrichment: FieldEnrichment): EnrichmentAdminState;
export declare function updateEnrichment(state: EnrichmentAdminState, field: string, updates: Partial<FieldEnrichment>): EnrichmentAdminState;
export declare function removeEnrichment(state: EnrichmentAdminState, field: string): EnrichmentAdminState;
export interface CSVRow {
    field: string;
    label?: string;
    description?: string;
    semanticHint?: string;
    unit?: string;
    format?: string;
}
export declare function parseCSVEnrichments(rows: CSVRow[]): {
    enrichments: FieldEnrichment[];
    errors: string[];
};
export declare function applyBulkEnrichment(state: EnrichmentAdminState, rows: CSVRow[]): EnrichmentAdminState;
export interface EnrichmentPreview {
    field: string;
    originalLabel: string;
    enrichedLabel: string;
    semanticHint: string;
    unit: string;
    format: string;
}
export declare function buildEnrichmentPreview(fields: Array<{
    field: string;
    label?: string;
}>, enrichments: FieldEnrichment[]): EnrichmentPreview[];
export declare function markEnrichmentSaved(state: EnrichmentAdminState): EnrichmentAdminState;
//# sourceMappingURL=enrichment-admin-state.d.ts.map