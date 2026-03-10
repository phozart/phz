/**
 * @phozart/phz-viewer — <phz-viewer-empty> Custom Element
 *
 * Displays user-friendly empty states with optional call-to-action.
 * Uses shared EmptyScenario and EmptyStateConfig types.
 */
import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EmptyScenario, EmptyStateConfig } from '@phozart/phz-shared/types';
import { createDefaultEmptyStateConfig } from '@phozart/phz-shared/types';

// ========================================================================
// <phz-viewer-empty>
// ========================================================================

@customElement('phz-viewer-empty')
export class PhzViewerEmpty extends LitElement {
  static override styles = css`
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
  `;

  // --- Public properties ---

  @property({ type: String })
  scenario: EmptyScenario = 'no-data';

  @property({ attribute: false })
  config?: EmptyStateConfig;

  // --- Rendering ---

  override render(): TemplateResult {
    const cfg = this.config ?? createDefaultEmptyStateConfig(this.scenario);

    const iconMap: Record<string, string> = {
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

    return html`
      <div class="empty-container" role="status">
        <div class="empty-icon">${iconMap[cfg.icon] ?? '&#x1F4C2;'}</div>
        <div class="empty-title">${cfg.title}</div>
        <div class="empty-description">${cfg.description}</div>
        ${cfg.actionLabel ? html`
          <button
            class="empty-action"
            @click=${() => this._handleAction(cfg.actionId ?? 'default')}
          >${cfg.actionLabel}</button>
        ` : nothing}
      </div>
    `;
  }

  // --- Event handlers ---

  private _handleAction(actionId: string): void {
    this.dispatchEvent(
      new CustomEvent('empty-action', {
        bubbles: true,
        composed: true,
        detail: { actionId, scenario: this.scenario },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-viewer-empty': PhzViewerEmpty;
  }
}
