/**
 * @phozart/phz-workspace — Creation Wizard Simplification State (B-3.02)
 *
 * Simplified 3-step wizard: Choose Type -> Configure -> Review.
 * Supports template selection from the templates subsystem and quick-create
 * shortcuts for common artifact types.
 */

import type { ArtifactType } from '../types.js';

// ========================================================================
// Types
// ========================================================================

export type WizardStep = 'choose-type' | 'configure' | 'review';

export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
}

export interface CreationWizardState {
  step: WizardStep;
  artifactType?: ArtifactType;
  templateId?: string;
  name: string;
  description: string;
  dataSourceId?: string;
  config: Record<string, unknown>;
  quickCreate: boolean;
}

export interface CreationWizardResult {
  artifactType: ArtifactType;
  templateId: string;
  name: string;
  description: string;
  dataSourceId: string;
  config: Record<string, unknown>;
}

// ========================================================================
// Quick-create presets
// ========================================================================

export interface QuickCreatePreset {
  id: string;
  label: string;
  artifactType: ArtifactType;
  templateId: string;
  defaultConfig: Record<string, unknown>;
}

export const QUICK_CREATE_PRESETS: QuickCreatePreset[] = [
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

const STEP_ORDER: WizardStep[] = ['choose-type', 'configure', 'review'];

// ========================================================================
// Factory
// ========================================================================

export function initialCreationWizardState(): CreationWizardState {
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

export function canProceedWizard(state: CreationWizardState): boolean {
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

export function nextWizardStep(state: CreationWizardState): CreationWizardState {
  if (!canProceedWizard(state)) return state;
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return state;
  return { ...state, step: STEP_ORDER[idx + 1] };
}

export function prevWizardStep(state: CreationWizardState): CreationWizardState {
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx <= 0) return state;
  return { ...state, step: STEP_ORDER[idx - 1] };
}

// ========================================================================
// Field setters
// ========================================================================

export function selectWizardType(
  state: CreationWizardState,
  artifactType: ArtifactType,
): CreationWizardState {
  return { ...state, artifactType };
}

export function selectWizardTemplate(
  state: CreationWizardState,
  templateId: string,
): CreationWizardState {
  return { ...state, templateId };
}

export function setWizardName(
  state: CreationWizardState,
  name: string,
): CreationWizardState {
  return { ...state, name };
}

export function setWizardDescription(
  state: CreationWizardState,
  description: string,
): CreationWizardState {
  return { ...state, description };
}

export function setWizardDataSource(
  state: CreationWizardState,
  dataSourceId: string,
): CreationWizardState {
  return { ...state, dataSourceId };
}

export function setWizardConfig(
  state: CreationWizardState,
  config: Record<string, unknown>,
): CreationWizardState {
  return { ...state, config: { ...state.config, ...config } };
}

// ========================================================================
// Quick-create
// ========================================================================

export function applyQuickCreate(
  state: CreationWizardState,
  preset: QuickCreatePreset,
  dataSourceId: string,
  name: string,
): CreationWizardState {
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

export function filterTemplatesForType(
  templates: TemplateOption[],
  artifactType: ArtifactType,
): TemplateOption[] {
  // Dashboard templates are category 'dashboard', report templates are 'report'
  return templates.filter(
    t => t.category === artifactType || t.category === 'general',
  );
}

// ========================================================================
// Finalize
// ========================================================================

export function finalizeWizard(
  state: CreationWizardState,
): CreationWizardResult | null {
  if (
    !state.artifactType ||
    !state.dataSourceId ||
    !state.name.trim()
  ) {
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
