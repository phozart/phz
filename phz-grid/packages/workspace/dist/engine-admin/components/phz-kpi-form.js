/**
 * @phozart/phz-engine-admin — KPI Form
 *
 * Slide-over form for creating/editing KPIs.
 * Supports simple thresholds and custom threshold bands with dynamic sources.
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
import { kpiId } from '@phozart/phz-engine';
const BAND_PRESET_COLORS = ['#DC2626', '#D97706', '#F59E0B', '#16A34A', '#3B82F6', '#7C3AED'];
let PhzKpiForm = class PhzKpiForm extends LitElement {
    constructor() {
        super(...arguments);
        this.isEdit = false;
        this.metrics = [];
        this.parameters = [];
        this._name = '';
        this._metricId = '';
        this._direction = 'higher_is_better';
        this._target = 90;
        this._thresholdMode = 'simple';
        this._okThreshold = 90;
        this._warnThreshold = 70;
        this._bands = [];
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; }

      .segmented {
        display: flex; gap: 2px; background: #E7E5E4; border-radius: 6px; padding: 2px;
      }
      .seg-btn {
        flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 600;
        border: none; border-radius: 4px; cursor: pointer; background: none;
        color: #78716C; font-family: inherit; text-align: center;
      }
      .seg-btn--active { background: white; color: #1C1917; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

      .band {
        display: flex; align-items: center; gap: 8px;
        padding: 8px; border: 1px solid #E7E5E4; border-radius: 6px; margin-bottom: 6px;
        background: white;
      }
      .band-color {
        width: 28px; height: 28px; border-radius: 4px; border: none;
        cursor: pointer; padding: 0; flex-shrink: 0;
      }
      .band-fields { flex: 1; display: flex; flex-direction: column; gap: 4px; }
      .band-row { display: flex; gap: 6px; align-items: center; }
      .band-label-input {
        flex: 1; border: 1px solid #D6D3D1; border-radius: 4px; padding: 3px 6px;
        font-size: 12px; font-family: inherit;
      }
      .band-remove {
        border: none; background: none; color: #DC2626; cursor: pointer;
        font-size: 14px; flex-shrink: 0;
      }

      .source-select {
        padding: 3px 6px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 11px; background: white; font-family: inherit;
      }
      .source-value-input {
        width: 60px; padding: 3px 6px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 12px; font-family: inherit;
      }

      .preview-bar {
        height: 12px; border-radius: 6px; display: flex; overflow: hidden;
        margin: 8px 0 16px; border: 1px solid #E7E5E4;
      }
      .preview-segment { height: 100%; position: relative; }
      .preview-segment-label {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 8px; font-weight: 700; color: white;
        text-shadow: 0 0 2px rgba(0,0,0,0.5);
      }

      .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
    `,
    ]; }
    willUpdate(changed) {
        if (changed.has('kpi') && this.kpi) {
            this._name = this.kpi.name;
            this._direction = this.kpi.direction;
            this._target = this.kpi.target;
            this._okThreshold = this.kpi.thresholds.ok;
            this._warnThreshold = this.kpi.thresholds.warn;
            this._metricId = this.kpi.metricId ?? '';
            if (this.kpi.bands && this.kpi.bands.length > 0) {
                this._thresholdMode = 'bands';
                this._bands = this.kpi.bands.map(b => ({ ...b, upTo: { ...b.upTo } }));
            }
            else {
                this._thresholdMode = 'simple';
                this._bands = [];
            }
        }
    }
    _addBand() {
        if (this._bands.length >= 5)
            return;
        this._bands = [...this._bands, {
                label: 'New Band',
                color: BAND_PRESET_COLORS[this._bands.length % BAND_PRESET_COLORS.length],
                upTo: { type: 'static', value: 100 },
            }];
    }
    _removeBand(index) {
        this._bands = this._bands.filter((_, i) => i !== index);
    }
    _updateBand(index, patch) {
        this._bands = this._bands.map((b, i) => i === index ? { ...b, ...patch } : b);
    }
    _updateBandSource(index, source) {
        this._bands = this._bands.map((b, i) => i === index ? { ...b, upTo: source } : b);
    }
    _handleSave() {
        if (!this._name)
            return;
        const id = this.isEdit && this.kpi
            ? this.kpi.id
            : kpiId(this._name.toLowerCase().replace(/\s+/g, '-'));
        const kpiDef = {
            id,
            name: this._name,
            target: this._target,
            unit: 'percent',
            direction: this._direction,
            thresholds: { ok: this._okThreshold, warn: this._warnThreshold },
            deltaComparison: 'none',
            dimensions: [],
            dataSource: { scoreEndpoint: '/api/score' },
            ...(this._metricId ? { metricId: this._metricId } : {}),
            ...(this._thresholdMode === 'bands' && this._bands.length > 0 ? { bands: this._bands } : {}),
        };
        this.dispatchEvent(new CustomEvent('kpi-save', {
            bubbles: true, composed: true,
            detail: { kpi: kpiDef, isEdit: this.isEdit },
        }));
    }
    _handleCancel() {
        this.dispatchEvent(new CustomEvent('kpi-cancel', { bubbles: true, composed: true }));
    }
    render() {
        return html `
      <div class="phz-ea-field">
        <label class="phz-ea-label">Name</label>
        <input class="phz-ea-input" .value=${this._name}
          @input=${(e) => { this._name = e.target.value; }}
          placeholder="e.g. Performance Score">
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Metric (optional)</label>
        <select class="phz-ea-select" .value=${this._metricId}
          @change=${(e) => { this._metricId = e.target.value; }}>
          <option value="">-- None --</option>
          ${this.metrics.map(m => html `<option value=${m.id} ?selected=${this._metricId === m.id}>${m.name}</option>`)}
        </select>
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Direction</label>
        <div class="segmented">
          <button class="seg-btn ${this._direction === 'higher_is_better' ? 'seg-btn--active' : ''}"
            @click=${() => { this._direction = 'higher_is_better'; }}>Higher is Better</button>
          <button class="seg-btn ${this._direction === 'lower_is_better' ? 'seg-btn--active' : ''}"
            @click=${() => { this._direction = 'lower_is_better'; }}>Lower is Better</button>
        </div>
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Target</label>
        <input class="phz-ea-input" type="number" .value=${String(this._target)}
          @input=${(e) => { this._target = Number(e.target.value); }}>
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Threshold Mode</label>
        <div class="segmented">
          <button class="seg-btn ${this._thresholdMode === 'simple' ? 'seg-btn--active' : ''}"
            @click=${() => { this._thresholdMode = 'simple'; }}>Simple</button>
          <button class="seg-btn ${this._thresholdMode === 'bands' ? 'seg-btn--active' : ''}"
            @click=${() => {
            this._thresholdMode = 'bands';
            if (this._bands.length === 0) {
                this._bands = [
                    { label: 'Critical', color: '#DC2626', upTo: { type: 'static', value: 70 } },
                    { label: 'Warning', color: '#D97706', upTo: { type: 'static', value: 90 } },
                    { label: 'On Track', color: '#16A34A', upTo: { type: 'static', value: 100 } },
                ];
            }
        }}>Custom Bands</button>
        </div>
      </div>

      ${this._thresholdMode === 'simple' ? html `
        <div style="display:flex;gap:8px;">
          <div class="phz-ea-field" style="flex:1;">
            <label class="phz-ea-label">OK Threshold</label>
            <input class="phz-ea-input" type="number" .value=${String(this._okThreshold)}
              @input=${(e) => { this._okThreshold = Number(e.target.value); }}>
          </div>
          <div class="phz-ea-field" style="flex:1;">
            <label class="phz-ea-label">Warn Threshold</label>
            <input class="phz-ea-input" type="number" .value=${String(this._warnThreshold)}
              @input=${(e) => { this._warnThreshold = Number(e.target.value); }}>
          </div>
        </div>
      ` : html `
        <div class="phz-ea-field">
          <label class="phz-ea-label">Threshold Bands (ordered low to high)</label>

          ${this._bands.length > 0 ? html `
            <div class="preview-bar">
              ${this._bands.map(band => {
            const width = 100 / this._bands.length;
            return html `
                  <div class="preview-segment" style="width:${width}%;background:${band.color};">
                    <span class="preview-segment-label">${band.label}</span>
                  </div>
                `;
        })}
            </div>
          ` : nothing}

          ${this._bands.map((band, i) => html `
            <div class="band">
              <input type="color" class="band-color" .value=${band.color}
                @input=${(e) => { this._updateBand(i, { color: e.target.value }); }}>
              <div class="band-fields">
                <input class="band-label-input" .value=${band.label} placeholder="Label"
                  @input=${(e) => { this._updateBand(i, { label: e.target.value }); }}>
                <div class="band-row">
                  <span style="font-size:10px;color:#78716C;min-width:30px;">Up to:</span>
                  <select class="source-select" .value=${band.upTo.type}
                    @change=${(e) => {
            const type = e.target.value;
            this._updateBandSource(i, { type, value: type === 'static' ? 100 : undefined });
        }}>
                    <option value="static">Static</option>
                    <option value="parameter">Parameter</option>
                    <option value="metric">Metric</option>
                  </select>
                  ${band.upTo.type === 'static' ? html `
                    <input class="source-value-input" type="number" .value=${String(band.upTo.value ?? '')}
                      @input=${(e) => { this._updateBandSource(i, { type: 'static', value: Number(e.target.value) }); }}>
                  ` : band.upTo.type === 'parameter' ? html `
                    <select class="source-select" .value=${band.upTo.parameterId ?? ''}
                      @change=${(e) => { this._updateBandSource(i, { type: 'parameter', parameterId: e.target.value }); }}>
                      <option value="">-- Select --</option>
                      ${this.parameters.map(p => html `<option value=${p.id}>${p.name}</option>`)}
                    </select>
                  ` : html `
                    <select class="source-select" .value=${band.upTo.metricId ?? ''}
                      @change=${(e) => { this._updateBandSource(i, { type: 'metric', metricId: e.target.value }); }}>
                      <option value="">-- Select --</option>
                      ${this.metrics.map(m => html `<option value=${m.id}>${m.name}</option>`)}
                    </select>
                  `}
                </div>
              </div>
              <button class="band-remove" @click=${() => this._removeBand(i)} title="Remove band">&times;</button>
            </div>
          `)}

          ${this._bands.length < 5 ? html `
            <button class="phz-ea-btn" @click=${this._addBand} style="font-size:12px;">+ Add Band</button>
          ` : nothing}
        </div>
      `}

      <div class="actions">
        <button class="phz-ea-btn" @click=${this._handleCancel}>Cancel</button>
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this._handleSave}
          ?disabled=${!this._name}>${this.isEdit ? 'Update' : 'Create'}</button>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzKpiForm.prototype, "kpi", void 0);
__decorate([
    property({ type: Boolean })
], PhzKpiForm.prototype, "isEdit", void 0);
__decorate([
    property({ type: Array })
], PhzKpiForm.prototype, "metrics", void 0);
__decorate([
    property({ type: Array })
], PhzKpiForm.prototype, "parameters", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_name", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_metricId", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_direction", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_target", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_thresholdMode", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_okThreshold", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_warnThreshold", void 0);
__decorate([
    state()
], PhzKpiForm.prototype, "_bands", void 0);
PhzKpiForm = __decorate([
    safeCustomElement('phz-kpi-form')
], PhzKpiForm);
export { PhzKpiForm };
//# sourceMappingURL=phz-kpi-form.js.map