/**
 * @phozart/phz-engine-admin — Calculated Field Form
 *
 * Slide-over form for creating/editing calculated fields with expression builder.
 */
import { LitElement } from 'lit';
import type { CalculatedFieldDef, DataModelField, ParameterDef } from '@phozart/phz-engine';
import './phz-expression-builder.js';
export declare class PhzCalculatedFieldForm extends LitElement {
    static styles: import("lit").CSSResult[];
    calculatedField?: CalculatedFieldDef;
    isEdit: boolean;
    fields: DataModelField[];
    parameters: ParameterDef[];
    calculatedFields: CalculatedFieldDef[];
    previewData: Record<string, unknown>[];
    private _name;
    private _outputType;
    private _expression?;
    willUpdate(changed: Map<string, unknown>): void;
    private _handleExpressionChange;
    private _getPreviewResults;
    private _handleSave;
    private _handleCancel;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-calculated-field-form': PhzCalculatedFieldForm;
    }
}
//# sourceMappingURL=phz-calculated-field-form.d.ts.map