var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/phz-viewer — <phz-viewer-empty> Custom Element
 *
 * Displays user-friendly empty states with optional call-to-action.
 * Uses shared EmptyScenario and EmptyStateConfig types.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createDefaultEmptyStateConfig } from '@phozart/phz-shared/types';
// ========================================================================
// <phz-viewer-empty>
// ========================================================================
let PhzViewerEmpty = class PhzViewerEmpty extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.scenario = 'no-data';
    }
    static { this.styles = css `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }

    .empty-container {
      max-width: 400px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--phz-text-primary, #1a1a2e);
    }

    .empty-description {
      font-size: 14px;
      color: var(--phz-text-secondary, #64748b);
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .empty-action {
      padding: 8px 20px;
      border: 1px solid var(--phz-color-primary, #3b82f6);
      border-radius: 6px;
      background: transparent;
      color: var(--phz-color-primary, #3b82f6);
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .empty-action:hover {
      background: var(--phz-color-primary, #3b82f6);
      color: #ffffff;
    }
  `; }
    // --- Rendering ---
    render() {
        const cfg = this.config ?? createDefaultEmptyStateConfig(this.scenario);
        const iconMap = {
            sourceDatabase: '&#x1F4BE;',
            search: '&#x1F50D;',
            lock: '&#x1F512;',
            settings: '&#x2699;',
            warning: '&#x26A0;',
            addCircle: '&#x2795;',
            columns: '&#x1F4CA;',
            dashboard: '&#x1F4C8;',
            pin: '&#x2B50;',
        };
        return html `
      <div class="empty-container" role="status">
        <div class="empty-icon">${iconMap[cfg.icon] ?? '&#x1F4C2;'}</div>
        <div class="empty-title">${cfg.title}</div>
        <div class="empty-description">${cfg.description}</div>
        ${cfg.actionLabel ? html `
          <button
            class="empty-action"
            @click=${() => this._handleAction(cfg.actionId ?? 'default')}
          >${cfg.actionLabel}</button>
        ` : nothing}
      </div>
    `;
    }
    // --- Event handlers ---
    _handleAction(actionId) {
        this.dispatchEvent(new CustomEvent('empty-action', {
            bubbles: true,
            composed: true,
            detail: { actionId, scenario: this.scenario },
        }));
    }
};
__decorate([
    property({ type: String })
], PhzViewerEmpty.prototype, "scenario", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerEmpty.prototype, "config", void 0);
PhzViewerEmpty = __decorate([
    customElement('phz-viewer-empty')
], PhzViewerEmpty);
export { PhzViewerEmpty };
//# sourceMappingURL=phz-viewer-empty.js.map