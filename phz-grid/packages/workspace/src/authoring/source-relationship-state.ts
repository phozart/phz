/**
 * @phozart/phz-workspace — Source Relationship State
 *
 * Pure functions for managing source-to-source relationships in the
 * dashboard editor. Relationships define filter propagation semantics
 * between data sources using join types (inner/left/right/full/none).
 */

import type { SourceRelationship, JoinType, SourceJoinKey } from '@phozart/phz-shared/types';

// ========================================================================
// Types
// ========================================================================

export interface SourceRelationshipEditorState {
  relationships: SourceRelationship[];
  editingRelationshipId?: string;
  editingDraft?: Partial<SourceRelationship>;
  validationErrors: string[];
  suggestedRelationships: SourceRelationship[];
}

// Schema info for auto-detection
export interface SourceSchemaInfo {
  sourceId: string;
  fields: Array<{ name: string; dataType: string }>;
}

// ========================================================================
// Initial state
// ========================================================================

export function initialSourceRelationshipState(): SourceRelationshipEditorState {
  return { relationships: [], validationErrors: [], suggestedRelationships: [] };
}

// ========================================================================
// CRUD
// ========================================================================

export function addSourceRelationship(
  state: SourceRelationshipEditorState,
  rel: SourceRelationship,
): SourceRelationshipEditorState {
  // No duplicate pairs
  const exists = state.relationships.some(
    r =>
      (r.leftSourceId === rel.leftSourceId && r.rightSourceId === rel.rightSourceId) ||
      (r.leftSourceId === rel.rightSourceId && r.rightSourceId === rel.leftSourceId),
  );
  if (exists) return state;
  return { ...state, relationships: [...state.relationships, rel] };
}

export function removeSourceRelationship(
  state: SourceRelationshipEditorState,
  id: string,
): SourceRelationshipEditorState {
  return { ...state, relationships: state.relationships.filter(r => r.id !== id) };
}

export function updateSourceRelationship(
  state: SourceRelationshipEditorState,
  id: string,
  updates: Partial<SourceRelationship>,
): SourceRelationshipEditorState {
  const idx = state.relationships.findIndex(r => r.id === id);
  if (idx === -1) return state;
  const updated = { ...state.relationships[idx], ...updates };
  const relationships = [...state.relationships];
  relationships[idx] = updated;
  return { ...state, relationships };
}

// ========================================================================
// Edit flow
// ========================================================================

export function startEditRelationship(
  state: SourceRelationshipEditorState,
  id: string,
): SourceRelationshipEditorState {
  const rel = state.relationships.find(r => r.id === id);
  if (!rel) return state;
  return { ...state, editingRelationshipId: id, editingDraft: { ...rel } };
}

export function commitEditRelationship(
  state: SourceRelationshipEditorState,
): SourceRelationshipEditorState {
  if (!state.editingRelationshipId || !state.editingDraft) return state;
  const relId = state.editingRelationshipId;
  const draft = state.editingDraft;
  const relationships = state.relationships.map(r =>
    r.id === relId ? { ...r, ...draft } as SourceRelationship : r,
  );
  return { ...state, relationships, editingRelationshipId: undefined, editingDraft: undefined };
}

export function cancelEditRelationship(
  state: SourceRelationshipEditorState,
): SourceRelationshipEditorState {
  return { ...state, editingRelationshipId: undefined, editingDraft: undefined };
}

// ========================================================================
// Auto-detect relationships
// ========================================================================

let relCounter = 0;

/**
 * Auto-detects relationships between sources based on field name + type matching.
 * Similar pattern to `autoSuggestFieldMapping` in cross-filter-rule-state.ts.
 */
export function autoDetectRelationships(
  schemas: SourceSchemaInfo[],
): SourceRelationship[] {
  if (schemas.length < 2) return [];

  const results: SourceRelationship[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < schemas.length; i++) {
    for (let j = i + 1; j < schemas.length; j++) {
      const a = schemas[i];
      const b = schemas[j];
      const pairKey = `${a.sourceId}:${b.sourceId}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const joinKeys: SourceJoinKey[] = [];
      const usedB = new Set<string>();

      // Pass 1: exact case-insensitive name match + same type
      for (const fa of a.fields) {
        const match = b.fields.find(
          fb =>
            !usedB.has(fb.name) &&
            fb.name.toLowerCase() === fa.name.toLowerCase() &&
            fb.dataType === fa.dataType,
        );
        if (match) {
          joinKeys.push({ leftField: fa.name, rightField: match.name });
          usedB.add(match.name);
        }
      }

      // Pass 2: suffix match (e.g. 'customer_id' <-> 'id' with same type)
      for (const fa of a.fields) {
        if (joinKeys.some(k => k.leftField === fa.name)) continue;
        const match = b.fields.find(
          fb =>
            !usedB.has(fb.name) &&
            fb.dataType === fa.dataType &&
            (fa.name.toLowerCase().endsWith(`_${fb.name.toLowerCase()}`) ||
             fb.name.toLowerCase().endsWith(`_${fa.name.toLowerCase()}`)),
        );
        if (match) {
          joinKeys.push({ leftField: fa.name, rightField: match.name });
          usedB.add(match.name);
        }
      }

      if (joinKeys.length > 0) {
        relCounter++;
        results.push({
          id: `rel_auto_${relCounter}`,
          leftSourceId: a.sourceId,
          rightSourceId: b.sourceId,
          joinType: 'inner',
          joinKeys,
        });
      }
    }
  }

  return results;
}

export function applySuggestedRelationships(
  state: SourceRelationshipEditorState,
): SourceRelationshipEditorState {
  let next = state;
  for (const rel of state.suggestedRelationships) {
    next = addSourceRelationship(next, rel);
  }
  return { ...next, suggestedRelationships: [] };
}

// ========================================================================
// Validation
// ========================================================================

export function validateRelationships(
  relationships: SourceRelationship[],
  availableSlotIds: string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const slotSet = new Set(availableSlotIds);

  for (const rel of relationships) {
    if (!slotSet.has(rel.leftSourceId)) {
      errors.push(`Left source "${rel.leftSourceId}" does not exist`);
    }
    if (!slotSet.has(rel.rightSourceId)) {
      errors.push(`Right source "${rel.rightSourceId}" does not exist`);
    }
    if (rel.leftSourceId === rel.rightSourceId) {
      errors.push(`Relationship "${rel.id}" is a self-join`);
    }
    if (rel.joinKeys.length === 0) {
      errors.push(`Relationship "${rel.id}" has no join keys`);
    }
  }

  // Check for duplicate pairs
  const pairSet = new Set<string>();
  for (const rel of relationships) {
    const pair = [rel.leftSourceId, rel.rightSourceId].sort().join(':');
    if (pairSet.has(pair)) {
      errors.push(`Duplicate relationship between "${rel.leftSourceId}" and "${rel.rightSourceId}"`);
    }
    pairSet.add(pair);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Reset the relationship counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetRelationshipCounter(): void {
  relCounter = 0;
}
