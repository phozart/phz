/**
 * @phozart/workspace — Report Editor Component
 *
 * Toolbar (undo/redo/save/publish) + grid preview + config panel (columns/filters/style).
 */
import { LitElement } from 'lit';
import type { DataAdapter } from '@phozart/shared';
export declare class PhzReportEditor extends LitElement {
    name: string;
    dataSourceId: string;
    availableFields: Array<{
        field: string;
        label: string;
    }>;
    /** DataAdapter for loading fields from data sources. When set, renders a data source panel. */
    adapter?: DataAdapter;
    private _state;
    private _showConfigPanel;
    private _criteriaState;
    private _chartState;
    private _undoManager;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private _pushUndo;
    private _undo;
    private _redo;
    private _addColumn;
    private _removeColumn;
    private _toggleVisibility;
    private _selectColumn;
    private _setTab;
    private _setDensity;
    private _removeFilter;
    private _toggleConfigPanel;
    private _toggleCriteria;
    private _removeCriteriaFilter;
    private _clearCriteriaFilters;
    private _onFieldAdd;
    private _onFieldRemove;
    private _setChartPreviewMode;
    private _overrideChartType;
    private _setChartEncoding;
    private _removeChartEncoding;
    private _onSave;
    private _onPublish;
    render(): import("lit-html").TemplateResult<1>;
    private _renderPanelContent;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-report-editor': PhzReportEditor;
    }
}
//# sourceMappingURL=phz-report-editor.d.ts.map