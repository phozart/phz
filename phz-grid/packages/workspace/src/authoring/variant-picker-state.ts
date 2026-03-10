/**
 * @phozart/phz-workspace — Variant Picker State (7A-C)
 *
 * State machine for the Style tab variant picker that lets authors
 * switch between decision tree rendering variants (tree vs impact-chain)
 * and configure chain-specific layout options.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type {
  DecisionTreeRenderVariant,
  DecisionTreeVariantConfig,
  ChainLayout,
  ChainLayoutDirection,
} from '@phozart/phz-shared/types';

// ========================================================================
// State
// ========================================================================

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

// ========================================================================
// Default available variants
// ========================================================================

const DEFAULT_VARIANTS: VariantOption[] = [
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

const DEFAULT_CHAIN_LAYOUT: ChainLayout = {
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
export function initialVariantPickerState(
  currentConfig?: DecisionTreeVariantConfig,
): VariantPickerState {
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
export function selectVariant(
  state: VariantPickerState,
  variant: DecisionTreeRenderVariant,
): VariantPickerState {
  return { ...state, currentVariant: variant };
}

/**
 * Set the chain layout direction (horizontal or vertical).
 */
export function setChainDirection(
  state: VariantPickerState,
  direction: ChainLayoutDirection,
): VariantPickerState {
  return {
    ...state,
    chainLayout: { ...state.chainLayout, direction },
  };
}

/**
 * Toggle whether edge labels are shown on the chain.
 */
export function toggleEdgeLabels(state: VariantPickerState): VariantPickerState {
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
export function toggleCollapseInvalidated(state: VariantPickerState): VariantPickerState {
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
export function setConclusionText(
  state: VariantPickerState,
  text: string,
): VariantPickerState {
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
export function getVariantConfig(state: VariantPickerState): DecisionTreeVariantConfig {
  const config: DecisionTreeVariantConfig = {
    renderVariant: state.currentVariant,
  };
  if (state.currentVariant === 'impact-chain') {
    config.chainLayout = { ...state.chainLayout };
  }
  return config;
}
