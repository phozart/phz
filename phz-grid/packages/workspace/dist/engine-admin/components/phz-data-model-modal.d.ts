/**
 * @phozart/phz-engine-admin — Data Model Modal
 *
 * Centered 720px modal workspace for creating/editing data model entities.
 * Replaces the narrow 380px slide-over with guidance header, existing items
 * list, contextual tips, and the form content.
 */
import { LitElement, nothing } from 'lit';
import type { DataModelField, ParameterDef, CalculatedFieldDef } from '@phozart/phz-engine';
import type { MetricDef, KPIDefinition, BIEngine } from '@phozart/phz-engine';
import './phz-parameter-form.js';
import './phz-calculated-field-form.js';
import './phz-metric-form.js';
import './phz-kpi-form.js';
type EntityType = 'parameters' | 'calculatedFields' | 'metrics' | 'kpis';
export declare class PhzDataModelModal extends LitElement {
    static styles: import("lit").CSSResult[];
    open: boolean;
    entityType: EntityType;
    editId?: string;
    fields: DataModelField[];
    parameters: ParameterDef[];
    calculatedFields: CalculatedFieldDef[];
    metrics: MetricDef[];
    kpis: KPIDefinition[];
    previewData: Record<string, unknown>[];
    engine?: BIEngine;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onKeyDown;
    private _close;
    private _onBackdropClick;
    private _getExistingItems;
    private _selectItem;
    private _createNew;
    private _getEditEntity;
    private _renderForm;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-data-model-modal': PhzDataModelModal;
    }
}
export {};
//# sourceMappingURL=phz-data-model-modal.d.ts.map