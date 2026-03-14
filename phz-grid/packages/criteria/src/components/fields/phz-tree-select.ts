/**
 * @phozart/criteria — Tree Select
 *
 * Dropdown trigger with chip display + tree panel with custom checkboxes,
 * expand/collapse, search filter, Select All / Clear All.
 * Tri-state parent checkboxes (all/some/none checked).
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { TreeNode, CriteriaSelectionMode } from '@phozart/core';
import { criteriaStyles } from '../../shared-styles.js';

/* ── Inline SVG icons (Phosphor-style, 16×16) ── */

const iconChevronDown = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const iconChevronRight = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const iconCheck = html`<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5L4 7.5L8 3" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const iconMinus = html`<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5h5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const iconSearch = html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.25" stroke="currentColor" stroke-width="1.5"/><path d="M9 9l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

@customElement('phz-tree-select')
export class PhzTreeSelect extends LitElement {
  static styles = [criteriaStyles, css`
    :host { position: relative; display: block; }

    /* ── Trigger ── */
    .phz-sc-ts-trigger {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 10px; border: 1px solid #D6D3D1; border-radius: 8px;
      font-size: 13px; cursor: pointer; background: #FFFFFF; color: #1C1917;
      min-width: 180px; min-height: 34px; user-select: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .phz-sc-ts-trigger:hover { border-color: #A8A29E; }
    .phz-sc-ts-trigger:focus { border-color: #2563EB; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .phz-sc-ts-trigger[aria-disabled="true"] { background: #F5F5F4; color: #A8A29E; cursor: not-allowed; pointer-events: none; }

    .phz-sc-ts-trigger-content { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; flex-wrap: wrap; }

    .phz-sc-ts-placeholder { color: #A8A29E; font-size: 13px; }

    .phz-sc-ts-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 1px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;
      background: #1C1917; color: #FFFFFF; white-space: nowrap; max-width: 120px;
      overflow: hidden; text-overflow: ellipsis; line-height: 20px;
    }

    .phz-sc-ts-overflow {
      font-size: 11px; font-weight: 600; color: #78716C; white-space: nowrap;
    }

    .phz-sc-ts-chevron {
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; flex-shrink: 0; color: #78716C;
      transition: transform 0.2s; margin-left: auto;
    }
    .phz-sc-ts-chevron--open { transform: rotate(180deg); }

    /* ── Popup ── */
    .phz-sc-ts-popup {
      position: absolute; top: 100%; left: 0; margin-top: 4px; z-index: 200;
      background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);
      min-width: 280px; max-height: 360px; display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* ── Search bar ── */
    .phz-sc-ts-search {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px; border-bottom: 1px solid #E7E5E4;
    }
    .phz-sc-ts-search-icon { color: #A8A29E; flex-shrink: 0; display: inline-flex; }
    .phz-sc-ts-search input {
      flex: 1; border: none; outline: none; font-size: 13px; color: #1C1917;
      background: transparent; font-family: inherit; padding: 0;
    }
    .phz-sc-ts-search input::placeholder { color: #A8A29E; }

    /* ── Actions bar ── */
    .phz-sc-ts-actions {
      display: flex; align-items: center; gap: 2px;
      padding: 6px 12px; border-bottom: 1px solid #E7E5E4;
    }
    .phz-sc-ts-action-btn {
      border: none; background: none; cursor: pointer;
      font-size: 11px; font-weight: 600; color: #2563EB; padding: 3px 8px;
      border-radius: 4px; font-family: inherit; transition: background 0.1s;
    }
    .phz-sc-ts-action-btn:hover { background: #EFF6FF; }
    .phz-sc-ts-action-sep { width: 1px; height: 14px; background: #E7E5E4; margin: 0 2px; }

    /* ── Tree list ── */
    .phz-sc-ts-tree-wrap { overflow-y: auto; padding: 4px 0; flex: 1; }

    .phz-sc-ts-node {
      display: flex; align-items: center; gap: 4px;
      padding: 5px 12px; cursor: pointer; border-radius: 0;
      font-size: 13px; color: #1C1917; user-select: none;
    }
    .phz-sc-ts-node:hover { background: #F5F5F4; }

    .phz-sc-ts-node--child { padding-left: 32px; }

    .phz-sc-ts-expand {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; flex-shrink: 0; color: #78716C;
      cursor: pointer; border-radius: 4px; transition: transform 0.15s, background 0.1s;
    }
    .phz-sc-ts-expand:hover { background: #E7E5E4; }
    .phz-sc-ts-expand--open { transform: rotate(90deg); }
    .phz-sc-ts-expand--hidden { visibility: hidden; }

    /* ── Custom checkbox ── */
    .phz-sc-ts-cb {
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; flex-shrink: 0; border-radius: 3px;
      border: 1.5px solid #A8A29E; background: #FFFFFF; cursor: pointer;
      transition: all 0.1s;
    }
    .phz-sc-ts-cb--checked {
      background: #1C1917; border-color: #1C1917;
    }
    .phz-sc-ts-cb--indeterminate {
      background: #1C1917; border-color: #1C1917;
    }

    .phz-sc-ts-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ── Empty ── */
    .phz-sc-ts-empty { padding: 16px 12px; font-size: 12px; color: #A8A29E; text-align: center; }

    /* ── Inactive dot ── */
    .phz-sc-ts-inactive-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #F59E0B; flex-shrink: 0; margin-left: 4px;
    }

    /* ── Truncation / Show All ── */
    .phz-sc-ts-show-all {
      display: flex; align-items: center; justify-content: center;
      padding: 8px 12px; font-size: 12px; font-weight: 600;
      color: #2563EB; cursor: pointer; border: none; background: none;
      width: 100%; font-family: inherit; transition: background 0.1s;
    }
    .phz-sc-ts-show-all:hover { background: #EFF6FF; }

    /* ── Expand button ── */
    .phz-sc-ts-expand-btn {
      display: flex; align-items: center; justify-content: center; gap: 4px;
      padding: 6px 12px; font-size: 11px; font-weight: 600;
      color: #2563EB; cursor: pointer; border: 1px solid #DBEAFE;
      background: #EFF6FF; border-radius: 6px; width: 100%;
      font-family: inherit; margin-top: 4px; transition: background 0.1s;
    }
    .phz-sc-ts-expand-btn:hover { background: #DBEAFE; }

    /* ── Inline mode ── */
    :host([inline]) .phz-sc-ts-trigger { display: none; }
    :host([inline]) .phz-sc-ts-popup {
      position: static; margin-top: 0; box-shadow: none;
      border: none; border-radius: 0; max-height: none;
    }

    /* ── Mobile: full-screen popup ── */
    @media (max-width: 576px) {
      .phz-sc-ts-popup {
        position: fixed;
        inset: 0;
        max-height: 100vh;
        min-width: unset;
        border-radius: 0;
        margin-top: 0;
        z-index: 900;
      }
    }
  `];

