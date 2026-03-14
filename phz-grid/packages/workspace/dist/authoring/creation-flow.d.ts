/**
 * @phozart/workspace — Creation Flow State Machine
 *
 * Drives the 3-step creation wizard: choose-type → choose-source → choose-template → configure → done.
 */
export type CreationStep = 'choose-type' | 'choose-source' | 'choose-template' | 'configure' | 'done';
export interface CreationFlowState {
    step: CreationStep;
    artifactType?: 'report' | 'dashboard';
    dataSourceId?: string;
    dataSourceIds?: string[];
    templateId?: string;
    name: string;
}
export declare function initialCreationFlow(): CreationFlowState;
export declare function canProceed(state: CreationFlowState): boolean;
export declare function nextStep(state: CreationFlowState): CreationFlowState;
export declare function prevStep(state: CreationFlowState): CreationFlowState;
export declare function selectType(state: CreationFlowState, type: 'report' | 'dashboard'): CreationFlowState;
export declare function selectDataSource(state: CreationFlowState, sourceId: string): CreationFlowState;
export declare function selectMultipleDataSources(state: CreationFlowState, sourceIds: string[]): CreationFlowState;
export declare function selectTemplate(state: CreationFlowState, templateIdOrBlank: string): CreationFlowState;
export declare function setName(state: CreationFlowState, name: string): CreationFlowState;
export interface CreationResult {
    artifactType: 'report' | 'dashboard';
    dataSourceId: string;
    dataSourceIds?: string[];
    templateId: string;
    name: string;
}
export declare function finishCreation(state: CreationFlowState): CreationResult | null;
//# sourceMappingURL=creation-flow.d.ts.map