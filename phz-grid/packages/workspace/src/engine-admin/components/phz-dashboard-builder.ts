/**
 * @phozart/engine-admin — Dashboard Builder
 *
 * 3-panel: widget catalog (left) | canvas (center) | widget config (right).
 * Produces complete DashboardConfig with data bindings per widget type.
 * Embeddable component.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type {
  BIEngine, WidgetType, WidgetPlacement, WidgetConfig, DashboardConfig,
  KPICardWidgetConfig, ScorecardWidgetConfig, BarChartWidgetConfig,
  TrendLineWidgetConfig, BottomNWidgetConfig, StatusTableWidgetConfig,
  DrillLinkWidgetConfig,
} from '@phozart/engine';
import { widgetId, dashboardId } from '@phozart/engine';
import type { KPIId, ReportId, DataProductId } from '@phozart/engine';

interface CatalogItem { type: WidgetType; icon: string; label: string; description: string; }

const WIDGET_CATALOG: CatalogItem[] = [
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

const DEFAULT_CONFIGS: Record<WidgetType, (id: string) => WidgetConfig> = {
  'kpi-card': (id) => ({
    id: widgetId(id), type: 'kpi-card', kpiId: '' as KPIId, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as KPICardWidgetConfig),
  'kpi-scorecard': (id) => ({
    id: widgetId(id), type: 'kpi-scorecard', kpis: [] as KPIId[], expandable: false, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as ScorecardWidgetConfig),
  'bar-chart': (id) => ({
    id: widgetId(id), type: 'bar-chart', dataProductId: '' as DataProductId, metricField: '', dimension: '', rankOrder: 'desc', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as BarChartWidgetConfig),
  'trend-line': (id) => ({
    id: widgetId(id), type: 'trend-line', dataProductId: '' as DataProductId, metricField: '', periods: 12, showTarget: true, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as TrendLineWidgetConfig),
  'bottom-n': (id) => ({
    id: widgetId(id), type: 'bottom-n', dataProductId: '' as DataProductId, metricField: '', dimension: '', n: 5, direction: 'bottom', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as BottomNWidgetConfig),
  'pivot-table': (id) => ({
    id: widgetId(id), type: 'pivot-table', reportId: '' as ReportId, position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  }),
  'data-table': (id) => ({
    id: widgetId(id), type: 'data-table', reportId: '' as ReportId, position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  }),
  'status-table': (id) => ({
    id: widgetId(id), type: 'status-table', kpis: [] as KPIId[], entityDimension: '', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as StatusTableWidgetConfig),
  'drill-link': (id) => ({
    id: widgetId(id), type: 'drill-link', label: 'View Details', targetReportId: '' as ReportId, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as DrillLinkWidgetConfig),
  'slicer': (id) => ({
    id: widgetId(id), type: 'slicer', field: '', position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  } as any),
  'custom': (id) => ({
    id: widgetId(id), type: 'custom', renderer: '', position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  }),
};

@safeCustomElement('phz-dashboard-builder')
export class PhzDashboardBuilder extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
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
  ];

  @property({ type: Object }) engine?: BIEngine;
  @property({ type: String }) dashboardId?: string;
  @property({ type: Array }) data?: Record<string, unknown>[];

  @state() private dashboardName: string = 'New Dashboard';
  @state() private dashboardDescription: string = '';
  @state() private layoutColumns: number = 3;
  @state() private widgets: WidgetPlacement[] = [];
  @state() private selectedWidgetId?: string;

  private nextId = 1;

  /** Load an existing dashboard config into the builder */
  loadConfig(config: DashboardConfig) {
    this.dashboardName = config.name;
    this.dashboardDescription = config.description ?? '';
    this.layoutColumns = config.layout.columns;
    this.widgets = config.widgets.map(w => ({ ...w }));
    this.nextId = this.widgets.length + 1;
    this.selectedWidgetId = undefined;
  }

  private addWidget(item: CatalogItem) {
    const id = `w-${this.nextId++}`;
    const row = Math.floor(this.widgets.length / this.layoutColumns);
    const col = this.widgets.length % this.layoutColumns;
    const config = DEFAULT_CONFIGS[item.type](id);
    if ('title' in config) (config as any).title = item.label;

    const widget: WidgetPlacement = {
      id: widgetId(id),
      widgetType: item.type,
      config,
      position: { row, col, rowSpan: 1, colSpan: 4 },
    };
    this.widgets = [...this.widgets, widget];
    this.selectedWidgetId = id;
  }

  private removeWidget(id: string) {
    this.widgets = this.widgets.filter(w => (w.id as string) !== id);
    if (this.selectedWidgetId === id) this.selectedWidgetId = undefined;
  }

  private selectWidget(id: string) {
    this.selectedWidgetId = id;
  }

  private updateWidgetColSpan(id: string, colSpan: number) {
    this.widgets = this.widgets.map(w => (w.id as string) === id ? { ...w, position: { ...w.position, colSpan } } : w);
  }

  private updateWidgetConfig<T extends WidgetConfig>(id: string, updates: Partial<T>) {
    this.widgets = this.widgets.map(w => {
      if ((w.id as string) !== id) return w;
      return { ...w, config: { ...w.config, ...updates } as WidgetConfig };
    });
  }

  private get _hasData(): boolean { return !!this.data && this.data.length > 0; }
  private get _hasEngine(): boolean { return !!this.engine; }

  private getNumericFields(): string[] {
    if (!this._hasData) return [];
    const first = this.data![0];
    return Object.keys(first).filter(k => typeof first[k] === 'number');
  }

  private getStringFields(): string[] {
    if (!this._hasData) return [];
    const first = this.data![0];
    return Object.keys(first).filter(k => typeof first[k] === 'string');
  }

  private getKPIList() {
    return this.engine?.kpis.list() ?? [];
  }

  private getReportList() {
    return this.engine?.reports.list() ?? [];
  }

  /** Render an inline notice when a required dependency is not connected. */
  private renderMissingDep(label: string): ReturnType<typeof html> {
    return html`<p style="font-size:12px; color:#DC2626; background:#FEF2F2; border:1px solid #FECACA; border-radius:6px; padding:8px 10px; margin:4px 0;">
      ${label}
    </p>`;
  }

  /**
   * Validate the dashboard config before publishing.
   * Returns an array of validation error strings (empty = valid).
   */
  private validateDashboard(): string[] {
    const errors: string[] = [];
    if (!this.dashboardName.trim()) errors.push('Dashboard name is required.');
    if (this.widgets.length === 0) errors.push('Add at least one widget.');

    // Check for unbound widgets (required bindings missing)
    for (const w of this.widgets) {
      const c = w.config;
      switch (w.widgetType) {
        case 'kpi-card':
          if (!(c as KPICardWidgetConfig).kpiId) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a KPI binding.`);
          break;
        case 'bar-chart':
          if (!(c as BarChartWidgetConfig).metricField) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a metric field.`);
          if (!(c as BarChartWidgetConfig).dimension) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a dimension.`);
          break;
        case 'trend-line':
          if (!(c as TrendLineWidgetConfig).metricField) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a metric field.`);
          break;
        case 'bottom-n':
          if (!(c as BottomNWidgetConfig).metricField) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a metric field.`);
          if (!(c as BottomNWidgetConfig).dimension) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a dimension.`);
          break;
        case 'kpi-scorecard':
          if ((c as ScorecardWidgetConfig).kpis.length === 0) errors.push(`Widget "${w.widgetType}" (${w.id}) has no KPIs selected.`);
          break;
        case 'pivot-table':
        case 'data-table':
          if (!(c as any).reportId) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a report binding.`);
          break;
        case 'drill-link':
          if (!(c as DrillLinkWidgetConfig).targetReportId) errors.push(`Widget "${w.widgetType}" (${w.id}) is missing a target report.`);
          break;
      }
    }
    return errors;
  }

  private handlePublish() {
    const errors = this.validateDashboard();
    if (errors.length > 0) {
      this.dispatchEvent(new CustomEvent('dashboard-publish-error', {
        bubbles: true, composed: true,
        detail: { errors },
      }));
      return;
    }

    const now = Date.now();
    const config: DashboardConfig = {
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

  private getWidgetBindingSummary(w: WidgetPlacement): string {
    const c = w.config;
    switch (w.widgetType) {
      case 'kpi-card': return (c as KPICardWidgetConfig).kpiId ? String((c as KPICardWidgetConfig).kpiId) : '';
      case 'bar-chart': return (c as BarChartWidgetConfig).metricField || '';
      case 'trend-line': return (c as TrendLineWidgetConfig).metricField || '';
      case 'bottom-n': return (c as BottomNWidgetConfig).metricField || '';
      case 'kpi-scorecard': return `${(c as ScorecardWidgetConfig).kpis.length} KPIs`;
      case 'status-table': return (c as StatusTableWidgetConfig).entityDimension || '';
      case 'drill-link': return (c as DrillLinkWidgetConfig).label || '';
      default: return '';
    }
  }

  // --- Per-type config renderers ---

  private renderKpiCardConfig(w: WidgetPlacement) {
    const c = w.config as KPICardWidgetConfig;
    const kpis = this.getKPIList();
    return html`
      <div class="config-section">
        <p class="config-section-title">KPI Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">KPI</label>
          <select class="phz-ea-input"
                  .value=${c.kpiId as string}
                  @change=${(e: Event) => this.updateWidgetConfig<KPICardWidgetConfig>(w.id as string, { kpiId: (e.target as HTMLSelectElement).value as KPIId })}>
            <option value="">-- Select KPI --</option>
            ${kpis.map(k => html`<option value=${k.id} ?selected=${c.kpiId === k.id}>${k.name}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Card Style</label>
          <select class="phz-ea-input"
                  .value=${c.cardStyle ?? 'compact'}
                  @change=${(e: Event) => this.updateWidgetConfig<KPICardWidgetConfig>(w.id as string, { cardStyle: (e.target as HTMLSelectElement).value as any })}>
            <option value="compact">Compact</option>
            <option value="expanded">Expanded</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>
    `;
  }

  private renderScorecardConfig(w: WidgetPlacement) {
    const c = w.config as ScorecardWidgetConfig;
    const kpis = this.getKPIList();
    return html`
      <div class="config-section">
        <p class="config-section-title">KPI Selection</p>
        ${kpis.map(k => html`
          <label class="kpi-checkbox">
            <input type="checkbox"
                   ?checked=${c.kpis.includes(k.id)}
                   @change=${(e: Event) => {
                     const checked = (e.target as HTMLInputElement).checked;
                     const newKpis = checked ? [...c.kpis, k.id] : c.kpis.filter(id => id !== k.id);
                     this.updateWidgetConfig<ScorecardWidgetConfig>(w.id as string, { kpis: newKpis });
                   }}>
            ${k.name}
          </label>
        `)}
        <div class="toggle-row" style="margin-top: 8px;">
          <span>Expandable</span>
          <input type="checkbox" ?checked=${c.expandable}
                 @change=${(e: Event) => this.updateWidgetConfig<ScorecardWidgetConfig>(w.id as string, { expandable: (e.target as HTMLInputElement).checked })}>
        </div>
      </div>
    `;
  }

  private renderBarChartConfig(w: WidgetPlacement) {
    const c = w.config as BarChartWidgetConfig;
    const numericFields = this.getNumericFields();
    const stringFields = this.getStringFields();
    return html`
      <div class="config-section">
        <p class="config-section-title">Data Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Metric Field</label>
          <select class="phz-ea-input" .value=${c.metricField}
                  @change=${(e: Event) => this.updateWidgetConfig<BarChartWidgetConfig>(w.id as string, { metricField: (e.target as HTMLSelectElement).value })}>
            <option value="">-- Select --</option>
            ${numericFields.map(f => html`<option value=${f} ?selected=${c.metricField === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Dimension</label>
          <select class="phz-ea-input" .value=${c.dimension}
                  @change=${(e: Event) => this.updateWidgetConfig<BarChartWidgetConfig>(w.id as string, { dimension: (e.target as HTMLSelectElement).value })}>
            <option value="">-- Select --</option>
            ${stringFields.map(f => html`<option value=${f} ?selected=${c.dimension === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Sort Order</label>
          <select class="phz-ea-input" .value=${c.rankOrder ?? 'desc'}
                  @change=${(e: Event) => this.updateWidgetConfig<BarChartWidgetConfig>(w.id as string, { rankOrder: (e.target as HTMLSelectElement).value as any })}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    `;
  }

  private renderTrendLineConfig(w: WidgetPlacement) {
    const c = w.config as TrendLineWidgetConfig;
    const numericFields = this.getNumericFields();
    return html`
      <div class="config-section">
        <p class="config-section-title">Data Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Metric Field</label>
          <select class="phz-ea-input" .value=${c.metricField}
                  @change=${(e: Event) => this.updateWidgetConfig<TrendLineWidgetConfig>(w.id as string, { metricField: (e.target as HTMLSelectElement).value })}>
            <option value="">-- Select --</option>
            ${numericFields.map(f => html`<option value=${f} ?selected=${c.metricField === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Periods</label>
          <input type="number" class="phz-ea-input" .value=${String(c.periods)} min="3" max="36"
                 @input=${(e: Event) => this.updateWidgetConfig<TrendLineWidgetConfig>(w.id as string, { periods: parseInt((e.target as HTMLInputElement).value) || 12 })}>
        </div>
        <div class="toggle-row">
          <span>Show Target Line</span>
          <input type="checkbox" ?checked=${c.showTarget !== false}
                 @change=${(e: Event) => this.updateWidgetConfig<TrendLineWidgetConfig>(w.id as string, { showTarget: (e.target as HTMLInputElement).checked })}>
        </div>
      </div>
    `;
  }

  private renderBottomNConfig(w: WidgetPlacement) {
    const c = w.config as BottomNWidgetConfig;
    const numericFields = this.getNumericFields();
    const stringFields = this.getStringFields();
    return html`
      <div class="config-section">
        <p class="config-section-title">Data Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Metric Field</label>
          <select class="phz-ea-input" .value=${c.metricField}
                  @change=${(e: Event) => this.updateWidgetConfig<BottomNWidgetConfig>(w.id as string, { metricField: (e.target as HTMLSelectElement).value })}>
            <option value="">-- Select --</option>
            ${numericFields.map(f => html`<option value=${f} ?selected=${c.metricField === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Dimension</label>
          <select class="phz-ea-input" .value=${c.dimension}
                  @change=${(e: Event) => this.updateWidgetConfig<BottomNWidgetConfig>(w.id as string, { dimension: (e.target as HTMLSelectElement).value })}>
            <option value="">-- Select --</option>
            ${stringFields.map(f => html`<option value=${f} ?selected=${c.dimension === f}>${f}</option>`)}
          </select>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Count (N)</label>
          <input type="number" class="phz-ea-input" .value=${String(c.n)} min="1" max="50"
                 @input=${(e: Event) => this.updateWidgetConfig<BottomNWidgetConfig>(w.id as string, { n: parseInt((e.target as HTMLInputElement).value) || 5 })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Direction</label>
          <select class="phz-ea-input" .value=${c.direction ?? 'bottom'}
                  @change=${(e: Event) => this.updateWidgetConfig<BottomNWidgetConfig>(w.id as string, { direction: (e.target as HTMLSelectElement).value as any })}>
            <option value="bottom">Bottom (worst)</option>
            <option value="top">Top (best)</option>
          </select>
        </div>
      </div>
    `;
  }

  private renderStatusTableConfig(w: WidgetPlacement) {
    const c = w.config as StatusTableWidgetConfig;
    const kpis = this.getKPIList();
    const stringFields = this.getStringFields();
    return html`
      <div class="config-section">
        <p class="config-section-title">Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Entity Dimension</label>
          <select class="phz-ea-input" .value=${c.entityDimension}
                  @change=${(e: Event) => this.updateWidgetConfig<StatusTableWidgetConfig>(w.id as string, { entityDimension: (e.target as HTMLSelectElement).value })}>
            <option value="">-- Select --</option>
            ${stringFields.map(f => html`<option value=${f} ?selected=${c.entityDimension === f}>${f}</option>`)}
          </select>
        </div>
        <p class="config-section-title" style="margin-top:12px;">KPIs</p>
        ${kpis.map(k => html`
          <label class="kpi-checkbox">
            <input type="checkbox"
                   ?checked=${c.kpis.includes(k.id)}
                   @change=${(e: Event) => {
                     const checked = (e.target as HTMLInputElement).checked;
                     const newKpis = checked ? [...c.kpis, k.id] : c.kpis.filter(id => id !== k.id);
                     this.updateWidgetConfig<StatusTableWidgetConfig>(w.id as string, { kpis: newKpis });
                   }}>
            ${k.name}
          </label>
        `)}
      </div>
    `;
  }

  private renderDrillLinkConfig(w: WidgetPlacement) {
    const c = w.config as DrillLinkWidgetConfig;
    const reports = this.getReportList();
    return html`
      <div class="config-section">
        <p class="config-section-title">Link Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Label</label>
          <input class="phz-ea-input" .value=${c.label}
                 @input=${(e: Event) => this.updateWidgetConfig<DrillLinkWidgetConfig>(w.id as string, { label: (e.target as HTMLInputElement).value })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Target Report</label>
          <select class="phz-ea-input" .value=${c.targetReportId as string}
                  @change=${(e: Event) => this.updateWidgetConfig<DrillLinkWidgetConfig>(w.id as string, { targetReportId: (e.target as HTMLSelectElement).value as ReportId })}>
            <option value="">-- Select --</option>
            ${reports.map(r => html`<option value=${r.id} ?selected=${(c.targetReportId as string) === (r.id as string)}>${r.name ?? r.id}</option>`)}
          </select>
        </div>
      </div>
    `;
  }

  private renderReportConfig(w: WidgetPlacement) {
    const c = w.config as any;
    const reports = this.getReportList();
    return html`
      <div class="config-section">
        <p class="config-section-title">Report Binding</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Report</label>
          <select class="phz-ea-input" .value=${c.reportId as string ?? ''}
                  @change=${(e: Event) => this.updateWidgetConfig(w.id as string, { reportId: (e.target as HTMLSelectElement).value as ReportId })}>
            <option value="">-- Select --</option>
            ${reports.map(r => html`<option value=${r.id} ?selected=${(c.reportId as string) === (r.id as string)}>${r.name ?? r.id}</option>`)}
          </select>
        </div>
      </div>
    `;
  }

  private renderWidgetTypeConfig(w: WidgetPlacement) {
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
      default: return html`<p style="font-size:13px; color:#78716C;">No configuration available for this widget type.</p>`;
    }
  }

  render() {
    const selectedWidget = this.widgets.find(w => (w.id as string) === this.selectedWidgetId);
    const catalogItem = selectedWidget ? WIDGET_CATALOG.find(c => c.type === selectedWidget.widgetType) : null;

    return html`
      <div class="builder" role="region" aria-label="Dashboard Builder">
        <div class="catalog">
          <p class="phz-ea-panel-header">Widget Catalog</p>
          <div class="catalog-tiles">
            ${WIDGET_CATALOG.map(item => html`
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
                     @input=${(e: Event) => { this.dashboardName = (e.target as HTMLInputElement).value; }}>
              <input class="phz-ea-input" style="font-size:12px; border:none; padding:0; background:none; color:#78716C; width:100%; margin-top:2px;"
                     placeholder="Description (optional)"
                     .value=${this.dashboardDescription}
                     @input=${(e: Event) => { this.dashboardDescription = (e.target as HTMLInputElement).value; }}>
            </div>
            <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handlePublish}>Publish</button>
          </div>
          <div class="canvas-grid" style="margin-top:12px;">
            ${this.widgets.length === 0
              ? html`<div style="grid-column: span 12; text-align: center; color: #A8A29E; padding: 40px; font-size: 13px;">
                  Click widgets from the catalog to add them here
                </div>`
              : this.widgets.map(w => {
                  const cat = WIDGET_CATALOG.find(c => c.type === w.widgetType);
                  const binding = this.getWidgetBindingSummary(w);
                  const isBound = !!binding && binding !== '0 KPIs';
                  return html`
                    <div class="canvas-widget ${(w.id as string) === this.selectedWidgetId ? 'canvas-widget--selected' : ''} ${isBound ? 'canvas-widget--bound' : ''}"
                         style="grid-column: span ${w.position.colSpan};"
                         @click=${() => this.selectWidget(w.id as string)}>
                      <span class="canvas-widget__icon">${cat?.icon ?? '?'}</span>
                      <span class="canvas-widget__label">${cat?.label ?? w.widgetType} (${w.position.colSpan} col)</span>
                      ${binding ? html`<span class="canvas-widget__binding">${binding}</span>` : nothing}
                      <button class="canvas-widget__remove" @click=${(e: Event) => { e.stopPropagation(); this.removeWidget(w.id as string); }}>&times;</button>
                    </div>
                  `;
                })}
          </div>

          ${this.data && this.engine && this.widgets.length > 0 ? html`
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
                } as DashboardConfig}
                .engine=${this.engine}
                .data=${this.data}
              ></phz-dashboard>
            </div>
          ` : nothing}
        </div>

        <div class="config-panel">
          ${selectedWidget ? html`
            <p class="phz-ea-panel-header">Widget Config</p>
            <div class="phz-ea-field">
              <label class="phz-ea-label">Type</label>
              <span style="font-size:13px; color:#44403C;">${catalogItem?.icon} ${catalogItem?.label ?? selectedWidget.widgetType}</span>
            </div>
            <div class="phz-ea-field">
              <label class="phz-ea-label">Column Span</label>
              <div class="col-span-group">
                ${[3, 4, 6, 8, 12].map(s => html`
                  <button class="phz-ea-chip ${selectedWidget.position.colSpan === s ? 'phz-ea-chip--active' : ''}"
                          @click=${() => this.updateWidgetColSpan(selectedWidget.id as string, s)}>${s}</button>
                `)}
              </div>
            </div>
            ${this.renderWidgetTypeConfig(selectedWidget)}
          ` : html`<p class="empty-config">Select a widget on the canvas to configure it</p>`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-dashboard-builder': PhzDashboardBuilder; }
}
