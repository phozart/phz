/**
 * @phozart/phz-workspace — PlacementManager
 *
 * Lit Web Component for CRUD on PlacementRecords.
 * Uses WorkspaceAdapter placement methods (savePlacement, loadPlacements, deletePlacement).
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { PlacementRecord, CreatePlacementInput } from '../placement.js';
import { createPlacement } from '../placement.js';
import type { ArtifactType } from '../types.js';
import { filterPlacementsByArtifact, sortPlacementsByDate } from './placement-utils.js';

@safeCustomElement('phz-placement-manager')
export class PhzPlacementManager extends LitElement {
  static readonly TAG = 'phz-placement-manager';

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1C1917;
    }

    .pm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E7E5E4;
      margin-bottom: 12px;
    }

    .pm-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #44403C;
      margin: 0;
    }

    .pm-add-btn {
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #E7E5E4;
      border-radius: 6px;
      background: #FFFFFF;
      color: #1C1917;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .pm-add-btn:hover { background: #F5F5F4; border-color: #D6D3D1; }
    .pm-add-btn:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }

    .pm-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pm-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border: 1px solid #E7E5E4;
      border-radius: 8px;
      background: #FAFAF9;
      font-size: 13px;
    }

    .pm-item__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .pm-item__type {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #78716C;
      letter-spacing: 0.04em;
    }

    .pm-item__target {
      color: #44403C;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pm-delete-btn {
      padding: 4px 10px;
      font-size: 12px;
      border: 1px solid #FECACA;
      border-radius: 4px;
      background: #FEF2F2;
      color: #DC2626;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .pm-delete-btn:hover { background: #FEE2E2; }
    .pm-delete-btn:focus-visible { outline: 2px solid #DC2626; outline-offset: 2px; }

    .pm-empty {
      padding: 24px 16px;
      text-align: center;
      color: #A8A29E;
      font-size: 13px;
    }

    .pm-loading {
      padding: 24px 16px;
      text-align: center;
      color: #78716C;
      font-size: 13px;
    }
  `;

  @property({ attribute: false }) adapter?: WorkspaceAdapter;
  @property({ type: String }) artifactId?: string;

  @state() private placements: PlacementRecord[] = [];
  @state() private loading = false;

  async connectedCallback() {
    super.connectedCallback();
    await this.refresh();
  }

  async refresh() {
    if (!this.adapter) return;
    this.loading = true;
    try {
      const all = await this.adapter.loadPlacements(
        this.artifactId ? { artifactId: this.artifactId } : undefined,
      );
      this.placements = sortPlacementsByDate(all);
    } finally {
      this.loading = false;
    }
  }

  private get filteredPlacements(): PlacementRecord[] {
    return filterPlacementsByArtifact(this.placements, this.artifactId);
  }

  private async handleAdd() {
    if (!this.adapter) return;
    const input: CreatePlacementInput = {
      artifactType: 'report' as ArtifactType,
      artifactId: this.artifactId ?? '',
      target: 'main',
    };
    const placement = createPlacement(input);
    await this.adapter.savePlacement(placement);
    this.dispatchEvent(new CustomEvent('placement-created', {
      bubbles: true,
      composed: true,
      detail: { placement },
    }));
    await this.refresh();
  }

  private async handleDelete(placement: PlacementRecord) {
    if (!this.adapter) return;
    await this.adapter.deletePlacement(placement.id);
    this.dispatchEvent(new CustomEvent('placement-deleted', {
      bubbles: true,
      composed: true,
      detail: { placementId: placement.id },
    }));
    await this.refresh();
  }

  render() {
    if (this.loading) {
      return html`<div class="pm-loading">Loading placements...</div>`;
    }

    const items = this.filteredPlacements;

    return html`
      <div class="pm-header">
        <h3 class="pm-title">Placements</h3>
        <button class="pm-add-btn" @click=${this.handleAdd}>Add Placement</button>
      </div>
      ${items.length === 0
        ? html`<div class="pm-empty">No placements</div>`
        : html`
          <ul class="pm-list" role="list">
            ${items.map(p => html`
              <li class="pm-item" role="listitem">
                <div class="pm-item__info">
                  <span class="pm-item__type">${p.artifactType}</span>
                  <span class="pm-item__target">${p.target} — ${p.artifactId}</span>
                </div>
                <button class="pm-delete-btn"
                        @click=${() => this.handleDelete(p)}
                        aria-label="Delete placement">Delete</button>
              </li>
            `)}
          </ul>
        `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-placement-manager': PhzPlacementManager;
  }
}
