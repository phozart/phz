/**
 * @phozart/criteria — Match Filter Pill
 *
 * Tri-state pill that cycles: all → matching → non-matching → all.
 * Used alongside tree selects to filter which items are shown.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { MatchFilterState } from '@phozart/core';
import { criteriaStyles } from '../../shared-styles.js';

const CYCLE: MatchFilterState[] = ['all', 'matching', 'non-matching'];

const DISPLAY: Record<MatchFilterState, string> = {
  all: 'All',
  matching: 'Matching',
  'non-matching': 'Non-matching',
};

@customElement('phz-match-filter-pill')
export class PhzMatchFilterPill extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: inline-flex; }
  `];

  @property() label = '';
  @property() state: MatchFilterState = 'all';

  private _cycle() {
    const idx = CYCLE.indexOf(this.state);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    this.dispatchEvent(new CustomEvent('match-filter-change', {
      detail: { state: next },
      bubbles: true, composed: true,
    }));
  }

  render() {
    const display = this.label || DISPLAY[this.state];
    return html`
      <button
        class="phz-sc-match-pill phz-sc-match-pill--${this.state}"
        @click=${this._cycle}
        aria-label="${display}: ${DISPLAY[this.state]}"
        title="Click to cycle filter state"
      >${display}</button>
    `;
  }
}
