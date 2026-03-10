/**
 * @phozart/phz-criteria — Filter Section
 *
 * Collapsible section with chevron, count badge, required asterisk.
 * Lazy mount: slot content only rendered after first expand.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';
const iconChevron = html `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
let PhzFilterSection = class PhzFilterSection extends LitElement {
    constructor() {
        super(...arguments);
        this.label = '';
        this.expanded = false;
        this.count = 0;
        this.required = false;
        this._everExpanded = false;
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: block; }
  `]; }
    _toggle() {
        this.expanded = !this.expanded;
        if (this.expanded)
            this._everExpanded = true;
        this.dispatchEvent(new CustomEvent('section-toggle', {
            detail: { expanded: this.expanded },
            bubbles: true, composed: true,
        }));
    }
    updated(changed) {
        if (changed.has('expanded') && this.expanded) {
            this._everExpanded = true;
        }
    }
    render() {
        return html `
      <div class="phz-sc-section">
        <div
          class="phz-sc-section-header"
          @click=${this._toggle}
          role="button"
          aria-expanded=${this.expanded}
          tabindex="0"
          @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._toggle();
        } }}
        >
          <span class="phz-sc-section-chevron ${this.expanded ? 'phz-sc-section-chevron--expanded' : ''}">
            ${iconChevron}
          </span>
          <span class="phz-sc-section-label">
            ${this.label}
            ${this.required ? html `<span class="phz-sc-section-required">*</span>` : nothing}
          </span>
          ${this.count > 0 ? html `<span class="phz-sc-section-count">${this.count}</span>` : nothing}
        </div>
        ${this._everExpanded ? html `
          <div class="phz-sc-section-body" style="display: ${this.expanded ? 'block' : 'none'}">
            <slot></slot>
          </div>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property()
], PhzFilterSection.prototype, "label", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], PhzFilterSection.prototype, "expanded", void 0);
__decorate([
    property({ type: Number })
], PhzFilterSection.prototype, "count", void 0);
__decorate([
    property({ type: Boolean })
], PhzFilterSection.prototype, "required", void 0);
__decorate([
    state()
], PhzFilterSection.prototype, "_everExpanded", void 0);
PhzFilterSection = __decorate([
    customElement('phz-filter-section')
], PhzFilterSection);
export { PhzFilterSection };
//# sourceMappingURL=phz-filter-section.js.map