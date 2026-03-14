/**
 * @phozart/engine-admin — Dashboard Studio
 *
 * MicroStrategy-inspired integrated dashboard editor.
 * Single view: toolbar + global filters + left data panel + live canvas + right config panel.
 * Uses EnhancedWidgetConfig for rich per-widget configuration.
 */
import { LitElement } from 'lit';
import type { BIEngine, DashboardConfig, EnhancedDashboardConfig } from '@phozart/engine';
import './phz-widget-config-panel.js';
import './phz-global-filter-bar.js';
import './phz-data-model-sidebar.js';
import './phz-data-model-modal.js';
export declare class PhzDashboardStudio extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    data?: Record<string, unknown>[];
    dashboardId?: string;
    private dashboardName;
    private dashboardDescription;
    private layoutColumns;
    private widgets;
    private enhancedWidgets;
    private placements;
    private selectedWidgetId?;
    private globalFilters;
    private globalFilterValues;
    private showKpiForm;
    private showMetricForm;
    private newKpiName;
    private newKpiField;
    private newKpiTarget;
    private newMetricName;
    private newMetricField;
    private newMetricAgg;
    private dataModelStore?;
    private modalType?;
    private modalEditId?;
    private resolvedWidgets?;
    private dragOverWidgetId?;
    private _ctxMenu?;
    private nextId;
    private scoreProvider;
    /** Load an existing dashboard config into the studio */
    loadConfig(config: DashboardConfig | EnhancedDashboardConfig): void;
    willUpdate(changed: Map<string, unknown>): void;
    private _initDataModel;
    private handleSidebarAction;
    private handleModalClose;
    private handleParameterSave;
    private handleCalcFieldSave;
    private handleMetricFormSave;
    private handleKpiFormSave;
    private resolveAllWidgets;
    private applyGlobalFilters;
    private addWidget;
    private removeWidget;
    private updateWidgetColSpan;
    private handleWidgetConfigChange;
    /** Bridge enhanced config data bindings to legacy WidgetConfig for the resolver */
    private bridgeEnhancedToLegacy;
    /** Convert enhanced config to legacy WidgetPlacement for backward compat */
    private enhancedToLegacy;
    private handleDragStart;
    private handleDragOver;
    private handleDragLeave;
    private handleDrop;
    private handleResizeStart;
    private getNumericFields;
    private getStringFields;
    private getAllFields;
    private getKPIList;
    private getReportList;
    private handlePublish;
    private handleCreateKpi;
    private handleCreateMetric;
    private handleGlobalFilterChange;
    private _openSidebarContextMenu;
    private _openWidgetContextMenu;
    private _closeContextMenu;
    private _handleCtxAction;
    private _copyReference;
    private _cloneEntity;
    private _deleteEntity;
    private _duplicateWidget;
    private _renderContextMenu;
    private renderCanvasWidget;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-dashboard-studio': PhzDashboardStudio;
    }
}
//# sourceMappingURL=phz-dashboard-studio.d.ts.map