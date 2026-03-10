/**
 * Tests for resolveSemanticRole() and groupFieldsByRole().
 *
 * Covers:
 * - Explicit semanticHint takes priority
 * - DataType-based fallback (date→time, number→measure, boolean→dimension)
 * - Cardinality heuristics for strings
 * - Naming pattern detection (*_id, id suffix → identifier)
 * - Admin override precedence via enrichment
 * - groupFieldsByRole partitioning
 */
import {
  resolveSemanticRole,
  groupFieldsByRole,
  type SemanticRole,
} from '../types/semantic-role.js';
import type { FieldMetadata } from '../adapters/data-adapter.js';
import type { FieldEnrichment } from '../types/field-enrichment.js';

// ========================================================================
// Helpers
// ========================================================================

function field(overrides: Partial<FieldMetadata> & { name: string }): FieldMetadata {
  return {
    dataType: 'string',
    nullable: false,
    ...overrides,
  };
}

// ========================================================================
// resolveSemanticRole — explicit semanticHint
// ========================================================================

describe('resolveSemanticRole', () => {
  describe('explicit semanticHint on field', () => {
    it('maps dimension hint to dimension', () => {
      expect(resolveSemanticRole(field({ name: 'region', semanticHint: 'dimension' }))).toBe('dimension');
    });

    it('maps category hint to dimension', () => {
      expect(resolveSemanticRole(field({ name: 'status', semanticHint: 'category' }))).toBe('dimension');
    });

    it('maps measure hint to measure', () => {
      expect(resolveSemanticRole(field({ name: 'amount', semanticHint: 'measure', dataType: 'number' }))).toBe('measure');
    });

    it('maps currency hint to measure', () => {
      expect(resolveSemanticRole(field({ name: 'price', semanticHint: 'currency', dataType: 'number' }))).toBe('measure');
    });

    it('maps percentage hint to measure', () => {
      expect(resolveSemanticRole(field({ name: 'rate', semanticHint: 'percentage', dataType: 'number' }))).toBe('measure');
    });

    it('maps timestamp hint to time', () => {
      expect(resolveSemanticRole(field({ name: 'created_at', semanticHint: 'timestamp', dataType: 'date' }))).toBe('time');
    });

    it('maps identifier hint to identifier', () => {
      expect(resolveSemanticRole(field({ name: 'user_id', semanticHint: 'identifier' }))).toBe('identifier');
    });
  });

  // ========================================================================
  // resolveSemanticRole — dataType fallback
  // ========================================================================

  describe('dataType fallback (no semanticHint)', () => {
    it('date type → time', () => {
      expect(resolveSemanticRole(field({ name: 'order_date', dataType: 'date' }))).toBe('time');
    });

    it('boolean type → dimension', () => {
      expect(resolveSemanticRole(field({ name: 'is_active', dataType: 'boolean' }))).toBe('dimension');
    });

    it('number type → measure', () => {
      expect(resolveSemanticRole(field({ name: 'total', dataType: 'number' }))).toBe('measure');
    });
  });

  // ========================================================================
  // resolveSemanticRole — string cardinality heuristics
  // ========================================================================

  describe('string cardinality heuristics', () => {
    it('high cardinality string → identifier', () => {
      expect(resolveSemanticRole(field({ name: 'email', dataType: 'string', cardinality: 'high' }))).toBe('identifier');
    });

    it('low cardinality string → dimension', () => {
      expect(resolveSemanticRole(field({ name: 'country', dataType: 'string', cardinality: 'low' }))).toBe('dimension');
    });

    it('medium cardinality string → dimension', () => {
      expect(resolveSemanticRole(field({ name: 'city', dataType: 'string', cardinality: 'medium' }))).toBe('dimension');
    });
  });

  // ========================================================================
  // resolveSemanticRole — naming pattern detection
  // ========================================================================

  describe('naming pattern detection for strings without cardinality', () => {
    it('field ending in _id → identifier', () => {
      expect(resolveSemanticRole(field({ name: 'customer_id', dataType: 'string' }))).toBe('identifier');
    });

    it('field named exactly "id" → identifier', () => {
      expect(resolveSemanticRole(field({ name: 'id', dataType: 'string' }))).toBe('identifier');
    });

    it('field ending in Id (camelCase) → identifier', () => {
      expect(resolveSemanticRole(field({ name: 'orderId', dataType: 'string' }))).toBe('identifier');
    });

    it('field without id pattern → dimension', () => {
      expect(resolveSemanticRole(field({ name: 'name', dataType: 'string' }))).toBe('dimension');
    });
  });

  // ========================================================================
  // resolveSemanticRole — enrichment override
  // ========================================================================

  describe('enrichment override takes highest precedence', () => {
    it('enrichment semanticHint overrides field semanticHint', () => {
      const f = field({ name: 'status', semanticHint: 'dimension', dataType: 'string' });
      const enrichment: FieldEnrichment = { field: 'status', semanticHint: 'identifier' };
      expect(resolveSemanticRole(f, enrichment)).toBe('identifier');
    });

    it('enrichment semanticHint overrides dataType fallback', () => {
      const f = field({ name: 'count', dataType: 'number' });
      const enrichment: FieldEnrichment = { field: 'count', semanticHint: 'dimension' };
      expect(resolveSemanticRole(f, enrichment)).toBe('dimension');
    });

    it('enrichment without semanticHint does not override', () => {
      const f = field({ name: 'amount', semanticHint: 'measure', dataType: 'number' });
      const enrichment: FieldEnrichment = { field: 'amount', displayLabel: 'Total' };
      expect(resolveSemanticRole(f, enrichment)).toBe('measure');
    });
  });

  // ========================================================================
  // resolveSemanticRole — edge cases
  // ========================================================================

  describe('edge cases', () => {
    it('returns dimension for unknown dataType fallback', () => {
      // Force an unusual scenario: no hint, unknown-like type
      const f = field({ name: 'misc', dataType: 'string' });
      expect(resolveSemanticRole(f)).toBe('dimension');
    });

    it('handles undefined enrichment gracefully', () => {
      const f = field({ name: 'x', dataType: 'number' });
      expect(resolveSemanticRole(f, undefined)).toBe('measure');
    });
  });
});

