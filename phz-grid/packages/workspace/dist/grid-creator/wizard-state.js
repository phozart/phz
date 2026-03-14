/**
 * @phozart/grid-creator — Wizard State Management
 *
 * Pure functions for wizard navigation, validation, and draft state.
 */
const STEPS = [
    { index: 0, name: 'Report Identity', required: true },
    { index: 1, name: 'Data Source', required: true },
    { index: 2, name: 'Column Selection', required: true },
    { index: 3, name: 'Configuration', required: false },
    { index: 4, name: 'Review & Create', required: true },
];
export function createWizardState() {
    return {
        currentStep: 0,
        totalSteps: STEPS.length,
        draft: {
            name: '',
            description: '',
            dataProductId: '',
            columns: [],
            config: {},
        },
        completedSteps: new Set(),
    };
}
export function nextStep(state) {
    return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, STEPS.length - 1),
    };
}
export function prevStep(state) {
    return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
    };
}
export function getStepConfig(index) {
    return STEPS[index] ?? STEPS[0];
}
export function canProceed(state) {
    switch (state.currentStep) {
        case 0:
            return state.draft.name.trim().length > 0;
        case 1:
            return state.draft.dataProductId.trim().length > 0;
        case 2:
        case 3:
        case 4:
            return true;
        default:
            return false;
    }
}
export function buildReviewSummary(state) {
    return {
        name: state.draft.name,
        description: state.draft.description,
        dataProductId: state.draft.dataProductId,
        columnCount: state.draft.columns.length,
    };
}
export function buildCreatePayload(state) {
    return {
        name: state.draft.name,
        description: state.draft.description,
        dataProductId: state.draft.dataProductId,
        columns: state.draft.columns,
        config: state.draft.config,
    };
}
//# sourceMappingURL=wizard-state.js.map