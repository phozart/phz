/**
 * @phozart/widgets — Decision Tree Variant Entries (7A-C)
 *
 * WidgetManifest variant definitions for the decision tree widget.
 * Each variant specifies a preset config that the authoring layer uses
 * when placing or switching between rendering modes.
 */

import type { DecisionTreeRenderVariant } from '@phozart/shared/types';

/** A single variant entry for the decision tree widget manifest. */
export interface DecisionTreeVariantEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly presetConfig: { readonly renderVariant: DecisionTreeRenderVariant };
}

/** Available rendering variants for the decision tree widget. */
export const DECISION_TREE_VARIANTS: readonly DecisionTreeVariantEntry[] = [
  {
    id: 'tree',
    name: 'Status Tree',
    description: 'Vertical hierarchical status evaluation',
    presetConfig: { renderVariant: 'tree' as const },
  },
  {
    id: 'impact-chain',
    name: 'Impact Chain',
    description: 'Horizontal causal flow for root cause analysis',
    presetConfig: { renderVariant: 'impact-chain' as const },
  },
] as const;
