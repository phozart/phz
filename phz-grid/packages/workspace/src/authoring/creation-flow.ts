/**
 * @phozart/phz-workspace — Creation Flow State Machine
 *
 * Drives the 3-step creation wizard: choose-type → choose-source → choose-template → configure → done.
 */

export type CreationStep = 'choose-type' | 'choose-source' | 'choose-template' | 'configure' | 'done';

export interface CreationFlowState {
  step: CreationStep;
  artifactType?: 'report' | 'dashboard';
  dataSourceId?: string;
  dataSourceIds?: string[];  // multi-source selection
  templateId?: string;
  name: string;
}

export function initialCreationFlow(): CreationFlowState {
  return { step: 'choose-type', name: '' };
}

const STEP_ORDER: CreationStep[] = ['choose-type', 'choose-source', 'choose-template', 'configure', 'done'];

export function canProceed(state: CreationFlowState): boolean {
  switch (state.step) {
    case 'choose-type': return state.artifactType !== undefined;
    case 'choose-source': return (state.dataSourceIds?.length ?? 0) > 0 || state.dataSourceId !== undefined;
    case 'choose-template': return state.templateId !== undefined; // 'blank' is a valid templateId
    case 'configure': return state.name.trim().length > 0;
    case 'done': return false;
  }
}

export function nextStep(state: CreationFlowState): CreationFlowState {
  if (!canProceed(state)) return state;
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return state;

  // For reports, skip 'choose-template' step (reports don't use dashboard templates)
  let nextIdx = idx + 1;
  if (state.artifactType === 'report' && STEP_ORDER[nextIdx] === 'choose-template') {
    nextIdx++;
  }

  return { ...state, step: STEP_ORDER[nextIdx] };
}

export function prevStep(state: CreationFlowState): CreationFlowState {
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx <= 0) return state;

  // For reports, skip 'choose-template' step going backwards
  let prevIdx = idx - 1;
  if (state.artifactType === 'report' && STEP_ORDER[prevIdx] === 'choose-template') {
    prevIdx--;
  }

  return { ...state, step: STEP_ORDER[prevIdx] };
}

export function selectType(state: CreationFlowState, type: 'report' | 'dashboard'): CreationFlowState {
  return { ...state, artifactType: type };
}

export function selectDataSource(state: CreationFlowState, sourceId: string): CreationFlowState {
  return { ...state, dataSourceId: sourceId };
}

export function selectMultipleDataSources(state: CreationFlowState, sourceIds: string[]): CreationFlowState {
  return { ...state, dataSourceIds: sourceIds, dataSourceId: sourceIds[0] };
}

export function selectTemplate(state: CreationFlowState, templateIdOrBlank: string): CreationFlowState {
  return { ...state, templateId: templateIdOrBlank };
}

export function setName(state: CreationFlowState, name: string): CreationFlowState {
  return { ...state, name };
}

export interface CreationResult {
  artifactType: 'report' | 'dashboard';
  dataSourceId: string;
  dataSourceIds?: string[];
  templateId: string;
  name: string;
}

export function finishCreation(state: CreationFlowState): CreationResult | null {
  const primarySourceId = state.dataSourceIds?.[0] ?? state.dataSourceId;
  if (!state.artifactType || !primarySourceId || !state.name.trim()) return null;
  return {
    artifactType: state.artifactType,
    dataSourceId: primarySourceId,
    dataSourceIds: state.dataSourceIds,
    templateId: state.templateId ?? 'blank',
    name: state.name.trim(),
  };
}
