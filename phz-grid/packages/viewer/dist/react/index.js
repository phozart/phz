/**
 * @phozart/viewer/react — React Wrappers for Viewer Components
 *
 * Thin React wrappers using @lit/react createComponent() for
 * automatic property bridging from Lit custom elements.
 */
'use client';
import React from 'react';
import { createComponent } from '@lit/react';
import { PhzViewerShell } from '../components/phz-viewer-shell.js';
import { PhzViewerCatalog } from '../components/phz-viewer-catalog.js';
import { PhzViewerDashboard } from '../components/phz-viewer-dashboard.js';
import { PhzViewerReport } from '../components/phz-viewer-report.js';
import { PhzViewerExplorer } from '../components/phz-viewer-explorer.js';
import { PhzAttentionDropdown } from '../components/phz-attention-dropdown.js';
import { PhzFilterBar } from '../components/phz-filter-bar.js';
import { PhzViewerError } from '../components/phz-viewer-error.js';
import { PhzViewerEmpty } from '../components/phz-viewer-empty.js';
// ========================================================================
// ViewerShell wrapper
// ========================================================================
export const ViewerShellReact = createComponent({
    tagName: 'phz-viewer-shell',
    elementClass: PhzViewerShell,
    react: React,
    events: {
        onViewerNavigate: 'viewer-navigate',
        onAttentionToggle: 'attention-toggle',
    },
});
// ========================================================================
// ViewerCatalog wrapper
// ========================================================================
export const ViewerCatalogReact = createComponent({
    tagName: 'phz-viewer-catalog',
    elementClass: PhzViewerCatalog,
    react: React,
    events: {
        onCatalogSelect: 'catalog-select',
    },
});
// ========================================================================
// ViewerDashboard wrapper
// ========================================================================
export const ViewerDashboardReact = createComponent({
    tagName: 'phz-viewer-dashboard',
    elementClass: PhzViewerDashboard,
    react: React,
    events: {
        onDashboardRefresh: 'dashboard-refresh',
    },
});
// ========================================================================
// ViewerReport wrapper
// ========================================================================
export const ViewerReportReact = createComponent({
    tagName: 'phz-viewer-report',
    elementClass: PhzViewerReport,
    react: React,
    events: {
        onReportExport: 'report-export',
        onReportPage: 'report-page',
        onReportSearch: 'report-search',
    },
});
// ========================================================================
// ViewerExplorer wrapper
// ========================================================================
export const ViewerExplorerReact = createComponent({
    tagName: 'phz-viewer-explorer',
    elementClass: PhzViewerExplorer,
    react: React,
    events: {
        onExplorerSourceSelect: 'explorer-source-select',
        onExplorerFieldAdd: 'explorer-field-add',
    },
});
// ========================================================================
// AttentionDropdown wrapper
// ========================================================================
export const AttentionDropdownReact = createComponent({
    tagName: 'phz-attention-dropdown',
    elementClass: PhzAttentionDropdown,
    react: React,
    events: {
        onAttentionItemClick: 'attention-item-click',
        onAttentionDismiss: 'attention-dismiss',
        onAttentionMarkAllRead: 'attention-mark-all-read',
    },
});
// ========================================================================
// FilterBar wrapper
// ========================================================================
export const FilterBarReact = createComponent({
    tagName: 'phz-filter-bar',
    elementClass: PhzFilterBar,
    react: React,
    events: {
        onFilterChange: 'filter-change',
        onFilterClear: 'filter-clear',
        onFilterClearAll: 'filter-clear-all',
        onFilterOpen: 'filter-open',
    },
});
// ========================================================================
// ViewerError wrapper
// ========================================================================
export const ViewerErrorReact = createComponent({
    tagName: 'phz-viewer-error',
    elementClass: PhzViewerError,
    react: React,
    events: {
        onErrorAction: 'error-action',
    },
});
// ========================================================================
// ViewerEmpty wrapper
// ========================================================================
export const ViewerEmptyReact = createComponent({
    tagName: 'phz-viewer-empty',
    elementClass: PhzViewerEmpty,
    react: React,
    events: {
        onEmptyAction: 'empty-action',
    },
});
//# sourceMappingURL=index.js.map