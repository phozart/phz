/**
 * @phozart/phz-widgets — Heatmap
 *
 * CSS-grid heatmap with color interpolation, tooltips, and SR accessibility.
 * Renders row/col labeled cells with value-proportional coloring.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';
export function hexToRGB(hex) {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}
export function interpolateColor(normalizedValue, colorScale = ['#EFF6FF', '#1D4ED8']) {
    const clamped = Math.max(0, Math.min(1, normalizedValue));
    const fromRGB = hexToRGB(colorScale[0]);
    const toRGB = hexToRGB(colorScale[1]);
    const r = Math.round(fromRGB.r + (toRGB.r - fromRGB.r) * clamped);
    const g = Math.round(fromRGB.g + (toRGB.g - fromRGB.g) * clamped);
    const b = Math.round(fromRGB.b + (toRGB.b - fromRGB.b) * clamped);
    return `rgb(${r}, ${g}, ${b})`;
}
export function computeHeatmapCells(data, colorScale = ['#EFF6FF', '#1D4ED8']) {
    if (data.length === 0)
        return { cells: [], rows: [], cols: [] };
    const rows = [...new Set(data.map(d => d.row))];
    const cols = [...new Set(data.map(d => d.col))];
    const values = data.map(d => d.value);
    const minVal = values.reduce((m, v) => v < m ? v : m, Infinity);
    const maxVal = values.reduce((m, v) => v > m ? v : m, -Infinity);
    const range = maxVal - minVal || 1;
    const cells = data.map(d => {
        const normalizedValue = (d.value - minVal) / range;
        return {
            row: d.row,
            col: d.col,
            value: d.value,
            rowIndex: rows.indexOf(d.row),
            colIndex: cols.indexOf(d.col),
            color: interpolateColor(normalizedValue, colorScale),
            normalizedValue,
        };
    });
    return { cells, rows, cols };
}
export function buildHeatmapAccessibleDescription(data, rows, cols) {
    const lines = [];
    for (const row of rows) {
        const rowData = cols.map(col => {
            const cell = data.find(d => d.row === row && d.col === col);
            return `${col}: ${cell?.value ?? 'N/A'}`;
        }).join(', ');
        lines.push(`${row}: ${rowData}`);
    }
    return lines.join('. ');
}
let PhzHeatmap = class PhzHeatmap extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.colorScale = ['#EFF6FF', '#1D4ED8'];
        this.showLabels = true;
        this.title = '';
        this.loading = false;
        this.error = null;
        this.tooltipContent = '';
        this.tooltipVisible = false;
        this.tooltipStyle = '';
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }
      .heatmap-container { position: relative; overflow-x: auto; }
      .heatmap-grid {
        display: grid;
        gap: 2px;
      }
      .heatmap-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        min-height: 36px;
        font-size: 12px;
        font-weight: 500;
        border-radius: 3px;
        cursor: pointer;
        transition: opacity 0.15s ease;
        font-variant-numeric: tabular-nums;
      }
      .heatmap-cell:hover { opacity: 0.8; }
      .heatmap-cell:focus-visible { outline: 2px solid #3B82F6; outline-offset: 1px; }
      .heatmap-row-label {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #44403C;
        font-weight: 500;
        padding-right: 8px;
        white-space: nowrap;
      }
      .heatmap-col-label {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        font-size: 11px;
        color: #78716C;
        padding-bottom: 4px;
        white-space: nowrap;
      }
    `,
    ]; }
    handleCellClick(cell) {
        this.dispatchEvent(new CustomEvent('cell-click', {
            bubbles: true,
            composed: true,
            detail: { row: cell.row, col: cell.col, value: cell.value },
        }));
    }
    handleCellHover(e, cell) {
        const container = e.currentTarget.closest('.heatmap-container');
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        this.tooltipContent = formatTooltipContent({
            label: `${cell.row} / ${cell.col}`,
            value: cell.value,
        });
        const pos = computeTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }, { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height });
        this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
        this.tooltipVisible = true;
    }
    handleCellLeave() {
        this.tooltipVisible = false;
    }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    textColorForBackground(normalizedValue) {
        return normalizedValue > 0.55 ? '#FFFFFF' : '#1C1917';
    }
    render() {
        const widgetState = resolveWidgetState({
            loading: this.loading,
            error: this.error,
            data: this.data.length > 0 ? this.data : null,
        });
        if (widgetState.state === 'loading') {
            return html `<div class="phz-w-card phz-w-state" aria-live="polite" aria-busy="true">
        <div class="phz-w-state__spinner"></div>
        <p class="phz-w-state__message">${widgetState.message}</p>
      </div>`;
        }
        if (widgetState.state === 'error') {
            return html `<div class="phz-w-card phz-w-state" role="alert">
        <p class="phz-w-state__error-message">${widgetState.message}</p>
        <button class="phz-w-state__retry-btn" @click=${this.handleRetry}>Retry</button>
      </div>`;
        }
        if (this.data.length === 0) {
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
        }
        const { cells, rows, cols } = computeHeatmapCells(this.data, this.colorScale);
        const tooltipId = 'heatmap-tooltip';
        const chartLabel = this.title || 'Heatmap';
        const gridCols = `80px repeat(${cols.length}, 1fr)`;
        const gridRows = `auto repeat(${rows.length}, 1fr)`;
        return html `
      <div class="phz-w-card" role="region" aria-label="${chartLabel}" style="position:relative;">
        ${this.title ? html `<h3 class="phz-w-title">${this.title}</h3>` : nothing}
        <div class="heatmap-container" style="position:relative;">
          <div class="heatmap-grid"
               style="grid-template-columns:${gridCols};grid-template-rows:${gridRows};"
               role="grid"
               aria-label="${chartLabel}">
            <!-- Top-left corner (empty) -->
            <div></div>
            <!-- Column headers -->
            ${cols.map(col => html `
              <div class="heatmap-col-label" role="columnheader">${col}</div>
            `)}
            <!-- Rows -->
            ${rows.map((row, ri) => html `
              <div class="heatmap-row-label" role="rowheader">${row}</div>
              ${cols.map((col, ci) => {
            const cell = cells.find(c => c.rowIndex === ri && c.colIndex === ci);
            if (!cell)
                return html `<div></div>`;
            const textColor = this.textColorForBackground(cell.normalizedValue);
            return html `
                  <div class="heatmap-cell phz-w-clickable"
                       role="gridcell"
                       tabindex="0"
                       style="background:${cell.color};color:${textColor};"
                       aria-label="${row}, ${col}: ${cell.value}"
                       aria-describedby="${tooltipId}"
                       @click=${() => this.handleCellClick(cell)}
                       @mouseenter=${(e) => this.handleCellHover(e, cell)}
                       @mouseleave=${() => this.handleCellLeave()}
                       @focus=${(e) => {
                const el = e.currentTarget;
                const container = el.closest('.heatmap-container');
                if (!container)
                    return;
                const rect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                this.tooltipContent = formatTooltipContent({
                    label: `${cell.row} / ${cell.col}`,
                    value: cell.value,
                });
                const pos = computeTooltipPosition({ x: elRect.left - rect.left + elRect.width / 2, y: elRect.top - rect.top }, { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height });
                this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                this.tooltipVisible = true;
            }}
                       @blur=${() => this.handleCellLeave()}>
                    ${this.showLabels ? cell.value.toLocaleString() : nothing}
                  </div>
                `;
        })}
            `)}
          </div>

          <div id="${tooltipId}"
               class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>
        </div>

        <!-- SR data table fallback -->
        <table class="phz-w-sr-only">
          <caption>${chartLabel} Data</caption>
          <thead><tr><th></th>${cols.map(c => html `<th>${c}</th>`)}</tr></thead>
          <tbody>
            ${rows.map(row => html `
              <tr>
                <th scope="row">${row}</th>
                ${cols.map(col => {
            const cell = this.data.find(d => d.row === row && d.col === col);
            return html `<td>${cell?.value ?? 'N/A'}</td>`;
        })}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzHeatmap.prototype, "data", void 0);
__decorate([
    property({ attribute: false })
], PhzHeatmap.prototype, "colorScale", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-labels' })
], PhzHeatmap.prototype, "showLabels", void 0);
__decorate([
    property({ type: String })
], PhzHeatmap.prototype, "title", void 0);
__decorate([
    property({ type: Boolean })
], PhzHeatmap.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzHeatmap.prototype, "error", void 0);
__decorate([
    state()
], PhzHeatmap.prototype, "tooltipContent", void 0);
__decorate([
    state()
], PhzHeatmap.prototype, "tooltipVisible", void 0);
__decorate([
    state()
], PhzHeatmap.prototype, "tooltipStyle", void 0);
PhzHeatmap = __decorate([
    customElement('phz-heatmap')
], PhzHeatmap);
export { PhzHeatmap };
//# sourceMappingURL=phz-heatmap.js.map