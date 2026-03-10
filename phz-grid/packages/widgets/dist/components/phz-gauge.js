/**
 * @phozart/phz-widgets — Gauge / Speedometer
 *
 * SVG gauge widget for KPI display with color zones and animated needle.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { resolveWidgetState } from '../widget-states.js';
const SVG_SIZE = 200;
const CENTER_X = 100;
const CENTER_Y = 110;
const RADIUS = 80;
const NEEDLE_LENGTH = 70;
const TRACK_WIDTH = 12;
// Default: 270-degree arc from bottom-left to bottom-right
const DEFAULT_START_ANGLE = -225;
const DEFAULT_END_ANGLE = 45;
export function valueToAngle(value, min, max, startAngle = DEFAULT_START_ANGLE, endAngle = DEFAULT_END_ANGLE) {
    const clamped = Math.max(min, Math.min(max, value));
    const ratio = (clamped - min) / (max - min || 1);
    return startAngle + ratio * (endAngle - startAngle);
}
export function detectThresholdZone(value, thresholds, min) {
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    for (let i = sorted.length - 1; i >= 0; i--) {
        if (value >= sorted[i].value) {
            return { color: sorted[i].color, label: sorted[i].label };
        }
    }
    return sorted.length > 0
        ? { color: sorted[0].color, label: sorted[0].label }
        : { color: '#A8A29E', label: 'Unknown' };
}
export function describeArc(cx, cy, radius, startAngleDeg, endAngleDeg) {
    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = (endAngleDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}
export function needleEndpoint(cx, cy, length, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
        x: cx + length * Math.cos(rad),
        y: cy + length * Math.sin(rad),
    };
}
let PhzGauge = class PhzGauge extends LitElement {
    constructor() {
        super(...arguments);
        this.value = 0;
        this.min = 0;
        this.max = 100;
        this.thresholds = [];
        this.label = '';
        this.unit = '';
        this.showValue = true;
        this.startAngle = DEFAULT_START_ANGLE;
        this.endAngle = DEFAULT_END_ANGLE;
        this.loading = false;
        this.error = null;
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }
      .gauge-container { position: relative; display: flex; flex-direction: column; align-items: center; }
      .gauge-svg { width: 100%; max-width: 220px; height: auto; }
      .gauge-track { fill: none; stroke: #E7E5E4; stroke-linecap: round; }
      .gauge-zone { fill: none; stroke-linecap: round; }
      .gauge-needle {
        stroke: #1C1917;
        stroke-width: 2.5;
        stroke-linecap: round;
        transition: all 0.6s ease-out;
      }
      .gauge-needle-cap { fill: #1C1917; }
      .gauge-value-text {
        font-size: 28px;
        font-weight: 700;
        fill: #1C1917;
        text-anchor: middle;
        dominant-baseline: central;
      }
      .gauge-unit-text {
        font-size: 12px;
        fill: #78716C;
        text-anchor: middle;
      }
      .gauge-label-text {
        font-size: 11px;
        fill: #78716C;
        text-anchor: middle;
      }
      .gauge-min-text, .gauge-max-text {
        font-size: 10px;
        fill: #A8A29E;
      }
      .gauge-min-text { text-anchor: start; }
      .gauge-max-text { text-anchor: end; }
      .gauge-status {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
      }
    `,
    ]; }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    render() {
        const widgetState = resolveWidgetState({
            loading: this.loading,
            error: this.error,
            data: [this.value],
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
        const angle = valueToAngle(this.value, this.min, this.max, this.startAngle, this.endAngle);
        const needle = needleEndpoint(CENTER_X, CENTER_Y, NEEDLE_LENGTH, angle);
        const zone = (this.thresholds ?? []).length > 0
            ? detectThresholdZone(this.value, this.thresholds ?? [], this.min)
            : null;
        const trackPath = describeArc(CENTER_X, CENTER_Y, RADIUS, this.startAngle, this.endAngle);
        // Threshold zone arcs
        const sortedThresholds = [...(this.thresholds ?? [])].sort((a, b) => a.value - b.value);
        const zoneArcs = sortedThresholds.map((t, i) => {
            const zoneStart = i === 0 ? this.min : sortedThresholds[i - 1].value;
            const zoneEnd = i < sortedThresholds.length - 1 ? sortedThresholds[i + 1].value : this.max;
            const arcStart = valueToAngle(Math.max(zoneStart, this.min), this.min, this.max, this.startAngle, this.endAngle);
            const arcEnd = valueToAngle(Math.min(zoneEnd, this.max), this.min, this.max, this.startAngle, this.endAngle);
            return { color: t.color, path: describeArc(CENTER_X, CENTER_Y, RADIUS, arcStart, arcEnd) };
        });
        const formattedValue = this.unit
            ? `${this.value.toLocaleString()}${this.unit}`
            : this.value.toLocaleString();
        const ariaLabel = this.label
            ? `${this.label}: ${formattedValue}${zone ? `, ${zone.label}` : ''}`
            : `Gauge: ${formattedValue}${zone ? `, ${zone.label}` : ''}`;
        // Min/Max label positions
        const minPos = needleEndpoint(CENTER_X, CENTER_Y, RADIUS + 16, this.startAngle);
        const maxPos = needleEndpoint(CENTER_X, CENTER_Y, RADIUS + 16, this.endAngle);
        return html `
      <div class="phz-w-card"
           role="meter"
           aria-valuenow="${this.value}"
           aria-valuemin="${this.min}"
           aria-valuemax="${this.max}"
           aria-label="${ariaLabel}">
        ${this.label ? html `<h3 class="phz-w-title">${this.label}</h3>` : nothing}
        <div class="gauge-container">
          <svg class="gauge-svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE * 0.7}" preserveAspectRatio="xMidYMid meet">
            <!-- Background track -->
            <path d="${trackPath}" class="gauge-track" stroke-width="${TRACK_WIDTH}" />

            <!-- Threshold zone arcs -->
            ${zoneArcs.map(z => svg `
              <path d="${z.path}" class="gauge-zone" stroke="${z.color}" stroke-width="${TRACK_WIDTH}" opacity="0.3" />
            `)}

            <!-- Needle -->
            <line x1="${CENTER_X}" y1="${CENTER_Y}"
                  x2="${needle.x}" y2="${needle.y}"
                  class="gauge-needle" />
            <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="5" class="gauge-needle-cap" />

            <!-- Value display -->
            ${this.showValue ? svg `
              <text x="${CENTER_X}" y="${CENTER_Y + 28}" class="gauge-value-text">${this.value.toLocaleString()}</text>
              ${this.unit ? svg `<text x="${CENTER_X}" y="${CENTER_Y + 42}" class="gauge-unit-text">${this.unit}</text>` : nothing}
            ` : nothing}

            <!-- Min / Max labels -->
            <text x="${minPos.x + 4}" y="${minPos.y + 4}" class="gauge-min-text">${this.min}</text>
            <text x="${maxPos.x - 4}" y="${maxPos.y + 4}" class="gauge-max-text">${this.max}</text>
          </svg>

          ${zone ? html `
            <span class="gauge-status" style="color:${zone.color};">${zone.label}</span>
          ` : nothing}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Number })
], PhzGauge.prototype, "value", void 0);
__decorate([
    property({ type: Number })
], PhzGauge.prototype, "min", void 0);
__decorate([
    property({ type: Number })
], PhzGauge.prototype, "max", void 0);
__decorate([
    property({ attribute: false })
], PhzGauge.prototype, "thresholds", void 0);
__decorate([
    property({ type: String })
], PhzGauge.prototype, "label", void 0);
__decorate([
    property({ type: String })
], PhzGauge.prototype, "unit", void 0);
__decorate([
    property({ type: Boolean })
], PhzGauge.prototype, "showValue", void 0);
__decorate([
    property({ type: Number })
], PhzGauge.prototype, "startAngle", void 0);
__decorate([
    property({ type: Number })
], PhzGauge.prototype, "endAngle", void 0);
__decorate([
    property({ type: Boolean })
], PhzGauge.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzGauge.prototype, "error", void 0);
PhzGauge = __decorate([
    customElement('phz-gauge')
], PhzGauge);
export { PhzGauge };
//# sourceMappingURL=phz-gauge.js.map