/**
 * @phozart/phz-engine-admin — Dashboard Studio
 *
 * MicroStrategy-inspired integrated dashboard editor.
 * Single view: toolbar + global filters + left data panel + live canvas + right config panel.
 * Uses EnhancedWidgetConfig for rich per-widget configuration.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type {
  BIEngine, WidgetType, WidgetPlacement, WidgetConfig, DashboardConfig,
  KPICardWidgetConfig, ScorecardWidgetConfig, BarChartWidgetConfig,
  TrendLineWidgetConfig, BottomNWidgetConfig, StatusTableWidgetConfig,
  DrillLinkWidgetConfig, ResolvedWidgetProps, KPIScoreProvider,
  EnhancedWidgetConfig, EnhancedDashboardConfig, DashboardWidgetPlacement,
  GlobalFilter,
} from '@phozart/phz-engine';
import {
  widgetId, dashboardId, resolveDashboardWidgets, createDefaultScoreProvider,
  SMART_DEFAULTS, processWidgetData, isEnhancedDashboard,
  createEnhancedDashboardConfig, serializeDashboard, DEFAULT_DASHBOARD_THEME,
} from '@phozart/phz-engine';
import type { KPIId, ReportId, DataProductId, WidgetId } from '@phozart/phz-engine';

import type {
  DashboardDataModel, DataModelField, ParameterDef,
  CalculatedFieldDef, ParameterId, CalculatedFieldId,
} from '@phozart/phz-engine';
import { createDashboardDataModelStore, parameterId, calculatedFieldId } from '@phozart/phz-engine';
import type { DashboardDataModelStore, MetricId } from '@phozart/phz-engine';

// Import sub-components for side-effect registration
import './phz-widget-config-panel.js';
import './phz-global-filter-bar.js';
import './phz-data-model-sidebar.js';
import './phz-data-model-modal.js';

/* ─── Widget toolbar catalog ─── */

interface ToolbarItem { type: WidgetType; icon: string; label: string; }

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { type: 'kpi-card',      icon: '\u{1F4CA}', label: 'KPI Card' },
  { type: 'kpi-scorecard', icon: '\u{1F4CB}', label: 'Scorecard' },
  { type: 'bar-chart',     icon: '\u{1F4F6}', label: 'Bar Chart' },
  { type: 'trend-line',    icon: '\u{1F4C8}', label: 'Trend Line' },
  { type: 'bottom-n',      icon: '\u{1F53B}', label: 'Bottom N' },
  { type: 'status-table',  icon: '\u{1F6A6}', label: 'Status Table' },
  { type: 'data-table',    icon: '\u{1F4D1}', label: 'Data Table' },
  { type: 'drill-link',    icon: '\u{1F517}', label: 'Drill Link' },
];

/* ─── Legacy default configs (for backwards-compat bridge) ─── */

