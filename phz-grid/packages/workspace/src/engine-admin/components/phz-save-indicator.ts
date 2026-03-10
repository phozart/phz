import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import type { SaveState } from '../save-controller.js';

@safeCustomElement('phz-save-indicator')
export class PhzSaveIndicator extends LitElement {
  static styles = css`
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
  `;

  @property({ type: String }) state: SaveState = 'idle';
  @property({ type: String }) errorMessage = '';

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('save-retry', { bubbles: true, composed: true }));
  }

  render() {
    if (this.state === 'idle') return nothing;

    const message = this.state === 'saving' ? 'Saving...'
      : this.state === 'saved' ? 'Saved'
      : this.errorMessage ? `Save failed: ${this.errorMessage}` : 'Save failed';

    return html`
      <div class="indicator indicator--${this.state}" role="status" aria-live="polite">
        <span>${message}</span>
        ${this.state === 'error' ? html`
          <button class="retry-btn" @click=${this.handleRetry}>Retry</button>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-save-indicator': PhzSaveIndicator; }
}
