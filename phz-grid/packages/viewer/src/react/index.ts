/**
 * @phozart/viewer/react — React Wrappers for Viewer Components
 *
 * Thin React wrappers using @lit/react createComponent() for
 * automatic property bridging from Lit custom elements.
 */
'use client';

import React, { createElement, type ReactNode } from 'react';
import { createComponent, type EventName } from '@lit/react';

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

import type {
  ViewerContext,
  AttentionItem,
  DataSourceMeta,
  FieldMetadata,
  ExportFormat,
} from '@phozart/shared/adapters';
import type { DataExplorer } from '@phozart/engine/explorer';
import type { DashboardFilterDef, FilterValue } from '@phozart/shared/coordination';
import type { FilterPresetValue, ErrorState, EmptyScenario, ErrorScenario, ErrorStateConfig, EmptyStateConfig } from '@phozart/shared/types';
import type { VisibilityMeta } from '@phozart/shared/artifacts';
import type { DashboardWidgetView, ReportColumnView } from '../index.js';

// ========================================================================
// ViewerShell wrapper
// ========================================================================

export const ViewerShellReact = createComponent({
  tagName: 'phz-viewer-shell',
  elementClass: PhzViewerShell,
  react: React,
  events: {
    onViewerNavigate: 'viewer-navigate' as EventName<CustomEvent<ViewerNavigateEventDetail>>,
    onAttentionToggle: 'attention-toggle' as EventName<CustomEvent>,
  },
});

export interface ViewerShellProps {
  config?: ViewerShellConfig;
  viewerContext?: ViewerContext;
  theme?: string;
  mobile?: boolean;
  onViewerNavigate?: (e: CustomEvent<ViewerNavigateEventDetail>) => void;
  onAttentionToggle?: (e: CustomEvent) => void;
  children?: ReactNode;
}

// ========================================================================
// ViewerCatalog wrapper
// ========================================================================

export const ViewerCatalogReact = createComponent({
  tagName: 'phz-viewer-catalog',
  elementClass: PhzViewerCatalog,
  react: React,
  events: {
    onCatalogSelect: 'catalog-select' as EventName<CustomEvent<CatalogSelectEventDetail>>,
  },
});

export interface ViewerCatalogProps {
  artifacts?: VisibilityMeta[];
  pageSize?: number;
  onCatalogSelect?: (e: CustomEvent<CatalogSelectEventDetail>) => void;
  children?: ReactNode;
}

// ========================================================================
// ViewerDashboard wrapper
// ========================================================================

export const ViewerDashboardReact = createComponent({
  tagName: 'phz-viewer-dashboard',
  elementClass: PhzViewerDashboard,
  react: React,
  events: {
    onDashboardRefresh: 'dashboard-refresh' as EventName<CustomEvent>,
  },
});

export interface ViewerDashboardProps {
  dashboardId?: string;
  dashboardTitle?: string;
  dashboardDescription?: string;
  widgets?: DashboardWidgetView[];
  onDashboardRefresh?: (e: CustomEvent) => void;
  children?: ReactNode;
}

// ========================================================================
// ViewerReport wrapper
// ========================================================================

export const ViewerReportReact = createComponent({
  tagName: 'phz-viewer-report',
  elementClass: PhzViewerReport,
  react: React,
  events: {
    onReportExport: 'report-export' as EventName<CustomEvent<ReportExportEventDetail>>,
    onReportPage: 'report-page' as EventName<CustomEvent<ReportPageEventDetail>>,
    onReportSearch: 'report-search' as EventName<CustomEvent<{ query: string }>>,
  },
});

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
  onReportSearch?: (e: CustomEvent<{ query: string }>) => void;
  children?: ReactNode;
}

// ========================================================================
// ViewerExplorer wrapper
// ========================================================================

