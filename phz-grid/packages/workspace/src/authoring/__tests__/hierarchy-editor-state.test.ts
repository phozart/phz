import { describe, it, expect } from 'vitest';
import {
  initialHierarchyEditorState,
  addHierarchy,
  removeHierarchy,
  updateHierarchy,
  startEdit,
  commitEdit,
  autoDetectDateHierarchy,
} from '../hierarchy-editor-state.js';
import type { HierarchyEditorState } from '../hierarchy-editor-state.js';
import { createCustomHierarchy, generateDateHierarchy } from '@phozart/phz-engine';
import type { FieldMetadata } from '@phozart/phz-shared/adapters';

describe('initialHierarchyEditorState', () => {
  it('creates empty state', () => {
    const state = initialHierarchyEditorState();
    expect(state.hierarchies).toHaveLength(0);
    expect(state.editingId).toBeUndefined();
    expect(state.editingDraft).toBeUndefined();
    expect(state.autoDetectedDate).toBeUndefined();
  });
});

describe('addHierarchy', () => {
  it('adds a hierarchy to the list', () => {
    const state = initialHierarchyEditorState();
    const h = createCustomHierarchy('Geo', ['country', 'state']);
    const next = addHierarchy(state, h);
    expect(next.hierarchies).toHaveLength(1);
    expect(next.hierarchies[0].name).toBe('Geo');
  });

  it('preserves existing hierarchies', () => {
    let state = initialHierarchyEditorState();
    const h1 = createCustomHierarchy('Geo', ['country', 'state']);
    const h2 = createCustomHierarchy('Time', ['year', 'month']);
    state = addHierarchy(state, h1);
    state = addHierarchy(state, h2);
    expect(state.hierarchies).toHaveLength(2);
  });
});

describe('removeHierarchy', () => {
  it('removes a hierarchy by id', () => {
    let state = initialHierarchyEditorState();
    const h = createCustomHierarchy('Geo', ['country', 'state']);
    state = addHierarchy(state, h);
    const next = removeHierarchy(state, h.id);
    expect(next.hierarchies).toHaveLength(0);
  });

  it('is a no-op for unknown id', () => {
    const state = initialHierarchyEditorState();
    const next = removeHierarchy(state, 'nonexistent');
    expect(next.hierarchies).toHaveLength(0);
  });
});

describe('startEdit / commitEdit', () => {
  it('startEdit sets editingId and draft from existing hierarchy', () => {
    let state = initialHierarchyEditorState();
    const h = createCustomHierarchy('Geo', ['country', 'state']);
    state = addHierarchy(state, h);
    const editing = startEdit(state, h.id);
    expect(editing.editingId).toBe(h.id);
    expect(editing.editingDraft).toBeDefined();
    expect(editing.editingDraft?.name).toBe('Geo');
  });

  it('commitEdit replaces the hierarchy in the list', () => {
    let state = initialHierarchyEditorState();
    const h = createCustomHierarchy('Geo', ['country', 'state']);
    state = addHierarchy(state, h);
    state = startEdit(state, h.id);
    const draft = { ...h, name: 'Geography Updated' };
    state = { ...state, editingDraft: draft };
    const committed = commitEdit(state);
    expect(committed.editingId).toBeUndefined();
    expect(committed.editingDraft).toBeUndefined();
    expect(committed.hierarchies[0].name).toBe('Geography Updated');
  });
});

describe('updateHierarchy', () => {
  it('replaces a hierarchy with a new version', () => {
    let state = initialHierarchyEditorState();
    const h = createCustomHierarchy('Geo', ['country', 'state']);
    state = addHierarchy(state, h);
    const updated = { ...h, name: 'Updated Geo' };
    const next = updateHierarchy(state, updated);
    expect(next.hierarchies[0].name).toBe('Updated Geo');
  });
});

describe('autoDetectDateHierarchy', () => {
  it('detects a date field and generates a hierarchy', () => {
    const fields: FieldMetadata[] = [
      { name: 'revenue', dataType: 'number', nullable: false },
      { name: 'orderDate', dataType: 'date', nullable: false },
      { name: 'region', dataType: 'string', nullable: false },
    ];
    const state = initialHierarchyEditorState();
    const next = autoDetectDateHierarchy(state, fields);
    expect(next.autoDetectedDate).toBe('orderDate');
    expect(next.hierarchies).toHaveLength(1);
    expect(next.hierarchies[0].levels).toHaveLength(5);
  });

  it('returns unchanged state when no date fields exist', () => {
    const fields: FieldMetadata[] = [
      { name: 'revenue', dataType: 'number', nullable: false },
      { name: 'region', dataType: 'string', nullable: false },
    ];
    const state = initialHierarchyEditorState();
    const next = autoDetectDateHierarchy(state, fields);
    expect(next.autoDetectedDate).toBeUndefined();
    expect(next.hierarchies).toHaveLength(0);
  });
});
