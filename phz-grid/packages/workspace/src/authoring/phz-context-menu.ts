/**
 * @phozart/phz-workspace — Context Menu Component
 *
 * Generic positioned overlay for context menus.
 * Receives ContextMenuItem[] and emits 'menu-action' with the selected action ID.
 * Supports nested submenus, separators, icons, shortcuts, and keyboard navigation.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { ContextMenuItem } from './report-context-menu.js';

@safeCustomElement('phz-context-menu')
export class PhzContextMenu extends LitElement {
  @property({ type: Array }) items: ContextMenuItem[] = [];
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private _focusedIndex = -1;
  @state() private _openSubmenuId?: string;

  static styles = css`
    :host {
      display: none;
      position: fixed;
      z-index: 10000;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    :host([open]) { display: block; }

    .menu {
      background: var(--phz-bg, #fff);
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      min-width: 180px;
      max-width: 300px;
      padding: 4px 0;
      overflow: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--phz-text, #1f2937);
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      position: relative;
    }

    .menu-item:hover,
    .menu-item.focused {
      background: var(--phz-bg-hover, #f3f4f6);
    }

    .menu-item[aria-disabled="true"] {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }

    .separator {
      height: 1px;
      background: var(--phz-border, #d1d5db);
      margin: 4px 0;
    }

    .item-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      font-size: 14px;
      text-align: center;
    }

    .item-label { flex: 1; }

    .item-shortcut {
      font-size: 11px;
      color: var(--phz-text-secondary, #6b7280);
      margin-left: 16px;
    }

    .submenu-arrow {
      font-size: 10px;
      color: var(--phz-text-secondary, #6b7280);
      margin-left: auto;
    }

    .submenu-container {
      position: absolute;
      left: 100%;
      top: -4px;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this._onDocClick = this._onDocClick.bind(this);
    this._onDocKeyDown = this._onDocKeyDown.bind(this);
    document.addEventListener('click', this._onDocClick, true);
    document.addEventListener('keydown', this._onDocKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick, true);
    document.removeEventListener('keydown', this._onDocKeyDown);
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) {
      if (this.open) {
        this._focusedIndex = -1;
        this._openSubmenuId = undefined;
        this.style.left = `${this.x}px`;
        this.style.top = `${this.y}px`;
        this._clampPosition();
      }
    }
    if (changed.has('x') || changed.has('y')) {
      this.style.left = `${this.x}px`;
      this.style.top = `${this.y}px`;
    }
  }

  private _clampPosition(): void {
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (rect.right > vw) this.style.left = `${Math.max(0, vw - rect.width - 8)}px`;
      if (rect.bottom > vh) this.style.top = `${Math.max(0, vh - rect.height - 8)}px`;
    });
  }

  private _onDocClick(e: Event): void {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._close();
    }
  }

  private _onDocKeyDown(e: KeyboardEvent): void {
    if (!this.open) return;

    const actionItems = this._getActionItems();

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this._close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._focusedIndex = this._focusedIndex < actionItems.length - 1
          ? this._focusedIndex + 1
          : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._focusedIndex = this._focusedIndex > 0
          ? this._focusedIndex - 1
          : actionItems.length - 1;
        break;
      case 'ArrowRight': {
        e.preventDefault();
        const focused = actionItems[this._focusedIndex];
        if (focused?.children?.length) {
          this._openSubmenuId = focused.id;
        }
        break;
      }
      case 'ArrowLeft':
        e.preventDefault();
        this._openSubmenuId = undefined;
        break;
      case 'Enter': {
        e.preventDefault();
        const focused = actionItems[this._focusedIndex];
        if (focused && !focused.disabled) {
          if (focused.children?.length) {
            this._openSubmenuId = focused.id;
          } else {
            this._selectItem(focused);
          }
        }
        break;
      }
    }
  }

  private _getActionItems(): ContextMenuItem[] {
    return this.items.filter(i => !i.separator);
  }

  private _selectItem(item: ContextMenuItem): void {
    if (item.disabled) return;
    this.dispatchEvent(new CustomEvent('menu-action', {
      detail: { actionId: item.id, label: item.label },
      bubbles: true,
      composed: true,
    }));
    this._close();
  }

  private _close(): void {
    this.open = false;
    this._focusedIndex = -1;
    this._openSubmenuId = undefined;
    this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.open || this.items.length === 0) return nothing;

    const actionItems = this._getActionItems();

    return html`
      <div class="menu" role="menu" aria-label="Context menu">
        ${this.items.map(item => {
          if (item.separator) {
            return html`<div class="separator" role="separator"></div>`;
          }

          const actionIndex = actionItems.indexOf(item);
          const isFocused = actionIndex === this._focusedIndex;
          const hasSubmenu = item.children && item.children.length > 0;
          const submenuOpen = this._openSubmenuId === item.id;

          return html`
            <button
              class="menu-item ${isFocused ? 'focused' : ''}"
              role="menuitem"
              aria-disabled=${item.disabled ? 'true' : 'false'}
              aria-haspopup=${hasSubmenu ? 'true' : 'false'}
              @click=${() => hasSubmenu ? (this._openSubmenuId = item.id) : this._selectItem(item)}
              @mouseenter=${() => {
                this._focusedIndex = actionIndex;
                if (hasSubmenu) this._openSubmenuId = item.id;
                else this._openSubmenuId = undefined;
              }}
            >
              ${item.icon ? html`<span class="item-icon">${item.icon}</span>` : nothing}
              <span class="item-label">${item.label}</span>
              ${item.shortcut ? html`<span class="item-shortcut">${item.shortcut}</span>` : nothing}
              ${hasSubmenu ? html`<span class="submenu-arrow">▸</span>` : nothing}
              ${hasSubmenu && submenuOpen ? html`
                <div class="submenu-container">
                  <phz-context-menu
                    .items=${item.children!}
                    .open=${true}
                    @menu-action=${(e: CustomEvent) => {
                      e.stopPropagation();
                      this._selectItem({ id: e.detail.actionId, label: e.detail.label });
                    }}
                  ></phz-context-menu>
                </div>
              ` : nothing}
            </button>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-context-menu': PhzContextMenu;
  }
}
