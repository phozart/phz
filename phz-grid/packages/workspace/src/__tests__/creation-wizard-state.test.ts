import { describe, it, expect } from 'vitest';
import {
  initialCreationWizardState,
  canProceedWizard,
  nextWizardStep,
  prevWizardStep,
  selectWizardType,
  selectWizardTemplate,
  setWizardName,
  setWizardDescription,
  setWizardDataSource,
  setWizardConfig,
  applyQuickCreate,
  filterTemplatesForType,
  finalizeWizard,
  QUICK_CREATE_PRESETS,
  type TemplateOption,
} from '../authoring/creation-wizard-state.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialCreationWizardState', () => {
  it('starts at choose-type step', () => {
    const state = initialCreationWizardState();
    expect(state.step).toBe('choose-type');
    expect(state.name).toBe('');
    expect(state.quickCreate).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canProceedWizard
// ---------------------------------------------------------------------------

describe('canProceedWizard', () => {
  it('cannot proceed from choose-type without type', () => {
    const state = initialCreationWizardState();
    expect(canProceedWizard(state)).toBe(false);
  });

  it('can proceed from choose-type with type selected', () => {
    const state = selectWizardType(initialCreationWizardState(), 'report');
    expect(canProceedWizard(state)).toBe(true);
  });

  it('cannot proceed from configure without name', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = nextWizardStep(state);
    expect(state.step).toBe('configure');
    expect(canProceedWizard(state)).toBe(false);
  });

  it('can proceed from configure with name and data source', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = nextWizardStep(state);
    state = setWizardName(state, 'Test Report');
    state = setWizardDataSource(state, 'ds-1');
    expect(canProceedWizard(state)).toBe(true);
  });

  it('cannot proceed from review', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = nextWizardStep(state);
    state = setWizardName(state, 'Test');
    state = setWizardDataSource(state, 'ds-1');
    state = nextWizardStep(state);
    expect(state.step).toBe('review');
    expect(canProceedWizard(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('step navigation', () => {
  it('moves through steps correctly', () => {
    let state = selectWizardType(initialCreationWizardState(), 'dashboard');
    state = nextWizardStep(state);
    expect(state.step).toBe('configure');

    state = setWizardName(state, 'My Dashboard');
    state = setWizardDataSource(state, 'ds-1');
    state = nextWizardStep(state);
    expect(state.step).toBe('review');
  });

  it('prevStep goes back', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = nextWizardStep(state);
    expect(state.step).toBe('configure');
    state = prevWizardStep(state);
    expect(state.step).toBe('choose-type');
  });

  it('prevStep does nothing at first step', () => {
    const state = initialCreationWizardState();
    expect(prevWizardStep(state).step).toBe('choose-type');
  });

  it('nextStep does nothing without valid state', () => {
    const state = initialCreationWizardState();
    expect(nextWizardStep(state).step).toBe('choose-type');
  });
});

// ---------------------------------------------------------------------------
// Field setters
// ---------------------------------------------------------------------------

describe('field setters', () => {
  it('selectWizardType sets artifact type', () => {
    const state = selectWizardType(initialCreationWizardState(), 'dashboard');
    expect(state.artifactType).toBe('dashboard');
  });

  it('selectWizardTemplate sets template', () => {
    const state = selectWizardTemplate(initialCreationWizardState(), 'tmpl-1');
    expect(state.templateId).toBe('tmpl-1');
  });

  it('setWizardDescription sets description', () => {
    const state = setWizardDescription(initialCreationWizardState(), 'A test description');
    expect(state.description).toBe('A test description');
  });

  it('setWizardConfig merges config', () => {
    let state = setWizardConfig(initialCreationWizardState(), { a: 1 });
    state = setWizardConfig(state, { b: 2 });
    expect(state.config).toEqual({ a: 1, b: 2 });
  });
});

// ---------------------------------------------------------------------------
// Quick create
// ---------------------------------------------------------------------------

describe('applyQuickCreate', () => {
  it('skips to review step', () => {
    const preset = QUICK_CREATE_PRESETS[0]; // blank-report
    const state = applyQuickCreate(initialCreationWizardState(), preset, 'ds-1', 'Quick Report');
    expect(state.step).toBe('review');
    expect(state.artifactType).toBe('report');
    expect(state.dataSourceId).toBe('ds-1');
    expect(state.name).toBe('Quick Report');
    expect(state.quickCreate).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Template filtering
// ---------------------------------------------------------------------------

describe('filterTemplatesForType', () => {
  const templates: TemplateOption[] = [
    { id: '1', name: 'KPI Grid', description: 'KPI', category: 'dashboard' },
    { id: '2', name: 'Table Report', description: 'Report', category: 'report' },
    { id: '3', name: 'Blank', description: 'Blank', category: 'general' },
  ];

  it('filters templates for dashboard', () => {
    const result = filterTemplatesForType(templates, 'dashboard');
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toContain('1');
    expect(result.map(t => t.id)).toContain('3');
  });

  it('filters templates for report', () => {
    const result = filterTemplatesForType(templates, 'report');
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toContain('2');
    expect(result.map(t => t.id)).toContain('3');
  });
});

// ---------------------------------------------------------------------------
// Finalize
// ---------------------------------------------------------------------------

describe('finalizeWizard', () => {
  it('returns result with all required fields', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = setWizardName(state, 'Final Report');
    state = setWizardDescription(state, 'A description');
    state = setWizardDataSource(state, 'ds-1');
    state = selectWizardTemplate(state, 'tmpl-1');

    const result = finalizeWizard(state);
    expect(result).not.toBeNull();
    expect(result!.artifactType).toBe('report');
    expect(result!.name).toBe('Final Report');
    expect(result!.templateId).toBe('tmpl-1');
  });

  it('returns null without required fields', () => {
    expect(finalizeWizard(initialCreationWizardState())).toBeNull();
  });

  it('defaults templateId to blank', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = setWizardName(state, 'Test');
    state = setWizardDataSource(state, 'ds-1');
    const result = finalizeWizard(state);
    expect(result!.templateId).toBe('blank');
  });

  it('trims name and description', () => {
    let state = selectWizardType(initialCreationWizardState(), 'report');
    state = setWizardName(state, '  Test  ');
    state = setWizardDescription(state, '  Desc  ');
    state = setWizardDataSource(state, 'ds-1');
    const result = finalizeWizard(state);
    expect(result!.name).toBe('Test');
    expect(result!.description).toBe('Desc');
  });
});
