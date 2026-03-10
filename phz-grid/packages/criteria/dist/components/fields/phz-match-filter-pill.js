/**
 * @phozart/phz-criteria — Match Filter Pill
 *
 * Tri-state pill that cycles: all → matching → non-matching → all.
 * Used alongside tree selects to filter which items are shown.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { criteriaStyles } from '../../shared-styles.js';
const CYCLE = ['all', 'matching', 'non-matching'];
const DISPLAY = {
    all: 'All',
    matching: 'Matching',
    'non-matching': 'Non-matching',
};
let PhzMatchFilterPill = class PhzMatchFilterPill extends LitElement {
    constructor() {
        super(...arguments);
        this.label = '';
        this.state = 'all';
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: inline-flex; }
  `]; }
    _cycle() {
        const idx = CYCLE.indexOf(this.state);
        const next = CYCLE[(idx + 1) % CYCLE.length];
        this.dispatchEvent(new CustomEvent('match-filter-change', {
            detail: { state: next },
            bubbles: true, composed: true,
        }));
    }
    render() {
        const display = this.label || DISPLAY[this.state];
        return html `
      <button
        class="phz-sc-match-pill phz-sc-match-pill--${this.state}"
        @click=${this._cycle}
        aria-label="${display}: ${DISPLAY[this.state]}"
        title="Click to cycle filter state"
      >${display}</button>
    `;
    }
};
__decorate([
    property()
], PhzMatchFilterPill.prototype, "label", void 0);
__decorate([
    property()
], PhzMatchFilterPill.prototype, "state", void 0);
PhzMatchFilterPill = __decorate([
    customElement('phz-match-filter-pill')
], PhzMatchFilterPill);
export { PhzMatchFilterPill };
//# sourceMappingURL=phz-match-filter-pill.js.map