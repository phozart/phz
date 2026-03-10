/**
 * @phozart/phz-engine-admin — Widget Configuration Panel
 *
 * 3-tab panel: Data | Appearance | Behaviour
 * Per-widget-type controls for rich configuration.
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
import { PALETTE_PRESETS } from '@phozart/phz-engine';
const FILTER_OPERATORS = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'not contains' },
    { value: 'in', label: 'in' },
    { value: 'between', label: 'between' },
    { value: 'is_null', label: 'is null' },
    { value: 'is_not_null', label: 'is not null' },
];
let PhzWidgetConfigPanel = class PhzWidgetConfigPanel extends LitElement {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.kpis = [];
        this.metrics = [];
        this.layoutColumns = 3;
        this.activeTab = 'data';
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

      .panel { display: flex; flex-direction: column; height: 100%; }

      .tabs {
        display: flex; border-bottom: 2px solid #E7E5E4; flex-shrink: 0;
      }
      .tab {
        flex: 1; padding: 8px 4px; font-size: 11px; font-weight: 600;
        color: #78716C; cursor: pointer; border: none; background: none;
        border-bottom: 2px solid transparent; margin-bottom: -2px;
        text-align: center; text-transform: uppercase; letter-spacing: 0.04em;
        font-family: inherit; transition: color 0.15s;
      }
      .tab:hover { color: #44403C; }
      .tab--active { color: #3B82F6; border-bottom-color: #3B82F6; }

      .tab-content { flex: 1; overflow-y: auto; padding: 12px; }

      .section { margin-bottom: 16px; }
      .section-title {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em; margin-bottom: 8px; padding-bottom: 4px;
        border-bottom: 1px solid #E7E5E4;
      }

      .field { margin-bottom: 10px; }
      .field-label {
        font-size: 11px; font-weight: 600; color: #44403C; margin-bottom: 3px;
        display: block;
      }
      .field-input {
        width: 100%; padding: 5px 8px; border: 1px solid #D6D3D1; border-radius: 5px;
        font-size: 12px; font-family: inherit; background: white; color: #1C1917;
        box-sizing: border-box;
      }
      .field-input:focus { outline: none; border-color: #3B82F6; }
      .field-select {
        width: 100%; padding: 5px 8px; border: 1px solid #D6D3D1; border-radius: 5px;
        font-size: 12px; background: white; box-sizing: border-box;
      }

      .toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 4px 0; font-size: 12px; color: #44403C;
      }
      .toggle-row input[type="checkbox"] { accent-color: #3B82F6; }

      .chip-group { display: flex; gap: 4px; flex-wrap: wrap; }
      .chip {
        padding: 3px 10px; border: 1px solid #D6D3D1; border-radius: 12px;
        font-size: 11px; font-weight: 500; cursor: pointer; background: white;
        font-family: inherit; transition: all 0.12s; color: #44403C;
      }
      .chip:hover { border-color: #3B82F6; }
      .chip--active { background: #3B82F6; color: white; border-color: #3B82F6; }

      .btn-group { display: flex; border-radius: 6px; overflow: hidden; }
      .btn-group button {
        flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 500;
        border: 1px solid #D6D3D1; background: white; color: #78716C;
        cursor: pointer; transition: all 0.1s; font-family: inherit;
      }
      .btn-group button:not(:first-child) { border-left: none; }
      .btn-group button:first-child { border-radius: 6px 0 0 6px; }
      .btn-group button:last-child { border-radius: 0 6px 6px 0; }
      .btn-group button:hover { background: #F5F5F4; }
      .btn-group button.active { background: #1C1917; color: white; border-color: #1C1917; }

      .color-row {
        display: flex; align-items: center; gap: 6px;
      }
      .color-row input[type="color"] {
        width: 28px; height: 24px; border: 1px solid #D6D3D1; border-radius: 4px;
        padding: 1px; cursor: pointer; flex-shrink: 0;
      }
      .color-row input[type="text"] {
        width: 70px; padding: 4px 6px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 11px; font-family: monospace;
      }

      .filter-row {
        display: grid; grid-template-columns: 1fr 80px 1fr 24px; gap: 4px;
        align-items: center; margin-bottom: 6px;
      }
      .filter-add {
        font-size: 11px; color: #3B82F6; cursor: pointer; background: none;
        border: none; text-align: left; padding: 4px 0; font-weight: 600; font-family: inherit;
      }
      .filter-remove {
        width: 22px; height: 22px; border-radius: 4px; border: none;
        background: #FEF2F2; color: #DC2626; cursor: pointer; font-size: 13px;
        display: flex; align-items: center; justify-content: center;
      }

      .palette-picker { display: flex; flex-direction: column; gap: 6px; }
      .palette-option {
        display: flex; align-items: center; gap: 6px; padding: 4px 6px;
        border-radius: 6px; cursor: pointer; border: 1px solid transparent;
        transition: all 0.12s;
      }
      .palette-option:hover { background: #F5F5F4; }
      .palette-option--active { border-color: #3B82F6; background: #EFF6FF; }
      .palette-swatches { display: flex; gap: 2px; }
      .palette-swatch { width: 16px; height: 16px; border-radius: 3px; }
      .palette-name { font-size: 11px; font-weight: 500; color: #44403C; }

      .kpi-check { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 12px; }
      .kpi-check input { accent-color: #3B82F6; }

      .measure-row {
        display: grid; grid-template-columns: 1fr 80px 24px; gap: 4px;
        align-items: center; margin-bottom: 6px;
      }

      .group-label {
        font-size: 10px; font-weight: 600; color: #A8A29E; text-transform: uppercase;
        padding: 6px 0 2px 0; letter-spacing: 0.04em;
      }

      .optgroup-heading {
        font-size: 10px; font-weight: 700; color: #A8A29E; padding: 4px 8px;
        text-transform: uppercase; letter-spacing: 0.04em;
      }
    `,
    ]; }
    emit() {
        this.dispatchEvent(new CustomEvent('widget-config-change', {
            bubbles: true, composed: true,
            detail: { config: structuredClone(this.widgetConfig) },
        }));
    }
    updateData(updates) {
        this.widgetConfig = { ...this.widgetConfig, data: { ...this.widgetConfig.data, ...updates } };
        this.emit();
        this.requestUpdate();
    }
    updateAppearance(updates) {
        this.widgetConfig = { ...this.widgetConfig, appearance: { ...this.widgetConfig.appearance, ...updates } };
        this.emit();
        this.requestUpdate();
    }
    updateBehaviour(updates) {
        this.widgetConfig = { ...this.widgetConfig, behaviour: { ...this.widgetConfig.behaviour, ...updates } };
        this.emit();
        this.requestUpdate();
    }
    get numericFields() { return this.fields.filter(f => f.type === 'num'); }
    get stringFields() { return this.fields.filter(f => f.type === 'str'); }
    // --- Data Tab ---
    renderDataTab() {
        const { bindings } = this.widgetConfig.data;
        return html `
      <div class="section">
        <div class="section-title">Data Bindings</div>
        ${this.renderBindingsForType(bindings.type)}
      </div>
      <div class="section">
        <div class="section-title">Filters</div>
        ${this.renderFilterEditor()}
      </div>
      ${bindings.type === 'chart' ? html `
        <div class="section">
          <div class="section-title">Sort & Limit</div>
          ${this.renderSortLimit()}
        </div>
      ` : nothing}
    `;
    }
    renderBindingsForType(type) {
        switch (type) {
            case 'chart': return this.renderChartBindings();
            case 'kpi': return this.renderKpiBindings();
            case 'scorecard': return this.renderScorecardBindings();
            case 'status-table': return this.renderStatusTableBindings();
            case 'data-table': return this.renderDataTableBindings();
            case 'drill-link': return this.renderDrillLinkBindings();
            default: return html `<div style="font-size:12px;color:#A8A29E;">No bindings for this type</div>`;
        }
    }
    renderChartBindings() {
        const b = this.widgetConfig.data.bindings;
        return html `
      <div class="field">
        <span class="field-label">Category (X-Axis)</span>
        <div class="group-label">From Fields</div>
        <select class="field-select" .value=${b.category.fieldKey}
                @change=${(e) => {
            const val = e.target.value;
            this.updateData({ bindings: { ...b, category: { ...b.category, fieldKey: val } } });
        }}>
          <option value="">-- Select dimension --</option>
          ${this.stringFields.map(f => html `<option value=${f.name} ?selected=${b.category.fieldKey === f.name}>${f.name}</option>`)}
        </select>
      </div>
      <div class="field">
        <span class="field-label">Values (Measures)</span>
        ${(b.values || []).map((m, i) => html `
          <div class="measure-row">
            <select class="field-select" .value=${m.fieldKey}
                    @change=${(e) => {
            const vals = [...b.values];
            vals[i] = { ...vals[i], fieldKey: e.target.value };
            this.updateData({ bindings: { ...b, values: vals } });
        }}>
              <option value="">-- Select --</option>
              <optgroup label="FROM METRICS">
                ${this.metrics.map((mt) => html `<option value=${mt.formula?.field ?? mt.id} ?selected=${m.fieldKey === (mt.formula?.field ?? mt.id)}>${mt.name}</option>`)}
              </optgroup>
              <optgroup label="FROM FIELDS">
                ${this.numericFields.map(f => html `<option value=${f.name} ?selected=${m.fieldKey === f.name}>${f.name}</option>`)}
              </optgroup>
            </select>
            <select class="field-select" .value=${m.aggregation}
                    @change=${(e) => {
            const vals = [...b.values];
            vals[i] = { ...vals[i], aggregation: e.target.value };
            this.updateData({ bindings: { ...b, values: vals } });
        }}>
              <option value="avg">Avg</option>
              <option value="sum">Sum</option>
              <option value="count">Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
            ${b.values.length > 1 ? html `
              <button class="filter-remove" @click=${() => {
            const vals = b.values.filter((_, j) => j !== i);
            this.updateData({ bindings: { ...b, values: vals } });
        }}>&times;</button>
            ` : html `<span></span>`}
          </div>
        `)}
        <button class="filter-add" @click=${() => {
            const vals = [...b.values, { fieldKey: '', aggregation: 'avg' }];
            this.updateData({ bindings: { ...b, values: vals } });
        }}>+ Add measure</button>
      </div>
    `;
    }
    renderKpiBindings() {
        const b = this.widgetConfig.data.bindings;
        return html `
      <div class="field">
        <span class="field-label">KPI</span>
        <select class="field-select" .value=${b.kpiId}
                @change=${(e) => {
            this.updateData({ bindings: { ...b, kpiId: e.target.value } });
        }}>
          <option value="">-- Select KPI --</option>
          ${this.kpis.map(k => html `<option value=${k.id} ?selected=${b.kpiId === k.id}>${k.name}</option>`)}
        </select>
      </div>
    `;
    }
    renderScorecardBindings() {
        const b = this.widgetConfig.data.bindings;
        return html `
      <div class="field">
        <span class="field-label">KPIs</span>
        ${this.kpis.map(k => html `
          <label class="kpi-check">
            <input type="checkbox" ?checked=${b.kpiIds.includes(k.id)}
                   @change=${(e) => {
            const checked = e.target.checked;
            const ids = checked ? [...b.kpiIds, k.id] : b.kpiIds.filter(id => id !== k.id);
            this.updateData({ bindings: { ...b, kpiIds: ids } });
        }}>
            ${k.name}
          </label>
        `)}
      </div>
      <div class="field">
        <span class="field-label">Breakdown Dimension</span>
        <select class="field-select" .value=${b.breakdownDimension ?? ''}
                @change=${(e) => {
            this.updateData({ bindings: { ...b, breakdownDimension: e.target.value || undefined } });
        }}>
          <option value="">None</option>
          ${this.stringFields.map(f => html `<option value=${f.name} ?selected=${b.breakdownDimension === f.name}>${f.name}</option>`)}
        </select>
      </div>
    `;
    }
    renderStatusTableBindings() {
        const b = this.widgetConfig.data.bindings;
        return html `
      <div class="field">
        <span class="field-label">Entity Field</span>
        <select class="field-select" .value=${b.entityField.fieldKey}
                @change=${(e) => {
            this.updateData({ bindings: { ...b, entityField: { ...b.entityField, fieldKey: e.target.value } } });
        }}>
          <option value="">-- Select --</option>
          ${this.stringFields.map(f => html `<option value=${f.name} ?selected=${b.entityField.fieldKey === f.name}>${f.name}</option>`)}
        </select>
      </div>
      <div class="field">
        <span class="field-label">KPIs</span>
        ${this.kpis.map(k => html `
          <label class="kpi-check">
            <input type="checkbox" ?checked=${b.kpiIds.includes(k.id)}
                   @change=${(e) => {
            const checked = e.target.checked;
            const ids = checked ? [...b.kpiIds, k.id] : b.kpiIds.filter(id => id !== k.id);
            this.updateData({ bindings: { ...b, kpiIds: ids } });
        }}>
            ${k.name}
          </label>
        `)}
      </div>
    `;
    }
    renderDataTableBindings() {
        const b = this.widgetConfig.data.bindings;
        return html `
      <div class="field">
        <span class="field-label">Columns</span>
        ${this.fields.map(f => html `
          <label class="kpi-check">
            <input type="checkbox" ?checked=${b.columns.some(c => c.fieldKey === f.name)}
                   @change=${(e) => {
            const checked = e.target.checked;
            const cols = checked
                ? [...b.columns, { fieldKey: f.name }]
                : b.columns.filter(c => c.fieldKey !== f.name);
            this.updateData({ bindings: { ...b, columns: cols } });
        }}>
            <span style="display:inline-flex;gap:4px;align-items:center;">
              <span style="font-size:9px;font-weight:700;color:#A8A29E;text-transform:uppercase;min-width:22px;">${f.type}</span>
              ${f.name}
            </span>
          </label>
        `)}
      </div>
    `;
    }
    renderDrillLinkBindings() {
        const b = this.widgetConfig.data.bindings;
        return html `
      <div class="field">
        <span class="field-label">Label</span>
        <input class="field-input" .value=${b.label}
               @input=${(e) => {
            this.updateData({ bindings: { ...b, label: e.target.value } });
        }}>
      </div>
      <div class="field">
        <span class="field-label">Target Report ID</span>
        <input class="field-input" .value=${b.targetReportId}
               @input=${(e) => {
            this.updateData({ bindings: { ...b, targetReportId: e.target.value } });
        }}>
      </div>
    `;
    }
    // --- Filter Editor ---
    renderFilterEditor() {
        const filters = this.widgetConfig.data.filters ?? [];
        return html `
      ${filters.map((f, i) => html `
        <div class="filter-row">
          <select class="field-select" .value=${f.field}
                  @change=${(e) => {
            const updated = [...filters];
            updated[i] = { ...updated[i], field: e.target.value };
            this.updateData({ filters: updated });
        }}>
            <option value="">Field</option>
            ${this.fields.map(fl => html `<option value=${fl.name} ?selected=${f.field === fl.name}>${fl.name}</option>`)}
          </select>
          <select class="field-select" .value=${f.operator}
                  @change=${(e) => {
            const updated = [...filters];
            updated[i] = { ...updated[i], operator: e.target.value };
            this.updateData({ filters: updated });
        }}>
            ${FILTER_OPERATORS.map(op => html `<option value=${op.value} ?selected=${f.operator === op.value}>${op.label}</option>`)}
          </select>
          <input class="field-input" .value=${String(f.value ?? '')}
                 @input=${(e) => {
            const updated = [...filters];
            const raw = e.target.value;
            updated[i] = { ...updated[i], value: isNaN(Number(raw)) ? raw : Number(raw) };
            this.updateData({ filters: updated });
        }}>
          <button class="filter-remove" @click=${() => {
            this.updateData({ filters: filters.filter((_, j) => j !== i) });
        }}>&times;</button>
        </div>
      `)}
      <button class="filter-add" @click=${() => {
            this.updateData({ filters: [...filters, { field: '', operator: 'eq', value: '' }] });
        }}>+ Add filter</button>
    `;
    }
    // --- Sort & Limit ---
    renderSortLimit() {
        const { sort, limit, groupOthers } = this.widgetConfig.data;
        return html `
      <div class="field">
        <span class="field-label">Sort Field</span>
        <select class="field-select" .value=${sort?.field ?? ''}
                @change=${(e) => {
            const field = e.target.value;
            this.updateData({ sort: field ? { field, direction: sort?.direction ?? 'desc' } : undefined });
        }}>
          <option value="">Default</option>
          ${this.numericFields.map(f => html `<option value=${f.name} ?selected=${sort?.field === f.name}>${f.name}</option>`)}
        </select>
      </div>
      <div class="field">
        <span class="field-label">Sort Direction</span>
        <div class="btn-group">
          <button class="${sort?.direction === 'asc' ? 'active' : ''}"
                  @click=${() => this.updateData({ sort: { field: sort?.field ?? '', direction: 'asc' } })}>Asc</button>
          <button class="${(!sort || sort.direction === 'desc') ? 'active' : ''}"
                  @click=${() => this.updateData({ sort: { field: sort?.field ?? '', direction: 'desc' } })}>Desc</button>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Limit</span>
        <input class="field-input" type="number" .value=${String(limit ?? '')} min="0"
               @input=${(e) => {
            const val = parseInt(e.target.value);
            this.updateData({ limit: isNaN(val) ? undefined : val });
        }}>
      </div>
      <div class="toggle-row">
        <span>Group Others</span>
        <input type="checkbox" ?checked=${groupOthers ?? false}
               @change=${(e) => this.updateData({ groupOthers: e.target.checked })}>
      </div>
    `;
    }
    // --- Appearance Tab ---
    renderAppearanceTab() {
        const { container, titleBar, chart, kpi, scorecard, bottomN } = this.widgetConfig.appearance;
        const wType = this.widgetConfig.type;
        return html `
      <div class="section">
        <div class="section-title">Container</div>
        <div class="field">
          <span class="field-label">Shadow</span>
          <div class="chip-group">
            ${['none', 'sm', 'md', 'lg'].map(s => html `
              <button class="chip ${container.shadow === s ? 'chip--active' : ''}"
                      @click=${() => this.updateAppearance({ container: { ...container, shadow: s } })}>${s === 'none' ? 'None' : s.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div class="field">
          <span class="field-label">Border Radius</span>
          <div class="chip-group">
            ${[0, 4, 8, 12, 16].map(r => html `
              <button class="chip ${container.borderRadius === r ? 'chip--active' : ''}"
                      @click=${() => this.updateAppearance({ container: { ...container, borderRadius: r } })}>${r}</button>
            `)}
          </div>
        </div>
        <div class="field">
          <span class="field-label">Background</span>
          <div class="color-row">
            <input type="color" .value=${container.background ?? '#FFFFFF'}
                   @input=${(e) => this.updateAppearance({ container: { ...container, background: e.target.value } })}>
            <input type="text" .value=${container.background ?? '#FFFFFF'}
                   @change=${(e) => this.updateAppearance({ container: { ...container, background: e.target.value } })}>
          </div>
        </div>
        <div class="toggle-row">
          <span>Show Border</span>
          <input type="checkbox" ?checked=${container.border ?? false}
                 @change=${(e) => this.updateAppearance({ container: { ...container, border: e.target.checked } })}>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Title Bar</div>
        <div class="toggle-row">
          <span>Show Title</span>
          <input type="checkbox" ?checked=${titleBar.show}
                 @change=${(e) => this.updateAppearance({ titleBar: { ...titleBar, show: e.target.checked } })}>
        </div>
        ${titleBar.show ? html `
          <div class="field">
            <span class="field-label">Title</span>
            <input class="field-input" .value=${titleBar.title ?? ''}
                   @input=${(e) => this.updateAppearance({ titleBar: { ...titleBar, title: e.target.value } })}>
          </div>
          <div class="field">
            <span class="field-label">Subtitle</span>
            <input class="field-input" .value=${titleBar.subtitle ?? ''}
                   @input=${(e) => this.updateAppearance({ titleBar: { ...titleBar, subtitle: e.target.value } })}>
          </div>
          <div class="field">
            <span class="field-label">Font Size</span>
            <input class="field-input" type="number" .value=${String(titleBar.fontSize ?? 14)} min="10" max="24"
                   @input=${(e) => this.updateAppearance({ titleBar: { ...titleBar, fontSize: parseInt(e.target.value) || 14 } })}>
          </div>
          <div class="field">
            <span class="field-label">Color</span>
            <div class="color-row">
              <input type="color" .value=${titleBar.color ?? '#1C1917'}
                     @input=${(e) => this.updateAppearance({ titleBar: { ...titleBar, color: e.target.value } })}>
              <input type="text" .value=${titleBar.color ?? '#1C1917'}
                     @change=${(e) => this.updateAppearance({ titleBar: { ...titleBar, color: e.target.value } })}>
            </div>
          </div>
        ` : nothing}
      </div>

      ${(wType === 'bar-chart' || wType === 'trend-line') ? this.renderChartAppearance() : nothing}
      ${wType === 'kpi-card' ? this.renderKpiAppearance() : nothing}
      ${wType === 'kpi-scorecard' ? this.renderScorecardAppearance() : nothing}
      ${wType === 'bottom-n' ? this.renderBottomNAppearance() : nothing}
    `;
    }
    renderChartAppearance() {
        const chart = this.widgetConfig.appearance.chart ?? {};
        const wType = this.widgetConfig.type;
        return html `
      <div class="section">
        <div class="section-title">Chart Area</div>
        <div class="field">
          <span class="field-label">Height (px)</span>
          <input class="field-input" type="number" .value=${String(chart.height ?? 300)} min="100" max="600"
                 @input=${(e) => this.updateAppearance({ chart: { ...chart, height: parseInt(e.target.value) || 300 } })}>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Axes</div>
        <div class="toggle-row">
          <span>Show X-Axis</span>
          <input type="checkbox" ?checked=${chart.xAxis?.show !== false}
                 @change=${(e) => this.updateAppearance({ chart: { ...chart, xAxis: { ...chart.xAxis, show: e.target.checked } } })}>
        </div>
        <div class="toggle-row">
          <span>Show Y-Axis</span>
          <input type="checkbox" ?checked=${chart.yAxis?.show !== false}
                 @change=${(e) => {
            const checked = e.target.checked;
            this.updateAppearance({ chart: { ...chart, yAxis: Object.assign({ show: true }, chart.yAxis, { show: checked }) } });
        }}>
        </div>
        <div class="toggle-row">
          <span>Grid Lines</span>
          <input type="checkbox" ?checked=${chart.yAxis?.gridLines !== false}
                 @change=${(e) => {
            const checked = e.target.checked;
            this.updateAppearance({ chart: { ...chart, yAxis: Object.assign({ show: true }, chart.yAxis, { gridLines: checked }) } });
        }}>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Legend & Labels</div>
        <div class="toggle-row">
          <span>Show Legend</span>
          <input type="checkbox" ?checked=${chart.legend?.show ?? false}
                 @change=${(e) => this.updateAppearance({ chart: { ...chart, legend: { ...(chart.legend ?? { position: 'top' }), show: e.target.checked } } })}>
        </div>
        <div class="toggle-row">
          <span>Data Labels</span>
          <input type="checkbox" ?checked=${chart.dataLabels?.show ?? false}
                 @change=${(e) => this.updateAppearance({ chart: { ...chart, dataLabels: { ...(chart.dataLabels ?? { position: 'outside' }), show: e.target.checked } } })}>
        </div>
        <div class="toggle-row">
          <span>Tooltip</span>
          <input type="checkbox" ?checked=${chart.tooltip?.enabled !== false}
                 @change=${(e) => this.updateAppearance({ chart: { ...chart, tooltip: { enabled: e.target.checked } } })}>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Colors</div>
        <div class="palette-picker">
          ${PALETTE_PRESETS.map(p => html `
            <div class="palette-option ${(chart.palette ?? 'phz-default') === p.id ? 'palette-option--active' : ''}"
                 @click=${() => this.updateAppearance({ chart: { ...chart, palette: p.id, colors: p.colors } })}>
              <div class="palette-swatches">
                ${p.colors.slice(0, 6).map(c => html `<div class="palette-swatch" style="background:${c};"></div>`)}
              </div>
              <span class="palette-name">${p.name}</span>
            </div>
          `)}
        </div>
      </div>

      ${wType === 'bar-chart' ? html `
        <div class="section">
          <div class="section-title">Bar Options</div>
          <div class="field">
            <span class="field-label">Orientation</span>
            <div class="btn-group">
              <button class="${(chart.bar?.orientation ?? 'horizontal') === 'horizontal' ? 'active' : ''}"
                      @click=${() => this.updateAppearance({ chart: { ...chart, bar: { ...(chart.bar ?? {}), orientation: 'horizontal' } } })}>Horizontal</button>
              <button class="${chart.bar?.orientation === 'vertical' ? 'active' : ''}"
                      @click=${() => this.updateAppearance({ chart: { ...chart, bar: { ...(chart.bar ?? {}), orientation: 'vertical' } } })}>Vertical</button>
            </div>
          </div>
          <div class="toggle-row">
            <span>Stacked</span>
            <input type="checkbox" ?checked=${chart.bar?.stacked ?? false}
                   @change=${(e) => this.updateAppearance({ chart: { ...chart, bar: Object.assign({ orientation: 'horizontal' }, chart.bar, { stacked: e.target.checked }) } })}>
          </div>
        </div>
      ` : nothing}

      ${wType === 'trend-line' ? html `
        <div class="section">
          <div class="section-title">Line Options</div>
          <div class="field">
            <span class="field-label">Curve</span>
            <div class="btn-group">
              <button class="${(chart.line?.curve ?? 'smooth') === 'linear' ? 'active' : ''}"
                      @click=${() => this.updateAppearance({ chart: { ...chart, line: { ...(chart.line ?? {}), curve: 'linear' } } })}>Linear</button>
              <button class="${(chart.line?.curve ?? 'smooth') === 'smooth' ? 'active' : ''}"
                      @click=${() => this.updateAppearance({ chart: { ...chart, line: { ...(chart.line ?? {}), curve: 'smooth' } } })}>Smooth</button>
            </div>
          </div>
          <div class="toggle-row">
            <span>Show Dots</span>
            <input type="checkbox" ?checked=${chart.line?.showDots !== false}
                   @change=${(e) => this.updateAppearance({ chart: { ...chart, line: Object.assign({ curve: 'smooth' }, chart.line, { showDots: e.target.checked }) } })}>
          </div>
          <div class="toggle-row">
            <span>Fill Area</span>
            <input type="checkbox" ?checked=${chart.line?.fill ?? false}
                   @change=${(e) => this.updateAppearance({ chart: { ...chart, line: Object.assign({ curve: 'smooth' }, chart.line, { fill: e.target.checked }) } })}>
          </div>
        </div>
      ` : nothing}
    `;
    }
    renderKpiAppearance() {
        const kpi = this.widgetConfig.appearance.kpi ?? {};
        return html `
      <div class="section">
        <div class="section-title">KPI Display</div>
        <div class="field">
          <span class="field-label">Value Font Size</span>
          <input class="field-input" type="number" .value=${String(kpi.valueSize ?? 28)} min="14" max="48"
                 @input=${(e) => this.updateAppearance({ kpi: { ...kpi, valueSize: parseInt(e.target.value) || 28 } })}>
        </div>
        <div class="field">
          <span class="field-label">Layout</span>
          <div class="btn-group">
            <button class="${(kpi.layout ?? 'vertical') === 'vertical' ? 'active' : ''}"
                    @click=${() => this.updateAppearance({ kpi: { ...kpi, layout: 'vertical' } })}>Vertical</button>
            <button class="${kpi.layout === 'horizontal' ? 'active' : ''}"
                    @click=${() => this.updateAppearance({ kpi: { ...kpi, layout: 'horizontal' } })}>Horizontal</button>
          </div>
        </div>
        <div class="field">
          <span class="field-label">Alignment</span>
          <div class="btn-group">
            ${['left', 'center', 'right'].map(a => html `
              <button class="${(kpi.alignment ?? 'center') === a ? 'active' : ''}"
                      @click=${() => this.updateAppearance({ kpi: { ...kpi, alignment: a } })}>${a[0].toUpperCase() + a.slice(1)}</button>
            `)}
          </div>
        </div>
        <div class="toggle-row">
          <span>Show Trend</span>
          <input type="checkbox" ?checked=${kpi.showTrend !== false}
                 @change=${(e) => this.updateAppearance({ kpi: { ...kpi, showTrend: e.target.checked } })}>
        </div>
        <div class="toggle-row">
          <span>Show Target</span>
          <input type="checkbox" ?checked=${kpi.showTarget !== false}
                 @change=${(e) => this.updateAppearance({ kpi: { ...kpi, showTarget: e.target.checked } })}>
        </div>
        <div class="toggle-row">
          <span>Show Sparkline</span>
          <input type="checkbox" ?checked=${kpi.showSparkline !== false}
                 @change=${(e) => this.updateAppearance({ kpi: { ...kpi, showSparkline: e.target.checked } })}>
        </div>
      </div>
    `;
    }
    renderScorecardAppearance() {
        const sc = this.widgetConfig.appearance.scorecard ?? {};
        return html `
      <div class="section">
        <div class="section-title">Scorecard Display</div>
        <div class="field">
          <span class="field-label">Density</span>
          <div class="btn-group">
            ${['comfortable', 'compact', 'dense'].map(d => html `
              <button class="${(sc.density ?? 'compact') === d ? 'active' : ''}"
                      @click=${() => this.updateAppearance({ scorecard: { ...sc, density: d } })}>${d[0].toUpperCase() + d.slice(1)}</button>
            `)}
          </div>
        </div>
        <div class="toggle-row">
          <span>Row Banding</span>
          <input type="checkbox" ?checked=${sc.rowBanding !== false}
                 @change=${(e) => this.updateAppearance({ scorecard: { ...sc, rowBanding: e.target.checked } })}>
        </div>
        <div class="toggle-row">
          <span>Sticky Header</span>
          <input type="checkbox" ?checked=${sc.stickyHeader !== false}
                 @change=${(e) => this.updateAppearance({ scorecard: { ...sc, stickyHeader: e.target.checked } })}>
        </div>
      </div>
    `;
    }
    renderBottomNAppearance() {
        const bn = this.widgetConfig.appearance.bottomN ?? {};
        return html `
      <div class="section">
        <div class="section-title">Bottom/Top N Display</div>
        <div class="field">
          <span class="field-label">Mode</span>
          <div class="btn-group">
            <button class="${(bn.mode ?? 'bottom') === 'bottom' ? 'active' : ''}"
                    @click=${() => this.updateAppearance({ bottomN: { ...bn, mode: 'bottom' } })}>Bottom (Worst)</button>
            <button class="${bn.mode === 'top' ? 'active' : ''}"
                    @click=${() => this.updateAppearance({ bottomN: { ...bn, mode: 'top' } })}>Top (Best)</button>
          </div>
        </div>
        <div class="field">
          <span class="field-label">Count (N)</span>
          <input class="field-input" type="number" .value=${String(bn.count ?? 5)} min="1" max="50"
                 @input=${(e) => this.updateAppearance({ bottomN: { ...bn, count: parseInt(e.target.value) || 5 } })}>
        </div>
        <div class="toggle-row">
          <span>Show Rank Number</span>
          <input type="checkbox" ?checked=${bn.showRankNumber !== false}
                 @change=${(e) => this.updateAppearance({ bottomN: { ...bn, showRankNumber: e.target.checked } })}>
        </div>
        <div class="toggle-row">
          <span>Highlight First</span>
          <input type="checkbox" ?checked=${bn.highlightFirst ?? false}
                 @change=${(e) => this.updateAppearance({ bottomN: { ...bn, highlightFirst: e.target.checked } })}>
        </div>
      </div>
    `;
    }
    // --- Behaviour Tab ---
    renderBehaviourTab() {
        const b = this.widgetConfig.behaviour;
        return html `
      <div class="section">
        <div class="section-title">Click Action</div>
        <div class="field">
          <span class="field-label">On Click</span>
          <select class="field-select" .value=${b.onClick}
                  @change=${(e) => this.updateBehaviour({ onClick: e.target.value })}>
            <option value="none">None</option>
            <option value="filter-others">Filter Other Widgets</option>
            <option value="open-detail">Open Detail View</option>
            <option value="custom-url">Custom URL</option>
          </select>
        </div>
        ${b.onClick === 'filter-others' ? html `
          <div class="field">
            <span class="field-label">Filter Field</span>
            <select class="field-select" .value=${b.clickTargetField ?? ''}
                    @change=${(e) => this.updateBehaviour({ clickTargetField: e.target.value })}>
              <option value="">-- Select --</option>
              ${this.fields.map(f => html `<option value=${f.name} ?selected=${b.clickTargetField === f.name}>${f.name}</option>`)}
            </select>
          </div>
        ` : nothing}
        ${b.onClick === 'custom-url' ? html `
          <div class="field">
            <span class="field-label">URL Template</span>
            <input class="field-input" .value=${b.clickUrl ?? ''} placeholder="https://..."
                   @input=${(e) => this.updateBehaviour({ clickUrl: e.target.value })}>
          </div>
        ` : nothing}
      </div>

      <div class="section">
        <div class="section-title">Export</div>
        <div class="toggle-row">
          <span>Export as PNG</span>
          <input type="checkbox" ?checked=${b.exportPng}
                 @change=${(e) => this.updateBehaviour({ exportPng: e.target.checked })}>
        </div>
        <div class="toggle-row">
          <span>Export as CSV</span>
          <input type="checkbox" ?checked=${b.exportCsv}
                 @change=${(e) => this.updateBehaviour({ exportCsv: e.target.checked })}>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Auto Refresh</div>
        <div class="toggle-row">
          <span>Auto Refresh</span>
          <input type="checkbox" ?checked=${b.autoRefresh}
                 @change=${(e) => this.updateBehaviour({ autoRefresh: e.target.checked })}>
        </div>
        ${b.autoRefresh ? html `
          <div class="field">
            <span class="field-label">Interval (seconds)</span>
            <select class="field-select" .value=${String(b.refreshInterval ?? 30)}
                    @change=${(e) => this.updateBehaviour({ refreshInterval: parseInt(e.target.value) })}>
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">1 min</option>
              <option value="300">5 min</option>
              <option value="600">10 min</option>
            </select>
          </div>
        ` : nothing}
      </div>
    `;
    }
    // --- Main render ---
    render() {
        if (!this.widgetConfig)
            return html `<div style="padding:12px;font-size:12px;color:#A8A29E;">No widget selected</div>`;
        return html `
      <div class="panel">
        <div class="tabs">
          <button class="tab ${this.activeTab === 'data' ? 'tab--active' : ''}" @click=${() => { this.activeTab = 'data'; }}>Data</button>
          <button class="tab ${this.activeTab === 'appearance' ? 'tab--active' : ''}" @click=${() => { this.activeTab = 'appearance'; }}>Appearance</button>
          <button class="tab ${this.activeTab === 'behaviour' ? 'tab--active' : ''}" @click=${() => { this.activeTab = 'behaviour'; }}>Behaviour</button>
        </div>
        <div class="tab-content">
          ${this.activeTab === 'data' ? this.renderDataTab() : nothing}
          ${this.activeTab === 'appearance' ? this.renderAppearanceTab() : nothing}
          ${this.activeTab === 'behaviour' ? this.renderBehaviourTab() : nothing}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzWidgetConfigPanel.prototype, "widgetConfig", void 0);
__decorate([
    property({ type: Array })
], PhzWidgetConfigPanel.prototype, "fields", void 0);
__decorate([
    property({ type: Array })
], PhzWidgetConfigPanel.prototype, "kpis", void 0);
__decorate([
    property({ type: Array })
], PhzWidgetConfigPanel.prototype, "metrics", void 0);
__decorate([
    property({ type: Number })
], PhzWidgetConfigPanel.prototype, "layoutColumns", void 0);
__decorate([
    state()
], PhzWidgetConfigPanel.prototype, "activeTab", void 0);
PhzWidgetConfigPanel = __decorate([
    safeCustomElement('phz-widget-config-panel')
], PhzWidgetConfigPanel);
export { PhzWidgetConfigPanel };
//# sourceMappingURL=phz-widget-config-panel.js.map