  @property({ type: Array }) nodes: TreeNode[] = [];
  @property({ type: Array }) value: string[] = [];
  @property({ type: Boolean }) disabled = false;
  /** Max items to show before truncation (0 = no limit) */
  @property({ type: Number }) maxVisibleItems = 0;
  /** Values that should display with an amber inactive dot */
  @property({ type: Array }) inactiveItems: string[] = [];
  /** Show an expand button for opening in a modal */
  @property({ type: Boolean }) showExpandButton = false;
  /** Inline mode: render tree directly without dropdown trigger/popup */
  @property({ type: Boolean }) inline = false;
  /** Controls value cardinality: single (radio), multiple (checkbox), none (read-only) */
  @property({ type: String }) selectionMode: CriteriaSelectionMode | undefined = undefined;

  private get _effectiveDisabled(): boolean {
    return this.disabled || this.selectionMode === 'none';
  }

  private get _isSingleMode(): boolean {
    return this.selectionMode === 'single';
  }

  @state() private _open = false;
  @state() private _search = '';
  @state() private _expanded = new Set<string>();
  @state() private _showAllItems = false;

  private _clickOutsideHandler = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._open = false;
    }
  };

  private _keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this._open) {
      this._open = false;
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._clickOutsideHandler, true);
    document.addEventListener('keydown', this._keydownHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickOutsideHandler, true);
    document.removeEventListener('keydown', this._keydownHandler);
  }

  /* ── Helpers ── */

  private _hasAnyChildren(): boolean {
    return (this.nodes ?? []).some(n => n.children && n.children.length > 0);
  }

  private _getAllLeafValues(nodes: TreeNode[]): string[] {
    const result: string[] = [];
    for (const node of nodes) {
      if (node.children?.length) {
        result.push(...this._getAllLeafValues(node.children));
      } else {
        result.push(node.value);
      }
    }
    return result;
  }

  private _getCheckState(node: TreeNode): 'all' | 'some' | 'none' {
    if (!node.children?.length) {
      return (this.value ?? []).includes(node.value) ? 'all' : 'none';
    }
    const leafValues = this._getAllLeafValues([node]);
    const checkedCount = leafValues.filter(v => (this.value ?? []).includes(v)).length;
    if (checkedCount === 0) return 'none';
    if (checkedCount === leafValues.length) return 'all';
    return 'some';
  }

  private _toggleNode(node: TreeNode) {
    if (this._effectiveDisabled) return;

    // Single mode: radio behavior — select one leaf at a time
    if (this._isSingleMode) {
      const leafValues = node.children?.length ? this._getAllLeafValues([node]) : [node.value];
      const targetValue = leafValues[0]; // pick first leaf
      const newValue = (this.value ?? []).includes(targetValue) ? [] : [targetValue];
      this.dispatchEvent(new CustomEvent('tree-change', {
        detail: { value: newValue }, bubbles: true, composed: true,
      }));
      return;
    }

    const currentState = this._getCheckState(node);
    const leafValues = node.children?.length ? this._getAllLeafValues([node]) : [node.value];
    let newValue: string[];

    if (currentState === 'all') {
      newValue = (this.value ?? []).filter(v => !leafValues.includes(v));
    } else {
      const set = new Set(this.value ?? []);
      leafValues.forEach(v => set.add(v));
      newValue = Array.from(set);
    }

    this.dispatchEvent(new CustomEvent('tree-change', {
      detail: { value: newValue }, bubbles: true, composed: true,
    }));
  }

  private _toggleExpand(nodeValue: string, e: Event) {
    e.stopPropagation();
    const expanded = new Set(this._expanded);
    if (expanded.has(nodeValue)) expanded.delete(nodeValue);
    else expanded.add(nodeValue);
    this._expanded = expanded;
  }

  private _selectAll() {
    const allLeaves = this._getAllLeafValues(this.nodes);
    this.dispatchEvent(new CustomEvent('tree-change', {
      detail: { value: allLeaves }, bubbles: true, composed: true,
    }));
  }

  private _clearAll() {
    this.dispatchEvent(new CustomEvent('tree-change', {
      detail: { value: [] }, bubbles: true, composed: true,
    }));
  }

  private _togglePopup(e: Event) {
    e.stopPropagation();
    if (this._effectiveDisabled) return;
    this._open = !this._open;
  }

  private _matchesSearch(node: TreeNode): boolean {
    if (!this._search) return true;
    const q = this._search.toLowerCase();
    if (node.label.toLowerCase().includes(q)) return true;
    if (node.children) return node.children.some(c => this._matchesSearch(c));
    return false;
  }

  /** Get display labels for currently selected values */
  private _getSelectedLabels(): string[] {
    const labels: string[] = [];
    const findLabels = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (!node.children?.length) {
          if ((this.value ?? []).includes(node.value)) labels.push(node.label);
        } else {
          findLabels(node.children);
        }
      }
    };
    findLabels(this.nodes ?? []);
    return labels;
  }

  /* ── Render ── */

  private _renderCheckbox(state: 'all' | 'some' | 'none') {
    const cls = state === 'all' ? 'phz-sc-ts-cb phz-sc-ts-cb--checked'
      : state === 'some' ? 'phz-sc-ts-cb phz-sc-ts-cb--indeterminate'
      : 'phz-sc-ts-cb';
    return html`
      <span class=${cls}>
        ${state === 'all' ? iconCheck : state === 'some' ? iconMinus : nothing}
      </span>
    `;
  }

  private _renderNode(node: TreeNode, isChild = false): unknown {
    if (!this._matchesSearch(node)) return nothing;
    const hasChildren = node.children && node.children.length > 0;
    const expanded = this._expanded.has(node.value);
    const checkState = this._getCheckState(node);
    const showExpand = this._hasAnyChildren();

    return html`
      <div
        class="phz-sc-ts-node ${isChild ? 'phz-sc-ts-node--child' : ''}"
        @click=${(e: Event) => { e.stopPropagation(); this._toggleNode(node); }}
      >
        ${showExpand ? html`
          <span
            class="phz-sc-ts-expand ${hasChildren ? (expanded ? 'phz-sc-ts-expand--open' : '') : 'phz-sc-ts-expand--hidden'}"
            @click=${hasChildren ? (e: Event) => this._toggleExpand(node.value, e) : nothing}
          >${iconChevronRight}</span>
        ` : nothing}
        ${this._renderCheckbox(checkState)}
        <span class="phz-sc-ts-label">${node.label}</span>
        ${(this.inactiveItems ?? []).includes(node.value) ? html`<span class="phz-sc-ts-inactive-dot" title="Inactive"></span>` : nothing}
      </div>
      ${hasChildren && expanded ? node.children!.map(c => this._renderNode(c, true)) : nothing}
    `;
  }

  private _onExpandRequest() {
    this.dispatchEvent(new CustomEvent('tree-expand-request', {
      bubbles: true, composed: true,
    }));
  }

  private _renderTreeContent() {
    const hasMatches = (this.nodes ?? []).some(n => this._matchesSearch(n));

    // Determine visible nodes with truncation
    let visibleNodes = (this.nodes ?? []).filter(n => this._matchesSearch(n));
    const totalCount = visibleNodes.length;
    const shouldTruncate = this.maxVisibleItems > 0 && !this._showAllItems && totalCount > this.maxVisibleItems;
    if (shouldTruncate) {
      visibleNodes = visibleNodes.slice(0, this.maxVisibleItems);
    }

    return html`
      <div class="phz-sc-ts-search">
        <span class="phz-sc-ts-search-icon">${iconSearch}</span>
        <input
          type="text"
          placeholder="Search..."
          .value=${this._search}
          @input=${(e: Event) => { this._search = (e.target as HTMLInputElement).value; }}
          @click=${(e: Event) => e.stopPropagation()}
        />
      </div>
      ${!this._isSingleMode ? html`
        <div class="phz-sc-ts-actions">
          <button class="phz-sc-ts-action-btn" @click=${(e: Event) => { e.stopPropagation(); this._selectAll(); }}>Select All</button>
          <span class="phz-sc-ts-action-sep"></span>
          <button class="phz-sc-ts-action-btn" @click=${(e: Event) => { e.stopPropagation(); this._clearAll(); }}>Clear All</button>
        </div>
      ` : html`
        <div class="phz-sc-ts-actions">
          <button class="phz-sc-ts-action-btn" @click=${(e: Event) => { e.stopPropagation(); this._clearAll(); }}>Clear</button>
        </div>
      `}
      <div class="phz-sc-ts-tree-wrap">
        ${hasMatches
          ? html`
              ${visibleNodes.map(n => this._renderNode(n))}
              ${shouldTruncate ? html`
                <button class="phz-sc-ts-show-all" @click=${(e: Event) => { e.stopPropagation(); this._showAllItems = true; }}>
                  Show all (${totalCount} items)
                </button>
              ` : nothing}
            `
          : html`<div class="phz-sc-ts-empty">No matches found</div>`
        }
        ${this.showExpandButton ? html`
          <button class="phz-sc-ts-expand-btn" @click=${(e: Event) => { e.stopPropagation(); this._onExpandRequest(); }}>
            Expand to full view
          </button>
        ` : nothing}
      </div>
    `;
  }

  render() {
    // Inline mode: render tree directly without trigger/popup
    if (this.inline) {
      return this._renderTreeContent();
    }

    const selectedLabels = this._getSelectedLabels();
    const count = selectedLabels.length;

    // Trigger chips: show up to 2 labels, then "+N more"
    const maxChips = 2;
    const visibleLabels = selectedLabels.slice(0, maxChips);
    const overflow = count - maxChips;

    return html`
      <button
        class="phz-sc-ts-trigger"
        @click=${this._togglePopup}
        aria-disabled=${this._effectiveDisabled ? 'true' : 'false'}
        aria-haspopup="tree"
        aria-expanded=${this._open}
        tabindex="0"
      >
        <span class="phz-sc-ts-trigger-content">
          ${count === 0
            ? html`<span class="phz-sc-ts-placeholder">Select...</span>`
            : html`
                ${visibleLabels.map(l => html`<span class="phz-sc-ts-chip">${l}</span>`)}
                ${overflow > 0 ? html`<span class="phz-sc-ts-overflow">+${overflow} more</span>` : nothing}
              `
          }
        </span>
        <span class="phz-sc-ts-chevron ${this._open ? 'phz-sc-ts-chevron--open' : ''}">${iconChevronDown}</span>
      </button>

      ${this._open ? html`
        <div class="phz-sc-ts-popup">
          ${this._renderTreeContent()}
        </div>
      ` : nothing}
    `;
  }
}
