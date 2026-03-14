/**
 * @phozart/shared — FieldEnrichment (A-1.07)
 *
 * Field metadata enrichment for data sources: semantic hints, formatting,
 * units, display labels, and descriptions. Enrichments overlay raw field
 * metadata from the data adapter with human-friendly presentation data.
 */
// ========================================================================
// Factory
// ========================================================================
export function createFieldEnrichment(field, overrides) {
    return { field, ...overrides };
}
// ========================================================================
// mergeFieldMetadata — merge raw metadata with enrichments
// ========================================================================
/**
 * Pure function that merges raw field metadata from the data adapter
 * with admin-defined enrichments. Enrichment values take precedence
 * over raw metadata when both are present.
 *
 * @param raw - Raw field metadata from DataAdapter.getSchema().
 * @param enrichment - Optional admin-defined enrichment for this field.
 * @returns EnrichedFieldMetadata with all available information merged.
 */
export function mergeFieldMetadata(raw, enrichment) {
    if (!enrichment) {
        return {
            name: raw.name,
            dataType: raw.dataType,
            nullable: raw.nullable,
            cardinality: raw.cardinality,
            semanticHint: raw.semanticHint,
            unit: raw.unit,
            displayLabel: raw.name,
        };
    }
    return {
        name: raw.name,
        dataType: raw.dataType,
        nullable: raw.nullable,
        cardinality: raw.cardinality,
        semanticHint: enrichment.semanticHint ?? raw.semanticHint,
        unit: enrichment.unit ?? raw.unit,
        displayLabel: enrichment.displayLabel ?? raw.name,
        description: enrichment.description,
        format: enrichment.format,
    };
}
//# sourceMappingURL=field-enrichment.js.map