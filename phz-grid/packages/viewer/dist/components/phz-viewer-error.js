var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/phz-viewer — <phz-viewer-error> Custom Element
 *
 * Displays user-friendly error states with recovery actions.
 * Uses shared ErrorState and ErrorStateConfig types.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createDefaultErrorStateConfig } from '@phozart/phz-shared/types';
// ========================================================================
// <phz-viewer-error>
// ========================================================================
let PhzViewerError = class PhzViewerError extends LitElement {
    static { this.styles = css `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
    }

    .error-container {
      max-width: 400px;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--phz-text-primary, #1a1a2e);
    }

    .error-message {
      font-size: 14px;
      color: var(--phz-text-secondary, #64748b);
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .error-code {
      font-size: 12px;
      color: var(--phz-text-tertiary, #94a3b8);
      margin-bottom: 16px;
      font-family: monospace;
    }

    .error-action {
      padding: 8px 20px;
      border: none;
      border-radius: 6px;
      background: var(--phz-color-primary, #3b82f6);
      color: #ffffff;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .error-action:hover {
      opacity: 0.9;
    }
  `; }
    // --- Rendering ---
    render() {
        const cfg = this.config ?? createDefaultErrorStateConfig(this.scenario ?? 'unknown');
        return html `
      <div class="error-container" role="alert">
        <div class="error-icon">${cfg.icon === 'lock' ? '&#x1F512;' : '&#x26A0;'}</div>
        <div class="error-title">${cfg.title}</div>
        <div class="error-message">
          ${this.error?.message ?? cfg.description}
        </div>
        ${this.error?.code ? html `
          <div class="error-code">Error code: ${this.error.code}</div>
        ` : nothing}
        ${cfg.actionLabel ? html `
          <button
            class="error-action"
            @click=${() => this._handleAction(cfg.actionId ?? 'retry')}
          >${cfg.actionLabel}</button>
        ` : nothing}
      </div>
    `;
    }
    // --- Event handlers ---
    _handleAction(actionId) {
        this.dispatchEvent(new CustomEvent('error-action', {
            bubbles: true,
            composed: true,
            detail: { actionId, error: this.error },
        }));
    }
};
__decorate([
    property({ attribute: false })
], PhzViewerError.prototype, "error", void 0);
__decorate([
    property({ type: String })
], PhzViewerError.prototype, "scenario", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerError.prototype, "config", void 0);
PhzViewerError = __decorate([
    customElement('phz-viewer-error')
], PhzViewerError);
export { PhzViewerError };
//# sourceMappingURL=phz-viewer-error.js.map