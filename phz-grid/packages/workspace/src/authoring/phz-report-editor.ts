/**
 * @phozart/workspace — Report Editor Component
 *
 * Toolbar (undo/redo/save/publish) + grid preview + config panel (columns/filters/style).
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { DataAdapter } from '@phozart/shared';
import {
  type ReportEditorState,
  initialReportEditorState,
  addColumn,
  removeColumn,
  toggleColumnVisibility,
  setDensity,
  setConfigPanelTab,
  selectColumn,
  removeFilter,
  toGridConfig,
} from './report-editor-state.js';
import {
  type ReportChartState,
  type ReportChartType,
  type EncodingChannel,
  initialReportChartState,
  setPreviewMode,
  overrideChartType,
  getEffectiveChartType,
  setEncoding,
  removeEncoding,
  getChartTypeAvailability,
} from './report-chart-state.js';
import { createReportUndoManager, type ReportUndoManager } from './report-undo.js';
import { handleFieldAdd, handleFieldRemove } from './report-editor-wiring.js';
import {
  type EditorCriteriaState,
  initialEditorCriteriaState,
  toggleCriteria,
  removeCriteriaFilter,
  clearCriteriaFilters,
} from './editor-criteria-state.js';

@safeCustomElement('phz-report-editor')
export class PhzReportEditor extends LitElement {
  @property({ type: String }) name = 'Untitled Report';
  @property({ type: String }) dataSourceId = '';
  @property({ type: Array }) availableFields: Array<{ field: string; label: string }> = [];
  /** DataAdapter for loading fields from data sources. When set, renders a data source panel. */
  @property({ attribute: false }) adapter?: DataAdapter;

  @state() private _state!: ReportEditorState;
  @state() private _showConfigPanel = true;
  @state() private _criteriaState: EditorCriteriaState = initialEditorCriteriaState();
  @state() private _chartState: ReportChartState = initialReportChartState();

  private _undoManager!: ReportUndoManager;

  static styles = css`
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      grid-template-columns: auto 1fr auto;
      height: 100%;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    .data-source-panel {
      width: 260px;
      border-right: 1px solid var(--phz-border, #d1d5db);
      overflow-y: auto;
      background: var(--phz-bg-surface, #fff);
    }

    .toolbar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
      background: var(--phz-bg-surface, #fff);
    }

    .toolbar-group { display: flex; gap: 4px; }

    .toolbar-btn {
      padding: 6px 10px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
    }

    .toolbar-btn:hover { background: var(--phz-bg-hover, #f3f4f6); }
    .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .toolbar-btn.primary {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border-color: var(--phz-primary, #2563eb);
    }

    .toolbar-title {
      font-weight: 600;
      font-size: 15px;
      margin-right: auto;
    }

    .preview {
      padding: 16px;
      overflow: auto;
      background: var(--phz-bg-canvas, #fafafa);
    }

    .preview-placeholder {
      border: 2px dashed var(--phz-border, #d1d5db);
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      color: var(--phz-text-secondary, #6b7280);
    }

    .config-panel {
      width: 320px;
      border-left: 1px solid var(--phz-border, #d1d5db);
      overflow-y: auto;
      background: var(--phz-bg-surface, #fff);
    }

    .config-panel.hidden { display: none; }

    .panel-tabs {
      display: flex;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
    }

    .panel-tab {
      flex: 1;
      padding: 10px;
      text-align: center;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    .panel-tab.active {
      border-bottom-color: var(--phz-primary, #2563eb);
      color: var(--phz-primary, #2563eb);
    }

    .panel-content { padding: 16px; }

    .column-list { display: flex; flex-direction: column; gap: 4px; }

    .column-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .column-item:hover { background: var(--phz-bg-hover, #f3f4f6); }
    .column-item.selected { background: var(--phz-bg-selected, #eff6ff); }

    .column-visibility {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .field-name { flex: 1; }

    .add-field-btn {
      width: 100%;
      padding: 8px;
      border: 1px dashed var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--phz-text-secondary, #6b7280);
      margin-top: 8px;
    }

    .density-group {
      display: flex;
      gap: 4px;
      margin-top: 12px;
    }

    .density-btn {
      flex: 1;
      padding: 6px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
    }

    .density-btn.active {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border-color: var(--phz-primary, #2563eb);
    }

    .filter-list { display: flex; flex-direction: column; gap: 4px; }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      font-size: 13px;
    }

    .filter-remove {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--phz-text-secondary, #6b7280);
      font-size: 16px;
    }

    .preview-toggle {
      display: inline-flex;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      overflow: hidden;
    }

    .preview-toggle-btn {
      padding: 4px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }

    .preview-toggle-btn.active {
      background: var(--phz-primary, #2563eb);
      color: #fff;
    }

    .chart-type-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-top: 8px;
    }

    .chart-type-btn {
      padding: 8px 4px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 11px;
      text-align: center;
    }

    .chart-type-btn.active {
      border-color: var(--phz-primary, #2563eb);
      background: var(--phz-bg-selected, #eff6ff);
      color: var(--phz-primary, #2563eb);
    }

    .chart-type-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .encoding-card {
      margin-top: 12px;
    }

    .encoding-shelf {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 0;
      border-bottom: 1px solid var(--phz-border-light, #e5e7eb);
      font-size: 12px;
    }

    .encoding-shelf-label {
      width: 60px;
      font-weight: 500;
      color: var(--phz-text-secondary, #6b7280);
      font-size: 11px;
      text-transform: uppercase;
    }

    .encoding-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      font-size: 12px;
      background: var(--phz-bg-surface, #fff);
    }

    .encoding-chip-remove {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 12px;
      color: var(--phz-text-secondary, #6b7280);
      padding: 0 2px;
    }

    .encoding-empty {
      color: var(--phz-text-secondary, #6b7280);
      font-style: italic;
      font-size: 12px;
    }

    .chart-preview-area {
      padding: 16px;
      overflow: auto;
      background: var(--phz-bg-canvas, #fafafa);
    }

    .chart-preview-placeholder {
      border: 2px dashed var(--phz-border, #d1d5db);
      border-radius: 8px;
      padding: 48px 32px;
      text-align: center;
      color: var(--phz-text-secondary, #6b7280);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this._state = initialReportEditorState(this.name, this.dataSourceId);
    this._undoManager = createReportUndoManager(this._state);
  }

  private _pushUndo(label: string): void {
    this._undoManager.execute(this._state, label);
    this.dispatchEvent(new CustomEvent('state-changed', {
      detail: { state: this._state, dirty: true },
      bubbles: true, composed: true,
    }));
  }

  private _undo(): void {
    const prev = this._undoManager.undo();
    if (prev) this._state = prev;
  }

  private _redo(): void {
    const next = this._undoManager.redo();
    if (next) this._state = next;
  }

  private _addColumn(field: string, label: string): void {
    this._state = addColumn(this._state, field, label);
    this._pushUndo(`Added column '${label}'`);
  }

  private _removeColumn(field: string): void {
    this._state = removeColumn(this._state, field);
    this._pushUndo(`Removed column '${field}'`);
  }

  private _toggleVisibility(field: string): void {
    this._state = toggleColumnVisibility(this._state, field);
    this._pushUndo(`Toggled visibility of '${field}'`);
  }

  private _selectColumn(field?: string): void {
    this._state = selectColumn(this._state, field);
  }

  private _setTab(tab: ReportEditorState['configPanelTab']): void {
    this._state = setConfigPanelTab(this._state, tab);
  }

  private _setDensity(density: ReportEditorState['density']): void {
    this._state = setDensity(this._state, density);
    this._pushUndo(`Set density to ${density}`);
  }

  private _removeFilter(filterId: string): void {
    this._state = removeFilter(this._state, filterId);
    this._pushUndo(`Removed filter`);
  }

  private _toggleConfigPanel(): void {
    this._showConfigPanel = !this._showConfigPanel;
  }

  private _toggleCriteria(): void {
    this._criteriaState = toggleCriteria(this._criteriaState);
  }

  private _removeCriteriaFilter(filterId: string): void {
    this._criteriaState = removeCriteriaFilter(this._criteriaState, filterId);
  }

  private _clearCriteriaFilters(): void {
    this._criteriaState = clearCriteriaFilters(this._criteriaState);
  }

  private _onFieldAdd(e: Event): void {
    const detail = (e as CustomEvent).detail as { field: string; metadata: { name: string; dataType: 'string' | 'number' | 'date' | 'boolean' } };
    this._state = handleFieldAdd(this._state, detail.field, detail.metadata);
    this._pushUndo(`Added column '${detail.field}'`);
  }

  private _onFieldRemove(e: Event): void {
    const detail = (e as CustomEvent).detail as { field: string };
    this._state = handleFieldRemove(this._state, detail.field);
    this._pushUndo(`Removed column '${detail.field}'`);
  }

  private _setChartPreviewMode(mode: ReportChartState['previewMode']): void {
    this._chartState = setPreviewMode(this._chartState, mode);
  }

  private _overrideChartType(type: ReportChartType): void {
    this._chartState = overrideChartType(this._chartState, type);
    this._pushUndo(`Set chart type to ${type}`);
  }

  private _setChartEncoding(channel: EncodingChannel, field: string): void {
    this._chartState = setEncoding(this._chartState, channel, field);
    this._pushUndo(`Set ${channel} encoding to ${field}`);
  }

  private _removeChartEncoding(channel: EncodingChannel, field: string): void {
    this._chartState = removeEncoding(this._chartState, channel, field);
    this._pushUndo(`Removed ${field} from ${channel}`);
  }

  private _onSave(): void {
    this.dispatchEvent(new CustomEvent('save-report', {
      detail: { state: this._state, gridConfig: toGridConfig(this._state) },
      bubbles: true, composed: true,
    }));
  }

  private _onPublish(): void {
    this.dispatchEvent(new CustomEvent('publish-report', {
      detail: { state: this._state },
      bubbles: true, composed: true,
    }));
  }

  override render() {
    return html`
      <div class="toolbar">
        <span class="toolbar-title">${this._state?.name ?? 'Report'}</span>

        <div class="toolbar-group">
          <button class="toolbar-btn" @click=${this._undo}
            ?disabled=${!this._undoManager?.canUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button class="toolbar-btn" @click=${this._redo}
            ?disabled=${!this._undoManager?.canRedo} title="Redo (Ctrl+Shift+Z)">Redo</button>
        </div>

        <div class="preview-toggle">
          <button class="preview-toggle-btn ${this._chartState.previewMode === 'table' ? 'active' : ''}"
            @click=${() => this._setChartPreviewMode('table')}>Table</button>
          <button class="preview-toggle-btn ${this._chartState.previewMode === 'chart' ? 'active' : ''}"
            @click=${() => this._setChartPreviewMode('chart')}>Chart</button>
        </div>

        <button class="toolbar-btn" @click=${this._toggleCriteria}>
          ${this._criteriaState.criteriaVisible ? 'Hide Criteria' : 'Show Criteria'}
        </button>
        <button class="toolbar-btn" @click=${this._toggleConfigPanel}>
          ${this._showConfigPanel ? 'Hide Panel' : 'Show Panel'}
        </button>

        <button class="toolbar-btn" @click=${this._onSave} title="Save (Ctrl+S)">Save</button>
        <button class="toolbar-btn primary" @click=${this._onPublish}>Publish</button>
      </div>

      ${this.adapter ? html`
        <div class="data-source-panel"
             @field-add=${this._onFieldAdd}
             @field-remove=${this._onFieldRemove}>
          <phz-data-source-panel
            .adapter=${this.adapter}
            .sourceId=${this.dataSourceId || undefined}
          ></phz-data-source-panel>
        </div>
      ` : nothing}

      ${this._criteriaState.criteriaVisible ? html`
        <div class="criteria-bar" style="grid-column: ${this.adapter ? '2' : '1'} / -1; padding: 8px 16px; border-bottom: 1px solid var(--phz-border, #d1d5db); background: var(--phz-bg-surface, #fff); display: flex; align-items: center; gap: 8px; font-size: 13px;">
          <span style="font-weight: 500;">Criteria:</span>
          ${this._criteriaState.activeFilters.map(f => html`
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border: 1px solid var(--phz-border, #d1d5db); border-radius: 4px;">
              ${f.label}
              <button style="border: none; background: none; cursor: pointer; font-size: 14px;" @click=${() => this._removeCriteriaFilter(f.id)}>x</button>
            </span>
          `)}
          ${this._criteriaState.activeFilters.length > 0 ? html`
            <button style="border: none; background: none; cursor: pointer; font-size: 12px; color: var(--phz-text-secondary, #6b7280);" @click=${this._clearCriteriaFilters}>Clear all</button>
          ` : html`<span style="color: var(--phz-text-secondary, #6b7280);">No criteria applied</span>`}
        </div>
      ` : nothing}

      ${this._chartState.previewMode === 'chart' ? html`
        <div class="chart-preview-area">
          <div class="chart-preview-placeholder">
            Chart preview: ${getEffectiveChartType(this._chartState)}
            ${this._chartState.encoding.category ? html`· Category: ${this._chartState.encoding.category}` : nothing}
            ${this._chartState.encoding.value.length > 0 ? html`· Values: ${this._chartState.encoding.value.join(', ')}` : nothing}
            ${this._chartState.encoding.color ? html`· Color: ${this._chartState.encoding.color}` : nothing}
          </div>
        </div>
      ` : html`
        <div class="preview">
          ${this._state?.columns.length > 0
            ? html`<div class="preview-placeholder">
                Grid preview with ${this._state.columns.filter(c => c.visible).length} visible columns
                · Density: ${this._state.density}
                ${this._state.filters.length > 0 ? html`· ${this._state.filters.length} filter(s)` : nothing}
              </div>`
            : html`<div class="preview-placeholder">Add columns from the config panel to start building your report</div>`
          }
        </div>
      `}

      <div class="config-panel ${this._showConfigPanel ? '' : 'hidden'}">
        <div class="panel-tabs">
          ${(['columns', 'filters', 'style', 'formatting', 'drill', 'chart'] as const).map(tab => html`
            <button class="panel-tab ${this._state?.configPanelTab === tab ? 'active' : ''}"
              @click=${() => this._setTab(tab)}>${tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          `)}
        </div>

        <div class="panel-content">
          ${this._renderPanelContent()}
        </div>
      </div>
    `;
  }

  private _renderPanelContent() {
    if (!this._state) return nothing;

    switch (this._state.configPanelTab) {
      case 'columns':
        return html`
          <div class="column-list">
            ${this._state.columns.map(col => html`
              <div class="column-item ${this._state.selectedColumnField === col.field ? 'selected' : ''}"
                   @click=${() => this._selectColumn(col.field)}>
                <input type="checkbox" class="column-visibility"
                  .checked=${col.visible}
                  @change=${() => this._toggleVisibility(col.field)}
                  @click=${(e: Event) => e.stopPropagation()}
                  aria-label="Toggle ${col.label} visibility" />
                <span class="field-name">${col.label}</span>
                ${col.pinned ? html`<span title="Pinned ${col.pinned}">P</span>` : nothing}
                <button class="filter-remove" @click=${(e: Event) => { e.stopPropagation(); this._removeColumn(col.field); }}
                  aria-label="Remove ${col.label}">x</button>
              </div>
            `)}
          </div>
          ${this.availableFields.filter(f => !this._state.columns.some(c => c.field === f.field)).length > 0
            ? html`
              <button class="add-field-btn" @click=${() => {
                const available = this.availableFields.find(f => !this._state.columns.some(c => c.field === f.field));
                if (available) this._addColumn(available.field, available.label);
              }}>+ Add Column</button>
            ` : nothing}
        `;

      case 'filters':
        return html`
          <div class="filter-list">
            ${this._state.filters.map(f => html`
              <div class="filter-item">
                <span>${f.label}</span>
                <button class="filter-remove" @click=${() => this._removeFilter(f.filterId)}
                  aria-label="Remove filter">x</button>
              </div>
            `)}
            ${this._state.filters.length === 0
              ? html`<p style="color: var(--phz-text-secondary, #6b7280); font-size: 13px;">
                  No filters applied. Right-click a column header to add filters.</p>`
              : nothing}
          </div>
        `;

      case 'style':
        return html`
          <h4 style="margin: 0 0 12px; font-size: 14px;">Density</h4>
          <div class="density-group">
            ${(['compact', 'dense', 'comfortable'] as const).map(d => html`
              <button class="density-btn ${this._state.density === d ? 'active' : ''}"
                @click=${() => this._setDensity(d)}>${d}</button>
            `)}
          </div>
        `;

      case 'formatting':
        return html`
          <h4 style="margin: 0 0 12px; font-size: 14px;">Conditional Formatting</h4>
          ${this._state.formatting.length === 0
            ? html`<p style="color: var(--phz-text-secondary, #6b7280); font-size: 13px;">No formatting rules defined.</p>`
            : html`<div style="display: flex; flex-direction: column; gap: 4px;">${this._state.formatting.map(r => html`
                <div style="padding: 6px 8px; border: 1px solid var(--phz-border, #d1d5db); border-radius: 4px; font-size: 13px;">
                  ${r.field}: ${r.operator} ${String(r.value)}
                </div>
              `)}</div>`
          }
        `;

      case 'drill':
        return html`
          <h4 style="margin: 0 0 12px; font-size: 14px;">Drill-Through Actions</h4>
          <p style="color: var(--phz-text-secondary, #6b7280); font-size: 13px;">Configure drill-through navigation for column values.</p>
        `;

      case 'chart': {
        const avail = getChartTypeAvailability(this._chartState.encoding);
        const effective = getEffectiveChartType(this._chartState);
        const chartTypes: ReportChartType[] = ['bar-chart', 'line', 'area', 'pie', 'scatter', 'gauge', 'kpi-card', 'trend-line'];
        const chartLabels: Record<ReportChartType, string> = {
          'bar-chart': 'Bar', line: 'Line', area: 'Area', pie: 'Pie',
          scatter: 'Scatter', gauge: 'Gauge', 'kpi-card': 'KPI', 'trend-line': 'Trend',
        };
        const enc = this._chartState.encoding;
        return html`
          <h4 style="margin: 0 0 8px; font-size: 14px;">Chart Type</h4>
          <div class="chart-type-grid">
            ${chartTypes.map(ct => html`
              <button class="chart-type-btn ${effective === ct ? 'active' : ''}"
                ?disabled=${!avail[ct]}
                @click=${() => this._overrideChartType(ct)}>${chartLabels[ct]}</button>
            `)}
          </div>

          <div class="encoding-card">
            <h4 style="margin: 12px 0 8px; font-size: 14px;">Encoding</h4>

            <div class="encoding-shelf">
              <span class="encoding-shelf-label">Category</span>
              ${enc.category
                ? html`<span class="encoding-chip">${enc.category}
                    <button class="encoding-chip-remove" @click=${() => this._removeChartEncoding('category', enc.category!)} aria-label="Remove category">x</button>
                  </span>`
                : html`<span class="encoding-empty">Drop dimension here</span>`}
            </div>

            <div class="encoding-shelf">
              <span class="encoding-shelf-label">Value</span>
              ${enc.value.length > 0
                ? enc.value.map(v => html`<span class="encoding-chip">${v}
                    <button class="encoding-chip-remove" @click=${() => this._removeChartEncoding('value', v)} aria-label="Remove ${v}">x</button>
                  </span>`)
                : html`<span class="encoding-empty">Drop measure here</span>`}
            </div>

            <div class="encoding-shelf">
              <span class="encoding-shelf-label">Color</span>
              ${enc.color
                ? html`<span class="encoding-chip">${enc.color}
                    <button class="encoding-chip-remove" @click=${() => this._removeChartEncoding('color', enc.color!)} aria-label="Remove color">x</button>
                  </span>`
                : html`<span class="encoding-empty">Optional</span>`}
            </div>

            <div class="encoding-shelf">
              <span class="encoding-shelf-label">Size</span>
              ${enc.size
                ? html`<span class="encoding-chip">${enc.size}
                    <button class="encoding-chip-remove" @click=${() => this._removeChartEncoding('size', enc.size!)} aria-label="Remove size">x</button>
                  </span>`
                : html`<span class="encoding-empty">Optional</span>`}
            </div>
          </div>
        `;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-report-editor': PhzReportEditor;
  }
}
