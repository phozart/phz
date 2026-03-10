/**
 * @phozart/phz-grid — <phz-column-chooser>
 *
 * Column management panel: show/hide columns, drag-reorder,
 * save/load user profiles, add/edit computed columns.
 * Opens as a right-edge slide-out panel that fills the full viewport height.
 *
 * Role-gated feature access:
 *   viewer — read-only column list (no checkboxes, no drag, no footer)
 *   user   — show/hide, reorder, profiles, footer buttons
 *   editor — above + per-column settings (rename, type, date format, width)
 *   admin  — above + computed columns
 */
import { LitElement, type TemplateResult, type PropertyValues } from 'lit';
import type { ColumnDefinition, ColumnState, UserRole } from '@phozart/phz-core';
export interface ColumnProfile {
    name: string;
    order: string[];
    visibility: Record<string, boolean>;
    widths: Record<string, number>;
}
export interface ColumnChooserChangeEvent {
    order: string[];
    visibility: Record<string, boolean>;
}
export interface ComputedColumnDef {
    name: string;
    field: string;
    type: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'distinct_count' | 'concat' | 'custom';
    sourceFields: string[];
    formula?: string;
}
export declare class PhzColumnChooser extends LitElement {
    open: boolean;
    columns: ColumnDefinition[];
    columnState: ColumnState | null;
    profiles: ColumnProfile[];
    computedColumns: ComputedColumnDef[];
    availableFields: Array<{
        field: string;
        header: string;
        type?: string;
    }>;
    userRole: UserRole;
    restrictedFields: Set<string>;
    dateFormats: Record<string, string>;
    private localVisibility;
    private localOrder;
    private searchQuery;
    private draggedField;
    private profileName;
    private sortAlpha;
    private profilesExpanded;
    private computedSectionExpanded;
    private localComputedColumns;
    private expandedSettingsField;
    private cleanup;
    private get canToggle();
    private get canReorder();
    private get canEditSettings();
    private get canCreateComputed();
    static styles: import("lit").CSSResult;
    protected willUpdate(changed: PropertyValues): void;
    updated(changed: PropertyValues): void;
    show(): void;
    hide(): void;
    /** Reset columns to their original order and all visible */
    resetColumns(): void;
    private initLocalState;
    private addListeners;
    private removeListeners;
    private toggleColumn;
    private showAll;
    private handleReset;
    private handleApply;
    private handleSaveProfile;
    private handleLoadProfile;
    private handleDragStart;
    private handleDragOver;
    private handleDrop;
    private handleDragEnd;
    private getColumnHeader;
    private getColumnType;
    private getColumnWidth;
    private getVisibleCount;
    private emitColumnSettingsChange;
    private toggleSettings;
    private addComputedColumn;
    private removeComputedColumn;
    private updateComputedName;
    private updateComputedType;
    private toggleComputedSourceField;
    private updateComputedFormula;
    private emitComputedColumnsChange;
    private getFieldsForComputedType;
    protected render(): TemplateResult;
    private renderColumnItem;
    private renderColumnSettings;
    private renderComputedItem;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-column-chooser': PhzColumnChooser;
    }
}
//# sourceMappingURL=phz-column-chooser.d.ts.map