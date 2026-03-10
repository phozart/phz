/**
 * @phozart/phz-engine-admin — Data Connector
 *
 * "Get Data" wizard for connecting to data sources.
 * Supports JSON, CSV, REST API, and DuckDB table/file sources.
 *
 * Events:
 * - data-connected: { sourceType, config, schema, previewData }
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import { detectSchema, detectDelimiter, parseCSVPreview, validateSourceConfig, } from '../data-source-detector.js';
const SOURCE_TYPES = [
    { type: 'json', label: 'JSON', icon: '{ }', desc: 'Paste JSON data or fetch from URL' },
    { type: 'csv', label: 'CSV', icon: 'CSV', desc: 'Upload or paste delimited text' },
    { type: 'rest', label: 'REST API', icon: 'API', desc: 'Connect to a REST endpoint' },
    { type: 'duckdb', label: 'DuckDB', icon: 'DB', desc: 'Query a DuckDB table or file' },
];
const AUTH_TYPES = ['none', 'bearer', 'basic', 'api_key'];
let PhzDataConnector = class PhzDataConnector extends LitElement {
    constructor() {
        super(...arguments);
        this.step = 1;
        this.sourceType = null;
        // JSON config
        this.jsonData = '';
        this.jsonUrl = '';
        // CSV config
        this.csvData = '';
        this.csvDelimiter = ',';
        this.csvHasHeader = true;
        // REST config
        this.restUrl = '';
        this.restMethod = 'GET';
        this.restHeaders = '';
        this.restAuthType = 'none';
        this.restAuthValue = '';
        // DuckDB config
        this.duckdbTableName = '';
        this.duckdbFilePath = '';
        // Preview
        this.previewData = [];
        this.schema = [];
        this.error = null;
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; }

      .dc-wizard {
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        overflow: hidden;
        min-height: 500px;
        display: flex;
        flex-direction: column;
      }

      .dc-progress {
        display: flex;
        background: #FAFAF9;
        border-bottom: 1px solid #E7E5E4;
        padding: 12px 16px;
        gap: 24px;
      }

      .dc-progress-step {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #A8A29E;
        font-weight: 500;
      }

      .dc-progress-step--active { color: #3B82F6; font-weight: 700; }
      .dc-progress-step--complete { color: #16A34A; }

      .dc-step-dot {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid currentColor;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .dc-progress-step--complete .dc-step-dot {
        background: #16A34A;
        border-color: #16A34A;
        color: white;
      }

      .dc-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }

      .dc-type-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .dc-type-tile {
        padding: 16px;
        border: 2px solid #E7E5E4;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        background: white;
        text-align: left;
      }

      .dc-type-tile:hover { border-color: #3B82F6; background: #EFF6FF; }
      .dc-type-tile--selected { border-color: #3B82F6; background: #EFF6FF; }
      .dc-type-tile:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }

      .dc-type-icon {
        font-size: 16px;
        font-weight: 700;
        color: #3B82F6;
        margin-bottom: 6px;
        font-family: monospace;
      }

      .dc-type-label {
        font-size: 14px;
        font-weight: 600;
        color: #1C1917;
      }

      .dc-type-desc {
        font-size: 12px;
        color: #78716C;
        margin-top: 2px;
      }

      .dc-form { max-width: 600px; }

      .dc-footer {
        display: flex;
        justify-content: space-between;
        padding: 12px 20px;
        border-top: 1px solid #E7E5E4;
        background: #FAFAF9;
      }

      .dc-preview-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        margin-top: 12px;
      }

      .dc-preview-table th {
        text-align: left;
        padding: 6px 10px;
        font-weight: 600;
        color: #44403C;
        border-bottom: 2px solid #E7E5E4;
        font-size: 11px;
        text-transform: uppercase;
      }

      .dc-preview-table td {
        padding: 6px 10px;
        border-bottom: 1px solid #F5F5F4;
        color: #1C1917;
      }

      .dc-schema-list {
        list-style: none;
        padding: 0;
        margin: 12px 0;
      }

      .dc-schema-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        font-size: 13px;
        border-bottom: 1px solid #F5F5F4;
      }

      .dc-schema-type {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        background: #F5F5F4;
        color: #78716C;
        text-transform: uppercase;
      }

      .dc-schema-nullable {
        font-size: 10px;
        color: #A8A29E;
      }

      .dc-error {
        color: #DC2626;
        font-size: 13px;
        margin-top: 8px;
      }

      .dc-section-title {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: #1C1917;
      }
    `,
    ]; }
    selectSourceType(type) {
        this.sourceType = type;
        this.error = null;
        this.step = 2;
    }
    goBack() {
        if (this.step === 2) {
            this.step = 1;
        }
        else if (this.step === 3) {
            this.step = 2;
        }
    }
    handleConnect() {
        this.error = null;
        const config = this.buildConfig();
        const validation = validateSourceConfig(this.sourceType, config);
        if (!validation.valid) {
            this.error = validation.error ?? 'Invalid configuration';
            return;
        }
        try {
            const data = this.parseData();
            if (data.length === 0) {
                this.error = 'No data found. Check your input.';
                return;
            }
            this.previewData = data.slice(0, 10);
            this.schema = detectSchema(this.previewData);
            this.step = 3;
        }
        catch (e) {
            this.error = e instanceof Error ? e.message : 'Failed to parse data';
        }
    }
    buildConfig() {
        switch (this.sourceType) {
            case 'json':
                return { data: this.jsonData || undefined, url: this.jsonUrl || undefined };
            case 'csv':
                return { data: this.csvData || undefined, delimiter: this.csvDelimiter, hasHeader: this.csvHasHeader };
            case 'rest':
                return { url: this.restUrl || undefined, method: this.restMethod, headers: this.restHeaders, authType: this.restAuthType, authValue: this.restAuthValue };
            case 'duckdb':
                return { tableName: this.duckdbTableName || undefined, filePath: this.duckdbFilePath || undefined };
            default:
                return {};
        }
    }
    parseData() {
        switch (this.sourceType) {
            case 'json': {
                const parsed = JSON.parse(this.jsonData);
                return Array.isArray(parsed) ? parsed : [parsed];
            }
            case 'csv': {
                if (!this.csvData.trim())
                    return [];
                if (this.csvDelimiter === 'auto') {
                    this.csvDelimiter = detectDelimiter(this.csvData);
                }
                const result = parseCSVPreview(this.csvData, {
                    delimiter: this.csvDelimiter,
                    hasHeader: this.csvHasHeader,
                    maxRows: 100,
                });
                return result.rows;
            }
            default:
                return [];
        }
    }
    handleFinish() {
        this.dispatchEvent(new CustomEvent('data-connected', {
            bubbles: true,
            composed: true,
            detail: {
                sourceType: this.sourceType,
                config: this.buildConfig(),
                schema: this.schema,
                previewData: this.previewData,
            },
        }));
    }
    renderProgress() {
        const steps = [
            { num: 1, label: 'Source Type' },
            { num: 2, label: 'Configuration' },
            { num: 3, label: 'Preview' },
        ];
        return html `
      <nav class="dc-progress" role="navigation" aria-label="Connection wizard progress">
        ${steps.map(s => {
            const active = s.num === this.step;
            const complete = s.num < this.step;
            return html `
            <div class="dc-progress-step ${active ? 'dc-progress-step--active' : ''} ${complete ? 'dc-progress-step--complete' : ''}"
                 aria-current="${active ? 'step' : 'false'}">
              <span class="dc-step-dot">${complete ? '✓' : s.num}</span>
              ${s.label}
            </div>
          `;
        })}
      </nav>
    `;
    }
    renderStep1() {
        return html `
      <h2 class="dc-section-title">Choose a data source</h2>
      <div class="dc-type-grid" role="listbox" aria-label="Data source types">
        ${SOURCE_TYPES.map(st => html `
          <button class="dc-type-tile ${this.sourceType === st.type ? 'dc-type-tile--selected' : ''}"
                  role="option"
                  aria-selected="${this.sourceType === st.type}"
                  @click=${() => this.selectSourceType(st.type)}>
            <div class="dc-type-icon">${st.icon}</div>
            <div class="dc-type-label">${st.label}</div>
            <div class="dc-type-desc">${st.desc}</div>
          </button>
        `)}
      </div>
    `;
    }
    renderStep2() {
        switch (this.sourceType) {
            case 'json': return this.renderJsonForm();
            case 'csv': return this.renderCsvForm();
            case 'rest': return this.renderRestForm();
            case 'duckdb': return this.renderDuckdbForm();
            default: return nothing;
        }
    }
    renderJsonForm() {
        return html `
      <div class="dc-form">
        <h2 class="dc-section-title">JSON Data</h2>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="json-data">Paste JSON</label>
          <textarea id="json-data" class="phz-ea-textarea" rows="8"
                    placeholder='[{"name": "Alice", "age": 30}]'
                    .value=${this.jsonData}
                    @input=${(e) => { this.jsonData = e.target.value; }}></textarea>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="json-url">Or fetch from URL</label>
          <input id="json-url" class="phz-ea-input" type="url" placeholder="https://api.example.com/data.json"
                 .value=${this.jsonUrl}
                 @input=${(e) => { this.jsonUrl = e.target.value; }}>
        </div>
      </div>
    `;
    }
    renderCsvForm() {
        return html `
      <div class="dc-form">
        <h2 class="dc-section-title">CSV Data</h2>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="csv-data">Paste CSV</label>
          <textarea id="csv-data" class="phz-ea-textarea" rows="8"
                    placeholder="name,age,city${'\n'}Alice,30,NYC"
                    .value=${this.csvData}
                    @input=${(e) => { this.csvData = e.target.value; this.csvDelimiter = detectDelimiter(this.csvData); }}></textarea>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="csv-delimiter">Delimiter</label>
          <select id="csv-delimiter" class="phz-ea-select"
                  .value=${this.csvDelimiter}
                  @change=${(e) => { this.csvDelimiter = e.target.value; }}>
            <option value="," ?selected=${this.csvDelimiter === ','}>Comma (,)</option>
            <option value="${'\t'}" ?selected=${this.csvDelimiter === '\t'}>Tab</option>
            <option value=";" ?selected=${this.csvDelimiter === ';'}>Semicolon (;)</option>
            <option value="|" ?selected=${this.csvDelimiter === '|'}>Pipe (|)</option>
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-radio">
            <input type="checkbox" ?checked=${this.csvHasHeader}
                   @change=${(e) => { this.csvHasHeader = e.target.checked; }}>
            First row is header
          </label>
        </div>
      </div>
    `;
    }
    renderRestForm() {
        return html `
      <div class="dc-form">
        <h2 class="dc-section-title">REST API</h2>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="rest-url">URL</label>
          <input id="rest-url" class="phz-ea-input" type="url" placeholder="https://api.example.com/data"
                 .value=${this.restUrl}
                 @input=${(e) => { this.restUrl = e.target.value; }}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="rest-method">Method</label>
          <select id="rest-method" class="phz-ea-select"
                  .value=${this.restMethod}
                  @change=${(e) => { this.restMethod = e.target.value; }}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="rest-headers">Headers (JSON)</label>
          <textarea id="rest-headers" class="phz-ea-textarea" rows="3"
                    placeholder='{"Content-Type": "application/json"}'
                    .value=${this.restHeaders}
                    @input=${(e) => { this.restHeaders = e.target.value; }}></textarea>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="rest-auth">Authentication</label>
          <select id="rest-auth" class="phz-ea-select"
                  .value=${this.restAuthType}
                  @change=${(e) => { this.restAuthType = e.target.value; }}>
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="api_key">API Key</option>
          </select>
        </div>
        ${this.restAuthType !== 'none' ? html `
          <div class="phz-ea-field">
            <label class="phz-ea-label" for="rest-auth-value">
              ${this.restAuthType === 'bearer' ? 'Token' : this.restAuthType === 'basic' ? 'user:pass' : 'API Key'}
            </label>
            <input id="rest-auth-value" class="phz-ea-input" type="password"
                   .value=${this.restAuthValue}
                   @input=${(e) => { this.restAuthValue = e.target.value; }}>
          </div>
        ` : nothing}
      </div>
    `;
    }
    renderDuckdbForm() {
        return html `
      <div class="dc-form">
        <h2 class="dc-section-title">DuckDB Source</h2>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="duckdb-table">Table Name</label>
          <input id="duckdb-table" class="phz-ea-input" type="text" placeholder="my_table"
                 .value=${this.duckdbTableName}
                 @input=${(e) => { this.duckdbTableName = e.target.value; }}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label" for="duckdb-file">Or file path (.parquet, .csv, .arrow)</label>
          <input id="duckdb-file" class="phz-ea-input" type="text" placeholder="/data/file.parquet"
                 .value=${this.duckdbFilePath}
                 @input=${(e) => { this.duckdbFilePath = e.target.value; }}>
        </div>
      </div>
    `;
    }
    renderStep3() {
        return html `
      <h2 class="dc-section-title">Preview & Schema</h2>

      <h3 style="font-size:13px;font-weight:600;margin:0 0 8px;">Detected Schema</h3>
      <ul class="dc-schema-list" aria-label="Detected fields">
        ${this.schema.map(field => html `
          <li class="dc-schema-item">
            <span class="dc-schema-type">${field.type}</span>
            <span>${field.name}</span>
            ${field.nullable ? html `<span class="dc-schema-nullable">nullable</span>` : nothing}
          </li>
        `)}
      </ul>

      ${this.previewData.length > 0 ? html `
        <h3 style="font-size:13px;font-weight:600;margin:16px 0 8px;">Data Preview (${this.previewData.length} rows)</h3>
        <div style="overflow-x:auto;">
          <table class="dc-preview-table" aria-label="Data preview">
            <thead>
              <tr>${Object.keys(this.previewData[0]).map(k => html `<th>${k}</th>`)}</tr>
            </thead>
            <tbody>
              ${this.previewData.map(row => html `
                <tr>${Object.values(row).map(v => html `<td>${String(v ?? '')}</td>`)}</tr>
              `)}
            </tbody>
          </table>
        </div>
      ` : nothing}
    `;
    }
    render() {
        return html `
      <div class="dc-wizard" role="form" aria-label="Data Source Connection Wizard">
        ${this.renderProgress()}
        <div class="dc-body">
          ${this.step === 1 ? this.renderStep1() : nothing}
          ${this.step === 2 ? this.renderStep2() : nothing}
          ${this.step === 3 ? this.renderStep3() : nothing}
          ${this.error ? html `<div class="dc-error" role="alert">${this.error}</div>` : nothing}
        </div>
        <div class="dc-footer">
          ${this.step > 1 ? html `
            <button class="phz-ea-btn" @click=${this.goBack}>Back</button>
          ` : html `<span></span>`}
          ${this.step === 2 ? html `
            <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleConnect}>Connect & Preview</button>
          ` : nothing}
          ${this.step === 3 ? html `
            <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleFinish}>Use This Data</button>
          ` : nothing}
        </div>
      </div>
    `;
    }
};
__decorate([
    state()
], PhzDataConnector.prototype, "step", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "sourceType", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "jsonData", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "jsonUrl", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "csvData", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "csvDelimiter", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "csvHasHeader", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "restUrl", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "restMethod", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "restHeaders", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "restAuthType", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "restAuthValue", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "duckdbTableName", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "duckdbFilePath", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "previewData", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "schema", void 0);
__decorate([
    state()
], PhzDataConnector.prototype, "error", void 0);
PhzDataConnector = __decorate([
    safeCustomElement('phz-data-connector')
], PhzDataConnector);
export { PhzDataConnector };
//# sourceMappingURL=phz-data-connector.js.map