export const ViewerExplorerReact = createComponent({
  tagName: 'phz-viewer-explorer',
  elementClass: PhzViewerExplorer,
  react: React,
  events: {
    onExplorerSourceSelect: 'explorer-source-select' as EventName<CustomEvent<{ sourceId: string }>>,
    onExplorerFieldAdd: 'explorer-field-add' as EventName<CustomEvent<{ field: string; dataType: string }>>,
  },
});

export interface ViewerExplorerProps {
  dataSources?: DataSourceMeta[];
  explorer?: DataExplorer;
  onExplorerSourceSelect?: (e: CustomEvent<{ sourceId: string }>) => void;
  onExplorerFieldAdd?: (e: CustomEvent<{ field: string; dataType: string }>) => void;
  children?: ReactNode;
}

// ========================================================================
// AttentionDropdown wrapper
// ========================================================================

export const AttentionDropdownReact = createComponent({
  tagName: 'phz-attention-dropdown',
  elementClass: PhzAttentionDropdown,
  react: React,
  events: {
    onAttentionItemClick: 'attention-item-click' as EventName<CustomEvent<{ item: AttentionItem }>>,
    onAttentionDismiss: 'attention-dismiss' as EventName<CustomEvent<{ itemId: string }>>,
    onAttentionMarkAllRead: 'attention-mark-all-read' as EventName<CustomEvent>,
  },
});

export interface AttentionDropdownProps {
  open?: boolean;
  items?: AttentionItem[];
  onAttentionItemClick?: (e: CustomEvent<{ item: AttentionItem }>) => void;
  onAttentionDismiss?: (e: CustomEvent<{ itemId: string }>) => void;
  onAttentionMarkAllRead?: (e: CustomEvent) => void;
}

// ========================================================================
// FilterBar wrapper
// ========================================================================

export const FilterBarReact = createComponent({
  tagName: 'phz-filter-bar',
  elementClass: PhzFilterBar,
  react: React,
  events: {
    onFilterChange: 'filter-change' as EventName<CustomEvent<{ filterValue: FilterValue }>>,
    onFilterClear: 'filter-clear' as EventName<CustomEvent<{ filterId: string }>>,
    onFilterClearAll: 'filter-clear-all' as EventName<CustomEvent>,
    onFilterOpen: 'filter-open' as EventName<CustomEvent<{ filterId: string }>>,
  },
});

export interface FilterBarProps {
  filters?: DashboardFilterDef[];
  presets?: FilterPresetValue[];
  collapsed?: boolean;
  onFilterChange?: (e: CustomEvent<{ filterValue: FilterValue }>) => void;
  onFilterClear?: (e: CustomEvent<{ filterId: string }>) => void;
  onFilterClearAll?: (e: CustomEvent) => void;
  onFilterOpen?: (e: CustomEvent<{ filterId: string }>) => void;
}

// ========================================================================
// ViewerError wrapper
// ========================================================================

export const ViewerErrorReact = createComponent({
  tagName: 'phz-viewer-error',
  elementClass: PhzViewerError,
  react: React,
  events: {
    onErrorAction: 'error-action' as EventName<CustomEvent<{ actionId: string; error?: ErrorState }>>,
  },
});

export interface ViewerErrorProps {
  error?: ErrorState;
  scenario?: ErrorScenario;
  config?: ErrorStateConfig;
  onErrorAction?: (e: CustomEvent<{ actionId: string; error?: ErrorState }>) => void;
}

// ========================================================================
// ViewerEmpty wrapper
// ========================================================================

export const ViewerEmptyReact = createComponent({
  tagName: 'phz-viewer-empty',
  elementClass: PhzViewerEmpty,
  react: React,
  events: {
    onEmptyAction: 'empty-action' as EventName<CustomEvent<{ actionId: string; scenario: EmptyScenario }>>,
  },
});

export interface ViewerEmptyProps {
  scenario?: EmptyScenario;
  config?: EmptyStateConfig;
  onEmptyAction?: (e: CustomEvent<{ actionId: string; scenario: EmptyScenario }>) => void;
}
