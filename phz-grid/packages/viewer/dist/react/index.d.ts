import { type ReactNode } from 'react';
import { type EventName } from '@lit/react';
import { PhzViewerShell } from '../components/phz-viewer-shell.js';
import { PhzViewerCatalog } from '../components/phz-viewer-catalog.js';
import { PhzViewerDashboard } from '../components/phz-viewer-dashboard.js';
import { PhzViewerReport } from '../components/phz-viewer-report.js';
import { PhzViewerExplorer } from '../components/phz-viewer-explorer.js';
import { PhzAttentionDropdown } from '../components/phz-attention-dropdown.js';
import { PhzFilterBar } from '../components/phz-filter-bar.js';
import { PhzViewerError } from '../components/phz-viewer-error.js';
import { PhzViewerEmpty } from '../components/phz-viewer-empty.js';
import type { ViewerShellConfig } from '../viewer-config.js';
import type { ViewerNavigateEventDetail } from '../components/phz-viewer-shell.js';
import type { CatalogSelectEventDetail } from '../components/phz-viewer-catalog.js';
import type { ReportExportEventDetail, ReportPageEventDetail } from '../components/phz-viewer-report.js';
import type { ViewerContext, AttentionItem, DataSourceMeta, ExportFormat } from '@phozart/phz-shared/adapters';
import type { DataExplorer } from '@phozart/phz-engine/explorer';
import type { DashboardFilterDef, FilterValue } from '@phozart/phz-shared/coordination';
import type { FilterPresetValue, ErrorState, EmptyScenario, ErrorScenario, ErrorStateConfig, EmptyStateConfig } from '@phozart/phz-shared/types';
import type { VisibilityMeta } from '@phozart/phz-shared/artifacts';
import type { DashboardWidgetView, ReportColumnView } from '../index.js';
export declare const ViewerShellReact: import("@lit/react").ReactWebComponent<PhzViewerShell, {
    onViewerNavigate: EventName<CustomEvent<ViewerNavigateEventDetail>>;
    onAttentionToggle: EventName<CustomEvent>;
}>;
export interface ViewerShellProps {
    config?: ViewerShellConfig;
    viewerContext?: ViewerContext;
    theme?: string;
    mobile?: boolean;
    onViewerNavigate?: (e: CustomEvent<ViewerNavigateEventDetail>) => void;
    onAttentionToggle?: (e: CustomEvent) => void;
    children?: ReactNode;
}
export declare const ViewerCatalogReact: import("@lit/react").ReactWebComponent<PhzViewerCatalog, {
    onCatalogSelect: EventName<CustomEvent<CatalogSelectEventDetail>>;
}>;
export interface ViewerCatalogProps {
    artifacts?: VisibilityMeta[];
    pageSize?: number;
    onCatalogSelect?: (e: CustomEvent<CatalogSelectEventDetail>) => void;
    children?: ReactNode;
}
export declare const ViewerDashboardReact: import("@lit/react").ReactWebComponent<PhzViewerDashboard, {
    onDashboardRefresh: EventName<CustomEvent>;
}>;
export interface ViewerDashboardProps {
    dashboardId?: string;
    dashboardTitle?: string;
    dashboardDescription?: string;
    widgets?: DashboardWidgetView[];
    onDashboardRefresh?: (e: CustomEvent) => void;
    children?: ReactNode;
}
export declare const ViewerReportReact: import("@lit/react").ReactWebComponent<PhzViewerReport, {
    onReportExport: EventName<CustomEvent<ReportExportEventDetail>>;
    onReportPage: EventName<CustomEvent<ReportPageEventDetail>>;
    onReportSearch: EventName<CustomEvent<{
        query: string;
    }>>;
}>;
export interface ViewerReportProps {
    reportId?: string;
    reportTitle?: string;
    reportDescription?: string;
    columns?: ReportColumnView[];
    rows?: unknown[][];
    totalRows?: number;
    exportFormats?: ExportFormat[];
    onReportExport?: (e: CustomEvent<ReportExportEventDetail>) => void;
    onReportPage?: (e: CustomEvent<ReportPageEventDetail>) => void;
    onReportSearch?: (e: CustomEvent<{
        query: string;
    }>) => void;
    children?: ReactNode;
}
export declare const ViewerExplorerReact: import("@lit/react").ReactWebComponent<PhzViewerExplorer, {
    onExplorerSourceSelect: EventName<CustomEvent<{
        sourceId: string;
    }>>;
    onExplorerFieldAdd: EventName<CustomEvent<{
        field: string;
        dataType: string;
    }>>;
}>;
export interface ViewerExplorerProps {
    dataSources?: DataSourceMeta[];
    explorer?: DataExplorer;
    onExplorerSourceSelect?: (e: CustomEvent<{
        sourceId: string;
    }>) => void;
    onExplorerFieldAdd?: (e: CustomEvent<{
        field: string;
        dataType: string;
    }>) => void;
    children?: ReactNode;
}
export declare const AttentionDropdownReact: import("@lit/react").ReactWebComponent<PhzAttentionDropdown, {
    onAttentionItemClick: EventName<CustomEvent<{
        item: AttentionItem;
    }>>;
    onAttentionDismiss: EventName<CustomEvent<{
        itemId: string;
    }>>;
    onAttentionMarkAllRead: EventName<CustomEvent>;
}>;
export interface AttentionDropdownProps {
    open?: boolean;
    items?: AttentionItem[];
    onAttentionItemClick?: (e: CustomEvent<{
        item: AttentionItem;
    }>) => void;
    onAttentionDismiss?: (e: CustomEvent<{
        itemId: string;
    }>) => void;
    onAttentionMarkAllRead?: (e: CustomEvent) => void;
}
export declare const FilterBarReact: import("@lit/react").ReactWebComponent<PhzFilterBar, {
    onFilterChange: EventName<CustomEvent<{
        filterValue: FilterValue;
    }>>;
    onFilterClear: EventName<CustomEvent<{
        filterId: string;
    }>>;
    onFilterClearAll: EventName<CustomEvent>;
    onFilterOpen: EventName<CustomEvent<{
        filterId: string;
    }>>;
}>;
export interface FilterBarProps {
    filters?: DashboardFilterDef[];
    presets?: FilterPresetValue[];
    collapsed?: boolean;
    onFilterChange?: (e: CustomEvent<{
        filterValue: FilterValue;
    }>) => void;
    onFilterClear?: (e: CustomEvent<{
        filterId: string;
    }>) => void;
    onFilterClearAll?: (e: CustomEvent) => void;
    onFilterOpen?: (e: CustomEvent<{
        filterId: string;
    }>) => void;
}
export declare const ViewerErrorReact: import("@lit/react").ReactWebComponent<PhzViewerError, {
    onErrorAction: EventName<CustomEvent<{
        actionId: string;
        error?: ErrorState;
    }>>;
}>;
export interface ViewerErrorProps {
    error?: ErrorState;
    scenario?: ErrorScenario;
    config?: ErrorStateConfig;
    onErrorAction?: (e: CustomEvent<{
        actionId: string;
        error?: ErrorState;
    }>) => void;
}
export declare const ViewerEmptyReact: import("@lit/react").ReactWebComponent<PhzViewerEmpty, {
    onEmptyAction: EventName<CustomEvent<{
        actionId: string;
        scenario: EmptyScenario;
    }>>;
}>;
export interface ViewerEmptyProps {
    scenario?: EmptyScenario;
    config?: EmptyStateConfig;
    onEmptyAction?: (e: CustomEvent<{
        actionId: string;
        scenario: EmptyScenario;
    }>) => void;
}
//# sourceMappingURL=index.d.ts.map