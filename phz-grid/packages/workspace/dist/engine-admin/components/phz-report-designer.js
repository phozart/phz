/**
 * @phozart/phz-engine-admin — Report Designer
 *
 * Stepped wizard: data product → columns → filters/sort → aggregation → drill-through → review.
 * Embeddable component.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
const STEP_LABELS = {
    1: 'Data Product', 2: 'Columns', 3: 'Filters & Sort', 4: 'Aggregation', 5: 'Drill-Through', 6: 'Review',
};
let PhzReportDesigner = class PhzReportDesigner extends LitElement {
    constructor() {
        super(...arguments);
        this.currentStep = 1;
        this.selectedDataProduct = '';
        this.availableFields = [];
        this.selectedFields = [];
        this.reportName = '';
        this.aggregateTable = '';
        this.detailTable = '';
        this.joinKey = '';
        this.defaultSortField = '';
        this.defaultSortDir = 'asc';
        this.preFilters = [];
        this.drillTargetReport = '';
        this.drillFilterMappings = [];
        this.drillTrigger = 'click';
        this.drillOpenIn = 'panel';
        this.drillMode = 'filtered';
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      .designer { display: grid; grid-template-columns: 200px 1fr; min-height: 460px; border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }
      .step-nav { padding: 16px; background: #FAFAF9; border-right: 1px solid #E7E5E4; }
      .content { padding: 20px; overflow-y: auto; }
      .col-picker { display: grid; grid-template-columns: 1fr 40px 1fr; gap: 8px; min-height: 200px; }
      .col-pool { border: 1px solid #E7E5E4; border-radius: 6px; padding: 8px; overflow-y: auto; }
      .col-pool-title { font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; margin: 0 0 8px; }
      .col-pool-item { padding: 6px 8px; border-radius: 4px; font-size: 13px; cursor: pointer; }
      .col-pool-item:hover { background: #EFF6FF; }
      .col-arrows { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
      .arrow-btn { width: 32px; height: 32px; border: 1px solid #D6D3D1; border-radius: 6px; cursor: pointer; background: white; font-size: 16px; display: flex; align-items: center; justify-content: center; }
      .arrow-btn:hover { background: #FAFAF9; }
    `,
    ]; }
    goToStep(step) { this.currentStep = step; }
    nextStep() { if (this.currentStep < 6)
        this.goToStep((this.currentStep + 1)); }
    prevStep() { if (this.currentStep > 1)
        this.goToStep((this.currentStep - 1)); }
    selectDataProduct(id) {
        this.selectedDataProduct = id;
        const schema = this.engine?.dataProducts.getSchema(id);
        this.availableFields = schema?.fields.map((f) => f.name) ?? [];
        this.selectedFields = [];
    }
    addField(field) {
        if (!this.selectedFields.includes(field)) {
            this.selectedFields = [...this.selectedFields, field];
        }
    }
    removeField(field) {
        this.selectedFields = this.selectedFields.filter(f => f !== field);
    }
    addPreFilter() {
        this.preFilters = [...this.preFilters, { field: '', operator: 'equals', value: '' }];
    }
    removePreFilter(idx) {
        this.preFilters = this.preFilters.filter((_, i) => i !== idx);
    }
    updatePreFilter(idx, key, value) {
        const updated = [...this.preFilters];
        updated[idx] = { ...updated[idx], [key]: value };
        this.preFilters = updated;
    }
    addDrillMapping() {
        this.drillFilterMappings = [...this.drillFilterMappings, { sourceField: '', targetField: '' }];
    }
    removeDrillMapping(idx) {
        this.drillFilterMappings = this.drillFilterMappings.filter((_, i) => i !== idx);
    }
    updateDrillMapping(idx, key, value) {
        const updated = [...this.drillFilterMappings];
        updated[idx] = { ...updated[idx], [key]: value };
        this.drillFilterMappings = updated;
    }
    handleSave() {
        this.dispatchEvent(new CustomEvent('report-save', {
            bubbles: true, composed: true,
            detail: {
                name: this.reportName,
                dataProductId: this.selectedDataProduct,
                columns: this.selectedFields,
                defaultSort: this.defaultSortField ? { field: this.defaultSortField, direction: this.defaultSortDir } : null,
                preFilters: this.preFilters.filter(f => f.field && f.value),
                aggregateTable: this.aggregateTable,
                detailTable: this.detailTable,
                joinKey: this.joinKey,
                drillThrough: this.drillTargetReport ? {
                    targetReportId: this.drillTargetReport,
                    trigger: this.drillTrigger,
                    openIn: this.drillOpenIn,
                    mode: this.drillMode,
                    fieldMappings: this.drillFilterMappings.filter(m => m.sourceField),
                } : null,
            },
        }));
    }
    renderStepContent() {
        switch (this.currentStep) {
            case 1: return html `
        <h3 style="margin:0 0 16px;">Select Data Product</h3>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Report Name</label>
          <input class="phz-ea-input" .value=${this.reportName} @input=${(e) => { this.reportName = e.target.value; }}>
        </div>
        <ul class="phz-ea-list">
          ${(this.engine?.dataProducts.list() ?? []).map((dp) => html `
            <li class="phz-ea-list-item ${this.selectedDataProduct === dp.id ? 'phz-ea-list-item--active' : ''}"
                @click=${() => this.selectDataProduct(dp.id)}>
              <span>${dp.name}</span>
              <span style="font-size:11px; color:#78716C;">${dp.schema.fields.length} fields</span>
            </li>
          `)}
        </ul>
      `;
            case 2: return html `
        <h3 style="margin:0 0 16px;">Configure Columns</h3>
        <div class="col-picker">
          <div class="col-pool">
            <p class="col-pool-title">Available</p>
            ${this.availableFields.filter(f => !this.selectedFields.includes(f)).map(f => html `
              <div class="col-pool-item" @click=${() => this.addField(f)}>${f}</div>
            `)}
          </div>
          <div class="col-arrows">
            <button class="arrow-btn" title="Add">&rarr;</button>
            <button class="arrow-btn" title="Remove">&larr;</button>
          </div>
          <div class="col-pool">
            <p class="col-pool-title">Selected</p>
            ${this.selectedFields.map(f => html `
              <div class="col-pool-item" @click=${() => this.removeField(f)}>${f}</div>
            `)}
          </div>
        </div>
      `;
            case 3: return html `
        <h3 style="margin:0 0 16px;">Default Filters & Sort</h3>
        <p style="font-size:13px; color:#78716C; margin-bottom:12px;">Configure default filter and sort settings for this report. These can be overridden by users.</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Default Sort</label>
          <div style="display:flex;gap:8px">
            <select class="phz-ea-select" .value=${this.defaultSortField}
              @change=${(e) => { this.defaultSortField = e.target.value; }}>
              <option value="">None</option>
              ${this.selectedFields.map(f => html `<option value=${f}>${f}</option>`)}
            </select>
            <select class="phz-ea-select" style="width:80px" .value=${this.defaultSortDir}
              @change=${(e) => { this.defaultSortDir = e.target.value; }}>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <div style="margin-top:16px">
          <label class="phz-ea-label">Pre-load Filters</label>
          <p style="font-size:11px; color:#A8A29E; margin:0 0 8px;">Filters applied before data loads into the grid.</p>
          ${this.preFilters.map((pf, i) => html `
            <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">
              <select class="phz-ea-select" style="flex:1" .value=${pf.field}
                @change=${(e) => { this.updatePreFilter(i, 'field', e.target.value); }}>
                <option value="">Field...</option>
                ${this.selectedFields.map(f => html `<option value=${f} ?selected=${f === pf.field}>${f}</option>`)}
              </select>
              <select class="phz-ea-select" style="width:100px" .value=${pf.operator}
                @change=${(e) => { this.updatePreFilter(i, 'operator', e.target.value); }}>
                <option value="equals">Equals</option>
                <option value="notEquals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="gt">Greater Than</option>
                <option value="gte">>=</option>
                <option value="lt">Less Than</option>
                <option value="lte"><=</option>
              </select>
              <input class="phz-ea-input" style="flex:1" .value=${pf.value} placeholder="Value"
                @input=${(e) => { this.updatePreFilter(i, 'value', e.target.value); }}>
              <button class="phz-ea-btn" style="padding:4px 8px;font-size:14px" @click=${() => this.removePreFilter(i)}>&times;</button>
            </div>
          `)}
          <button class="phz-ea-btn" style="font-size:11px" @click=${() => this.addPreFilter()}>+ Add Filter</button>
        </div>
      `;
            case 4: return html `
        <h3 style="margin:0 0 16px;">Aggregation & Grouping</h3>
        <p style="font-size:13px; color:#78716C;">Configure aggregation functions and grouping for the report.</p>
      `;
            case 5: return html `
        <h3 style="margin:0 0 16px;">Drill-Through</h3>
        <p style="font-size:13px; color:#78716C; margin-bottom:16px;">Configure cell-click drill-through to open a detail report.</p>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Target Report</label>
          <select class="phz-ea-select" .value=${this.drillTargetReport}
            @change=${(e) => { this.drillTargetReport = e.target.value; }}>
            <option value="">None (no drill-through)</option>
            ${(this.engine?.reports.list() ?? []).map((r) => html `
              <option value=${r.id} ?selected=${r.id === this.drillTargetReport}>${r.name}</option>
            `)}
          </select>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Drill Mode</label>
          <select class="phz-ea-select" .value=${this.drillMode}
            @change=${(e) => { this.drillMode = e.target.value; }}>
            <option value="filtered">Exact Selection — show matching detail rows</option>
            <option value="full">Full Report — show all rows (no filters)</option>
          </select>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Trigger</label>
          <div style="display:flex; gap:12px;">
            <label class="phz-ea-radio">
              <input type="radio" name="drill-trigger" value="click" .checked=${this.drillTrigger === 'click'}
                @change=${() => { this.drillTrigger = 'click'; }}>
              Single Click
            </label>
            <label class="phz-ea-radio">
              <input type="radio" name="drill-trigger" value="dblclick" .checked=${this.drillTrigger === 'dblclick'}
                @change=${() => { this.drillTrigger = 'dblclick'; }}>
              Double Click
            </label>
          </div>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Open In</label>
          <select class="phz-ea-select" .value=${this.drillOpenIn}
            @change=${(e) => { this.drillOpenIn = e.target.value; }}>
            <option value="panel">Side Panel</option>
            <option value="modal">Modal</option>
            <option value="page">Page</option>
          </select>
        </div>

        <details style="margin-top:16px;">
          <summary style="font-size:12px; color:#78716C; cursor:pointer;">Advanced: Field Mappings</summary>
          <div style="padding-top:8px;">
            <p style="font-size:11px; color:#A8A29E; margin:0 0 8px;">Map source fields to target report filter fields (only needed when field names differ).</p>
            ${this.drillFilterMappings.map((m, i) => html `
              <div style="display:flex; gap:6px; margin-bottom:6px; align-items:center;">
                <select class="phz-ea-select" style="flex:1" .value=${m.sourceField}
                  @change=${(e) => { this.updateDrillMapping(i, 'sourceField', e.target.value); }}>
                  <option value="">Source field...</option>
                  ${this.selectedFields.map(f => html `<option value=${f} ?selected=${f === m.sourceField}>${f}</option>`)}
                </select>
                <span style="color:#78716C; font-size:16px;">&rarr;</span>
                <input class="phz-ea-input" style="flex:1" .value=${m.targetField} placeholder="Target field"
                  @input=${(e) => { this.updateDrillMapping(i, 'targetField', e.target.value); }}>
                <button class="phz-ea-btn" style="padding:4px 8px; font-size:14px;" @click=${() => this.removeDrillMapping(i)}>&times;</button>
              </div>
            `)}
            <button class="phz-ea-btn" style="font-size:11px;" @click=${() => this.addDrillMapping()}>+ Add Mapping</button>
          </div>
        </details>

        <details style="margin-top:16px;">
          <summary style="font-size:12px; color:#78716C; cursor:pointer;">Legacy: Aggregate/Detail Table</summary>
          <div style="padding-top:8px;">
            <div class="phz-ea-field"><label class="phz-ea-label">Aggregate Table</label><input class="phz-ea-input" .value=${this.aggregateTable} @input=${(e) => { this.aggregateTable = e.target.value; }}></div>
            <div class="phz-ea-field"><label class="phz-ea-label">Detail Table</label><input class="phz-ea-input" .value=${this.detailTable} @input=${(e) => { this.detailTable = e.target.value; }}></div>
            <div class="phz-ea-field"><label class="phz-ea-label">Join Key</label><input class="phz-ea-input" .value=${this.joinKey} @input=${(e) => { this.joinKey = e.target.value; }}></div>
          </div>
        </details>
      `;
            case 6: return html `
        <h3 style="margin:0 0 16px;">Review & Save</h3>
        <div style="font-size:13px; margin-bottom:16px; line-height:1.8;">
          <p><strong>Name:</strong> ${this.reportName}</p>
          <p><strong>Data Product:</strong> ${this.selectedDataProduct}</p>
          <p><strong>Columns:</strong> ${this.selectedFields.join(', ') || 'None selected'}</p>
          <p><strong>Default Sort:</strong> ${this.defaultSortField ? `${this.defaultSortField} (${this.defaultSortDir})` : 'None'}</p>
          <p><strong>Pre-filters:</strong> ${this.preFilters.filter(f => f.field).length || 'None'}</p>
          <p><strong>Drill-Through:</strong> ${this.drillTargetReport ? `${this.drillTargetReport} (${this.drillMode}, ${this.drillTrigger}, ${this.drillOpenIn})` : 'None'}</p>
        </div>
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleSave}>Save Report</button>
        <button class="phz-ea-btn" style="margin-left:8px;" @click=${() => this.dispatchEvent(new CustomEvent('report-cancel', { bubbles: true, composed: true }))}>Cancel</button>
      `;
        }
    }
    render() {
        return html `
      <div class="designer" role="region" aria-label="Report Designer">
        <div class="step-nav">
          <div class="phz-ea-steps">
            ${[1, 2, 3, 4, 5, 6].map(s => html `
              <button class="phz-ea-step ${this.currentStep === s ? 'phz-ea-step--active' : ''}" @click=${() => this.goToStep(s)}>
                <span class="phz-ea-step-number">${s}</span> ${STEP_LABELS[s]}
              </button>
            `)}
          </div>
        </div>
        <div class="content">
          ${this.renderStepContent()}
          ${this.currentStep < 6 ? html `
            <div class="phz-ea-nav-bar" style="border:none; background:none; padding:16px 0 0;">
              ${this.currentStep > 1 ? html `<button class="phz-ea-btn" @click=${this.prevStep}>Back</button>` : html `<div></div>`}
              <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.nextStep}>Next</button>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzReportDesigner.prototype, "engine", void 0);
__decorate([
    property({ type: String })
], PhzReportDesigner.prototype, "reportId", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "currentStep", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "selectedDataProduct", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "availableFields", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "selectedFields", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "reportName", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "aggregateTable", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "detailTable", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "joinKey", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "defaultSortField", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "defaultSortDir", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "preFilters", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "drillTargetReport", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "drillFilterMappings", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "drillTrigger", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "drillOpenIn", void 0);
__decorate([
    state()
], PhzReportDesigner.prototype, "drillMode", void 0);
PhzReportDesigner = __decorate([
    safeCustomElement('phz-report-designer')
], PhzReportDesigner);
export { PhzReportDesigner };
//# sourceMappingURL=phz-report-designer.js.map