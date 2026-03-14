/**
 * @phozart/widgets — Dashboard Renderer
 *
 * Renders a full dashboard from config: resolves layout, positions widgets in CSS grid.
 * When `data` is provided, auto-hydrates widgets via the engine widget resolver.
 * Supports both legacy DashboardConfig and EnhancedDashboardConfig (detected via `version` field).
 * This is an embeddable component, not a standalone app.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type {
  DashboardConfig, BIEngine, WidgetPlacement,
  ResolvedWidgetProps, KPIScoreProvider,
  EnhancedDashboardConfig, EnhancedWidgetConfig, GlobalFilter,
  FilterAdapter,
} from '@phozart/engine';
import { resolveDashboardWidgets, createDefaultScoreProvider, isEnhancedDashboard, applyArtefactCriteria } from '@phozart/engine';
import type { SelectionContext } from '@phozart/core';
import { resolveWidgetState } from '../widget-states.js';

// Import widget components for side-effects (registration)
import './phz-kpi-card.js';
import './phz-kpi-scorecard.js';
import './phz-bar-chart.js';
import './phz-trend-line.js';
import './phz-bottom-n.js';
import './phz-status-table.js';
import './phz-drill-link.js';
import './phz-widget.js';

@customElement('phz-dashboard')
export class PhzDashboard extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; container-type: inline-size; }

      .dashboard {
        display: grid;
        gap: var(--phz-dashboard-gap, 16px);
      }

      .dashboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .dashboard-title {
        font-size: 18px;
        font-weight: 700;
        color: #1C1917;
        margin: 0;
      }

      .dashboard-desc {
        font-size: 13px;
        color: #78716C;
        margin: 4px 0 0 0;
      }

      .widget-cell {
        min-height: 0;
      }

      .widget-placeholder {
        background: #FAFAF9;
        border: 1px dashed #D6D3D1;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #A8A29E;
        font-size: 13px;
      }

      .global-filter-bar {
        display: flex; align-items: center; gap: 8px; padding: 8px 0;
        margin-bottom: 12px; flex-wrap: wrap;
      }
      .global-filter-label {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .global-filter-select {
        padding: 4px 8px; border: 1px solid #D6D3D1; border-radius: 6px;
        font-size: 12px; background: white;
      }
    `,
  ];

  @property({ type: Object }) config?: DashboardConfig | EnhancedDashboardConfig;
  @property({ type: Object }) engine?: BIEngine;
  @property({ type: Object }) selectionContext?: SelectionContext;
  @property({ type: Array }) data?: Record<string, unknown>[];
  @property({ type: Object }) scoreProvider?: KPIScoreProvider;
  /** Optional FilterAdapter for unified CriteriaEngine-based filtering. */
  @property({ type: Object }) filterAdapter?: FilterAdapter;
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  @state() private refreshTimer?: number;
  @state() private resolvedWidgets?: Map<string, ResolvedWidgetProps>;
  @state() private globalFilterValues: Record<string, unknown> = {};
  private filterUnsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.setupAutoRefresh();
    this.setupFilterSubscription();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.filterUnsubscribe?.();
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('filterAdapter')) {
      this.filterUnsubscribe?.();
      this.setupFilterSubscription();
    }
    if (changed.has('data') || changed.has('engine') || changed.has('config') || changed.has('scoreProvider') || changed.has('selectionContext') || changed.has('globalFilterValues') || changed.has('filterAdapter')) {
      this.resolveWidgets();
    }
  }

  private setupFilterSubscription() {
    if (!this.filterAdapter) return;
    this.filterUnsubscribe = this.filterAdapter.subscribe(() => {
      // Re-resolve widgets when filter criteria change
      this.resolveWidgets();
      this.requestUpdate();
    });
  }

  private get isEnhanced(): boolean {
    return isEnhancedDashboard(this.config);
  }

  private get legacyConfig(): DashboardConfig | undefined {
    if (!this.config) return undefined;
    if (!this.isEnhanced) return this.config as DashboardConfig;
    // Bridge enhanced config to legacy for the resolver
    const e = this.config as EnhancedDashboardConfig;
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      layout: { columns: e.layout.columns, rowHeight: 180, gap: e.layout.gap, responsive: true },
      widgets: [], // Enhanced rendering uses phz-widget directly
      created: e.metadata.created,
      updated: e.metadata.updated,
      autoRefreshInterval: e.autoRefreshInterval,
    };
  }

  /**
   * Get the data filtered through the FilterAdapter (if available),
   * falling back to the legacy globalFilterValues approach.
   */
  private getFilteredData(): Record<string, unknown>[] {
    const raw = this.data ?? [];
    if (this.filterAdapter) {
      return this.filterAdapter.applyFilters(raw);
    }
    return this.applyGlobalFilterValues(raw);
  }

  private resolveWidgets() {
    if (!this.data || !this.engine || !this.config) {
      this.resolvedWidgets = undefined;
      return;
    }

    // For legacy config, use the resolver as before
    if (!this.isEnhanced) {
      const filteredData = this.getFilteredData();

      this.resolvedWidgets = resolveDashboardWidgets(this.config as DashboardConfig, {
        engine: this.engine,
        data: filteredData,
        selectionContext: this.selectionContext,
        scoreProvider: this.scoreProvider ?? createDefaultScoreProvider(),
      });
    }
    // Enhanced config widgets are rendered via <phz-widget>, no need to resolve here
  }

  private applyGlobalFilterValues(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!this.isEnhanced || Object.keys(this.globalFilterValues).length === 0) return rows;
    const eConfig = this.config as EnhancedDashboardConfig;
    let filtered = rows;
    for (const gf of eConfig.globalFilters) {
      const val = this.globalFilterValues[gf.id];
      if (val === undefined || val === '') continue;
      filtered = filtered.filter(row => {
        const cellVal = row[gf.fieldKey];
        if (gf.filterType === 'select') return String(cellVal) === String(val);
        if (gf.filterType === 'multi-select' && Array.isArray(val)) return val.includes(String(cellVal));
        if (gf.filterType === 'text-search' && typeof val === 'string') return String(cellVal ?? '').toLowerCase().includes(val.toLowerCase());
        return true;
      });
    }
    return filtered;
  }

  private setupAutoRefresh() {
    const interval = this.isEnhanced
      ? (this.config as EnhancedDashboardConfig)?.autoRefreshInterval
      : (this.config as DashboardConfig)?.autoRefreshInterval;

    if (interval && interval > 0) {
      this.refreshTimer = window.setInterval(() => {
        this.dispatchEvent(new CustomEvent('dashboard-refresh', {
          bubbles: true, composed: true,
        }));
      }, interval * 1000);
    }
  }

  private handleWidgetClick(widgetId: string, widgetType: string) {
    this.dispatchEvent(new CustomEvent('widget-click', {
      bubbles: true, composed: true,
      detail: { widgetId, widgetType },
    }));
  }

  /** Get a copy of the current config for external use */
  getConfig(): DashboardConfig | EnhancedDashboardConfig | undefined {
    return this.config ? structuredClone(this.config) : undefined;
  }

  /** Emit dashboard-save event with current config */
  save() {
    if (!this.config) return;
    this.dispatchEvent(new CustomEvent('dashboard-save', {
      bubbles: true, composed: true,
      detail: { config: structuredClone(this.config) },
    }));
  }

  private renderWidget(widget: WidgetPlacement) {
    const p = this.resolvedWidgets?.get(widget.id as string);

    switch (widget.widgetType) {
      case 'kpi-card':
        return html`<phz-kpi-card
          .kpiDefinition=${p?.kpiDefinition}
          .value=${p?.value ?? 0}
          .previousValue=${p?.previousValue}
          .trendData=${p?.trendData}
          .cardStyle=${p?.cardStyle ?? 'compact'}
          .selectionContext=${this.selectionContext}
        ></phz-kpi-card>`;
      case 'kpi-scorecard':
        return html`<phz-kpi-scorecard
          .kpiDefinitions=${p?.kpiDefinitions ?? []}
          .scores=${p?.scores ?? []}
        ></phz-kpi-scorecard>`;
      case 'bar-chart':
        return html`<phz-bar-chart
          .data=${p?.chartData}
          .rankOrder=${p?.rankOrder ?? 'desc'}
          .maxBars=${p?.maxBars ?? 10}
        ></phz-bar-chart>`;
      case 'trend-line':
        return html`<phz-trend-line
          .data=${p?.chartData}
          .target=${p?.target}
          .periods=${p?.periods ?? 12}
          .kpiDefinition=${p?.kpiDefinition}
        ></phz-trend-line>`;
      case 'bottom-n':
        return html`<phz-bottom-n
          .data=${p?.data ?? []}
          .metricField=${p?.metricField ?? ''}
          .dimensionField=${p?.dimensionField ?? ''}
          .n=${p?.n ?? 5}
          .direction=${p?.direction ?? 'bottom'}
          .kpiDefinition=${p?.kpiDefinition}
        ></phz-bottom-n>`;
      case 'status-table':
        return html`<phz-status-table
          .data=${p?.data ?? []}
          .entityField=${p?.entityField ?? ''}
          .kpiDefinitions=${p?.kpiDefinitions ?? []}
        ></phz-status-table>`;
      case 'drill-link':
        return html`<phz-drill-link
          .label=${p?.label ?? 'View Details'}
          .targetReportId=${p?.targetReportId ?? ''}
          .filters=${p?.filters}
        ></phz-drill-link>`;
      default:
        return html`<div class="widget-placeholder">${widget.widgetType}</div>`;
    }
  }

  private renderEnhancedGlobalFilters(filters: GlobalFilter[]) {
    if (filters.length === 0) return nothing;
    const filteredData = this.data ?? [];

    return html`
      <div class="global-filter-bar">
        <span class="global-filter-label">Filters</span>
        ${filters.map(gf => {
          const uniqueValues = [...new Set(filteredData.map(r => String(r[gf.fieldKey] ?? '')))].sort();
          return html`
            <select class="global-filter-select"
                    @change=${(e: Event) => {
                      const val = (e.target as HTMLSelectElement).value;
                      this.globalFilterValues = { ...this.globalFilterValues, [gf.id]: val || undefined };
                    }}>
              <option value="">${gf.label}: All</option>
              ${uniqueValues.map(v => html`<option value=${v} ?selected=${this.globalFilterValues[gf.id] === v}>${v}</option>`)}
            </select>
          `;
        })}
      </div>
    `;
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
  }

  render() {
    if (this.loading) {
      return html`<div class="phz-w-card phz-w-state" aria-live="polite" aria-busy="true">
        <div class="phz-w-state__spinner"></div>
        <p class="phz-w-state__message">Loading dashboard...</p>
      </div>`;
    }

    if (this.error) {
      return html`<div class="phz-w-card phz-w-state" role="alert">
        <p class="phz-w-state__error-message">${this.error}</p>
        <button class="phz-w-state__retry-btn" @click=${this.handleRetry}>Retry</button>
      </div>`;
    }

    if (!this.config) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No dashboard configuration</p></div>`;
    }

    // Enhanced dashboard rendering
    if (this.isEnhanced) {
      const eConfig = this.config as EnhancedDashboardConfig;
      const gridStyle = `grid-template-columns: repeat(${eConfig.layout.columns}, 1fr); gap: ${eConfig.layout.gap}px;`;
      const filteredData = this.getFilteredData();

      return html`
        <div role="region" aria-label="${eConfig.name}" style="background:${eConfig.theme.background};">
          <div class="dashboard-header">
            <div>
              <h2 class="dashboard-title" style="color:${eConfig.theme.textColor};">${eConfig.name}</h2>
              ${eConfig.description
                ? html`<p class="dashboard-desc" style="color:${eConfig.theme.mutedColor};">${eConfig.description}</p>`
                : nothing}
            </div>
          </div>

          ${!this.filterAdapter ? this.renderEnhancedGlobalFilters(eConfig.globalFilters) : nothing}

          <div class="dashboard" style="${gridStyle}">
            ${eConfig.widgets.map((widget: EnhancedWidgetConfig) => {
              const placement = eConfig.placements.find(p => (p.widgetId as string) === (widget.id as string));
              const colSpan = placement?.colSpan ?? 1;
              const heightStyle = placement?.heightOverride ? `min-height:${placement.heightOverride}px;` : '';
              const theme = eConfig.theme;
              return html`
                <div class="widget-cell"
                     style="grid-column: span ${colSpan};${heightStyle}--phz-widget-bg:${theme.cardBackground};--phz-widget-border-color:${theme.borderColor};"
                     @click=${() => this.handleWidgetClick(widget.id as string, widget.type)}>
                  <phz-widget
                    .config=${widget}
                    .data=${filteredData}
                    .engine=${this.engine}
                    .scoreProvider=${this.scoreProvider ?? createDefaultScoreProvider()}
                  ></phz-widget>
                </div>
              `;
            })}
          </div>
        </div>
      `;
    }

    // Legacy dashboard rendering
    const legacyConfig = this.config as DashboardConfig;
    const { layout, widgets } = legacyConfig;
    const gridStyle = `grid-template-columns: repeat(${layout.columns}, 1fr); gap: ${layout.gap}px;`;

    return html`
      <div role="region" aria-label="${legacyConfig.name}">
        <div class="dashboard-header">
          <div>
            <h2 class="dashboard-title">${legacyConfig.name}</h2>
            ${legacyConfig.description
              ? html`<p class="dashboard-desc">${legacyConfig.description}</p>`
              : nothing}
          </div>
        </div>

        <div class="dashboard" style="${gridStyle}">
          ${widgets.map((widget: WidgetPlacement) => html`
            <div class="widget-cell"
                 style="grid-column: span ${widget.position.colSpan}; grid-row: span ${widget.position.rowSpan};"
                 @click=${() => this.handleWidgetClick(widget.id as string, widget.widgetType)}>
              ${this.renderWidget(widget)}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-dashboard': PhzDashboard;
  }
}
