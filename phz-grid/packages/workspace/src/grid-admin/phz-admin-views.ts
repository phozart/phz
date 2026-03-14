/**
 * @phozart/grid-admin — <phz-admin-views>
 *
 * Full CRUD management tab for saved views within the grid admin panel.
 * Lists views, allows rename, delete, set default.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import type { ViewsSummary } from '@phozart/core';

@safeCustomElement('phz-admin-views')
export class PhzAdminViews extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
      :host { display: block; }

      .views-list {
        display: flex; flex-direction: column; gap: 8px;
      }

      .view-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px; border: 1px solid #E7E5E4; border-radius: 8px;
        background: #FAFAF9;
      }
      .view-row.active { border-color: #F59E0B; background: #FEF3C7; }

      .view-name { flex: 1; font-size: 14px; font-weight: 500; }

      .view-actions { display: flex; gap: 4px; }

      .action-btn {
        padding: 4px 8px; border: 1px solid #D6D3D1; border-radius: 6px;
        background: white; cursor: pointer; font-size: 12px;
        color: #57534E; transition: all 0.15s ease;
      }
      .action-btn:hover { background: #F5F5F4; color: #1C1917; }
      .action-btn.danger:hover { background: #FEE2E2; color: #DC2626; border-color: #FCA5A5; }

      .default-badge {
        font-size: 11px; font-weight: 600; color: #92400E;
        background: #FEF3C7; padding: 2px 8px; border-radius: 4px;
      }

      .empty-state {
        text-align: center; padding: 32px; color: #78716C;
        font-size: 14px;
      }

      .section-header {
        font-size: 14px; font-weight: 600; color: #1C1917;
        margin-bottom: 16px;
      }
    `,
  ];

  @property({ attribute: false })
  views: ViewsSummary[] = [];

  @state()
  private _renamingId: string | null = null;

  @state()
  private _renameValue: string = '';

  render() {
    return html`
      <div class="section-header">Saved Views</div>
      ${(this.views ?? []).length === 0
        ? html`<div class="empty-state">No saved views. Save a view from the grid toolbar.</div>`
        : html`
          <div class="views-list" role="list" aria-label="Saved views">
            ${(this.views ?? []).map(v => this._renderViewRow(v))}
          </div>
        `}
    `;
  }

  private _renderViewRow(view: ViewsSummary) {
    const isRenaming = this._renamingId === view.id;

    return html`
      <div class="view-row ${view.isActive ? 'active' : ''}" role="listitem">
        ${isRenaming
          ? html`
            <input
              type="text"
              .value=${this._renameValue}
              @input=${(e: Event) => { this._renameValue = (e.target as HTMLInputElement).value; }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this._confirmRename(view.id);
                if (e.key === 'Escape') { this._renamingId = null; }
              }}
              @blur=${() => this._confirmRename(view.id)}
              style="flex: 1; font-size: 14px; padding: 4px 8px; border: 1px solid #D6D3D1; border-radius: 4px;"
            />
          `
          : html`<span class="view-name">${view.name}</span>`}
        ${view.isDefault ? html`<span class="default-badge">Default</span>` : nothing}
        <div class="view-actions">
          ${!isRenaming ? html`
            <button class="action-btn" @click=${() => this._startRename(view)} title="Rename">Rename</button>
            <button class="action-btn" @click=${() => this._setDefault(view)} title="Set as default">
              ${view.isDefault ? 'Unset Default' : 'Set Default'}
            </button>
            <button class="action-btn danger" @click=${() => this._deleteView(view)} title="Delete">Delete</button>
          ` : nothing}
        </div>
      </div>
    `;
  }

  private _startRename(view: ViewsSummary) {
    this._renamingId = view.id;
    this._renameValue = view.name;
  }

  private _confirmRename(id: string) {
    if (this._renameValue.trim()) {
      this.dispatchEvent(
        new CustomEvent('view-rename', {
          detail: { viewId: id, name: this._renameValue.trim() },
          bubbles: true, composed: true,
        }),
      );
    }
    this._renamingId = null;
  }

  private _setDefault(view: ViewsSummary) {
    this.dispatchEvent(
      new CustomEvent('view-set-default', {
        detail: { viewId: view.isDefault ? null : view.id },
        bubbles: true, composed: true,
      }),
    );
  }

  private _deleteView(view: ViewsSummary) {
    this.dispatchEvent(
      new CustomEvent('view-delete', {
        detail: { viewId: view.id },
        bubbles: true, composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-admin-views': PhzAdminViews;
  }
}
