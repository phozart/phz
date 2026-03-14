/**
 * @phozart/widgets — Export Menu Component
 *
 * Dropdown menu for exporting widget data (CSV, clipboard, image).
 * Emits `widget-export` event with format and data.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';

export interface ExportMenuItem {
  id: 'csv' | 'clipboard' | 'image';
  label: string;
  icon: string;
}

export const EXPORT_MENU_ITEMS: ExportMenuItem[] = [
  { id: 'csv', label: 'Export as CSV', icon: 'table' },
  { id: 'clipboard', label: 'Copy to clipboard', icon: 'clipboard' },
  { id: 'image', label: 'Save as image', icon: 'image' },
];

export interface WidgetExportEvent {
  format: 'csv' | 'clipboard' | 'image';
}

@customElement('phz-export-menu')
export class PhzExportMenu extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: inline-block; position: relative; }

      .trigger {
        width: 28px; height: 28px; border: 1px solid #D6D3D1;
        border-radius: 6px; background: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; color: #78716C;
      }
      .trigger:hover { background: #F5F5F4; color: #1C1917; }
      .trigger:focus-visible { outline: 2px solid #3B82F6; outline-offset: 1px; }

      .menu {
        position: absolute; top: 100%; right: 0; margin-top: 4px;
        min-width: 180px; background: white;
        border: 1px solid #E7E5E4; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(28,25,23,0.10);
        z-index: 100; overflow: hidden;
        display: none;
      }
      .menu--open { display: block; }

      .menu-item {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 14px; font-size: 13px; color: #1C1917;
        cursor: pointer; border: none; background: none;
        width: 100%; text-align: left;
        min-height: 44px;
      }
      .menu-item:hover { background: #F5F5F4; }
      .menu-item:focus-visible { background: #EFF6FF; outline: none; }

      .menu-icon { width: 16px; text-align: center; color: #78716C; }
    `,
  ];

  @state() private _open = false;
  @state() private _focusIndex = -1;

  private _onTriggerClick() {
    this._open = !this._open;
    if (this._open) {
      this._focusIndex = 0;
      requestAnimationFrame(() => this._focusCurrentItem());
    }
  }

  private _onTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._onTriggerClick();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._open = true;
      this._focusIndex = 0;
      requestAnimationFrame(() => this._focusCurrentItem());
    }
  }

  private _onMenuKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this._close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._focusIndex = (this._focusIndex + 1) % EXPORT_MENU_ITEMS.length;
      this._focusCurrentItem();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._focusIndex = (this._focusIndex - 1 + EXPORT_MENU_ITEMS.length) % EXPORT_MENU_ITEMS.length;
      this._focusCurrentItem();
    }
  }

  private _focusCurrentItem() {
    const items = this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.menu-item');
    items?.[this._focusIndex]?.focus();
  }

  private _close() {
    this._open = false;
    this._focusIndex = -1;
    this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus();
  }

  private _onItemClick(item: ExportMenuItem) {
    this._close();
    this.dispatchEvent(new CustomEvent<WidgetExportEvent>('widget-export', {
      bubbles: true,
      composed: true,
      detail: { format: item.id },
    }));
  }

  private _onOutsideClick = (e: MouseEvent) => {
    if (!this._open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._close();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onOutsideClick);
  }

  render() {
    return html`
      <button class="trigger"
              aria-haspopup="menu"
              aria-expanded="${this._open}"
              aria-label="Export options"
              @click=${this._onTriggerClick}
              @keydown=${this._onTriggerKeyDown}>
        &#8942;
      </button>
      <div class="menu ${this._open ? 'menu--open' : ''}"
           role="menu"
           aria-label="Export options"
           @keydown=${this._onMenuKeyDown}>
        ${EXPORT_MENU_ITEMS.map(item => html`
          <button class="menu-item"
                  role="menuitem"
                  tabindex="-1"
                  @click=${() => this._onItemClick(item)}>
            <span class="menu-icon">${this._renderIcon(item.icon)}</span>
            ${item.label}
          </button>
        `)}
      </div>
    `;
  }

  private _renderIcon(icon: string): string {
    switch (icon) {
      case 'table': return '\u2637';
      case 'clipboard': return '\u2398';
      case 'image': return '\u2B1C';
      default: return '';
    }
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-export-menu': PhzExportMenu; }
}
