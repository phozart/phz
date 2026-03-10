/**
 * @phozart/phz-editor/react — React wrappers for editor Web Components
 *
 * Provides React components that wrap the Lit-based editor components,
 * bridging properties and events. Uses @lit/react createComponent for
 * automatic property bridging where Lit is available, with a plain
 * createElement fallback for SSR/Node environments.
 */
import React, { type ReactNode } from 'react';
import type { EditorScreen } from '../editor-state.js';
import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';
import type { CatalogItem } from '../screens/catalog-state.js';
import type { DashboardWidget } from '@phozart/phz-shared/types';
import type { MeasureDefinition, KPIDefinition } from '@phozart/phz-shared/adapters';
import type { PersonalAlert } from '@phozart/phz-shared/types';
import type { Subscription } from '@phozart/phz-shared/types';
import type { FieldConstraint } from '../authoring/config-panel-state.js';
export interface PhzEditorShellProps {
    theme?: string;
    locale?: string;
    onScreenChange?: (detail: {
        screen: EditorScreen;
        artifactId: string | null;
    }) => void;
    onEditModeChange?: (detail: {
        editMode: boolean;
    }) => void;
    children?: ReactNode;
}
export declare function PhzEditorShell(props: PhzEditorShellProps): React.ReactElement<{
    ref: React.RefObject<HTMLElement | null>;
    theme: string | undefined;
    locale: string | undefined;
    'onscreen-change': (e: Event) => void;
    'onedit-mode-change': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzEditorCatalogProps {
    items?: CatalogItem[];
    onArtifactSelect?: (detail: {
        id: string;
        type: string;
    }) => void;
    onCreateArtifact?: (detail: {
        type: string;
    }) => void;
    children?: ReactNode;
}
export declare function PhzEditorCatalog(props: PhzEditorCatalogProps): React.ReactElement<{
    items: CatalogItem[] | undefined;
    'onartifact-select': (e: Event) => void;
    'oncreate-artifact': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzEditorDashboardProps {
    dashboardId?: string;
    editMode?: boolean;
    widgets?: DashboardWidget[];
    columns?: number;
    rows?: number;
    gap?: number;
    onWidgetSelect?: (detail: {
        widgetId: string;
    }) => void;
    children?: ReactNode;
}
export declare function PhzEditorDashboard(props: PhzEditorDashboardProps): React.ReactElement<{
    dashboardId: string | undefined;
    editMode: boolean | undefined;
    widgets: DashboardWidget[] | undefined;
    columns: number | undefined;
    rows: number | undefined;
    gap: number | undefined;
    'onwidget-select': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzEditorReportProps {
    reportId?: string;
    editMode?: boolean;
    onPreviewToggle?: (detail: {
        previewMode: boolean;
    }) => void;
    children?: ReactNode;
}
export declare function PhzEditorReport(props: PhzEditorReportProps): React.ReactElement<{
    reportId: string | undefined;
    editMode: boolean | undefined;
    'onpreview-toggle': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzEditorExplorerProps {
    dataSourceId?: string;
    fields?: string[];
    onSaveRequest?: (detail: {
        type: string;
        query: unknown;
    }) => void;
    children?: ReactNode;
}
export declare function PhzEditorExplorer(props: PhzEditorExplorerProps): React.ReactElement<{
    dataSourceId: string | undefined;
    fields: string[] | undefined;
    'onsave-request': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzMeasurePaletteProps {
    measures?: MeasureDefinition[];
    kpis?: KPIDefinition[];
    onItemSelect?: (detail: {
        id: string;
        type: 'measure' | 'kpi';
    }) => void;
    children?: ReactNode;
}
export declare function PhzMeasurePalette(props: PhzMeasurePaletteProps): React.ReactElement<{
    measures: MeasureDefinition[] | undefined;
    kpis: KPIDefinition[] | undefined;
    'onitem-select': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzConfigPanelProps {
    widgetType?: string;
    widgetId?: string;
    allowedFields?: FieldConstraint[];
    onConfigChange?: (detail: {
        field: string;
        value: unknown;
        config: Record<string, unknown>;
    }) => void;
    onConfigApply?: (detail: {
        config: Record<string, unknown>;
    }) => void;
    children?: ReactNode;
}
export declare function PhzConfigPanel(props: PhzConfigPanelProps): React.ReactElement<{
    widgetType: string | undefined;
    widgetId: string | undefined;
    allowedFields: FieldConstraint[] | undefined;
    'onconfig-change': (e: Event) => void;
    'onconfig-apply': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzSharingFlowProps {
    artifactId?: string;
    visibility?: ArtifactVisibility;
    canPublish?: boolean;
    onShareSave?: (detail: {
        visibility: ArtifactVisibility;
        shareTargets: unknown[];
    }) => void;
    children?: ReactNode;
}
export declare function PhzSharingFlow(props: PhzSharingFlowProps): React.ReactElement<{
    artifactId: string | undefined;
    visibility: ArtifactVisibility | undefined;
    canPublish: boolean | undefined;
    'onshare-save': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
export interface PhzAlertSubscriptionProps {
    alerts?: PersonalAlert[];
    subscriptions?: Subscription[];
    onAlertToggle?: (detail: {
        alertId: string;
    }) => void;
    onSubscriptionToggle?: (detail: {
        subscriptionId: string;
    }) => void;
    children?: ReactNode;
}
export declare function PhzAlertSubscription(props: PhzAlertSubscriptionProps): React.ReactElement<{
    alerts: PersonalAlert[] | undefined;
    subscriptions: Subscription[] | undefined;
    'onalert-toggle': (e: Event) => void;
    'onsubscription-toggle': (e: Event) => void;
}, string | React.JSXElementConstructor<any>>;
//# sourceMappingURL=index.d.ts.map