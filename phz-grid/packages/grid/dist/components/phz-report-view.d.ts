/**
 * @phozart/grid — <phz-report-view> Orchestrator
 *
 * Bundles criteria-bar + grid + admin panel into one cohesive view.
 * Handles data-source selection → column auto-population,
 * criteria binding → criteria-bar population, and auto-save on admin close.
 *
 * Events:
 *   report-save   → { reportId, reportName, settings }
 *   report-create  → { reportConfig }   (when creating a new report)
 */
import { LitElement, type PropertyValues } from 'lit';
import type { ColumnDefinition, CriteriaConfig, SelectionContext, SelectionPreset } from '@phozart/core';
import { type ReportPresentation } from '@phozart/engine';
import type { DataProductListItem, DataProductFieldInfo, CriteriaDefinitionItem, CriteriaBindingItem } from '@phozart/workspace/grid-admin';
import './phz-grid.js';
export declare class PhzReportView extends LitElement {
    static styles: import("lit").CSSResult;
    /** Report ID */
    reportId: string;
    /** Report name */
    reportName: string;
    /** Report description */
    reportDescription: string;
    /** Data to display in the grid */
    data: unknown[];
    /** Column definitions for the grid */
    columns: ColumnDefinition[];
    /** Whether the current user is an admin */
    isAdmin: boolean;
    /** Grid title */
    gridTitle: string;
    /** Available data products for the data-source picker */
    dataProducts: DataProductListItem[];
    /** Schema fields of the currently selected data product */
    schemaFields: DataProductFieldInfo[];
    /** Selected data product ID */
    selectedDataProductId: string;
    /** Available filter definitions for the criteria tab */
    criteriaDefinitions: CriteriaDefinitionItem[];
    /** Current criteria bindings */
    criteriaBindings: CriteriaBindingItem[];
    /** Criteria filter configuration (fields, behavior, dependencies). When set, renders the criteria bar. */
    criteriaConfig?: CriteriaConfig;
    /** Current criteria selection state (field values). Two-way: pass in to restore, listen for changes. */
    selectionContext: SelectionContext;
    /** Criteria presets (saved filter combinations). */
    criteriaPresets: SelectionPreset[];
    /** Saved presentation settings (table settings, formatting, colors, etc.) loaded from DB. */
    presentation: ReportPresentation;
    /** Start with admin panel open (e.g., for new report creation) */
    adminOpen: boolean;
    /** Admin mode: 'create' or 'edit' */
    adminMode: 'create' | 'edit';
    /** Report created timestamp */
    reportCreated: number;
    /** Report updated timestamp */
    reportUpdated: number;
    private _adminPanelOpen;
    /** Guard: true when presentation was updated from admin live-sync (skip re-hydrating admin). */
    private _presentationFromAdmin;
    /** Merged table settings: defaults + presentation overrides. */
    private get _ts();
    connectedCallback(): void;
    updated(changed: PropertyValues): void;
    /** Push presentation settings into the admin panel via its setSettings() API. */
    private _hydrateAdmin;
    /** Live-sync: admin changes a table setting → update presentation immediately so the grid reflects it. */
    private _handleLiveTableSettings;
    /** Live-sync: admin changes column formatting → update presentation immediately. */
    private _handleLiveColumnConfig;
    private _toggleAdmin;
    private _closeAdmin;
    private _handleSave;
    private _handleAutoSave;
    private _handleDataSourceChange;
    private _handleCriteriaBindingChange;
    private _handleCriteriaChange;
    private _handleCriteriaApply;
    private _handleCriteriaReset;
    private _handleGridReady;
    private _handleRowAction;
    private _handleDrillThrough;
    private _handleGenerateDashboard;
    private _handleCopy;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-report-view': PhzReportView;
    }
}
//# sourceMappingURL=phz-report-view.d.ts.map