// ========================================================================
// groupFieldsByRole
// ========================================================================

describe('groupFieldsByRole', () => {
  const fields: FieldMetadata[] = [
    field({ name: 'order_date', dataType: 'date' }),
    field({ name: 'region', dataType: 'string', cardinality: 'low' }),
    field({ name: 'revenue', dataType: 'number' }),
    field({ name: 'customer_id', dataType: 'string' }),
    field({ name: 'is_active', dataType: 'boolean' }),
    field({ name: 'profit', semanticHint: 'measure', dataType: 'number' }),
  ];

  it('groups fields into four categories', () => {
    const result = groupFieldsByRole(fields);
    expect(result.timeFields.map(f => f.name)).toEqual(['order_date']);
    expect(result.dimensions.map(f => f.name)).toEqual(['region', 'is_active']);
    expect(result.measures.map(f => f.name)).toEqual(['revenue', 'profit']);
    expect(result.identifiers.map(f => f.name)).toEqual(['customer_id']);
  });

  it('returns empty arrays for empty input', () => {
    const result = groupFieldsByRole([]);
    expect(result.dimensions).toEqual([]);
    expect(result.measures).toEqual([]);
    expect(result.timeFields).toEqual([]);
    expect(result.identifiers).toEqual([]);
  });

  it('preserves field order within each group', () => {
    const mixed: FieldMetadata[] = [
      field({ name: 'a', dataType: 'number' }),
      field({ name: 'b', dataType: 'number' }),
      field({ name: 'c', dataType: 'number' }),
    ];
    const result = groupFieldsByRole(mixed);
    expect(result.measures.map(f => f.name)).toEqual(['a', 'b', 'c']);
  });

  it('accepts optional enrichments map', () => {
    const testFields: FieldMetadata[] = [
      field({ name: 'count', dataType: 'number' }), // would be measure by default
    ];
    const enrichments: Record<string, FieldEnrichment> = {
      count: { field: 'count', semanticHint: 'dimension' },
    };
    const result = groupFieldsByRole(testFields, enrichments);
    expect(result.dimensions.map(f => f.name)).toEqual(['count']);
    expect(result.measures).toEqual([]);
  });
});
