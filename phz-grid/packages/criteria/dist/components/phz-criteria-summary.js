/**
 * @phozart/criteria — Criteria Summary (Standalone)
 *
 * A standalone summary strip that can be placed anywhere on screen.
 * The consumer controls the message content; admin controls the styling.
 *
 * Properties:
 *  - message: string — text/HTML to display
 *  - active: boolean — switches to active color scheme (when filters applied)
 *  - layout: SummaryStripLayout — styling from admin config
 *  - visible: boolean — show/hide (defaults true)
 *
 * Events:
 *  - summary-click — dispatched on click (consumer can open drawer)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let PhzCriteriaSummary = class PhzCriteriaSummary extends LitElement {
    constructor() {
        super(...arguments);
        this.message = '';
        this.active = false;
        this.layout = {};
        this.visible = true;
    }
    static { this.styles = [css `
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    }

    :host([hidden]) { display: none; }

    .phz-sc-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      overflow-x: auto;
    }

    .phz-sc-summary:hover {
      filter: brightness(0.97);
    }

    :focus-visible {
      outline: 2px solid #EF4444;
      outline-offset: 2px;
    }
  `]; }
    _onClick() {
        this.dispatchEvent(new CustomEvent('summary-click', {
            bubbles: true, composed: true,
        }));
    }
    render() {
        if (!this.visible || !this.message)
            return nothing;
        const ly = this.layout;
        const isActive = this.active;
        const bg = isActive
            ? (ly.activeBgColor ?? '#EFF6FF')
            : (ly.bgColor ?? '#FAFAF9');
        const color = isActive
            ? (ly.activeTextColor ?? '#1D4ED8')
            : (ly.textColor ?? '#78716C');
        const border = isActive
            ? (ly.activeBorderColor ?? '#2563EB')
            : (ly.borderColor ?? '#E7E5E4');
        const radius = ly.borderRadius ?? 8;
        return html `
      <div
        class="phz-sc-summary"
        style="background:${bg}; color:${color}; border:1px solid ${border}; border-radius:${radius}px"
        @click=${this._onClick}
        role="button"
        tabindex="0"
        aria-label="Selection criteria summary"
      >${this.message}</div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzCriteriaSummary.prototype, "message", void 0);
__decorate([
    property({ type: Boolean })
], PhzCriteriaSummary.prototype, "active", void 0);
__decorate([
    property({ type: Object })
], PhzCriteriaSummary.prototype, "layout", void 0);
__decorate([
    property({ type: Boolean })
], PhzCriteriaSummary.prototype, "visible", void 0);
PhzCriteriaSummary = __decorate([
    customElement('phz-criteria-summary')
], PhzCriteriaSummary);
export { PhzCriteriaSummary };
//# sourceMappingURL=phz-criteria-summary.js.map