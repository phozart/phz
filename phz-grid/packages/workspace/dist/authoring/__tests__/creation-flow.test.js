import { describe, it, expect } from 'vitest';
import { initialCreationFlow, canProceed, nextStep, prevStep, selectType, selectDataSource, selectTemplate, setName, finishCreation, } from '../creation-flow.js';
// ---------------------------------------------------------------------------
// initialCreationFlow
// ---------------------------------------------------------------------------
describe('initialCreationFlow', () => {
    it('starts at choose-type step', () => {
        const state = initialCreationFlow();
        expect(state.step).toBe('choose-type');
    });
    it('starts with empty name', () => {
        const state = initialCreationFlow();
        expect(state.name).toBe('');
    });
    it('starts with no artifactType', () => {
        const state = initialCreationFlow();
        expect(state.artifactType).toBeUndefined();
    });
    it('starts with no dataSourceId', () => {
        const state = initialCreationFlow();
        expect(state.dataSourceId).toBeUndefined();
    });
    it('starts with no templateId', () => {
        const state = initialCreationFlow();
        expect(state.templateId).toBeUndefined();
    });
});
// ---------------------------------------------------------------------------
// canProceed
// ---------------------------------------------------------------------------
describe('canProceed', () => {
    it('returns false at choose-type when artifactType is not set', () => {
        const state = initialCreationFlow();
        expect(canProceed(state)).toBe(false);
    });
    it('returns true at choose-type when artifactType is set', () => {
        const state = selectType(initialCreationFlow(), 'dashboard');
        expect(canProceed(state)).toBe(true);
    });
    it('returns false at choose-source when dataSourceId is not set', () => {
        const state = { step: 'choose-source', name: '', artifactType: 'dashboard' };
        expect(canProceed(state)).toBe(false);
    });
    it('returns true at choose-source when dataSourceId is set', () => {
        const state = { step: 'choose-source', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        expect(canProceed(state)).toBe(true);
    });
    it('returns false at choose-template when templateId is not set', () => {
        const state = { step: 'choose-template', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        expect(canProceed(state)).toBe(false);
    });
    it('returns true at choose-template when templateId is "blank"', () => {
        const state = { step: 'choose-template', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1', templateId: 'blank' };
        expect(canProceed(state)).toBe(true);
    });
    it('returns true at choose-template when templateId is a real id', () => {
        const state = { step: 'choose-template', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1', templateId: 'tmpl-executive' };
        expect(canProceed(state)).toBe(true);
    });
    it('returns false at configure when name is empty', () => {
        const state = { step: 'configure', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        expect(canProceed(state)).toBe(false);
    });
    it('returns false at configure when name is whitespace only', () => {
        const state = { step: 'configure', name: '   ', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        expect(canProceed(state)).toBe(false);
    });
    it('returns true at configure when name is set', () => {
        const state = { step: 'configure', name: 'My Dashboard', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        expect(canProceed(state)).toBe(true);
    });
    it('returns false at done', () => {
        const state = { step: 'done', name: 'Test', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        expect(canProceed(state)).toBe(false);
    });
});
// ---------------------------------------------------------------------------
// nextStep
// ---------------------------------------------------------------------------
describe('nextStep', () => {
    it('advances from choose-type to choose-source when artifactType is set', () => {
        const state = selectType(initialCreationFlow(), 'dashboard');
        const next = nextStep(state);
        expect(next.step).toBe('choose-source');
    });
    it('stays at choose-type when artifactType is not set', () => {
        const state = initialCreationFlow();
        const next = nextStep(state);
        expect(next.step).toBe('choose-type');
    });
    it('advances from choose-source to choose-template for dashboard', () => {
        const state = { step: 'choose-source', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        const next = nextStep(state);
        expect(next.step).toBe('choose-template');
    });
    it('skips choose-template for report — goes directly to configure', () => {
        const state = { step: 'choose-source', name: '', artifactType: 'report', dataSourceId: 'ds-1' };
        const next = nextStep(state);
        expect(next.step).toBe('configure');
    });
    it('advances from choose-template to configure for dashboard', () => {
        const state = { step: 'choose-template', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1', templateId: 'tmpl-1' };
        const next = nextStep(state);
        expect(next.step).toBe('configure');
    });
    it('advances from configure to done', () => {
        const state = { step: 'configure', name: 'Test', artifactType: 'dashboard', dataSourceId: 'ds-1', templateId: 'tmpl-1' };
        const next = nextStep(state);
        expect(next.step).toBe('done');
    });
    it('stays at done (cannot advance past final step)', () => {
        const state = { step: 'done', name: 'Test', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        const next = nextStep(state);
        expect(next.step).toBe('done');
        expect(next).toBe(state); // same reference — no change
    });
    it('preserves all state properties when advancing', () => {
        const state = { step: 'choose-source', name: 'Draft', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        const next = nextStep(state);
        expect(next.artifactType).toBe('dashboard');
        expect(next.dataSourceId).toBe('ds-1');
        expect(next.name).toBe('Draft');
    });
});
// ---------------------------------------------------------------------------
// prevStep
// ---------------------------------------------------------------------------
describe('prevStep', () => {
    it('stays at choose-type (cannot go before first step)', () => {
        const state = initialCreationFlow();
        const prev = prevStep(state);
        expect(prev.step).toBe('choose-type');
        expect(prev).toBe(state); // same reference — no change
    });
    it('goes back from choose-source to choose-type', () => {
        const state = { step: 'choose-source', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        const prev = prevStep(state);
        expect(prev.step).toBe('choose-type');
    });
    it('goes back from choose-template to choose-source for dashboard', () => {
        const state = { step: 'choose-template', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        const prev = prevStep(state);
        expect(prev.step).toBe('choose-source');
    });
    it('skips choose-template going backwards for report — goes from configure to choose-source', () => {
        const state = { step: 'configure', name: '', artifactType: 'report', dataSourceId: 'ds-1' };
        const prev = prevStep(state);
        expect(prev.step).toBe('choose-source');
    });
    it('goes back from configure to choose-template for dashboard', () => {
        const state = { step: 'configure', name: '', artifactType: 'dashboard', dataSourceId: 'ds-1', templateId: 'tmpl-1' };
        const prev = prevStep(state);
        expect(prev.step).toBe('choose-template');
    });
    it('goes back from done to configure', () => {
        const state = { step: 'done', name: 'Test', artifactType: 'dashboard', dataSourceId: 'ds-1' };
        const prev = prevStep(state);
        expect(prev.step).toBe('configure');
    });
    it('preserves state properties when going back', () => {
        const state = { step: 'configure', name: 'My Report', artifactType: 'dashboard', dataSourceId: 'ds-1', templateId: 'tmpl-1' };
        const prev = prevStep(state);
        expect(prev.artifactType).toBe('dashboard');
        expect(prev.dataSourceId).toBe('ds-1');
        expect(prev.templateId).toBe('tmpl-1');
        expect(prev.name).toBe('My Report');
    });
});
// ---------------------------------------------------------------------------
// selectType, selectDataSource, selectTemplate, setName
// ---------------------------------------------------------------------------
describe('state mutation helpers', () => {
    it('selectType sets artifactType', () => {
        const state = selectType(initialCreationFlow(), 'report');
        expect(state.artifactType).toBe('report');
    });
    it('selectType returns a new object', () => {
        const original = initialCreationFlow();
        const updated = selectType(original, 'report');
        expect(updated).not.toBe(original);
        expect(original.artifactType).toBeUndefined();
    });
    it('selectDataSource sets dataSourceId', () => {
        const state = selectDataSource(initialCreationFlow(), 'ds-prod');
        expect(state.dataSourceId).toBe('ds-prod');
    });
    it('selectDataSource returns a new object', () => {
        const original = initialCreationFlow();
        const updated = selectDataSource(original, 'ds-1');
        expect(updated).not.toBe(original);
        expect(original.dataSourceId).toBeUndefined();
    });
    it('selectTemplate sets templateId', () => {
        const state = selectTemplate(initialCreationFlow(), 'tmpl-exec');
        expect(state.templateId).toBe('tmpl-exec');
    });
    it('selectTemplate accepts "blank" as valid templateId', () => {
        const state = selectTemplate(initialCreationFlow(), 'blank');
        expect(state.templateId).toBe('blank');
    });
    it('selectTemplate returns a new object', () => {
        const original = initialCreationFlow();
        const updated = selectTemplate(original, 'tmpl-1');
        expect(updated).not.toBe(original);
        expect(original.templateId).toBeUndefined();
    });
    it('setName sets name', () => {
        const state = setName(initialCreationFlow(), 'Q4 Dashboard');
        expect(state.name).toBe('Q4 Dashboard');
    });
    it('setName returns a new object', () => {
        const original = initialCreationFlow();
        const updated = setName(original, 'Test');
        expect(updated).not.toBe(original);
        expect(original.name).toBe('');
    });
});
// ---------------------------------------------------------------------------
// finishCreation
// ---------------------------------------------------------------------------
describe('finishCreation', () => {
    it('returns CreationResult when all required fields are set', () => {
        const state = {
            step: 'done',
            name: 'My Dashboard',
            artifactType: 'dashboard',
            dataSourceId: 'ds-1',
            templateId: 'tmpl-exec',
        };
        const result = finishCreation(state);
        expect(result).not.toBeNull();
        expect(result.artifactType).toBe('dashboard');
        expect(result.dataSourceId).toBe('ds-1');
        expect(result.templateId).toBe('tmpl-exec');
        expect(result.name).toBe('My Dashboard');
    });
    it('returns null when artifactType is missing', () => {
        const state = { step: 'done', name: 'Test', dataSourceId: 'ds-1' };
        expect(finishCreation(state)).toBeNull();
    });
    it('returns null when dataSourceId is missing', () => {
        const state = { step: 'done', name: 'Test', artifactType: 'report' };
        expect(finishCreation(state)).toBeNull();
    });
    it('returns null when name is empty', () => {
        const state = { step: 'done', name: '', artifactType: 'report', dataSourceId: 'ds-1' };
        expect(finishCreation(state)).toBeNull();
    });
    it('returns null when name is whitespace only', () => {
        const state = { step: 'done', name: '   ', artifactType: 'report', dataSourceId: 'ds-1' };
        expect(finishCreation(state)).toBeNull();
    });
    it('trims the name in the result', () => {
        const state = {
            step: 'done',
            name: '  Padded Name  ',
            artifactType: 'dashboard',
            dataSourceId: 'ds-1',
        };
        const result = finishCreation(state);
        expect(result.name).toBe('Padded Name');
    });
    it('defaults templateId to "blank" when not set', () => {
        const state = {
            step: 'done',
            name: 'My Report',
            artifactType: 'report',
            dataSourceId: 'ds-1',
        };
        const result = finishCreation(state);
        expect(result.templateId).toBe('blank');
    });
    it('uses provided templateId when set', () => {
        const state = {
            step: 'done',
            name: 'My Dashboard',
            artifactType: 'dashboard',
            dataSourceId: 'ds-1',
            templateId: 'tmpl-sales',
        };
        const result = finishCreation(state);
        expect(result.templateId).toBe('tmpl-sales');
    });
});
// ---------------------------------------------------------------------------
// Full flow — dashboard (all steps)
// ---------------------------------------------------------------------------
describe('full flow — dashboard', () => {
    it('choose-type -> choose-source -> choose-template -> configure -> done', () => {
        let state = initialCreationFlow();
        expect(state.step).toBe('choose-type');
        // Step 1: select type
        state = selectType(state, 'dashboard');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        expect(state.step).toBe('choose-source');
        // Step 2: select data source
        state = selectDataSource(state, 'ds-prod');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        expect(state.step).toBe('choose-template');
        // Step 3: select template
        state = selectTemplate(state, 'tmpl-executive');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        expect(state.step).toBe('configure');
        // Step 4: set name
        state = setName(state, 'Q4 Executive Dashboard');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        expect(state.step).toBe('done');
        // Finish
        const result = finishCreation(state);
        expect(result).toEqual({
            artifactType: 'dashboard',
            dataSourceId: 'ds-prod',
            templateId: 'tmpl-executive',
            name: 'Q4 Executive Dashboard',
        });
    });
});
// ---------------------------------------------------------------------------
// Full flow — report (skips template step)
// ---------------------------------------------------------------------------
describe('full flow — report (skips template)', () => {
    it('choose-type -> choose-source -> configure -> done (skips choose-template)', () => {
        let state = initialCreationFlow();
        expect(state.step).toBe('choose-type');
        // Step 1: select report
        state = selectType(state, 'report');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        expect(state.step).toBe('choose-source');
        // Step 2: select data source
        state = selectDataSource(state, 'ds-analytics');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        // Should skip choose-template and go directly to configure
        expect(state.step).toBe('configure');
        // Step 3: set name
        state = setName(state, 'Monthly Sales Report');
        expect(canProceed(state)).toBe(true);
        state = nextStep(state);
        expect(state.step).toBe('done');
        // Finish
        const result = finishCreation(state);
        expect(result).toEqual({
            artifactType: 'report',
            dataSourceId: 'ds-analytics',
            templateId: 'blank',
            name: 'Monthly Sales Report',
        });
    });
    it('navigates backward correctly — skips choose-template for report', () => {
        // Start at configure step for a report
        const state = {
            step: 'configure',
            name: 'Test',
            artifactType: 'report',
            dataSourceId: 'ds-1',
        };
        const back1 = prevStep(state);
        expect(back1.step).toBe('choose-source'); // skips choose-template
        const back2 = prevStep(back1);
        expect(back2.step).toBe('choose-type');
    });
});
// ---------------------------------------------------------------------------
// State immutability
// ---------------------------------------------------------------------------
describe('state immutability', () => {
    it('selectType does not mutate the original state', () => {
        const original = initialCreationFlow();
        selectType(original, 'dashboard');
        expect(original.artifactType).toBeUndefined();
    });
    it('selectDataSource does not mutate the original state', () => {
        const original = initialCreationFlow();
        selectDataSource(original, 'ds-1');
        expect(original.dataSourceId).toBeUndefined();
    });
    it('selectTemplate does not mutate the original state', () => {
        const original = initialCreationFlow();
        selectTemplate(original, 'tmpl-1');
        expect(original.templateId).toBeUndefined();
    });
    it('setName does not mutate the original state', () => {
        const original = initialCreationFlow();
        setName(original, 'Changed');
        expect(original.name).toBe('');
    });
    it('nextStep does not mutate the original state', () => {
        const original = selectType(initialCreationFlow(), 'dashboard');
        const originalStep = original.step;
        nextStep(original);
        expect(original.step).toBe(originalStep);
    });
    it('prevStep does not mutate the original state', () => {
        const original = { step: 'choose-source', name: '', artifactType: 'dashboard' };
        prevStep(original);
        expect(original.step).toBe('choose-source');
    });
});
//# sourceMappingURL=creation-flow.test.js.map