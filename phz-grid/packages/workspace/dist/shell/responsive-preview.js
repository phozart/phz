/**
 * @phozart/phz-workspace — ResponsivePreview Component
 *
 * A device-preview simulator that constrains slotted content
 * to Desktop (1200px), Tablet (768px), or Mobile (375px) widths.
 * Uses container queries so child components can respond to the
 * constrained width rather than the viewport.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
export const PREVIEW_WIDTHS = {
    desktop: 1200,
    tablet: 768,
    mobile: 375,
};
const DEVICE_LABELS = {
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
};
const DEVICES = ['desktop', 'tablet', 'mobile'];
let PhzResponsivePreview = class PhzResponsivePreview extends LitElement {
    constructor() {
        super(...arguments);
        this.activeDevice = 'desktop';
    }
    static { this.TAG = 'phz-responsive-preview'; }
    static { this.styles = css `
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
  `; }
    _setDevice(device) {
        this.activeDevice = device;
    }
    render() {
        const width = PREVIEW_WIDTHS[this.activeDevice];
        return html `
      <div class="toggle-bar" role="toolbar" aria-label="Device preview">
        ${DEVICES.map(device => html `
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
};
__decorate([
    state()
], PhzResponsivePreview.prototype, "activeDevice", void 0);
PhzResponsivePreview = __decorate([
    safeCustomElement('phz-responsive-preview')
], PhzResponsivePreview);
export { PhzResponsivePreview };
//# sourceMappingURL=responsive-preview.js.map