/**
 * @phozart/workspace — Report Drill Config State
 *
 * Pure functions for managing drill-through action configuration
 * on report columns. Supports CRUD operations on drill actions
 * with draft editing and validation.
 */
export type DrillOpenMode = 'navigate' | 'modal' | 'panel' | 'new-tab';
export interface DrillFilterMapping {
    sourceField: string;
    targetField: string;
}
export interface DrillAction {
    id: string;
    label: string;
    targetArtifactId: string;
    targetArtifactType: 'report' | 'dashboard';
    sourceField: string;
    openMode: DrillOpenMode;
    filterMappings: DrillFilterMapping[];
}
export interface ReportDrillConfigState {
    drillActions: DrillAction[];
    editingDrillId?: string;
    drillDraft?: Partial<DrillAction>;
}
export declare function initialReportDrillConfigState(): ReportDrillConfigState;
export declare function addDrillAction(state: ReportDrillConfigState, action: DrillAction): ReportDrillConfigState;
export declare function removeDrillAction(state: ReportDrillConfigState, actionId: string): ReportDrillConfigState;
export declare function updateDrillAction(state: ReportDrillConfigState, actionId: string, updates: Partial<DrillAction>): ReportDrillConfigState;
export declare function startEditDrill(state: ReportDrillConfigState, actionId: string): ReportDrillConfigState;
export declare function commitDrill(state: ReportDrillConfigState): ReportDrillConfigState;
export interface DrillValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateDrillConfig(action: Partial<DrillAction>): DrillValidationResult;
//# sourceMappingURL=report-drill-config-state.d.ts.map