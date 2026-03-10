/**
 * @phozart/phz-grid — <phz-report-view> Orchestrator
 *
 * Bundles criteria-bar + grid + admin panel into one cohesive view.
 * Handles data-source selection → column auto-population,
 * criteria binding → criteria-bar population, and auto-save on admin close.
 *
 * Events:
 *   report-save   → { reportId, reportName, settings }
 *   report-create  → { reportConfig }   (when creating a new report)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DEFAULT_TABLE_SETTINGS } from '@phozart/phz-engine';
import './phz-grid.js';
let PhzReportView = class PhzReportView extends LitElement {
    constructor() {
        super(...arguments);
        /** Report ID */
        this.reportId = '';
        /** Report name */
        this.reportName = '';
        /** Report description */
        this.reportDescription = '';
        /** Data to display in the grid */
        this.data = [];
        /** Column definitions for the grid */
        this.columns = [];
        /** Whether the current user is an admin */
        this.isAdmin = false;
        /** Grid title */
        this.gridTitle = '';
        /** Available data products for the data-source picker */
        this.dataProducts = [];
        /** Schema fields of the currently selected data product */
        this.schemaFields = [];
        /** Selected data product ID */
        this.selectedDataProductId = '';
        /** Available filter definitions for the criteria tab */
        this.criteriaDefinitions = [];
        /** Current criteria bindings */
        this.criteriaBindings = [];
        /** Current criteria selection state (field values). Two-way: pass in to restore, listen for changes. */
        this.selectionContext = {};
        /** Criteria presets (saved filter combinations). */
        this.criteriaPresets = [];
        /** Saved presentation settings (table settings, formatting, colors, etc.) loaded from DB. */
        this.presentation = {};
        /** Start with admin panel open (e.g., for new report creation) */
        this.adminOpen = false;
        /** Admin mode: 'create' or 'edit' */
        this.adminMode = 'edit';
        /** Report created timestamp */
        this.reportCreated = 0;
        /** Report updated timestamp */
        this.reportUpdated = 0;
        this._adminPanelOpen = false;
        /** Guard: true when presentation was updated from admin live-sync (skip re-hydrating admin). */
        this._presentationFromAdmin = false;
    }
    static { this.styles = css `
    :host {
      display: block;
      height: 100%;
      font-family: var(--phz-font-family-base, 'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif);
    }

    .report-view {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .report-view__main {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
      min-width: 0;
    }

    .report-view__criteria {
      flex-shrink: 0;
    }

    .report-view__grid {
      flex: 1;
      overflow: hidden;
    }
  `; }
    /** Merged table settings: defaults + presentation overrides. */
    get _ts() {
        return { ...DEFAULT_TABLE_SETTINGS, ...this.presentation?.tableSettings };
    }
    connectedCallback() {
        super.connectedCallback();
        this._adminPanelOpen = this.adminOpen;
    }
    updated(changed) {
        if (changed.has('adminOpen')) {
            this._adminPanelOpen = this.adminOpen;
        }
        if (changed.has('presentation')) {
            if (!this._presentationFromAdmin) {
                this._hydrateAdmin();
            }
            this._presentationFromAdmin = false;
        }
    }
    /** Push presentation settings into the admin panel via its setSettings() API. */
    _hydrateAdmin() {
        const admin = this.shadowRoot?.querySelector('phz-grid-admin');
        if (admin && this.presentation && Object.keys(this.presentation).length > 0) {
            admin.setSettings(this.presentation);
        }
    }
    /** Live-sync: admin changes a table setting → update presentation immediately so the grid reflects it. */
    _handleLiveTableSettings(e) {
        const { key, value } = e.detail;
        this._presentationFromAdmin = true;
        this.presentation = {
            ...this.presentation,
            tableSettings: { ...this.presentation?.tableSettings, [key]: value },
        };
    }
    /** Live-sync: admin changes column formatting → update presentation immediately. */
    _handleLiveColumnConfig(e) {
        const { field, type, formatting, numberFormat, statusColors: sc, barThresholds: bt, dateFormat, linkTemplate } = e.detail;
        this._presentationFromAdmin = true;
        const p = { ...this.presentation };
        if (type !== undefined)
            p.columnTypes = { ...p.columnTypes, [field]: type };
        if (formatting !== undefined)
            p.columnFormatting = { ...p.columnFormatting, [field]: formatting };
        if (numberFormat !== undefined)
            p.numberFormats = { ...p.numberFormats, [field]: numberFormat };
        if (sc !== undefined)
            p.statusColors = { ...sc };
        if (bt !== undefined)
            p.barThresholds = [...bt];
        if (dateFormat !== undefined)
            p.dateFormats = { ...p.dateFormats, [field]: dateFormat };
        if (linkTemplate !== undefined)
            p.linkTemplates = { ...p.linkTemplates, [field]: linkTemplate };
        this.presentation = p;
    }
    _toggleAdmin() {
        this._adminPanelOpen = !this._adminPanelOpen;
    }
    _closeAdmin() {
        this._adminPanelOpen = false;
    }
    _handleSave(e) {
        this.dispatchEvent(new CustomEvent('report-save', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleAutoSave(e) {
        this.dispatchEvent(new CustomEvent('report-save', {
            bubbles: true, composed: true,
            detail: { ...e.detail, autoSave: true },
        }));
    }
    _handleDataSourceChange(e) {
        this.dispatchEvent(new CustomEvent('data-source-change', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleCriteriaBindingChange(e) {
        this.dispatchEvent(new CustomEvent('criteria-binding-change', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleCriteriaChange(e) {
        this.selectionContext = { ...e.detail.context };
        this.dispatchEvent(new CustomEvent('criteria-change', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleCriteriaApply(e) {
        this.selectionContext = { ...e.detail.context };
        this.dispatchEvent(new CustomEvent('criteria-apply', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleCriteriaReset() {
        this.selectionContext = {};
        this.dispatchEvent(new CustomEvent('criteria-reset', {
            bubbles: true, composed: true,
        }));
    }
    _handleGridReady(e) {
        this.dispatchEvent(new CustomEvent('grid-ready', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleRowAction(e) {
        this.dispatchEvent(new CustomEvent('row-action', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleDrillThrough(e) {
        this.dispatchEvent(new CustomEvent('drill-through', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleGenerateDashboard(e) {
        this.dispatchEvent(new CustomEvent('generate-dashboard', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    _handleCopy(e) {
        this.dispatchEvent(new CustomEvent('copy', {
            bubbles: true, composed: true,
            detail: e.detail,
        }));
    }
    render() {
        const ts = this._ts;
        const p = this.presentation ?? {};
        return html `
      <div class="report-view">
        ${this.criteriaConfig ? html `
          <div class="report-view__criteria">
            <phz-selection-criteria
              .config=${this.criteriaConfig}
              .initialState=${this.selectionContext}
              .presets=${this.criteriaPresets}
              .data=${this.data}
              @criteria-change=${this._handleCriteriaChange}
              @criteria-apply=${this._handleCriteriaApply}
              @criteria-reset=${this._handleCriteriaReset}
            ></phz-selection-criteria>
          </div>
        ` : nothing}

        <div class="report-view__main">
          <div class="report-view__grid">
            <phz-grid
              .data=${this.data}
              .columns=${this.columns}
              grid-title=${ts.titleText || this.gridTitle || this.reportName}
              grid-subtitle=${ts.subtitleText}
              .showAdminSettings=${this.isAdmin}
              user-role=${this.isAdmin ? 'admin' : 'user'}
              .density=${ts.density}
              .scrollMode=${ts.scrollMode}
              .pageSize=${ts.pageSize}
              .rowBanding=${ts.rowBanding}
              .showToolbar=${ts.showToolbar}
              .showPagination=${ts.showPagination}
              .showDensityToggle=${ts.showDensityToggle}
              .showColumnEditor=${ts.showColumnEditor}
              .showCheckboxes=${ts.showCheckboxes}
              .showRowActions=${ts.showRowActions}
              .showSelectionActions=${ts.showSelectionActions}
              .showEditActions=${ts.showEditActions}
              .showCopyActions=${ts.showCopyActions}
              .autoSizeColumns=${ts.autoSizeColumns}
              .virtualization=${ts.virtualization}
              .virtualScrollThreshold=${ts.virtualScrollThreshold}
              .fetchPageSize=${ts.fetchPageSize}
              .prefetchPages=${ts.prefetchPages}
              .selectionMode=${ts.selectionMode}
              .editMode=${ts.editMode}
              .aggregation=${ts.showAggregation}
              .aggregationFn=${ts.aggregationFn}
              .aggregationPosition=${ts.aggregationPosition}
              .groupBy=${ts.groupByFields}
              .groupByLevels=${ts.groupByLevels}
              .groupTotals=${ts.groupTotals}
              .groupTotalsFn=${ts.groupTotalsFn}
              .groupTotalsOverrides=${ts.groupTotalsOverrides}
              .columnGroups=${ts.columnGroups}
              .gridLines=${ts.gridLines}
              .gridLineColor=${ts.gridLineColor}
              .gridLineWidth=${ts.gridLineWidth}
              .bandingColor=${ts.bandingColor}
              .hoverHighlight=${ts.hoverHighlight}
              .cellTextOverflow=${ts.cellTextOverflow}
              .compactNumbers=${ts.compactNumbers}
              .containerShadow=${ts.containerShadow}
              .containerRadius=${ts.containerRadius}
              .titleFontFamily=${ts.titleFontFamily}
              .titleFontSize=${ts.titleFontSize}
              .subtitleFontSize=${ts.subtitleFontSize}
              .titleBarBg=${ts.titleBarBg}
              .titleBarText=${ts.titleBarText}
              .titleIcon=${ts.titleIcon}
              .showTitleBar=${ts.showTitleBar}
              .showSearch=${ts.showSearch}
              .showCsvExport=${ts.showCsvExport}
              .showExcelExport=${ts.showExcelExport}
              .allowFiltering=${ts.allowFiltering}
              .allowSorting=${ts.allowSorting}
              .defaultSortField=${ts.defaultSortField}
              .defaultSortDirection=${ts.defaultSortDirection}
              .headerWrapping=${ts.headerWrapping}
              .fontFamily=${ts.fontFamily}
              .fontSize=${ts.fontSize}
              .headerBg=${ts.headerBg}
              .headerText=${ts.headerText}
              .bodyBg=${ts.bodyBg}
              .bodyText=${ts.bodyText}
              .footerBg=${ts.footerBg}
              .footerText=${ts.footerText}
              .columnFormatting=${p.columnFormatting ?? {}}
              .statusColors=${p.statusColors ?? {}}
              .barThresholds=${p.barThresholds ?? []}
              .dateFormats=${p.dateFormats ?? {}}
              .numberFormats=${p.numberFormats ?? {}}
              @admin-settings=${this._toggleAdmin}
              @grid-ready=${this._handleGridReady}
              @row-action=${this._handleRowAction}
              @drill-through=${this._handleDrillThrough}
              @generate-dashboard=${this._handleGenerateDashboard}
              @copy=${this._handleCopy}
            ></phz-grid>
          </div>
        </div>

        <phz-grid-admin
          .open=${this._adminPanelOpen}
          .mode=${this.adminMode}
          .reportId=${this.reportId}
          .reportName=${this.reportName}
          .reportDescription=${this.reportDescription}
          .reportCreated=${this.reportCreated}
          .reportUpdated=${this.reportUpdated}
          .columns=${this.columns}
          .fields=${this.columns.map((c) => c.field)}
          .tableSettings=${p.tableSettings ? { ...DEFAULT_TABLE_SETTINGS, ...p.tableSettings } : { ...DEFAULT_TABLE_SETTINGS }}
          .columnFormatting=${p.columnFormatting ?? {}}
          .numberFormats=${p.numberFormats ?? {}}
          .statusColors=${p.statusColors ?? {}}
          .barThresholds=${p.barThresholds ?? []}
          .dateFormats=${p.dateFormats ?? {}}
          .linkTemplates=${p.linkTemplates ?? {}}
          .columnTypes=${p.columnTypes ?? {}}
          .filterPresets=${p.filterPresets ?? {}}
          .selectedDataProductId=${this.selectedDataProductId}
          .dataProducts=${this.dataProducts}
          .schemaFields=${this.schemaFields}
          .criteriaDefinitions=${this.criteriaDefinitions}
          .criteriaBindings=${this.criteriaBindings}
          @admin-close=${this._closeAdmin}
          @settings-save=${this._handleSave}
          @settings-auto-save=${this._handleAutoSave}
          @table-settings-change=${this._handleLiveTableSettings}
          @column-config-change=${this._handleLiveColumnConfig}
          @data-source-change=${this._handleDataSourceChange}
          @criteria-binding-change=${this._handleCriteriaBindingChange}
        ></phz-grid-admin>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzReportView.prototype, "reportId", void 0);
__decorate([
    property({ type: String })
], PhzReportView.prototype, "reportName", void 0);
__decorate([
    property({ type: String })
], PhzReportView.prototype, "reportDescription", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "data", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "columns", void 0);
__decorate([
    property({ type: Boolean, attribute: 'is-admin' })
], PhzReportView.prototype, "isAdmin", void 0);
__decorate([
    property({ type: String, attribute: 'grid-title' })
], PhzReportView.prototype, "gridTitle", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "dataProducts", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "schemaFields", void 0);
__decorate([
    property({ type: String })
], PhzReportView.prototype, "selectedDataProductId", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "criteriaDefinitions", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "criteriaBindings", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "criteriaConfig", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "selectionContext", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "criteriaPresets", void 0);
__decorate([
    property({ attribute: false })
], PhzReportView.prototype, "presentation", void 0);
__decorate([
    property({ type: Boolean, attribute: 'admin-open' })
], PhzReportView.prototype, "adminOpen", void 0);
__decorate([
    property({ type: String, attribute: 'admin-mode' })
], PhzReportView.prototype, "adminMode", void 0);
__decorate([
    property({ type: Number })
], PhzReportView.prototype, "reportCreated", void 0);
__decorate([
    property({ type: Number })
], PhzReportView.prototype, "reportUpdated", void 0);
__decorate([
    state()
], PhzReportView.prototype, "_adminPanelOpen", void 0);
PhzReportView = __decorate([
    customElement('phz-report-view')
], PhzReportView);
export { PhzReportView };
//# sourceMappingURL=phz-report-view.js.map