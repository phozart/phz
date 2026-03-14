/**
 * @phozart/engine-admin — Expression Builder
 *
 * Dual-mode expression editor (Block mode + Formula mode).
 * Both modes edit the same ExpressionNode tree.
 */
import { LitElement } from 'lit';
import type { ExpressionNode, DataModelField, ParameterDef, CalculatedFieldDef } from '@phozart/engine';
import type { MetricDef } from '@phozart/engine';
export declare class PhzExpressionBuilder extends LitElement {
    static styles: import("lit").CSSResult;
    expression?: ExpressionNode;
    fields: DataModelField[];
    parameters: ParameterDef[];
    calculatedFields: CalculatedFieldDef[];
    metrics: MetricDef[];
    level: 'row' | 'metric';
    private _mode;
    private _formulaText;
    private _errors;
    private _showHelp;
    willUpdate(changed: Map<string, unknown>): void;
    private _validate;
    private _emit;
    private _switchMode;
    private _handleFormulaInput;
    private _insertRef;
    private _insertFunction;
    private _renderBlock;
    private _renderHelp;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-expression-builder': PhzExpressionBuilder;
    }
}
//# sourceMappingURL=phz-expression-builder.d.ts.map