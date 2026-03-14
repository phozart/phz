var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/viewer — <phz-attention-dropdown> Custom Element
 *
 * Dropdown panel for attention items (alerts, notifications).
 * Delegates to the headless attention-state functions.
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createAttentionDropdownState, setAttentionItems, toggleAttentionDropdown, markItemsAsRead, markAllAsRead, dismissItem, setAttentionTypeFilter, getFilteredItems, } from '../screens/attention-state.js';
// ========================================================================
// <phz-attention-dropdown>
// ========================================================================
let PhzAttentionDropdown = class PhzAttentionDropdown extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.open = false;
        this.items = [];
        // --- Internal state ---
        this._dropdownState = createAttentionDropdownState();
    }
    static { this.styles = css `
    :host {
      display: inline-block;
      position: relative;
    }

    .dropdown-panel {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      width: 360px;
      max-height: 480px;
      overflow-y: auto;
      background: var(--phz-bg-surface, #ffffff);
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
      z-index: 100;
    }

    :host([open]) .dropdown-panel {
      display: block;
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--phz-border-default, #e2e8f0);
      font-size: 14px;
      font-weight: 600;
    }

    .dropdown-actions {
      display: flex;
      gap: 8px;
    }

    .dropdown-actions button {
      font-size: 12px;
      color: var(--phz-color-primary, #3b82f6);
      background: none;
      border: none;
      cursor: pointer;
    }

    .type-filter {
      display: flex;
      gap: 4px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--phz-border-default, #e2e8f0);
    }

    .type-filter-btn {
      padding: 2px 8px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
    }

    .type-filter-btn[data-active] {
      background: var(--phz-bg-active, #e2e8f0);
      font-weight: 600;
    }

    .item-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .attention-item {
      padding: 12px 16px;
      border-bottom: 1px solid var(--phz-border-default, #f1f5f9);
      cursor: pointer;
      transition: background 0.15s;
    }

    .attention-item:hover {
      background: var(--phz-bg-hover, #f8fafc);
    }

    .attention-item[data-unread] {
      background: var(--phz-bg-highlight, #eff6ff);
    }

    .item-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .item-message {
      font-size: 12px;
      color: var(--phz-text-secondary, #64748b);
      line-height: 1.4;
    }

    .item-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 11px;
      color: var(--phz-text-tertiary, #94a3b8);
    }

    .item-severity {
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .item-severity[data-severity="critical"] {
      color: var(--phz-color-danger, #ef4444);
    }

    .item-severity[data-severity="warning"] {
      color: var(--phz-color-warning, #f59e0b);
    }

    .empty-state {
      padding: 32px 16px;
      text-align: center;
      color: var(--phz-text-secondary, #64748b);
      font-size: 13px;
    }
  `; }
    // --- Lifecycle ---
    willUpdate(changed) {
        if (changed.has('items')) {
            this._dropdownState = setAttentionItems(this._dropdownState, this.items, this.items.length);
        }
        if (changed.has('open')) {
            this._dropdownState = { ...this._dropdownState, open: this.open };
        }
    }
    // --- Public API ---
    getDropdownState() {
        return this._dropdownState;
    }
    toggle() {
        this._dropdownState = toggleAttentionDropdown(this._dropdownState);
        this.open = this._dropdownState.open;
        this.requestUpdate();
    }
    // --- Rendering ---
    render() {
        const s = this._dropdownState;
        const filtered = getFilteredItems(s);
        return html `
      <div class="dropdown-panel" role="dialog" aria-label="Attention items">
        <div class="dropdown-header">
          <span>Notifications (${s.unreadCount} unread)</span>
          <div class="dropdown-actions">
            <button @click=${this._handleMarkAllRead}>Mark all read</button>
          </div>
        </div>

        <div class="type-filter">
          <button
            class="type-filter-btn"
            ?data-active=${!s.typeFilter}
            @click=${() => this._handleTypeFilter(null)}
          >All</button>
          ${['alert', 'notification', 'action', 'info'].map(t => html `
              <button
                class="type-filter-btn"
                ?data-active=${s.typeFilter === t}
                @click=${() => this._handleTypeFilter(t)}
              >${t}</button>
            `)}
        </div>

        ${filtered.length === 0
            ? html `<div class="empty-state">No items to show.</div>`
            : html `
            <ul class="item-list" role="list">
              ${filtered.map(item => this._renderItem(item))}
            </ul>
          `}
      </div>
    `;
    }
    _renderItem(item) {
        return html `
      <li
        class="attention-item"
        ?data-unread=${!item.read}
        role="listitem"
        @click=${() => this._handleItemClick(item)}
      >
        <div class="item-title">${item.title}</div>
        <div class="item-message">${item.message}</div>
        <div class="item-meta">
          <span class="item-severity" data-severity=${item.severity}>${item.severity}</span>
          <span>${new Date(item.timestamp).toLocaleString()}</span>
          <button
            @click=${(e) => {
            e.stopPropagation();
            this._handleDismiss(item.id);
        }}
            aria-label="Dismiss"
          >&times;</button>
        </div>
      </li>
    `;
    }
    // --- Event handlers ---
    _handleMarkAllRead() {
        this._dropdownState = markAllAsRead(this._dropdownState);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('attention-mark-all-read', { bubbles: true, composed: true }));
    }
    _handleTypeFilter(type) {
        this._dropdownState = setAttentionTypeFilter(this._dropdownState, type);
        this.requestUpdate();
    }
    _handleItemClick(item) {
        if (!item.read) {
            this._dropdownState = markItemsAsRead(this._dropdownState, [item.id]);
            this.requestUpdate();
        }
        this.dispatchEvent(new CustomEvent('attention-item-click', {
            bubbles: true, composed: true,
            detail: { item },
        }));
    }
    _handleDismiss(itemId) {
        this._dropdownState = dismissItem(this._dropdownState, itemId);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('attention-dismiss', {
            bubbles: true, composed: true,
            detail: { itemId },
        }));
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzAttentionDropdown.prototype, "open", void 0);
__decorate([
    property({ attribute: false })
], PhzAttentionDropdown.prototype, "items", void 0);
__decorate([
    state()
], PhzAttentionDropdown.prototype, "_dropdownState", void 0);
PhzAttentionDropdown = __decorate([
    customElement('phz-attention-dropdown')
], PhzAttentionDropdown);
export { PhzAttentionDropdown };
//# sourceMappingURL=phz-attention-dropdown.js.map