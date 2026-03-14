/**
 * @phozart/widgets — Drill Link
 *
 * Navigation button to a detail view.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
let PhzDrillLink = class PhzDrillLink extends LitElement {
    constructor() {
        super(...arguments);
        this.label = 'View Details';
        this.targetReportId = '';
        this.openIn = 'panel';
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: inline-block; }
      .drill-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        min-height: 44px;
        min-width: 44px;
        background: #FAFAF9;
        border: 1px solid #E7E5E4;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #3B82F6;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .drill-btn:hover { background: #F5F5F4; border-color: #D6D3D1; }
      .drill-btn:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }
      .drill-btn__arrow { font-size: 16px; }
    `,
    ]; }
    handleClick() {
        this.dispatchEvent(new CustomEvent('drill-through', {
            bubbles: true,
            composed: true,
            detail: {
                targetReportId: this.targetReportId,
                filters: this.filters ?? {},
                openIn: this.openIn,
            },
        }));
    }
    render() {
        return html `
      <button class="drill-btn" @click=${this.handleClick}
              aria-label="${this.label}">
        ${this.label}
        <span class="drill-btn__arrow">&rarr;</span>
      </button>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzDrillLink.prototype, "label", void 0);
__decorate([
    property({ type: String })
], PhzDrillLink.prototype, "targetReportId", void 0);
__decorate([
    property({ type: Object })
], PhzDrillLink.prototype, "filters", void 0);
__decorate([
    property({ type: String })
], PhzDrillLink.prototype, "openIn", void 0);
PhzDrillLink = __decorate([
    customElement('phz-drill-link')
], PhzDrillLink);
export { PhzDrillLink };
//# sourceMappingURL=phz-drill-link.js.map