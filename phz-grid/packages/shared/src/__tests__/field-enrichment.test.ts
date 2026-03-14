/**
 * Tests for FieldEnrichment types and helpers.
 */
import {
  createFieldEnrichment,
  mergeFieldMetadata,
} from '@phozart/shared/types';
import type { FieldEnrichment, UnitSpec, SemanticHint } from '@phozart/shared/types';

// ========================================================================
// createFieldEnrichment
// ========================================================================

describe('createFieldEnrichment', () => {
  it('creates an enrichment with just a field name', () => {
    const result = createFieldEnrichment('revenue');
    expect(result).toEqual({ field: 'revenue' });
  });

  it('creates an enrichment with overrides', () => {
    const result = createFieldEnrichment('revenue', {
      semanticHint: 'measure',
      displayLabel: 'Total Revenue',
      description: 'Annual revenue in USD',
      format: '#,##0.00',
      unit: { type: 'currency', currencyCode: 'USD' },
    });
    expect(result.field).toBe('revenue');
    expect(result.semanticHint).toBe('measure');
    expect(result.displayLabel).toBe('Total Revenue');
    expect(result.description).toBe('Annual revenue in USD');
    expect(result.format).toBe('#,##0.00');
    expect(result.unit).toEqual({ type: 'currency', currencyCode: 'USD' });
  });

  it('ignores undefined overrides', () => {
    const result = createFieldEnrichment('count', { semanticHint: undefined });
    expect(result).toEqual({ field: 'count', semanticHint: undefined });
  });
});

// ========================================================================
// mergeFieldMetadata
// ========================================================================

describe('mergeFieldMetadata', () => {
  const rawField = {
    name: 'amount',
    dataType: 'number' as const,
    nullable: false,
    cardinality: 'high' as const,
    semanticHint: 'measure' as SemanticHint,
    unit: { type: 'number' as const, decimalPlaces: 2 },
  };

  it('returns raw metadata when no enrichment is provided', () => {
    const result = mergeFieldMetadata(rawField);
    expect(result.name).toBe('amount');
    expect(result.dataType).toBe('number');
    expect(result.nullable).toBe(false);
    expect(result.cardinality).toBe('high');
    expect(result.semanticHint).toBe('measure');
    expect(result.unit).toEqual({ type: 'number', decimalPlaces: 2 });
    expect(result.displayLabel).toBe('amount'); // falls back to name
    expect(result.description).toBeUndefined();
    expect(result.format).toBeUndefined();
  });

  it('returns raw metadata when enrichment is undefined', () => {
    const result = mergeFieldMetadata(rawField, undefined);
    expect(result.displayLabel).toBe('amount');
  });

  it('enrichment values override raw metadata', () => {
    const enrichment: FieldEnrichment = {
      field: 'amount',
      semanticHint: 'currency',
      unit: { type: 'currency', currencyCode: 'EUR' },
      displayLabel: 'Transaction Amount',
      description: 'The transaction amount in EUR',
      format: '#,##0.00',
    };

    const result = mergeFieldMetadata(rawField, enrichment);
    expect(result.semanticHint).toBe('currency');
    expect(result.unit).toEqual({ type: 'currency', currencyCode: 'EUR' });
    expect(result.displayLabel).toBe('Transaction Amount');
    expect(result.description).toBe('The transaction amount in EUR');
    expect(result.format).toBe('#,##0.00');
    // raw-only fields preserved
    expect(result.name).toBe('amount');
    expect(result.dataType).toBe('number');
    expect(result.nullable).toBe(false);
    expect(result.cardinality).toBe('high');
  });

  it('falls back to raw values when enrichment fields are undefined', () => {
    const enrichment: FieldEnrichment = { field: 'amount' };
    const result = mergeFieldMetadata(rawField, enrichment);
    expect(result.semanticHint).toBe('measure'); // from raw
    expect(result.unit).toEqual({ type: 'number', decimalPlaces: 2 }); // from raw
    expect(result.displayLabel).toBe('amount'); // fallback to name
  });

  it('works with minimal raw metadata (no optional fields)', () => {
    const minimal = { name: 'flag', dataType: 'boolean' as const, nullable: true };
    const result = mergeFieldMetadata(minimal);
    expect(result.name).toBe('flag');
    expect(result.dataType).toBe('boolean');
    expect(result.nullable).toBe(true);
    expect(result.cardinality).toBeUndefined();
    expect(result.semanticHint).toBeUndefined();
    expect(result.unit).toBeUndefined();
    expect(result.displayLabel).toBe('flag');
  });
});
