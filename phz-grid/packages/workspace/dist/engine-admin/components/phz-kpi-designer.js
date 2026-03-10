/**
 * @phozart/phz-engine-admin — KPI Designer
 *
 * 6-step wizard: 3-column layout (step nav | content | live preview).
 * Embeddable component — drop into any admin page.
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
import { kpiId, computeStatus, STATUS_COLORS } from '@phozart/phz-engine';
const STEP_LABELS = {
    1: 'Identity', 2: 'Measurement', 3: 'Thresholds', 4: 'Comparison', 5: 'Visualization', 6: 'Preview',
};
let PhzKPIDesigner = class PhzKPIDesigner extends LitElement {
    constructor() {
        super(...arguments);
        this.currentStep = 1;
        this.draft = {
            name: '', description: '', category: '',
            target: 95, unit: 'percent', direction: 'higher_is_better',
            thresholds: { ok: 90, warn: 75 },
            deltaComparison: 'previous_period', deltaUnit: 'pp',
            dimensions: [], defaultCardStyle: 'compact',
            sparkline: { enabled: false, periods: 12 },
            trend: { enabled: false, periods: 12 },
            dataSource: { scoreEndpoint: '' },
        };
        this.completedSteps = new Set();
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      .designer { display: grid; grid-template-columns: 200px 1fr 280px; min-height: 520px; border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }
      .step-nav { padding: 16px; background: #FAFAF9; border-right: 1px solid #E7E5E4; }
      .content { padding: 20px; overflow-y: auto; }
      .preview-panel { padding: 16px; background: #FAFAF9; border-left: 1px solid #E7E5E4; }
      .preview-title { font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 12px; }
      .preview-card { background: white; border: 1px solid #E7E5E4; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
      .preview-value { font-size: 28px; font-weight: 700; margin: 8px 0; }
      .preview-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
      .preview-target { font-size: 12px; color: #78716C; }
      .threshold-bar { height: 12px; border-radius: 6px; display: flex; overflow: hidden; margin: 8px 0; }
      .zone { height: 100%; }
      .unit-group { display: flex; flex-wrap: wrap; gap: 4px; }
      .period-chips { display: flex; gap: 4px; flex-wrap: wrap; }
    `,
    ]; }
    goToStep(step) {
        if (this.currentStep !== step) {
            this.completedSteps = new Set([...this.completedSteps, this.currentStep]);
            this.currentStep = step;
        }
    }
    nextStep() {
        if (this.currentStep < 6)
            this.goToStep((this.currentStep + 1));
    }
    prevStep() {
        if (this.currentStep > 1)
            this.goToStep((this.currentStep - 1));
    }
    handleSave() {
        this.dispatchEvent(new CustomEvent('kpi-save', {
            bubbles: true, composed: true,
            detail: { kpi: { ...this.draft, id: this.kpiIdProp ? kpiId(this.kpiIdProp) : kpiId(this.draft.name?.toLowerCase().replace(/\s+/g, '-') ?? 'new-kpi') } },
        }));
    }
    updateDraft(key, value) {
        this.draft = { ...this.draft, [key]: value };
    }
    renderStepNav() {
        return html `
      <div class="phz-ea-steps">
        ${[1, 2, 3, 4, 5, 6].map(s => html `
          <button class="phz-ea-step ${this.currentStep === s ? 'phz-ea-step--active' : ''} ${this.completedSteps.has(s) ? 'phz-ea-step--complete' : ''}"
                  @click=${() => this.goToStep(s)}>
            <span class="phz-ea-step-number">${this.completedSteps.has(s) ? '' : s}</span>
            ${STEP_LABELS[s]}
          </button>
        `)}
      </div>
    `;
    }
    renderStep1() {
        return html `
      <h3 style="margin:0 0 16px;">Identity</h3>
      <div class="phz-ea-field">
        <label class="phz-ea-label">KPI Name</label>
        <input class="phz-ea-input" .value=${this.draft.name ?? ''} @input=${(e) => this.updateDraft('name', e.target.value)} placeholder="e.g. Attendance Rate">
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Description</label>
        <textarea class="phz-ea-textarea" .value=${this.draft.description ?? ''} @input=${(e) => this.updateDraft('description', e.target.value)} placeholder="What does this KPI measure?"></textarea>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Category</label>
        <input class="phz-ea-input" .value=${this.draft.category ?? ''} @input=${(e) => this.updateDraft('category', e.target.value)} placeholder="e.g. Performance">
      </div>
    `;
    }
    renderStep2() {
        const units = ['percent', 'count', 'currency', 'duration', 'custom'];
        const directions = ['higher_is_better', 'lower_is_better'];
        return html `
      <h3 style="margin:0 0 16px;">Measurement</h3>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Data Source Endpoint</label>
        <input class="phz-ea-input" .value=${this.draft.dataSource?.scoreEndpoint ?? ''} @input=${(e) => this.updateDraft('dataSource', { ...this.draft.dataSource, scoreEndpoint: e.target.value })}>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Unit Type</label>
        <div class="unit-group">
          ${units.map(u => html `
            <button class="phz-ea-chip ${this.draft.unit === u ? 'phz-ea-chip--active' : ''}" @click=${() => this.updateDraft('unit', u)}>${u}</button>
          `)}
        </div>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Direction</label>
        <div class="phz-ea-radio-group">
          ${directions.map(d => html `
            <label class="phz-ea-radio">
              <input type="radio" name="direction" .checked=${this.draft.direction === d} @change=${() => this.updateDraft('direction', d)}>
              ${d === 'higher_is_better' ? 'Higher is better' : 'Lower is better'}
            </label>
          `)}
        </div>
      </div>
    `;
    }
    renderStep3() {
        const ok = this.draft.thresholds?.ok ?? 90;
        const warn = this.draft.thresholds?.warn ?? 75;
        const target = this.draft.target ?? 95;
        return html `
      <h3 style="margin:0 0 16px;">Thresholds</h3>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Target Value</label>
        <input class="phz-ea-input" type="number" .value=${String(target)} @input=${(e) => this.updateDraft('target', Number(e.target.value))}>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">OK Threshold (green zone starts at)</label>
        <input class="phz-ea-input" type="number" .value=${String(ok)} @input=${(e) => this.updateDraft('thresholds', { ...this.draft.thresholds, ok: Number(e.target.value) })}>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Warning Threshold (yellow zone starts at)</label>
        <input class="phz-ea-input" type="number" .value=${String(warn)} @input=${(e) => this.updateDraft('thresholds', { ...this.draft.thresholds, warn: Number(e.target.value) })}>
      </div>
      <div class="threshold-bar">
        <div class="zone" style="width: ${warn}%; background: ${STATUS_COLORS.crit};"></div>
        <div class="zone" style="width: ${ok - warn}%; background: ${STATUS_COLORS.warn};"></div>
        <div class="zone" style="width: ${100 - ok}%; background: ${STATUS_COLORS.ok};"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:#78716C;">
        <span>0 — Critical</span><span>${warn} — Warning</span><span>${ok} — OK</span><span>100</span>
      </div>
    `;
    }
    renderStep4() {
        const comparisons = ['previous_period', 'same_period_last_year', 'target', 'none'];
        return html `
      <h3 style="margin:0 0 16px;">Comparison</h3>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Delta Comparison</label>
        <div class="phz-ea-radio-group">
          ${comparisons.map(c => html `
            <label class="phz-ea-radio">
              <input type="radio" name="delta" .checked=${this.draft.deltaComparison === c} @change=${() => this.updateDraft('deltaComparison', c)}>
              ${c.replace(/_/g, ' ')}
            </label>
          `)}
        </div>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Delta Unit</label>
        <div class="unit-group">
          ${['pp', 'pct', 'abs'].map(u => html `
            <button class="phz-ea-chip ${this.draft.deltaUnit === u ? 'phz-ea-chip--active' : ''}" @click=${() => this.updateDraft('deltaUnit', u)}>${u}</button>
          `)}
        </div>
      </div>
    `;
    }
    renderStep5() {
        const styles = ['compact', 'expanded', 'minimal'];
        const periodOptions = [12, 26, 52];
        return html `
      <h3 style="margin:0 0 16px;">Visualization</h3>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Card Style</label>
        <div class="unit-group">
          ${styles.map(s => html `
            <button class="phz-ea-chip ${this.draft.defaultCardStyle === s ? 'phz-ea-chip--active' : ''}" @click=${() => this.updateDraft('defaultCardStyle', s)}>${s}</button>
          `)}
        </div>
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Sparkline</label>
        <label class="phz-ea-radio">
          <input type="checkbox" .checked=${this.draft.sparkline?.enabled ?? false}
                 @change=${(e) => this.updateDraft('sparkline', { ...this.draft.sparkline, enabled: e.target.checked })}>
          Enable sparkline
        </label>
        ${this.draft.sparkline?.enabled ? html `
          <div class="period-chips" style="margin-top:8px;">
            ${periodOptions.map(p => html `
              <button class="phz-ea-chip ${this.draft.sparkline?.periods === p ? 'phz-ea-chip--active' : ''}"
                      @click=${() => this.updateDraft('sparkline', { ...this.draft.sparkline, periods: p })}>${p}</button>
            `)}
          </div>
        ` : nothing}
      </div>
      <div class="phz-ea-field">
        <label class="phz-ea-label">Trend</label>
        <label class="phz-ea-radio">
          <input type="checkbox" .checked=${this.draft.trend?.enabled ?? false}
                 @change=${(e) => this.updateDraft('trend', { ...this.draft.trend, enabled: e.target.checked })}>
          Enable trend chart
        </label>
        ${this.draft.trend?.enabled ? html `
          <div class="period-chips" style="margin-top:8px;">
            ${periodOptions.map(p => html `
              <button class="phz-ea-chip ${this.draft.trend?.periods === p ? 'phz-ea-chip--active' : ''}"
                      @click=${() => this.updateDraft('trend', { ...this.draft.trend, periods: p })}>${p}</button>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
    }
    renderStep6() {
        const ok = this.draft.thresholds?.ok ?? 90;
        const warn = this.draft.thresholds?.warn ?? 75;
        const testValues = [ok + 5, (ok + warn) / 2, warn - 10];
        const kpiForTest = this.draft;
        return html `
      <h3 style="margin:0 0 16px;">Preview & Save</h3>
      <p style="font-size:13px; color:#78716C; margin-bottom:16px;">Preview your KPI at different boundary values:</p>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        ${testValues.map(val => {
            const status = computeStatus(val, kpiForTest);
            return html `
            <div class="preview-card" style="flex:1; min-width:140px;">
              <span class="preview-badge" style="background:${status.color}20; color:${status.color};">${status.label}</span>
              <div class="preview-value" style="color:${status.color};">${val}%</div>
            </div>
          `;
        })}
      </div>
      <div style="margin-top:16px;">
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleSave}>Save KPI Definition</button>
        <button class="phz-ea-btn" style="margin-left:8px;" @click=${() => this.dispatchEvent(new CustomEvent('kpi-cancel', { bubbles: true, composed: true }))}>Cancel</button>
      </div>
    `;
    }
    renderPreview() {
        const target = this.draft.target ?? 95;
        const val = target;
        const kpiForPreview = this.draft;
        const status = computeStatus(val, kpiForPreview);
        const formatted = this.draft.unit === 'percent' ? `${val}%` : String(val);
        return html `
      <p class="preview-title">Live Preview</p>
      <div class="preview-card">
        <div style="font-size:11px; font-weight:600; color:#78716C; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
          ${this.draft.name || 'Untitled KPI'}
        </div>
        <span class="preview-badge" style="background:${status.color}20; color:${status.color};">${status.label}</span>
        <div class="preview-value" style="color:${status.color};">${formatted}</div>
        <div class="preview-target">Target: ${formatted}</div>
      </div>
    `;
    }
    render() {
        const stepContent = {
            1: () => this.renderStep1(),
            2: () => this.renderStep2(),
            3: () => this.renderStep3(),
            4: () => this.renderStep4(),
            5: () => this.renderStep5(),
            6: () => this.renderStep6(),
        };
        return html `
      <div class="designer" role="region" aria-label="KPI Designer">
        <div class="step-nav">${this.renderStepNav()}</div>
        <div class="content">
          ${stepContent[this.currentStep]()}
          ${this.currentStep < 6 ? html `
            <div class="phz-ea-nav-bar" style="border:none; background:none; padding:16px 0 0;">
              ${this.currentStep > 1 ? html `<button class="phz-ea-btn" @click=${this.prevStep}>Back</button>` : html `<div></div>`}
              <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.nextStep}>Next</button>
            </div>
          ` : nothing}
        </div>
        <div class="preview-panel">${this.renderPreview()}</div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzKPIDesigner.prototype, "engine", void 0);
__decorate([
    property({ type: String })
], PhzKPIDesigner.prototype, "kpiIdProp", void 0);
__decorate([
    state()
], PhzKPIDesigner.prototype, "currentStep", void 0);
__decorate([
    state()
], PhzKPIDesigner.prototype, "draft", void 0);
__decorate([
    state()
], PhzKPIDesigner.prototype, "completedSteps", void 0);
PhzKPIDesigner = __decorate([
    safeCustomElement('phz-kpi-designer')
], PhzKPIDesigner);
export { PhzKPIDesigner };
//# sourceMappingURL=phz-kpi-designer.js.map