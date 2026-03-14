'use client';
/**
 * @phozart/react — PhzGridAdmin React Component
 *
 * Wraps the <phz-grid-admin> Web Component for React using @lit/react.
 * Uses React's ref system to expose the GridAdminApi.
 * Supports a shared-ref pattern: pass gridRef to auto-populate columns/fields.
 */
import React, {
  createElement,
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
} from 'react';
import { createComponent, type EventName } from '@lit/react';
import type { GridApi } from '@phozart/core';
import type { ReportPresentation } from '@phozart/engine';
import { PhzGridAdmin as PhzGridAdminElement } from '@phozart/workspace/grid-admin';

const PhzGridAdminLit = createComponent({
  tagName: 'phz-grid-admin',
  elementClass: PhzGridAdminElement,
  react: React,
  events: {
    onSettingsSaveEvent: 'settings-save' as EventName<CustomEvent>,
    onSettingsAutoSaveEvent: 'settings-auto-save' as EventName<CustomEvent>,
    onSettingsResetEvent: 'settings-reset' as EventName<CustomEvent>,
    onAdminCloseEvent: 'admin-close' as EventName<CustomEvent>,
    onCopySettingsRequestEvent: 'copy-settings-request' as EventName<CustomEvent>,
    onExportDownloadEvent: 'export-download' as EventName<CustomEvent>,
  },
});

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
  // Visibility
  open?: boolean;
  mode?: 'create' | 'edit';

  // Report identity
  reportId?: string;
  reportName?: string;
  reportDescription?: string;
  reportCreated?: number;
  reportUpdated?: number;
  reportCreatedBy?: string;
  availableReports?: Array<{ id: string; name: string }>;

  // Column config
  columns?: any[];
  fields?: string[];
  columnTypes?: Record<string, string>;
  columnFormatting?: Record<string, any>;
  numberFormats?: Record<string, any>;
  statusColors?: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  dateFormats?: Record<string, string>;
  linkTemplates?: Record<string, string>;

  // Table settings
  tableSettings?: any;

  // Formatting
  formattingRules?: any[];

  // Filter presets
  filterPresets?: Record<string, any>;

  // Theme
  themeTokens?: Record<string, string>;

  // Data source
  selectedDataProductId?: string;
  dataProducts?: any[];
  schemaFields?: any[];

  // Criteria
  criteriaDefinitions?: any[];
  criteriaBindings?: any[];

  // Grid ref for shared-ref pattern
  gridRef?: React.RefObject<GridApi | null>;

  // Event callbacks
  onSettingsSave?: (detail: { reportId: string; reportName: string; settings: ReportPresentation }) => void;
  onSettingsAutoSave?: (detail: { reportId: string; reportName: string; settings: ReportPresentation }) => void;
  onSettingsReset?: (detail: { reportId: string }) => void;
  onClose?: () => void;
  onCopySettingsRequest?: (detail: { targetReportId: string; availableReports: Array<{ id: string; name: string }> }) => void;
  onExportDownload?: (detail: any) => void;

  className?: string;
  style?: React.CSSProperties;
}

function wrapDetail(handler?: (detail: any) => void) {
  return handler ? (e: CustomEvent) => handler(e.detail) : undefined;
}

/**
 * React component wrapping the <phz-grid-admin> Web Component.
 * Forward ref exposes the GridAdminApi for imperative operations.
 */
export const PhzGridAdmin = forwardRef<GridAdminApi, PhzGridAdminProps>(
  function PhzGridAdmin(props, ref) {
    const elementRef = useRef<InstanceType<typeof PhzGridAdminElement> | null>(null);

    // Expose GridAdminApi via ref
    useImperativeHandle(ref, () => ({
      getSettings(): ReportPresentation {
        const el = elementRef.current as any;
        return el?.getSettings?.() ?? {};
      },
      setSettings(presentation: ReportPresentation): void {
        const el = elementRef.current as any;
        el?.setSettings?.(presentation);
      },
      open(): void {
        const el = elementRef.current as any;
        if (el) el.open = true;
      },
      close(): void {
        const el = elementRef.current as any;
        if (el) el.open = false;
      },
    }));

    // Shared-ref pattern: auto-populate columns/fields from grid
    useEffect(() => {
      if (!props.gridRef?.current) return;
      const el = elementRef.current as any;
      if (!el) return;

      const grid = props.gridRef.current as any;
      if (props.columns == null && grid.columns) {
        el.columns = grid.columns;
      }
      if (props.fields == null && grid.columns) {
        el.fields = (grid.columns as any[]).map((c: any) => c.field);
      }
    }, [props.gridRef, props.columns, props.fields]);

    // Build Lit element props, omitting undefined values to preserve
    // the Web Component's own defaults (e.g. availableReports defaults to []).
    const litProps: Record<string, unknown> = {
      ref: elementRef,
      open: props.open,
      mode: props.mode,
      reportId: props.reportId,
      reportName: props.reportName,
      reportDescription: props.reportDescription,
      reportCreated: props.reportCreated,
      reportUpdated: props.reportUpdated,
      reportCreatedBy: props.reportCreatedBy,
      availableReports: props.availableReports,
      columns: props.columns,
      fields: props.fields,
      columnTypes: props.columnTypes,
      columnFormatting: props.columnFormatting,
      numberFormats: props.numberFormats,
      statusColors: props.statusColors,
      barThresholds: props.barThresholds,
      dateFormats: props.dateFormats,
      linkTemplates: props.linkTemplates,
      tableSettings: props.tableSettings,
      formattingRules: props.formattingRules,
      filterPresets: props.filterPresets,
      themeTokens: props.themeTokens,
      selectedDataProductId: props.selectedDataProductId,
      dataProducts: props.dataProducts,
      schemaFields: props.schemaFields,
      criteriaDefinitions: props.criteriaDefinitions,
      criteriaBindings: props.criteriaBindings,
      onSettingsSaveEvent: wrapDetail(props.onSettingsSave),
      onSettingsAutoSaveEvent: wrapDetail(props.onSettingsAutoSave),
      onSettingsResetEvent: wrapDetail(props.onSettingsReset),
      onAdminCloseEvent: props.onClose ? () => props.onClose!() : undefined,
      onCopySettingsRequestEvent: wrapDetail(props.onCopySettingsRequest),
      onExportDownloadEvent: wrapDetail(props.onExportDownload),
      class: props.className,
      style: props.style,
    };

    // Remove undefined entries so Lit defaults are not overwritten
    for (const key of Object.keys(litProps)) {
      if (litProps[key] === undefined) delete litProps[key];
    }

    return createElement(PhzGridAdminLit as any, litProps);
  },
);
