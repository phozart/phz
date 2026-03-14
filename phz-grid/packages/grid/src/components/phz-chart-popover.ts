/**
 * @phozart/grid — <phz-chart-popover>
 *
 * Floating chart popover that displays bar/line visualizations of column data.
 * SVG-based, zero external dependencies. Opens via right-click "Visualize".
 */
import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type ChartTypeOption = 'bar' | 'line';

@customElement('phz-chart-popover')
export class PhzChartPopover extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) field = '';
  @property({ type: String }) columnHeader = '';
  @property({ attribute: false }) values: number[] = [];
  @property({ attribute: false }) labels: string[] = [];

  @state() private chartType: ChartTypeOption = 'bar';
  @state() private posX = 0;
  @state() private posY = 0;

  private cleanup: (() => void) | null = null;

  static override styles = css`
    :host {
      position: fixed;
      top: 0; left: 0;
      width: 0; height: 0;
      z-index: 10002;
      pointer-events: none;
      overflow: visible;
    }
    :host([open]) { pointer-events: auto; }

    .phz-chart {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.96);
      width: 460px;
      background: var(--phz-popover-bg, #FEFDFB);
      border: 1px solid #E7E5E4;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(28,25,23,0.12), 0 8px 16px rgba(28,25,23,0.06);
      font-family: var(--phz-font-family-base, system-ui, -apple-system, sans-serif);
      font-size: 0.8125rem;
      color: #1C1917;
      opacity: 0;
      transition: opacity 200ms ease, transform 200ms ease;
      overflow: hidden;
    }

    :host([open]) .phz-chart {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    .phz-chart__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #E7E5E4;
    }

    .phz-chart__title {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .phz-chart__controls {
      display: flex; gap: 4px;
    }

    .phz-chart__type-btn {
      padding: 4px 10px;
      border: 1px solid #D6D3D1;
      background: transparent;
      border-radius: 6px;
      font-size: 0.6875rem;
      cursor: pointer;
      transition: all 100ms;
      font-family: inherit;
    }
    .phz-chart__type-btn--active {
      background: var(--phz-color-primary, #3B82F6);
      color: white;
      border-color: var(--phz-color-primary, #3B82F6);
    }

    .phz-chart__close {
      width: 28px; height: 28px;
      border: none; background: transparent;
      border-radius: 6px; cursor: pointer;
      color: #78716C; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .phz-chart__close:hover { background: #F5F5F4; }

    .phz-chart__body {
      padding: 16px;
    }

    .phz-chart__stats {
      display: flex;
      gap: 16px;
      padding: 10px 16px;
      border-top: 1px solid #F5F5F4;
      font-size: 0.6875rem;
      color: #78716C;
    }

    .phz-chart__stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .phz-chart__stat-label {
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.5625rem;
    }

    .phz-chart__stat-value {
      font-weight: 600;
      color: #1C1917;
      font-family: var(--phz-font-family-mono, monospace);
      font-size: 0.75rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-chart { transition: none; }
    }
  `;

  override updated(changed: PropertyValues): void {
    if (changed.has('open') && this.open) {
      this.addListeners();
    }
    if (changed.has('open') && !this.open) {
      this.removeListeners();
    }
  }

  show(field: string, header: string, values: number[], labels?: string[]): void {
    this.field = field;
    this.columnHeader = header;
    this.values = values;
    this.labels = labels ?? values.map((_, i) => String(i + 1));
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  private addListeners(): void {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') this.hide(); };
    document.addEventListener('keydown', onKey, true);
    this.cleanup = () => document.removeEventListener('keydown', onKey, true);
  }

  private removeListeners(): void { this.cleanup?.(); this.cleanup = null; }

  protected override render(): TemplateResult {
    if (!this.open || this.values.length === 0) return html``;

    const min = this.values.reduce((m, v) => v < m ? v : m, Infinity);
    const max = this.values.reduce((m, v) => v > m ? v : m, -Infinity);
    const avg = this.values.reduce((s, v) => s + v, 0) / this.values.length;
    const sum = this.values.reduce((s, v) => s + v, 0);

    return html`
      <div class="phz-chart" role="dialog" aria-label="Chart: ${this.columnHeader}">
        <div class="phz-chart__header">
          <span class="phz-chart__title">${this.columnHeader}</span>
          <div class="phz-chart__controls">
            <button class="phz-chart__type-btn ${this.chartType === 'bar' ? 'phz-chart__type-btn--active' : ''}"
                    @click="${() => { this.chartType = 'bar'; }}">Bar</button>
            <button class="phz-chart__type-btn ${this.chartType === 'line' ? 'phz-chart__type-btn--active' : ''}"
                    @click="${() => { this.chartType = 'line'; }}">Line</button>
            <button class="phz-chart__close" @click="${this.hide}" aria-label="Close">\u2715</button>
          </div>
        </div>

        <div class="phz-chart__body">
          ${this.chartType === 'bar' ? this.renderBarChart() : this.renderLineChart()}
        </div>

        <div class="phz-chart__stats">
          <div class="phz-chart__stat">
            <span class="phz-chart__stat-label">Min</span>
            <span class="phz-chart__stat-value">${min.toLocaleString()}</span>
          </div>
          <div class="phz-chart__stat">
            <span class="phz-chart__stat-label">Max</span>
            <span class="phz-chart__stat-value">${max.toLocaleString()}</span>
          </div>
          <div class="phz-chart__stat">
            <span class="phz-chart__stat-label">Avg</span>
            <span class="phz-chart__stat-value">${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div class="phz-chart__stat">
            <span class="phz-chart__stat-label">Sum</span>
            <span class="phz-chart__stat-value">${sum.toLocaleString()}</span>
          </div>
          <div class="phz-chart__stat">
            <span class="phz-chart__stat-label">Count</span>
            <span class="phz-chart__stat-value">${this.values.length}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderBarChart(): TemplateResult {
    const W = 420;
    const H = 200;
    const pad = { top: 10, right: 10, bottom: 30, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const max = this.values.reduce((m, v) => v > m ? v : m, 0);
    const min = this.values.reduce((m, v) => v < m ? v : m, 0);
    const range = max - min || 1;
    const barCount = Math.min(this.values.length, 50);
    const vals = this.values.slice(0, barCount);
    const barW = Math.max(4, chartW / barCount - 2);

    const yTicks = 5;
    const tickValues = Array.from({ length: yTicks }, (_, i) => min + (range * i) / (yTicks - 1));

    return html`
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <!-- Y axis ticks -->
        ${tickValues.map(tv => {
          const y = pad.top + chartH - ((tv - min) / range) * chartH;
          return html`
            <line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" stroke="#F5F5F4" stroke-width="1"/>
            <text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" fill="#A8A29E" font-size="9" font-family="var(--phz-font-family-mono, monospace)">${tv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
          `;
        })}
        <!-- Bars -->
        ${vals.map((v, i) => {
          const barH = ((v - min) / range) * chartH;
          const x = pad.left + (i / barCount) * chartW + 1;
          const y = pad.top + chartH - barH;
          return html`
            <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#3B82F6" rx="2" opacity="0.85">
              <title>${this.labels[i] ?? i}: ${v.toLocaleString()}</title>
            </rect>
          `;
        })}
      </svg>
    `;
  }

  private renderLineChart(): TemplateResult {
    const W = 420;
    const H = 200;
    const pad = { top: 10, right: 10, bottom: 30, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const max = this.values.reduce((m, v) => v > m ? v : m, -Infinity);
    const min = this.values.reduce((m, v) => v < m ? v : m, Infinity);
    const range = max - min || 1;
    const count = Math.min(this.values.length, 100);
    const vals = this.values.slice(0, count);

    const points = vals.map((v, i) => ({
      x: pad.left + (i / (count - 1 || 1)) * chartW,
      y: pad.top + chartH - ((v - min) / range) * chartH,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} Z`;

    const yTicks = 5;
    const tickValues = Array.from({ length: yTicks }, (_, i) => min + (range * i) / (yTicks - 1));

    return html`
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${tickValues.map(tv => {
          const y = pad.top + chartH - ((tv - min) / range) * chartH;
          return html`
            <line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" stroke="#F5F5F4" stroke-width="1"/>
            <text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" fill="#A8A29E" font-size="9" font-family="var(--phz-font-family-mono, monospace)">${tv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
          `;
        })}
        <path d="${areaD}" fill="rgba(59,130,246,0.1)" />
        <path d="${pathD}" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        ${points.map((p, i) => html`
          <circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#3B82F6" opacity="0">
            <title>${this.labels[i] ?? i}: ${vals[i].toLocaleString()}</title>
          </circle>
        `)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-chart-popover': PhzChartPopover;
  }
}
