/**
 * @phozart/grid-creator — <phz-creator-review>
 *
 * Review & Create summary panel. Shows draft state before committing.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { ReviewSummary } from './wizard-state.js';

@safeCustomElement('phz-creator-review')
export class PhzCreatorReview extends LitElement {
  static styles = css`
    :host { display: block; }

    .review-section {
      margin-bottom: 20px;
    }
    .review-label {
      font-size: 12px; font-weight: 600; color: #78716C;
      text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .review-value {
      font-size: 14px; color: #1C1917; padding: 8px 12px;
      background: #FAFAF9; border-radius: 8px; border: 1px solid #E7E5E4;
    }
    .review-empty { color: #A8A29E; font-style: italic; }
  `;

  @property({ attribute: false })
  summary: ReviewSummary | null = null;

  render() {
    if (!this.summary) {
      return html`<div class="review-empty">No summary available</div>`;
    }

    return html`
      <div class="review-section">
        <div class="review-label">Report Name</div>
        <div class="review-value">${this.summary.name}</div>
      </div>

      ${this.summary.description ? html`
        <div class="review-section">
          <div class="review-label">Description</div>
          <div class="review-value">${this.summary.description}</div>
        </div>
      ` : nothing}

      <div class="review-section">
        <div class="review-label">Data Source</div>
        <div class="review-value">${this.summary.dataProductId || html`<span class="review-empty">Not selected</span>`}</div>
      </div>

      <div class="review-section">
        <div class="review-label">Columns</div>
        <div class="review-value">${this.summary.columnCount} column${this.summary.columnCount !== 1 ? 's' : ''} selected</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-creator-review': PhzCreatorReview; }
}
