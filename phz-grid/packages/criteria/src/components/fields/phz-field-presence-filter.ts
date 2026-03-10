/**
 * @phozart/phz-criteria — Field Presence Filter
 *
 * Compact pill-based filter for specifying whether fields must have a value,
 * must be empty, or should not be filtered. Each pill cycles through three states:
 *   any → has_value → empty → any
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PresenceState } from '@phozart/phz-core';
import { criteriaStyles } from '../../shared-styles.js';

const CYCLE: PresenceState[] = ['any', 'has_value', 'empty'];

function nextState(current: PresenceState): PresenceState {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

// Inline SVG icons (10×10 Phosphor-style)
const CHECK_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 5.5 4.2 7.5 8 3"/></svg>`;
const CROSS_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2.5" y1="2.5" x2="7.5" y2="7.5"/><line x1="7.5" y1="2.5" x2="2.5" y2="7.5"/></svg>`;

@customElement('phz-field-presence-filter')
export class PhzFieldPresenceFilter extends LitElement {
  static styles = [criteriaStyles, css`
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
  `];

  /** Array of field identifiers to render as filterable pills */
  @property({ type: Array }) fields: string[] = [];

  /** Controlled mode: the parent owns the filter state */
  @property({ type: Object }) value?: Record<string, PresenceState>;

  /** Uncontrolled mode: initial state for fields */
  @property({ type: Object }) defaultValue?: Record<string, PresenceState>;

  /** Header label. Defaults to "Field presence" */
  @property() label = 'Field presence';

  /** Compact mode */
  @property({ type: Boolean, reflect: true }) compact = false;

  /** Internal state for uncontrolled mode */
  @state() private _internalState: Record<string, PresenceState> = {};

  private _initialized = false;

  private get _isControlled(): boolean {
    return this.value !== undefined;
  }

  private get _currentState(): Record<string, PresenceState> {
    return this._isControlled ? this.value! : this._internalState;
  }

  private _getFieldState(field: string): PresenceState {
    return this._currentState[field] ?? 'any';
  }

  private get _activeCount(): number {
    return (this.fields ?? []).filter(f => this._getFieldState(f) !== 'any').length;
  }

  updated(changed: Map<string, unknown>) {
    // Initialize internal state from defaultValue on first render (uncontrolled)
    if (!this._initialized && !this._isControlled && (this.fields ?? []).length > 0) {
      this._internalState = { ...(this.defaultValue ?? {}) };
      this._initialized = true;
    }
  }

  private _buildFullMap(overrides?: Record<string, PresenceState>): Record<string, PresenceState> {
    const base = overrides ?? this._currentState;
    const result: Record<string, PresenceState> = {};
    for (const f of this.fields) {
      result[f] = base[f] ?? 'any';
    }
    return result;
  }

  private _onPillClick(field: string) {
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

  private _onClearAll() {
    const cleared: Record<string, PresenceState> = {};
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

  private _tooltipFor(field: string): string {
    const st = this._getFieldState(field);
    switch (st) {
      case 'any': return `Click to require ${field}`;
      case 'has_value': return `Click to filter where ${field} is missing`;
      case 'empty': return `Click to reset ${field}`;
    }
  }

  render() {
    const activeCount = this._activeCount;

    return html`
      <div class="phz-sc-fpf">
        <!-- Header -->
        <div class="phz-sc-fpf-header">
          <div>
            <span class="phz-sc-fpf-label">${this.label}</span>
            ${activeCount > 0 ? html`<span class="phz-sc-fpf-count">${activeCount} active</span>` : nothing}
          </div>
          ${activeCount > 0 ? html`
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
            return html`
              <button
                class="phz-sc-fpf-pill phz-sc-fpf-pill--${st}"
                @click=${() => this._onPillClick(field)}
                title=${this._tooltipFor(field)}
                aria-label="${field}: ${st === 'any' ? 'no filter' : st === 'has_value' ? 'must have value' : 'must be empty'}"
                aria-pressed=${st !== 'any' ? 'true' : 'false'}
              >
                ${st === 'has_value' ? html`<span class="phz-sc-fpf-pill-icon">${CHECK_ICON}</span>` : nothing}
                ${st === 'empty' ? html`<span class="phz-sc-fpf-pill-icon">${CROSS_ICON}</span>` : nothing}
                ${field}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }
}
