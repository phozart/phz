/**
 * @phozart/phz-workspace — Creation Wizard Simplification State (B-3.02)
 *
 * Simplified 3-step wizard: Choose Type -> Configure -> Review.
 * Supports template selection from the templates subsystem and quick-create
 * shortcuts for common artifact types.
 */
export const QUICK_CREATE_PRESETS = [
    {
        id: 'blank-report',
        label: 'Blank Report',
        artifactType: 'report',
        templateId: 'blank',
        defaultConfig: {},
    },
    {
        id: 'blank-dashboard',
        label: 'Blank Dashboard',
        artifactType: 'dashboard',
        templateId: 'blank',
        defaultConfig: {},
    },
    {
        id: 'kpi-dashboard',
        label: 'KPI Dashboard',
        artifactType: 'dashboard',
        templateId: 'kpi-overview',
        defaultConfig: { layout: 'kpi-grid' },
    },
];
// ========================================================================
// Step order
// ========================================================================
const STEP_ORDER = ['choose-type', 'configure', 'review'];
// ========================================================================
// Factory
// ========================================================================
export function initialCreationWizardState() {
    return {
        step: 'choose-type',
        name: '',
        description: '',
        config: {},
        quickCreate: false,
    };
}
// ========================================================================
// Step validation
// ========================================================================
export function canProceedWizard(state) {
    switch (state.step) {
        case 'choose-type':
            return state.artifactType !== undefined;
        case 'configure':
            return state.name.trim().length > 0 && state.dataSourceId !== undefined;
        case 'review':
            return false; // terminal step — finalize instead
    }
}
// ========================================================================
// Navigation
// ========================================================================
export function nextWizardStep(state) {
    if (!canProceedWizard(state))
        return state;
    const idx = STEP_ORDER.indexOf(state.step);
    if (idx < 0 || idx >= STEP_ORDER.length - 1)
        return state;
    return { ...state, step: STEP_ORDER[idx + 1] };
}
export function prevWizardStep(state) {
    const idx = STEP_ORDER.indexOf(state.step);
    if (idx <= 0)
        return state;
    return { ...state, step: STEP_ORDER[idx - 1] };
}
// ========================================================================
// Field setters
// ========================================================================
export function selectWizardType(state, artifactType) {
    return { ...state, artifactType };
}
export function selectWizardTemplate(state, templateId) {
    return { ...state, templateId };
}
export function setWizardName(state, name) {
    return { ...state, name };
}
export function setWizardDescription(state, description) {
    return { ...state, description };
}
export function setWizardDataSource(state, dataSourceId) {
    return { ...state, dataSourceId };
}
export function setWizardConfig(state, config) {
    return { ...state, config: { ...state.config, ...config } };
}
// ========================================================================
// Quick-create
// ========================================================================
export function applyQuickCreate(state, preset, dataSourceId, name) {
    return {
        ...state,
        step: 'review',
        artifactType: preset.artifactType,
        templateId: preset.templateId,
        dataSourceId,
        name,
        config: { ...preset.defaultConfig },
        quickCreate: true,
    };
}
// ========================================================================
// Filter templates by artifact type
// ========================================================================
export function filterTemplatesForType(templates, artifactType) {
    // Dashboard templates are category 'dashboard', report templates are 'report'
    return templates.filter(t => t.category === artifactType || t.category === 'general');
}
// ========================================================================
// Finalize
// ========================================================================
export function finalizeWizard(state) {
    if (!state.artifactType ||
        !state.dataSourceId ||
        !state.name.trim()) {
        return null;
    }
    return {
        artifactType: state.artifactType,
        templateId: state.templateId ?? 'blank',
        name: state.name.trim(),
        description: state.description.trim(),
        dataSourceId: state.dataSourceId,
        config: state.config,
    };
}
//# sourceMappingURL=creation-wizard-state.js.map