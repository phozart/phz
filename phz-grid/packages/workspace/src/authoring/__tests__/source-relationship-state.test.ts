import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialSourceRelationshipState,
  addSourceRelationship,
  removeSourceRelationship,
  updateSourceRelationship,
  startEditRelationship,
  commitEditRelationship,
  cancelEditRelationship,
  autoDetectRelationships,
  applySuggestedRelationships,
  validateRelationships,
  _resetRelationshipCounter,
  type SourceRelationshipEditorState,
  type SourceSchemaInfo,
} from '../source-relationship-state.js';
import type { SourceRelationship } from '@phozart/phz-shared/types';

// ── Helpers ──────────────────────────────────────────────────────

function makeRel(overrides: Partial<SourceRelationship> = {}): SourceRelationship {
  return {
    id: 'rel-1',
    leftSourceId: 'src-a',
    rightSourceId: 'src-b',
    joinType: 'inner',
    joinKeys: [{ leftField: 'id', rightField: 'id' }],
    ...overrides,
  };
}

const slotIds = ['src-a', 'src-b', 'src-c', 'src-d'];

// ── Tests ────────────────────────────────────────────────────────

describe('SourceRelationshipState', () => {
  beforeEach(() => {
    _resetRelationshipCounter();
  });

  // ── Initial state ────────────────────────────────────────────

  describe('initialSourceRelationshipState', () => {
    it('creates empty state with no relationships', () => {
      const s = initialSourceRelationshipState();
      expect(s.relationships).toEqual([]);
      expect(s.editingRelationshipId).toBeUndefined();
      expect(s.editingDraft).toBeUndefined();
      expect(s.validationErrors).toEqual([]);
      expect(s.suggestedRelationships).toEqual([]);
    });
  });

  // ── CRUD ─────────────────────────────────────────────────────

  describe('addSourceRelationship', () => {
    it('appends a relationship to the list', () => {
      const s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      expect(s.relationships).toHaveLength(1);
      expect(s.relationships[0].id).toBe('rel-1');
    });

    it('does not mutate the original state', () => {
      const original = initialSourceRelationshipState();
      addSourceRelationship(original, makeRel());
      expect(original.relationships).toHaveLength(0);
    });

    it('prevents duplicate pairs (same direction)', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = addSourceRelationship(s, makeRel({ id: 'rel-dup' }));
      expect(s.relationships).toHaveLength(1);
      expect(s.relationships[0].id).toBe('rel-1');
    });

    it('prevents duplicate pairs (reversed direction)', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = addSourceRelationship(s, makeRel({
        id: 'rel-rev',
        leftSourceId: 'src-b',
        rightSourceId: 'src-a',
      }));
      expect(s.relationships).toHaveLength(1);
    });

    it('allows different pairs', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = addSourceRelationship(s, makeRel({
        id: 'rel-2',
        leftSourceId: 'src-a',
        rightSourceId: 'src-c',
      }));
      expect(s.relationships).toHaveLength(2);
    });
  });

  describe('removeSourceRelationship', () => {
    it('removes a relationship by id', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel({ id: 'rel-1' }));
      s = addSourceRelationship(s, makeRel({
        id: 'rel-2',
        leftSourceId: 'src-c',
        rightSourceId: 'src-d',
      }));
      s = removeSourceRelationship(s, 'rel-1');
      expect(s.relationships).toHaveLength(1);
      expect(s.relationships[0].id).toBe('rel-2');
    });

    it('returns state unchanged for nonexistent id', () => {
      const s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      const s2 = removeSourceRelationship(s, 'nonexistent');
      expect(s2.relationships).toHaveLength(1);
    });
  });

  describe('updateSourceRelationship', () => {
    it('partially updates a relationship by id', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = updateSourceRelationship(s, 'rel-1', { joinType: 'left' });
      expect(s.relationships[0].joinType).toBe('left');
      expect(s.relationships[0].leftSourceId).toBe('src-a'); // unchanged
    });

    it('updates join keys', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      const newKeys = [{ leftField: 'customer_id', rightField: 'cust_id' }];
      s = updateSourceRelationship(s, 'rel-1', { joinKeys: newKeys });
      expect(s.relationships[0].joinKeys).toEqual(newKeys);
    });

    it('returns state unchanged for nonexistent id', () => {
      const s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      const s2 = updateSourceRelationship(s, 'nonexistent', { joinType: 'full' });
      expect(s2).toBe(s);
    });
  });

  // ── Edit flow ────────────────────────────────────────────────

  describe('edit flow', () => {
    it('startEditRelationship loads draft from existing relationship', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = startEditRelationship(s, 'rel-1');
      expect(s.editingRelationshipId).toBe('rel-1');
      expect(s.editingDraft).toBeDefined();
      expect(s.editingDraft?.leftSourceId).toBe('src-a');
    });

    it('startEditRelationship is no-op for nonexistent id', () => {
      const s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      const s2 = startEditRelationship(s, 'nonexistent');
      expect(s2.editingRelationshipId).toBeUndefined();
      expect(s2.editingDraft).toBeUndefined();
    });

    it('commitEditRelationship saves draft back into relationships', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = startEditRelationship(s, 'rel-1');
      s = { ...s, editingDraft: { ...s.editingDraft, joinType: 'full' as const } };
      s = commitEditRelationship(s);
      expect(s.relationships[0].joinType).toBe('full');
      expect(s.editingRelationshipId).toBeUndefined();
      expect(s.editingDraft).toBeUndefined();
    });

    it('cancelEditRelationship discards draft', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      s = startEditRelationship(s, 'rel-1');
      s = cancelEditRelationship(s);
      expect(s.editingRelationshipId).toBeUndefined();
      expect(s.editingDraft).toBeUndefined();
      expect(s.relationships[0].joinType).toBe('inner'); // unchanged
    });

    it('commitEditRelationship is no-op without active draft', () => {
      const s = addSourceRelationship(initialSourceRelationshipState(), makeRel());
      const s2 = commitEditRelationship(s);
      expect(s2).toBe(s);
    });
  });

  // ── Auto-detect relationships ────────────────────────────────

  describe('autoDetectRelationships', () => {
    it('returns empty for single source', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'src-a', fields: [{ name: 'id', dataType: 'string' }] },
      ];
      expect(autoDetectRelationships(schemas)).toEqual([]);
    });

    it('returns empty for empty schemas array', () => {
      expect(autoDetectRelationships([])).toEqual([]);
    });

    it('detects exact name match (case-insensitive) with same type', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'orders', fields: [{ name: 'CustomerId', dataType: 'string' }] },
        { sourceId: 'customers', fields: [{ name: 'customerid', dataType: 'string' }] },
      ];
      const results = autoDetectRelationships(schemas);
      expect(results).toHaveLength(1);
      expect(results[0].leftSourceId).toBe('orders');
      expect(results[0].rightSourceId).toBe('customers');
      expect(results[0].joinKeys).toEqual([
        { leftField: 'CustomerId', rightField: 'customerid' },
      ]);
      expect(results[0].joinType).toBe('inner');
    });

    it('does not match fields with different data types', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'src-a', fields: [{ name: 'id', dataType: 'string' }] },
        { sourceId: 'src-b', fields: [{ name: 'id', dataType: 'number' }] },
      ];
      expect(autoDetectRelationships(schemas)).toEqual([]);
    });

    it('detects suffix match (e.g. customer_id <-> id)', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'orders', fields: [{ name: 'customer_id', dataType: 'integer' }] },
        { sourceId: 'customers', fields: [{ name: 'id', dataType: 'integer' }] },
      ];
      const results = autoDetectRelationships(schemas);
      expect(results).toHaveLength(1);
      expect(results[0].joinKeys).toEqual([
        { leftField: 'customer_id', rightField: 'id' },
      ]);
    });

    it('detects reverse suffix match (e.g. id <-> order_id)', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'products', fields: [{ name: 'id', dataType: 'integer' }] },
        { sourceId: 'line_items', fields: [{ name: 'product_id', dataType: 'integer' }] },
      ];
      const results = autoDetectRelationships(schemas);
      expect(results).toHaveLength(1);
      expect(results[0].joinKeys).toEqual([
        { leftField: 'id', rightField: 'product_id' },
      ]);
    });

    it('handles multiple sources (3-way)', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'orders', fields: [{ name: 'id', dataType: 'string' }, { name: 'customer_id', dataType: 'string' }] },
        { sourceId: 'customers', fields: [{ name: 'id', dataType: 'string' }] },
        { sourceId: 'invoices', fields: [{ name: 'order_id', dataType: 'string' }] },
      ];
      const results = autoDetectRelationships(schemas);
      // orders <-> customers: 'id' exact match + 'customer_id' suffix match with 'id'
      // orders <-> invoices: 'id' suffix match with 'order_id'
      // customers <-> invoices: no match (id vs order_id, different suffix root)
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('returns no matches when schemas have completely disjoint fields', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'src-a', fields: [{ name: 'alpha', dataType: 'string' }] },
        { sourceId: 'src-b', fields: [{ name: 'beta', dataType: 'number' }] },
      ];
      expect(autoDetectRelationships(schemas)).toEqual([]);
    });

    it('generates deterministic IDs after counter reset', () => {
      const schemas: SourceSchemaInfo[] = [
        { sourceId: 'src-a', fields: [{ name: 'id', dataType: 'string' }] },
        { sourceId: 'src-b', fields: [{ name: 'id', dataType: 'string' }] },
      ];
      const r1 = autoDetectRelationships(schemas);
      expect(r1[0].id).toBe('rel_auto_1');

      _resetRelationshipCounter();
      const r2 = autoDetectRelationships(schemas);
      expect(r2[0].id).toBe('rel_auto_1');
    });
  });

  // ── Apply suggested ──────────────────────────────────────────

  describe('applySuggestedRelationships', () => {
    it('applies all suggested relationships to state', () => {
      const suggested: SourceRelationship[] = [
        makeRel({ id: 'sug-1', leftSourceId: 'src-a', rightSourceId: 'src-b' }),
        makeRel({ id: 'sug-2', leftSourceId: 'src-c', rightSourceId: 'src-d' }),
      ];
      const s: SourceRelationshipEditorState = {
        ...initialSourceRelationshipState(),
        suggestedRelationships: suggested,
      };
      const result = applySuggestedRelationships(s);
      expect(result.relationships).toHaveLength(2);
      expect(result.suggestedRelationships).toEqual([]);
    });

    it('clears the suggestions list after applying', () => {
      const suggested: SourceRelationship[] = [
        makeRel({ id: 'sug-1' }),
      ];
      const s: SourceRelationshipEditorState = {
        ...initialSourceRelationshipState(),
        suggestedRelationships: suggested,
      };
      const result = applySuggestedRelationships(s);
      expect(result.suggestedRelationships).toHaveLength(0);
    });

    it('skips suggestions that duplicate existing relationships', () => {
      let s = addSourceRelationship(initialSourceRelationshipState(), makeRel({ id: 'existing' }));
      s = {
        ...s,
        suggestedRelationships: [
          makeRel({ id: 'sug-dup', leftSourceId: 'src-a', rightSourceId: 'src-b' }),
        ],
      };
      const result = applySuggestedRelationships(s);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].id).toBe('existing');
    });
  });

  // ── Validation ───────────────────────────────────────────────

  describe('validateRelationships', () => {
    it('returns valid for well-formed relationships', () => {
      const rels = [makeRel()];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns valid for empty relationships', () => {
      const result = validateRelationships([], slotIds);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('catches missing left source', () => {
      const rels = [makeRel({ leftSourceId: 'missing' })];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Left source') && e.includes('missing'))).toBe(true);
    });

    it('catches missing right source', () => {
      const rels = [makeRel({ rightSourceId: 'missing' })];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Right source') && e.includes('missing'))).toBe(true);
    });

    it('catches self-join', () => {
      const rels = [makeRel({ leftSourceId: 'src-a', rightSourceId: 'src-a' })];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('self-join'))).toBe(true);
    });

    it('catches empty join keys', () => {
      const rels = [makeRel({ joinKeys: [] })];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('no join keys'))).toBe(true);
    });

    it('catches duplicate pairs', () => {
      const rels = [
        makeRel({ id: 'rel-1', leftSourceId: 'src-a', rightSourceId: 'src-b' }),
        makeRel({ id: 'rel-2', leftSourceId: 'src-b', rightSourceId: 'src-a' }),
      ];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate relationship'))).toBe(true);
    });

    it('catches duplicate pairs (same direction)', () => {
      const rels = [
        makeRel({ id: 'rel-1', leftSourceId: 'src-a', rightSourceId: 'src-b' }),
        makeRel({ id: 'rel-2', leftSourceId: 'src-a', rightSourceId: 'src-b' }),
      ];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
    });

    it('reports all errors when multiple validations fail', () => {
      const rels = [makeRel({ leftSourceId: 'missing', rightSourceId: 'missing', joinKeys: [] })];
      const result = validateRelationships(rels, slotIds);
      expect(result.valid).toBe(false);
      // Should have at least: missing left, missing right, no join keys
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('returns invalid when availableSlotIds is empty', () => {
      const rels = [makeRel()];
      const result = validateRelationships(rels, []);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('does not exist'))).toBe(true);
    });
  });
});
