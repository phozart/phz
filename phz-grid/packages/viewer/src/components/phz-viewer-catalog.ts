/**
 * @phozart/viewer — <phz-viewer-catalog> Custom Element
 *
 * Catalog screen showing browsable artifacts (dashboards, reports, grids).
 * Delegates logic to the headless catalog-state functions.
 */
import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { ArtifactType, VisibilityMeta } from '@phozart/shared/artifacts';
import {
  type CatalogState,
  createCatalogState,
  setSearchQuery,
  setTypeFilter,
  setCatalogSort,
  setCatalogPage,
  setCatalogArtifacts,
  toggleFavorite,
  toggleViewMode,
  getCurrentPage,
  getTotalPages,
  type CatalogSort,
} from '../screens/catalog-state.js';

// ========================================================================
// Custom events
// ========================================================================

export interface CatalogSelectEventDetail {
  artifactId: string;
  artifactType: ArtifactType;
  artifactName: string;
}

// ========================================================================
// <phz-viewer-catalog>
// ========================================================================

@customElement('phz-viewer-catalog')
export class PhzViewerCatalog extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .catalog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .catalog-search {
      flex: 1;
      min-width: 200px;
      padding: 8px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 6px;
      font-size: 14px;
      background: var(--phz-bg-input, #ffffff);
      color: var(--phz-text-primary, #1a1a2e);
    }

    .catalog-type-filter {
      padding: 8px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 6px;
      font-size: 14px;
      background: var(--phz-bg-input, #ffffff);
      color: var(--phz-text-primary, #1a1a2e);
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .catalog-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .catalog-card {
      padding: 16px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 8px;
      cursor: pointer;
      transition: box-shadow 0.15s, border-color 0.15s;
      background: var(--phz-bg-surface, #ffffff);
    }

    .catalog-card:hover {
      border-color: var(--phz-border-hover, #94a3b8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .catalog-card-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .catalog-card-type {
      font-size: 12px;
      color: var(--phz-text-secondary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .catalog-card-desc {
      font-size: 13px;
      color: var(--phz-text-secondary, #64748b);
      margin-top: 8px;
      line-height: 1.4;
    }

    .catalog-empty {
      text-align: center;
      padding: 48px 16px;
      color: var(--phz-text-secondary, #64748b);
    }

    .catalog-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      font-size: 14px;
    }

    .catalog-pagination button {
      padding: 4px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      background: var(--phz-bg-surface, #ffffff);
      cursor: pointer;
    }

    .catalog-pagination button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `;

  // --- Public properties ---

  @property({ attribute: false })
  artifacts: VisibilityMeta[] = [];

  @property({ type: Number })
  pageSize: number = 20;

  // --- Internal state ---

  @state()
  private _catalogState: CatalogState = createCatalogState();

  // --- Lifecycle ---

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('artifacts')) {
      this._catalogState = setCatalogArtifacts(this._catalogState, this.artifacts);
    }
    if (changed.has('pageSize')) {
      this._catalogState = { ...this._catalogState, pageSize: this.pageSize };
    }
  }

  // --- Public API ---

  getCatalogState(): CatalogState {
    return this._catalogState;
  }

  // --- Rendering ---

  override render(): TemplateResult {
    const s = this._catalogState;
    const page = getCurrentPage(s);
    const totalPages = getTotalPages(s);

    return html`
      <div class="catalog-header">
        <input
          class="catalog-search"
          type="search"
          placeholder="Search artifacts..."
          .value=${s.searchQuery}
          @input=${this._handleSearch}
          aria-label="Search artifacts"
        />
        <select
          class="catalog-type-filter"
          @change=${this._handleTypeFilter}
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          <option value="dashboard" ?selected=${s.typeFilter === 'dashboard'}>Dashboards</option>
          <option value="report" ?selected=${s.typeFilter === 'report'}>Reports</option>
          <option value="grid-definition" ?selected=${s.typeFilter === 'grid-definition'}>Grids</option>
          <option value="kpi" ?selected=${s.typeFilter === 'kpi'}>KPIs</option>
        </select>
        <button @click=${this._handleToggleView} aria-label="Toggle view mode">
          ${s.viewMode === 'grid' ? 'List' : 'Grid'}
        </button>
      </div>

      ${page.length === 0
        ? html`<div class="catalog-empty" role="status">
            <p>${s.searchQuery || s.typeFilter ? 'No matching artifacts found.' : 'No artifacts available.'}</p>
          </div>`
        : s.viewMode === 'grid'
          ? html`<div class="catalog-grid" role="list">
              ${page.map(a => this._renderCard(a))}
            </div>`
          : html`<div class="catalog-list" role="list">
              ${page.map(a => this._renderCard(a))}
            </div>`}

      ${totalPages > 1 ? html`
        <div class="catalog-pagination">
          <button
            ?disabled=${s.page === 0}
            @click=${() => this._setPage(s.page - 1)}
            aria-label="Previous page"
          >Prev</button>
          <span>Page ${s.page + 1} of ${totalPages}</span>
          <button
            ?disabled=${s.page >= totalPages - 1}
            @click=${() => this._setPage(s.page + 1)}
            aria-label="Next page"
          >Next</button>
        </div>
      ` : nothing}
    `;
  }

  private _renderCard(artifact: VisibilityMeta): TemplateResult {
    return html`
      <div
        class="catalog-card"
        role="listitem"
        tabindex="0"
        @click=${() => this._handleSelect(artifact)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleSelect(artifact);
          }
        }}
      >
        <div class="catalog-card-type">${artifact.type}</div>
        <div class="catalog-card-title">${artifact.name}</div>
        ${artifact.description
          ? html`<div class="catalog-card-desc">${artifact.description}</div>`
          : nothing}
      </div>
    `;
  }

  // --- Event handlers ---

  private _handleSearch(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this._catalogState = setSearchQuery(this._catalogState, value);
    this.requestUpdate();
  }

  private _handleTypeFilter(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    this._catalogState = setTypeFilter(
      this._catalogState,
      value ? (value as ArtifactType) : null,
    );
    this.requestUpdate();
  }

  private _handleToggleView(): void {
    this._catalogState = toggleViewMode(this._catalogState);
    this.requestUpdate();
  }

  private _handleSelect(artifact: VisibilityMeta): void {
    this.dispatchEvent(
      new CustomEvent<CatalogSelectEventDetail>('catalog-select', {
        bubbles: true,
        composed: true,
        detail: {
          artifactId: artifact.id,
          artifactType: artifact.type,
          artifactName: artifact.name,
        },
      }),
    );
  }

  private _setPage(page: number): void {
    this._catalogState = setCatalogPage(this._catalogState, page);
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-viewer-catalog': PhzViewerCatalog;
  }
}
