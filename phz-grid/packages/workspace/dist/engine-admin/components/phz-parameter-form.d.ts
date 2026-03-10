/**
 * @phozart/phz-engine-admin — Parameter Form
 *
 * Slide-over form for creating/editing dashboard parameters.
 */
import { LitElement } from 'lit';
import type { ParameterDef } from '@phozart/phz-engine';
export declare class PhzParameterForm extends LitElement {
    static styles: import("lit").CSSResult[];
    parameter?: ParameterDef;
    isEdit: boolean;
    private _name;
    private _type;
    private _defaultValue;
    private _options;
    private _min?;
    private _max?;
    private _step?;
    willUpdate(changed: Map<string, unknown>): void;
    private _handleSave;
    private _handleCancel;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-parameter-form': PhzParameterForm;
    }
}
//# sourceMappingURL=phz-parameter-form.d.ts.map