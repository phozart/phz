/**
 * @phozart/phz-workspace — ResponsivePreview Component
 *
 * A device-preview simulator that constrains slotted content
 * to Desktop (1200px), Tablet (768px), or Mobile (375px) widths.
 * Uses container queries so child components can respond to the
 * constrained width rather than the viewport.
 */

import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const PREVIEW_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

const DEVICE_LABELS: Record<PreviewDevice, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

const DEVICES: PreviewDevice[] = ['desktop', 'tablet', 'mobile'];

@safeCustomElement('phz-responsive-preview')
export class PhzResponsivePreview extends LitElement {
  static readonly TAG = 'phz-responsive-preview' as const;

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .toggle-bar {
      display: flex;
      gap: 4px;
      padding: 6px;
      background: #F5F5F4;
      border-radius: 8px;
      margin-bottom: 12px;
      width: fit-content;
    }

    .toggle-btn {
      padding: 6px 14px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      color: #57534E;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .toggle-btn:hover {
      background: #E7E5E4;
    }

    .toggle-btn:focus-visible {
      outline: 2px solid #3B82F6;
      outline-offset: 2px;
    }

    .toggle-btn[aria-pressed="true"] {
      background: white;
      color: #1C1917;
      border-color: #D6D3D1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .preview-container {
      container-type: inline-size;
      margin: 0 auto;
      border: 1px dashed #D6D3D1;
      border-radius: 8px;
      overflow: hidden;
      transition: max-width 0.3s ease;
    }
  `;

  @state() private activeDevice: PreviewDevice = 'desktop';

  private _setDevice(device: PreviewDevice): void {
    this.activeDevice = device;
  }

  render() {
    const width = PREVIEW_WIDTHS[this.activeDevice];
    return html`
      <div class="toggle-bar" role="toolbar" aria-label="Device preview">
        ${DEVICES.map(device => html`
          <button
            class="toggle-btn"
            aria-pressed="${String(this.activeDevice === device)}"
            @click="${() => this._setDevice(device)}"
          >${DEVICE_LABELS[device]} (${PREVIEW_WIDTHS[device]}px)</button>
        `)}
      </div>
      <div
        class="preview-container"
        style="max-width: ${width}px"
        role="region"
        aria-label="${DEVICE_LABELS[this.activeDevice]} preview at ${width}px"
      >
        <slot></slot>
      </div>
    `;
  }
}
