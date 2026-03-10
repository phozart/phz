import { describe, it, expect, beforeEach } from 'vitest';
import { initialDashboardEditorState, addWidget, selectWidget, toggleEditorMode, setEditorMode, setPreviewRole, _resetWidgetCounter, } from '../dashboard-editor-state.js';
describe('Dashboard Preview Mode', () => {
    let state;
    beforeEach(() => {
        _resetWidgetCounter();
        state = initialDashboardEditorState('Test Dashboard', 'ds-1');
    });
    describe('initialDashboardEditorState', () => {
        it('starts in edit mode', () => {
            expect(state.editorMode).toBe('edit');
        });
        it('starts with no previewRole', () => {
            expect(state.previewRole).toBeUndefined();
        });
    });
    describe('toggleEditorMode', () => {
        it('switches from edit to preview', () => {
            const result = toggleEditorMode(state);
            expect(result.editorMode).toBe('preview');
        });
        it('switches from preview back to edit', () => {
            let s = toggleEditorMode(state);
            s = toggleEditorMode(s);
            expect(s.editorMode).toBe('edit');
        });
        it('hides configPanel when entering preview', () => {
            let s = addWidget(state, 'bar-chart');
            s = selectWidget(s, s.widgets[0].id);
            expect(s.showConfigPanel).toBe(true);
            s = toggleEditorMode(s);
            expect(s.showConfigPanel).toBe(false);
        });
        it('clears selectedWidgetId when entering preview', () => {
            let s = addWidget(state, 'bar-chart');
            s = selectWidget(s, s.widgets[0].id);
            expect(s.selectedWidgetId).toBeDefined();
            s = toggleEditorMode(s);
            expect(s.selectedWidgetId).toBeUndefined();
        });
        it('hides field palette when entering preview', () => {
            expect(state.showFieldPalette).toBe(true);
            const result = toggleEditorMode(state);
            expect(result.showFieldPalette).toBe(false);
        });
        it('restores configPanel state on exit preview', () => {
            let s = addWidget(state, 'bar-chart');
            s = selectWidget(s, s.widgets[0].id);
            expect(s.showConfigPanel).toBe(true);
            expect(s.selectedWidgetId).toBeDefined();
            const widgetId = s.selectedWidgetId;
            // Enter preview
            s = toggleEditorMode(s);
            expect(s.showConfigPanel).toBe(false);
            // Exit preview
            s = toggleEditorMode(s);
            expect(s.showConfigPanel).toBe(true);
            expect(s.selectedWidgetId).toBe(widgetId);
        });
        it('restores field palette state on exit preview', () => {
            // Start with field palette visible (default)
            expect(state.showFieldPalette).toBe(true);
            let s = toggleEditorMode(state);
            expect(s.showFieldPalette).toBe(false);
            s = toggleEditorMode(s);
            expect(s.showFieldPalette).toBe(true);
        });
        it('sets default previewRole to viewer when entering preview', () => {
            const result = toggleEditorMode(state);
            expect(result.previewRole).toBe('viewer');
        });
        it('clears previewRole when exiting preview', () => {
            let s = toggleEditorMode(state);
            expect(s.previewRole).toBe('viewer');
            s = toggleEditorMode(s);
            expect(s.previewRole).toBeUndefined();
        });
        it('returns a new object reference (immutability)', () => {
            const result = toggleEditorMode(state);
            expect(result).not.toBe(state);
        });
    });
    describe('setEditorMode', () => {
        it('sets mode to preview', () => {
            const result = setEditorMode(state, 'preview');
            expect(result.editorMode).toBe('preview');
        });
        it('sets mode to edit', () => {
            let s = setEditorMode(state, 'preview');
            s = setEditorMode(s, 'edit');
            expect(s.editorMode).toBe('edit');
        });
        it('setting same mode is a no-op (returns same reference)', () => {
            const result = setEditorMode(state, 'edit');
            expect(result).toBe(state);
        });
        it('setting preview when already in preview is a no-op', () => {
            const s = setEditorMode(state, 'preview');
            const result = setEditorMode(s, 'preview');
            expect(result).toBe(s);
        });
        it('hides chrome when setting mode to preview', () => {
            let s = addWidget(state, 'kpi-card');
            s = selectWidget(s, s.widgets[0].id);
            s = setEditorMode(s, 'preview');
            expect(s.showConfigPanel).toBe(false);
            expect(s.showFieldPalette).toBe(false);
            expect(s.selectedWidgetId).toBeUndefined();
        });
        it('restores chrome when setting mode back to edit', () => {
            let s = addWidget(state, 'bar-chart');
            s = selectWidget(s, s.widgets[0].id);
            const widgetId = s.selectedWidgetId;
            s = setEditorMode(s, 'preview');
            s = setEditorMode(s, 'edit');
            expect(s.showConfigPanel).toBe(true);
            expect(s.showFieldPalette).toBe(true);
            expect(s.selectedWidgetId).toBe(widgetId);
        });
    });
    describe('setPreviewRole', () => {
        it('sets previewRole to admin', () => {
            let s = toggleEditorMode(state);
            s = setPreviewRole(s, 'admin');
            expect(s.previewRole).toBe('admin');
        });
        it('sets previewRole to author', () => {
            let s = toggleEditorMode(state);
            s = setPreviewRole(s, 'author');
            expect(s.previewRole).toBe('author');
        });
        it('sets previewRole to viewer', () => {
            let s = toggleEditorMode(state);
            s = setPreviewRole(s, 'viewer');
            expect(s.previewRole).toBe('viewer');
        });
        it('setting same role is a no-op (returns same reference)', () => {
            let s = toggleEditorMode(state);
            expect(s.previewRole).toBe('viewer');
            const result = setPreviewRole(s, 'viewer');
            expect(result).toBe(s);
        });
        it('is a no-op when not in preview mode', () => {
            // State is in edit mode, setting preview role should be a no-op
            const result = setPreviewRole(state, 'admin');
            expect(result).toBe(state);
            expect(result.previewRole).toBeUndefined();
        });
        it('returns a new object reference when role changes', () => {
            let s = toggleEditorMode(state);
            const result = setPreviewRole(s, 'admin');
            expect(result).not.toBe(s);
        });
    });
    describe('edge cases', () => {
        it('toggle twice returns to original edit state shape', () => {
            let s = addWidget(state, 'bar-chart');
            s = selectWidget(s, s.widgets[0].id);
            s = { ...s, showFieldPalette: false }; // manually hide palette
            const beforePreview = s;
            // Toggle in and out
            s = toggleEditorMode(s);
            s = toggleEditorMode(s);
            // Should restore the state from before preview
            expect(s.showConfigPanel).toBe(beforePreview.showConfigPanel);
            expect(s.showFieldPalette).toBe(beforePreview.showFieldPalette);
            expect(s.selectedWidgetId).toBe(beforePreview.selectedWidgetId);
            expect(s.editorMode).toBe('edit');
        });
        it('widgets are preserved across preview toggle', () => {
            let s = addWidget(state, 'bar-chart');
            s = addWidget(s, 'kpi-card');
            const widgetCount = s.widgets.length;
            s = toggleEditorMode(s);
            expect(s.widgets.length).toBe(widgetCount);
            s = toggleEditorMode(s);
            expect(s.widgets.length).toBe(widgetCount);
        });
        it('_previewSnapshot is cleared on exit', () => {
            let s = toggleEditorMode(state);
            expect(s._previewSnapshot).toBeDefined();
            s = toggleEditorMode(s);
            expect(s._previewSnapshot).toBeUndefined();
        });
    });
});
//# sourceMappingURL=dashboard-preview-mode.test.js.map