/**
 * @phozart/phz-engine-admin — Pivot Designer
 *
 * Single-page configurator: data product → row/column/value fields → preview.
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
const AGG_OPTIONS = ['sum', 'avg', 'count', 'min', 'max'];
let PhzPivotDesigner = class PhzPivotDesigner extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.selectedDataProduct = '';
        this.availableFields = [];
        this.rowFields = [];
        this.columnFields = [];
        this.valueFields = [];
        this.pivotName = '';
        this.previewResult = null;
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      .pivot-layout { display: flex; flex-direction: column; gap: 16px; }
      .chip-area { display: flex; flex-wrap: wrap; gap: 6px; min-height: 32px; padding: 8px; border: 1px dashed #D6D3D1; border-radius: 6px; }
      .phz-ea-field-chip {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 10px; border-radius: 14px; font-size: 12px;
        cursor: pointer; border: 1px solid #D6D3D1; background: white;
      }
      .phz-ea-field-chip:hover { background: #F5F5F4; }
      .phz-ea-field-chip--active { background: #3B82F6; color: white; border-color: #3B82F6; }
      .phz-ea-field-chip--dimmed { opacity: 0.4; cursor: default; }
      .chip-order { font-size: 9px; font-weight: 700; opacity: 0.7; margin-right: 2px; }
      .chip-remove { margin-left: 4px; font-size: 14px; cursor: pointer; opacity: 0.7; }
      .chip-remove:hover { opacity: 1; }

      .value-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
      .value-row select, .value-row input { font-size: 12px; }

      .preview-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
      .preview-table th, .preview-table td { border: 1px solid #E7E5E4; padding: 4px 8px; text-align: right; }
      .preview-table th { background: #FAFAF9; font-weight: 600; text-align: center; }
      .preview-table td:first-child { text-align: left; font-weight: 500; }
      .preview-note { font-size: 11px; color: #78716C; margin-top: 4px; }
    `,
    ]; }
    selectDataProduct(id) {
        this.selectedDataProduct = id;
        const schema = this.engine?.dataProducts.getSchema(id);
        this.availableFields = schema?.fields.map((f) => f.name) ?? [];
        this.rowFields = [];
        this.columnFields = [];
        this.valueFields = [];
        this.previewResult = null;
    }
    toggleRowField(field) {
        if (this.columnFields.includes(field))
            return;
        if (this.rowFields.includes(field)) {
            this.rowFields = this.rowFields.filter(f => f !== field);
        }
        else {
            this.rowFields = [...this.rowFields, field];
        }
        this.previewResult = null;
    }
    toggleColumnField(field) {
        if (this.rowFields.includes(field))
            return;
        if (this.columnFields.includes(field)) {
            this.columnFields = this.columnFields.filter(f => f !== field);
        }
        else {
            this.columnFields = [...this.columnFields, field];
        }
        this.previewResult = null;
    }
    addValueField() {
        const remaining = this.availableFields.filter(f => !this.valueFields.some(v => v.field === f));
        if (remaining.length === 0)
            return;
        this.valueFields = [...this.valueFields, { field: remaining[0], aggregation: 'sum', label: '' }];
        this.previewResult = null;
    }
    removeValueField(idx) {
        this.valueFields = this.valueFields.filter((_, i) => i !== idx);
        this.previewResult = null;
    }
    updateValueField(idx, key, value) {
        const updated = [...this.valueFields];
        updated[idx] = { ...updated[idx], [key]: value };
        this.valueFields = updated;
        this.previewResult = null;
    }
    buildPivotConfig() {
        return {
            rowFields: this.rowFields,
            columnFields: this.columnFields,
            valueFields: this.valueFields.map(v => ({
                field: v.field,
                aggregation: v.aggregation,
                label: v.label || undefined,
            })),
        };
    }
    runPreview() {
        if (!this.engine || this.valueFields.length === 0)
            return;
        const config = this.buildPivotConfig();
        const sourceData = this.data.length > 0 ? this.data : [];
        if (sourceData.length === 0) {
            this.dispatchEvent(new CustomEvent('pivot-preview', {
                bubbles: true, composed: true,
                detail: { config },
            }));
            return;
        }
        try {
            const result = this.engine.pivot(sourceData, config);
            this.previewResult = result;
        }
        catch {
            this.previewResult = null;
        }
    }
    handleSave() {
        this.dispatchEvent(new CustomEvent('pivot-save', {
            bubbles: true, composed: true,
            detail: {
                name: this.pivotName,
                dataProductId: this.selectedDataProduct,
                config: this.buildPivotConfig(),
            },
        }));
    }
    renderPreviewTable() {
        if (!this.previewResult)
            return nothing;
        const r = this.previewResult;
        if (r.rowHeaders.length === 0)
            return html `<p class="preview-note">No data to preview.</p>`;
        const maxRows = Math.min(r.rowHeaders.length, 5);
        const maxCols = Math.min(r.columnHeaders.length, 5);
        const truncatedRows = r.rowHeaders.length > 5;
        const truncatedCols = r.columnHeaders.length > 5;
        return html `
      <table class="preview-table">
        <thead>
          <tr>
            <th>${this.rowFields.join(' / ')}</th>
            ${r.columnHeaders.slice(0, maxCols).map(ch => html `<th>${ch.join(' / ')}</th>`)}
            ${truncatedCols ? html `<th>...</th>` : nothing}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${r.rowHeaders.slice(0, maxRows).map((rh, ri) => html `
            <tr>
              <td>${rh.join(' / ')}</td>
              ${r.cells[ri].slice(0, maxCols).map(cell => html `<td>${cell ?? '–'}</td>`)}
              ${truncatedCols ? html `<td>...</td>` : nothing}
              <td style="font-weight:600">${r.grandTotals[ri] ?? '–'}</td>
            </tr>
          `)}
          ${truncatedRows ? html `<tr><td colspan=${maxCols + 2} style="text-align:center; color:#78716C;">... ${r.rowHeaders.length - 5} more rows</td></tr>` : nothing}
        </tbody>
      </table>
      <p class="preview-note">${r.rowHeaders.length} rows × ${r.columnHeaders.length} columns</p>
    `;
    }
    render() {
        const usedInRows = new Set(this.rowFields);
        const usedInCols = new Set(this.columnFields);
        return html `
      <div class="pivot-layout" role="region" aria-label="Pivot Designer">
        <!-- Name -->
        <div class="phz-ea-field">
          <label class="phz-ea-label">Pivot Name</label>
          <input class="phz-ea-input" .value=${this.pivotName}
            @input=${(e) => { this.pivotName = e.target.value; }}>
        </div>

        <!-- Data Product -->
        <div class="phz-ea-field">
          <label class="phz-ea-label">Data Product</label>
          <ul class="phz-ea-list" style="max-height:140px; overflow-y:auto; border:1px solid #E7E5E4; border-radius:6px;">
            ${(this.engine?.dataProducts.list() ?? []).map((dp) => html `
              <li class="phz-ea-list-item ${this.selectedDataProduct === dp.id ? 'phz-ea-list-item--active' : ''}"
                  @click=${() => this.selectDataProduct(dp.id)}>
                <span>${dp.name}</span>
                <span style="font-size:11px; color:#78716C;">${dp.schema.fields.length} fields</span>
              </li>
            `)}
          </ul>
        </div>

        ${this.availableFields.length > 0 ? html `
          <!-- Row Fields -->
          <div class="phz-ea-field">
            <label class="phz-ea-label">Row Fields</label>
            <div class="chip-area">
              ${this.availableFields.map(f => {
            const active = usedInRows.has(f);
            const dimmed = usedInCols.has(f);
            return html `
                  <button class="phz-ea-field-chip ${active ? 'phz-ea-field-chip--active' : ''} ${dimmed ? 'phz-ea-field-chip--dimmed' : ''}"
                    @click=${() => this.toggleRowField(f)}>
                    ${active ? html `<span class="chip-order">${this.rowFields.indexOf(f) + 1}</span>` : nothing}
                    ${f}
                    ${active ? html `<span class="chip-remove">&times;</span>` : nothing}
                  </button>
                `;
        })}
            </div>
          </div>

          <!-- Column Fields -->
          <div class="phz-ea-field">
            <label class="phz-ea-label">Column Fields</label>
            <div class="chip-area">
              ${this.availableFields.map(f => {
            const active = usedInCols.has(f);
            const dimmed = usedInRows.has(f);
            return html `
                  <button class="phz-ea-field-chip ${active ? 'phz-ea-field-chip--active' : ''} ${dimmed ? 'phz-ea-field-chip--dimmed' : ''}"
                    @click=${() => this.toggleColumnField(f)}>
                    ${active ? html `<span class="chip-order">${this.columnFields.indexOf(f) + 1}</span>` : nothing}
                    ${f}
                    ${active ? html `<span class="chip-remove">&times;</span>` : nothing}
                  </button>
                `;
        })}
            </div>
          </div>

          <!-- Value Fields -->
          <div class="phz-ea-field">
            <label class="phz-ea-label">Value Fields</label>
            ${this.valueFields.map((v, i) => html `
              <div class="value-row">
                <select class="phz-ea-select" style="flex:2" .value=${v.field}
                  @change=${(e) => this.updateValueField(i, 'field', e.target.value)}>
                  ${this.availableFields.map(f => html `<option value=${f} ?selected=${f === v.field}>${f}</option>`)}
                </select>
                <select class="phz-ea-select" style="flex:1" .value=${v.aggregation}
                  @change=${(e) => this.updateValueField(i, 'aggregation', e.target.value)}>
                  ${AGG_OPTIONS.map(a => html `<option value=${a} ?selected=${a === v.aggregation}>${a}</option>`)}
                </select>
                <input class="phz-ea-input" style="flex:1" .value=${v.label} placeholder="Label (optional)"
                  @input=${(e) => this.updateValueField(i, 'label', e.target.value)}>
                <button class="phz-ea-btn" style="padding:4px 8px; font-size:14px;" @click=${() => this.removeValueField(i)}>&times;</button>
              </div>
            `)}
            <button class="phz-ea-btn" style="font-size:11px;" @click=${() => this.addValueField()}>+ Add Value</button>
          </div>

          <!-- Preview -->
          <div class="phz-ea-field">
            <div style="display:flex; align-items:center; gap:8px;">
              <label class="phz-ea-label" style="margin:0;">Preview</label>
              <button class="phz-ea-btn" style="font-size:11px;" @click=${() => this.runPreview()}
                ?disabled=${this.valueFields.length === 0}>
                Compute Preview
              </button>
            </div>
            ${this.renderPreviewTable()}
          </div>
        ` : nothing}

        <!-- Actions -->
        <div class="phz-ea-btn-group" style="margin-top:8px;">
          <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleSave}
            ?disabled=${!this.pivotName || this.valueFields.length === 0}>
            Save Pivot
          </button>
          <button class="phz-ea-btn" @click=${() => this.dispatchEvent(new CustomEvent('pivot-cancel', { bubbles: true, composed: true }))}>
            Cancel
          </button>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzPivotDesigner.prototype, "engine", void 0);
__decorate([
    property({ attribute: false })
], PhzPivotDesigner.prototype, "data", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "selectedDataProduct", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "availableFields", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "rowFields", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "columnFields", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "valueFields", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "pivotName", void 0);
__decorate([
    state()
], PhzPivotDesigner.prototype, "previewResult", void 0);
PhzPivotDesigner = __decorate([
    safeCustomElement('phz-pivot-designer')
], PhzPivotDesigner);
export { PhzPivotDesigner };
//# sourceMappingURL=phz-pivot-designer.js.map