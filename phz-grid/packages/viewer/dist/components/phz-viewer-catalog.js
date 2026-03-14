var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/viewer — <phz-viewer-catalog> Custom Element
 *
 * Catalog screen showing browsable artifacts (dashboards, reports, grids).
 * Delegates logic to the headless catalog-state functions.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createCatalogState, setSearchQuery, setTypeFilter, setCatalogPage, setCatalogArtifacts, toggleViewMode, getCurrentPage, getTotalPages, } from '../screens/catalog-state.js';
// ========================================================================
// <phz-viewer-catalog>
// ========================================================================
let PhzViewerCatalog = class PhzViewerCatalog extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.artifacts = [];
        this.pageSize = 20;
        // --- Internal state ---
        this._catalogState = createCatalogState();
    }
    static { this.styles = css `
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
  `; }
    // --- Lifecycle ---
    willUpdate(changed) {
        if (changed.has('artifacts')) {
            this._catalogState = setCatalogArtifacts(this._catalogState, this.artifacts);
        }
        if (changed.has('pageSize')) {
            this._catalogState = { ...this._catalogState, pageSize: this.pageSize };
        }
    }
    // --- Public API ---
    getCatalogState() {
        return this._catalogState;
    }
    // --- Rendering ---
    render() {
        const s = this._catalogState;
        const page = getCurrentPage(s);
        const totalPages = getTotalPages(s);
        return html `
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
            ? html `<div class="catalog-empty" role="status">
            <p>${s.searchQuery || s.typeFilter ? 'No matching artifacts found.' : 'No artifacts available.'}</p>
          </div>`
            : s.viewMode === 'grid'
                ? html `<div class="catalog-grid" role="list">
              ${page.map(a => this._renderCard(a))}
            </div>`
                : html `<div class="catalog-list" role="list">
              ${page.map(a => this._renderCard(a))}
            </div>`}

      ${totalPages > 1 ? html `
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
    _renderCard(artifact) {
        return html `
      <div
        class="catalog-card"
        role="listitem"
        tabindex="0"
        @click=${() => this._handleSelect(artifact)}
        @keydown=${(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._handleSelect(artifact);
            }
        }}
      >
        <div class="catalog-card-type">${artifact.type}</div>
        <div class="catalog-card-title">${artifact.name}</div>
        ${artifact.description
            ? html `<div class="catalog-card-desc">${artifact.description}</div>`
            : nothing}
      </div>
    `;
    }
    // --- Event handlers ---
    _handleSearch(e) {
        const value = e.target.value;
        this._catalogState = setSearchQuery(this._catalogState, value);
        this.requestUpdate();
    }
    _handleTypeFilter(e) {
        const value = e.target.value;
        this._catalogState = setTypeFilter(this._catalogState, value ? value : null);
        this.requestUpdate();
    }
    _handleToggleView() {
        this._catalogState = toggleViewMode(this._catalogState);
        this.requestUpdate();
    }
    _handleSelect(artifact) {
        this.dispatchEvent(new CustomEvent('catalog-select', {
            bubbles: true,
            composed: true,
            detail: {
                artifactId: artifact.id,
                artifactType: artifact.type,
                artifactName: artifact.name,
            },
        }));
    }
    _setPage(page) {
        this._catalogState = setCatalogPage(this._catalogState, page);
        this.requestUpdate();
    }
};
__decorate([
    property({ attribute: false })
], PhzViewerCatalog.prototype, "artifacts", void 0);
__decorate([
    property({ type: Number })
], PhzViewerCatalog.prototype, "pageSize", void 0);
__decorate([
    state()
], PhzViewerCatalog.prototype, "_catalogState", void 0);
PhzViewerCatalog = __decorate([
    customElement('phz-viewer-catalog')
], PhzViewerCatalog);
export { PhzViewerCatalog };
//# sourceMappingURL=phz-viewer-catalog.js.map