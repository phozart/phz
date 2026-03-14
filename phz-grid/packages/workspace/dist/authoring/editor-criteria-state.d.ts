/**
 * @phozart/workspace — Editor Criteria State
 *
 * Pure functions for managing criteria bar integration in editors.
 * Controls criteria visibility, configuration, and active filters
 * within report and dashboard editors.
 */
export interface CriteriaFilterEntry {
    id: string;
    field: string;
    operator: string;
    value: unknown;
    label: string;
}
export interface CriteriaConfig {
    position: 'top' | 'left';
    collapsible: boolean;
    showActiveCount: boolean;
}
export interface EditorCriteriaState {
    criteriaVisible: boolean;
    criteriaConfig: CriteriaConfig;
    activeFilters: CriteriaFilterEntry[];
}
export declare function initialEditorCriteriaState(): EditorCriteriaState;
export declare function toggleCriteria(state: EditorCriteriaState): EditorCriteriaState;
export declare function setCriteriaConfig(state: EditorCriteriaState, config: Partial<CriteriaConfig>): EditorCriteriaState;
export declare function addCriteriaFilter(state: EditorCriteriaState, filter: CriteriaFilterEntry): EditorCriteriaState;
export declare function removeCriteriaFilter(state: EditorCriteriaState, filterId: string): EditorCriteriaState;
export declare function clearCriteriaFilters(state: EditorCriteriaState): EditorCriteriaState;
//# sourceMappingURL=editor-criteria-state.d.ts.map