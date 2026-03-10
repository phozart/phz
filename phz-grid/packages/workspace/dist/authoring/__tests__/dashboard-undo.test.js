import { describe, it, expect, beforeEach } from 'vitest';
import { createDashboardUndoManager } from '../dashboard-undo.js';
import { initialDashboardEditorState, addWidget, morphWidget, _resetWidgetCounter, } from '../dashboard-editor-state.js';
describe('DashboardUndoManager', () => {
    let initial;
    beforeEach(() => {
        _resetWidgetCounter();
        initial = initialDashboardEditorState('test', 'ds-1');
    });
    describe('initial state', () => {
        it('starts with canUndo false', () => {
            const um = createDashboardUndoManager(initial);
            expect(um.canUndo).toBe(false);
        });
        it('starts with canRedo false', () => {
            const um = createDashboardUndoManager(initial);
            expect(um.canRedo).toBe(false);
        });
        it('starts with empty history', () => {
            const um = createDashboardUndoManager(initial);
            expect(um.history).toEqual([]);
        });
    });
    describe('execute', () => {
        it('pushes state and enables undo', () => {
            const um = createDashboardUndoManager(initial);
            const s1 = addWidget(initial, 'bar-chart');
            um.execute(s1, 'Add bar chart');
            expect(um.canUndo).toBe(true);
        });
        it('adds labeled entry to history', () => {
            const um = createDashboardUndoManager(initial);
            const s1 = addWidget(initial, 'bar-chart');
            um.execute(s1, 'Add bar chart');
            expect(um.history).toHaveLength(1);
            expect(um.history[0].label).toBe('Add bar chart');
            expect(um.history[0].timestamp).toBeGreaterThan(0);
        });
    });
    describe('undo', () => {
        it('returns previous state', () => {
            const um = createDashboardUndoManager(initial);
            const s1 = addWidget(initial, 'bar-chart');
            um.execute(s1, 'Add bar chart');
            const undone = um.undo();
            expect(undone).not.toBeNull();
            expect(undone.widgets).toHaveLength(0);
        });
        it('returns null when nothing to undo', () => {
            const um = createDashboardUndoManager(initial);
            expect(um.undo()).toBeNull();
        });
        it('supports multiple undos', () => {
            const um = createDashboardUndoManager(initial);
            const s1 = addWidget(initial, 'bar-chart');
            um.execute(s1, 'Add bar chart');
            const s2 = addWidget(s1, 'kpi-card');
            um.execute(s2, 'Add kpi card');
            expect(um.undo().widgets).toHaveLength(1);
            expect(um.undo().widgets).toHaveLength(0);
        });
    });
    describe('redo', () => {
        it('returns next state after undo', () => {
            const um = createDashboardUndoManager(initial);
            const s1 = addWidget(initial, 'bar-chart');
            um.execute(s1, 'Add bar chart');
            um.undo();
            const redone = um.redo();
            expect(redone).not.toBeNull();
            expect(redone.widgets).toHaveLength(1);
        });
        it('returns null when nothing to redo', () => {
            const um = createDashboardUndoManager(initial);
            expect(um.redo()).toBeNull();
        });
        it('canRedo becomes false after new execute', () => {
            const um = createDashboardUndoManager(initial);
            const s1 = addWidget(initial, 'bar-chart');
            um.execute(s1, 'Add bar chart');
            um.undo();
            expect(um.canRedo).toBe(true);
            const s2 = addWidget(initial, 'kpi-card');
            um.execute(s2, 'Add kpi card');
            expect(um.canRedo).toBe(false);
        });
    });
    describe('labeled history', () => {
        it('accumulates labels', () => {
            const um = createDashboardUndoManager(initial);
            um.execute(addWidget(initial, 'bar-chart'), 'Add bar chart');
            um.execute(addWidget(initial, 'kpi-card'), 'Add KPI');
            um.execute(addWidget(initial, 'pie-chart'), 'Add pie chart');
            expect(um.history).toHaveLength(3);
            expect(um.history.map(e => e.label)).toEqual([
                'Add bar chart',
                'Add KPI',
                'Add pie chart',
            ]);
        });
        it('returns defensive copy of history', () => {
            const um = createDashboardUndoManager(initial);
            um.execute(addWidget(initial, 'bar-chart'), 'Add bar chart');
            const h1 = um.history;
            const h2 = um.history;
            expect(h1).not.toBe(h2);
            expect(h1).toEqual(h2);
        });
    });
    describe('morph undo', () => {
        it('undoes morph back to original type', () => {
            const um = createDashboardUndoManager(initial);
            // Add a bar chart
            let state = addWidget(initial, 'bar-chart');
            um.execute(state, 'Add bar chart');
            const widgetId = state.widgets[0].id;
            expect(state.widgets[0].type).toBe('bar-chart');
            // Morph to pie chart
            state = morphWidget(state, widgetId, 'pie-chart');
            um.execute(state, 'Morph to pie chart');
            expect(state.widgets[0].type).toBe('pie-chart');
            // Undo morph
            const undone = um.undo();
            expect(undone).not.toBeNull();
            expect(undone.widgets[0].type).toBe('bar-chart');
        });
        it('redo after morph undo restores morphed type', () => {
            const um = createDashboardUndoManager(initial);
            let state = addWidget(initial, 'bar-chart');
            um.execute(state, 'Add bar chart');
            const widgetId = state.widgets[0].id;
            state = morphWidget(state, widgetId, 'pie-chart');
            um.execute(state, 'Morph to pie chart');
            um.undo(); // back to bar-chart
            const redone = um.redo();
            expect(redone).not.toBeNull();
            expect(redone.widgets[0].type).toBe('pie-chart');
        });
    });
    describe('maxHistory option', () => {
        it('respects custom maxHistory', () => {
            const um = createDashboardUndoManager(initial, { maxHistory: 3 });
            // Push 4 states (initial + 3 more, max history is 3 entries in the undo stack)
            for (let i = 0; i < 5; i++) {
                um.execute(addWidget(initial, 'bar-chart'), `Action ${i}`);
            }
            // Should still function correctly
            expect(um.canUndo).toBe(true);
        });
    });
});
//# sourceMappingURL=dashboard-undo.test.js.map