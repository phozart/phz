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

import type { FieldMetadata, SemanticHint } from '../adapters/data-adapter.js';
import type { FieldEnrichment } from './field-enrichment.js';

// ========================================================================
// SemanticRole — the four-way classification
// ========================================================================

export type SemanticRole = 'dimension' | 'measure' | 'time' | 'identifier';

// ========================================================================
// SemanticHint → SemanticRole mapping
// ========================================================================

function hintToRole(hint: SemanticHint): SemanticRole {
  switch (hint) {
    case 'dimension':
    case 'category':
      return 'dimension';
    case 'measure':
    case 'currency':
    case 'percentage':
      return 'measure';
    case 'timestamp':
      return 'time';
    case 'identifier':
      return 'identifier';
  }
}

// ========================================================================
// Naming pattern detection
// ========================================================================

function looksLikeIdentifier(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'id' || lower.endsWith('_id') || lower.endsWith('id');
}

// ========================================================================
// resolveSemanticRole
// ========================================================================

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
export function resolveSemanticRole(
  field: FieldMetadata,
  enrichment?: FieldEnrichment,
): SemanticRole {
  // Tier 1: enrichment override
  const enrichmentHint = enrichment?.semanticHint;
  if (enrichmentHint != null) {
    return hintToRole(enrichmentHint);
  }

  // Tier 2: field-level semanticHint
  const fieldHint = field.semanticHint;
  if (fieldHint != null) {
    return hintToRole(fieldHint);
  }

  // Tier 3: heuristic fallback
  if (field.dataType === 'date') return 'time';
  if (field.dataType === 'boolean') return 'dimension';
  if (field.dataType === 'number') return 'measure';

  // String fields: cardinality then naming patterns
  if (field.dataType === 'string') {
    if (field.cardinality === 'high') return 'identifier';
    if (field.cardinality === 'low' || field.cardinality === 'medium') return 'dimension';
    if (looksLikeIdentifier(field.name)) return 'identifier';
    return 'dimension';
  }

  return 'dimension'; // ultimate fallback
}

// ========================================================================
// groupFieldsByRole
// ========================================================================

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
export function groupFieldsByRole(
  fields: readonly FieldMetadata[],
  enrichments?: Readonly<Record<string, FieldEnrichment>>,
): FieldsByRole {
  const dimensions: FieldMetadata[] = [];
  const measures: FieldMetadata[] = [];
  const timeFields: FieldMetadata[] = [];
  const identifiers: FieldMetadata[] = [];

  for (const f of fields) {
    const enrichment = enrichments?.[f.name];
    switch (resolveSemanticRole(f, enrichment)) {
      case 'dimension': dimensions.push(f); break;
      case 'measure': measures.push(f); break;
      case 'time': timeFields.push(f); break;
      case 'identifier': identifiers.push(f); break;
    }
  }

  return { dimensions, measures, timeFields, identifiers };
}
