/**
 * @phozart/workspace — Creation Wizard Component
 *
 * Minimal 3-step wizard: pick type -> pick data source -> pick template -> configure.
 */
import { LitElement } from 'lit';
import type { DataSourceSchema } from '../data-adapter.js';
export declare class PhzCreationWizard extends LitElement {
    /** Available data sources to choose from */
    dataSources: Array<{
        id: string;
        name: string;
    }>;
    /** Schema for the selected data source (set externally after selection) */
    selectedSchema?: DataSourceSchema;
    private _flow;
    private _suggestions;
    static styles: import("lit").CSSResult;
    willUpdate(changed: Map<string, unknown>): void;
    private _selectType;
    private _selectSource;
    private _selectTemplate;
    private _setName;
    private _next;
    private _prev;
    private _cancel;
    private _getStepNumber;
    render(): import("lit-html").TemplateResult<1>;
    private _renderStep;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-creation-wizard': PhzCreationWizard;
    }
}
//# sourceMappingURL=phz-creation-wizard.d.ts.map