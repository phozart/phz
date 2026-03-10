/**
 * @phozart/phz-definitions — <phz-definition-panel>
 *
 * Composition component hosting report identity + data source picker.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import './phz-definition-report.js';
import './phz-definition-data-source.js';
let PhzDefinitionPanel = class PhzDefinitionPanel extends LitElement {
    constructor() {
        super(...arguments);
        this.reportName = '';
        this.reportDescription = '';
        this.reportId = '';
        this.mode = 'edit';
        this.selectedDataProductId = '';
        this.dataProducts = [];
        this.schemaFields = [];
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      :host { display: block; }
      .panel-section { margin-bottom: 24px; }
      .section-title {
        font-size: 14px; font-weight: 700; color: #1C1917;
        margin-bottom: 12px; padding-bottom: 8px;
        border-bottom: 1px solid #E7E5E4;
      }
    `,
    ]; }
    render() {
        return html `
      <div class="panel-section">
        <div class="section-title">Report Identity</div>
        <phz-definition-report
          .reportName=${this.reportName}
          .reportDescription=${this.reportDescription}
          .reportId=${this.reportId}
          .mode=${this.mode}
        ></phz-definition-report>
      </div>

      <div class="panel-section">
        <div class="section-title">Data Source</div>
        <phz-definition-data-source
          .selectedDataProductId=${this.selectedDataProductId}
          .dataProducts=${this.dataProducts}
          .schemaFields=${this.schemaFields}
        ></phz-definition-data-source>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzDefinitionPanel.prototype, "reportName", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionPanel.prototype, "reportDescription", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionPanel.prototype, "reportId", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionPanel.prototype, "mode", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionPanel.prototype, "selectedDataProductId", void 0);
__decorate([
    property({ attribute: false })
], PhzDefinitionPanel.prototype, "dataProducts", void 0);
__decorate([
    property({ attribute: false })
], PhzDefinitionPanel.prototype, "schemaFields", void 0);
PhzDefinitionPanel = __decorate([
    safeCustomElement('phz-definition-panel')
], PhzDefinitionPanel);
export { PhzDefinitionPanel };
//# sourceMappingURL=phz-definition-panel.js.map