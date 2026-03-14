/**
 * @phozart/workspace — Creation Flow State Machine
 *
 * Drives the 3-step creation wizard: choose-type → choose-source → choose-template → configure → done.
 */
export function initialCreationFlow() {
    return { step: 'choose-type', name: '' };
}
const STEP_ORDER = ['choose-type', 'choose-source', 'choose-template', 'configure', 'done'];
export function canProceed(state) {
    switch (state.step) {
        case 'choose-type': return state.artifactType !== undefined;
        case 'choose-source': return (state.dataSourceIds?.length ?? 0) > 0 || state.dataSourceId !== undefined;
        case 'choose-template': return state.templateId !== undefined; // 'blank' is a valid templateId
        case 'configure': return state.name.trim().length > 0;
        case 'done': return false;
    }
}
export function nextStep(state) {
    if (!canProceed(state))
        return state;
    const idx = STEP_ORDER.indexOf(state.step);
    if (idx < 0 || idx >= STEP_ORDER.length - 1)
        return state;
    // For reports, skip 'choose-template' step (reports don't use dashboard templates)
    let nextIdx = idx + 1;
    if (state.artifactType === 'report' && STEP_ORDER[nextIdx] === 'choose-template') {
        nextIdx++;
    }
    return { ...state, step: STEP_ORDER[nextIdx] };
}
export function prevStep(state) {
    const idx = STEP_ORDER.indexOf(state.step);
    if (idx <= 0)
        return state;
    // For reports, skip 'choose-template' step going backwards
    let prevIdx = idx - 1;
    if (state.artifactType === 'report' && STEP_ORDER[prevIdx] === 'choose-template') {
        prevIdx--;
    }
    return { ...state, step: STEP_ORDER[prevIdx] };
}
export function selectType(state, type) {
    return { ...state, artifactType: type };
}
export function selectDataSource(state, sourceId) {
    return { ...state, dataSourceId: sourceId };
}
export function selectMultipleDataSources(state, sourceIds) {
    return { ...state, dataSourceIds: sourceIds, dataSourceId: sourceIds[0] };
}
export function selectTemplate(state, templateIdOrBlank) {
    return { ...state, templateId: templateIdOrBlank };
}
export function setName(state, name) {
    return { ...state, name };
}
export function finishCreation(state) {
    const primarySourceId = state.dataSourceIds?.[0] ?? state.dataSourceId;
    if (!state.artifactType || !primarySourceId || !state.name.trim())
        return null;
    return {
        artifactType: state.artifactType,
        dataSourceId: primarySourceId,
        dataSourceIds: state.dataSourceIds,
        templateId: state.templateId ?? 'blank',
        name: state.name.trim(),
    };
}
//# sourceMappingURL=creation-flow.js.map