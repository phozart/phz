var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/grid — <phz-context-menu>
 *
 * A reusable context menu component with Phz Console styling,
 * keyboard navigation, smart viewport positioning, and ARIA support.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
let PhzContextMenu = class PhzContextMenu extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this.items = [];
        this.x = 0;
        this.y = 0;
        this.focusedIndex = -1;
        this.adjustedX = 0;
        this.adjustedY = 0;
        this.cleanup = null;
    }
    static { this.styles = css `
    :host {
      position: fixed;
      top: 0; left: 0;
      width: 0; height: 0;
      z-index: 10000;
      pointer-events: none;
      overflow: visible;
    }

    :host([open]) {
      pointer-events: auto;
    }

    .phz-ctx-menu {
      position: fixed;
      min-width: 200px;
      max-width: 300px;
      background: var(--phz-popover-bg, #FEFDFB);
      border: 1px solid var(--phz-popover-border, #E7E5E4);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);
      padding: 6px;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 150ms cubic-bezier(0.0, 0.0, 0.2, 1),
                  transform 150ms cubic-bezier(0.0, 0.0, 0.2, 1);
      font-family: var(--phz-font-family-base, system-ui, -apple-system, sans-serif);
      font-size: 0.8125rem;
    }

    :host([open]) .phz-ctx-menu {
      opacity: 1;
      transform: translateY(0);
    }

    .phz-ctx-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      color: #1C1917;
      transition: background 100ms ease;
      user-select: none;
      min-height: 36px;
      box-sizing: border-box;
    }

    .phz-ctx-item:hover,
    .phz-ctx-item--focused {
      background: rgba(59, 130, 246, 0.08);
    }

    .phz-ctx-item--disabled {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }

    .phz-ctx-item--danger { color: #EF4444; }
    .phz-ctx-item--danger:hover,
    .phz-ctx-item--danger.phz-ctx-item--focused {
      background: rgba(239, 68, 68, 0.08);
    }

    .phz-ctx-item__icon {
      width: 18px;
      text-align: center;
      flex-shrink: 0;
      font-size: 14px;
    }

    .phz-ctx-item__label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .phz-ctx-item__shortcut {
      font-size: 0.6875rem;
      color: #78716C;
      flex-shrink: 0;
      font-family: var(--phz-font-family-mono, monospace);
    }

    .phz-ctx-item__check {
      width: 16px;
      text-align: center;
      flex-shrink: 0;
      color: var(--phz-color-primary, #3B82F6);
    }

    .phz-ctx-separator {
      height: 1px;
      background: #E7E5E4;
      margin: 4px 8px;
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-ctx-menu {
        transition: none;
      }
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeListeners();
    }
    updated(changed) {
        if (changed.has('open')) {
            if (this.open) {
                this.positionMenu();
                this.addListeners();
                this.focusedIndex = -1;
            }
            else {
                this.removeListeners();
            }
        }
        if (changed.has('x') || changed.has('y')) {
            if (this.open)
                this.positionMenu();
        }
    }
    show(x, y, items) {
        this.x = x;
        this.y = y;
        this.items = items;
        this.open = true;
    }
    hide() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true, composed: true }));
    }
    positionMenu() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const menuWidth = 220;
        const menuHeight = this.items.length * 40 + 12;
        this.adjustedX = (this.x + menuWidth > vw) ? this.x - menuWidth : this.x;
        this.adjustedY = (this.y + menuHeight > vh) ? this.y - menuHeight : this.y;
        if (this.adjustedX < 0)
            this.adjustedX = 4;
        if (this.adjustedY < 0)
            this.adjustedY = 4;
    }
    addListeners() {
        let cancelled = false;
        const onClickOutside = (e) => {
            // Use composedPath() to correctly detect clicks inside shadow DOM
            const path = e.composedPath();
            if (!path.includes(this)) {
                this.hide();
            }
        };
        const onKeydown = (e) => {
            this.handleKeydown(e);
        };
        // Delay to avoid catching the originating click
        requestAnimationFrame(() => {
            if (cancelled)
                return;
            document.addEventListener('mousedown', onClickOutside, true);
            document.addEventListener('keydown', onKeydown, true);
            this.cleanup = () => {
                document.removeEventListener('mousedown', onClickOutside, true);
                document.removeEventListener('keydown', onKeydown, true);
            };
        });
        // If removeListeners called before rAF, just set cancelled flag
        this.cleanup = () => { cancelled = true; };
    }
    removeListeners() {
        this.cleanup?.();
        this.cleanup = null;
    }
    handleKeydown(e) {
        const actionableItems = this.items
            .map((item, i) => ({ item, i }))
            .filter(({ item }) => !item.separator && !item.disabled);
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                this.hide();
                break;
            case 'ArrowDown': {
                e.preventDefault();
                e.stopPropagation();
                const currentIdx = actionableItems.findIndex(({ i }) => i === this.focusedIndex);
                const next = currentIdx < actionableItems.length - 1 ? currentIdx + 1 : 0;
                this.focusedIndex = actionableItems[next].i;
                this.focusMenuItem();
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                e.stopPropagation();
                const currentIdx = actionableItems.findIndex(({ i }) => i === this.focusedIndex);
                const prev = currentIdx > 0 ? currentIdx - 1 : actionableItems.length - 1;
                this.focusedIndex = actionableItems[prev].i;
                this.focusMenuItem();
                break;
            }
            case 'Enter':
            case ' ':
                e.preventDefault();
                e.stopPropagation();
                if (this.focusedIndex >= 0) {
                    this.selectItem(this.items[this.focusedIndex]);
                }
                break;
        }
    }
    /** Move DOM focus to the currently highlighted menu item */
    focusMenuItem() {
        if (this.focusedIndex < 0)
            return;
        const root = this.renderRoot ?? this.shadowRoot;
        if (!root)
            return;
        const items = root.querySelectorAll('[role="menuitem"]');
        items.forEach((el, idx) => {
            el.setAttribute('tabindex', idx === this.focusedIndex ? '0' : '-1');
        });
        const target = items[this.focusedIndex];
        if (target)
            target.focus();
    }
    selectItem(item) {
        if (item.disabled || item.separator)
            return;
        this.dispatchEvent(new CustomEvent('menu-select', {
            detail: { id: item.id, item },
            bubbles: true,
            composed: true,
        }));
        this.hide();
    }
    render() {
        if (!this.open)
            return html ``;
        return html `
      <div
        class="phz-ctx-menu"
        role="menu"
        aria-label="Context menu"
        style="left: ${this.adjustedX}px; top: ${this.adjustedY}px;"
      >
        ${this.items.map((item, idx) => {
            if (item.separator) {
                return html `<div class="phz-ctx-separator" role="separator"></div>`;
            }
            const focused = idx === this.focusedIndex;
            return html `
            <div
              class="phz-ctx-item ${item.disabled ? 'phz-ctx-item--disabled' : ''} ${focused ? 'phz-ctx-item--focused' : ''} ${item.variant === 'danger' ? 'phz-ctx-item--danger' : ''}"
              role="menuitem"
              tabindex="-1"
              aria-disabled="${item.disabled ?? false}"
              @click="${() => this.selectItem(item)}"
              @mouseenter="${() => { this.focusedIndex = idx; }}"
            >
              ${item.checked != null
                ? html `<span class="phz-ctx-item__check" aria-hidden="true">${item.checked ? '\u2713' : ''}</span>`
                : nothing}
              ${item.icon
                ? html `<span class="phz-ctx-item__icon" aria-hidden="true">${item.icon}</span>`
                : nothing}
              <span class="phz-ctx-item__label">${item.label}</span>
              ${item.shortcut
                ? html `<span class="phz-ctx-item__shortcut">${item.shortcut}</span>`
                : nothing}
            </div>
          `;
        })}
      </div>
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzContextMenu.prototype, "open", void 0);
__decorate([
    property({ attribute: false })
], PhzContextMenu.prototype, "items", void 0);
__decorate([
    property({ type: Number })
], PhzContextMenu.prototype, "x", void 0);
__decorate([
    property({ type: Number })
], PhzContextMenu.prototype, "y", void 0);
__decorate([
    state()
], PhzContextMenu.prototype, "focusedIndex", void 0);
__decorate([
    state()
], PhzContextMenu.prototype, "adjustedX", void 0);
__decorate([
    state()
], PhzContextMenu.prototype, "adjustedY", void 0);
PhzContextMenu = __decorate([
    customElement('phz-context-menu')
], PhzContextMenu);
export { PhzContextMenu };
//# sourceMappingURL=phz-context-menu.js.map