/**
 * @phozart/grid-admin — Grid Admin Facade
 *
 * Modal dialog with tabbed admin sections for grid visual configuration.
 * Tabs: Table Settings, Columns, Formatting, Filters, Export.
 *
 * Report identity, data source selection, and criteria binding are handled
 * by phz-definitions and phz-criteria respectively.
 */
import { LitElement } from 'lit';
import type { ReportPresentation } from '@phozart/engine';
import './phz-admin-table-settings.js';
import './phz-admin-columns.js';
import './phz-admin-formatting.js';
import './phz-admin-filters.js';
import './phz-admin-export.js';
export declare class PhzGridAdmin extends LitElement {
    static styles: import("lit").CSSResult[];
    open: boolean;
    /** Report identity — settings are scoped to this report */
    reportId: string;
    reportName: string;
    /** List of other reports whose settings can be copied */
    availableReports: Array<{
        id: string;
        name: string;
    }>;
    columns: any[];
    formattingRules: any[];
    fields: string[];
    filterPresets: Record<string, any>;
    themeTokens: Record<string, string>;
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
    tableSettings: any;
    columnFormatting: Record<string, any>;
    numberFormats: Record<string, any>;
    private activeTab;
    private _saveState;
    private _saveTimer;
    private _autoSaveTimer;
    private _initialized;
    private _boundKeyHandler;
    private readonly tabs;
    connectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    disconnectedCallback(): void;
    private _handleTableSettingsChange;
    private _handleColumnConfigChange;
    private _handleRulesChange;
    private _handleColumnsChange;
    /** Returns the current admin state as a ReportPresentation bundle. */
    getSettings(): ReportPresentation;
    /** Populates facade properties from a ReportPresentation bundle. */
    setSettings(presentation: ReportPresentation): void;
    private scheduleAutoSave;
    private handleSaveSettings;
    private _handleReset;
    private handleClose;
    private handleCopySettings;
    private renderTabContent;
    private get _saveButtonLabel();
    private _handleBackdropClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-grid-admin': PhzGridAdmin;
    }
}
//# sourceMappingURL=phz-grid-admin.d.ts.map