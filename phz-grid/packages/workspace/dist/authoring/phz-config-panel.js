/**
 * @phozart/phz-workspace — Config Panel Component
 *
 * 5-section accordion panel for rich widget configuration.
 * Backward-compatible: renders old 3-tab panel when only `config` is set,
 * renders enhanced accordion panel when `enhancedConfig` is provided.
 *
 * Sections: Data | Appearance | Format | Overlays | Behavior
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { setActiveTab, updateStyleConfig, removeWidgetFilter } from './widget-config-state.js';
import { setEnhancedConfigSection, toggleEnhancedAccordion, updateEnhancedContainer, updateEnhancedTitleBar, updateEnhancedChart, updateEnhancedKpi, updateEnhancedScorecard, updateEnhancedBehaviour, addEnhancedFormattingRule, removeEnhancedFormattingRule, addEnhancedOverlay, removeEnhancedOverlay, addEnhancedThreshold, removeEnhancedThreshold, } from './enhanced-config-state.js';
// Side-effect imports for micro-component self-registration
import './phz-color-picker.js';
import './phz-shadow-picker.js';
import './phz-slider-input.js';
const ENHANCED_SECTIONS = [
    { key: 'data', label: 'Data' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'format', label: 'Format' },
    { key: 'overlays', label: 'Overlays' },
    { key: 'behavior', label: 'Behavior' },
];
const CHART_TYPES = new Set(['bar-chart', 'line-chart', 'area-chart', 'trend-line', 'pie-chart']);
const KPI_TYPES = new Set(['kpi-card', 'gauge']);
const SCORECARD_TYPES = new Set(['kpi-scorecard', 'status-table']);
let PhzConfigPanel = class PhzConfigPanel extends LitElement {
    static { this.styles = css `
    :host { display: block; font-family: var(--phz-font-family, system-ui, sans-serif); }

    /* ============ Legacy tab styles ============ */
    .tabs { display: flex; border-bottom: 1px solid var(--phz-border, #d1d5db); }

    .tab {
      flex: 1; padding: 10px; text-align: center;
      background: transparent; border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer; font-size: 13px; font-weight: 500;
    }

    .tab.active { border-bottom-color: var(--phz-primary, #2563eb); color: var(--phz-primary, #2563eb); }

    .content { padding: 16px; }
    h4 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }

    .field-list { display: flex; flex-direction: column; gap: 4px; }

    .field-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px; font-size: 13px;
    }

    .field-name { flex: 1; }

    .agg-badge {
      font-size: 11px; padding: 1px 4px;
      background: var(--phz-bg-tertiary, #f3f4f6); border-radius: 2px;
    }

    .style-field { margin-bottom: 12px; }

    .style-label {
      display: block; font-size: 12px;
      color: var(--phz-text-secondary, #6b7280); margin-bottom: 4px;
    }

    .style-input {
      width: 100%; padding: 6px 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px; font-size: 13px; box-sizing: border-box;
    }

    .toggle-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0; font-size: 13px;
    }

    .filter-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px; font-size: 13px;
    }

    .remove-btn {
      background: none; border: none; cursor: pointer;
      color: var(--phz-text-secondary, #6b7280); font-size: 16px; margin-left: auto;
    }

    .empty-msg { font-size: 13px; color: var(--phz-text-secondary, #6b7280); padding: 8px 0; }

    /* ============ Enhanced accordion styles ============ */
    .section-tabs {
      display: flex; border-bottom: 1px solid var(--phz-border, #d1d5db);
      overflow-x: auto;
    }

    .section-tab {
      flex: 1; padding: 8px 4px; text-align: center;
      background: transparent; border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer; font-size: 12px; font-weight: 500;
      white-space: nowrap; color: var(--phz-text-secondary, #6b7280);
    }

    .section-tab.active {
      border-bottom-color: var(--phz-primary, #2563eb);
      color: var(--phz-primary, #2563eb);
    }

    .section-content { padding: 12px 16px; }

    .accordion {
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 6px; margin-bottom: 8px; overflow: hidden;
    }

    .accordion-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; background: var(--phz-bg-secondary, #f9fafb);
      cursor: pointer; border: none; width: 100%;
      font-size: 13px; font-weight: 600;
      color: var(--phz-text-primary, #1c1917);
    }

    .accordion-header:hover { background: var(--phz-bg-tertiary, #f3f4f6); }

    .accordion-arrow {
      font-size: 10px; transition: transform 0.15s;
      color: var(--phz-text-secondary, #6b7280);
    }

    .accordion-arrow.open { transform: rotate(90deg); }

    .accordion-body { padding: 12px; }

    .accordion-body .style-field { margin-bottom: 10px; }

    .select-input {
      width: 100%; padding: 6px 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px; font-size: 13px; box-sizing: border-box;
      background: #fff;
    }

    .list-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px; font-size: 13px; margin-bottom: 4px;
    }

    .list-item .label { flex: 1; }

    .add-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 6px 12px; border: 1px dashed var(--phz-border, #d1d5db);
      border-radius: 4px; background: transparent;
      cursor: pointer; font-size: 12px; width: 100%;
      color: var(--phz-text-secondary, #6b7280);
      justify-content: center;
    }

    .add-btn:hover { border-color: var(--phz-primary, #2563eb); color: var(--phz-primary, #2563eb); }
  `; }
    // ==================================================================
    // Legacy emit / handlers (backward compat)
    // ==================================================================
    _emit(config) {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config },
            bubbles: true, composed: true,
        }));
    }
    _setTab(tab) {
        if (!this.config)
            return;
        this._emit(setActiveTab(this.config, tab));
    }
    _updateTitle(e) {
        if (!this.config)
            return;
        this._emit(updateStyleConfig(this.config, { title: e.target.value }));
    }
    _updateSubtitle(e) {
        if (!this.config)
            return;
        this._emit(updateStyleConfig(this.config, { subtitle: e.target.value }));
    }
    _removeFilter(filterId) {
        if (!this.config)
            return;
        this._emit(removeWidgetFilter(this.config, filterId));
    }
    // ==================================================================
    // Enhanced emit
    // ==================================================================
    _emitEnhanced(config) {
        this.dispatchEvent(new CustomEvent('enhanced-config-changed', {
            detail: { config },
            bubbles: true, composed: true,
        }));
    }
    // ==================================================================
    // Render
    // ==================================================================
    render() {
        // Enhanced mode takes priority
        if (this.enhancedConfig) {
            return this._renderEnhanced();
        }
        // Legacy mode
        if (!this.config) {
            return html `<div class="content"><p class="empty-msg">No widget selected</p></div>`;
        }
        return html `
      <div class="tabs">
        ${['data', 'style', 'filters'].map(tab => html `
          <button class="tab ${this.config.activeTab === tab ? 'active' : ''}"
            @click=${() => this._setTab(tab)}>
            ${tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        `)}
      </div>
      <div class="content">${this._renderLegacyContent()}</div>
    `;
    }
    // ==================================================================
    // Legacy content
    // ==================================================================
    _renderLegacyContent() {
        if (!this.config)
            return nothing;
        switch (this.config.activeTab) {
            case 'data':
                return html `
          <h4>Dimensions</h4>
          <div class="field-list">
            ${this.config.dimensions.length === 0
                    ? html `<p class="empty-msg">Drag fields here</p>`
                    : this.config.dimensions.map(d => html `
                  <div class="field-item"><span class="field-name">${d.alias ?? d.field}</span></div>
                `)}
          </div>
          <h4 style="margin-top: 16px;">Measures</h4>
          <div class="field-list">
            ${this.config.measures.length === 0
                    ? html `<p class="empty-msg">Drag fields here</p>`
                    : this.config.measures.map(m => html `
                  <div class="field-item">
                    <span class="field-name">${m.alias ?? m.field}</span>
                    <span class="agg-badge">${m.aggregation}</span>
                  </div>
                `)}
          </div>
        `;
            case 'style':
                return html `
          <div class="style-field">
            <label class="style-label">Title</label>
            <input class="style-input" .value=${this.config.title}
              @input=${this._updateTitle} aria-label="Widget title" />
          </div>
          <div class="style-field">
            <label class="style-label">Subtitle</label>
            <input class="style-input" .value=${this.config.subtitle ?? ''}
              @input=${this._updateSubtitle} aria-label="Widget subtitle" />
          </div>
          <div class="toggle-row">
            <span>Show Legend</span>
            <input type="checkbox" .checked=${this.config.showLegend ?? false}
              @change=${(e) => this._emit(updateStyleConfig(this.config, { showLegend: e.target.checked }))}
              aria-label="Show legend" />
          </div>
          <div class="toggle-row">
            <span>Show Labels</span>
            <input type="checkbox" .checked=${this.config.showLabels ?? false}
              @change=${(e) => this._emit(updateStyleConfig(this.config, { showLabels: e.target.checked }))}
              aria-label="Show labels" />
          </div>
        `;
            case 'filters':
                return html `
          <div class="field-list">
            ${this.config.widgetFilters.length === 0
                    ? html `<p class="empty-msg">No widget-level filters. Add filters to scope this widget's data.</p>`
                    : this.config.widgetFilters.map(f => html `
                  <div class="filter-item">
                    <span>${f.label}</span>
                    <button class="remove-btn" @click=${() => this._removeFilter(f.filterId)}
                      aria-label="Remove filter">×</button>
                  </div>
                `)}
          </div>
        `;
        }
    }
    // ==================================================================
    // Enhanced panel
    // ==================================================================
    _renderEnhanced() {
        const ec = this.enhancedConfig;
        return html `
      <div class="section-tabs" role="tablist">
        ${ENHANCED_SECTIONS.map(s => html `
          <button class="section-tab ${ec.activeSection === s.key ? 'active' : ''}"
            role="tab" aria-selected="${ec.activeSection === s.key}"
            @click=${() => this._emitEnhanced(setEnhancedConfigSection(ec, s.key))}>
            ${s.label}
          </button>
        `)}
      </div>
      <div class="section-content" role="tabpanel">
        ${this._renderEnhancedSection()}
      </div>
    `;
    }
    _renderEnhancedSection() {
        const ec = this.enhancedConfig;
        switch (ec.activeSection) {
            case 'data':
                return this._renderDataSection(ec);
            case 'appearance':
                return this._renderAppearanceSection(ec);
            case 'format':
                return this._renderFormatSection(ec);
            case 'overlays':
                return this._renderOverlaysSection(ec);
            case 'behavior':
                return this._renderBehaviorSection(ec);
        }
    }
    // ---------- Data section (placeholder — config panel focuses on appearance) ----------
    _renderDataSection(ec) {
        return html `
      <p class="empty-msg">Data bindings are configured via the data shelf. Select fields from the data panel and drag them onto the widget.</p>
    `;
    }
    // ---------- Appearance section ----------
    _isAccordionOpen(ec, id) {
        return ec.expandedAccordions.includes(id);
    }
    _renderAccordion(ec, id, title, content) {
        const open = this._isAccordionOpen(ec, id);
        return html `
      <div class="accordion">
        <button class="accordion-header"
          aria-expanded="${open}"
          @click=${() => this._emitEnhanced(toggleEnhancedAccordion(ec, id))}>
          <span>${title}</span>
          <span class="accordion-arrow ${open ? 'open' : ''}">&#9654;</span>
        </button>
        ${open ? html `<div class="accordion-body">${content}</div>` : nothing}
      </div>
    `;
    }
    _renderAppearanceSection(ec) {
        return html `
      ${this._renderContainerAccordion(ec)}
      ${this._renderTitleBarAccordion(ec)}
      ${CHART_TYPES.has(ec.widgetType) ? this._renderChartAccordion(ec) : nothing}
      ${KPI_TYPES.has(ec.widgetType) ? this._renderKpiAccordion(ec) : nothing}
      ${SCORECARD_TYPES.has(ec.widgetType) ? this._renderScorecardAccordion(ec) : nothing}
    `;
    }
    // --- Container accordion ---
    _renderContainerAccordion(ec) {
        return this._renderAccordion(ec, 'container', 'Container', html `
      <div class="style-field">
        <phz-shadow-picker label="Shadow"
          .value=${ec.container.shadow}
          @shadow-changed=${(e) => this._emitEnhanced(updateEnhancedContainer(ec, { shadow: e.detail.shadow }))}>
        </phz-shadow-picker>
      </div>

      <div class="style-field">
        <phz-slider-input label="Border Radius"
          .value=${ec.container.borderRadius}
          .min=${0} .max=${32} .step=${1} suffix="px"
          @value-changed=${(e) => this._emitEnhanced(updateEnhancedContainer(ec, { borderRadius: e.detail.value }))}>
        </phz-slider-input>
      </div>

      <div class="style-field">
        <phz-color-picker label="Background"
          .value=${ec.container.background ?? '#FFFFFF'}
          @color-changed=${(e) => this._emitEnhanced(updateEnhancedContainer(ec, { background: e.detail.color }))}>
        </phz-color-picker>
      </div>

      <div class="toggle-row">
        <span>Border</span>
        <input type="checkbox" .checked=${ec.container.border ?? false}
          @change=${(e) => this._emitEnhanced(updateEnhancedContainer(ec, { border: e.target.checked }))}
          aria-label="Show border" />
      </div>

      ${ec.container.border ? html `
        <div class="style-field">
          <phz-color-picker label="Border Color"
            .value=${ec.container.borderColor ?? '#D6D3D1'}
            @color-changed=${(e) => this._emitEnhanced(updateEnhancedContainer(ec, { borderColor: e.detail.color }))}>
          </phz-color-picker>
        </div>
      ` : nothing}
    `);
    }
    // --- Title Bar accordion ---
    _renderTitleBarAccordion(ec) {
        return this._renderAccordion(ec, 'titlebar', 'Title Bar', html `
      <div class="toggle-row">
        <span>Show Title Bar</span>
        <input type="checkbox" .checked=${ec.titleBar.show}
          @change=${(e) => this._emitEnhanced(updateEnhancedTitleBar(ec, { show: e.target.checked }))}
          aria-label="Show title bar" />
      </div>

      ${ec.titleBar.show ? html `
        <div class="style-field">
          <label class="style-label">Title</label>
          <input class="style-input" .value=${ec.titleBar.title ?? ''}
            @input=${(e) => this._emitEnhanced(updateEnhancedTitleBar(ec, { title: e.target.value }))}
            aria-label="Title text" />
        </div>

        <div class="style-field">
          <label class="style-label">Subtitle</label>
          <input class="style-input" .value=${ec.titleBar.subtitle ?? ''}
            @input=${(e) => this._emitEnhanced(updateEnhancedTitleBar(ec, { subtitle: e.target.value }))}
            aria-label="Subtitle text" />
        </div>

        <div class="style-field">
          <phz-slider-input label="Font Size"
            .value=${ec.titleBar.fontSize ?? 14}
            .min=${10} .max=${24} .step=${1} suffix="px"
            @value-changed=${(e) => this._emitEnhanced(updateEnhancedTitleBar(ec, { fontSize: e.detail.value }))}>
          </phz-slider-input>
        </div>

        <div class="style-field">
          <label class="style-label">Font Weight</label>
          <select class="select-input"
            @change=${(e) => this._emitEnhanced(updateEnhancedTitleBar(ec, { fontWeight: Number(e.target.value) }))}
            aria-label="Font weight">
            ${[400, 500, 600, 700].map(w => html `
              <option value="${w}" ?selected=${(ec.titleBar.fontWeight ?? 600) === w}>${w === 400 ? 'Normal' : w === 500 ? 'Medium' : w === 600 ? 'Semi-Bold' : 'Bold'}</option>
            `)}
          </select>
        </div>

        <div class="style-field">
          <phz-color-picker label="Text Color"
            .value=${ec.titleBar.color ?? '#1C1917'}
            @color-changed=${(e) => this._emitEnhanced(updateEnhancedTitleBar(ec, { color: e.detail.color }))}>
          </phz-color-picker>
        </div>
      ` : nothing}
    `);
    }
    // --- Chart accordion ---
    _renderChartAccordion(ec) {
        if (!ec.chart)
            return nothing;
        const chart = ec.chart;
        return this._renderAccordion(ec, 'chart', 'Chart', html `
      <div class="style-field">
        <phz-slider-input label="Height"
          .value=${chart.height ?? 300}
          .min=${100} .max=${800} .step=${10} suffix="px"
          @value-changed=${(e) => this._emitEnhanced(updateEnhancedChart(ec, { height: e.detail.value }))}>
        </phz-slider-input>
      </div>

      <div class="style-field">
        <phz-slider-input label="Padding"
          .value=${chart.padding ?? 16}
          .min=${0} .max=${48} .step=${4} suffix="px"
          @value-changed=${(e) => this._emitEnhanced(updateEnhancedChart(ec, { padding: e.detail.value }))}>
        </phz-slider-input>
      </div>

      <div class="toggle-row">
        <span>X Axis</span>
        <input type="checkbox" .checked=${chart.xAxis?.show ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedChart(ec, { xAxis: { ...chart.xAxis, show: e.target.checked } }))}
          aria-label="Show X axis" />
      </div>

      <div class="toggle-row">
        <span>Y Axis</span>
        <input type="checkbox" .checked=${chart.yAxis?.show ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedChart(ec, { yAxis: { ...chart.yAxis, show: e.target.checked } }))}
          aria-label="Show Y axis" />
      </div>

      <div class="style-field">
        <label class="style-label">Legend Position</label>
        <select class="select-input"
          @change=${(e) => {
            const pos = e.target.value;
            if (pos === 'none') {
                this._emitEnhanced(updateEnhancedChart(ec, { legend: { show: false, position: 'top' } }));
            }
            else {
                this._emitEnhanced(updateEnhancedChart(ec, { legend: { show: true, position: pos } }));
            }
        }}
          aria-label="Legend position">
          <option value="none" ?selected=${!chart.legend?.show}>None</option>
          ${['top', 'bottom', 'left', 'right'].map(p => html `
            <option value="${p}" ?selected=${chart.legend?.show && chart.legend.position === p}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>
          `)}
        </select>
      </div>

      <div class="toggle-row">
        <span>Data Labels</span>
        <input type="checkbox" .checked=${chart.dataLabels?.show ?? false}
          @change=${(e) => this._emitEnhanced(updateEnhancedChart(ec, { dataLabels: { ...chart.dataLabels, show: e.target.checked, position: chart.dataLabels?.position ?? 'outside' } }))}
          aria-label="Show data labels" />
      </div>

      <div class="style-field">
        <label class="style-label">Color Palette</label>
        <select class="select-input"
          @change=${(e) => this._emitEnhanced(updateEnhancedChart(ec, { palette: e.target.value }))}
          aria-label="Color palette">
          ${['phz-default', 'phz-warm', 'phz-cool', 'phz-mono', 'phz-vivid'].map(p => html `
            <option value="${p}" ?selected=${(chart.palette ?? 'phz-default') === p}>${p}</option>
          `)}
        </select>
      </div>
    `);
    }
    // --- KPI accordion ---
    _renderKpiAccordion(ec) {
        if (!ec.kpi)
            return nothing;
        const kpi = ec.kpi;
        return this._renderAccordion(ec, 'kpi', 'KPI', html `
      <div class="style-field">
        <phz-slider-input label="Value Size"
          .value=${kpi.valueSize ?? 28}
          .min=${16} .max=${64} .step=${2} suffix="px"
          @value-changed=${(e) => this._emitEnhanced(updateEnhancedKpi(ec, { valueSize: e.detail.value }))}>
        </phz-slider-input>
      </div>

      <div class="style-field">
        <label class="style-label">Layout Direction</label>
        <select class="select-input"
          @change=${(e) => this._emitEnhanced(updateEnhancedKpi(ec, { layout: e.target.value }))}
          aria-label="Layout direction">
          <option value="vertical" ?selected=${(kpi.layout ?? 'vertical') === 'vertical'}>Vertical</option>
          <option value="horizontal" ?selected=${kpi.layout === 'horizontal'}>Horizontal</option>
        </select>
      </div>

      <div class="style-field">
        <label class="style-label">Alignment</label>
        <select class="select-input"
          @change=${(e) => this._emitEnhanced(updateEnhancedKpi(ec, { alignment: e.target.value }))}
          aria-label="Alignment">
          <option value="left" ?selected=${kpi.alignment === 'left'}>Left</option>
          <option value="center" ?selected=${(kpi.alignment ?? 'center') === 'center'}>Center</option>
          <option value="right" ?selected=${kpi.alignment === 'right'}>Right</option>
        </select>
      </div>

      <div class="toggle-row">
        <span>Show Trend</span>
        <input type="checkbox" .checked=${kpi.showTrend ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedKpi(ec, { showTrend: e.target.checked }))}
          aria-label="Show trend indicator" />
      </div>

      <div class="toggle-row">
        <span>Show Target</span>
        <input type="checkbox" .checked=${kpi.showTarget ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedKpi(ec, { showTarget: e.target.checked }))}
          aria-label="Show target" />
      </div>

      <div class="toggle-row">
        <span>Show Sparkline</span>
        <input type="checkbox" .checked=${kpi.showSparkline ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedKpi(ec, { showSparkline: e.target.checked }))}
          aria-label="Show sparkline" />
      </div>
    `);
    }
    // --- Scorecard accordion ---
    _renderScorecardAccordion(ec) {
        if (!ec.scorecard)
            return nothing;
        const sc = ec.scorecard;
        return this._renderAccordion(ec, 'scorecard', 'Scorecard', html `
      <div class="style-field">
        <label class="style-label">Density</label>
        <select class="select-input"
          @change=${(e) => this._emitEnhanced(updateEnhancedScorecard(ec, { density: e.target.value }))}
          aria-label="Scorecard density">
          <option value="comfortable" ?selected=${sc.density === 'comfortable'}>Comfortable</option>
          <option value="compact" ?selected=${(sc.density ?? 'compact') === 'compact'}>Compact</option>
          <option value="dense" ?selected=${sc.density === 'dense'}>Dense</option>
        </select>
      </div>

      <div class="toggle-row">
        <span>Row Banding</span>
        <input type="checkbox" .checked=${sc.rowBanding ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedScorecard(ec, { rowBanding: e.target.checked }))}
          aria-label="Toggle row banding" />
      </div>

      <div class="toggle-row">
        <span>Sticky Header</span>
        <input type="checkbox" .checked=${sc.stickyHeader ?? true}
          @change=${(e) => this._emitEnhanced(updateEnhancedScorecard(ec, { stickyHeader: e.target.checked }))}
          aria-label="Toggle sticky header" />
      </div>
    `);
    }
    // ---------- Format section ----------
    _renderFormatSection(ec) {
        return html `
      ${this._renderAccordion(ec, 'formatting-rules', 'Formatting Rules', html `
        ${ec.formattingRules.length === 0
            ? html `<p class="empty-msg">No formatting rules defined.</p>`
            : ec.formattingRules.map(rule => html `
              <div class="list-item">
                <span class="label">${rule.field} ${rule.condition} ${rule.value}${rule.value2 != null ? ` - ${rule.value2}` : ''}</span>
                <button class="remove-btn"
                  @click=${() => this._emitEnhanced(removeEnhancedFormattingRule(ec, rule.id))}
                  aria-label="Remove formatting rule">×</button>
              </div>
            `)}
        <button class="add-btn"
          @click=${() => this._emitEnhanced(addEnhancedFormattingRule(ec, {
            field: '',
            condition: 'gt',
            value: 0,
            style: { bold: true },
        }))}
          aria-label="Add formatting rule">+ Add Rule</button>
      `)}

      ${this._renderAccordion(ec, 'thresholds', 'Thresholds', html `
        ${ec.thresholds.length === 0
            ? html `<p class="empty-msg">No thresholds defined.</p>`
            : ec.thresholds.map((t, i) => html `
              <div class="list-item">
                <span class="label" style="color: ${t.color}">${t.label ?? `Threshold ${i + 1}`}: ${t.value}</span>
                <button class="remove-btn"
                  @click=${() => this._emitEnhanced(removeEnhancedThreshold(ec, i))}
                  aria-label="Remove threshold">×</button>
              </div>
            `)}
        <button class="add-btn"
          @click=${() => this._emitEnhanced(addEnhancedThreshold(ec, { value: 0, color: '#DC2626', label: 'Warning' }))}
          aria-label="Add threshold">+ Add Threshold</button>
      `)}
    `;
    }
    // ---------- Overlays section (chart only) ----------
    _renderOverlaysSection(ec) {
        if (!CHART_TYPES.has(ec.widgetType)) {
            return html `<p class="empty-msg">Overlays are only available for chart widgets.</p>`;
        }
        return html `
      ${this._renderAccordion(ec, 'reference-lines', 'Reference Lines', html `
        ${ec.overlays.filter(o => o.type === 'reference-line').length === 0
            ? html `<p class="empty-msg">No reference lines.</p>`
            : ec.overlays.filter(o => o.type === 'reference-line').map(o => html `
              <div class="list-item">
                <span class="label">${o.label ?? 'Ref Line'}: ${o.value ?? ''}</span>
                <button class="remove-btn"
                  @click=${() => this._emitEnhanced(removeEnhancedOverlay(ec, o.id))}
                  aria-label="Remove reference line">×</button>
              </div>
            `)}
        <button class="add-btn"
          @click=${() => this._emitEnhanced(addEnhancedOverlay(ec, {
            type: 'reference-line', label: 'Ref Line', value: 0, color: '#DC2626',
        }))}
          aria-label="Add reference line">+ Add Reference Line</button>
      `)}

      ${this._renderAccordion(ec, 'trend-lines', 'Trend Lines', html `
        ${ec.overlays.filter(o => o.type === 'trend-line').length === 0
            ? html `<p class="empty-msg">No trend lines.</p>`
            : ec.overlays.filter(o => o.type === 'trend-line').map(o => html `
              <div class="list-item">
                <span class="label">${o.label ?? 'Trend Line'}</span>
                <button class="remove-btn"
                  @click=${() => this._emitEnhanced(removeEnhancedOverlay(ec, o.id))}
                  aria-label="Remove trend line">×</button>
              </div>
            `)}
        <button class="add-btn"
          @click=${() => this._emitEnhanced(addEnhancedOverlay(ec, {
            type: 'trend-line', label: 'Trend', color: '#2563EB',
        }))}
          aria-label="Add trend line">+ Add Trend Line</button>
      `)}
    `;
    }
    // ---------- Behavior section ----------
    _renderBehaviorSection(ec) {
        return html `
      <div class="style-field">
        <label class="style-label">Click Action</label>
        <select class="select-input"
          @change=${(e) => this._emitEnhanced(updateEnhancedBehaviour(ec, { onClick: e.target.value }))}
          aria-label="Click action">
          <option value="none" ?selected=${ec.behaviour.onClick === 'none'}>None</option>
          <option value="filter-others" ?selected=${ec.behaviour.onClick === 'filter-others'}>Filter Others</option>
          <option value="open-detail" ?selected=${ec.behaviour.onClick === 'open-detail'}>Open Detail</option>
          <option value="custom-url" ?selected=${ec.behaviour.onClick === 'custom-url'}>Custom URL</option>
        </select>
      </div>

      <div class="toggle-row">
        <span>Export PNG</span>
        <input type="checkbox" .checked=${ec.behaviour.exportPng}
          @change=${(e) => this._emitEnhanced(updateEnhancedBehaviour(ec, { exportPng: e.target.checked }))}
          aria-label="Enable PNG export" />
      </div>

      <div class="toggle-row">
        <span>Export CSV</span>
        <input type="checkbox" .checked=${ec.behaviour.exportCsv}
          @change=${(e) => this._emitEnhanced(updateEnhancedBehaviour(ec, { exportCsv: e.target.checked }))}
          aria-label="Enable CSV export" />
      </div>

      <div class="toggle-row">
        <span>Auto Refresh</span>
        <input type="checkbox" .checked=${ec.behaviour.autoRefresh}
          @change=${(e) => this._emitEnhanced(updateEnhancedBehaviour(ec, { autoRefresh: e.target.checked }))}
          aria-label="Enable auto refresh" />
      </div>

      ${ec.behaviour.autoRefresh ? html `
        <div class="style-field">
          <phz-slider-input label="Refresh Interval"
            .value=${ec.behaviour.refreshInterval ?? 30}
            .min=${5} .max=${300} .step=${5} suffix="s"
            @value-changed=${(e) => this._emitEnhanced(updateEnhancedBehaviour(ec, { refreshInterval: e.detail.value }))}>
          </phz-slider-input>
        </div>
      ` : nothing}
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzConfigPanel.prototype, "config", void 0);
__decorate([
    property({ type: Object })
], PhzConfigPanel.prototype, "enhancedConfig", void 0);
PhzConfigPanel = __decorate([
    safeCustomElement('phz-config-panel')
], PhzConfigPanel);
export { PhzConfigPanel };
//# sourceMappingURL=phz-config-panel.js.map