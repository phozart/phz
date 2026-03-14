/**
 * @phozart/grid-admin — Conditional Formatting Rule Builder
 *
 * Rule list with inline condition builder, style editor, and live preview.
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { ConditionalFormattingRule } from '@phozart/core';
export declare class PhzAdminFormatting extends LitElement {
    static styles: import("lit").CSSResult[];
    rules: ConditionalFormattingRule[];
    fields: string[];
    private editingRuleId;
    private _prevRuleCount;
    updated(changed: Map<string, unknown>): void;
    private handleAddRule;
    private handleRemoveRule;
    private handleToggleEdit;
    private emitUpdate;
    private handleFieldChange;
    private handleOperatorChange;
    private handleValueChange;
    private handleValue2Change;
    private handleBgColorChange;
    private handleTextColorChange;
    private handleFontWeightChange;
    private renderEditor;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-formatting': PhzAdminFormatting;
    }
}
//# sourceMappingURL=phz-admin-formatting.d.ts.map