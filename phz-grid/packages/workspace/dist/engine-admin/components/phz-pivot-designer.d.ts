/**
 * @phozart/engine-admin — Pivot Designer
 *
 * Single-page configurator: data product → row/column/value fields → preview.
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { BIEngine } from '@phozart/engine';
export declare class PhzPivotDesigner extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    data: Record<string, unknown>[];
    private selectedDataProduct;
    private availableFields;
    private rowFields;
    private columnFields;
    private valueFields;
    private pivotName;
    private previewResult;
    private selectDataProduct;
    private toggleRowField;
    private toggleColumnField;
    private addValueField;
    private removeValueField;
    private updateValueField;
    private buildPivotConfig;
    private runPreview;
    private handleSave;
    private renderPreviewTable;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-pivot-designer': PhzPivotDesigner;
    }
}
//# sourceMappingURL=phz-pivot-designer.d.ts.map