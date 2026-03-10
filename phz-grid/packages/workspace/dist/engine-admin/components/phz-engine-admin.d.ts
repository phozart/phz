/**
 * @phozart/phz-engine-admin — Engine Admin Facade
 *
 * Admin shell: dark header, tab navigation for all builders.
 * Embeddable component — drop into any page.
 */
import { LitElement } from 'lit';
import type { BIEngine } from '@phozart/phz-engine';
import type { SelectionFieldDef } from '@phozart/phz-core';
import './phz-kpi-designer.js';
import './phz-dashboard-builder.js';
import './phz-metric-builder.js';
import './phz-report-designer.js';
import './phz-data-browser.js';
import './phz-selection-field-manager.js';
import './phz-pivot-designer.js';
export declare class PhzEngineAdmin extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    data?: Record<string, unknown>[];
    selectionFields: SelectionFieldDef[];
    private activeTab;
    private readonly tabs;
    private renderTabContent;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-engine-admin': PhzEngineAdmin;
    }
}
//# sourceMappingURL=phz-engine-admin.d.ts.map