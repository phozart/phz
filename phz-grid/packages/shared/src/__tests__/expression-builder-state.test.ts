/**
 * Tests for Expression Builder State (C-2.10)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExpressionBuilderState,
  addNode,
  removeNode,
  updateNode,
  buildExpression,
  validateExpression,
  resetNodeCounter,
} from '../coordination/expression-builder-state.js';
import type { ExpressionNode } from '../coordination/expression-builder-state.js';

beforeEach(() => {
  resetNodeCounter();
});

describe('createExpressionBuilderState', () => {
  it('creates default state', () => {
    const state = createExpressionBuilderState();
    expect(state.root).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.availableFields).toEqual([]);
    expect(state.availableOperators.length).toBeGreaterThan(0);
    expect(state.availableFunctions.length).toBeGreaterThan(0);
    expect(state.expression).toBe('');
    expect(state.valid).toBe(true);
    expect(state.errors).toEqual([]);
  });

  it('accepts field names', () => {
    const state = createExpressionBuilderState(['price', 'quantity']);
    expect(state.availableFields).toEqual(['price', 'quantity']);
  });
});

describe('addNode', () => {
  it('adds a root node', () => {
    const state = createExpressionBuilderState();
    const next = addNode(state, null, { type: 'field', value: 'price' });
    expect(next.root).not.toBeNull();
    expect(next.root!.type).toBe('field');
    expect(next.root!.value).toBe('price');
    expect(next.selectedNodeId).toBe(next.root!.id);
    expect(next.expression).toBe('price');
  });

  it('replaces root when adding to null parent', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'field', value: 'price' });
    state = addNode(state, null, { type: 'field', value: 'quantity' });
    expect(state.root!.value).toBe('quantity');
    expect(state.expression).toBe('quantity');
  });

  it('adds child to existing node', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: '>' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'price' });
    state = addNode(state, rootId, { type: 'value', value: '100' });

    expect(state.root!.children).toHaveLength(2);
    expect(state.expression).toBe('price > 100');
  });

  it('returns state unchanged when adding child to null root', () => {
    const state = createExpressionBuilderState();
    const next = addNode(state, 'nonexistent', { type: 'field', value: 'x' });
    expect(next.root).toBeNull();
  });

  it('adds function with children', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'function', value: 'SUM' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'price' });
    expect(state.expression).toBe('SUM(price)');
  });

  it('handles group nodes', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'group', value: '' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'a' });
    state = addNode(state, rootId, { type: 'operator', value: '+' });
    state = addNode(state, rootId, { type: 'field', value: 'b' });
    expect(state.expression).toBe('(a + b)');
  });
});

describe('removeNode', () => {
  it('clears the tree when root is removed', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'field', value: 'price' });
    const rootId = state.root!.id;
    state = removeNode(state, rootId);
    expect(state.root).toBeNull();
    expect(state.expression).toBe('');
    expect(state.selectedNodeId).toBeNull();
  });

  it('removes a child node', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: '+' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'a' });
    state = addNode(state, rootId, { type: 'field', value: 'b' });
    const childId = state.root!.children![0].id;
    state = removeNode(state, childId);
    expect(state.root!.children).toHaveLength(1);
    expect(state.root!.children![0].value).toBe('b');
  });

  it('returns state unchanged for empty tree', () => {
    const state = createExpressionBuilderState();
    const next = removeNode(state, 'nonexistent');
    expect(next).toBe(state);
  });

  it('clears selectedNodeId when selected node is removed', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: '+' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'a' });
    // Last added node is selected
    const selectedId = state.selectedNodeId!;
    state = removeNode(state, selectedId);
    expect(state.selectedNodeId).toBeNull();
  });
});

describe('updateNode', () => {
  it('updates node value', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'field', value: 'price' });
    const rootId = state.root!.id;
    state = updateNode(state, rootId, { value: 'quantity' });
    expect(state.root!.value).toBe('quantity');
    expect(state.expression).toBe('quantity');
  });

  it('does not change node ID', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'field', value: 'price' });
    const rootId = state.root!.id;
    state = updateNode(state, rootId, { value: 'q', id: 'hack' } as Partial<ExpressionNode>);
    expect(state.root!.id).toBe(rootId);
  });

  it('returns state unchanged for empty tree', () => {
    const state = createExpressionBuilderState();
    const next = updateNode(state, 'nonexistent', { value: 'x' });
    expect(next).toBe(state);
  });

  it('updates child node', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: '>' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'price' });
    const childId = state.root!.children![0].id;
    state = updateNode(state, childId, { value: 'quantity' });
    expect(state.root!.children![0].value).toBe('quantity');
  });
});

describe('buildExpression', () => {
  it('returns empty string for null root', () => {
    const state = createExpressionBuilderState();
    expect(buildExpression(state)).toBe('');
  });

  it('builds field expression', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'field', value: 'revenue' });
    expect(buildExpression(state)).toBe('revenue');
  });

  it('builds value expression', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'value', value: '42' });
    expect(buildExpression(state)).toBe('42');
  });

  it('builds binary operator expression', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: 'AND' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'a' });
    state = addNode(state, rootId, { type: 'field', value: 'b' });
    expect(buildExpression(state)).toBe('a AND b');
  });

  it('builds unary operator expression', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: 'NOT' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'active' });
    expect(buildExpression(state)).toBe('NOT active');
  });

  it('builds function expression with multiple args', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'function', value: 'COALESCE' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'a' });
    state = addNode(state, rootId, { type: 'field', value: 'b' });
    state = addNode(state, rootId, { type: 'value', value: '0' });
    expect(buildExpression(state)).toBe('COALESCE(a, b, 0)');
  });

  it('builds operator without children', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: '+' });
    expect(buildExpression(state)).toBe('+');
  });
});

describe('validateExpression', () => {
  it('validates empty state as valid', () => {
    const state = createExpressionBuilderState();
    const validated = validateExpression(state);
    expect(validated.valid).toBe(true);
    expect(validated.errors).toEqual([]);
  });

  it('detects unknown field when fields are specified', () => {
    let state = createExpressionBuilderState(['price', 'quantity']);
    state = addNode(state, null, { type: 'field', value: 'unknown_field' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors).toContain('Unknown field: "unknown_field"');
  });

  it('accepts known field', () => {
    let state = createExpressionBuilderState(['price']);
    state = addNode(state, null, { type: 'field', value: 'price' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(true);
  });

  it('skips field validation when no fields specified', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'field', value: 'anything' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(true);
  });

  it('detects unknown operator', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: '???' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors[0]).toContain('Unknown operator');
  });

  it('detects NOT with wrong number of operands', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: 'NOT' });
    // No children
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors.some(e => e.includes('NOT'))).toBe(true);
  });

  it('detects AND with fewer than 2 operands', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'operator', value: 'AND' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'a' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors.some(e => e.includes('AND'))).toBe(true);
  });

  it('detects empty value node', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'value', value: '' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors).toContain('Empty value node');
  });

  it('accepts value node with "0"', () => {
    let state = createExpressionBuilderState();
    state = addNode(state, null, { type: 'value', value: '0' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(true);
  });

  it('detects unknown function', () => {
    let state = createExpressionBuilderState();
    // Add a function that's not in the defaults
    state = {
      ...state,
      availableFunctions: ['SUM'],
    };
    state = addNode(state, null, { type: 'function', value: 'CUSTOM_FN' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors[0]).toContain('Unknown function');
  });

  it('validates nested tree recursively', () => {
    let state = createExpressionBuilderState(['price']);
    state = addNode(state, null, { type: 'operator', value: 'AND' });
    const rootId = state.root!.id;
    state = addNode(state, rootId, { type: 'field', value: 'price' });
    state = addNode(state, rootId, { type: 'field', value: 'unknown' });
    const validated = validateExpression(state);
    expect(validated.valid).toBe(false);
    expect(validated.errors.some(e => e.includes('Unknown field'))).toBe(true);
  });
});
