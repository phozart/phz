/**
 * @phozart/phz-workspace — Chart Overlay State Machine Tests
 *
 * TDD: Red → Green → Refactor
 * Tests for CRUD operations and edit flow on chart overlays.
 */
import { describe, it, expect } from 'vitest';
import { initialChartOverlayState, addOverlay, removeOverlay, updateOverlay, startEditOverlay, commitOverlay, cancelEditOverlay, reorderOverlays, } from '../chart-overlay-state.js';
// ========================================================================
// initialChartOverlayState
// ========================================================================
describe('initialChartOverlayState', () => {
    it('creates empty state', () => {
        const state = initialChartOverlayState();
        expect(state.overlays).toEqual([]);
        expect(state.editingOverlayId).toBeUndefined();
        expect(state.editingDraft).toBeUndefined();
    });
    it('accepts pre-existing overlays', () => {
        const existing = [
            { id: 'o1', type: 'reference-line' },
        ];
        const state = initialChartOverlayState(existing);
        expect(state.overlays).toHaveLength(1);
    });
});
// ========================================================================
// addOverlay / removeOverlay
// ========================================================================
describe('addOverlay', () => {
    it('adds an overlay to the list', () => {
        const state = initialChartOverlayState();
        const overlay = { id: 'r1', type: 'reference-line', axis: 'y', value: 50 };
        const next = addOverlay(state, overlay);
        expect(next.overlays).toHaveLength(1);
        expect(next.overlays[0].id).toBe('r1');
    });
    it('does not mutate original state', () => {
        const state = initialChartOverlayState();
        const overlay = { id: 'r1', type: 'average-line' };
        addOverlay(state, overlay);
        expect(state.overlays).toHaveLength(0);
    });
});
describe('removeOverlay', () => {
    it('removes an overlay by ID', () => {
        const state = initialChartOverlayState([
            { id: 'o1', type: 'reference-line' },
            { id: 'o2', type: 'trend-line' },
        ]);
        const next = removeOverlay(state, 'o1');
        expect(next.overlays).toHaveLength(1);
        expect(next.overlays[0].id).toBe('o2');
    });
    it('clears editing state if removed overlay was being edited', () => {
        let state = initialChartOverlayState([{ id: 'o1', type: 'reference-line' }]);
        state = startEditOverlay(state, 'o1');
        expect(state.editingOverlayId).toBe('o1');
        const next = removeOverlay(state, 'o1');
        expect(next.editingOverlayId).toBeUndefined();
        expect(next.editingDraft).toBeUndefined();
    });
    it('returns same state if ID not found', () => {
        const state = initialChartOverlayState([{ id: 'o1', type: 'reference-line' }]);
        const next = removeOverlay(state, 'nonexistent');
        expect(next.overlays).toHaveLength(1);
    });
});
// ========================================================================
// updateOverlay
// ========================================================================
describe('updateOverlay', () => {
    it('merges partial updates into an existing overlay', () => {
        const state = initialChartOverlayState([
            { id: 'o1', type: 'reference-line', label: 'Old' },
        ]);
        const next = updateOverlay(state, 'o1', { label: 'New' });
        expect(next.overlays[0].label).toBe('New');
        expect(next.overlays[0].type).toBe('reference-line');
    });
    it('returns same state if overlay ID not found', () => {
        const state = initialChartOverlayState([{ id: 'o1', type: 'reference-line' }]);
        const next = updateOverlay(state, 'missing', { label: 'test' });
        expect(next).toBe(state);
    });
});
// ========================================================================
// Edit flow: startEditOverlay → commitOverlay / cancelEditOverlay
// ========================================================================
describe('startEditOverlay', () => {
    it('sets the editing overlay ID and creates a draft copy', () => {
        const overlay = { id: 'o1', type: 'reference-line', label: 'Target' };
        const state = initialChartOverlayState([overlay]);
        const next = startEditOverlay(state, 'o1');
        expect(next.editingOverlayId).toBe('o1');
        expect(next.editingDraft).toEqual(overlay);
    });
    it('returns same state if overlay not found', () => {
        const state = initialChartOverlayState();
        const next = startEditOverlay(state, 'nonexistent');
        expect(next.editingOverlayId).toBeUndefined();
    });
});
describe('commitOverlay', () => {
    it('applies the draft changes to the overlay list', () => {
        let state = initialChartOverlayState([
            { id: 'o1', type: 'reference-line', label: 'Old' },
        ]);
        state = startEditOverlay(state, 'o1');
        state = { ...state, editingDraft: { ...state.editingDraft, label: 'Updated' } };
        const next = commitOverlay(state);
        expect(next.overlays[0].label).toBe('Updated');
        expect(next.editingOverlayId).toBeUndefined();
        expect(next.editingDraft).toBeUndefined();
    });
    it('is a no-op when not editing', () => {
        const state = initialChartOverlayState([{ id: 'o1', type: 'reference-line' }]);
        const next = commitOverlay(state);
        expect(next).toBe(state);
    });
});
describe('cancelEditOverlay', () => {
    it('clears editing state without changing overlays', () => {
        let state = initialChartOverlayState([
            { id: 'o1', type: 'reference-line', label: 'Original' },
        ]);
        state = startEditOverlay(state, 'o1');
        state = { ...state, editingDraft: { ...state.editingDraft, label: 'Draft Change' } };
        const next = cancelEditOverlay(state);
        expect(next.editingOverlayId).toBeUndefined();
        expect(next.editingDraft).toBeUndefined();
        expect(next.overlays[0].label).toBe('Original');
    });
});
// ========================================================================
// reorderOverlays
// ========================================================================
describe('reorderOverlays', () => {
    it('reorders overlays by new ID order', () => {
        const state = initialChartOverlayState([
            { id: 'a', type: 'reference-line' },
            { id: 'b', type: 'trend-line' },
            { id: 'c', type: 'threshold-band' },
        ]);
        const next = reorderOverlays(state, ['c', 'a', 'b']);
        expect(next.overlays.map(o => o.id)).toEqual(['c', 'a', 'b']);
    });
    it('ignores IDs not in the current overlay list', () => {
        const state = initialChartOverlayState([
            { id: 'a', type: 'reference-line' },
            { id: 'b', type: 'trend-line' },
        ]);
        const next = reorderOverlays(state, ['b', 'nonexistent', 'a']);
        expect(next.overlays.map(o => o.id)).toEqual(['b', 'a']);
    });
});
//# sourceMappingURL=chart-overlay-state.test.js.map