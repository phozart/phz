/**
 * @phozart/definitions — <phz-definition-panel>
 *
 * Composition component hosting report identity + data source picker.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import type { DataProductListItem, DataProductFieldInfo } from './phz-definition-data-source.js';

import './phz-definition-report.js';
import './phz-definition-data-source.js';

@safeCustomElement('phz-definition-panel')
export class PhzDefinitionPanel extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
      :host { display: block; }
      .panel-section { margin-bottom: 24px; }
      .section-title {
        font-size: 14px; font-weight: 700; color: #1C1917;
        margin-bottom: 12px; padding-bottom: 8px;
        border-bottom: 1px solid #E7E5E4;
      }
    `,
  ];

  @property({ type: String }) reportName: string = '';
  @property({ type: String }) reportDescription: string = '';
  @property({ type: String }) reportId: string = '';
  @property({ type: String }) mode: 'create' | 'edit' = 'edit';
  @property({ type: String }) selectedDataProductId: string = '';
  @property({ attribute: false }) dataProducts: DataProductListItem[] = [];
  @property({ attribute: false }) schemaFields: DataProductFieldInfo[] = [];

  render() {
    return html`
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
}

declare global {
  interface HTMLElementTagNameMap { 'phz-definition-panel': PhzDefinitionPanel; }
}
