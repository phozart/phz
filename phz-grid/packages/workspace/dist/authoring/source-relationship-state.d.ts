/**
 * @phozart/phz-workspace — Source Relationship State
 *
 * Pure functions for managing source-to-source relationships in the
 * dashboard editor. Relationships define filter propagation semantics
 * between data sources using join types (inner/left/right/full/none).
 */
import type { SourceRelationship } from '@phozart/phz-shared/types';
export interface SourceRelationshipEditorState {
    relationships: SourceRelationship[];
    editingRelationshipId?: string;
    editingDraft?: Partial<SourceRelationship>;
    validationErrors: string[];
    suggestedRelationships: SourceRelationship[];
}
export interface SourceSchemaInfo {
    sourceId: string;
    fields: Array<{
        name: string;
        dataType: string;
    }>;
}
export declare function initialSourceRelationshipState(): SourceRelationshipEditorState;
export declare function addSourceRelationship(state: SourceRelationshipEditorState, rel: SourceRelationship): SourceRelationshipEditorState;
export declare function removeSourceRelationship(state: SourceRelationshipEditorState, id: string): SourceRelationshipEditorState;
export declare function updateSourceRelationship(state: SourceRelationshipEditorState, id: string, updates: Partial<SourceRelationship>): SourceRelationshipEditorState;
export declare function startEditRelationship(state: SourceRelationshipEditorState, id: string): SourceRelationshipEditorState;
export declare function commitEditRelationship(state: SourceRelationshipEditorState): SourceRelationshipEditorState;
export declare function cancelEditRelationship(state: SourceRelationshipEditorState): SourceRelationshipEditorState;
/**
 * Auto-detects relationships between sources based on field name + type matching.
 * Similar pattern to `autoSuggestFieldMapping` in cross-filter-rule-state.ts.
 */
export declare function autoDetectRelationships(schemas: SourceSchemaInfo[]): SourceRelationship[];
export declare function applySuggestedRelationships(state: SourceRelationshipEditorState): SourceRelationshipEditorState;
export declare function validateRelationships(relationships: SourceRelationship[], availableSlotIds: string[]): {
    valid: boolean;
    errors: string[];
};
/**
 * Reset the relationship counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetRelationshipCounter(): void;
//# sourceMappingURL=source-relationship-state.d.ts.map