/**
 * @phozart/criteria — Field Presence Filter
 *
 * Compact pill-based filter for specifying whether fields must have a value,
 * must be empty, or should not be filtered. Each pill cycles through three states:
 *   any → has_value → empty → any
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { criteriaStyles } from '../../shared-styles.js';
const CYCLE = ['any', 'has_value', 'empty'];
function nextState(current) {
    const idx = CYCLE.indexOf(current);
    return CYCLE[(idx + 1) % CYCLE.length];
}
// Inline SVG icons (10×10 Phosphor-style)
const CHECK_ICON = html `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 5.5 4.2 7.5 8 3"/></svg>`;
const CROSS_ICON = html `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2.5" y1="2.5" x2="7.5" y2="7.5"/><line x1="7.5" y1="2.5" x2="2.5" y2="7.5"/></svg>`;
let PhzFieldPresenceFilter = class PhzFieldPresenceFilter extends LitElement {
    constructor() {
        super(...arguments);
        /** Array of field identifiers to render as filterable pills */
        this.fields = [];
        /** Header label. Defaults to "Field presence" */
        this.label = 'Field presence';
        /** Compact mode */
        this.compact = false;
        /** Internal state for uncontrolled mode */
        this._internalState = {};
        this._initialized = false;
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: block; }

    .phz-sc-fpf {
      background: #FAF9F7;
      border-radius: 12px;
      padding: 14px;
    }

    /* Header row */
    .phz-sc-fpf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .phz-sc-fpf-label {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
    }

    .phz-sc-fpf-count {
      font-size: 11px;
      color: #A8A29E;
      font-weight: 400;
      margin-left: 6px;
    }

    .phz-sc-fpf-clear {
      font-size: 11px;
      font-weight: 500;
      color: #DC2626;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
    }

    .phz-sc-fpf-clear:hover {
      text-decoration: underline;
    }

    /* Legend */
    .phz-sc-fpf-legend {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 10.5px;
      color: #A8A29E;
    }

    .phz-sc-fpf-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .phz-sc-fpf-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .phz-sc-fpf-dot--any {
      background: transparent;
      border: 1px solid #E7E5E4;
    }

    .phz-sc-fpf-dot--has_value {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
    }

    .phz-sc-fpf-dot--empty {
      background: #FEF3F2;
      border: 1px solid #FECACA;
    }

    /* Pill grid */
    .phz-sc-fpf-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    :host([compact]) .phz-sc-fpf-pills {
      gap: 4px;
    }

    /* Pill base */
    .phz-sc-fpf-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
      cursor: pointer;
      border: 1px solid;
      background: transparent;
      transition: all 0.15s ease-out;
      user-select: none;
    }

    :host([compact]) .phz-sc-fpf-pill {
      font-size: 11px;
      padding: 4px 8px;
    }

    .phz-sc-fpf-pill:focus-visible {
      outline: 2px solid #EF4444;
      outline-offset: 2px;
    }

    /* State: any */
    .phz-sc-fpf-pill--any {
      border-color: #E7E5E4;
      color: #A8A29E;
      background: transparent;
      font-weight: 400;
    }

    .phz-sc-fpf-pill--any:hover {
      border-color: #D6D3D1;
      background: #F5F5F4;
    }

    /* State: has_value */
    .phz-sc-fpf-pill--has_value {
      border-color: #A7F3D0;
      color: #059669;
      background: #ECFDF5;
      font-weight: 600;
    }

    .phz-sc-fpf-pill--has_value:hover {
      border-color: #6EE7B7;
      background: #D1FAE5;
    }

    /* State: empty */
    .phz-sc-fpf-pill--empty {
      border-color: #FECACA;
      color: #DC2626;
      background: #FEF3F2;
      font-weight: 600;
    }

    .phz-sc-fpf-pill--empty:hover {
      border-color: #FCA5A5;
      background: #FEE2E2;
    }

    .phz-sc-fpf-pill-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 10px;
      height: 10px;
      flex-shrink: 0;
    }
  `]; }
    get _isControlled() {
        return this.value !== undefined;
    }
    get _currentState() {
        return this._isControlled ? this.value : this._internalState;
    }
    _getFieldState(field) {
        return this._currentState[field] ?? 'any';
    }
    get _activeCount() {
        return (this.fields ?? []).filter(f => this._getFieldState(f) !== 'any').length;
    }
    updated(changed) {
        // Initialize internal state from defaultValue on first render (uncontrolled)
        if (!this._initialized && !this._isControlled && (this.fields ?? []).length > 0) {
            this._internalState = { ...(this.defaultValue ?? {}) };
            this._initialized = true;
        }
    }
    _buildFullMap(overrides) {
        const base = overrides ?? this._currentState;
        const result = {};
        for (const f of this.fields) {
            result[f] = base[f] ?? 'any';
        }
        return result;
    }
    _onPillClick(field) {
        const current = this._getFieldState(field);
        const next = nextState(current);
        const newMap = this._buildFullMap();
        newMap[field] = next;
        if (!this._isControlled) {
            this._internalState = { ...newMap };
        }
        this.dispatchEvent(new CustomEvent('presence-change', {
            detail: { filters: newMap },
            bubbles: true, composed: true,
        }));
    }
    _onClearAll() {
        const cleared = {};
        for (const f of this.fields) {
            cleared[f] = 'any';
        }
        if (!this._isControlled) {
            this._internalState = { ...cleared };
        }
        this.dispatchEvent(new CustomEvent('presence-change', {
            detail: { filters: cleared },
            bubbles: true, composed: true,
        }));
    }
    _tooltipFor(field) {
        const st = this._getFieldState(field);
        switch (st) {
            case 'any': return `Click to require ${field}`;
            case 'has_value': return `Click to filter where ${field} is missing`;
            case 'empty': return `Click to reset ${field}`;
        }
    }
    render() {
        const activeCount = this._activeCount;
        return html `
      <div class="phz-sc-fpf">
        <!-- Header -->
        <div class="phz-sc-fpf-header">
          <div>
            <span class="phz-sc-fpf-label">${this.label}</span>
            ${activeCount > 0 ? html `<span class="phz-sc-fpf-count">${activeCount} active</span>` : nothing}
          </div>
          ${activeCount > 0 ? html `
            <button class="phz-sc-fpf-clear" @click=${this._onClearAll} aria-label="Clear all presence filters">Clear all</button>
          ` : nothing}
        </div>

        <!-- Legend -->
        <div class="phz-sc-fpf-legend" aria-hidden="true">
          <span class="phz-sc-fpf-legend-item">
            <span class="phz-sc-fpf-dot phz-sc-fpf-dot--any"></span>
            no filter
          </span>
          <span class="phz-sc-fpf-legend-item">
            <span class="phz-sc-fpf-dot phz-sc-fpf-dot--has_value"></span>
            must have value
          </span>
          <span class="phz-sc-fpf-legend-item">
            <span class="phz-sc-fpf-dot phz-sc-fpf-dot--empty"></span>
            must be empty
          </span>
        </div>

        <!-- Pills -->
        <div class="phz-sc-fpf-pills" role="group" aria-label="${this.label}">
          ${(this.fields ?? []).map(field => {
            const st = this._getFieldState(field);
            return html `
              <button
                class="phz-sc-fpf-pill phz-sc-fpf-pill--${st}"
                @click=${() => this._onPillClick(field)}
                title=${this._tooltipFor(field)}
                aria-label="${field}: ${st === 'any' ? 'no filter' : st === 'has_value' ? 'must have value' : 'must be empty'}"
                aria-pressed=${st !== 'any' ? 'true' : 'false'}
              >
                ${st === 'has_value' ? html `<span class="phz-sc-fpf-pill-icon">${CHECK_ICON}</span>` : nothing}
                ${st === 'empty' ? html `<span class="phz-sc-fpf-pill-icon">${CROSS_ICON}</span>` : nothing}
                ${field}
              </button>
            `;
        })}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzFieldPresenceFilter.prototype, "fields", void 0);
__decorate([
    property({ type: Object })
], PhzFieldPresenceFilter.prototype, "value", void 0);
__decorate([
    property({ type: Object })
], PhzFieldPresenceFilter.prototype, "defaultValue", void 0);
__decorate([
    property()
], PhzFieldPresenceFilter.prototype, "label", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], PhzFieldPresenceFilter.prototype, "compact", void 0);
__decorate([
    state()
], PhzFieldPresenceFilter.prototype, "_internalState", void 0);
PhzFieldPresenceFilter = __decorate([
    customElement('phz-field-presence-filter')
], PhzFieldPresenceFilter);
export { PhzFieldPresenceFilter };
//# sourceMappingURL=phz-field-presence-filter.js.map