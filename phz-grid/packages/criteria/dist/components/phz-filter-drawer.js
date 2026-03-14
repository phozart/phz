/**
 * @phozart/criteria — Filter Drawer
 *
 * Right-side slide-out panel (520px default) with backdrop overlay.
 * Supports pinned mode: drawer becomes an inline sidebar (no overlay).
 * Drag-to-resize handle on the left edge. CSS transition, escape key close, focus trap.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';
const iconX = html `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
/** Pin icon — vertical thumbtack (pinned state) */
const iconPinned = html `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 1v2.5L4 5v1.5h2.5L7 12l.5-5.5H10V5L9 3.5V1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** Pin icon — angled thumbtack (unpinned state) */
const iconUnpinned = html `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6.5 1.5L3 5l.5 2L1 9.5M6.5 1.5L11 3.5 9.5 7l2 .5M6.5 1.5L9.5 7M1 9.5l2.5-2.5M1 9.5l4.5-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
let PhzFilterDrawer = class PhzFilterDrawer extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this.width = 520;
        this.minWidth = 320;
        this.maxWidth = 0; // 0 = 90vw
        this.showBackdrop = true;
        this.resizable = true;
        this.drawerTitle = 'Filters';
        /** Whether the pin button is shown */
        this.pinnable = false;
        /** Whether the drawer is currently pinned as a sidebar */
        this.pinned = false;
        this._resizing = false;
        this._transitionDone = false;
        this._keydownHandler = (e) => {
            // Escape closes the drawer only when not pinned
            if (e.key === 'Escape' && this.open && !this.pinned) {
                this._close();
            }
        };
        this._startX = 0;
        this._startWidth = 0;
        this._onResizeMove = (e) => {
            const delta = this._startX - e.clientX; // dragging left = wider
            const max = this.maxWidth > 0 ? this.maxWidth : window.innerWidth * 0.9;
            const clamped = Math.min(max, Math.max(this.minWidth, this._startWidth + delta));
            this.width = Math.round(clamped);
        };
        this._onResizeEnd = (e) => {
            this._cleanupResize();
            this._resizing = false;
            this.dispatchEvent(new CustomEvent('drawer-resize', {
                bubbles: true, composed: true,
                detail: { width: this.width },
            }));
        };
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: contents; }

    @media (max-width: 576px) {
      .phz-sc-drawer-panel {
        width: 100% !important;
        max-width: 100vw;
        border-left: none;
      }
      .phz-sc-drawer-resize {
        display: none;
      }
    }
  `]; }
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this._keydownHandler);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._keydownHandler);
        this._cleanupResize();
    }
    updated(changed) {
        if (changed.has('open') && this.open) {
            this._transitionDone = false;
            requestAnimationFrame(() => {
                const focusable = this._panel?.querySelector('button, [tabindex], input, select');
                focusable?.focus();
            });
        }
    }
    _onTransitionEnd(e) {
        if (e.propertyName === 'transform') {
            this._transitionDone = true;
        }
    }
    _close() {
        this.dispatchEvent(new CustomEvent('drawer-close', {
            bubbles: true, composed: true,
        }));
    }
    _togglePin() {
        this.dispatchEvent(new CustomEvent('drawer-pin-toggle', {
            detail: { pinned: !this.pinned },
            bubbles: true, composed: true,
        }));
    }
    _onBackdropClick() {
        if (!this._resizing)
            this._close();
    }
    /* ── Resize logic ─────────────────────────────── */
    _onResizeStart(e) {
        e.preventDefault();
        this._resizing = true;
        this._startX = e.clientX;
        this._startWidth = this.width;
        e.target.setPointerCapture(e.pointerId);
        document.addEventListener('pointermove', this._onResizeMove);
        document.addEventListener('pointerup', this._onResizeEnd);
    }
    _cleanupResize() {
        document.removeEventListener('pointermove', this._onResizeMove);
        document.removeEventListener('pointerup', this._onResizeEnd);
    }
    render() {
        if (!this.open)
            return nothing;
        const isPinned = this.pinned;
        const panelCls = [
            'phz-sc-drawer-panel',
            'phz-sc-drawer-panel--open',
            this._resizing ? 'phz-sc-drawer-panel--resizing' : '',
            isPinned ? 'phz-sc-drawer-panel--pinned' : '',
            this._transitionDone || isPinned ? 'phz-sc-drawer-panel--no-transform' : '',
        ].filter(Boolean).join(' ');
        return html `
      ${!isPinned && this.showBackdrop ? html `
        <div
          class="phz-sc-drawer-backdrop phz-sc-drawer-backdrop--visible"
          @click=${this._onBackdropClick}
        ></div>
      ` : nothing}
      <div
        class=${panelCls}
        style="width: ${this.width}px"
        role=${isPinned ? 'complementary' : 'dialog'}
        aria-label=${this.drawerTitle}
        aria-modal=${isPinned ? 'false' : 'true'}
        @transitionend=${this._onTransitionEnd}
      >
        ${this.resizable ? html `
          <div
            class="phz-sc-drawer-resize${this._resizing ? ' phz-sc-drawer-resize--active' : ''}"
            @pointerdown=${this._onResizeStart}
            aria-hidden="true"
          ></div>
        ` : nothing}
        <div class="phz-sc-drawer-header">
          <span class="phz-sc-drawer-title">${this.drawerTitle}</span>
          <div class="phz-sc-drawer-header-actions">
            ${this.pinnable ? html `
              <button
                class="phz-sc-drawer-pin ${isPinned ? 'phz-sc-drawer-pin--active' : ''}"
                @click=${this._togglePin}
                aria-label=${isPinned ? 'Unpin filters panel' : 'Pin filters panel'}
                title=${isPinned ? 'Unpin sidebar' : 'Pin as sidebar'}
              >
                ${isPinned ? iconPinned : iconUnpinned}
              </button>
            ` : nothing}
            ${!isPinned ? html `
              <button class="phz-sc-drawer-close" @click=${this._close} aria-label="Close filters">
                ${iconX}
              </button>
            ` : nothing}
          </div>
        </div>
        <div class="phz-sc-drawer-body">
          <slot></slot>
        </div>
        <div class="phz-sc-drawer-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzFilterDrawer.prototype, "open", void 0);
__decorate([
    property({ type: Number })
], PhzFilterDrawer.prototype, "width", void 0);
__decorate([
    property({ type: Number })
], PhzFilterDrawer.prototype, "minWidth", void 0);
__decorate([
    property({ type: Number })
], PhzFilterDrawer.prototype, "maxWidth", void 0);
__decorate([
    property({ type: Boolean })
], PhzFilterDrawer.prototype, "showBackdrop", void 0);
__decorate([
    property({ type: Boolean })
], PhzFilterDrawer.prototype, "resizable", void 0);
__decorate([
    property({ type: String })
], PhzFilterDrawer.prototype, "drawerTitle", void 0);
__decorate([
    property({ type: Boolean })
], PhzFilterDrawer.prototype, "pinnable", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], PhzFilterDrawer.prototype, "pinned", void 0);
__decorate([
    state()
], PhzFilterDrawer.prototype, "_resizing", void 0);
__decorate([
    state()
], PhzFilterDrawer.prototype, "_transitionDone", void 0);
__decorate([
    query('.phz-sc-drawer-panel')
], PhzFilterDrawer.prototype, "_panel", void 0);
PhzFilterDrawer = __decorate([
    customElement('phz-filter-drawer')
], PhzFilterDrawer);
export { PhzFilterDrawer };
//# sourceMappingURL=phz-filter-drawer.js.map