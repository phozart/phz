/**
 * <phz-grid-view> — Standalone grid rendering surface.
 * Use without the viewer shell for embedding grids directly.
 *
 * Accepts either direct data/columns or a grid definition blueprint.
 * When a DataAdapter is provided alongside a definition, fetches data
 * automatically via the adapter's execute() method.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
// ========================================================================
// Helpers
// ========================================================================
/**
 * Convert a serializable column spec to a core ColumnDefinition.
 * ColumnDefinition can carry renderers, validators, etc., but the
 * spec only contains JSON-safe properties.
 */
export function specToColumn(spec) {
    return {
        field: spec.field,
        header: spec.header,
        type: spec.type,
        width: spec.width,
        minWidth: spec.minWidth,
        maxWidth: spec.maxWidth,
        sortable: spec.sortable,
        filterable: spec.filterable,
        editable: spec.editable,
        resizable: spec.resizable,
        frozen: spec.frozen,
        priority: spec.priority,
    };
}
// ========================================================================
// <phz-grid-view>
// ========================================================================
let PhzGridView = class PhzGridView extends LitElement {
    constructor() {
        super(...arguments);
        /** Grid density mode. */
        this.density = 'comfortable';
        /** Grid theme. */
        this.theme = 'light';
        this._loading = false;
        this._error = null;
        this._resolvedData = [];
        this._resolvedColumns = [];
    }
    static { this.styles = css `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host([hidden]) { display: none; }
    .grid-view-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .grid-view-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--phz-text-secondary, #6b7280);
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }
    .grid-view-error {
      padding: 16px;
      color: var(--phz-error-text, #dc2626);
      background: var(--phz-error-bg, #fef2f2);
      border-radius: 8px;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
        this._resolveData();
    }
    updated(changed) {
        if (changed.has('data') || changed.has('columns') || changed.has('definition') || changed.has('dataAdapter')) {
            this._resolveData();
        }
    }
    async _resolveData() {
        // Direct data takes precedence
        if (this.data) {
            this._resolvedData = this.data;
            this._resolvedColumns = this.columns ?? (this.definition?.columns ?? []).map(specToColumn);
            this._loading = false;
            this._error = null;
            return;
        }
        // If we have a definition with local data source
        if (this.definition?.dataSource.type === 'local') {
            this._resolvedData = this.definition.dataSource.data;
            this._resolvedColumns = this.columns ?? this.definition.columns.map(specToColumn);
            this._loading = false;
            this._error = null;
            return;
        }
        // If we have a data adapter and definition, fetch data
        if (this.dataAdapter && this.definition) {
            this._loading = true;
            this._error = null;
            try {
                const sourceId = this.definition.dataSource.type === 'data-product'
                    ? this.definition.dataSource.dataProductId
                    : 'default';
                const result = await this.dataAdapter.execute({
                    source: sourceId,
                    fields: this.definition.columns.map(c => c.field),
                }, { viewerContext: this.viewerContext });
                this._resolvedData = result.rows;
                this._resolvedColumns = this.columns ?? this.definition.columns.map(specToColumn);
                this._loading = false;
            }
            catch (err) {
                this._error = err instanceof Error ? err.message : String(err);
                this._loading = false;
            }
            return;
        }
        // Fallback: use whatever columns are available
        this._resolvedColumns = this.columns ?? (this.definition?.columns ?? []).map(specToColumn);
        this._resolvedData = [];
    }
    render() {
        if (this._error) {
            return html `<div class="grid-view-error">${this._error}</div>`;
        }
        if (this._loading) {
            return html `<div class="grid-view-loading">Loading data...</div>`;
        }
        return html `
      <div class="grid-view-container">
        <phz-grid
          .data=${this._resolvedData}
          .columns=${this._resolvedColumns}
          density=${this.density}
          theme=${this.theme}
        ></phz-grid>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzGridView.prototype, "dataAdapter", void 0);
__decorate([
    property({ attribute: false })
], PhzGridView.prototype, "definition", void 0);
__decorate([
    property({ attribute: false })
], PhzGridView.prototype, "data", void 0);
__decorate([
    property({ attribute: false })
], PhzGridView.prototype, "columns", void 0);
__decorate([
    property({ attribute: false })
], PhzGridView.prototype, "viewerContext", void 0);
__decorate([
    property({ type: String })
], PhzGridView.prototype, "density", void 0);
__decorate([
    property({ type: String })
], PhzGridView.prototype, "theme", void 0);
__decorate([
    state()
], PhzGridView.prototype, "_loading", void 0);
__decorate([
    state()
], PhzGridView.prototype, "_error", void 0);
__decorate([
    state()
], PhzGridView.prototype, "_resolvedData", void 0);
__decorate([
    state()
], PhzGridView.prototype, "_resolvedColumns", void 0);
PhzGridView = __decorate([
    customElement('phz-grid-view')
], PhzGridView);
export { PhzGridView };
//# sourceMappingURL=phz-grid-view.js.map