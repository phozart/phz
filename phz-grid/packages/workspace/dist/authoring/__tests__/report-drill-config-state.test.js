import { describe, it, expect } from 'vitest';
import { initialReportDrillConfigState, addDrillAction, removeDrillAction, updateDrillAction, startEditDrill, commitDrill, validateDrillConfig, } from '../report-drill-config-state.js';
function makeDrillAction(id) {
    return {
        id,
        label: `Drill ${id}`,
        targetArtifactId: 'report-1',
        targetArtifactType: 'report',
        sourceField: 'region',
        openMode: 'navigate',
        filterMappings: [{ sourceField: 'region', targetField: 'region' }],
    };
}
describe('ReportDrillConfigState', () => {
    describe('initialReportDrillConfigState', () => {
        it('starts with empty drill actions', () => {
            const s = initialReportDrillConfigState();
            expect(s.drillActions).toEqual([]);
        });
        it('starts with no editing state', () => {
            const s = initialReportDrillConfigState();
            expect(s.editingDrillId).toBeUndefined();
            expect(s.drillDraft).toBeUndefined();
        });
    });
    describe('addDrillAction', () => {
        it('adds a drill action', () => {
            const s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            expect(s.drillActions).toHaveLength(1);
            expect(s.drillActions[0].id).toBe('d-1');
        });
        it('prevents duplicate actions by id', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = addDrillAction(s, makeDrillAction('d-1'));
            expect(s.drillActions).toHaveLength(1);
        });
        it('returns same reference for duplicate', () => {
            const s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            const s2 = addDrillAction(s, makeDrillAction('d-1'));
            expect(s2).toBe(s);
        });
        it('does not mutate original state', () => {
            const original = initialReportDrillConfigState();
            addDrillAction(original, makeDrillAction('d-1'));
            expect(original.drillActions).toHaveLength(0);
        });
    });
    describe('removeDrillAction', () => {
        it('removes an action by id', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = addDrillAction(s, makeDrillAction('d-2'));
            s = removeDrillAction(s, 'd-1');
            expect(s.drillActions).toHaveLength(1);
            expect(s.drillActions[0].id).toBe('d-2');
        });
        it('clears editing state when removing the edited action', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = startEditDrill(s, 'd-1');
            s = removeDrillAction(s, 'd-1');
            expect(s.editingDrillId).toBeUndefined();
            expect(s.drillDraft).toBeUndefined();
        });
        it('preserves editing state when removing a different action', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = addDrillAction(s, makeDrillAction('d-2'));
            s = startEditDrill(s, 'd-1');
            s = removeDrillAction(s, 'd-2');
            expect(s.editingDrillId).toBe('d-1');
        });
    });
    describe('updateDrillAction', () => {
        it('updates partial properties', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = updateDrillAction(s, 'd-1', { label: 'Updated Label', openMode: 'modal' });
            expect(s.drillActions[0].label).toBe('Updated Label');
            expect(s.drillActions[0].openMode).toBe('modal');
        });
        it('preserves the id even if updates try to override it', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = updateDrillAction(s, 'd-1', { id: 'hacked' });
            expect(s.drillActions[0].id).toBe('d-1');
        });
    });
    describe('startEditDrill / commitDrill', () => {
        it('startEditDrill sets editing state', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = startEditDrill(s, 'd-1');
            expect(s.editingDrillId).toBe('d-1');
            expect(s.drillDraft?.label).toBe('Drill d-1');
        });
        it('startEditDrill returns state for nonexistent id', () => {
            const s = initialReportDrillConfigState();
            const s2 = startEditDrill(s, 'nonexistent');
            expect(s2.editingDrillId).toBeUndefined();
        });
        it('commitDrill applies draft and clears editing state', () => {
            let s = addDrillAction(initialReportDrillConfigState(), makeDrillAction('d-1'));
            s = startEditDrill(s, 'd-1');
            s = { ...s, drillDraft: { ...s.drillDraft, label: 'Committed Label' } };
            s = commitDrill(s);
            expect(s.drillActions[0].label).toBe('Committed Label');
            expect(s.editingDrillId).toBeUndefined();
            expect(s.drillDraft).toBeUndefined();
        });
        it('commitDrill is a no-op when no editing state', () => {
            const s = initialReportDrillConfigState();
            const s2 = commitDrill(s);
            expect(s2).toBe(s);
        });
    });
    describe('validateDrillConfig', () => {
        it('returns valid for a complete action', () => {
            const result = validateDrillConfig(makeDrillAction('d-1'));
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('returns errors for missing label', () => {
            const result = validateDrillConfig({ ...makeDrillAction('d-1'), label: '' });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Label is required');
        });
        it('returns errors for missing targetArtifactId', () => {
            const result = validateDrillConfig({ ...makeDrillAction('d-1'), targetArtifactId: '' });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Target artifact is required');
        });
        it('returns errors for missing sourceField', () => {
            const result = validateDrillConfig({ sourceField: '' });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Source field is required');
        });
        it('returns multiple errors for empty partial', () => {
            const result = validateDrillConfig({});
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
        });
    });
});
//# sourceMappingURL=report-drill-config-state.test.js.map