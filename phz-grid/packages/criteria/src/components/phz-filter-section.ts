/**
 * @phozart/phz-criteria — Filter Section
 *
 * Collapsible section with chevron, count badge, required asterisk.
 * Lazy mount: slot content only rendered after first expand.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';

const iconChevron = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

@customElement('phz-filter-section')
export class PhzFilterSection extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; }
  `];

  @property() label = '';
  @property({ type: Boolean, reflect: true }) expanded = false;
  @property({ type: Number }) count = 0;
  @property({ type: Boolean }) required = false;

  @state() private _everExpanded = false;

  private _toggle() {
    this.expanded = !this.expanded;
    if (this.expanded) this._everExpanded = true;
    this.dispatchEvent(new CustomEvent('section-toggle', {
      detail: { expanded: this.expanded },
      bubbles: true, composed: true,
    }));
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('expanded') && this.expanded) {
      this._everExpanded = true;
    }
  }

  render() {
    return html`
      <div class="phz-sc-section">
        <div
          class="phz-sc-section-header"
          @click=${this._toggle}
          role="button"
          aria-expanded=${this.expanded}
          tabindex="0"
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggle(); } }}
        >
          <span class="phz-sc-section-chevron ${this.expanded ? 'phz-sc-section-chevron--expanded' : ''}">
            ${iconChevron}
          </span>
          <span class="phz-sc-section-label">
            ${this.label}
            ${this.required ? html`<span class="phz-sc-section-required">*</span>` : nothing}
          </span>
          ${this.count > 0 ? html`<span class="phz-sc-section-count">${this.count}</span>` : nothing}
        </div>
        ${this._everExpanded ? html`
          <div class="phz-sc-section-body" style="display: ${this.expanded ? 'block' : 'none'}">
            <slot></slot>
          </div>
        ` : nothing}
      </div>
    `;
  }
}
