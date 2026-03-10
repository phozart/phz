var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
let PhzSaveIndicator = class PhzSaveIndicator extends LitElement {
    constructor() {
        super(...arguments);
        this.state = 'idle';
        this.errorMessage = '';
    }
    static { this.styles = css `
    :host { display: inline-block; }
    .indicator {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
      transition: all 0.2s ease;
    }
    .indicator--saving { color: #3B82F6; background: #EFF6FF; }
    .indicator--saved { color: #16A34A; background: #F0FDF4; }
    .indicator--error { color: #DC2626; background: #FEF2F2; }
    .retry-btn {
      border: none; background: none; color: #DC2626; text-decoration: underline;
      cursor: pointer; font-size: 12px; padding: 0;
    }
    .retry-btn:hover { color: #991B1B; }
  `; }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('save-retry', { bubbles: true, composed: true }));
    }
    render() {
        if (this.state === 'idle')
            return nothing;
        const message = this.state === 'saving' ? 'Saving...'
            : this.state === 'saved' ? 'Saved'
                : this.errorMessage ? `Save failed: ${this.errorMessage}` : 'Save failed';
        return html `
      <div class="indicator indicator--${this.state}" role="status" aria-live="polite">
        <span>${message}</span>
        ${this.state === 'error' ? html `
          <button class="retry-btn" @click=${this.handleRetry}>Retry</button>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzSaveIndicator.prototype, "state", void 0);
__decorate([
    property({ type: String })
], PhzSaveIndicator.prototype, "errorMessage", void 0);
PhzSaveIndicator = __decorate([
    safeCustomElement('phz-save-indicator')
], PhzSaveIndicator);
export { PhzSaveIndicator };
//# sourceMappingURL=phz-save-indicator.js.map