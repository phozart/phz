/**
 * <phz-data-source-panel> — Interactive data source browser
 *
 * Connects to a DataAdapter and provides an interactive field browser
 * for report/visualization composition. Fields are classified into
 * dimensions, measures, time fields, and identifiers.
 *
 * Usage:
 *   <phz-data-source-panel
 *     .adapter=${myDataAdapter}
 *     @field-add=${(e) => handleFieldAdd(e.detail.field)}
 *     @field-remove=${(e) => handleFieldRemove(e.detail.field)}
 *     @source-change=${(e) => handleSourceChange(e.detail.sourceId)}
 *   ></phz-data-source-panel>
 */
import { LitElement } from 'lit';
import type { DataAdapter } from '@phozart/shared';
export declare class PhzDataSourcePanel extends LitElement {
    static styles: import("lit").CSSResult;
    /** The data adapter to query for sources and schemas. */
    adapter?: DataAdapter;
    /** Pre-select a specific source ID on load. */
    sourceId?: string;
    private _state;
    private _expanded;
    private _setState;
    connectedCallback(): Promise<void>;
    updated(changedProperties: Map<string, unknown>): void;
    private _selectSource;
    private _toggleSection;
    private _handleSearch;
    private _toggleField;
    private _renderFieldSection;
    private _renderFieldItem;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-data-source-panel': PhzDataSourcePanel;
    }
}
//# sourceMappingURL=phz-data-source-panel.d.ts.map