/**
 * @phozart/phz-widgets — Standalone Widget Renderer
 *
 * Renders a single widget from an EnhancedWidgetConfig + raw data.
 * Processes data via the widget data processor, then renders the appropriate component.
 * For embedding individual widgets outside a dashboard.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { processWidgetData, createDefaultScoreProvider, } from '@phozart/phz-engine';
import './phz-kpi-card.js';
import './phz-kpi-scorecard.js';
import './phz-bar-chart.js';
import './phz-trend-line.js';
import './phz-bottom-n.js';
import './phz-status-table.js';
import './phz-drill-link.js';
let PhzWidget = class PhzWidget extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.loading = false;
        this.error = null;
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }

      .widget-container {
        border-radius: var(--phz-widget-radius, 8px);
        background: var(--phz-widget-bg, #FFFFFF);
        overflow: hidden;
      }
      .widget-container--shadow-sm { box-shadow: 0 2px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04); }
      .widget-container--shadow-md { box-shadow: 0 4px 8px rgba(28,25,23,0.08), 0 2px 4px rgba(28,25,23,0.04); }
      .widget-container--shadow-lg { box-shadow: 0 8px 16px rgba(28,25,23,0.10), 0 4px 8px rgba(28,25,23,0.06); }
      .widget-container--bordered { border: 1px solid var(--phz-widget-border-color, #E7E5E4); }

      .widget-title-bar {
        padding: 12px 16px 4px;
      }
      .widget-title {
        margin: 0; font-weight: 600; color: #1C1917;
      }
      .widget-subtitle {
        margin: 2px 0 0; font-size: 12px; color: #78716C;
      }

      .widget-body { padding: 8px; }

      .widget-placeholder {
        padding: 24px; text-align: center; color: #A8A29E; font-size: 13px;
      }
    `,
    ]; }
    renderWidgetContent() {
        if (!this.config)
            return html `<div class="widget-placeholder">No configuration</div>`;
        const { type, data: dataConfig, appearance } = this.config;
        const bindings = dataConfig.bindings;
        switch (type) {
            case 'kpi-card': {
                if (bindings.type !== 'kpi')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                const kpiDef = this.engine?.kpis.get(bindings.kpiId);
                if (!kpiDef)
                    return html `<div class="widget-placeholder">KPI not found</div>`;
                const provider = this.scoreProvider ?? createDefaultScoreProvider();
                const score = provider(bindings.kpiId, this.data, kpiDef);
                return html `<phz-kpi-card
          .kpiDefinition=${kpiDef}
          .value=${score.value}
          .previousValue=${score.previousValue}
          .trendData=${score.trendData}
          .cardStyle=${'compact'}
          .kpiAppearance=${appearance.kpi}
        ></phz-kpi-card>`;
            }
            case 'kpi-scorecard': {
                if (bindings.type !== 'scorecard')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                const kpiDefs = bindings.kpiIds.map(id => this.engine?.kpis.get(id)).filter(Boolean);
                const provider = this.scoreProvider ?? createDefaultScoreProvider();
                const scores = bindings.kpiIds.map(id => {
                    const def = this.engine?.kpis.get(id);
                    if (!def)
                        return null;
                    const s = provider(id, this.data, def);
                    return { kpiId: id, value: s.value, previousValue: s.previousValue, trend: s.trendData, breakdowns: s.breakdowns };
                }).filter(Boolean);
                return html `<phz-kpi-scorecard .kpiDefinitions=${kpiDefs} .scores=${scores}></phz-kpi-scorecard>`;
            }
            case 'bar-chart': {
                if (bindings.type !== 'chart')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                const processed = processWidgetData(this.data, dataConfig);
                const chartData = {
                    field: bindings.values[0]?.fieldKey ?? '',
                    label: this.config.name,
                    data: processed.rows.map(r => ({
                        x: r.label,
                        y: r.values[bindings.values[0]?.fieldKey] ?? 0,
                        label: r.label,
                    })),
                };
                return html `<phz-bar-chart
          .data=${chartData}
          .rankOrder=${dataConfig.sort?.direction ?? 'desc'}
          .maxBars=${dataConfig.limit ?? 10}
          .colors=${appearance.chart?.colors ?? []}
        ></phz-bar-chart>`;
            }
            case 'trend-line': {
                if (bindings.type !== 'chart')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                const metricField = bindings.values[0]?.fieldKey ?? '';
                // Try to find KPI for target
                let target;
                if (this.engine) {
                    for (const kpi of this.engine.kpis.list()) {
                        if (kpi.id === metricField) {
                            target = kpi.target;
                            break;
                        }
                    }
                }
                const provider = this.scoreProvider ?? createDefaultScoreProvider();
                const kpiDef = this.engine?.kpis.list().find(k => k.id === metricField);
                let trendPoints = [];
                if (kpiDef) {
                    const score = provider(kpiDef.id, this.data, kpiDef);
                    trendPoints = score.trendData ?? [];
                }
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const chartData = {
                    field: metricField,
                    label: this.config.name,
                    data: trendPoints.map((v, i) => ({ x: months[i % 12], y: v, label: months[i % 12] })),
                };
                return html `<phz-trend-line
          .data=${chartData}
          .target=${target}
          .periods=${12}
          .kpiDefinition=${kpiDef}
          .lineColor=${appearance.chart?.colors?.[0] ?? ''}
        ></phz-trend-line>`;
            }
            case 'bottom-n': {
                if (bindings.type !== 'chart')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                const processed = processWidgetData(this.data, dataConfig);
                const metricField = bindings.values[0]?.fieldKey ?? '';
                const dimField = bindings.category?.fieldKey ?? '';
                const entries = processed.rows.map(r => ({ [dimField]: r.label, [metricField]: r.values[metricField] ?? 0 }));
                return html `<phz-bottom-n
          .data=${entries}
          .metricField=${metricField}
          .dimensionField=${dimField}
          .n=${appearance.bottomN?.count ?? 5}
          .direction=${appearance.bottomN?.mode ?? 'bottom'}
        ></phz-bottom-n>`;
            }
            case 'status-table': {
                if (bindings.type !== 'status-table')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                const kpiDefs = bindings.kpiIds.map(id => this.engine?.kpis.get(id)).filter(Boolean);
                return html `<phz-status-table
          .data=${this.data}
          .entityField=${bindings.entityField?.fieldKey ?? ''}
          .kpiDefinitions=${kpiDefs}
        ></phz-status-table>`;
            }
            case 'drill-link': {
                if (bindings.type !== 'drill-link')
                    return html `<div class="widget-placeholder">Invalid bindings</div>`;
                return html `<phz-drill-link
          .label=${bindings.label}
          .targetReportId=${bindings.targetReportId}
          .filters=${bindings.passFilters}
        ></phz-drill-link>`;
            }
            default:
                return html `<div class="widget-placeholder">${type}</div>`;
        }
    }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    render() {
        if (this.loading) {
            return html `<div class="phz-w-card phz-w-state" aria-live="polite" aria-busy="true">
        <div class="phz-w-state__spinner"></div>
        <p class="phz-w-state__message">Loading...</p>
      </div>`;
        }
        if (this.error) {
            return html `<div class="phz-w-card phz-w-state" role="alert">
        <p class="phz-w-state__error-message">${this.error}</p>
        <button class="phz-w-state__retry-btn" @click=${this.handleRetry}>Retry</button>
      </div>`;
        }
        if (!this.config)
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No widget configuration</p></div>`;
        const { appearance } = this.config;
        const { container, titleBar } = appearance;
        const classes = ['widget-container'];
        if (container.shadow !== 'none')
            classes.push(`widget-container--shadow-${container.shadow}`);
        if (container.border)
            classes.push('widget-container--bordered');
        const containerStyle = [
            container.borderRadius !== undefined ? `border-radius:${container.borderRadius}px` : '',
            container.background ? `background:${container.background}` : '',
            container.borderColor && container.border ? `border-color:${container.borderColor}` : '',
        ].filter(Boolean).join(';');
        return html `
      <div class="${classes.join(' ')}" style="${containerStyle}">
        ${titleBar.show && titleBar.title ? html `
          <div class="widget-title-bar">
            <h3 class="widget-title" style="font-size:${titleBar.fontSize ?? 14}px;color:${titleBar.color ?? '#1C1917'};font-weight:${titleBar.fontWeight ?? 600};">
              ${titleBar.icon ? html `<span style="margin-right:4px;">${titleBar.icon}</span>` : nothing}
              ${titleBar.title}
            </h3>
            ${titleBar.subtitle ? html `<p class="widget-subtitle">${titleBar.subtitle}</p>` : nothing}
          </div>
        ` : nothing}
        <div class="widget-body">
          ${this.renderWidgetContent()}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzWidget.prototype, "config", void 0);
__decorate([
    property({ type: Array })
], PhzWidget.prototype, "data", void 0);
__decorate([
    property({ type: Object })
], PhzWidget.prototype, "engine", void 0);
__decorate([
    property({ type: Object })
], PhzWidget.prototype, "scoreProvider", void 0);
__decorate([
    property({ type: Boolean })
], PhzWidget.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzWidget.prototype, "error", void 0);
PhzWidget = __decorate([
    customElement('phz-widget')
], PhzWidget);
export { PhzWidget };
//# sourceMappingURL=phz-widget.js.map