/**
 * @phozart/workspace — Variant Picker State Tests (7A-C)
 */
import { describe, it, expect } from 'vitest';
import { initialVariantPickerState, selectVariant, setChainDirection, toggleEdgeLabels, toggleCollapseInvalidated, setConclusionText, getVariantConfig, } from '../variant-picker-state.js';
// ========================================================================
// initialVariantPickerState
// ========================================================================
describe('initialVariantPickerState', () => {
    it('defaults to tree variant', () => {
        const state = initialVariantPickerState();
        expect(state.currentVariant).toBe('tree');
    });
    it('defaults chain layout to horizontal with edge labels', () => {
        const state = initialVariantPickerState();
        expect(state.chainLayout.direction).toBe('horizontal');
        expect(state.chainLayout.showEdgeLabels).toBe(true);
        expect(state.chainLayout.collapseInvalidated).toBe(false);
    });
    it('provides two available variants', () => {
        const state = initialVariantPickerState();
        expect(state.availableVariants).toHaveLength(2);
        expect(state.availableVariants[0].id).toBe('tree');
        expect(state.availableVariants[1].id).toBe('impact-chain');
    });
    it('restores from existing config', () => {
        const state = initialVariantPickerState({
            renderVariant: 'impact-chain',
            chainLayout: {
                direction: 'vertical',
                showEdgeLabels: false,
                collapseInvalidated: true,
            },
        });
        expect(state.currentVariant).toBe('impact-chain');
        expect(state.chainLayout.direction).toBe('vertical');
        expect(state.chainLayout.showEdgeLabels).toBe(false);
        expect(state.chainLayout.collapseInvalidated).toBe(true);
    });
});
// ========================================================================
// selectVariant
// ========================================================================
describe('selectVariant', () => {
    it('switches to impact-chain', () => {
        const state = initialVariantPickerState();
        const next = selectVariant(state, 'impact-chain');
        expect(next.currentVariant).toBe('impact-chain');
    });
    it('switches back to tree', () => {
        let state = initialVariantPickerState();
        state = selectVariant(state, 'impact-chain');
        state = selectVariant(state, 'tree');
        expect(state.currentVariant).toBe('tree');
    });
    it('preserves chain layout when switching variants', () => {
        let state = initialVariantPickerState();
        state = setChainDirection(state, 'vertical');
        state = selectVariant(state, 'impact-chain');
        expect(state.chainLayout.direction).toBe('vertical');
    });
});
// ========================================================================
// setChainDirection
// ========================================================================
describe('setChainDirection', () => {
    it('sets direction to vertical', () => {
        const state = initialVariantPickerState();
        const next = setChainDirection(state, 'vertical');
        expect(next.chainLayout.direction).toBe('vertical');
    });
    it('sets direction to horizontal', () => {
        let state = initialVariantPickerState();
        state = setChainDirection(state, 'vertical');
        state = setChainDirection(state, 'horizontal');
        expect(state.chainLayout.direction).toBe('horizontal');
    });
});
// ========================================================================
// toggleEdgeLabels
// ========================================================================
describe('toggleEdgeLabels', () => {
    it('toggles edge labels off', () => {
        const state = initialVariantPickerState();
        expect(state.chainLayout.showEdgeLabels).toBe(true);
        const next = toggleEdgeLabels(state);
        expect(next.chainLayout.showEdgeLabels).toBe(false);
    });
    it('toggles edge labels back on', () => {
        let state = initialVariantPickerState();
        state = toggleEdgeLabels(state);
        state = toggleEdgeLabels(state);
        expect(state.chainLayout.showEdgeLabels).toBe(true);
    });
});
// ========================================================================
// toggleCollapseInvalidated
// ========================================================================
describe('toggleCollapseInvalidated', () => {
    it('toggles collapse on', () => {
        const state = initialVariantPickerState();
        const next = toggleCollapseInvalidated(state);
        expect(next.chainLayout.collapseInvalidated).toBe(true);
    });
    it('toggles collapse off again', () => {
        let state = initialVariantPickerState();
        state = toggleCollapseInvalidated(state);
        state = toggleCollapseInvalidated(state);
        expect(state.chainLayout.collapseInvalidated).toBe(false);
    });
});
// ========================================================================
// setConclusionText
// ========================================================================
describe('setConclusionText', () => {
    it('sets conclusion text', () => {
        const state = initialVariantPickerState();
        const next = setConclusionText(state, 'Root cause identified');
        expect(next.chainLayout.conclusionText).toBe('Root cause identified');
    });
    it('can set to empty string', () => {
        let state = initialVariantPickerState();
        state = setConclusionText(state, 'Some text');
        state = setConclusionText(state, '');
        expect(state.chainLayout.conclusionText).toBe('');
    });
});
// ========================================================================
// getVariantConfig
// ========================================================================
describe('getVariantConfig', () => {
    it('produces tree config without chainLayout', () => {
        const state = initialVariantPickerState();
        const config = getVariantConfig(state);
        expect(config.renderVariant).toBe('tree');
        expect(config.chainLayout).toBeUndefined();
    });
    it('produces impact-chain config with chainLayout', () => {
        let state = initialVariantPickerState();
        state = selectVariant(state, 'impact-chain');
        state = setChainDirection(state, 'vertical');
        const config = getVariantConfig(state);
        expect(config.renderVariant).toBe('impact-chain');
        expect(config.chainLayout).toBeDefined();
        expect(config.chainLayout.direction).toBe('vertical');
    });
    it('chainLayout is a new object (not the same reference)', () => {
        let state = initialVariantPickerState();
        state = selectVariant(state, 'impact-chain');
        const config = getVariantConfig(state);
        expect(config.chainLayout).not.toBe(state.chainLayout);
        expect(config.chainLayout).toEqual(state.chainLayout);
    });
});
//# sourceMappingURL=variant-picker-state.test.js.map