/**
 * @phozart/widgets — View Manager
 *
 * User saved view CRUD: save, load, rename, delete, set as default.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { UserViewConfig } from '@phozart/engine';

@customElement('phz-view-manager')
export class PhzViewManager extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }

      .view-manager {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .view-select {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 13px;
        background: white;
        color: #1C1917;
        min-width: 160px;
      }

      .view-btn {
        padding: 6px 12px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        background: white;
        color: #44403C;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .view-btn:hover { background: #FAFAF9; }
      .view-btn--primary { background: #3B82F6; color: white; border-color: #3B82F6; }
      .view-btn--primary:hover { background: #2563EB; }
      .view-btn--danger { color: #DC2626; }
      .view-btn--danger:hover { background: #FEF2F2; }

      .view-default-badge {
        font-size: 10px;
        background: #F0FDF4;
        color: #16A34A;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 600;
      }
    `,
  ];

  @property({ type: Array }) views: UserViewConfig[] = [];
  @property({ type: String }) activeViewId?: string;
  @property({ type: String }) sourceType: string = '';
  @property({ type: String }) sourceId: string = '';

  @state() private isRenaming: boolean = false;
  @state() private renameValue: string = '';

  private handleViewChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.dispatchEvent(new CustomEvent('view-load', {
      bubbles: true, composed: true,
      detail: { viewId: select.value },
    }));
  }

  private handleSave() {
    this.dispatchEvent(new CustomEvent('view-save', {
      bubbles: true, composed: true,
      detail: { sourceType: this.sourceType, sourceId: this.sourceId },
    }));
  }

  private handleDelete() {
    if (!this.activeViewId) return;
    this.dispatchEvent(new CustomEvent('view-delete', {
      bubbles: true, composed: true,
      detail: { viewId: this.activeViewId },
    }));
  }

  private handleSetDefault() {
    if (!this.activeViewId) return;
    this.dispatchEvent(new CustomEvent('view-set-default', {
      bubbles: true, composed: true,
      detail: { viewId: this.activeViewId },
    }));
  }

  render() {
    return html`
      <div class="view-manager" role="toolbar" aria-label="View Manager">
        <select class="view-select"
                .value=${this.activeViewId ?? ''}
                @change=${this.handleViewChange}
                aria-label="Select view">
          <option value="">Default View</option>
          ${this.views.map(v => html`
            <option value=${v.id}>
              ${v.name ?? `View ${v.id}`}
              ${v.isDefault ? ' (Default)' : ''}
            </option>
          `)}
        </select>

        <button class="view-btn view-btn--primary" @click=${this.handleSave}
                aria-label="Save current view">
          Save
        </button>

        ${this.activeViewId ? html`
          <button class="view-btn" @click=${this.handleSetDefault}
                  aria-label="Set as default view">
            Set Default
          </button>
          <button class="view-btn view-btn--danger" @click=${this.handleDelete}
                  aria-label="Delete view">
            Delete
          </button>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-view-manager': PhzViewManager;
  }
}
