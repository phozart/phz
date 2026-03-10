/**
 * @phozart/phz-grid-creator — <phz-creator-review>
 *
 * Review & Create summary panel. Shows draft state before committing.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
let PhzCreatorReview = class PhzCreatorReview extends LitElement {
    constructor() {
        super(...arguments);
        this.summary = null;
    }
    static { this.styles = css `
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
  `; }
    render() {
        if (!this.summary) {
            return html `<div class="review-empty">No summary available</div>`;
        }
        return html `
      <div class="review-section">
        <div class="review-label">Report Name</div>
        <div class="review-value">${this.summary.name}</div>
      </div>

      ${this.summary.description ? html `
        <div class="review-section">
          <div class="review-label">Description</div>
          <div class="review-value">${this.summary.description}</div>
        </div>
      ` : nothing}

      <div class="review-section">
        <div class="review-label">Data Source</div>
        <div class="review-value">${this.summary.dataProductId || html `<span class="review-empty">Not selected</span>`}</div>
      </div>

      <div class="review-section">
        <div class="review-label">Columns</div>
        <div class="review-value">${this.summary.columnCount} column${this.summary.columnCount !== 1 ? 's' : ''} selected</div>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzCreatorReview.prototype, "summary", void 0);
PhzCreatorReview = __decorate([
    safeCustomElement('phz-creator-review')
], PhzCreatorReview);
export { PhzCreatorReview };
//# sourceMappingURL=phz-creator-review.js.map