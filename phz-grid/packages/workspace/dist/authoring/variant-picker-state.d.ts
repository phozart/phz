/**
 * @phozart/phz-workspace — Variant Picker State (7A-C)
 *
 * State machine for the Style tab variant picker that lets authors
 * switch between decision tree rendering variants (tree vs impact-chain)
 * and configure chain-specific layout options.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { DecisionTreeRenderVariant, DecisionTreeVariantConfig, ChainLayout, ChainLayoutDirection } from '@phozart/phz-shared/types';
/** Variant descriptor shown in the picker UI. */
export interface VariantOption {
    id: string;
    name: string;
    description: string;
}
/** State for the decision tree variant picker. */
export interface VariantPickerState {
    currentVariant: DecisionTreeRenderVariant;
    chainLayout: ChainLayout;
    availableVariants: VariantOption[];
}
/**
 * Create initial variant picker state from an optional existing config.
 *
 * @param currentConfig - Existing variant config to restore, if any.
 */
export declare function initialVariantPickerState(currentConfig?: DecisionTreeVariantConfig): VariantPickerState;
/**
 * Select a rendering variant. Returns a new state.
 */
export declare function selectVariant(state: VariantPickerState, variant: DecisionTreeRenderVariant): VariantPickerState;
/**
 * Set the chain layout direction (horizontal or vertical).
 */
export declare function setChainDirection(state: VariantPickerState, direction: ChainLayoutDirection): VariantPickerState;
/**
 * Toggle whether edge labels are shown on the chain.
 */
export declare function toggleEdgeLabels(state: VariantPickerState): VariantPickerState;
/**
 * Toggle whether invalidated hypothesis nodes are visually collapsed.
 */
export declare function toggleCollapseInvalidated(state: VariantPickerState): VariantPickerState;
/**
 * Set the conclusion text template for the chain layout.
 */
export declare function setConclusionText(state: VariantPickerState, text: string): VariantPickerState;
/**
 * Extract a DecisionTreeVariantConfig from the current picker state.
 * Chain layout is only included when the variant is 'impact-chain'.
 */
export declare function getVariantConfig(state: VariantPickerState): DecisionTreeVariantConfig;
//# sourceMappingURL=variant-picker-state.d.ts.map