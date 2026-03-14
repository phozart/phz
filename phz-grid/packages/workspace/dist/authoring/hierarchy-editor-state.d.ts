/**
 * @phozart/workspace — Hierarchy Editor State
 *
 * CRUD state machine for hierarchy definitions in the authoring environment.
 * Includes auto-detection of date fields from data source schema.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { HierarchyDefinition } from '@phozart/engine';
import type { FieldMetadata } from '@phozart/shared/adapters';
export interface HierarchyEditorState {
    hierarchies: HierarchyDefinition[];
    editingId?: string;
    editingDraft?: HierarchyDefinition;
    autoDetectedDate?: string;
}
export declare function initialHierarchyEditorState(): HierarchyEditorState;
export declare function addHierarchy(state: HierarchyEditorState, hierarchy: HierarchyDefinition): HierarchyEditorState;
export declare function removeHierarchy(state: HierarchyEditorState, hierarchyId: string): HierarchyEditorState;
export declare function updateHierarchy(state: HierarchyEditorState, updated: HierarchyDefinition): HierarchyEditorState;
export declare function startEdit(state: HierarchyEditorState, hierarchyId: string): HierarchyEditorState;
export declare function commitEdit(state: HierarchyEditorState): HierarchyEditorState;
/**
 * Scan field metadata for the first date-type field and auto-generate
 * a date hierarchy from it. Returns unchanged state if no date fields found.
 */
export declare function autoDetectDateHierarchy(state: HierarchyEditorState, fields: FieldMetadata[]): HierarchyEditorState;
//# sourceMappingURL=hierarchy-editor-state.d.ts.map