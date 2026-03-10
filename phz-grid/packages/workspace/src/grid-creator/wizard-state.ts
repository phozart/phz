/**
 * @phozart/phz-grid-creator — Wizard State Management
 *
 * Pure functions for wizard navigation, validation, and draft state.
 */

export interface WizardDraft {
  name: string;
  description: string;
  dataProductId: string;
  columns: Array<{ field: string; header?: string; [key: string]: unknown }>;
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
  columns: Array<{ field: string; header?: string; [key: string]: unknown }>;
  config: Record<string, unknown>;
}

const STEPS: StepConfig[] = [
  { index: 0, name: 'Report Identity', required: true },
  { index: 1, name: 'Data Source', required: true },
  { index: 2, name: 'Column Selection', required: true },
  { index: 3, name: 'Configuration', required: false },
  { index: 4, name: 'Review & Create', required: true },
];

export function createWizardState(): WizardState {
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

export function nextStep(state: WizardState): WizardState {
  return {
    ...state,
    currentStep: Math.min(state.currentStep + 1, STEPS.length - 1),
  };
}

export function prevStep(state: WizardState): WizardState {
  return {
    ...state,
    currentStep: Math.max(state.currentStep - 1, 0),
  };
}

export function getStepConfig(index: number): StepConfig {
  return STEPS[index] ?? STEPS[0];
}

export function canProceed(state: WizardState): boolean {
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

export function buildReviewSummary(state: WizardState): ReviewSummary {
  return {
    name: state.draft.name,
    description: state.draft.description,
    dataProductId: state.draft.dataProductId,
    columnCount: state.draft.columns.length,
  };
}

export function buildCreatePayload(state: WizardState): CreatePayload {
  return {
    name: state.draft.name,
    description: state.draft.description,
    dataProductId: state.draft.dataProductId,
    columns: state.draft.columns,
    config: state.draft.config,
  };
}
