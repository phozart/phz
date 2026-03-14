/**
 * @phozart/definitions — <phz-definition-panel>
 *
 * Composition component hosting report identity + data source picker.
 */
import { LitElement } from 'lit';
import type { DataProductListItem, DataProductFieldInfo } from './phz-definition-data-source.js';
import './phz-definition-report.js';
import './phz-definition-data-source.js';
export declare class PhzDefinitionPanel extends LitElement {
    static styles: import("lit").CSSResult[];
    reportName: string;
    reportDescription: string;
    reportId: string;
    mode: 'create' | 'edit';
    selectedDataProductId: string;
    dataProducts: DataProductListItem[];
    schemaFields: DataProductFieldInfo[];
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-definition-panel': PhzDefinitionPanel;
    }
}
//# sourceMappingURL=phz-definition-panel.d.ts.map