/**
 * @phozart/phz-engine-admin — Dashboard Builder
 *
 * 3-panel: widget catalog (left) | canvas (center) | widget config (right).
 * Produces complete DashboardConfig with data bindings per widget type.
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
import { widgetId, dashboardId } from '@phozart/phz-engine';
const WIDGET_CATALOG = [
    { type: 'kpi-card', icon: '📊', label: 'KPI Card', description: 'Single metric with status' },
    { type: 'kpi-scorecard', icon: '📋', label: 'Scorecard', description: 'KPI matrix with breakdowns' },
    { type: 'bar-chart', icon: '📶', label: 'Bar Chart', description: 'Ranked horizontal bars' },
    { type: 'trend-line', icon: '📈', label: 'Trend Line', description: 'Time series with target' },
    { type: 'bottom-n', icon: '🔻', label: 'Bottom N', description: 'Worst/best performers' },
    { type: 'pivot-table', icon: '🔄', label: 'Pivot Table', description: 'Cross-tabulation' },
    { type: 'data-table', icon: '📑', label: 'Data Table', description: 'Full data grid' },
    { type: 'status-table', icon: '🚦', label: 'Status Table', description: 'Entity status matrix' },
    { type: 'drill-link', icon: '🔗', label: 'Drill Link', description: 'Navigation button' },
    { type: 'custom', icon: '⚙️', label: 'Custom', description: 'Custom renderer' },
];
const DEFAULT_CONFIGS = {
    'kpi-card': (id) => ({
        id: widgetId(id), type: 'kpi-card', kpiId: '', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'kpi-scorecard': (id) => ({
        id: widgetId(id), type: 'kpi-scorecard', kpis: [], expandable: false, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'bar-chart': (id) => ({
        id: widgetId(id), type: 'bar-chart', dataProductId: '', metricField: '', dimension: '', rankOrder: 'desc', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'trend-line': (id) => ({
        id: widgetId(id), type: 'trend-line', dataProductId: '', metricField: '', periods: 12, showTarget: true, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'bottom-n': (id) => ({
        id: widgetId(id), type: 'bottom-n', dataProductId: '', metricField: '', dimension: '', n: 5, direction: 'bottom', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'pivot-table': (id) => ({
        id: widgetId(id), type: 'pivot-table', reportId: '', position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'data-table': (id) => ({
        id: widgetId(id), type: 'data-table', reportId: '', position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'status-table': (id) => ({
        id: widgetId(id), type: 'status-table', kpis: [], entityDimension: '', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'drill-link': (id) => ({
        id: widgetId(id), type: 'drill-link', label: 'View Details', targetReportId: '', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
    }),
    'custom': (id) => ({
        id: widgetId(id), type: 'custom', renderer: '', position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
    }),
};
let PhzDashboardBuilder = class PhzDashboardBuilder extends LitElement {
    constructor() {
        super(...arguments);
        this.dashboardName = 'New Dashboard';
        this.dashboardDescription = '';
        this.layoutColumns = 3;
        this.widgets = [];
        this.nextId = 1;
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      .builder { display: grid; grid-template-columns: 220px 1fr 300px; min-height: 500px; border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }
      .catalog { padding: 12px; background: #FAFAF9; border-right: 1px solid #E7E5E4; overflow-y: auto; }
      .canvas { padding: 16px; overflow-y: auto; }
      .config-panel { padding: 16px; border-left: 1px solid #E7E5E4; overflow-y: auto; }
      .canvas-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 8px; min-height: 300px; }
      .canvas-widget {
        border: 2px dashed #D6D3D1; border-radius: 8px; padding: 12px; cursor: pointer;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        min-height: 80px; transition: all 0.15s ease; position: relative;
      }
      .canvas-widget:hover { border-color: #3B82F6; background: #EFF6FF; }
      .canvas-widget--selected { border-color: #3B82F6; border-style: solid; background: #EFF6FF; }
      .canvas-widget--bound { border-color: #16A34A; border-style: solid; }
      .canvas-widget__icon { font-size: 20px; }
      .canvas-widget__label { font-size: 11px; color: #78716C; text-align: center; }
      .canvas-widget__binding { font-size: 10px; color: #16A34A; font-weight: 600; }
      .canvas-widget__remove {
        position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%;
        border: none; background: #DC2626; color: white; font-size: 12px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s;
      }
      .canvas-widget:hover .canvas-widget__remove { opacity: 1; }
      .catalog-tiles { display: flex; flex-direction: column; gap: 6px; }
      .dashboard-name { padding: 8px 16px; border-bottom: 1px solid #E7E5E4; display: flex; align-items: center; justify-content: space-between; }
      .col-span-group { display: flex; gap: 4px; flex-wrap: wrap; }
      .empty-config { color: #78716C; font-size: 13px; text-align: center; margin-top: 40px; }
      .config-section { margin-bottom: 16px; }
      .config-section-title { font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 8px 0; }
      .kpi-checkbox { display: flex; align-items: center; gap: 6px; padding: 4px 0; font-size: 13px; }
      .kpi-checkbox input { accent-color: #3B82F6; }
      .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; font-size: 13px; }
      .preview-section { margin-top: 16px; border-top: 1px solid #E7E5E4; padding-top: 16px; }
      .preview-label { font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }

      /* ── Touch targets ── */
      .phz-ea-tile { min-height: 44px; }
      .canvas-widget__remove { width: 44px; height: 44px; font-size: 16px; top: 0; right: 0; border-radius: 0 8px 0 8px; }

      /* ── Responsive: collapse 3-panel to stacked below 768px ── */
      @media (max-width: 768px) {
        .builder {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr auto;
        }
        .catalog {
          border-right: none;
          border-bottom: 1px solid #E7E5E4;
          max-height: 180px;
          overflow-y: auto;
        }
        .catalog-tiles {
          flex-direction: row;
          flex-wrap: wrap;
          gap: 8px;
        }
        .config-panel {
          border-left: none;
          border-top: 1px solid #E7E5E4;
          max-height: 300px;
        }
        .canvas-grid {
          grid-template-columns: repeat(6, 1fr);
        }
      }

      @media (max-width: 576px) {
        .canvas-grid {
          grid-template-columns: 1fr;
        }
        .col-span-group { display: none; }
        .dashboard-name { flex-direction: column; align-items: stretch; gap: 8px; }
      }
    `,
    ]; }
    /** Load an existing dashboard config into the builder */
    loadConfig(config) {
        this.dashboardName = config.name;
        this.dashboardDescription = config.description ?? '';
        this.layoutColumns = config.layout.columns;
        this.widgets = config.widgets.map(w => ({ ...w }));
        this.nextId = this.widgets.length + 1;
        this.selectedWidgetId = undefined;
    }
    addWidget(item) {
        const id = `w-${this.nextId++}`;
        const row = Math.floor(this.widgets.length / this.layoutColumns);
        const col = this.widgets.length % this.layoutColumns;
        const config = DEFAULT_CONFIGS[item.type](id);
        if ('title' in config)
            config.title = item.label;
        const widget = {
            id: widgetId(id),
            widgetType: item.type,
            config,
            position: { row, col, rowSpan: 1, colSpan: 4 },
        };
        this.widgets = [...this.widgets, widget];
        this.selectedWidgetId = id;
    }
    removeWidget(id) {
        this.widgets = this.widgets.filter(w => w.id !== id);
        if (this.selectedWidgetId === id)
            this.selectedWidgetId = undefined;
    }
    selectWidget(id) {
        this.selectedWidgetId = id;
    }
    updateWidgetColSpan(id, colSpan) {
        this.widgets = this.widgets.map(w => w.id === id ? { ...w, position: { ...w.position, colSpan } } : w);
    }
    updateWidgetConfig(id, updates) {
        this.widgets = this.widgets.map(w => {
            if (w.id !== id)
                return w;
            return { ...w, config: { ...w.config, ...updates } };
        });
    }
    get _hasData() { return !!this.data && this.data.length > 0; }
    get _hasEngine() { return !!this.engine; }
    getNumericFields() {
        if (!this._hasData)
            return [];
        const first = this.data[0];
        return Object.keys(first).filter(k => typeof first[k] === 'number');
    }
    getStringFields() {
        if (!this._hasData)
            return [];
        const first = this.data[0];
        return Object.keys(first).filter(k => typeof first[k] === 'string');
    }
    getKPIList() {
        return this.engine?.kpis.list() ?? [];
    }
    getReportList() {
        return this.engine?.reports.list() ?? [];
    }
    /** Render an inline notice when a required dependency is not connected. */
    renderMissingDep(label) {
        return html `<p style="font-size:12px; color:#DC2626; background:#FEF2F2; border:1px solid #FECACA; border-radius:6px; padding:8px 10px; margin:4px 0;">
      ${label}
    </p>`;
    }
    /**
     * Validate the dashboard config before publishing.
     * Returns an array of validation error strings (empty = valid).
     */
    validateDashboard() {
        const errors = [];
        if (!this.dashboardName.trim())
            errors.push('Dashboard name is required.');
        if (this.widgets.length === 0)
            errors.push('Add at least one widget.');
        // Check for unbound widgets (required bindings missing)
        for (const w of this.widgets) {
            const c = w.config;
            switch (w.widgetType) {
                case 'kpi-card':
                    if (!c.kpiId)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a KPI binding.`);
                    break;
                case 'bar-chart':
                    if (!c.metricField)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a metric field.`);
                    if (!c.dimension)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a dimension.`);
                    break;
                case 'trend-line':
                    if (!c.metricField)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a metric field.`);
                    break;
                case 'bottom-n':
                    if (!c.metricField)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a metric field.`);
                    if (!c.dimension)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a dimension.`);
                    break;
                case 'kpi-scorecard':
                    if (c.kpis.length === 0)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) has no KPIs selected.`);
                    break;
                case 'pivot-table':
                case 'data-table':
                    if (!c.reportId)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a report binding.`);
                    break;
                case 'drill-link':
                    if (!c.targetReportId)
                        errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a target report.`);
                    break;
            }
        }
        return errors;
    }
    handlePublish() {
        const errors = this.validateDashboard();
        if (errors.length > 0) {
            this.dispatchEvent(new CustomEvent('dashboard-publish-error', {
                bubbles: true, composed: true,
                detail: { errors },
            }));
            return;
        }
        const now = Date.now();
        const config = {
            id: dashboardId(this.dashboardId ?? `dash-${now}`),
            name: this.dashboardName,
            description: this.dashboardDescription || undefined,
            layout: { columns: this.layoutColumns, rowHeight: 180, gap: 16, responsive: true },
            widgets: this.widgets,
            created: now,
            updated: now,
        };
        this.dispatchEvent(new CustomEvent('dashboard-save', {
            bubbles: true, composed: true,
            detail: { config },
        }));
    }
    getWidgetBindingSummary(w) {
        const c = w.config;
        switch (w.widgetType) {
            case 'kpi-card': return c.kpiId ? String(c.kpiId) : '';
            case 'bar-chart': return c.metricField || '';
            case 'trend-line': return c.metricField || '';
            case 'bottom-n': return c.metricField || '';
            case 'kpi-scorecard': return `${c.kpis.length} KPIs`;
            case 'status-table': return c.entityDimension || '';
            case 'drill-link': return c.label || '';
            default: return '';
        }
    }
    // --- Per-type config renderers ---
    renderKpiCardConfig(w) {
        const c = w.config;
        const kpis = this.getKPIList();
        return html `
      <div class="config-section">
        <p class="config-section-title">KPI Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">KPI</label>
          <select class="phz-ea-input"
                  .value=${c.kpiId}
                  @change=${(e) => this.updateWidgetConfig(w.id, { kpiId: e.target.value })}>
            <option value="">-- Select KPI --</option>
            ${kpis.map(k => html `<option value=${k.id} ?selected=${c.kpiId === k.id}>${k.name}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Card Style</label>
          <select class="phz-ea-input"
                  .value=${c.cardStyle ?? 'compact'}
                  @change=${(e) => this.updateWidgetConfig(w.id, { cardStyle: e.target.value })}>
            <option value="compact">Compact</option>
            <option value="expanded">Expanded</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>
    `;
    }
    renderScorecardConfig(w) {
        const c = w.config;
        const kpis = this.getKPIList();
        return html `
      <div class="config-section">
        <p class="config-section-title">KPI Selection</p>
        ${kpis.map(k => html `
          <label class="kpi-checkbox">
            <input type="checkbox"
                   ?checked=${c.kpis.includes(k.id)}
                   @change=${(e) => {
            const checked = e.target.checked;
            const newKpis = checked ? [...c.kpis, k.id] : c.kpis.filter(id => id !== k.id);
            this.updateWidgetConfig(w.id, { kpis: newKpis });
        }}>
            ${k.name}
          </label>
        `)}
        <div class="toggle-row" style="margin-top: 8px;">
          <span>Expandable</span>
          <input type="checkbox" ?checked=${c.expandable}
                 @change=${(e) => this.updateWidgetConfig(w.id, { expandable: e.target.checked })}>
        </div>
      </div>
    `;
    }
    renderBarChartConfig(w) {
        const c = w.config;
        const numericFields = this.getNumericFields();
        const stringFields = this.getStringFields();
        return html `
      <div class="config-section">
        <p class="config-section-title">Data Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Metric Field</label>
          <select class="phz-ea-input" .value=${c.metricField}
                  @change=${(e) => this.updateWidgetConfig(w.id, { metricField: e.target.value })}>
            <option value="">-- Select --</option>
            ${numericFields.map(f => html `<option value=${f} ?selected=${c.metricField === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Dimension</label>
          <select class="phz-ea-input" .value=${c.dimension}
                  @change=${(e) => this.updateWidgetConfig(w.id, { dimension: e.target.value })}>
            <option value="">-- Select --</option>
            ${stringFields.map(f => html `<option value=${f} ?selected=${c.dimension === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Sort Order</label>
          <select class="phz-ea-input" .value=${c.rankOrder ?? 'desc'}
                  @change=${(e) => this.updateWidgetConfig(w.id, { rankOrder: e.target.value })}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    `;
    }
    renderTrendLineConfig(w) {
        const c = w.config;
        const numericFields = this.getNumericFields();
        return html `
      <div class="config-section">
        <p class="config-section-title">Data Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Metric Field</label>
          <select class="phz-ea-input" .value=${c.metricField}
                  @change=${(e) => this.updateWidgetConfig(w.id, { metricField: e.target.value })}>
            <option value="">-- Select --</option>
            ${numericFields.map(f => html `<option value=${f} ?selected=${c.metricField === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Periods</label>
          <input type="number" class="phz-ea-input" .value=${String(c.periods)} min="3" max="36"
                 @input=${(e) => this.updateWidgetConfig(w.id, { periods: parseInt(e.target.value) || 12 })}>
        </div>
        <div class="toggle-row">
          <span>Show Target Line</span>
          <input type="checkbox" ?checked=${c.showTarget !== false}
                 @change=${(e) => this.updateWidgetConfig(w.id, { showTarget: e.target.checked })}>
        </div>
      </div>
    `;
    }
    renderBottomNConfig(w) {
        const c = w.config;
        const numericFields = this.getNumericFields();
        const stringFields = this.getStringFields();
        return html `
      <div class="config-section">
        <p class="config-section-title">Data Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Metric Field</label>
          <select class="phz-ea-input" .value=${c.metricField}
                  @change=${(e) => this.updateWidgetConfig(w.id, { metricField: e.target.value })}>
            <option value="">-- Select --</option>
            ${numericFields.map(f => html `<option value=${f} ?selected=${c.metricField === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Dimension</label>
          <select class="phz-ea-input" .value=${c.dimension}
                  @change=${(e) => this.updateWidgetConfig(w.id, { dimension: e.target.value })}>
            <option value="">-- Select --</option>
            ${stringFields.map(f => html `<option value=${f} ?selected=${c.dimension === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Count (N)</label>
          <input type="number" class="phz-ea-input" .value=${String(c.n)} min="1" max="50"
                 @input=${(e) => this.updateWidgetConfig(w.id, { n: parseInt(e.target.value) || 5 })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Direction</label>
          <select class="phz-ea-input" .value=${c.direction ?? 'bottom'}
                  @change=${(e) => this.updateWidgetConfig(w.id, { direction: e.target.value })}>
            <option value="bottom">Bottom (worst)</option>
            <option value="top">Top (best)</option>
          </select>
        </div>
      </div>
    `;
    }
    renderStatusTableConfig(w) {
        const c = w.config;
        const kpis = this.getKPIList();
        const stringFields = this.getStringFields();
        return html `
      <div class="config-section">
        <p class="config-section-title">Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Entity Dimension</label>
          <select class="phz-ea-input" .value=${c.entityDimension}
                  @change=${(e) => this.updateWidgetConfig(w.id, { entityDimension: e.target.value })}>
            <option value="">-- Select --</option>
            ${stringFields.map(f => html `<option value=${f} ?selected=${c.entityDimension === f}>${f}</option>`)}
          </select>
        </div>
        <p class="config-section-title" style="margin-top:12px;">KPIs</p>
        ${kpis.map(k => html `
          <label class="kpi-checkbox">
            <input type="checkbox"
                   ?checked=${c.kpis.includes(k.id)}
                   @change=${(e) => {
            const checked = e.target.checked;
            const newKpis = checked ? [...c.kpis, k.id] : c.kpis.filter(id => id !== k.id);
            this.updateWidgetConfig(w.id, { kpis: newKpis });
        }}>
            ${k.name}
          </label>
        `)}
      </div>
    `;
    }
    renderDrillLinkConfig(w) {
        const c = w.config;
        const reports = this.getReportList();
        return html `
      <div class="config-section">
        <p class="config-section-title">Link Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Label</label>
          <input class="phz-ea-input" .value=${c.label}
                 @input=${(e) => this.updateWidgetConfig(w.id, { label: e.target.value })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Target Report</label>
          <select class="phz-ea-input" .value=${c.targetReportId}
                  @change=${(e) => this.updateWidgetConfig(w.id, { targetReportId: e.target.value })}>
            <option value="">-- Select --</option>
            ${reports.map(r => html `<option value=${r.id} ?selected=${c.targetReportId === r.id}>${r.name ?? r.id}</option>`)}
          </select>
        </div>
      </div>
    `;
    }
    renderReportConfig(w) {
        const c = w.config;
        const reports = this.getReportList();
        return html `
      <div class="config-section">
        <p class="config-section-title">Report Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Report</label>
          <select class="phz-ea-input" .value=${c.reportId ?? ''}
                  @change=${(e) => this.updateWidgetConfig(w.id, { reportId: e.target.value })}>
            <option value="">-- Select --</option>
            ${reports.map(r => html `<option value=${r.id} ?selected=${c.reportId === r.id}>${r.name ?? r.id}</option>`)}
          </select>
        </div>
      </div>
    `;
    }
    renderWidgetTypeConfig(w) {
        switch (w.widgetType) {
            case 'kpi-card': return this.renderKpiCardConfig(w);
            case 'kpi-scorecard': return this.renderScorecardConfig(w);
            case 'bar-chart': return this.renderBarChartConfig(w);
            case 'trend-line': return this.renderTrendLineConfig(w);
            case 'bottom-n': return this.renderBottomNConfig(w);
            case 'status-table': return this.renderStatusTableConfig(w);
            case 'drill-link': return this.renderDrillLinkConfig(w);
            case 'pivot-table':
            case 'data-table': return this.renderReportConfig(w);
            default: return html `<p style="font-size:13px; color:#78716C;">No configuration available for this widget type.</p>`;
        }
    }
    render() {
        const selectedWidget = this.widgets.find(w => w.id === this.selectedWidgetId);
        const catalogItem = selectedWidget ? WIDGET_CATALOG.find(c => c.type === selectedWidget.widgetType) : null;
        return html `
      <div class="builder" role="region" aria-label="Dashboard Builder">
        <div class="catalog">
          <p class="phz-ea-panel-header">Widget Catalog</p>
          <div class="catalog-tiles">
            ${WIDGET_CATALOG.map(item => html `
              <div class="phz-ea-tile" @click=${() => this.addWidget(item)}>
                <div class="phz-ea-tile__icon">${item.icon}</div>
                <div class="phz-ea-tile__label">${item.label}</div>
                <div class="phz-ea-tile__desc">${item.description}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="canvas">
          <div class="dashboard-name">
            <div style="flex:1;">
              <input class="phz-ea-input" style="font-size:15px; font-weight:700; border:none; padding:0; background:none; width:100%;"
                     .value=${this.dashboardName}
                     @input=${(e) => { this.dashboardName = e.target.value; }}>
              <input class="phz-ea-input" style="font-size:12px; border:none; padding:0; background:none; color:#78716C; width:100%; margin-top:2px;"
                     placeholder="Description (optional)"
                     .value=${this.dashboardDescription}
                     @input=${(e) => { this.dashboardDescription = e.target.value; }}>
            </div>
            <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handlePublish}>Publish</button>
          </div>
          <div class="canvas-grid" style="margin-top:12px;">
            ${this.widgets.length === 0
            ? html `<div style="grid-column: span 12; text-align: center; color: #A8A29E; padding: 40px; font-size: 13px;">
                  Click widgets from the catalog to add them here
                </div>`
            : this.widgets.map(w => {
                const cat = WIDGET_CATALOG.find(c => c.type === w.widgetType);
                const binding = this.getWidgetBindingSummary(w);
                const isBound = !!binding && binding !== '0 KPIs';
                return html `
                    <div class="canvas-widget ${w.id === this.selectedWidgetId ? 'canvas-widget--selected' : ''} ${isBound ? 'canvas-widget--bound' : ''}"
                         style="grid-column: span ${w.position.colSpan};"
                         @click=${() => this.selectWidget(w.id)}>
                      <span class="canvas-widget__icon">${cat?.icon ?? '?'}</span>
                      <span class="canvas-widget__label">${cat?.label ?? w.widgetType} (${w.position.colSpan} col)</span>
                      ${binding ? html `<span class="canvas-widget__binding">${binding}</span>` : nothing}
                      <button class="canvas-widget__remove" @click=${(e) => { e.stopPropagation(); this.removeWidget(w.id); }}>&times;</button>
                    </div>
                  `;
            })}
          </div>

          ${this.data && this.engine && this.widgets.length > 0 ? html `
            <div class="preview-section">
              <p class="preview-label">Live Preview</p>
              <phz-dashboard
                .config=${{
            id: dashboardId('preview'),
            name: this.dashboardName,
            description: this.dashboardDescription,
            layout: { columns: this.layoutColumns, rowHeight: 180, gap: 16, responsive: true },
            widgets: this.widgets,
            created: Date.now(),
            updated: Date.now(),
        }}
                .engine=${this.engine}
                .data=${this.data}
              ></phz-dashboard>
            </div>
          ` : nothing}
        </div>

        <div class="config-panel">
          ${selectedWidget ? html `
            <p class="phz-ea-panel-header">Widget Config</p>
            <div class="phz-ea-field">
              <label class="phz-ea-label">Type</label>
              <span style="font-size:13px; color:#44403C;">${catalogItem?.icon} ${catalogItem?.label ?? selectedWidget.widgetType}</span>
            </div>
            <div class="phz-ea-field">
              <label class="phz-ea-label">Column Span</label>
              <div class="col-span-group">
                ${[3, 4, 6, 8, 12].map(s => html `
                  <button class="phz-ea-chip ${selectedWidget.position.colSpan === s ? 'phz-ea-chip--active' : ''}"
                          @click=${() => this.updateWidgetColSpan(selectedWidget.id, s)}>${s}</button>
                `)}
              </div>
            </div>
            ${this.renderWidgetTypeConfig(selectedWidget)}
          ` : html `<p class="empty-config">Select a widget on the canvas to configure it</p>`}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzDashboardBuilder.prototype, "engine", void 0);
__decorate([
    property({ type: String })
], PhzDashboardBuilder.prototype, "dashboardId", void 0);
__decorate([
    property({ type: Array })
], PhzDashboardBuilder.prototype, "data", void 0);
__decorate([
    state()
], PhzDashboardBuilder.prototype, "dashboardName", void 0);
__decorate([
    state()
], PhzDashboardBuilder.prototype, "dashboardDescription", void 0);
__decorate([
    state()
], PhzDashboardBuilder.prototype, "layoutColumns", void 0);
__decorate([
    state()
], PhzDashboardBuilder.prototype, "widgets", void 0);
__decorate([
    state()
], PhzDashboardBuilder.prototype, "selectedWidgetId", void 0);
PhzDashboardBuilder = __decorate([
    safeCustomElement('phz-dashboard-builder')
], PhzDashboardBuilder);
export { PhzDashboardBuilder };
//# sourceMappingURL=phz-dashboard-builder.js.map