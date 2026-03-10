/**
 * @phozart/phz-workspace — Data Source Enrichment Admin State (B-3.09)
 *
 * Pure functions for field enrichment editing — semantic hints, units, labels.
 * Supports bulk enrichment via CSV import and enrichment preview.
 */

// ========================================================================
// Types
// ========================================================================

export type EnrichmentSemanticHint =
  | 'currency'
  | 'percentage'
  | 'temperature'
  | 'timestamp'
  | 'email'
  | 'url'
  | 'phone'
  | 'address'
  | 'geo-lat'
  | 'geo-lng'
  | 'identifier'
  | 'category'
  | 'measure'
  | 'dimension'
  | 'none';

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

// ========================================================================
// Factory
// ========================================================================

export function initialEnrichmentAdminState(
  dataSourceId: string,
  enrichments: FieldEnrichment[] = [],
): EnrichmentAdminState {
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

export function setEnrichmentSearch(
  state: EnrichmentAdminState,
  search: string,
): EnrichmentAdminState {
  return { ...state, search };
}

export function getFilteredEnrichments(
  state: EnrichmentAdminState,
): FieldEnrichment[] {
  if (!state.search) return state.enrichments;
  const q = state.search.toLowerCase();
  return state.enrichments.filter(
    e =>
      e.field.toLowerCase().includes(q) ||
      (e.label?.toLowerCase().includes(q) ?? false) ||
      (e.description?.toLowerCase().includes(q) ?? false),
  );
}

// ========================================================================
// Selection
// ========================================================================

export function selectField(
  state: EnrichmentAdminState,
  field: string,
): EnrichmentAdminState {
  return { ...state, selectedField: field };
}

export function clearFieldSelection(
  state: EnrichmentAdminState,
): EnrichmentAdminState {
  return { ...state, selectedField: undefined };
}

// ========================================================================
// CRUD
// ========================================================================

export function addEnrichment(
  state: EnrichmentAdminState,
  enrichment: FieldEnrichment,
): EnrichmentAdminState {
  if (state.enrichments.some(e => e.field === enrichment.field)) return state;
  return {
    ...state,
    enrichments: [...state.enrichments, enrichment],
    dirty: true,
  };
}

export function updateEnrichment(
  state: EnrichmentAdminState,
  field: string,
  updates: Partial<FieldEnrichment>,
): EnrichmentAdminState {
  return {
    ...state,
    enrichments: state.enrichments.map(e =>
      e.field === field ? { ...e, ...updates, field: e.field } : e,
    ),
    dirty: true,
  };
}

export function removeEnrichment(
  state: EnrichmentAdminState,
  field: string,
): EnrichmentAdminState {
  return {
    ...state,
    enrichments: state.enrichments.filter(e => e.field !== field),
    selectedField: state.selectedField === field ? undefined : state.selectedField,
    dirty: true,
  };
}

// ========================================================================
// Bulk enrichment from CSV
// ========================================================================

export interface CSVRow {
  field: string;
  label?: string;
  description?: string;
  semanticHint?: string;
  unit?: string;
  format?: string;
}

const VALID_HINTS = new Set<string>([
  'currency', 'percentage', 'temperature', 'timestamp', 'email', 'url',
  'phone', 'address', 'geo-lat', 'geo-lng', 'identifier', 'category',
  'measure', 'dimension', 'none',
]);

export function parseCSVEnrichments(
  rows: CSVRow[],
): { enrichments: FieldEnrichment[]; errors: string[] } {
  const enrichments: FieldEnrichment[] = [];
  const errors: string[] = [];

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
      semanticHint: row.semanticHint as EnrichmentSemanticHint | undefined,
      unit: row.unit?.trim() || undefined,
      format: row.format?.trim() || undefined,
    });
  }

  return { enrichments, errors };
}

export function applyBulkEnrichment(
  state: EnrichmentAdminState,
  rows: CSVRow[],
): EnrichmentAdminState {
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

// ========================================================================
// Preview
// ========================================================================

export interface EnrichmentPreview {
  field: string;
  originalLabel: string;
  enrichedLabel: string;
  semanticHint: string;
  unit: string;
  format: string;
}

export function buildEnrichmentPreview(
  fields: Array<{ field: string; label?: string }>,
  enrichments: FieldEnrichment[],
): EnrichmentPreview[] {
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

export function markEnrichmentSaved(
  state: EnrichmentAdminState,
): EnrichmentAdminState {
  return { ...state, dirty: false };
}
