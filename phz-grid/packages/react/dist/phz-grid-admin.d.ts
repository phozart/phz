/**
 * @phozart/phz-react — PhzGridAdmin React Component
 *
 * Wraps the <phz-grid-admin> Web Component for React using @lit/react.
 * Uses React's ref system to expose the GridAdminApi.
 * Supports a shared-ref pattern: pass gridRef to auto-populate columns/fields.
 */
import React from 'react';
import type { GridApi } from '@phozart/phz-core';
import type { ReportPresentation } from '@phozart/phz-engine';
/** Imperative API exposed via ref on the PhzGridAdmin component. */
export interface GridAdminApi {
    /** Returns the current admin settings as a ReportPresentation bundle. */
    getSettings(): ReportPresentation;
    /** Populates admin panel from a ReportPresentation bundle. */
    setSettings(presentation: ReportPresentation): void;
    /** Opens the admin panel. */
    open(): void;
    /** Closes the admin panel. */
    close(): void;
}
export interface PhzGridAdminProps {
    open?: boolean;
    mode?: 'create' | 'edit';
    reportId?: string;
    reportName?: string;
    reportDescription?: string;
    reportCreated?: number;
    reportUpdated?: number;
    reportCreatedBy?: string;
    availableReports?: Array<{
        id: string;
        name: string;
    }>;
    columns?: any[];
    fields?: string[];
    columnTypes?: Record<string, string>;
    columnFormatting?: Record<string, any>;
    numberFormats?: Record<string, any>;
    statusColors?: Record<string, {
        bg: string;
        color: string;
        dot: string;
    }>;
    barThresholds?: Array<{
        min: number;
        color: string;
    }>;
    dateFormats?: Record<string, string>;
    linkTemplates?: Record<string, string>;
    tableSettings?: any;
    formattingRules?: any[];
    filterPresets?: Record<string, any>;
    themeTokens?: Record<string, string>;
    selectedDataProductId?: string;
    dataProducts?: any[];
    schemaFields?: any[];
    criteriaDefinitions?: any[];
    criteriaBindings?: any[];
    gridRef?: React.RefObject<GridApi | null>;
    onSettingsSave?: (detail: {
        reportId: string;
        reportName: string;
        settings: ReportPresentation;
    }) => void;
    onSettingsAutoSave?: (detail: {
        reportId: string;
        reportName: string;
        settings: ReportPresentation;
    }) => void;
    onSettingsReset?: (detail: {
        reportId: string;
    }) => void;
    onClose?: () => void;
    onCopySettingsRequest?: (detail: {
        targetReportId: string;
        availableReports: Array<{
            id: string;
            name: string;
        }>;
    }) => void;
    onExportDownload?: (detail: any) => void;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * React component wrapping the <phz-grid-admin> Web Component.
 * Forward ref exposes the GridAdminApi for imperative operations.
 */
export declare const PhzGridAdmin: React.ForwardRefExoticComponent<PhzGridAdminProps & React.RefAttributes<GridAdminApi>>;
//# sourceMappingURL=phz-grid-admin.d.ts.map