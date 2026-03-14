/**
 * @phozart/engine-admin — Share Dialog
 *
 * Dialog with tabs: Embed Code, JSON Config, Link.
 * Provides copy-to-clipboard, download, and embed preview.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';

export interface ShareTab {
  id: 'embed' | 'json' | 'link';
  label: string;
}

export const SHARE_TABS: ShareTab[] = [
  { id: 'embed', label: 'Embed Code' },
  { id: 'json', label: 'JSON Config' },
  { id: 'link', label: 'Link' },
];

@safeCustomElement('phz-share-dialog')
export class PhzShareDialog extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      :host { display: block; }

      .backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999;
        opacity: 0; transition: opacity 0.2s ease; pointer-events: none;
      }
      .backdrop--open { opacity: 1; pointer-events: auto; }

      .dialog {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95);
        width: 560px; max-width: 90vw; max-height: 85vh;
        background: white; border-radius: 12px; z-index: 1000;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        display: none; flex-direction: column; overflow: hidden;
        transition: transform 0.2s ease;
      }
      .dialog--open { display: flex; transform: translate(-50%, -50%) scale(1); }

      .dialog-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px; border-bottom: 1px solid #E7E5E4;
      }
      .dialog-title { font-size: 16px; font-weight: 700; color: #1C1917; }
      .close-btn {
        width: 28px; height: 28px; border: none; background: none;
        font-size: 18px; color: #78716C; cursor: pointer;
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
      }
      .close-btn:hover { background: #F5F5F4; color: #1C1917; }

      .dialog-body { flex: 1; overflow-y: auto; padding: 16px 20px; }

      .code-block {
        background: #1C1917; color: #E7E5E4; padding: 14px 16px;
        border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 12px;
        line-height: 1.5; overflow-x: auto; white-space: pre-wrap;
        word-break: break-all; margin: 12px 0; max-height: 300px; overflow-y: auto;
      }

      .action-row {
        display: flex; gap: 8px; margin-top: 8px;
      }

      .link-input {
        width: 100%; padding: 8px 12px; border: 1px solid #D6D3D1;
        border-radius: 6px; font-size: 13px; background: #FAFAF9;
      }

      .copy-feedback {
        font-size: 12px; color: #16A34A; font-weight: 600;
        margin-left: 8px; opacity: 0; transition: opacity 0.2s ease;
      }
      .copy-feedback--visible { opacity: 1; }

      .tab-content { min-height: 200px; }

      /* ── Touch targets ── */
      .close-btn { width: 44px; height: 44px; }

      /* ── Full-screen below 576px ── */
      @media (max-width: 576px) {
        .dialog {
          width: 100%; max-width: 100%; max-height: 100%;
          top: 0; left: 0; transform: none;
          border-radius: 0; height: 100%;
        }
        .dialog--open { transform: none; }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) embedCode = '';
  @property({ type: String }) jsonConfig = '';
  @property({ type: String }) shareableUrl = '';

  @state() private _activeTab: ShareTab['id'] = 'embed';
  @state() private _copyFeedback = false;

  connectedCallback() {
    super.connectedCallback();
    this._onKeyDown = this._onKeyDown.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeyDown);
  }

  private _onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.open) {
      this._close();
    }
  }

  private _close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('share-close', { bubbles: true, composed: true }));
  }

  private async _copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this._copyFeedback = true;
      setTimeout(() => { this._copyFeedback = false; }, 2000);
    } catch {
      // Fallback: select text in textarea
    }
  }

  private _downloadJson() {
    if (!this.jsonConfig) return;
    const blob = new Blob([this.jsonConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  render() {
    return html`
      <div class="backdrop ${this.open ? 'backdrop--open' : ''}"
           @click=${this._close}></div>
      <div class="dialog ${this.open ? 'dialog--open' : ''}"
           role="dialog"
           aria-modal="true"
           aria-label="Share Dashboard">
        <div class="dialog-header">
          <span class="dialog-title">Share Dashboard</span>
          <button class="close-btn" @click=${this._close} aria-label="Close">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="phz-ea-tabs" role="tablist">
            ${SHARE_TABS.map(tab => html`
              <button class="phz-ea-tab ${this._activeTab === tab.id ? 'phz-ea-tab--active' : ''}"
                      role="tab"
                      aria-selected="${this._activeTab === tab.id}"
                      @click=${() => { this._activeTab = tab.id; }}>
                ${tab.label}
              </button>
            `)}
          </div>
          <div class="tab-content" role="tabpanel">
            ${this._renderTabContent()}
          </div>
        </div>
      </div>
    `;
  }

  private _renderTabContent() {
    switch (this._activeTab) {
      case 'embed':
        return html`
          <p style="font-size:13px;color:#44403C;margin:12px 0 4px;">
            Copy this HTML snippet into your page:
          </p>
          <div class="code-block">${this.embedCode || 'No embed code available'}</div>
          <div class="action-row">
            <button class="phz-ea-btn phz-ea-btn--primary"
                    @click=${() => this._copyText(this.embedCode)}>
              Copy Code
            </button>
            <span class="copy-feedback ${this._copyFeedback ? 'copy-feedback--visible' : ''}">
              Copied!
            </span>
          </div>
        `;
      case 'json':
        return html`
          <p style="font-size:13px;color:#44403C;margin:12px 0 4px;">
            Dashboard configuration as JSON:
          </p>
          <div class="code-block">${this.jsonConfig || 'No config available'}</div>
          <div class="action-row">
            <button class="phz-ea-btn phz-ea-btn--primary"
                    @click=${() => this._copyText(this.jsonConfig)}>
              Copy JSON
            </button>
            <button class="phz-ea-btn" @click=${this._downloadJson}>
              Download
            </button>
            <span class="copy-feedback ${this._copyFeedback ? 'copy-feedback--visible' : ''}">
              Copied!
            </span>
          </div>
        `;
      case 'link':
        return html`
          <p style="font-size:13px;color:#44403C;margin:12px 0 4px;">
            Share this URL (requires host app integration):
          </p>
          <input class="link-input" type="text" readonly
                 .value=${this.shareableUrl || 'No URL configured'}
                 @focus=${(e: FocusEvent) => (e.target as HTMLInputElement).select()} />
          <div class="action-row" style="margin-top:12px;">
            <button class="phz-ea-btn phz-ea-btn--primary"
                    @click=${() => this._copyText(this.shareableUrl)}>
              Copy Link
            </button>
            <span class="copy-feedback ${this._copyFeedback ? 'copy-feedback--visible' : ''}">
              Copied!
            </span>
          </div>
        `;
      default:
        return nothing;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-share-dialog': PhzShareDialog; }
}
