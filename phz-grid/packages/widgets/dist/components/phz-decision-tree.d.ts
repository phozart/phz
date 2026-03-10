/**
 * @phozart/phz-widgets — Decision Tree Widget
 *
 * Visualizes branching decision logic as an expandable/collapsible tree.
 * Nodes show conditions, statuses, and outcomes. Supports external
 * evaluation via a callback property.
 */
import { LitElement } from 'lit';
import type { DecisionTreeNode, NodeStatus } from '@phozart/phz-shared/types';
export declare class PhzDecisionTree extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Flat array of tree nodes. Parent/child relationships defined by parentId/children. */
    nodes: DecisionTreeNode[];
    /** Optional evaluator callback that returns a status for each node. */
    evaluateNode?: (node: DecisionTreeNode) => NodeStatus;
    /** Tree title. */
    treeTitle: string;
    private treeState;
    willUpdate(changedProps: Map<string, unknown>): void;
    private handleToggle;
    render(): import("lit-html").TemplateResult<1>;
    private renderNode;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-decision-tree': PhzDecisionTree;
    }
}
//# sourceMappingURL=phz-decision-tree.d.ts.map