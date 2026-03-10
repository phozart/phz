import { describe, it, expect } from 'vitest';
import {
  initialEnrichmentAdminState,
  setEnrichmentSearch,
  getFilteredEnrichments,
  selectField,
  clearFieldSelection,
  addEnrichment,
  updateEnrichment,
  removeEnrichment,
  parseCSVEnrichments,
  applyBulkEnrichment,
  buildEnrichmentPreview,
  markEnrichmentSaved,
  type FieldEnrichment,
  type CSVRow,
} from '../data-source/enrichment-admin-state.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const enrichments: FieldEnrichment[] = [
  { field: 'revenue', label: 'Total Revenue', semanticHint: 'currency', unit: 'USD' },
  { field: 'created_at', label: 'Creation Date', semanticHint: 'timestamp' },
  { field: 'region', label: 'Region', semanticHint: 'category' },
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialEnrichmentAdminState', () => {
  it('creates state with data source ID', () => {
    const state = initialEnrichmentAdminState('ds-1');
    expect(state.dataSourceId).toBe('ds-1');
    expect(state.enrichments).toHaveLength(0);
    expect(state.dirty).toBe(false);
  });

  it('accepts initial enrichments', () => {
    const state = initialEnrichmentAdminState('ds-1', enrichments);
    expect(state.enrichments).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('search', () => {
  it('filters by field name', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = setEnrichmentSearch(state, 'revenue');
    expect(getFilteredEnrichments(state)).toHaveLength(1);
  });

  it('filters by label', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = setEnrichmentSearch(state, 'Creation');
    expect(getFilteredEnrichments(state)).toHaveLength(1);
  });

  it('returns all when search empty', () => {
    const state = initialEnrichmentAdminState('ds-1', enrichments);
    expect(getFilteredEnrichments(state)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('selects and clears field', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = selectField(state, 'revenue');
    expect(state.selectedField).toBe('revenue');
    state = clearFieldSelection(state);
    expect(state.selectedField).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

describe('CRUD', () => {
  it('adds enrichment', () => {
    let state = initialEnrichmentAdminState('ds-1');
    state = addEnrichment(state, { field: 'name', label: 'Name' });
    expect(state.enrichments).toHaveLength(1);
    expect(state.dirty).toBe(true);
  });

  it('does not add duplicate', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = addEnrichment(state, enrichments[0]);
    expect(state.enrichments).toHaveLength(3);
  });

  it('updates enrichment', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = updateEnrichment(state, 'revenue', { unit: 'EUR' });
    expect(state.enrichments.find(e => e.field === 'revenue')?.unit).toBe('EUR');
    expect(state.dirty).toBe(true);
  });

  it('removes enrichment', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = removeEnrichment(state, 'revenue');
    expect(state.enrichments).toHaveLength(2);
    expect(state.dirty).toBe(true);
  });

  it('clears selection when removing selected', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    state = selectField(state, 'revenue');
    state = removeEnrichment(state, 'revenue');
    expect(state.selectedField).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Bulk CSV import
// ---------------------------------------------------------------------------

describe('CSV import', () => {
  it('parses valid CSV rows', () => {
    const rows: CSVRow[] = [
      { field: 'name', label: 'Full Name' },
      { field: 'age', semanticHint: 'measure' },
    ];
    const { enrichments: result, errors } = parseCSVEnrichments(rows);
    expect(errors).toHaveLength(0);
    expect(result).toHaveLength(2);
  });

  it('reports error for missing field name', () => {
    const rows: CSVRow[] = [{ field: '', label: 'No field' }];
    const { errors } = parseCSVEnrichments(rows);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('field name is required');
  });

  it('reports error for invalid semantic hint', () => {
    const rows: CSVRow[] = [{ field: 'name', semanticHint: 'invalid' }];
    const { errors } = parseCSVEnrichments(rows);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('invalid semantic hint');
  });

  it('applyBulkEnrichment merges entries', () => {
    let state = initialEnrichmentAdminState('ds-1', enrichments);
    const rows: CSVRow[] = [
      { field: 'revenue', label: 'Revenue Updated', unit: 'GBP' },
      { field: 'new_field', label: 'New Field' },
    ];
    state = applyBulkEnrichment(state, rows);
    expect(state.enrichments).toHaveLength(4);
    expect(state.enrichments.find(e => e.field === 'revenue')?.label).toBe('Revenue Updated');
    expect(state.dirty).toBe(true);
  });

  it('applyBulkEnrichment reports errors', () => {
    let state = initialEnrichmentAdminState('ds-1');
    const rows: CSVRow[] = [{ field: '', label: 'bad' }];
    state = applyBulkEnrichment(state, rows);
    expect(state.importErrors).toHaveLength(1);
    expect(state.enrichments).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

describe('preview', () => {
  it('builds enrichment preview', () => {
    const fields = [
      { field: 'revenue', label: 'Revenue' },
      { field: 'unknown_field' },
    ];
    const preview = buildEnrichmentPreview(fields, enrichments);
    expect(preview).toHaveLength(2);
    expect(preview[0].enrichedLabel).toBe('Total Revenue');
    expect(preview[0].unit).toBe('USD');
    expect(preview[1].enrichedLabel).toBe('unknown_field');
  });
});

// ---------------------------------------------------------------------------
// Save state
// ---------------------------------------------------------------------------

describe('markEnrichmentSaved', () => {
  it('clears dirty flag', () => {
    let state = initialEnrichmentAdminState('ds-1');
    state = addEnrichment(state, { field: 'x' });
    expect(state.dirty).toBe(true);
    state = markEnrichmentSaved(state);
    expect(state.dirty).toBe(false);
  });
});
