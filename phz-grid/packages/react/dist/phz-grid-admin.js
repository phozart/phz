'use client';
/**
 * @phozart/phz-react — PhzGridAdmin React Component
 *
 * Wraps the <phz-grid-admin> Web Component for React using @lit/react.
 * Uses React's ref system to expose the GridAdminApi.
 * Supports a shared-ref pattern: pass gridRef to auto-populate columns/fields.
 */
import React, { createElement, forwardRef, useRef, useEffect, useImperativeHandle, } from 'react';
import { createComponent } from '@lit/react';
import { PhzGridAdmin as PhzGridAdminElement } from '@phozart/phz-workspace/grid-admin';
const PhzGridAdminLit = createComponent({
    tagName: 'phz-grid-admin',
    elementClass: PhzGridAdminElement,
    react: React,
    events: {
        onSettingsSaveEvent: 'settings-save',
        onSettingsAutoSaveEvent: 'settings-auto-save',
        onSettingsResetEvent: 'settings-reset',
        onAdminCloseEvent: 'admin-close',
        onCopySettingsRequestEvent: 'copy-settings-request',
        onExportDownloadEvent: 'export-download',
    },
});
function wrapDetail(handler) {
    return handler ? (e) => handler(e.detail) : undefined;
}
/**
 * React component wrapping the <phz-grid-admin> Web Component.
 * Forward ref exposes the GridAdminApi for imperative operations.
 */
export const PhzGridAdmin = forwardRef(function PhzGridAdmin(props, ref) {
    const elementRef = useRef(null);
    // Expose GridAdminApi via ref
    useImperativeHandle(ref, () => ({
        getSettings() {
            const el = elementRef.current;
            return el?.getSettings?.() ?? {};
        },
        setSettings(presentation) {
            const el = elementRef.current;
            el?.setSettings?.(presentation);
        },
        open() {
            const el = elementRef.current;
            if (el)
                el.open = true;
        },
        close() {
            const el = elementRef.current;
            if (el)
                el.open = false;
        },
    }));
    // Shared-ref pattern: auto-populate columns/fields from grid
    useEffect(() => {
        if (!props.gridRef?.current)
            return;
        const el = elementRef.current;
        if (!el)
            return;
        const grid = props.gridRef.current;
        if (props.columns == null && grid.columns) {
            el.columns = grid.columns;
        }
        if (props.fields == null && grid.columns) {
            el.fields = grid.columns.map((c) => c.field);
        }
    }, [props.gridRef, props.columns, props.fields]);
    // Build Lit element props, omitting undefined values to preserve
    // the Web Component's own defaults (e.g. availableReports defaults to []).
    const litProps = {
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
        onAdminCloseEvent: props.onClose ? () => props.onClose() : undefined,
        onCopySettingsRequestEvent: wrapDetail(props.onCopySettingsRequest),
        onExportDownloadEvent: wrapDetail(props.onExportDownload),
        class: props.className,
        style: props.style,
    };
    // Remove undefined entries so Lit defaults are not overwritten
    for (const key of Object.keys(litProps)) {
        if (litProps[key] === undefined)
            delete litProps[key];
    }
    return createElement(PhzGridAdminLit, litProps);
});
//# sourceMappingURL=phz-grid-admin.js.map