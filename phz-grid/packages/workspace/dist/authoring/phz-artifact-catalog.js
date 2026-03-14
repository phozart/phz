/**
 * @phozart/workspace — Artifact Catalog Component
 *
 * Home screen showing all reports and dashboards with search, tag filtering,
 * sorting, and status badges.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { initialCatalogState, filterArtifacts, extractTags, } from './catalog-state.js';
let PhzArtifactCatalog = class PhzArtifactCatalog extends LitElement {
    constructor() {
        super(...arguments);
        this.artifacts = [];
        this._state = initialCatalogState();
    }
    static { this.styles = css `
    :host {
      display: block;
      padding: 24px;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    .catalog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .catalog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-primary {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary:hover { opacity: 0.9; }

    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 8px 12px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 6px;
      font-size: 14px;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
    }

    .filter-tab {
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
    }

    .filter-tab[aria-selected="true"] {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border-color: var(--phz-primary, #2563eb);
    }

    .sort-select {
      padding: 6px 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      font-size: 13px;
    }

    .artifact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .artifact-card {
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: box-shadow 0.15s;
    }

    .artifact-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .type-badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .type-badge.report {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .type-badge.dashboard {
      background: #fce7f3;
      color: #be185d;
    }

    .status-badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      margin-left: auto;
    }

    .status-badge.published {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.draft {
      background: #f3f4f6;
      color: #6b7280;
    }

    .card-name {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 4px;
    }

    .card-description {
      color: var(--phz-text-secondary, #6b7280);
      font-size: 13px;
      margin-bottom: 8px;
    }

    .card-meta {
      font-size: 12px;
      color: var(--phz-text-tertiary, #9ca3af);
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--phz-text-secondary, #6b7280);
    }

    .empty-state h3 { margin-bottom: 8px; }
    .empty-state p { margin-bottom: 16px; }

    .tag-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .tag-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      border: 1px solid var(--phz-border, #d1d5db);
      background: transparent;
      cursor: pointer;
    }

    .tag-chip.selected {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border-color: var(--phz-primary, #2563eb);
    }
  `; }
    willUpdate(changed) {
        if (changed.has('artifacts')) {
            this._state = { ...this._state, artifacts: this.artifacts };
        }
    }
    _onSearch(e) {
        const value = e.target.value;
        this._state = { ...this._state, search: value };
    }
    _onTypeFilter(type) {
        this._state = { ...this._state, typeFilter: type };
    }
    _onSort(e) {
        const value = e.target.value;
        const [sortBy, sortDir] = value.split('-');
        this._state = { ...this._state, sortBy, sortDir };
    }
    _onToggleTag(tag) {
        const tags = this._state.selectedTags.includes(tag)
            ? this._state.selectedTags.filter(t => t !== tag)
            : [...this._state.selectedTags, tag];
        this._state = { ...this._state, selectedTags: tags };
    }
    _onArtifactClick(artifact) {
        this.dispatchEvent(new CustomEvent('artifact-open', {
            detail: { id: artifact.id, type: artifact.type },
            bubbles: true, composed: true,
        }));
    }
    _onNewReport() {
        this.dispatchEvent(new CustomEvent('create-artifact', {
            detail: { type: 'report' },
            bubbles: true, composed: true,
        }));
    }
    _onNewDashboard() {
        this.dispatchEvent(new CustomEvent('create-artifact', {
            detail: { type: 'dashboard' },
            bubbles: true, composed: true,
        }));
    }
    _formatDate(ts) {
        return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    render() {
        const filtered = filterArtifacts(this._state);
        const tags = extractTags(this._state.artifacts);
        return html `
      <div class="catalog-header">
        <h2>Artifacts</h2>
        <div class="actions">
          <button class="btn-primary" @click=${this._onNewReport}>New Report</button>
          <button class="btn-primary" @click=${this._onNewDashboard}>New Dashboard</button>
        </div>
      </div>

      <div class="toolbar">
        <input
          class="search-input"
          type="text"
          placeholder="Search artifacts..."
          .value=${this._state.search}
          @input=${this._onSearch}
          aria-label="Search artifacts"
        />

        <div class="filter-tabs" role="tablist">
          <button class="filter-tab" role="tab"
            aria-selected=${this._state.typeFilter === undefined ? 'true' : 'false'}
            @click=${() => this._onTypeFilter(undefined)}>All</button>
          <button class="filter-tab" role="tab"
            aria-selected=${this._state.typeFilter === 'report' ? 'true' : 'false'}
            @click=${() => this._onTypeFilter('report')}>Reports</button>
          <button class="filter-tab" role="tab"
            aria-selected=${this._state.typeFilter === 'dashboard' ? 'true' : 'false'}
            @click=${() => this._onTypeFilter('dashboard')}>Dashboards</button>
        </div>

        <select class="sort-select" @change=${this._onSort} aria-label="Sort by">
          <option value="updatedAt-desc">Recently updated</option>
          <option value="updatedAt-asc">Oldest updated</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="createdAt-desc">Newest created</option>
          <option value="createdAt-asc">Oldest created</option>
        </select>
      </div>

      ${tags.length > 0 ? html `
        <div class="tag-chips">
          ${tags.map(tag => html `
            <button
              class="tag-chip ${this._state.selectedTags.includes(tag) ? 'selected' : ''}"
              @click=${() => this._onToggleTag(tag)}
            >${tag}</button>
          `)}
        </div>
      ` : nothing}

      ${filtered.length === 0
            ? html `
          <div class="empty-state">
            <h3>No artifacts found</h3>
            <p>${this._state.search ? 'Try a different search term' : 'Create your first report or dashboard'}</p>
            <button class="btn-primary" @click=${this._onNewReport}>Create Report</button>
          </div>
        `
            : html `
          <div class="artifact-grid">
            ${filtered.map(a => html `
              <div class="artifact-card" @click=${() => this._onArtifactClick(a)}
                   tabindex="0" role="button"
                   @keydown=${(e) => e.key === 'Enter' && this._onArtifactClick(a)}>
                <div class="card-header">
                  <span class="type-badge ${a.type}">${a.type}</span>
                  <span class="status-badge ${a.published ? 'published' : 'draft'}">
                    ${a.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div class="card-name">${a.name}</div>
                ${a.description ? html `<div class="card-description">${a.description}</div>` : nothing}
                <div class="card-meta">Updated ${this._formatDate(a.updatedAt)}</div>
              </div>
            `)}
          </div>
        `}
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzArtifactCatalog.prototype, "artifacts", void 0);
__decorate([
    state()
], PhzArtifactCatalog.prototype, "_state", void 0);
PhzArtifactCatalog = __decorate([
    safeCustomElement('phz-artifact-catalog')
], PhzArtifactCatalog);
export { PhzArtifactCatalog };
//# sourceMappingURL=phz-artifact-catalog.js.map