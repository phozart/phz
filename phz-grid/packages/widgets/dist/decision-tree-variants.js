/**
 * @phozart/widgets — Decision Tree Variant Entries (7A-C)
 *
 * WidgetManifest variant definitions for the decision tree widget.
 * Each variant specifies a preset config that the authoring layer uses
 * when placing or switching between rendering modes.
 */
/** Available rendering variants for the decision tree widget. */
export const DECISION_TREE_VARIANTS = [
    {
        id: 'tree',
        name: 'Status Tree',
        description: 'Vertical hierarchical status evaluation',
        presetConfig: { renderVariant: 'tree' },
    },
    {
        id: 'impact-chain',
        name: 'Impact Chain',
        description: 'Horizontal causal flow for root cause analysis',
        presetConfig: { renderVariant: 'impact-chain' },
    },
];
//# sourceMappingURL=decision-tree-variants.js.map