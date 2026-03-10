/**
 * @phozart/phz-workspace — CatalogBrowser Component
 *
 * Lists artifacts grouped by type (reports, dashboards, KPIs, grids).
 * Supports search filtering and emits 'artifact-select' on item click.
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
import { groupArtifactsByType, filterArtifactsBySearch } from './catalog-utils.js';
const TYPE_LABELS = {
    'report': 'Reports',
    'dashboard': 'Dashboards',
    'kpi': 'KPIs',
    'metric': 'Metrics',
    'grid-definition': 'Grid Definitions',
    'filter-preset': 'Filter Presets',
    'filter-definition': 'Filter Definitions',
    'filter-rule': 'Filter Rules',
    'alert-rule': 'Alert Rules',
    'subscription': 'Subscriptions',
};
const TYPE_ORDER = [
    'report', 'dashboard', 'kpi', 'metric', 'grid-definition', 'filter-preset',
    'filter-definition', 'filter-rule', 'alert-rule', 'subscription',
];
let PhzCatalogBrowser = class PhzCatalogBrowser extends LitElement {
    constructor() {
        super(...arguments);
        this._artifacts = [];
        this._search = '';
        this._loading = false;
        this._error = null;
        this._mutationListener = null;
    }
    static { this.TAG = 'phz-catalog-browser'; }
    static { this.styles = css `
    :host { display: block; font-family: system-ui, sans-serif; }

    .catalog-search {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px; border: 1px solid #D6D3D1; border-radius: 8px;
      background: white; margin-bottom: 12px;
    }
    .catalog-search:focus-within {
      border-color: #3B82F6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
    }
    .catalog-search input {
      border: none; outline: none; font-size: 13px;
      background: transparent; width: 100%; color: #1C1917;
      font-family: inherit;
    }
    .catalog-search input::placeholder { color: #A8A29E; }

    .section-header {
      font-size: 12px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: #78716C; margin: 16px 0 8px;
    }
    .section-header:first-of-type { margin-top: 0; }

    .artifact-list { display: flex; flex-direction: column; gap: 4px; }

    .artifact-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 6px; cursor: pointer;
      transition: background 0.1s ease;
    }
    .artifact-item:hover { background: #F5F5F4; }
    .artifact-item:focus-visible {
      outline: 2px solid #3B82F6; outline-offset: -2px;
    }

    .artifact-name { flex: 1; font-size: 13px; color: #1C1917; }

    .badge {
      font-size: 10px; padding: 2px 6px; border-radius: 4px;
      font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .badge-type {
      background: #E0E7FF; color: #3730A3;
    }
    .badge-published {
      background: #D1FAE5; color: #065F46;
    }

    .empty { font-size: 13px; color: #A8A29E; padding: 16px 0; text-align: center; }

    /* ── Touch targets ── */
    .artifact-item { min-height: 44px; }
    .catalog-search { min-height: 44px; }
    .catalog-search input { min-height: 36px; }

    /* ── Responsive: single-column list below 576px ── */
    @media (max-width: 576px) {
      .artifact-item {
        flex-wrap: wrap;
        padding: 10px 8px;
        gap: 4px;
      }
      .artifact-name {
        width: 100%;
        font-size: 14px;
      }
      .badge { font-size: 9px; }
      .section-header { font-size: 11px; }
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
        if (this.adapter)
            this._loadArtifacts();
        // Auto-refresh on save events bubbling up from sibling components
        this._mutationListener = () => { this.refresh(); };
        this.ownerDocument.addEventListener('dashboard-save', this._mutationListener);
        this.ownerDocument.addEventListener('report-save', this._mutationListener);
        this.ownerDocument.addEventListener('artifact-delete', this._mutationListener);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._mutationListener) {
            this.ownerDocument.removeEventListener('dashboard-save', this._mutationListener);
            this.ownerDocument.removeEventListener('report-save', this._mutationListener);
            this.ownerDocument.removeEventListener('artifact-delete', this._mutationListener);
            this._mutationListener = null;
        }
    }
    updated(changed) {
        if (changed.has('adapter') && this.adapter) {
            this._loadArtifacts();
        }
    }
    /** Public: force-refresh the artifact list from the adapter. */
    async refresh() {
        await this._loadArtifacts();
    }
    async _loadArtifacts() {
        if (!this.adapter)
            return;
        this._loading = true;
        this._error = null;
        try {
            this._artifacts = await this.adapter.listArtifacts();
        }
        catch (err) {
            this._error = err instanceof Error ? err.message : String(err);
            this.dispatchEvent(new CustomEvent('catalog-error', {
                detail: { error: this._error },
                bubbles: true, composed: true,
            }));
        }
        finally {
            this._loading = false;
        }
    }
    _onSearch(e) {
        this._search = e.target.value;
    }
    _onSelect(artifact) {
        this.dispatchEvent(new CustomEvent('artifact-select', {
            detail: artifact,
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        const filtered = filterArtifactsBySearch(this._artifacts, this._search);
        const grouped = groupArtifactsByType(filtered);
        return html `
      <div class="catalog-search">
        <input
          type="text"
          placeholder="Search artifacts..."
          .value=${this._search}
          @input=${this._onSearch}
          aria-label="Search artifacts"
        />
      </div>

      ${this._loading ? html `<div class="empty">Loading...</div>` : nothing}

      ${!this._loading && filtered.length === 0
            ? html `<div class="empty">No artifacts found</div>`
            : nothing}

      ${TYPE_ORDER.map(type => {
            const items = grouped.get(type);
            if (!items?.length)
                return nothing;
            return html `
          <div class="section-header">${TYPE_LABELS[type]}</div>
          <div class="artifact-list" role="list">
            ${items.map(a => html `
              <div
                class="artifact-item"
                role="listitem"
                tabindex="0"
                @click=${() => this._onSelect(a)}
                @keydown=${(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._onSelect(a);
                }
            }}
              >
                <span class="artifact-name">${a.name}</span>
                <span class="badge badge-type">${type}</span>
                ${a.published ? html `<span class="badge badge-published">Published</span>` : nothing}
              </div>
            `)}
          </div>
        `;
        })}
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzCatalogBrowser.prototype, "adapter", void 0);
__decorate([
    state()
], PhzCatalogBrowser.prototype, "_artifacts", void 0);
__decorate([
    state()
], PhzCatalogBrowser.prototype, "_search", void 0);
__decorate([
    state()
], PhzCatalogBrowser.prototype, "_loading", void 0);
__decorate([
    state()
], PhzCatalogBrowser.prototype, "_error", void 0);
PhzCatalogBrowser = __decorate([
    safeCustomElement('phz-catalog-browser')
], PhzCatalogBrowser);
export { PhzCatalogBrowser };
//# sourceMappingURL=phz-catalog-browser.js.map