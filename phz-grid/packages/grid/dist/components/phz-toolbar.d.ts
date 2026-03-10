/**
 * <phz-toolbar> — Standalone Toolbar Web Component
 *
 * Can be used:
 * 1. Embedded inside <phz-grid> (default when showToolbar=true)
 * 2. Standalone anywhere on the page, wired via `.grid` property
 * 3. Standalone with manual event handling (no .grid reference)
 *
 * Events (all bubble + composed):
 *   toolbar-search         → { query: string }
 *   toolbar-filter-remove  → { field: string }
 *   toolbar-density-change → { density: Density }
 *   toolbar-export-csv     → { includeFormatting, includeGroupHeaders }
 *   toolbar-export-excel   → { includeFormatting, includeGroupHeaders }
 *   toolbar-columns-open   → {}
 *   toolbar-column-chooser-open → {}
 *   toolbar-auto-size      → {}
 *   toolbar-generate-dashboard → { dataMode: 'filtered' | 'full' }
 */
import { LitElement, type TemplateResult } from 'lit';
import type { ColumnDefinition } from '@phozart/phz-core';
import type { Density, FilterInfo } from '../types.js';
export interface ToolbarSearchEvent {
    query: string;
}
export interface ToolbarExportEvent {
    includeFormatting: boolean;
    includeGroupHeaders: boolean;
}
export declare class PhzToolbar extends LitElement {
    searchQuery: string;
    activeFilters: Map<string, FilterInfo>;
    columns: ColumnDefinition[];
    density: Density;
    showExport: boolean;
    showDensityToggle: boolean;
    showColumnEditor: boolean;
    exportIncludeFormatting: boolean;
    exportIncludeGroupHeaders: boolean;
    showGenerateDashboard: boolean;
    /** Show "Admin Settings" entry in the options menu (admin users only). */
    showAdminSettings: boolean;
    grid: HTMLElement | null;
    slim: boolean;
    private exportDropdownOpen;
    private optionsMenuOpen;
    private _dropdownStyle;
    private _dropdownCleanup;
    private _positionDropdown;
    private _addDropdownListeners;
    private _removeDropdownListeners;
    private _gridListeners;
    updated(changed: Map<string, unknown>): void;
    disconnectedCallback(): void;
    private _attachGridListeners;
    private _detachGridListeners;
    private _emit;
    private _handleSearch;
    private _clearSearch;
    private _removeFilter;
    private _setDensity;
    private _exportCSV;
    private _exportExcel;
    private _openColumns;
    private _openColumnChooser;
    private _autoSize;
    private _generateDashboard;
    private _openAdminSettings;
    static styles: import("lit").CSSResult;
    private svgSearch;
    private svgClose;
    private svgExport;
    private svgMoreVertical;
    private svgColumns;
    private svgDashboard;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-toolbar': PhzToolbar;
    }
}
//# sourceMappingURL=phz-toolbar.d.ts.map