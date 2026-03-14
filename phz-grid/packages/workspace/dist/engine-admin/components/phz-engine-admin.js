/**
 * @phozart/engine-admin — Engine Admin Facade
 *
 * Admin shell: dark header, tab navigation for all builders.
 * Embeddable component — drop into any page.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import './phz-kpi-designer.js';
import './phz-dashboard-builder.js';
import './phz-metric-builder.js';
import './phz-report-designer.js';
import './phz-data-browser.js';
import './phz-selection-field-manager.js';
import './phz-pivot-designer.js';
let PhzEngineAdmin = class PhzEngineAdmin extends LitElement {
    constructor() {
        super(...arguments);
        this.selectionFields = [];
        this.activeTab = 'kpi';
        this.tabs = [
            { id: 'kpi', label: 'KPI Designer' },
            { id: 'dashboard', label: 'Dashboard Builder' },
            { id: 'metric', label: 'Metric Builder' },
            { id: 'report', label: 'Report Designer' },
            { id: 'pivot', label: 'Pivot Designer' },
            { id: 'data', label: 'Data Products' },
            { id: 'selection', label: 'Selection Fields' },
        ];
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; }
      .admin-shell { display: flex; flex-direction: column; min-height: 600px; border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }
      .admin-body { flex: 1; overflow: auto; padding: 16px; }

      @media (max-width: 768px) {
        .admin-shell { min-height: 400px; border-radius: 0; }
        .admin-body { padding: 8px; }
      }

      @media (max-width: 576px) {
        .admin-shell { border-radius: 0; border: none; }
      }
    `,
    ]; }
    renderTabContent() {
        switch (this.activeTab) {
            case 'kpi': return html `<phz-kpi-designer .engine=${this.engine}></phz-kpi-designer>`;
            case 'dashboard': return html `<phz-dashboard-builder .engine=${this.engine} .data=${this.data}></phz-dashboard-builder>`;
            case 'metric': return html `<phz-metric-builder .engine=${this.engine}></phz-metric-builder>`;
            case 'report': return html `<phz-report-designer .engine=${this.engine}></phz-report-designer>`;
            case 'pivot': return html `<phz-pivot-designer .engine=${this.engine}></phz-pivot-designer>`;
            case 'data': return html `<phz-data-browser .products=${this.engine?.dataProducts.list() ?? []}></phz-data-browser>`;
            case 'selection': return html `<phz-selection-field-manager .fields=${this.selectionFields}></phz-selection-field-manager>`;
        }
    }
    render() {
        return html `
      <div class="admin-shell" role="region" aria-label="Engine Admin">
        <div class="phz-ea-header">
          <span class="phz-ea-header-title">
            PHOZART ENGINE
            <span class="phz-ea-header-subtitle">Admin</span>
          </span>
        </div>

        <div class="phz-ea-tabs" role="tablist">
          ${this.tabs.map(tab => html `
            <button class="phz-ea-tab ${this.activeTab === tab.id ? 'phz-ea-tab--active' : ''}"
                    role="tab" aria-selected=${this.activeTab === tab.id}
                    @click=${() => { this.activeTab = tab.id; this.dispatchEvent(new CustomEvent('navigate', { bubbles: true, composed: true, detail: { tab: tab.id } })); }}>
              ${tab.label}
            </button>
          `)}
        </div>

        <div class="admin-body" role="tabpanel">
          ${this.renderTabContent()}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzEngineAdmin.prototype, "engine", void 0);
__decorate([
    property({ type: Array })
], PhzEngineAdmin.prototype, "data", void 0);
__decorate([
    property({ type: Array })
], PhzEngineAdmin.prototype, "selectionFields", void 0);
__decorate([
    state()
], PhzEngineAdmin.prototype, "activeTab", void 0);
PhzEngineAdmin = __decorate([
    safeCustomElement('phz-engine-admin')
], PhzEngineAdmin);
export { PhzEngineAdmin };
//# sourceMappingURL=phz-engine-admin.js.map