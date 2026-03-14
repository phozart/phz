/**
 * @phozart/workspace — Connection Editor Component (Q.5)
 *
 * Lit component for configuring URL and API data source connections.
 * Provides forms for entering connection details with validation.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
let PhzConnectionEditor = class PhzConnectionEditor extends LitElement {
    constructor() {
        super(...arguments);
        this.mode = 'url';
        this._name = '';
        this._url = '';
        this._format = 'csv';
        this._endpoint = '';
        this._method = 'GET';
        this._headers = '';
        this._body = '';
    }
    static { this.TAG = 'phz-connection-editor'; }
    static { this.styles = css `
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1C1917;
    }

    .editor {
      padding: 16px;
    }

    .mode-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #E7E5E4;
    }

    .mode-tab {
      padding: 8px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 14px;
      color: #78716C;
    }

    .mode-tab[aria-selected="true"] {
      color: #1C1917;
      border-bottom-color: #1C1917;
      font-weight: 600;
    }

    .field-group {
      margin-bottom: 12px;
    }

    .field-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #57534E;
      margin-bottom: 4px;
    }

    .field-group input,
    .field-group select,
    .field-group textarea {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #D6D3D1;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      box-sizing: border-box;
    }

    .field-group input:focus,
    .field-group select:focus,
    .field-group textarea:focus {
      outline: none;
      border-color: #1C1917;
      box-shadow: 0 0 0 1px #1C1917;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #D6D3D1;
      border-radius: 4px;
      background: #FFFFFF;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-primary {
      background: #1C1917;
      color: #FFFFFF;
      border-color: #1C1917;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `; }
    _setMode(mode) {
        this.mode = mode;
        this.requestUpdate();
    }
    _handleInput(field, event) {
        const target = event.target;
        switch (field) {
            case 'name':
                this._name = target.value;
                break;
            case 'url':
                this._url = target.value;
                break;
            case 'format':
                this._format = target.value;
                break;
            case 'endpoint':
                this._endpoint = target.value;
                break;
            case 'method':
                this._method = target.value;
                break;
            case 'headers':
                this._headers = target.value;
                break;
            case 'body':
                this._body = target.value;
                break;
        }
    }
    _isValid() {
        if (!this._name.trim())
            return false;
        if (this.mode === 'url')
            return !!this._url.trim();
        return !!this._endpoint.trim();
    }
    _handleConnect() {
        if (!this._isValid())
            return;
        const detail = this.mode === 'url'
            ? {
                type: 'url',
                name: this._name,
                url: this._url,
                format: this._format,
                headers: this._parseHeaders(),
            }
            : {
                type: 'api',
                name: this._name,
                endpoint: this._endpoint,
                method: this._method,
                headers: this._parseHeaders(),
                body: this._body || undefined,
            };
        this.dispatchEvent(new CustomEvent('phz-connect', { detail, bubbles: true, composed: true }));
    }
    _parseHeaders() {
        if (!this._headers.trim())
            return undefined;
        try {
            return JSON.parse(this._headers);
        }
        catch {
            return undefined;
        }
    }
    render() {
        return html `
      <div class="editor">
        <div class="mode-tabs" role="tablist">
          <button
            class="mode-tab"
            role="tab"
            aria-selected="${this.mode === 'url'}"
            @click=${() => this._setMode('url')}
          >URL</button>
          <button
            class="mode-tab"
            role="tab"
            aria-selected="${this.mode === 'api'}"
            @click=${() => this._setMode('api')}
          >API</button>
        </div>

        <div class="field-group">
          <label for="conn-name">Connection Name</label>
          <input
            id="conn-name"
            type="text"
            .value=${this._name}
            @input=${(e) => this._handleInput('name', e)}
            placeholder="My Data Source"
          />
        </div>

        ${this.mode === 'url' ? this._renderURLFields() : this._renderAPIFields()}

        <div class="field-group">
          <label for="conn-headers">Custom Headers (JSON)</label>
          <textarea
            id="conn-headers"
            rows="2"
            .value=${this._headers}
            @input=${(e) => this._handleInput('headers', e)}
            placeholder='{"Authorization": "Bearer ..."}'
          ></textarea>
        </div>

        <div class="actions">
          <button class="btn btn-primary" ?disabled=${!this._isValid()} @click=${this._handleConnect}>
            Connect
          </button>
        </div>
      </div>
    `;
    }
    _renderURLFields() {
        return html `
      <div class="field-group">
        <label for="conn-url">URL</label>
        <input
          id="conn-url"
          type="url"
          .value=${this._url}
          @input=${(e) => this._handleInput('url', e)}
          placeholder="https://example.com/data.csv"
        />
      </div>
      <div class="field-group">
        <label for="conn-format">Format</label>
        <select
          id="conn-format"
          .value=${this._format}
          @change=${(e) => this._handleInput('format', e)}
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="parquet">Parquet</option>
        </select>
      </div>
    `;
    }
    _renderAPIFields() {
        return html `
      <div class="field-group">
        <label for="conn-endpoint">Endpoint URL</label>
        <input
          id="conn-endpoint"
          type="url"
          .value=${this._endpoint}
          @input=${(e) => this._handleInput('endpoint', e)}
          placeholder="https://api.example.com/v1/records"
        />
      </div>
      <div class="field-group">
        <label for="conn-method">HTTP Method</label>
        <select
          id="conn-method"
          .value=${this._method}
          @change=${(e) => this._handleInput('method', e)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>
      ${this._method === 'POST' ? html `
        <div class="field-group">
          <label for="conn-body">Request Body</label>
          <textarea
            id="conn-body"
            rows="3"
            .value=${this._body}
            @input=${(e) => this._handleInput('body', e)}
            placeholder='{"query": "SELECT * FROM data"}'
          ></textarea>
        </div>
      ` : ''}
    `;
    }
};
__decorate([
    property({ type: String })
], PhzConnectionEditor.prototype, "mode", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_name", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_url", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_format", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_endpoint", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_method", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_headers", void 0);
__decorate([
    state()
], PhzConnectionEditor.prototype, "_body", void 0);
PhzConnectionEditor = __decorate([
    safeCustomElement('phz-connection-editor')
], PhzConnectionEditor);
export { PhzConnectionEditor };
//# sourceMappingURL=phz-connection-editor.js.map