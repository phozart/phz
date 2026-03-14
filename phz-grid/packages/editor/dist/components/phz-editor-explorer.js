/**
 * @phozart/editor — <phz-editor-explorer> (B-2.10)
 *
 * Visual query explorer component with save-to-artifact capability.
 * Users drag fields into dimension/measure/filter zones to build
 * ad-hoc queries, preview results, and optionally save as reports
 * or dashboard widgets.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createExplorerState, openSaveDialog, } from '../screens/explorer-state.js';
let PhzEditorExplorer = class PhzEditorExplorer extends LitElement {
    constructor() {
        super(...arguments);
        this.dataSourceId = '';
        this.fields = [];
        this._state = createExplorerState();
    }
    static { this.styles = css `
    :host { display: block; }
    .explorer-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 16px;
      min-height: 400px;
    }
    .field-palette {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 12px;
    }
    .query-area {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .drop-zones {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .drop-zone {
      border: 2px dashed var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 12px;
      min-height: 80px;
    }
    .drop-zone-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--phz-text-secondary, #6b7280);
      margin-bottom: 8px;
    }
    .preview-area {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 12px;
      min-height: 200px;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    button {
      cursor: pointer;
      border: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
    }
  `; }
    willUpdate(changed) {
        if (changed.has('dataSourceId') || changed.has('fields')) {
            this._state = createExplorerState(this.dataSourceId, {
                availableFields: this.fields,
            });
        }
    }
    /** Get the current explorer state. */
    getState() {
        return this._state;
    }
    _onSaveAs(type) {
        this._state = openSaveDialog(this._state, type);
        this.dispatchEvent(new CustomEvent('save-request', {
            detail: { type, query: this._state.query },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html `
      <div class="explorer-layout">
        <div class="field-palette" role="group" aria-label="Available fields">
          <slot name="fields">
            ${this._state.availableFields.map(f => html `
              <div role="option" tabindex="0">${f}</div>
            `)}
          </slot>
        </div>

        <div class="query-area">
          <div class="drop-zones">
            <div class="drop-zone" role="group" aria-label="Dimensions">
              <div class="drop-zone-label">Dimensions</div>
              <slot name="dimensions"></slot>
            </div>
            <div class="drop-zone" role="group" aria-label="Measures">
              <div class="drop-zone-label">Measures</div>
              <slot name="measures"></slot>
            </div>
            <div class="drop-zone" role="group" aria-label="Filters">
              <div class="drop-zone-label">Filters</div>
              <slot name="filters"></slot>
            </div>
          </div>

          <div class="preview-area" role="region" aria-label="Query results">
            ${this._state.executing
            ? html `<div role="status">Executing query...</div>`
            : nothing}
            <slot name="results"></slot>
          </div>

          <div class="toolbar">
            <button @click=${() => this._onSaveAs('report')}>Save as Report</button>
            <button @click=${() => this._onSaveAs('dashboard-widget')}>
              Add to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzEditorExplorer.prototype, "dataSourceId", void 0);
__decorate([
    property({ type: Array })
], PhzEditorExplorer.prototype, "fields", void 0);
__decorate([
    state()
], PhzEditorExplorer.prototype, "_state", void 0);
PhzEditorExplorer = __decorate([
    customElement('phz-editor-explorer')
], PhzEditorExplorer);
export { PhzEditorExplorer };
//# sourceMappingURL=phz-editor-explorer.js.map