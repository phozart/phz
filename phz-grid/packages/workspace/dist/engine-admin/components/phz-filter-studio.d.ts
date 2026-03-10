/**
 * @phozart/phz-engine-admin — Filter Definition Studio
 *
 * Rich 3-panel visual builder for creating/editing filter definitions.
 * Layout: Type Catalog (200px) | Configuration Form (1fr) | Live Preview (360px)
 *
 * Events:
 * - filter-studio-save: { definition: FilterDefinition }
 * - filter-studio-cancel
 */
import { LitElement } from 'lit';
import type { FilterDefinition, FilterDataSource } from '@phozart/phz-core';
export declare class PhzFilterStudio extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Edit mode — pass existing definition to pre-populate */
    definition?: FilterDefinition;
    /** Available columns for data field autocomplete */
    availableColumns: string[];
    /** Dataset rows — used for "Import from column" and "Build tree from data" */
    data: Record<string, unknown>[];
    /** Named data sources for data source selection */
    dataSources: FilterDataSource[];
    private _helpOpen;
    private selectedType;
    private draft;
    private _treeSourceDsId;
    private _treeLevels;
    private _importColumn;
    private _validationError;
    private _selectedDataSourceId;
    private _selectedValueField;
    private _labelTemplate;
    private _options;
    private _treeOptions;
    connectedCallback(): void;
    private _resetDraft;
    private _updateDraft;
    private _selectType;
    private _handleStudioDataSourceChange;
    private _renderStudioTemplatePreview;
    private _handleSave;
    private _handleCancel;
    private _addOption;
    private _updateOption;
    private _removeOption;
    private _addTreeLevel;
    private _removeTreeLevel;
    private _updateTreeLevel;
    private _getTreeSourceColumns;
    private _getTreeSourceRows;
    private _computeTreePreview;
    /** Derive column names from actual data rows or selected data source */
    private _getDataColumns;
    private _importOptionsFromColumn;
    render(): import("lit-html").TemplateResult<1>;
    private _renderCatalog;
    private _renderHelp;
    private _renderForm;
    private _renderIdentitySection;
    private _renderTypeConfig;
    private _renderOptionsConfig;
    private _renderTextConfig;
    private _renderSearchConfig;
    private _renderDateRangeConfig;
    private _renderNumericRangeConfig;
    private _renderTreeConfig;
    private _countTreeNodes;
    private _renderFieldPresenceConfig;
    private _renderPreview;
    private _renderPreviewControl;
    private _renderOptionsPreview;
    private _renderTextPreview;
    private _renderSearchPreview;
    private _renderDateRangePreview;
    private _renderNumericPreview;
    private _renderTreePreview;
    private _renderTreePreviewNodes;
    private _renderPresencePreview;
    private _renderPeriodPreview;
    private _renderSummaryCard;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-filter-studio': PhzFilterStudio;
    }
}
//# sourceMappingURL=phz-filter-studio.d.ts.map