const DEFAULT_CONFIGS: Record<WidgetType, (id: string) => WidgetConfig> = {
  'kpi-card': (id) => ({
    id: widgetId(id), type: 'kpi-card', kpiId: '' as KPIId,
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as KPICardWidgetConfig),
  'kpi-scorecard': (id) => ({
    id: widgetId(id), type: 'kpi-scorecard', kpis: [] as KPIId[], expandable: false,
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as ScorecardWidgetConfig),
  'bar-chart': (id) => ({
    id: widgetId(id), type: 'bar-chart', dataProductId: '' as DataProductId,
    metricField: '', dimension: '', rankOrder: 'desc',
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as BarChartWidgetConfig),
  'trend-line': (id) => ({
    id: widgetId(id), type: 'trend-line', dataProductId: '' as DataProductId,
    metricField: '', periods: 12, showTarget: true,
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as TrendLineWidgetConfig),
  'bottom-n': (id) => ({
    id: widgetId(id), type: 'bottom-n', dataProductId: '' as DataProductId,
    metricField: '', dimension: '', n: 5, direction: 'bottom',
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as BottomNWidgetConfig),
  'pivot-table': (id) => ({
    id: widgetId(id), type: 'pivot-table', reportId: '' as ReportId,
    position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  }),
  'data-table': (id) => ({
    id: widgetId(id), type: 'data-table', reportId: '' as ReportId,
    position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  }),
  'status-table': (id) => ({
    id: widgetId(id), type: 'status-table', kpis: [] as KPIId[], entityDimension: '',
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as StatusTableWidgetConfig),
  'drill-link': (id) => ({
    id: widgetId(id), type: 'drill-link', label: 'View Details', targetReportId: '' as ReportId,
    position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
  } as DrillLinkWidgetConfig),
  'custom': (id) => ({
    id: widgetId(id), type: 'custom', renderer: '',
    position: { row: 0, col: 0, colSpan: 1, rowSpan: 1 }, size: { rowSpan: 1, colSpan: 1 },
  }),
};

/* ─── Component ─── */

@safeCustomElement('phz-dashboard-studio')
export class PhzDashboardStudio extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

      .studio { display: flex; flex-direction: column; height: 100%; min-height: 600px; border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }

      /* ── Header ── */
      .studio-header {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 20px; background: #1C1917; color: white;
      }
      .studio-brand { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #A8A29E; }
      .studio-brand span { color: #FEFDFB; }
      .studio-name {
        flex: 1; border: none; background: none; color: #FEFDFB;
        font-size: 15px; font-weight: 600; padding: 4px 8px; border-radius: 4px; font-family: inherit;
      }
      .studio-name:focus { outline: none; background: #292524; }
      .studio-name::placeholder { color: #78716C; }
      .studio-desc {
        border: none; background: none; color: #A8A29E; font-size: 12px;
        padding: 4px 8px; font-family: inherit; width: 220px;
      }
      .studio-desc:focus { outline: none; background: #292524; color: #FEFDFB; }
      .studio-desc::placeholder { color: #57534E; }
      .studio-actions { display: flex; gap: 6px; }
      .studio-btn {
        padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
        border: 1px solid #57534E; background: none; color: #D6D3D1; cursor: pointer;
        font-family: inherit; transition: all 0.15s;
      }
      .studio-btn:hover { border-color: #A8A29E; color: #FEFDFB; }
      .studio-btn--primary { background: #3B82F6; border-color: #3B82F6; color: white; }
      .studio-btn--primary:hover { background: #2563EB; }

      /* ── Widget Toolbar ── */
      .toolbar {
        display: flex; align-items: center; gap: 2px; padding: 6px 16px;
        background: #FAFAF9; border-bottom: 1px solid #E7E5E4; overflow-x: auto;
      }
      .toolbar-label {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em; margin-right: 8px; white-space: nowrap;
      }
      .toolbar-item {
        display: flex; flex-direction: column; align-items: center; gap: 2px;
        padding: 6px 10px; border-radius: 6px; border: 1px solid transparent;
        background: none; cursor: pointer; transition: all 0.12s; min-width: 56px; font-family: inherit;
      }
      .toolbar-item:hover { background: #EFF6FF; border-color: #BFDBFE; }
      .toolbar-item__icon { font-size: 18px; line-height: 1; }
      .toolbar-item__label { font-size: 9px; font-weight: 600; color: #78716C; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }

      /* ── Main body: 3 columns ── */
      .studio-body { display: grid; grid-template-columns: 220px 1fr 280px; flex: 1; overflow: hidden; }

      /* ── Left panel ── */
      .left-panel { border-right: 1px solid #E7E5E4; overflow-y: auto; background: #FAFAF9; }
      .panel-section { padding: 12px 14px; border-bottom: 1px solid #E7E5E4; }
      .panel-section-title {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;
      }
      .panel-add-btn {
        font-size: 16px; line-height: 1; cursor: pointer; border: none; background: none;
        color: #3B82F6; padding: 0 2px; transition: color 0.15s;
      }
      .panel-add-btn:hover { color: #2563EB; }

      .field-list { display: flex; flex-direction: column; gap: 1px; }
      .field-item {
        display: flex; align-items: center; gap: 6px; padding: 4px 8px;
        border-radius: 4px; font-size: 12px; color: #44403C;
      }
      .field-item:hover { background: #F5F5F4; }
      .field-type { font-size: 9px; font-weight: 700; color: #A8A29E; min-width: 22px; text-transform: uppercase; }

      .entity-item {
        display: flex; align-items: center; gap: 8px; padding: 6px 8px;
        border-radius: 4px; font-size: 12px;
      }
      .entity-item:hover { background: #F5F5F4; }
      .entity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .entity-name { color: #1C1917; font-weight: 500; }
      .entity-sub { font-size: 10px; color: #A8A29E; }

      .create-form {
        background: white; border: 1px solid #E7E5E4; border-radius: 6px;
        padding: 10px; margin-top: 6px; display: flex; flex-direction: column; gap: 6px;
      }
      .create-form input, .create-form select {
        padding: 5px 8px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 12px; font-family: inherit;
      }
      .create-form input:focus, .create-form select:focus { outline: none; border-color: #3B82F6; }
      .create-form-label { font-size: 10px; font-weight: 600; color: #78716C; }
      .create-form-actions { display: flex; gap: 6px; justify-content: flex-end; }
      .create-form-btn {
        padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;
        border: 1px solid #D6D3D1; background: white; color: #44403C; cursor: pointer; font-family: inherit;
      }
      .create-form-btn--primary { background: #3B82F6; color: white; border-color: #3B82F6; }
      .create-form-btn--primary:hover { background: #2563EB; }

      /* ── Center: Canvas ── */
      .canvas { overflow: auto; padding: 20px; background: #F5F5F4; }
      .canvas-grid { display: grid; gap: 12px; }
      .canvas-cell {
        position: relative; cursor: pointer; border-radius: 8px;
        border: 2px solid transparent; transition: border-color 0.15s; min-height: 120px;
      }
      .canvas-cell:hover { border-color: #BFDBFE; }
      .canvas-cell--selected { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
      .canvas-cell__remove {
        position: absolute; top: 6px; right: 6px; z-index: 2;
        width: 22px; height: 22px; border-radius: 50%;
        border: none; background: #DC2626; color: white; font-size: 13px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.15s;
      }
      .canvas-cell:hover .canvas-cell__remove { opacity: 1; }
      .canvas-cell__drag {
        position: absolute; top: 6px; left: 6px; z-index: 2;
        width: 22px; height: 22px; border-radius: 50%;
        border: none; background: rgba(0,0,0,0.3); color: white; font-size: 11px;
        cursor: grab; display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.15s;
      }
      .canvas-cell:hover .canvas-cell__drag { opacity: 0.7; }
      .canvas-cell__drag:active { cursor: grabbing; }
      .canvas-cell__resize {
        position: absolute; bottom: 0; left: 20%; right: 20%; height: 6px;
        cursor: ns-resize; background: transparent; border-radius: 0 0 6px 6px;
        opacity: 0; transition: opacity 0.15s;
      }
      .canvas-cell:hover .canvas-cell__resize { opacity: 1; background: rgba(59,130,246,0.3); }
      .canvas-cell--drag-over { border-color: #3B82F6; border-style: dashed; }
      .canvas-empty { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #A8A29E; }
      .canvas-empty__icon { font-size: 32px; margin-bottom: 8px; }
      .canvas-empty__text { font-size: 13px; }
      .canvas-empty__hint { font-size: 11px; color: #D6D3D1; margin-top: 4px; }

      /* ── Right panel ── */
      .right-panel { border-left: 1px solid #E7E5E4; overflow-y: auto; }
      .right-panel-header {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em; margin-bottom: 12px; padding: 14px 14px 8px;
        border-bottom: 1px solid #E7E5E4;
      }
      .widget-type-badge {
        display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
        color: #1C1917; font-weight: 600; margin: 0 14px 8px;
      }
      .dashboard-settings { padding: 14px; }
      .prop-group { margin-bottom: 14px; }
      .prop-label { font-size: 11px; font-weight: 600; color: #44403C; margin-bottom: 4px; }
      .prop-select {
        width: 100%; padding: 6px 8px; border: 1px solid #D6D3D1; border-radius: 5px;
        font-size: 12px; background: white;
      }
      .col-span-chips { display: flex; gap: 4px; flex-wrap: wrap; }
      .col-span-chip {
        padding: 3px 10px; border: 1px solid #D6D3D1; border-radius: 12px;
        font-size: 11px; font-weight: 600; cursor: pointer; background: white;
        font-family: inherit; transition: all 0.12s;
      }
      .col-span-chip:hover { border-color: #3B82F6; }
      .col-span-chip--active { background: #3B82F6; color: white; border-color: #3B82F6; }
      .no-selection { text-align: center; color: #A8A29E; font-size: 12px; margin-top: 40px; }

      /* ── Context Menu ── */
      .ctx-backdrop {
        position: fixed; inset: 0; z-index: 9998;
      }
      .ctx-menu {
        position: fixed; z-index: 9999;
        background: white; border: 1px solid #E7E5E4; border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
        min-width: 180px; padding: 4px 0; font-size: 12px;
      }
      .ctx-item {
        display: flex; align-items: center; gap: 8px;
        padding: 7px 14px; cursor: pointer; color: #1C1917;
        border: none; background: none; width: 100%; text-align: left;
        font-family: inherit; font-size: 12px;
      }
      .ctx-item:hover { background: #F5F5F4; }
      .ctx-item--danger { color: #DC2626; }
      .ctx-item--danger:hover { background: #FEF2F2; }
      .ctx-icon { width: 16px; text-align: center; font-size: 13px; flex-shrink: 0; }
      .ctx-label { flex: 1; }
      .ctx-hint { font-size: 10px; color: #A8A29E; }
      .ctx-sep { height: 1px; background: #E7E5E4; margin: 4px 0; }
    `,
  ];

  /* ── Properties ── */

  @property({ type: Object }) engine?: BIEngine;
  @property({ type: Array }) data?: Record<string, unknown>[];
  @property({ type: String }) dashboardId?: string;

  /* ── Internal state ── */

  @state() private dashboardName = 'New Dashboard';
  @state() private dashboardDescription = '';
  @state() private layoutColumns = 3;
  @state() private widgets: WidgetPlacement[] = [];
  @state() private enhancedWidgets: EnhancedWidgetConfig[] = [];
  @state() private placements: DashboardWidgetPlacement[] = [];
  @state() private selectedWidgetId?: string;
  @state() private globalFilters: GlobalFilter[] = [];
  @state() private globalFilterValues: Record<string, unknown> = {};

  // Inline create forms (legacy — kept for backward compat)
  @state() private showKpiForm = false;
  @state() private showMetricForm = false;
  @state() private newKpiName = '';
  @state() private newKpiField = '';
  @state() private newKpiTarget = 90;
  @state() private newMetricName = '';
  @state() private newMetricField = '';
  @state() private newMetricAgg = 'avg';

  // Data Model
  @state() private dataModelStore?: DashboardDataModelStore;

  // Modal state
  @state() private modalType?: 'parameters' | 'calculatedFields' | 'metrics' | 'kpis';
  @state() private modalEditId?: string;

  // Resolved widget props for live canvas
  @state() private resolvedWidgets?: Map<string, ResolvedWidgetProps>;

  // Drag state
  @state() private dragOverWidgetId?: string;

  // Context menu state
  @state() private _ctxMenu?: {
    x: number; y: number;
    items: Array<{ id: string; label: string; icon: string; danger?: boolean; separator?: boolean }>;
    context: { type: 'sidebar' | 'widget'; entityType?: string; id: string; name?: string };
  };

  private nextId = 1;
  private scoreProvider: KPIScoreProvider = createDefaultScoreProvider();

  /* ── Public API ── */

  /** Load an existing dashboard config into the studio */
  loadConfig(config: DashboardConfig | EnhancedDashboardConfig) {
    if (isEnhancedDashboard(config)) {
      this.dashboardName = config.name;
      this.dashboardDescription = config.description ?? '';
      this.layoutColumns = config.layout.columns;
      this.enhancedWidgets = config.widgets.map(w => structuredClone(w));
      this.placements = config.placements.map(p => ({ ...p }));
      this.globalFilters = config.globalFilters.map(f => ({ ...f }));
      // Build legacy widgets for canvas rendering bridge
      this.widgets = this.enhancedWidgets.map(ew => this.enhancedToLegacy(ew));
      this.nextId = this.enhancedWidgets.length + 1;
    } else {
      this.dashboardName = config.name;
      this.dashboardDescription = config.description ?? '';
      this.layoutColumns = config.layout.columns;
      this.widgets = config.widgets.map(w => ({ ...w }));
      this.enhancedWidgets = [];
      this.placements = [];
      this.nextId = this.widgets.length + 1;
    }
    this.selectedWidgetId = undefined;
  }

  /* ── Lifecycle ── */

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('data') && this.data?.length) {
      this._initDataModel();
    }
    if (changed.has('data') || changed.has('engine') || changed.has('widgets') || changed.has('globalFilterValues')) {
      this.resolveAllWidgets();
    }
  }

  private _initDataModel() {
    if (!this.data?.length) return;
    const first = this.data[0];
    const fields: DataModelField[] = Object.keys(first).map(k => ({
      name: k,
      type: (typeof first[k] === 'number' ? 'number' : typeof first[k] === 'boolean' ? 'boolean' : 'string') as DataModelField['type'],
    }));
    if (!this.dataModelStore) {
      this.dataModelStore = createDashboardDataModelStore(fields);
    }
  }

  /* ── Sidebar event handler ── */

  private handleSidebarAction(e: CustomEvent) {
    const { action, entityType, id } = e.detail;
    if (action === 'create') {
      this.modalType = entityType;
      this.modalEditId = undefined;
    } else if (action === 'edit') {
      this.modalType = entityType;
      this.modalEditId = id;
    } else if (action === 'menu') {
      this.modalType = entityType;
      this.modalEditId = id;
    }
  }

  private handleModalClose() {
    this.modalType = undefined;
    this.modalEditId = undefined;
  }

  /* ── Modal form handlers ── */

  private handleParameterSave(e: CustomEvent) {
    const { parameter, isEdit } = e.detail;
    if (this.dataModelStore) {
      if (isEdit) {
        this.dataModelStore.updateParameter(parameter.id, parameter);
      } else {
        this.dataModelStore.addParameter(parameter);
      }
    }
    this.handleModalClose();
    this.requestUpdate();
  }

  private handleCalcFieldSave(e: CustomEvent) {
    const { calculatedField, isEdit } = e.detail;
    if (this.dataModelStore) {
      if (isEdit) {
        this.dataModelStore.updateCalculatedField(calculatedField.id, calculatedField);
      } else {
        this.dataModelStore.addCalculatedField(calculatedField);
      }
    }
    this.handleModalClose();
    this.requestUpdate();
  }

  private handleMetricFormSave(e: CustomEvent) {
    const { metric, isEdit } = e.detail;
    if (isEdit) {
      this.engine?.metrics.remove(metric.id);
    }
    this.engine?.metrics.register(metric);
    this.dispatchEvent(new CustomEvent('metric-save', { bubbles: true, composed: true, detail: metric }));
    this.handleModalClose();
    this.requestUpdate();
  }

  private handleKpiFormSave(e: CustomEvent) {
    const { kpi, isEdit } = e.detail;
    if (isEdit) {
      this.engine?.kpis.remove(kpi.id);
    }
    this.engine?.kpis.register(kpi);
    this.dispatchEvent(new CustomEvent('kpi-save', { bubbles: true, composed: true, detail: { kpi } }));
    this.handleModalClose();
    this.requestUpdate();
  }

  private resolveAllWidgets() {
    if (!this.data || !this.engine || this.widgets.length === 0) {
      this.resolvedWidgets = undefined;
      return;
    }

    // Apply global filters to data
    let filteredData = this.data;
    if (Object.keys(this.globalFilterValues).length > 0) {
      filteredData = this.applyGlobalFilters(this.data);
    }

    const config: DashboardConfig = {
      id: dashboardId('studio-preview'),
      name: this.dashboardName,
      layout: { columns: this.layoutColumns, rowHeight: 180, gap: 12, responsive: true },
      widgets: this.widgets,
      created: Date.now(),
      updated: Date.now(),
    };
    this.resolvedWidgets = resolveDashboardWidgets(config, {
      engine: this.engine,
      data: filteredData,
      scoreProvider: this.scoreProvider,
    });
  }

  private applyGlobalFilters(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    let filtered = rows;
    for (const gf of this.globalFilters) {
      const val = this.globalFilterValues[gf.id];
      if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) continue;

      filtered = filtered.filter(row => {
        const cellVal = row[gf.fieldKey];
        if (gf.filterType === 'select') return String(cellVal) === String(val);
        if (gf.filterType === 'multi-select' && Array.isArray(val)) return val.includes(String(cellVal));
        if (gf.filterType === 'text-search' && typeof val === 'string') return String(cellVal ?? '').toLowerCase().includes(val.toLowerCase());
        if (gf.filterType === 'number-range' && typeof val === 'object' && val !== null) {
          const num = Number(cellVal);
          const { min, max } = val as { min?: number; max?: number };
          if (min !== undefined && num < min) return false;
          if (max !== undefined && num > max) return false;
          return true;
        }
        return true;
      });
    }
    return filtered;
  }

  /* ── Widget CRUD ── */

  private addWidget(type: WidgetType) {
    const id = `w-${this.nextId++}`;
    const row = Math.floor(this.widgets.length / this.layoutColumns);
    const col = this.widgets.length % this.layoutColumns;

    // Create enhanced config with smart defaults
    const smartDefault = SMART_DEFAULTS[type]();
    const enhanced: EnhancedWidgetConfig = {
      ...smartDefault,
      id: widgetId(id),
    };
    this.enhancedWidgets = [...this.enhancedWidgets, enhanced];

    // Also create legacy widget for canvas rendering bridge
    const legacyConfig = DEFAULT_CONFIGS[type](id);
    const widget: WidgetPlacement = {
      id: widgetId(id),
      widgetType: type,
      config: legacyConfig,
      position: { row, col, rowSpan: 1, colSpan: 1 },
    };
    this.widgets = [...this.widgets, widget];

    // Create placement
    const placement: DashboardWidgetPlacement = {
      widgetId: widgetId(id),
      column: col,
      order: this.placements.length,
      colSpan: 1,
    };
    this.placements = [...this.placements, placement];

    this.selectedWidgetId = id;
  }

  private removeWidget(id: string) {
    this.widgets = this.widgets.filter(w => (w.id as string) !== id);
    this.enhancedWidgets = this.enhancedWidgets.filter(w => (w.id as string) !== id);
    this.placements = this.placements.filter(p => (p.widgetId as string) !== id);
    if (this.selectedWidgetId === id) this.selectedWidgetId = undefined;
  }

  private updateWidgetColSpan(id: string, colSpan: number) {
    this.widgets = this.widgets.map(w =>
      (w.id as string) === id ? { ...w, position: { ...w.position, colSpan } } : w
    );
    this.placements = this.placements.map(p =>
      (p.widgetId as string) === id ? { ...p, colSpan } : p
    );
  }

  private handleWidgetConfigChange(e: CustomEvent) {
    const updatedConfig = e.detail.config as EnhancedWidgetConfig;
    const id = updatedConfig.id as string;

    // Update enhanced configs
    this.enhancedWidgets = this.enhancedWidgets.map(w =>
      (w.id as string) === id ? updatedConfig : w
    );

    // Bridge to legacy widget config for canvas rendering
    this.widgets = this.widgets.map(w => {
      if ((w.id as string) !== id) return w;
      return { ...w, config: this.bridgeEnhancedToLegacy(updatedConfig, w.config) };
    });
  }

  /** Bridge enhanced config data bindings to legacy WidgetConfig for the resolver */
  private bridgeEnhancedToLegacy(enhanced: EnhancedWidgetConfig, existing: WidgetConfig): WidgetConfig {
    const b = enhanced.data.bindings;
    switch (enhanced.type) {
      case 'kpi-card':
        if (b.type === 'kpi') return { ...existing, kpiId: b.kpiId } as WidgetConfig;
        return existing;
      case 'kpi-scorecard':
        if (b.type === 'scorecard') return { ...existing, kpis: b.kpiIds, expandable: false } as WidgetConfig;
        return existing;
      case 'bar-chart':
        if (b.type === 'chart') return {
          ...existing, metricField: b.values?.[0]?.fieldKey ?? '', dimension: b.category?.fieldKey ?? '',
          rankOrder: enhanced.data.sort?.direction ?? 'desc',
        } as WidgetConfig;
        return existing;
      case 'trend-line':
        if (b.type === 'chart') return {
          ...existing, metricField: b.values?.[0]?.fieldKey ?? '', periods: 12,
          showTarget: enhanced.appearance.kpi?.showTarget !== false,
        } as WidgetConfig;
        return existing;
      case 'bottom-n':
        if (b.type === 'chart') return {
          ...existing, metricField: b.values?.[0]?.fieldKey ?? '', dimension: b.category?.fieldKey ?? '',
          n: enhanced.appearance.bottomN?.count ?? 5,
          direction: enhanced.appearance.bottomN?.mode ?? 'bottom',
        } as WidgetConfig;
        return existing;
      case 'status-table':
        if (b.type === 'status-table') return {
          ...existing, kpis: b.kpiIds, entityDimension: b.entityField?.fieldKey ?? '',
        } as WidgetConfig;
        return existing;
      case 'drill-link':
        if (b.type === 'drill-link') return {
          ...existing, label: b.label, targetReportId: b.targetReportId,
        } as WidgetConfig;
        return existing;
      default:
        return existing;
    }
  }

  /** Convert enhanced config to legacy WidgetPlacement for backward compat */
  private enhancedToLegacy(ew: EnhancedWidgetConfig): WidgetPlacement {
    const config = DEFAULT_CONFIGS[ew.type](ew.id as string);
    const bridged = this.bridgeEnhancedToLegacy(ew, config);
    const placement = this.placements.find(p => (p.widgetId as string) === (ew.id as string));
    return {
      id: ew.id,
      widgetType: ew.type,
      config: bridged,
      position: {
        row: Math.floor((placement?.order ?? 0) / this.layoutColumns),
        col: placement?.column ?? 0,
        rowSpan: 1,
        colSpan: placement?.colSpan ?? 1,
      },
    };
  }

  /* ── Drag & Drop ── */

  private handleDragStart(e: DragEvent, id: string) {
    e.dataTransfer?.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  private handleDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.dragOverWidgetId = id;
  }

  private handleDragLeave() {
    this.dragOverWidgetId = undefined;
  }

  private handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = e.dataTransfer?.getData('text/plain');
    this.dragOverWidgetId = undefined;
    if (!sourceId || sourceId === targetId) return;

    // Reorder widgets
    const srcIdx = this.widgets.findIndex(w => (w.id as string) === sourceId);
    const tgtIdx = this.widgets.findIndex(w => (w.id as string) === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;

    const newWidgets = [...this.widgets];
    const [moved] = newWidgets.splice(srcIdx, 1);
    newWidgets.splice(tgtIdx, 0, moved);
    this.widgets = newWidgets;

    // Also reorder enhanced widgets
    const srcEIdx = this.enhancedWidgets.findIndex(w => (w.id as string) === sourceId);
    const tgtEIdx = this.enhancedWidgets.findIndex(w => (w.id as string) === targetId);
    if (srcEIdx !== -1 && tgtEIdx !== -1) {
      const newEnhanced = [...this.enhancedWidgets];
      const [movedE] = newEnhanced.splice(srcEIdx, 1);
      newEnhanced.splice(tgtEIdx, 0, movedE);
      this.enhancedWidgets = newEnhanced;
    }
  }

  /* ── Resize ── */

  private handleResizeStart(e: MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const cell = (e.target as HTMLElement).closest('.canvas-cell') as HTMLElement;
    if (!cell) return;

    const startY = e.clientY;
    const startH = cell.offsetHeight;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      const newH = Math.max(80, startH + delta);
      this.placements = this.placements.map(p =>
        (p.widgetId as string) === id ? { ...p, heightOverride: newH } : p
      );
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /* ── Data helpers ── */

  private getNumericFields(): string[] {
    if (!this.data?.length) return [];
    return Object.keys(this.data[0]).filter(k => typeof this.data![0][k] === 'number');
  }

  private getStringFields(): string[] {
    if (!this.data?.length) return [];
    return Object.keys(this.data[0]).filter(k => typeof this.data![0][k] === 'string');
  }

  private getAllFields(): { name: string; type: string }[] {
    if (!this.data?.length) return [];
    const first = this.data[0];
    return Object.keys(first).map(k => ({
      name: k,
      type: typeof first[k] === 'number' ? 'num' : typeof first[k] === 'boolean' ? 'bool' : 'str',
    }));
  }

  private getKPIList() { return this.engine?.kpis.list() ?? []; }
  private getReportList() { return this.engine?.reports.list() ?? []; }

  /* ── Publish ── */

  private handlePublish() {
    const now = Date.now();

    // Emit enhanced config if we have enhanced widgets
    if (this.enhancedWidgets.length > 0) {
      const enhanced: EnhancedDashboardConfig = {
        version: 2,
        id: dashboardId(this.dashboardId ?? `dash-${now}`),
        name: this.dashboardName,
        description: this.dashboardDescription || undefined,
        layout: { columns: this.layoutColumns, gap: 12 },
        widgets: this.enhancedWidgets,
        placements: this.placements,
        globalFilters: this.globalFilters,
        theme: { ...DEFAULT_DASHBOARD_THEME },
        metadata: { created: now, updated: now },
      };

      // Also emit serialization format with KPIs and metrics
      const kpis = this.getKPIList();
      const metrics = this.engine?.metrics.list() ?? [];
      const fields = this.getAllFields();
      const serialized = serializeDashboard(
        enhanced, kpis, metrics as any,
        fields.map(f => ({ fieldKey: f.name, type: f.type })),
      );

      this.dispatchEvent(new CustomEvent('dashboard-save', {
        bubbles: true, composed: true,
        detail: {
          config: enhanced,
          serialized,
          dataModel: this.dataModelStore?.serialize(),
        },
      }));
    }

    // Also emit legacy format for backward compat
    const legacyConfig: DashboardConfig = {
      id: dashboardId(this.dashboardId ?? `dash-${now}`),
      name: this.dashboardName,
      description: this.dashboardDescription || undefined,
      layout: { columns: this.layoutColumns, rowHeight: 180, gap: 12, responsive: true },
      widgets: this.widgets,
      created: now,
      updated: now,
    };

    if (this.enhancedWidgets.length === 0) {
      this.dispatchEvent(new CustomEvent('dashboard-save', {
        bubbles: true, composed: true,
        detail: { config: legacyConfig },
      }));
    }
  }

  /* ── Inline KPI Create ── */

  private handleCreateKpi() {
    if (!this.newKpiName || !this.newKpiField) return;
    const kpi = {
      id: this.newKpiName.toLowerCase().replace(/\s+/g, '-'),
      name: this.newKpiName,
      description: `KPI for ${this.newKpiField}`,
      category: 'Custom',
      target: this.newKpiTarget,
      unit: 'percent',
      direction: 'higher_is_better' as const,
      thresholds: { ok: Math.round(this.newKpiTarget * 0.95), warn: Math.round(this.newKpiTarget * 0.8) },
      deltaComparison: 'previous_period' as const,
      dimensions: [],
      breakdowns: [],
      dataSource: {},
      trend: { enabled: true, periods: 12 },
      sortOrder: this.getKPIList().length + 1,
    };
    this.engine?.kpis.register(kpi as any);
    this.dispatchEvent(new CustomEvent('kpi-save', {
      bubbles: true, composed: true,
      detail: { kpi },
    }));
    this.newKpiName = '';
    this.newKpiField = '';
    this.newKpiTarget = 90;
    this.showKpiForm = false;
    this.requestUpdate();
  }

  /* ── Inline Metric Create ── */

  private handleCreateMetric() {
    if (!this.newMetricName || !this.newMetricField) return;
    const metric = {
      id: ('metric-' + Date.now()) as any,
      name: this.newMetricName,
      dataProductId: 'employees' as any,
      formula: { type: 'simple', field: this.newMetricField, aggregation: this.newMetricAgg },
      format: { type: 'number', decimals: 1 },
    };
    this.engine?.metrics.register(metric as any);
    this.dispatchEvent(new CustomEvent('metric-save', {
      bubbles: true, composed: true,
      detail: metric,
    }));
    this.newMetricName = '';
    this.newMetricField = '';
    this.newMetricAgg = 'avg';
    this.showMetricForm = false;
    this.requestUpdate();
  }

  /* ── Global Filter Handling ── */

  private handleGlobalFilterChange(e: CustomEvent) {
    this.globalFilters = e.detail.filters;
    this.globalFilterValues = e.detail.activeValues;
  }

  /* ── Context Menu ── */

  private _openSidebarContextMenu(e: CustomEvent) {
    const { entityType, id, name, canAdd, x, y } = e.detail;
    const items: Array<{ id: string; label: string; icon: string; danger?: boolean; separator?: boolean }> = [];

    if (entityType === 'fields') {
      items.push({ id: 'create-calc', label: 'Create Calculated Field', icon: '~' });
      items.push({ id: 'copy-ref', label: 'Copy Reference', icon: '[]' });
    } else {
      items.push({ id: 'edit', label: 'Edit', icon: '\u270E' });
      items.push({ id: 'clone', label: 'Clone', icon: '\u2398' });
      items.push({ id: 'copy-ref', label: 'Copy Reference', icon: '[]' });
      items.push({ id: 'sep', label: '', icon: '', separator: true });
      items.push({ id: 'delete', label: 'Delete', icon: '\u2715', danger: true });
    }

    this._ctxMenu = { x, y, items, context: { type: 'sidebar', entityType, id, name } };
  }

  private _openWidgetContextMenu(e: MouseEvent, widgetId: string) {
    e.preventDefault();
    e.stopPropagation();
    const w = this.widgets.find(w => (w.id as string) === widgetId);
    const label = w ? (TOOLBAR_ITEMS.find(t => t.type === w.widgetType)?.label ?? w.widgetType) : widgetId;
    this._ctxMenu = {
      x: e.clientX, y: e.clientY,
      items: [
        { id: 'configure', label: 'Configure', icon: '\u2699' },
        { id: 'duplicate', label: 'Duplicate', icon: '\u2398' },
        { id: 'sep', label: '', icon: '', separator: true },
        { id: 'delete', label: 'Delete', icon: '\u2715', danger: true },
      ],
      context: { type: 'widget', id: widgetId, name: label },
    };
  }

  private _closeContextMenu() {
    this._ctxMenu = undefined;
  }

  private _handleCtxAction(actionId: string) {
    if (!this._ctxMenu) return;
    const { context } = this._ctxMenu;
    this._closeContextMenu();

    if (context.type === 'widget') {
      switch (actionId) {
        case 'configure':
          this.selectedWidgetId = context.id;
          break;
        case 'duplicate':
          this._duplicateWidget(context.id);
          break;
        case 'delete':
          this.removeWidget(context.id);
          break;
      }
      return;
    }

    // Sidebar actions
    const { entityType, id, name } = context;
    switch (actionId) {
      case 'edit':
        this.modalType = entityType as any;
        this.modalEditId = id;
        break;
      case 'clone':
        this._cloneEntity(entityType!, id!);
        break;
      case 'delete':
        this._deleteEntity(entityType!, id!);
        break;
      case 'create-calc':
        // Open calculated field modal with a pre-set reference to this field
        this.modalType = 'calculatedFields';
        this.modalEditId = undefined;
        break;
      case 'copy-ref':
        this._copyReference(entityType!, id!, name);
        break;
    }
  }

  private _copyReference(entityType: string, id: string, name?: string) {
    let ref = '';
    switch (entityType) {
      case 'fields': ref = `[${id}]`; break;
      case 'parameters': ref = `$${id}`; break;
      case 'calculatedFields': ref = `~${id}`; break;
      case 'metrics': ref = `@${id}`; break;
      case 'kpis': ref = id; break;
    }
    if (ref) navigator.clipboard?.writeText(ref);
  }

  private _cloneEntity(entityType: string, id: string) {
    switch (entityType) {
      case 'parameters': {
        const orig = this.dataModelStore?.getParameter(parameterId(id));
        if (orig) {
          const clone: ParameterDef = {
            ...structuredClone(orig),
            id: parameterId(`${id}-copy-${Date.now()}`),
            name: `${orig.name} (copy)`,
          };
          this.dataModelStore?.addParameter(clone);
          this.requestUpdate();
        }
        break;
      }
      case 'calculatedFields': {
        const orig = this.dataModelStore?.getCalculatedField(calculatedFieldId(id));
        if (orig) {
          const clone: CalculatedFieldDef = {
            ...structuredClone(orig),
            id: calculatedFieldId(`${id}-copy-${Date.now()}`),
            name: `${orig.name} (copy)`,
          };
          this.dataModelStore?.addCalculatedField(clone);
          this.requestUpdate();
        }
        break;
      }
      case 'metrics': {
        const metrics = this.engine?.metrics.list() ?? [];
        const orig = metrics.find(m => m.id === id);
        if (orig) {
          const clone = {
            ...structuredClone(orig),
            id: `${id}-copy-${Date.now()}` as MetricId,
            name: `${orig.name} (copy)`,
          };
          this.engine?.metrics.register(clone as any);
          this.requestUpdate();
        }
        break;
      }
      case 'kpis': {
        const kpis = this.engine?.kpis.list() ?? [];
        const orig = kpis.find(k => k.id === id);
        if (orig) {
          const clone = {
            ...structuredClone(orig),
            id: `${id}-copy-${Date.now()}`,
            name: `${orig.name} (copy)`,
          };
          this.engine?.kpis.register(clone as any);
          this.requestUpdate();
        }
        break;
      }
    }
  }

  private _deleteEntity(entityType: string, id: string) {
    switch (entityType) {
      case 'parameters':
        this.dataModelStore?.removeParameter(parameterId(id));
        this.requestUpdate();
        break;
      case 'calculatedFields':
        this.dataModelStore?.removeCalculatedField(calculatedFieldId(id));
        this.requestUpdate();
        break;
      case 'metrics':
        this.engine?.metrics.remove(id as MetricId);
        this.requestUpdate();
        break;
      case 'kpis':
        this.engine?.kpis.remove(id as any);
        this.requestUpdate();
        break;
    }
  }

  private _duplicateWidget(id: string) {
    const w = this.widgets.find(w => (w.id as string) === id);
    const ew = this.enhancedWidgets.find(w => (w.id as string) === id);
    if (!w) return;

    const newId = `w-${this.nextId++}`;
    const row = Math.floor(this.widgets.length / this.layoutColumns);
    const col = this.widgets.length % this.layoutColumns;

    const newWidget: WidgetPlacement = {
      ...structuredClone(w),
      id: widgetId(newId),
      position: { row, col, rowSpan: 1, colSpan: w.position.colSpan },
    };
    this.widgets = [...this.widgets, newWidget];

    if (ew) {
      const newEnhanced = { ...structuredClone(ew), id: widgetId(newId) };
      this.enhancedWidgets = [...this.enhancedWidgets, newEnhanced];
    }

    const placement: DashboardWidgetPlacement = {
      widgetId: widgetId(newId),
      column: col,
      order: this.placements.length,
      colSpan: w.position.colSpan,
    };
    this.placements = [...this.placements, placement];
    this.selectedWidgetId = newId;
  }

  private _renderContextMenu() {
    if (!this._ctxMenu) return nothing;
    const { x, y, items } = this._ctxMenu;

    // Clamp position so menu doesn't overflow viewport
    const menuW = 200;
    const menuH = items.filter(i => !i.separator).length * 32 + items.filter(i => i.separator).length * 9 + 8;
    const cx = Math.min(x, window.innerWidth - menuW - 8);
    const cy = Math.min(y, window.innerHeight - menuH - 8);

    return html`
      <div class="ctx-backdrop" @click=${() => this._closeContextMenu()} @contextmenu=${(e: MouseEvent) => { e.preventDefault(); this._closeContextMenu(); }}></div>
      <div class="ctx-menu" style="left:${cx}px;top:${cy}px;">
        ${items.map(item =>
          item.separator
            ? html`<div class="ctx-sep"></div>`
            : html`<button class="ctx-item ${item.danger ? 'ctx-item--danger' : ''}"
                           @click=${() => this._handleCtxAction(item.id)}>
                <span class="ctx-icon">${item.icon}</span>
                <span class="ctx-label">${item.label}</span>
              </button>`
        )}
      </div>
    `;
  }

  /* ── Canvas: live widget rendering ── */

  private renderCanvasWidget(w: WidgetPlacement) {
    const p = this.resolvedWidgets?.get(w.id as string);
    switch (w.widgetType) {
      case 'kpi-card':
        return html`<phz-kpi-card .kpiDefinition=${p?.kpiDefinition} .value=${p?.value ?? 0} .previousValue=${p?.previousValue} .trendData=${p?.trendData} .cardStyle=${p?.cardStyle ?? 'compact'}></phz-kpi-card>`;
      case 'kpi-scorecard':
        return html`<phz-kpi-scorecard .kpiDefinitions=${p?.kpiDefinitions ?? []} .scores=${p?.scores ?? []}></phz-kpi-scorecard>`;
      case 'bar-chart':
        return html`<phz-bar-chart .data=${p?.chartData} .rankOrder=${p?.rankOrder ?? 'desc'} .maxBars=${p?.maxBars ?? 10}></phz-bar-chart>`;
      case 'trend-line':
        return html`<phz-trend-line .data=${p?.chartData} .target=${p?.target} .periods=${p?.periods ?? 12} .kpiDefinition=${p?.kpiDefinition}></phz-trend-line>`;
      case 'bottom-n':
        return html`<phz-bottom-n .data=${p?.data ?? []} .metricField=${p?.metricField ?? ''} .dimensionField=${p?.dimensionField ?? ''} .n=${p?.n ?? 5} .direction=${p?.direction ?? 'bottom'} .kpiDefinition=${p?.kpiDefinition}></phz-bottom-n>`;
      case 'status-table':
        return html`<phz-status-table .data=${p?.data ?? []} .entityField=${p?.entityField ?? ''} .kpiDefinitions=${p?.kpiDefinitions ?? []}></phz-status-table>`;
      case 'drill-link':
        return html`<phz-drill-link .label=${p?.label ?? 'View Details'} .targetReportId=${p?.targetReportId ?? ''}></phz-drill-link>`;
      default:
        return html`<div style="padding:20px;text-align:center;color:#A8A29E;font-size:12px;background:#FAFAF9;border-radius:6px;min-height:80px;display:flex;align-items:center;justify-content:center;">${w.widgetType}</div>`;
    }
  }

  /* ── Render ── */

  render() {
    const selectedWidget = this.widgets.find(w => (w.id as string) === this.selectedWidgetId);
    const selectedEnhanced = this.enhancedWidgets.find(w => (w.id as string) === this.selectedWidgetId);
    const toolbarItem = selectedWidget ? TOOLBAR_ITEMS.find(t => t.type === selectedWidget.widgetType) : null;
    const fields = this.getAllFields();
    const kpis = this.getKPIList();
    const metrics = this.engine?.metrics.list() ?? [];

    return html`
      <div class="studio" role="region" aria-label="Dashboard Studio"
           @contextmenu=${(e: MouseEvent) => { e.preventDefault(); }}
           @keydown=${(e: KeyboardEvent) => { if (e.key === 'Escape') this._closeContextMenu(); }}>

        <!-- Header -->
        <div class="studio-header">
          <div class="studio-brand"><span>PHOZART</span> STUDIO</div>
          <input class="studio-name" placeholder="Dashboard name..."
                 .value=${this.dashboardName}
                 @input=${(e: Event) => { this.dashboardName = (e.target as HTMLInputElement).value; }}>
          <input class="studio-desc" placeholder="Description..."
                 .value=${this.dashboardDescription}
                 @input=${(e: Event) => { this.dashboardDescription = (e.target as HTMLInputElement).value; }}>
          <div class="studio-actions">
            <button class="studio-btn" @click=${() => { this.widgets = []; this.enhancedWidgets = []; this.placements = []; this.selectedWidgetId = undefined; }}>Clear</button>
            <button class="studio-btn studio-btn--primary" @click=${this.handlePublish}>Publish</button>
          </div>
        </div>

        <!-- Widget Toolbar -->
        <div class="toolbar" role="toolbar" aria-label="Add widgets">
          <span class="toolbar-label">Add</span>
          ${TOOLBAR_ITEMS.map(item => html`
            <button class="toolbar-item" @click=${() => this.addWidget(item.type)} title="Add ${item.label}">
              <span class="toolbar-item__icon">${item.icon}</span>
              <span class="toolbar-item__label">${item.label}</span>
            </button>
          `)}
          <div style="flex:1;"></div>
          <span class="toolbar-label">Layout</span>
          ${[2, 3, 4].map(n => html`
            <button class="toolbar-item" style="min-width:40px;${this.layoutColumns === n ? 'background:#EFF6FF;border-color:#BFDBFE;' : ''}"
                    @click=${() => { this.layoutColumns = n; }}
                    title="${n} columns">
              <span class="toolbar-item__icon" style="font-size:13px;font-weight:700;">${n}</span>
              <span class="toolbar-item__label">col</span>
            </button>
          `)}
        </div>

        <!-- Global Filter Bar -->
        <phz-global-filter-bar
          .filters=${this.globalFilters}
          .data=${this.data ?? []}
          .fields=${fields}
          @filter-change=${this.handleGlobalFilterChange}
        ></phz-global-filter-bar>

        <!-- Main body -->
        <div class="studio-body">

          <!-- Left: Data Model Sidebar -->
          <div class="left-panel">
            <phz-data-model-sidebar
              .fields=${this.dataModelStore?.getFields() ?? fields.map((f: any) => ({ name: f.name, type: f.type === 'num' ? 'number' : f.type === 'bool' ? 'boolean' : 'string' }))}
              .parameters=${this.dataModelStore?.listParameters() ?? []}
              .calculatedFields=${this.dataModelStore?.listCalculatedFields() ?? []}
              .metrics=${metrics}
              .kpis=${kpis}
              @sidebar-action=${this.handleSidebarAction}
              @sidebar-contextmenu=${this._openSidebarContextMenu}
            ></phz-data-model-sidebar>
          </div>

          <!-- Data Model Modal -->
          <phz-data-model-modal
            .open=${!!this.modalType}
            .entityType=${this.modalType ?? 'parameters'}
            .editId=${this.modalEditId}
            .fields=${this.dataModelStore?.getFields() ?? []}
            .parameters=${this.dataModelStore?.listParameters() ?? []}
            .calculatedFields=${this.dataModelStore?.listCalculatedFields() ?? []}
            .metrics=${metrics}
            .kpis=${kpis}
            .previewData=${this.data ?? []}
            .engine=${this.engine}
            @modal-close=${this.handleModalClose}
            @modal-select=${(e: CustomEvent) => { this.modalEditId = e.detail.id; }}
            @parameter-save=${this.handleParameterSave}
            @calculated-field-save=${this.handleCalcFieldSave}
            @metric-save=${this.handleMetricFormSave}
            @kpi-save=${this.handleKpiFormSave}
          ></phz-data-model-modal>

          <!-- Center: Live Canvas -->
          <div class="canvas">
            <div class="canvas-grid" style="grid-template-columns:repeat(${this.layoutColumns},1fr);">
              ${this.widgets.length === 0 ? html`
                <div class="canvas-empty">
                  <div class="canvas-empty__icon">+</div>
                  <div class="canvas-empty__text">Click a widget from the toolbar to get started</div>
                  <div class="canvas-empty__hint">Widgets appear here with live data preview</div>
                </div>
              ` : this.widgets.map(w => {
                const placement = this.placements.find(p => (p.widgetId as string) === (w.id as string));
                const heightStyle = placement?.heightOverride ? `min-height:${placement.heightOverride}px;` : '';
                return html`
                  <div class="canvas-cell ${(w.id as string) === this.selectedWidgetId ? 'canvas-cell--selected' : ''} ${(w.id as string) === this.dragOverWidgetId ? 'canvas-cell--drag-over' : ''}"
                       style="grid-column:span ${w.position.colSpan};grid-row:span ${w.position.rowSpan};${heightStyle}"
                       @click=${() => { this.selectedWidgetId = w.id as string; }}
                       @contextmenu=${(e: MouseEvent) => this._openWidgetContextMenu(e, w.id as string)}
                       @dragover=${(e: DragEvent) => this.handleDragOver(e, w.id as string)}
                       @dragleave=${this.handleDragLeave}
                       @drop=${(e: DragEvent) => this.handleDrop(e, w.id as string)}>
                    <div class="canvas-cell__drag" draggable="true"
                         @dragstart=${(e: DragEvent) => this.handleDragStart(e, w.id as string)}>&#x2630;</div>
                    ${this.renderCanvasWidget(w)}
                    <button class="canvas-cell__remove" @click=${(e: Event) => { e.stopPropagation(); this.removeWidget(w.id as string); }}>&times;</button>
                    <div class="canvas-cell__resize" @mousedown=${(e: MouseEvent) => this.handleResizeStart(e, w.id as string)}></div>
                  </div>
                `;
              })}
            </div>
          </div>

          <!-- Right: Properties Panel -->
          <div class="right-panel">
            ${selectedWidget && selectedEnhanced ? html`
              <div class="right-panel-header">Widget Properties</div>
              <div class="widget-type-badge">
                ${toolbarItem?.icon ?? '?'} ${toolbarItem?.label ?? selectedWidget.widgetType}
              </div>
              <div style="padding:0 14px 8px;">
                <div style="font-size:11px;font-weight:600;color:#44403C;margin-bottom:3px;">Column Span</div>
                <div class="col-span-chips">
                  ${Array.from({ length: this.layoutColumns }, (_, i) => i + 1).map(s => html`
                    <button class="col-span-chip ${selectedWidget.position.colSpan === s ? 'col-span-chip--active' : ''}"
                            @click=${() => this.updateWidgetColSpan(selectedWidget.id as string, s)}>${s}</button>
                  `)}
                </div>
              </div>
              <phz-widget-config-panel
                .widgetConfig=${selectedEnhanced}
                .fields=${fields}
                .kpis=${kpis}
                .metrics=${metrics}
                .layoutColumns=${this.layoutColumns}
                @widget-config-change=${this.handleWidgetConfigChange}
              ></phz-widget-config-panel>
            ` : html`
              <div class="dashboard-settings">
                <div class="right-panel-header" style="padding:0 0 8px;">Dashboard Settings</div>
                <div class="prop-group">
                  <div class="prop-label">Columns</div>
                  <select class="prop-select" .value=${String(this.layoutColumns)}
                          @change=${(e: Event) => { this.layoutColumns = parseInt((e.target as HTMLSelectElement).value) || 3; }}>
                    <option value="2">2 Columns</option>
                    <option value="3">3 Columns</option>
                    <option value="4">4 Columns</option>
                  </select>
                </div>
                <div class="prop-group">
                  <div class="prop-label">Widgets</div>
                  <span style="font-size:12px;color:#78716C;">${this.widgets.length} widget${this.widgets.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="no-selection">Click a widget to configure it</div>
              </div>
            `}
          </div>

        </div>
      </div>
      ${this._renderContextMenu()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-dashboard-studio': PhzDashboardStudio; }
}
