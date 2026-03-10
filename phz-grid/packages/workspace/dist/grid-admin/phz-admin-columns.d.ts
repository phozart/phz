/**
 * @phozart/phz-grid-admin — Column Configurator (Dual-List Picker)
 *
 * Side-by-side Available/Selected panels with search, drag-to-reorder,
 * multi-select, move up/down, and per-column settings (type, status colors,
 * bar thresholds, date formats).
 */
import { LitElement } from 'lit';
import type { ColumnColorThreshold, ColumnFormatting } from '@phozart/phz-engine';
export type { ColumnColorThreshold, ColumnFormatting };
interface ColumnItem {
    field: string;
    header: string;
    visible: boolean;
    width?: number;
}
export declare class PhzAdminColumns extends LitElement {
    static styles: import("lit").CSSResult[];
    columns: ColumnItem[];
    columnTypes: Record<string, string>;
    statusColors: Record<string, {
        bg: string;
        color: string;
        dot: string;
    }>;
    barThresholds: Array<{
        min: number;
        color: string;
    }>;
    dateFormats: Record<string, string>;
    linkTemplates: Record<string, string>;
    columnFormatting: Record<string, ColumnFormatting>;
    numberFormats: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    private availableFields;
    private selectedFields;
    private searchQuery;
    private availableHighlighted;
    private selectedHighlighted;
    private dragField;
    private dragOverField;
    private settingsField;
    private columnMap;
    private skipNextColumnsSync;
    willUpdate(changed: Map<string, unknown>): void;
    private getHeader;
    private get filteredAvailable();
    private emitUpdate;
    private emitShowAll;
    private emitHideAll;
    private emitColumnConfig;
    private handleAvailableClick;
    private handleAvailableDblClick;
    private addFields;
    private handleAddSelected;
    private handleAddAll;
    private handleSelectedClick;
    private removeFields;
    private handleRemoveItem;
    private handleRemoveSelected;
    private handleRemoveAll;
    private handleMoveUp;
    private handleMoveDown;
    private handleDragStart;
    private handleDragOver;
    private handleDragLeave;
    private handleDrop;
    private handleDragEnd;
    private handleSearch;
    private handleToggleSettings;
    private handleColumnTypeChange;
    private handleDateFormatChange;
    private handleLinkTemplateChange;
    private handleNumberFormatChange;
    private handleStatusColorChange;
    private handleStatusValueRename;
    private handleAddStatusValue;
    private handleRemoveStatusValue;
    private handleThresholdChange;
    private handleAddThreshold;
    private handleRemoveThreshold;
    private renderColumnSettings;
    private handleFormattingChange;
    private renderColumnFormatting;
    private handleThresholdEntryChange;
    private handleAddThresholdEntry;
    private handleRemoveThresholdEntry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-columns': PhzAdminColumns;
    }
}
//# sourceMappingURL=phz-admin-columns.d.ts.map