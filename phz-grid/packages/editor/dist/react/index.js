/**
 * @phozart/phz-editor/react — React wrappers for editor Web Components
 *
 * Provides React components that wrap the Lit-based editor components,
 * bridging properties and events. Uses @lit/react createComponent for
 * automatic property bridging where Lit is available, with a plain
 * createElement fallback for SSR/Node environments.
 */
import { createElement, useRef, useCallback } from 'react';
export function PhzEditorShell(props) {
    const ref = useRef(null);
    const handleScreenChange = useCallback((e) => {
        props.onScreenChange?.(e.detail);
    }, [props.onScreenChange]);
    const handleEditModeChange = useCallback((e) => {
        props.onEditModeChange?.(e.detail);
    }, [props.onEditModeChange]);
    return createElement('phz-editor-shell', {
        ref,
        theme: props.theme,
        locale: props.locale,
        'onscreen-change': handleScreenChange,
        'onedit-mode-change': handleEditModeChange,
    }, props.children);
}
export function PhzEditorCatalog(props) {
    const handleSelect = useCallback((e) => {
        props.onArtifactSelect?.(e.detail);
    }, [props.onArtifactSelect]);
    const handleCreate = useCallback((e) => {
        props.onCreateArtifact?.(e.detail);
    }, [props.onCreateArtifact]);
    return createElement('phz-editor-catalog', {
        items: props.items,
        'onartifact-select': handleSelect,
        'oncreate-artifact': handleCreate,
    }, props.children);
}
export function PhzEditorDashboard(props) {
    const handleSelect = useCallback((e) => {
        props.onWidgetSelect?.(e.detail);
    }, [props.onWidgetSelect]);
    return createElement('phz-editor-dashboard', {
        dashboardId: props.dashboardId,
        editMode: props.editMode,
        widgets: props.widgets,
        columns: props.columns,
        rows: props.rows,
        gap: props.gap,
        'onwidget-select': handleSelect,
    }, props.children);
}
export function PhzEditorReport(props) {
    const handlePreview = useCallback((e) => {
        props.onPreviewToggle?.(e.detail);
    }, [props.onPreviewToggle]);
    return createElement('phz-editor-report', {
        reportId: props.reportId,
        editMode: props.editMode,
        'onpreview-toggle': handlePreview,
    }, props.children);
}
export function PhzEditorExplorer(props) {
    const handleSave = useCallback((e) => {
        props.onSaveRequest?.(e.detail);
    }, [props.onSaveRequest]);
    return createElement('phz-editor-explorer', {
        dataSourceId: props.dataSourceId,
        fields: props.fields,
        'onsave-request': handleSave,
    }, props.children);
}
export function PhzMeasurePalette(props) {
    const handleSelect = useCallback((e) => {
        props.onItemSelect?.(e.detail);
    }, [props.onItemSelect]);
    return createElement('phz-measure-palette', {
        measures: props.measures,
        kpis: props.kpis,
        'onitem-select': handleSelect,
    }, props.children);
}
export function PhzConfigPanel(props) {
    const handleChange = useCallback((e) => {
        props.onConfigChange?.(e.detail);
    }, [props.onConfigChange]);
    const handleApply = useCallback((e) => {
        props.onConfigApply?.(e.detail);
    }, [props.onConfigApply]);
    return createElement('phz-editor-config-panel', {
        widgetType: props.widgetType,
        widgetId: props.widgetId,
        allowedFields: props.allowedFields,
        'onconfig-change': handleChange,
        'onconfig-apply': handleApply,
    }, props.children);
}
export function PhzSharingFlow(props) {
    const handleSave = useCallback((e) => {
        props.onShareSave?.(e.detail);
    }, [props.onShareSave]);
    return createElement('phz-sharing-flow', {
        artifactId: props.artifactId,
        visibility: props.visibility,
        canPublish: props.canPublish,
        'onshare-save': handleSave,
    }, props.children);
}
export function PhzAlertSubscription(props) {
    const handleAlertToggle = useCallback((e) => {
        props.onAlertToggle?.(e.detail);
    }, [props.onAlertToggle]);
    const handleSubToggle = useCallback((e) => {
        props.onSubscriptionToggle?.(e.detail);
    }, [props.onSubscriptionToggle]);
    return createElement('phz-alert-subscription', {
        alerts: props.alerts,
        subscriptions: props.subscriptions,
        'onalert-toggle': handleAlertToggle,
        'onsubscription-toggle': handleSubToggle,
    }, props.children);
}
//# sourceMappingURL=index.js.map