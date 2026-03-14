/**
 * @phozart/workspace — Variant Picker State (7A-C)
 *
 * State machine for the Style tab variant picker that lets authors
 * switch between decision tree rendering variants (tree vs impact-chain)
 * and configure chain-specific layout options.
 *
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// Default available variants
// ========================================================================
const DEFAULT_VARIANTS = [
    {
        id: 'tree',
        name: 'Status Tree',
        description: 'Vertical hierarchical status evaluation',
    },
    {
        id: 'impact-chain',
        name: 'Impact Chain',
        description: 'Horizontal causal flow for root cause analysis',
    },
];
const DEFAULT_CHAIN_LAYOUT = {
    direction: 'horizontal',
    showEdgeLabels: true,
    collapseInvalidated: false,
};
// ========================================================================
// Factory
// ========================================================================
/**
 * Create initial variant picker state from an optional existing config.
 *
 * @param currentConfig - Existing variant config to restore, if any.
 */
export function initialVariantPickerState(currentConfig) {
    return {
        currentVariant: currentConfig?.renderVariant ?? 'tree',
        chainLayout: currentConfig?.chainLayout ?? { ...DEFAULT_CHAIN_LAYOUT },
        availableVariants: [...DEFAULT_VARIANTS],
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Select a rendering variant. Returns a new state.
 */
export function selectVariant(state, variant) {
    return { ...state, currentVariant: variant };
}
/**
 * Set the chain layout direction (horizontal or vertical).
 */
export function setChainDirection(state, direction) {
    return {
        ...state,
        chainLayout: { ...state.chainLayout, direction },
    };
}
/**
 * Toggle whether edge labels are shown on the chain.
 */
export function toggleEdgeLabels(state) {
    return {
        ...state,
        chainLayout: {
            ...state.chainLayout,
            showEdgeLabels: !state.chainLayout.showEdgeLabels,
        },
    };
}
/**
 * Toggle whether invalidated hypothesis nodes are visually collapsed.
 */
export function toggleCollapseInvalidated(state) {
    return {
        ...state,
        chainLayout: {
            ...state.chainLayout,
            collapseInvalidated: !state.chainLayout.collapseInvalidated,
        },
    };
}
/**
 * Set the conclusion text template for the chain layout.
 */
export function setConclusionText(state, text) {
    return {
        ...state,
        chainLayout: {
            ...state.chainLayout,
            conclusionText: text,
        },
    };
}
// ========================================================================
// Config extraction
// ========================================================================
/**
 * Extract a DecisionTreeVariantConfig from the current picker state.
 * Chain layout is only included when the variant is 'impact-chain'.
 */
export function getVariantConfig(state) {
    const config = {
        renderVariant: state.currentVariant,
    };
    if (state.currentVariant === 'impact-chain') {
        config.chainLayout = { ...state.chainLayout };
    }
    return config;
}
//# sourceMappingURL=variant-picker-state.js.map