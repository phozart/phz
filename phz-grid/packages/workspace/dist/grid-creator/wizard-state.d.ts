/**
 * @phozart/phz-grid-creator — Wizard State Management
 *
 * Pure functions for wizard navigation, validation, and draft state.
 */
export interface WizardDraft {
    name: string;
    description: string;
    dataProductId: string;
    columns: Array<{
        field: string;
        header?: string;
        [key: string]: unknown;
    }>;
    config: Record<string, unknown>;
}
export interface WizardState {
    currentStep: number;
    totalSteps: number;
    draft: WizardDraft;
    completedSteps: Set<number>;
}
export interface StepConfig {
    index: number;
    name: string;
    required: boolean;
}
export interface ReviewSummary {
    name: string;
    description: string;
    dataProductId: string;
    columnCount: number;
}
export interface CreatePayload {
    name: string;
    description: string;
    dataProductId: string;
    columns: Array<{
        field: string;
        header?: string;
        [key: string]: unknown;
    }>;
    config: Record<string, unknown>;
}
export declare function createWizardState(): WizardState;
export declare function nextStep(state: WizardState): WizardState;
export declare function prevStep(state: WizardState): WizardState;
export declare function getStepConfig(index: number): StepConfig;
export declare function canProceed(state: WizardState): boolean;
export declare function buildReviewSummary(state: WizardState): ReviewSummary;
export declare function buildCreatePayload(state: WizardState): CreatePayload;
//# sourceMappingURL=wizard-state.d.ts.map