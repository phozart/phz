/**
 * @phozart/phz-shared — Semantic Role Classification
 *
 * Resolves field metadata into one of four semantic roles (dimension, measure,
 * time, identifier) using a three-tier precedence model:
 *
 *   1. Enrichment override (admin-defined FieldEnrichment.semanticHint)
 *   2. Field-level semanticHint (from DataAdapter schema)
 *   3. Heuristic fallback (dataType, cardinality, naming patterns)
 *
 * All functions are pure — no side effects, no DOM, no async.
 */
import type { FieldMetadata } from '../adapters/data-adapter.js';
import type { FieldEnrichment } from './field-enrichment.js';
export type SemanticRole = 'dimension' | 'measure' | 'time' | 'identifier';
/**
 * Classify a field into one of 4 semantic roles.
 *
 * Precedence:
 *   1. enrichment.semanticHint (admin override)
 *   2. field.semanticHint (from DataAdapter schema)
 *   3. Heuristic: dataType → cardinality → naming patterns
 *
 * @param field - Raw field metadata from DataAdapter.getSchema().
 * @param enrichment - Optional admin-defined enrichment for this field.
 * @returns The resolved SemanticRole.
 */
export declare function resolveSemanticRole(field: FieldMetadata, enrichment?: FieldEnrichment): SemanticRole;
export interface FieldsByRole {
    dimensions: FieldMetadata[];
    measures: FieldMetadata[];
    timeFields: FieldMetadata[];
    identifiers: FieldMetadata[];
}
/**
 * Partition an array of fields into four role-based groups in a single pass.
 *
 * @param fields - Array of field metadata to classify.
 * @param enrichments - Optional map of field name → enrichment for admin overrides.
 * @returns Fields grouped by semantic role.
 */
export declare function groupFieldsByRole(fields: readonly FieldMetadata[], enrichments?: Readonly<Record<string, FieldEnrichment>>): FieldsByRole;
//# sourceMappingURL=semantic-role.d.ts.map