/**
 * @phozart/widgets — Decision Tree Widget
 *
 * Visualizes branching decision logic as an expandable/collapsible tree.
 * Nodes show conditions, statuses, and outcomes. Supports external
 * evaluation via a callback property.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { DecisionTreeNode, NodeStatus } from '@phozart/shared/types';
import {
  createDecisionTreeState,
  toggleNode,
  evaluateAllNodes,
  getVisibleNodes,
  getNodeDepth,
  getEffectiveStatus,
  type DecisionTreeState,
} from '../decision-tree-state.js';

const STATUS_ICONS: Record<NodeStatus, string> = {
  pending: '\u25CB',   // open circle
  active: '\u25CF',    // filled circle
  complete: '\u2713',  // check mark
  skipped: '\u2014',   // em dash
  error: '\u2717',     // cross mark
};

@customElement('phz-decision-tree')
export class PhzDecisionTree extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; container-type: inline-size; }

      .tree { display: flex; flex-direction: column; gap: 2px; }

      .tree-node {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        min-height: 40px;
        transition: background 0.15s ease;
      }

      .tree-node:hover {
        background: var(--phz-w-surface, #F5F5F4);
      }

      .tree-node:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .tree-toggle {
        display: inline-flex;
        width: 20px;
        justify-content: center;
        font-size: 12px;
        color: var(--phz-w-text-muted, #78716C);
        user-select: none;
      }

      .tree-label {
        font-size: 14px;
        color: var(--phz-w-text, #1C1917);
      }

      .tree-description {
        font-size: 12px;
        color: var(--phz-w-text-muted, #78716C);
        margin-top: 2px;
      }

      .tree-status {
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .tree-status--pending { color: var(--phz-w-text-muted, #A8A29E); }
      .tree-status--active { color: #3B82F6; }
      .tree-status--complete { color: #16A34A; }
      .tree-status--skipped { color: var(--phz-w-text-muted, #78716C); }
      .tree-status--error { color: #DC2626; }

      @container (max-width: 400px) {
        .tree-node {
          grid-template-columns: auto 1fr;
          padding: 6px 8px;
        }
        .tree-description { display: none; }
      }

      @container (max-width: 200px) {
        .tree-toggle { display: none; }
      }
    `,
  ];

  /** Flat array of tree nodes. Parent/child relationships defined by parentId/children. */
  @property({ attribute: false }) nodes: DecisionTreeNode[] = [];

  /** Optional evaluator callback that returns a status for each node. */
  @property({ attribute: false }) evaluateNode?: (node: DecisionTreeNode) => NodeStatus;

  /** Tree title. */
  @property({ type: String }) treeTitle: string = 'Decision Tree';

  @state() private treeState: DecisionTreeState = createDecisionTreeState([]);

  willUpdate(changedProps: Map<string, unknown>) {
    if (changedProps.has('nodes')) {
      this.treeState = createDecisionTreeState(this.nodes);
      if (this.evaluateNode) {
        this.treeState = evaluateAllNodes(this.treeState, this.evaluateNode);
      }
    }
    if (changedProps.has('evaluateNode') && this.evaluateNode) {
      this.treeState = evaluateAllNodes(this.treeState, this.evaluateNode);
    }
  }

  private handleToggle(nodeId: string) {
    this.treeState = toggleNode(this.treeState, nodeId);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('node-toggle', {
      bubbles: true,
      composed: true,
      detail: { nodeId, expanded: this.treeState.expandedNodeIds.has(nodeId) },
    }));
  }

  render() {
    const visible = getVisibleNodes(this.treeState);
    if (visible.length === 0) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No nodes</p></div>`;
    }

    return html`
      <div class="phz-w-card" role="tree" aria-label="${this.treeTitle}">
        <h3 class="phz-w-title">${this.treeTitle}</h3>
        <div class="tree">
          ${visible.map(node => this.renderNode(node))}
        </div>
      </div>
    `;
  }

  private renderNode(node: DecisionTreeNode) {
    const depth = getNodeDepth(this.treeState, node.id);
    const hasChildren = node.children.length > 0;
    const expanded = this.treeState.expandedNodeIds.has(node.id);
    const status = getEffectiveStatus(this.treeState, node.id);
    const icon = STATUS_ICONS[status];

    return html`
      <div
        class="tree-node"
        role="treeitem"
        tabindex="0"
        aria-expanded="${hasChildren ? String(expanded) : nothing}"
        aria-level="${depth + 1}"
        aria-label="${node.label} - ${status}"
        style="padding-left: ${12 + depth * 20}px"
        @click=${() => hasChildren && this.handleToggle(node.id)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasChildren) this.handleToggle(node.id);
          }
        }}
      >
        <span class="tree-toggle">
          ${hasChildren ? (expanded ? '\u25BE' : '\u25B8') : ''}
        </span>
        <div>
          <div class="tree-label">${node.label}</div>
          ${node.description
            ? html`<div class="tree-description">${node.description}</div>`
            : nothing}
        </div>
        <span class="tree-status tree-status--${status}">${icon}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-decision-tree': PhzDecisionTree;
  }
}
