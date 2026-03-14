/**
 * @phozart/shared — FieldEnrichment (A-1.07)
 *
 * Field metadata enrichment for data sources: semantic hints, formatting,
 * units, display labels, and descriptions. Enrichments overlay raw field
 * metadata from the data adapter with human-friendly presentation data.
 */
import type { SemanticHint, UnitSpec } from '../adapters/data-adapter.js';
export type { SemanticHint, UnitSpec };
export interface FieldEnrichment {
    field: string;
    semanticHint?: SemanticHint;
    unit?: UnitSpec;
    displayLabel?: string;
    description?: string;
    format?: string;
}
/**
 * The result of merging raw FieldMetadata (from DataAdapter.getSchema)
 * with admin-defined FieldEnrichment. All enrichment properties are
 * optional and override the raw metadata when present.
 */
export interface EnrichedFieldMetadata {
    /** Original field name from the data source. */
    name: string;
    /** Data type from the schema. */
    dataType: 'string' | 'number' | 'date' | 'boolean';
    /** Whether the field allows null values. */
    nullable: boolean;
    /** Cardinality from the schema. */
    cardinality?: 'low' | 'medium' | 'high';
    /** Semantic hint (from enrichment or schema). */
    semanticHint?: SemanticHint;
    /** Unit specification (from enrichment or schema). */
    unit?: UnitSpec;
    /** Human-friendly display label (from enrichment). Falls back to field name. */
    displayLabel: string;
    /** Description (from enrichment). */
    description?: string;
    /** Format pattern (from enrichment). */
    format?: string;
}
export declare function createFieldEnrichment(field: string, overrides?: Partial<Omit<FieldEnrichment, 'field'>>): FieldEnrichment;
/**
 * Pure function that merges raw field metadata from the data adapter
 * with admin-defined enrichments. Enrichment values take precedence
 * over raw metadata when both are present.
 *
 * @param raw - Raw field metadata from DataAdapter.getSchema().
 * @param enrichment - Optional admin-defined enrichment for this field.
 * @returns EnrichedFieldMetadata with all available information merged.
 */
export declare function mergeFieldMetadata(raw: {
    name: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    nullable: boolean;
    cardinality?: 'low' | 'medium' | 'high';
    semanticHint?: SemanticHint;
    unit?: UnitSpec;
}, enrichment?: FieldEnrichment): EnrichedFieldMetadata;
//# sourceMappingURL=field-enrichment.d.ts.map