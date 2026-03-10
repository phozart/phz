/**
 * @phozart/phz-editor/react — React wrappers for editor Web Components
 *
 * Provides React components that wrap the Lit-based editor components,
 * bridging properties and events. Uses @lit/react createComponent for
 * automatic property bridging where Lit is available, with a plain
 * createElement fallback for SSR/Node environments.
 */

import React, { createElement, useRef, useCallback, type ReactNode } from 'react';
import type { EditorScreen } from '../editor-state.js';
import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';
import type { CatalogItem } from '../screens/catalog-state.js';
import type { DashboardWidget } from '@phozart/phz-shared/types';
import type { MeasureDefinition, KPIDefinition } from '@phozart/phz-shared/adapters';
import type { PersonalAlert } from '@phozart/phz-shared/types';
import type { Subscription } from '@phozart/phz-shared/types';
import type { FieldConstraint } from '../authoring/config-panel-state.js';

// ========================================================================
// PhzEditorShell
// ========================================================================

export interface PhzEditorShellProps {
  theme?: string;
  locale?: string;
  onScreenChange?: (detail: { screen: EditorScreen; artifactId: string | null }) => void;
  onEditModeChange?: (detail: { editMode: boolean }) => void;
  children?: ReactNode;
}

export function PhzEditorShell(props: PhzEditorShellProps) {
  const ref = useRef<HTMLElement>(null);

  const handleScreenChange = useCallback((e: Event) => {
    props.onScreenChange?.((e as CustomEvent).detail);
  }, [props.onScreenChange]);

  const handleEditModeChange = useCallback((e: Event) => {
    props.onEditModeChange?.((e as CustomEvent).detail);
  }, [props.onEditModeChange]);

  return createElement('phz-editor-shell', {
    ref,
    theme: props.theme,
    locale: props.locale,
    'onscreen-change': handleScreenChange,
    'onedit-mode-change': handleEditModeChange,
  }, props.children);
}

// ========================================================================
// PhzEditorCatalog
// ========================================================================

export interface PhzEditorCatalogProps {
  items?: CatalogItem[];
  onArtifactSelect?: (detail: { id: string; type: string }) => void;
  onCreateArtifact?: (detail: { type: string }) => void;
  children?: ReactNode;
}

export function PhzEditorCatalog(props: PhzEditorCatalogProps) {
  const handleSelect = useCallback((e: Event) => {
    props.onArtifactSelect?.((e as CustomEvent).detail);
  }, [props.onArtifactSelect]);

  const handleCreate = useCallback((e: Event) => {
    props.onCreateArtifact?.((e as CustomEvent).detail);
  }, [props.onCreateArtifact]);

  return createElement('phz-editor-catalog', {
    items: props.items,
    'onartifact-select': handleSelect,
    'oncreate-artifact': handleCreate,
  }, props.children);
}

// ========================================================================
// PhzEditorDashboard
// ========================================================================

export interface PhzEditorDashboardProps {
  dashboardId?: string;
  editMode?: boolean;
  widgets?: DashboardWidget[];
  columns?: number;
  rows?: number;
  gap?: number;
  onWidgetSelect?: (detail: { widgetId: string }) => void;
  children?: ReactNode;
}

