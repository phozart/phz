/**
 * @phozart/grid — <phz-report-view> Orchestrator
 *
 * Bundles criteria-bar + grid + admin panel into one cohesive view.
 * Handles data-source selection → column auto-population,
 * criteria binding → criteria-bar population, and auto-save on admin close.
 *
 * Events:
 *   report-save   → { reportId, reportName, settings }
 *   report-create  → { reportConfig }   (when creating a new report)
 */

import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ColumnDefinition, CriteriaConfig, SelectionContext, SelectionPreset } from '@phozart/core';
import { DEFAULT_TABLE_SETTINGS, type ReportPresentation, type TableSettings } from '@phozart/engine';
import type { DataProductListItem, DataProductFieldInfo, CriteriaDefinitionItem, CriteriaBindingItem } from '@phozart/workspace/grid-admin';

import './phz-grid.js';

@customElement('phz-report-view')
export class PhzReportView extends LitElement {
  static styles = css`
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
  `;

  /** Report ID */
  @property({ type: String }) reportId: string = '';

  /** Report name */
  @property({ type: String }) reportName: string = '';

  /** Report description */
  @property({ type: String }) reportDescription: string = '';

  /** Data to display in the grid */
  @property({ attribute: false }) data: unknown[] = [];

  /** Column definitions for the grid */
  @property({ attribute: false }) columns: ColumnDefinition[] = [];

  /** Whether the current user is an admin */
  @property({ type: Boolean, attribute: 'is-admin' }) isAdmin: boolean = false;

  /** Grid title */
  @property({ type: String, attribute: 'grid-title' }) gridTitle: string = '';

  /** Available data products for the data-source picker */
  @property({ attribute: false }) dataProducts: DataProductListItem[] = [];

  /** Schema fields of the currently selected data product */
  @property({ attribute: false }) schemaFields: DataProductFieldInfo[] = [];

  /** Selected data product ID */
  @property({ type: String }) selectedDataProductId: string = '';

  /** Available filter definitions for the criteria tab */
  @property({ attribute: false }) criteriaDefinitions: CriteriaDefinitionItem[] = [];

  /** Current criteria bindings */
  @property({ attribute: false }) criteriaBindings: CriteriaBindingItem[] = [];

  /** Criteria filter configuration (fields, behavior, dependencies). When set, renders the criteria bar. */
  @property({ attribute: false }) criteriaConfig?: CriteriaConfig;

  /** Current criteria selection state (field values). Two-way: pass in to restore, listen for changes. */
  @property({ attribute: false }) selectionContext: SelectionContext = {};

  /** Criteria presets (saved filter combinations). */
  @property({ attribute: false }) criteriaPresets: SelectionPreset[] = [];

  /** Saved presentation settings (table settings, formatting, colors, etc.) loaded from DB. */
  @property({ attribute: false }) presentation: ReportPresentation = {};

  /** Start with admin panel open (e.g., for new report creation) */
  @property({ type: Boolean, attribute: 'admin-open' }) adminOpen: boolean = false;

  /** Admin mode: 'create' or 'edit' */
  @property({ type: String, attribute: 'admin-mode' }) adminMode: 'create' | 'edit' = 'edit';

  /** Report created timestamp */
  @property({ type: Number }) reportCreated: number = 0;
  /** Report updated timestamp */
  @property({ type: Number }) reportUpdated: number = 0;

  @state() private _adminPanelOpen: boolean = false;

  /** Guard: true when presentation was updated from admin live-sync (skip re-hydrating admin). */
  private _presentationFromAdmin = false;

  /** Merged table settings: defaults + presentation overrides. */
  private get _ts(): TableSettings {
    return { ...DEFAULT_TABLE_SETTINGS, ...this.presentation?.tableSettings };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._adminPanelOpen = this.adminOpen;
  }

  override updated(changed: PropertyValues): void {
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
  private _hydrateAdmin(): void {
    const admin = this.shadowRoot?.querySelector('phz-grid-admin') as any;
    if (admin && this.presentation && Object.keys(this.presentation).length > 0) {
      admin.setSettings(this.presentation);
    }
  }

  /** Live-sync: admin changes a table setting → update presentation immediately so the grid reflects it. */
  private _handleLiveTableSettings(e: CustomEvent) {
    const { key, value } = e.detail;
    this._presentationFromAdmin = true;
    this.presentation = {
      ...this.presentation,
      tableSettings: { ...this.presentation?.tableSettings, [key]: value },
    };
  }

  /** Live-sync: admin changes column formatting → update presentation immediately. */
  private _handleLiveColumnConfig(e: CustomEvent) {
    const { field, type, formatting, numberFormat, statusColors: sc, barThresholds: bt, dateFormat, linkTemplate } = e.detail;
    this._presentationFromAdmin = true;
    const p = { ...this.presentation };
    if (type !== undefined) p.columnTypes = { ...p.columnTypes, [field]: type };
    if (formatting !== undefined) p.columnFormatting = { ...p.columnFormatting, [field]: formatting };
    if (numberFormat !== undefined) p.numberFormats = { ...p.numberFormats, [field]: numberFormat };
    if (sc !== undefined) p.statusColors = { ...sc };
    if (bt !== undefined) p.barThresholds = [...bt];
    if (dateFormat !== undefined) p.dateFormats = { ...p.dateFormats, [field]: dateFormat };
    if (linkTemplate !== undefined) p.linkTemplates = { ...p.linkTemplates, [field]: linkTemplate };
    this.presentation = p;
  }

  private _toggleAdmin() {
    this._adminPanelOpen = !this._adminPanelOpen;
  }

  private _closeAdmin() {
    this._adminPanelOpen = false;
  }

  private _handleSave(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('report-save', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleAutoSave(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('report-save', {
      bubbles: true, composed: true,
      detail: { ...e.detail, autoSave: true },
    }));
  }

  private _handleDataSourceChange(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('data-source-change', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleCriteriaBindingChange(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('criteria-binding-change', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleCriteriaChange(e: CustomEvent) {
    this.selectionContext = { ...e.detail.context };
    this.dispatchEvent(new CustomEvent('criteria-change', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleCriteriaApply(e: CustomEvent) {
    this.selectionContext = { ...e.detail.context };
    this.dispatchEvent(new CustomEvent('criteria-apply', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleCriteriaReset() {
    this.selectionContext = {};
    this.dispatchEvent(new CustomEvent('criteria-reset', {
      bubbles: true, composed: true,
    }));
  }

  private _handleGridReady(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('grid-ready', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleRowAction(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('row-action', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleDrillThrough(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('drill-through', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleGenerateDashboard(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('generate-dashboard', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  private _handleCopy(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('copy', {
      bubbles: true, composed: true,
      detail: e.detail,
    }));
  }

  render() {
    const ts = this._ts;
    const p = this.presentation ?? {};

    return html`
      <div class="report-view">
        ${this.criteriaConfig ? html`
          <div class="report-view__criteria">
            <phz-selection-criteria
              .config=${this.criteriaConfig}
              .initialState=${this.selectionContext}
              .presets=${this.criteriaPresets}
              .data=${this.data as Record<string, unknown>[]}
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
          .fields=${this.columns.map((c: ColumnDefinition) => c.field)}
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
}

declare global {
  interface HTMLElementTagNameMap { 'phz-report-view': PhzReportView; }
}
