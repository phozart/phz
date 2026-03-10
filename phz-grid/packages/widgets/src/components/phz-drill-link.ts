/**
 * @phozart/phz-widgets — Drill Link
 *
 * Navigation button to a detail view.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { ReportId } from '@phozart/phz-engine';

@customElement('phz-drill-link')
export class PhzDrillLink extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
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
  ];

  @property({ type: String }) label: string = 'View Details';
  @property({ type: String }) targetReportId: string = '';
  @property({ type: Object }) filters?: Record<string, string>;
  @property({ type: String }) openIn: 'panel' | 'modal' | 'page' = 'panel';

  private handleClick() {
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
    return html`
      <button class="drill-btn" @click=${this.handleClick}
              aria-label="${this.label}">
        ${this.label}
        <span class="drill-btn__arrow">&rarr;</span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-drill-link': PhzDrillLink;
  }
}