export function PhzEditorDashboard(props: PhzEditorDashboardProps) {
  const handleSelect = useCallback((e: Event) => {
    props.onWidgetSelect?.((e as CustomEvent).detail);
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

// ========================================================================
// PhzEditorReport
// ========================================================================

export interface PhzEditorReportProps {
  reportId?: string;
  editMode?: boolean;
  onPreviewToggle?: (detail: { previewMode: boolean }) => void;
  children?: ReactNode;
}

export function PhzEditorReport(props: PhzEditorReportProps) {
  const handlePreview = useCallback((e: Event) => {
    props.onPreviewToggle?.((e as CustomEvent).detail);
  }, [props.onPreviewToggle]);

  return createElement('phz-editor-report', {
    reportId: props.reportId,
    editMode: props.editMode,
    'onpreview-toggle': handlePreview,
  }, props.children);
}

// ========================================================================
// PhzEditorExplorer
// ========================================================================

export interface PhzEditorExplorerProps {
  dataSourceId?: string;
  fields?: string[];
  onSaveRequest?: (detail: { type: string; query: unknown }) => void;
  children?: ReactNode;
}

export function PhzEditorExplorer(props: PhzEditorExplorerProps) {
  const handleSave = useCallback((e: Event) => {
    props.onSaveRequest?.((e as CustomEvent).detail);
  }, [props.onSaveRequest]);

  return createElement('phz-editor-explorer', {
    dataSourceId: props.dataSourceId,
    fields: props.fields,
    'onsave-request': handleSave,
  }, props.children);
}

// ========================================================================
// PhzMeasurePalette
// ========================================================================

export interface PhzMeasurePaletteProps {
  measures?: MeasureDefinition[];
  kpis?: KPIDefinition[];
  onItemSelect?: (detail: { id: string; type: 'measure' | 'kpi' }) => void;
  children?: ReactNode;
}

export function PhzMeasurePalette(props: PhzMeasurePaletteProps) {
  const handleSelect = useCallback((e: Event) => {
    props.onItemSelect?.((e as CustomEvent).detail);
  }, [props.onItemSelect]);

  return createElement('phz-measure-palette', {
    measures: props.measures,
    kpis: props.kpis,
    'onitem-select': handleSelect,
  }, props.children);
}

// ========================================================================
// PhzConfigPanel
// ========================================================================

export interface PhzConfigPanelProps {
  widgetType?: string;
  widgetId?: string;
  allowedFields?: FieldConstraint[];
  onConfigChange?: (detail: { field: string; value: unknown; config: Record<string, unknown> }) => void;
  onConfigApply?: (detail: { config: Record<string, unknown> }) => void;
  children?: ReactNode;
}

export function PhzConfigPanel(props: PhzConfigPanelProps) {
  const handleChange = useCallback((e: Event) => {
    props.onConfigChange?.((e as CustomEvent).detail);
  }, [props.onConfigChange]);

  const handleApply = useCallback((e: Event) => {
    props.onConfigApply?.((e as CustomEvent).detail);
  }, [props.onConfigApply]);

  return createElement('phz-editor-config-panel', {
    widgetType: props.widgetType,
    widgetId: props.widgetId,
    allowedFields: props.allowedFields,
    'onconfig-change': handleChange,
    'onconfig-apply': handleApply,
  }, props.children);
}

// ========================================================================
// PhzSharingFlow
// ========================================================================

export interface PhzSharingFlowProps {
  artifactId?: string;
  visibility?: ArtifactVisibility;
  canPublish?: boolean;
  onShareSave?: (detail: { visibility: ArtifactVisibility; shareTargets: unknown[] }) => void;
  children?: ReactNode;
}

export function PhzSharingFlow(props: PhzSharingFlowProps) {
  const handleSave = useCallback((e: Event) => {
    props.onShareSave?.((e as CustomEvent).detail);
  }, [props.onShareSave]);

  return createElement('phz-sharing-flow', {
    artifactId: props.artifactId,
    visibility: props.visibility,
    canPublish: props.canPublish,
    'onshare-save': handleSave,
  }, props.children);
}

// ========================================================================
// PhzAlertSubscription
// ========================================================================

export interface PhzAlertSubscriptionProps {
  alerts?: PersonalAlert[];
  subscriptions?: Subscription[];
  onAlertToggle?: (detail: { alertId: string }) => void;
  onSubscriptionToggle?: (detail: { subscriptionId: string }) => void;
  children?: ReactNode;
}

export function PhzAlertSubscription(props: PhzAlertSubscriptionProps) {
  const handleAlertToggle = useCallback((e: Event) => {
    props.onAlertToggle?.((e as CustomEvent).detail);
  }, [props.onAlertToggle]);

  const handleSubToggle = useCallback((e: Event) => {
    props.onSubscriptionToggle?.((e as CustomEvent).detail);
  }, [props.onSubscriptionToggle]);

  return createElement('phz-alert-subscription', {
    alerts: props.alerts,
    subscriptions: props.subscriptions,
    'onalert-toggle': handleAlertToggle,
    'onsubscription-toggle': handleSubToggle,
  }, props.children);
}
