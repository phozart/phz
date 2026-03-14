var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/viewer — <phz-viewer-explorer> Custom Element
 *
 * Explorer screen for self-service data exploration.
 * Delegates to @phozart/engine/explorer for the core logic.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createExplorerScreenState, setDataSources, selectDataSource, setFields, setExplorer, setPreviewMode, setFieldSearch, getFilteredFields, } from '../screens/explorer-state.js';
// ========================================================================
// <phz-viewer-explorer>
// ========================================================================
let PhzViewerExplorer = class PhzViewerExplorer extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.dataSources = [];
        // --- Internal state ---
        this._explorerState = createExplorerScreenState();
    }
    static { this.styles = css `
    :host {
      display: block;
      padding: 16px;
      height: 100%;
    }

    .explorer-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 16px;
      height: 100%;
    }

    @media (max-width: 768px) {
      .explorer-layout {
        grid-template-columns: 1fr;
      }
    }

    .explorer-sidebar {
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 8px;
      padding: 12px;
      overflow-y: auto;
    }

    .explorer-sidebar h3 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 8px;
    }

    .source-select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .field-search {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 8px;
      box-sizing: border-box;
    }

    .field-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .field-item {
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .field-item:hover {
      background: var(--phz-bg-hover, #f1f5f9);
    }

    .field-type {
      font-size: 11px;
      color: var(--phz-text-secondary, #64748b);
      text-transform: uppercase;
    }

    .explorer-main {
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .preview-mode-tabs {
      display: flex;
      gap: 4px;
    }

    .preview-mode-tab {
      padding: 4px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
    }

    .preview-mode-tab[data-active] {
      background: var(--phz-bg-active, #e2e8f0);
      font-weight: 600;
    }

    .preview-area {
      flex: 1;
      min-height: 200px;
    }

    .explorer-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--phz-text-secondary, #64748b);
      font-size: 14px;
    }
  `; }
    // --- Lifecycle ---
    willUpdate(changed) {
        if (changed.has('dataSources')) {
            this._explorerState = setDataSources(this._explorerState, this.dataSources);
        }
        if (changed.has('explorer') && this.explorer) {
            this._explorerState = setExplorer(this._explorerState, this.explorer);
        }
    }
    // --- Public API ---
    getExplorerState() {
        return this._explorerState;
    }
    selectSource(sourceId) {
        this._explorerState = selectDataSource(this._explorerState, sourceId);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('explorer-source-select', {
            bubbles: true, composed: true,
            detail: { sourceId },
        }));
    }
    setSourceFields(fields) {
        this._explorerState = setFields(this._explorerState, fields);
        this.requestUpdate();
    }
    // --- Rendering ---
    render() {
        const s = this._explorerState;
        const fields = getFilteredFields(s);
        return html `
      <div class="explorer-layout">
        <aside class="explorer-sidebar">
          <h3>Data Sources</h3>
          <select
            class="source-select"
            @change=${this._handleSourceSelect}
            aria-label="Select data source"
          >
            <option value="">Select a source...</option>
            ${s.dataSources.map(ds => html `
                <option value=${ds.id} ?selected=${s.selectedSourceId === ds.id}>
                  ${ds.name} (${ds.fieldCount} fields)
                </option>
              `)}
          </select>

          ${s.selectedSourceId ? html `
            <h3>Fields</h3>
            <input
              class="field-search"
              type="search"
              placeholder="Search fields..."
              .value=${s.fieldSearchQuery}
              @input=${this._handleFieldSearch}
              aria-label="Search fields"
            />
            <ul class="field-list" role="list">
              ${fields.map(f => html `
                  <li
                    class="field-item"
                    role="listitem"
                    @click=${() => this._handleFieldClick(f)}
                    tabindex="0"
                    @keydown=${(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._handleFieldClick(f);
            }
        }}
                  >
                    <span>${f.name}</span>
                    <span class="field-type">${f.dataType}</span>
                  </li>
                `)}
            </ul>
          ` : nothing}
        </aside>

        <div class="explorer-main">
          <div class="preview-mode-tabs">
            ${['table', 'chart', 'pivot'].map(mode => html `
                <button
                  class="preview-mode-tab"
                  ?data-active=${s.previewMode === mode}
                  @click=${() => this._handlePreviewMode(mode)}
                >${mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
              `)}
          </div>

          <div class="preview-area">
            ${s.selectedSourceId
            ? html `<slot name="preview"></slot>`
            : html `<div class="explorer-empty">Select a data source and drag fields to explore.</div>`}
          </div>
        </div>
      </div>
    `;
    }
    // --- Event handlers ---
    _handleSourceSelect(e) {
        const value = e.target.value;
        if (value) {
            this.selectSource(value);
        }
    }
    _handleFieldSearch(e) {
        const value = e.target.value;
        this._explorerState = setFieldSearch(this._explorerState, value);
        this.requestUpdate();
    }
    _handleFieldClick(field) {
        // Delegate to the DataExplorer for auto-placement
        if (this._explorerState.explorer) {
            this._explorerState.explorer.autoPlaceField(field);
        }
        this.dispatchEvent(new CustomEvent('explorer-field-add', {
            bubbles: true, composed: true,
            detail: { field: field.name, dataType: field.dataType },
        }));
    }
    _handlePreviewMode(mode) {
        this._explorerState = setPreviewMode(this._explorerState, mode);
        this.requestUpdate();
    }
};
__decorate([
    property({ attribute: false })
], PhzViewerExplorer.prototype, "dataSources", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerExplorer.prototype, "explorer", void 0);
__decorate([
    state()
], PhzViewerExplorer.prototype, "_explorerState", void 0);
PhzViewerExplorer = __decorate([
    customElement('phz-viewer-explorer')
], PhzViewerExplorer);
export { PhzViewerExplorer };
//# sourceMappingURL=phz-viewer-explorer.js.map