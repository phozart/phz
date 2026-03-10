/**
 * @phozart/phz-engine-admin — Filter Definition Studio
 *
 * Rich 3-panel visual builder for creating/editing filter definitions.
 * Layout: Type Catalog (200px) | Configuration Form (1fr) | Live Preview (360px)
 *
 * Events:
 * - filter-studio-save: { definition: FilterDefinition }
 * - filter-studio-cancel
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import { filterDefinitionId, resolveLabelTemplate, buildTreeFromSource } from '@phozart/phz-core';
const TYPE_CATALOG = [
    { type: 'single_select', label: 'Single Select', icon: '◉', desc: 'Pick one option from a list' },
    { type: 'multi_select', label: 'Multi Select', icon: '☑', desc: 'Pick multiple options' },
    { type: 'chip_group', label: 'Chip Group', icon: '◫', desc: 'Toggle chips for quick selection' },
    { type: 'text', label: 'Text', icon: 'T', desc: 'Free-text input field' },
    { type: 'search', label: 'Search', icon: '⌕', desc: 'Typeahead with suggestions' },
    { type: 'date_range', label: 'Date Range', icon: '▦', desc: 'Start/end date picker' },
    { type: 'numeric_range', label: 'Numeric Range', icon: '#', desc: 'Min/max numeric bounds' },
    { type: 'tree_select', label: 'Tree Select', icon: '⊞', desc: 'Hierarchical tree picker' },
    { type: 'field_presence', label: 'Field Presence', icon: '∅', desc: 'Check if fields have values' },
    { type: 'period_picker', label: 'Period Picker', icon: '◷', desc: 'Fiscal period selector' },
];
/* ── Option types for selects ── */
const OPTIONS_TYPES = ['single_select', 'multi_select', 'chip_group'];
const ALL_GRANULARITIES = [
    { value: 'day', label: 'Day' }, { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
];
const ALL_PRESET_GROUPS = [
    { value: 'relative', label: 'Relative' }, { value: 'rolling', label: 'Rolling' },
    { value: 'to_date', label: 'To Date' }, { value: 'previous_complete', label: 'Previous Complete' },
];
const STUDIO_HELP = {
    title: 'How does the Filter Studio work?',
    body: 'A filter definition is a reusable template that describes one type of filter \u2014 its label, UI type, data source, and default behaviour. Once created, a single definition can be bound to multiple reports and dashboards.',
    tips: [
        'Definition vs Binding \u2014 Definitions live here in the studio; bindings scope them per report with optional overrides',
        'Reference-data filters (Region, Status) use a data source with value field and optional label template',
        'Structural filters (Date Range, Numeric Range) are configured directly \u2014 no data source needed',
        'Data Source \u2014 Select a named dataset, then pick which column provides the option values',
        'Session Behaviour \u2014 \u201CReset\u201D clears the filter on each visit; \u201CPersist\u201D remembers the user\u2019s last choice',
        'Live Preview \u2014 The right panel shows how the filter will appear to end users',
    ],
};
let PhzFilterStudio = class PhzFilterStudio extends LitElement {
    constructor() {
        super(...arguments);
        /** Available columns for data field autocomplete */
        this.availableColumns = [];
        /** Dataset rows — used for "Import from column" and "Build tree from data" */
        this.data = [];
        /** Named data sources for data source selection */
        this.dataSources = [];
        this._helpOpen = false;
        this.selectedType = 'single_select';
        this.draft = {};
        this._treeSourceDsId = '';
        this._treeLevels = [{ field: '' }, { field: '' }];
        this._importColumn = '';
        this._validationError = '';
        this._selectedDataSourceId = '';
        this._selectedValueField = '';
        this._labelTemplate = '';
        /* ── Draft helpers ── */
        this._options = [];
        this._treeOptions = [];
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; height: 100%; }

      .studio {
        display: grid;
        grid-template-columns: 200px 1fr 360px;
        height: 100%;
        min-height: 520px;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        overflow: hidden;
        background: white;
      }

      /* Left panel — Type Catalog */
      .catalog {
        padding: 12px;
        background: #FAFAF9;
        border-right: 1px solid #E7E5E4;
        overflow-y: auto;
      }

      .catalog-title {
        font-size: 11px;
        font-weight: 700;
        color: #78716C;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 12px;
      }

      .catalog-tiles { display: flex; flex-direction: column; gap: 4px; }

      .type-tile {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        background: none;
        text-align: left;
        width: 100%;
        font-family: inherit;
        color: #44403C;
      }

      .type-tile:hover { background: #F5F5F4; border-color: #E7E5E4; }
      .type-tile--active { background: #EFF6FF; border-color: #3B82F6; color: #1D4ED8; }

      .type-tile-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }

      .type-tile-text { flex: 1; min-width: 0; }
      .type-tile-label { font-size: 12px; font-weight: 600; display: block; }
      .type-tile-desc { font-size: 10px; color: #A8A29E; display: block; line-height: 1.3; margin-top: 1px; }
      .type-tile--active .type-tile-desc { color: #60A5FA; }

      /* Centre panel — Form */
      .form-panel {
        padding: 20px;
        overflow-y: auto;
      }

      .section {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #F5F5F4;
      }

      .section:last-child { border-bottom: none; }

      .section-title {
        font-size: 11px;
        font-weight: 700;
        color: #78716C;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 12px;
      }

      /* Option rows */
      .option-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }

      .option-row input { flex: 1; }

      .option-remove {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: #A8A29E;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .option-remove:hover { background: #FEF2F2; color: #DC2626; }

      .add-btn {
        font-size: 12px;
        color: #3B82F6;
        background: none;
        border: 1px dashed #93C5FD;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        width: 100%;
        font-family: inherit;
      }

      .add-btn:hover { background: #EFF6FF; }

      /* Tree node rows */
      .tree-node-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 4px;
      }

      .tree-indent { width: 16px; flex-shrink: 0; }

      .tree-actions {
        display: flex;
        gap: 2px;
      }

      .tree-action-btn {
        width: 20px;
        height: 20px;
        border: none;
        background: none;
        color: #A8A29E;
        cursor: pointer;
        border-radius: 3px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tree-action-btn:hover { background: #F5F5F4; color: #44403C; }

      /* Toggle */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
      }

      .toggle-label { font-size: 12px; color: #44403C; }

      .toggle {
        width: 36px;
        height: 20px;
        border: none;
        border-radius: 10px;
        background: #D6D3D1;
        cursor: pointer;
        position: relative;
        transition: background 0.15s;
      }

      .toggle--on { background: #3B82F6; }

      .toggle::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        transition: transform 0.15s;
      }

      .toggle--on::after { transform: translateX(16px); }

      /* Segmented control */
      .segmented {
        display: flex;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        overflow: hidden;
      }

      .seg-btn {
        flex: 1;
        padding: 6px 10px;
        font-size: 12px;
        border: none;
        background: white;
        cursor: pointer;
        font-family: inherit;
        color: #44403C;
        border-right: 1px solid #D6D3D1;
      }

      .seg-btn:last-child { border-right: none; }
      .seg-btn--active { background: #1C1917; color: white; }

      /* Right panel — Preview */
      .preview-panel {
        padding: 16px;
        background: #FAFAF9;
        border-left: 1px solid #E7E5E4;
        overflow-y: auto;
      }

      .preview-title {
        font-size: 11px;
        font-weight: 700;
        color: #78716C;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 12px;
      }

      .preview-card {
        background: white;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 12px;
      }

      .preview-empty {
        text-align: center;
        padding: 32px 16px;
        color: #A8A29E;
        font-size: 13px;
      }

      .preview-label {
        font-size: 12px;
        font-weight: 600;
        color: #1C1917;
        margin-bottom: 8px;
      }

      .preview-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px;
        font-size: 12px;
        color: #44403C;
        border-radius: 4px;
      }

      .preview-option:hover { background: #FAFAF9; }

      .preview-checkbox {
        width: 14px;
        height: 14px;
        border: 1.5px solid #D6D3D1;
        border-radius: 3px;
        flex-shrink: 0;
      }

      .preview-radio {
        width: 14px;
        height: 14px;
        border: 1.5px solid #D6D3D1;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .preview-chip {
        display: inline-flex;
        padding: 4px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 16px;
        font-size: 11px;
        margin: 2px;
        color: #44403C;
      }

      .preview-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 12px;
        color: #78716C;
        background: #FAFAF9;
      }

      .preview-range {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .preview-range-input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 12px;
        text-align: center;
        color: #78716C;
        background: #FAFAF9;
      }

      .preview-slider {
        width: 100%;
        margin-top: 6px;
      }

      .preview-tree-node {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 0;
        font-size: 12px;
        color: #44403C;
      }

      .preview-tree-expand { font-size: 10px; color: #78716C; width: 14px; text-align: center; }

      .preview-presence-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 0;
        font-size: 12px;
      }

      .preview-presence-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #D6D3D1;
      }

      /* Summary card */
      .summary-card {
        background: white;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        padding: 12px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
        font-size: 11px;
      }

      .summary-key { color: #78716C; }

      .summary-value { color: #1C1917; font-weight: 600; }

      .type-badge {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        background: #F5F5F4;
        color: #78716C;
      }

      /* Footer */
      .studio-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid #E7E5E4;
        background: #FAFAF9;
        grid-column: 1 / -1;
      }

      /* Validation */
      .phz-ea-input--error { border-color: #DC2626; }
      .phz-ea-input--error:focus { box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2); }
      .field-error { font-size: 11px; color: #DC2626; margin-top: 2px; }

      /* Chip group */
      .chip-group { display: flex; flex-wrap: wrap; gap: 4px; }

      /* Import from data */
      .import-bar {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        padding: 10px 12px;
        background: #FAFAF9;
        border: 1px solid #E7E5E4;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .import-bar .phz-ea-field { margin-bottom: 0; flex: 1; min-width: 0; }

      .import-bar .phz-ea-btn { white-space: nowrap; flex-shrink: 0; }

      .import-divider {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 6px 0 10px;
        font-size: 11px;
        color: #A8A29E;
      }

      .import-divider::before, .import-divider::after {
        content: '';
        flex: 1;
        border-top: 1px solid #E7E5E4;
      }

      .tree-build-panel {
        padding: 10px 12px;
        background: #FAFAF9;
        border: 1px solid #E7E5E4;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .tree-build-panel .phz-ea-label { font-size: 11px; }

      .tree-build-fields {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-bottom: 8px;
      }

      .tree-build-fields .phz-ea-field { margin-bottom: 0; }

      .tree-stats {
        font-size: 11px;
        color: #78716C;
        margin-top: 6px;
      }

      /* -- Help / Guidance -- */
      .phz-fs-help {
        background: #FFFBEB;
        border: 1px solid #FDE68A;
        border-radius: 10px;
        margin-bottom: 16px;
        overflow: hidden;
      }

      .phz-fs-help-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: none;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        color: #92400E;
        text-align: left;
      }

      .phz-fs-help-toggle:hover { background: rgba(251, 191, 36, 0.08); }

      .phz-fs-help-chevron {
        transition: transform 0.2s;
        font-size: 10px;
        flex-shrink: 0;
      }

      .phz-fs-help-chevron--open { transform: rotate(90deg); }

      .phz-fs-help-body {
        padding: 0 14px 12px;
        font-size: 12px;
        color: #78350F;
        line-height: 1.5;
      }

      .phz-fs-help-body p { margin: 0 0 8px; }

      .phz-fs-help-tips {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .phz-fs-help-tips li {
        padding: 3px 0;
        position: relative;
        padding-left: 16px;
      }

      .phz-fs-help-tips li::before {
        content: '\u2022';
        position: absolute;
        left: 4px;
        color: #D97706;
      }

      @media (prefers-reduced-motion: reduce) {
        .phz-fs-help-chevron { transition: none; }
      }
    `,
    ]; }
    connectedCallback() {
        super.connectedCallback();
        import('@phozart/phz-criteria');
        if (this.definition) {
            this.selectedType = this.definition.type;
            this.draft = { ...this.definition };
            this._options = [...(this.definition.options ?? [])];
            this._treeOptions = JSON.parse(JSON.stringify(this.definition.treeOptions ?? []));
            const os = this.definition.valueSource?.optionsSource;
            if (os) {
                this._selectedDataSourceId = os.dataSetId;
                this._selectedValueField = os.valueField;
                this._labelTemplate = os.labelTemplate ?? '';
            }
            if (this.definition.treeSource) {
                this._treeSourceDsId = this.definition.treeSource.dataSetId;
                this._treeLevels = [...this.definition.treeSource.levels];
            }
        }
        else {
            this._resetDraft();
        }
    }
    _resetDraft() {
        this.draft = {
            label: '',
            type: this.selectedType,
            sessionBehavior: 'reset',
            dataField: undefined,
        };
        this._options = [];
        this._treeOptions = [];
        this._selectedDataSourceId = '';
        this._selectedValueField = '';
        this._labelTemplate = '';
        this._treeSourceDsId = '';
        this._treeLevels = [{ field: '' }, { field: '' }];
    }
    _updateDraft(key, value) {
        this.draft = { ...this.draft, [key]: value };
    }
    _selectType(type) {
        if (type !== this.selectedType) {
            const prev = this.selectedType;
            this.selectedType = type;
            this.draft = { ...this.draft, type };
            // Preserve options when switching between compatible option-based types
            const prevIsOptions = OPTIONS_TYPES.includes(prev);
            const nextIsOptions = OPTIONS_TYPES.includes(type);
            if (!nextIsOptions || !prevIsOptions) {
                this._options = [];
            }
            // Initialize tree levels when entering tree_select, clear when leaving
            if (type === 'tree_select') {
                this._treeLevels = [{ field: '' }, { field: '' }];
                this._treeSourceDsId = '';
            }
            else {
                this._treeOptions = [];
                this._treeLevels = [{ field: '' }, { field: '' }];
                this._treeSourceDsId = '';
            }
        }
    }
    /* ── Data Source helpers ── */
    _handleStudioDataSourceChange(dsId) {
        this._selectedDataSourceId = dsId;
        this._selectedValueField = '';
        this._labelTemplate = '';
        if (dsId && !this.draft.label) {
            const ds = this.dataSources.find(d => d.id === dsId);
            if (ds)
                this._updateDraft('label', ds.name);
        }
    }
    _renderStudioTemplatePreview() {
        if (!this._labelTemplate || !this._selectedDataSourceId)
            return nothing;
        const ds = this.dataSources.find(d => d.id === this._selectedDataSourceId);
        const sample = ds?.sampleRows?.[0];
        if (!sample)
            return nothing;
        const preview = resolveLabelTemplate(this._labelTemplate, sample);
        return html `<div style="font-size:11px;color:#16A34A;margin-top:4px">Preview: ${preview}</div>`;
    }
    /* ── Events ── */
    _handleSave() {
        const label = (this.draft.label ?? '').trim();
        if (!label) {
            this._validationError = 'Label is required';
            return;
        }
        this._validationError = '';
        const now = Date.now();
        const id = this.definition?.id ?? filterDefinitionId(label.toLowerCase().replace(/\s+/g, '_'));
        let valueSource;
        if (this._selectedDataSourceId && this._selectedValueField) {
            const optionsSource = {
                dataSetId: this._selectedDataSourceId,
                valueField: this._selectedValueField,
            };
            if (this._labelTemplate) {
                optionsSource.labelTemplate = this._labelTemplate;
            }
            valueSource = { type: 'dataset', optionsSource };
        }
        // Build treeSource and snapshot treeOptions for tree_select
        let treeSource;
        let treeOptions;
        if (this.selectedType === 'tree_select') {
            const validLevels = this._treeLevels.filter(l => l.field);
            if (validLevels.length >= 2 && this._treeSourceDsId) {
                treeSource = { dataSetId: this._treeSourceDsId, levels: validLevels };
                treeOptions = this._computeTreePreview();
            }
            else if (validLevels.length >= 2) {
                // No named data source — build from inline data
                treeSource = { dataSetId: '', levels: validLevels };
                treeOptions = this._computeTreePreview();
            }
            else {
                treeOptions = this._treeOptions.length > 0 ? this._treeOptions : undefined;
            }
        }
        const def = {
            id,
            label,
            type: this.selectedType,
            sessionBehavior: this.draft.sessionBehavior ?? 'reset',
            createdAt: this.definition?.createdAt ?? now,
            updatedAt: now,
            dataField: undefined,
            defaultValue: this.draft.defaultValue,
            valueSource: this.selectedType !== 'tree_select' ? valueSource : undefined,
            options: OPTIONS_TYPES.includes(this.selectedType) ? this._options : undefined,
            treeOptions: treeOptions?.length ? treeOptions : undefined,
            treeSource,
            dateRangeConfig: this.selectedType === 'date_range' ? this.draft.dateRangeConfig : undefined,
            numericRangeConfig: this.selectedType === 'numeric_range' ? this.draft.numericRangeConfig : undefined,
            searchConfig: this.selectedType === 'search' ? this.draft.searchConfig : undefined,
            fieldPresenceConfig: this.selectedType === 'field_presence' ? this.draft.fieldPresenceConfig : undefined,
        };
        this.dispatchEvent(new CustomEvent('filter-studio-save', {
            bubbles: true, composed: true, detail: { definition: def },
        }));
    }
    _handleCancel() {
        this.dispatchEvent(new CustomEvent('filter-studio-cancel', { bubbles: true, composed: true }));
    }
    /* ── Options helpers ── */
    _addOption() {
        this._options = [...this._options, { value: '', label: '' }];
        this.requestUpdate();
    }
    _updateOption(idx, field, val) {
        this._options = this._options.map((o, i) => i === idx ? { ...o, [field]: val } : o);
        this.requestUpdate();
    }
    _removeOption(idx) {
        this._options = this._options.filter((_, i) => i !== idx);
        this.requestUpdate();
    }
    /* ── Tree level helpers ── */
    _addTreeLevel() {
        this._treeLevels = [...this._treeLevels, { field: '' }];
    }
    _removeTreeLevel(idx) {
        if (this._treeLevels.length <= 2)
            return;
        this._treeLevels = this._treeLevels.filter((_, i) => i !== idx);
    }
    _updateTreeLevel(idx, patch) {
        this._treeLevels = this._treeLevels.map((l, i) => i === idx ? { ...l, ...patch } : l);
    }
    _getTreeSourceColumns() {
        if (this._treeSourceDsId) {
            const ds = this.dataSources.find(d => d.id === this._treeSourceDsId);
            if (ds)
                return ds.columns;
        }
        return this._getDataColumns();
    }
    _getTreeSourceRows() {
        if (this._treeSourceDsId) {
            const ds = this.dataSources.find(d => d.id === this._treeSourceDsId);
            if (ds?.sampleRows?.length)
                return ds.sampleRows;
        }
        return this.data;
    }
    _computeTreePreview() {
        const validLevels = this._treeLevels.filter(l => l.field);
        if (validLevels.length < 2)
            return [];
        const rows = this._getTreeSourceRows();
        if (rows.length === 0)
            return [];
        return buildTreeFromSource(rows, validLevels);
    }
    /* ── Import from data helpers ── */
    /** Derive column names from actual data rows or selected data source */
    _getDataColumns() {
        if (this._selectedDataSourceId) {
            const ds = this.dataSources.find(d => d.id === this._selectedDataSourceId);
            if (ds)
                return ds.columns;
        }
        if (this.data.length === 0)
            return this.availableColumns;
        const keys = new Set();
        for (const row of this.data) {
            for (const k of Object.keys(row))
                keys.add(k);
        }
        return [...keys].sort();
    }
    _importOptionsFromColumn() {
        if (!this._importColumn)
            return;
        const col = this._importColumn;
        let rows = this.data;
        if (rows.length === 0 && this._selectedDataSourceId) {
            const ds = this.dataSources.find(d => d.id === this._selectedDataSourceId);
            rows = ds?.sampleRows ?? [];
        }
        if (rows.length === 0)
            return;
        const unique = [...new Set(rows.map(row => String(row[col] ?? '')).filter(Boolean))].sort();
        this._options = unique.map(v => ({ value: v, label: v }));
        this.requestUpdate();
    }
    /* ── Render ── */
    render() {
        return html `
      <div class="studio" role="region" aria-label="Filter Definition Studio">
        <div class="catalog">${this._renderCatalog()}</div>
        <div class="form-panel">${this._renderForm()}</div>
        <div class="preview-panel">${this._renderPreview()}</div>
        <div class="studio-footer">
          <button class="phz-ea-btn" @click=${this._handleCancel}>Cancel</button>
          <button class="phz-ea-btn phz-ea-btn--primary" @click=${this._handleSave}>
            ${this.definition ? 'Update Definition' : 'Create Definition'}
          </button>
        </div>
      </div>
    `;
    }
    /* ── Left Panel: Type Catalog ── */
    _renderCatalog() {
        return html `
      <p class="catalog-title">Filter Type</p>
      <div class="catalog-tiles">
        ${TYPE_CATALOG.map(item => html `
          <button
            class="type-tile ${this.selectedType === item.type ? 'type-tile--active' : ''}"
            @click=${() => this._selectType(item.type)}
          >
            <span class="type-tile-icon">${item.icon}</span>
            <span class="type-tile-text">
              <span class="type-tile-label">${item.label}</span>
              <span class="type-tile-desc">${item.desc}</span>
            </span>
          </button>
        `)}
      </div>
    `;
    }
    /* ── Centre Panel: Configuration Form ── */
    _renderHelp() {
        return html `
      <div class="phz-fs-help">
        <button class="phz-fs-help-toggle" @click=${() => { this._helpOpen = !this._helpOpen; }}
                aria-expanded="${this._helpOpen}">
          <span class="phz-fs-help-chevron ${this._helpOpen ? 'phz-fs-help-chevron--open' : ''}"
                aria-hidden="true">\u25B6</span>
          <span>${STUDIO_HELP.title}</span>
        </button>
        ${this._helpOpen ? html `
          <div class="phz-fs-help-body">
            <p>${STUDIO_HELP.body}</p>
            <ul class="phz-fs-help-tips">
              ${STUDIO_HELP.tips.map(t => html `<li>${t}</li>`)}
            </ul>
          </div>
        ` : nothing}
      </div>
    `;
    }
    _renderForm() {
        return html `
      ${this._renderHelp()}
      ${this._renderIdentitySection()}
      ${this._renderTypeConfig()}
    `;
    }
    _renderIdentitySection() {
        return html `
      <div class="section">
        <p class="section-title">Identity</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Label</label>
          <input class="phz-ea-input ${this._validationError ? 'phz-ea-input--error' : ''}"
                 .value=${this.draft.label ?? ''}
                 @input=${(e) => {
            this._updateDraft('label', e.target.value);
            if (this._validationError)
                this._validationError = '';
        }}
                 @keydown=${(e) => { if (e.key === 'Enter')
            this._handleSave(); }}
                 placeholder="e.g. Region">
          ${this._validationError ? html `<div class="field-error">${this._validationError}</div>` : nothing}
        </div>
        ${this.dataSources.length > 0 && this.selectedType !== 'tree_select' ? html `
          <div class="phz-ea-field">
            <label class="phz-ea-label">Data Source</label>
            <phz-combobox
              .options=${this.dataSources.map(ds => ({ value: ds.id, label: ds.name }))}
              .value=${this._selectedDataSourceId}
              allow-empty
              empty-label="\u2014 None \u2014"
              @combobox-change=${(e) => this._handleStudioDataSourceChange(e.detail.value)}
            ></phz-combobox>
          </div>
          ${this._selectedDataSourceId ? html `
            <div class="phz-ea-field">
              <label class="phz-ea-label">Value Field</label>
              <phz-combobox
                .options=${(this.dataSources.find(ds => ds.id === this._selectedDataSourceId)?.columns ?? []).map(c => ({ value: c, label: c }))}
                .value=${this._selectedValueField}
                allow-empty
                empty-label="\u2014 Select \u2014"
                @combobox-change=${(e) => this._selectedValueField = e.detail.value}
              ></phz-combobox>
            </div>
            <div class="phz-ea-field">
              <label class="phz-ea-label">Label Template</label>
              <input class="phz-ea-input" .value=${this._labelTemplate}
                     @input=${(e) => this._labelTemplate = e.target.value}
                     placeholder="e.g. {code} - {description}">
              ${this._renderStudioTemplatePreview()}
            </div>
          ` : nothing}
        ` : nothing}
        <div class="phz-ea-field">
          <label class="phz-ea-label">Session Behaviour</label>
          <div class="segmented">
            <button class="seg-btn ${this.draft.sessionBehavior === 'reset' ? 'seg-btn--active' : ''}"
                    @click=${() => this._updateDraft('sessionBehavior', 'reset')}>Reset</button>
            <button class="seg-btn ${this.draft.sessionBehavior === 'persist' ? 'seg-btn--active' : ''}"
                    @click=${() => this._updateDraft('sessionBehavior', 'persist')}>Persist</button>
          </div>
        </div>
      </div>
    `;
    }
    /* ── Type-specific config ── */
    _renderTypeConfig() {
        const t = this.selectedType;
        if (OPTIONS_TYPES.includes(t))
            return this._renderOptionsConfig();
        if (t === 'text')
            return this._renderTextConfig();
        if (t === 'search')
            return this._renderSearchConfig();
        if (t === 'date_range')
            return this._renderDateRangeConfig();
        if (t === 'numeric_range')
            return this._renderNumericRangeConfig();
        if (t === 'tree_select')
            return this._renderTreeConfig();
        if (t === 'field_presence')
            return this._renderFieldPresenceConfig();
        return nothing;
    }
    _renderOptionsConfig() {
        const hasData = this.data.length > 0;
        return html `
      <div class="section">
        <p class="section-title">Options</p>
        ${hasData ? html `
          <div class="import-bar">
            <div class="phz-ea-field">
              <label class="phz-ea-label">Import from column</label>
              <phz-combobox
                .options=${this._getDataColumns().map(c => ({ value: c, label: c }))}
                .value=${this._importColumn}
                allow-empty
                empty-label="\u2014 select column \u2014"
                @combobox-change=${(e) => this._importColumn = e.detail.value}
              ></phz-combobox>
            </div>
            <button class="phz-ea-btn" .disabled=${!this._importColumn}
                    @click=${() => this._importOptionsFromColumn()}>Import</button>
          </div>
          <div class="import-divider">or add manually</div>
        ` : nothing}
        ${this._options.map((opt, idx) => html `
          <div class="option-row">
            <input class="phz-ea-input" .value=${opt.value} placeholder="Value"
                   @input=${(e) => this._updateOption(idx, 'value', e.target.value)}
                   style="flex:1">
            <input class="phz-ea-input" .value=${opt.label} placeholder="Label"
                   @input=${(e) => this._updateOption(idx, 'label', e.target.value)}
                   style="flex:1">
            <button class="option-remove" @click=${() => this._removeOption(idx)}
                    aria-label="Remove option">&times;</button>
          </div>
        `)}
        <button class="add-btn" @click=${this._addOption}>+ Add Option</button>
      </div>
    `;
    }
    _renderTextConfig() {
        const placeholder = this.draft.metadata?.placeholder ?? '';
        return html `
      <div class="section">
        <p class="section-title">Text Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Placeholder</label>
          <input class="phz-ea-input" .value=${placeholder}
                 placeholder="Enter placeholder text..."
                 @input=${(e) => this._updateDraft('metadata', { ...(this.draft.metadata ?? {}), placeholder: e.target.value })}>
        </div>
      </div>
    `;
    }
    _renderSearchConfig() {
        const cfg = this.draft.searchConfig ?? {};
        return html `
      <div class="section">
        <p class="section-title">Search Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Placeholder</label>
          <input class="phz-ea-input" .value=${this.draft.metadata?.placeholder ?? ''}
                 placeholder="Search..."
                 @input=${(e) => this._updateDraft('metadata', { ...(this.draft.metadata ?? {}), placeholder: e.target.value })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Min Characters</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.minChars ?? 2)} min="1"
                 @input=${(e) => this._updateDraft('searchConfig', { ...cfg, minChars: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Debounce (ms)</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.debounceMs ?? 300)} min="0" step="50"
                 @input=${(e) => this._updateDraft('searchConfig', { ...cfg, debounceMs: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Max Suggestions</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.maxSuggestions ?? 10)} min="1"
                 @input=${(e) => this._updateDraft('searchConfig', { ...cfg, maxSuggestions: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Match Mode</label>
          <div class="segmented">
            <button class="seg-btn ${(cfg.matchMode ?? 'contains') === 'contains' ? 'seg-btn--active' : ''}"
                    @click=${() => this._updateDraft('searchConfig', { ...cfg, matchMode: 'contains' })}>Contains</button>
            <button class="seg-btn ${cfg.matchMode === 'beginsWith' ? 'seg-btn--active' : ''}"
                    @click=${() => this._updateDraft('searchConfig', { ...cfg, matchMode: 'beginsWith' })}>Begins With</button>
          </div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Multi-Value (space separated)</span>
          <button class="toggle ${cfg.multiValue ? 'toggle--on' : ''}"
                  @click=${() => this._updateDraft('searchConfig', { ...cfg, multiValue: !cfg.multiValue })}></button>
        </div>
      </div>
    `;
    }
    _renderDateRangeConfig() {
        const cfg = this.draft.dateRangeConfig ?? {};
        const grans = cfg.availableGranularities ?? ALL_GRANULARITIES.map(g => g.value);
        const groups = cfg.availablePresetGroups ?? ALL_PRESET_GROUPS.map(g => g.value);
        return html `
      <div class="section">
        <p class="section-title">Date Range Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Available Granularities</label>
          <div class="chip-group">
            ${ALL_GRANULARITIES.map(g => html `
              <button class="phz-ea-chip ${grans.includes(g.value) ? 'phz-ea-chip--active' : ''}"
                      @click=${() => {
            const next = grans.includes(g.value) ? grans.filter(x => x !== g.value) : [...grans, g.value];
            this._updateDraft('dateRangeConfig', { ...cfg, availableGranularities: next });
        }}>${g.label}</button>
            `)}
          </div>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Preset Groups</label>
          <div class="chip-group">
            ${ALL_PRESET_GROUPS.map(g => html `
              <button class="phz-ea-chip ${groups.includes(g.value) ? 'phz-ea-chip--active' : ''}"
                      @click=${() => {
            const next = groups.includes(g.value) ? groups.filter(x => x !== g.value) : [...groups, g.value];
            this._updateDraft('dateRangeConfig', { ...cfg, availablePresetGroups: next });
        }}>${g.label}</button>
            `)}
          </div>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Fiscal Year Start Month (1-12)</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.fiscalYearStartMonth ?? 1)} min="1" max="12"
                 @input=${(e) => this._updateDraft('dateRangeConfig', { ...cfg, fiscalYearStartMonth: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Week Start Day</label>
          <div class="segmented">
            <button class="seg-btn ${(cfg.weekStartDay ?? 'monday') === 'monday' ? 'seg-btn--active' : ''}"
                    @click=${() => this._updateDraft('dateRangeConfig', { ...cfg, weekStartDay: 'monday' })}>Monday</button>
            <button class="seg-btn ${cfg.weekStartDay === 'sunday' ? 'seg-btn--active' : ''}"
                    @click=${() => this._updateDraft('dateRangeConfig', { ...cfg, weekStartDay: 'sunday' })}>Sunday</button>
          </div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Comparison Enabled</span>
          <button class="toggle ${cfg.comparisonEnabled ? 'toggle--on' : ''}"
                  @click=${() => this._updateDraft('dateRangeConfig', { ...cfg, comparisonEnabled: !cfg.comparisonEnabled })}></button>
        </div>
        <div class="phz-ea-field" style="margin-top:10px">
          <label class="phz-ea-label">Min Date</label>
          <input class="phz-ea-input" type="date" .value=${cfg.minDate ?? ''}
                 @input=${(e) => this._updateDraft('dateRangeConfig', { ...cfg, minDate: e.target.value })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Max Date</label>
          <input class="phz-ea-input" type="date" .value=${cfg.maxDate ?? ''}
                 @input=${(e) => this._updateDraft('dateRangeConfig', { ...cfg, maxDate: e.target.value })}>
        </div>
      </div>
    `;
    }
    _renderNumericRangeConfig() {
        const cfg = this.draft.numericRangeConfig ?? {};
        return html `
      <div class="section">
        <p class="section-title">Numeric Range Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Min</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.min ?? 0)}
                 @input=${(e) => this._updateDraft('numericRangeConfig', { ...cfg, min: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Max</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.max ?? 100)}
                 @input=${(e) => this._updateDraft('numericRangeConfig', { ...cfg, max: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Step</label>
          <input class="phz-ea-input" type="number" .value=${String(cfg.step ?? 1)} min="0.01" step="any"
                 @input=${(e) => this._updateDraft('numericRangeConfig', { ...cfg, step: Number(e.target.value) })}>
        </div>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Unit</label>
          <input class="phz-ea-input" .value=${cfg.unit ?? ''} placeholder="e.g. USD, kg, %"
                 @input=${(e) => this._updateDraft('numericRangeConfig', { ...cfg, unit: e.target.value })}>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Show Slider</span>
          <button class="toggle ${cfg.showSlider ? 'toggle--on' : ''}"
                  @click=${() => this._updateDraft('numericRangeConfig', { ...cfg, showSlider: !cfg.showSlider })}></button>
        </div>
      </div>
    `;
    }
    _renderTreeConfig() {
        const columns = this._getTreeSourceColumns();
        const preview = this._computeTreePreview();
        const nodeCount = this._countTreeNodes(preview);
        const levelCount = this._treeLevels.length;
        return html `
      <div class="section">
        <p class="section-title">Tree Levels</p>
        ${this.dataSources.length > 0 ? html `
          <div class="phz-ea-field">
            <label class="phz-ea-label">Data Source</label>
            <phz-combobox
              .options=${this.dataSources.map(ds => ({ value: ds.id, label: ds.name }))}
              .value=${this._treeSourceDsId}
              allow-empty
              empty-label="\u2014 Select data source \u2014"
              @combobox-change=${(e) => { this._treeSourceDsId = e.detail.value; }}
            ></phz-combobox>
          </div>
        ` : nothing}
        ${this._treeLevels.map((level, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === levelCount - 1;
            const tag = isFirst ? '(root)' : isLast ? '(leaf)' : '';
            const canRemove = !isFirst && levelCount > 2;
            return html `
            <div class="tree-build-panel" style="margin-bottom:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <label class="phz-ea-label" style="margin:0">Level ${idx + 1} ${tag}</label>
                ${canRemove ? html `
                  <button class="option-remove" @click=${() => this._removeTreeLevel(idx)}
                          aria-label="Remove level">&times;</button>
                ` : nothing}
              </div>
              <div class="phz-ea-field" style="margin-bottom:6px">
                <label class="phz-ea-label">Column</label>
                <phz-combobox
                  .options=${columns.map(c => ({ value: c, label: c }))}
                  .value=${level.field}
                  allow-empty
                  empty-label="\u2014 select column \u2014"
                  @combobox-change=${(e) => this._updateTreeLevel(idx, { field: e.detail.value })}
                ></phz-combobox>
              </div>
              <div class="phz-ea-field" style="margin-bottom:0">
                <label class="phz-ea-label">Label Template</label>
                <input class="phz-ea-input" .value=${level.labelTemplate ?? ''}
                       placeholder="e.g. {code} - {name}"
                       @input=${(e) => this._updateTreeLevel(idx, { labelTemplate: e.target.value || undefined })}>
              </div>
            </div>
          `;
        })}
        <button class="add-btn" @click=${() => this._addTreeLevel()}>+ Add Level</button>
        ${nodeCount > 0 ? html `
          <div class="tree-stats" style="margin-top:8px">${levelCount} levels &middot; ${nodeCount} nodes from sample data</div>
        ` : nothing}
      </div>
    `;
    }
    _countTreeNodes(nodes) {
        let count = 0;
        for (const n of nodes) {
            count++;
            if (n.children?.length)
                count += this._countTreeNodes(n.children);
        }
        return count;
    }
    _renderFieldPresenceConfig() {
        const cfg = this.draft.fieldPresenceConfig ?? { fields: [] };
        return html `
      <div class="section">
        <p class="section-title">Field Presence Configuration</p>
        <div class="phz-ea-field">
          <label class="phz-ea-label">Field Names (comma-separated)</label>
          <input class="phz-ea-input" .value=${(cfg.fields ?? []).join(', ')}
                 @input=${(e) => {
            const fields = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            this._updateDraft('fieldPresenceConfig', { ...cfg, fields });
        }}
                 placeholder="field1, field2, field3">
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Compact Mode</span>
          <button class="toggle ${cfg.compact ? 'toggle--on' : ''}"
                  @click=${() => this._updateDraft('fieldPresenceConfig', { ...cfg, compact: !cfg.compact })}></button>
        </div>
      </div>
    `;
    }
    /* ── Behaviour Section ── */
    /* Required, Selection Mode, and Allow Null Value are per-binding overrides
       configured in <phz-filter-configurator>, not at the definition level. */
    /* ── Bar Config Section ── */
    /* ── Right Panel: Live Preview ── */
    _renderPreview() {
        return html `
      <p class="preview-title">Live Preview</p>
      ${this._renderPreviewControl()}
      <div style="margin-top:12px">
        <p class="preview-title">Summary</p>
        ${this._renderSummaryCard()}
      </div>
    `;
    }
    _renderPreviewControl() {
        const label = this.draft.label || 'Untitled Filter';
        const t = this.selectedType;
        if (OPTIONS_TYPES.includes(t))
            return this._renderOptionsPreview(label);
        if (t === 'text')
            return this._renderTextPreview(label);
        if (t === 'search')
            return this._renderSearchPreview(label);
        if (t === 'date_range')
            return this._renderDateRangePreview(label);
        if (t === 'numeric_range')
            return this._renderNumericPreview(label);
        if (t === 'tree_select')
            return this._renderTreePreview(label);
        if (t === 'field_presence')
            return this._renderPresencePreview(label);
        if (t === 'period_picker')
            return this._renderPeriodPreview(label);
        return html `<div class="preview-empty">Select a filter type</div>`;
    }
    _renderOptionsPreview(label) {
        const isChip = this.selectedType === 'chip_group';
        const isMulti = this.selectedType !== 'single_select';
        const opts = this._options.length > 0 ? this._options : [
            { value: 'opt1', label: 'Option 1' }, { value: 'opt2', label: 'Option 2' }, { value: 'opt3', label: 'Option 3' },
        ];
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        ${isChip ? html `
          <div class="chip-group">
            ${opts.map(o => html `<span class="preview-chip">${o.label || o.value || '...'}</span>`)}
          </div>
        ` : html `
          ${opts.map(o => html `
            <div class="preview-option">
              <div class="${isMulti ? 'preview-checkbox' : 'preview-radio'}"></div>
              <span>${o.label || o.value || '...'}</span>
            </div>
          `)}
        `}
      </div>
    `;
    }
    _renderTextPreview(label) {
        const placeholder = this.draft.metadata?.placeholder || 'Enter text...';
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        <div class="preview-input">${placeholder}</div>
      </div>
    `;
    }
    _renderSearchPreview(label) {
        const cfg = this.draft.searchConfig ?? {};
        const mode = cfg.matchMode ?? 'contains';
        const multi = cfg.multiValue ?? false;
        const placeholder = multi ? 'Space-separated values...' : 'Search...';
        const hints = [mode === 'beginsWith' ? 'prefix' : 'substring'];
        if (multi)
            hints.push('multi-value');
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        <div class="preview-input">${placeholder} (${hints.join(', ')})</div>
      </div>
    `;
    }
    _renderDateRangePreview(label) {
        const cfg = this.draft.dateRangeConfig ?? {};
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        <phz-date-range-picker
          .config=${cfg}
        ></phz-date-range-picker>
      </div>
    `;
    }
    _renderNumericPreview(label) {
        const cfg = this.draft.numericRangeConfig ?? {};
        const min = cfg.min ?? 0;
        const max = cfg.max ?? 100;
        const unit = cfg.unit ?? '';
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        <div class="preview-range">
          <div class="preview-range-input">${min}${unit ? ' ' + unit : ''}</div>
          <span style="color:#A8A29E">-</span>
          <div class="preview-range-input">${max}${unit ? ' ' + unit : ''}</div>
        </div>
        ${cfg.showSlider ? html `
          <input type="range" class="preview-slider" min=${min} max=${max} disabled>
        ` : nothing}
      </div>
    `;
    }
    _renderTreePreview(label) {
        const preview = this._computeTreePreview();
        const nodes = preview.length > 0 ? preview
            : this._treeOptions.length > 0 ? this._treeOptions
                : [{ value: 'root', label: 'Root Node', children: [{ value: 'child', label: 'Child Node' }] }];
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        ${this._renderTreePreviewNodes(nodes, 0)}
      </div>
    `;
    }
    _renderTreePreviewNodes(nodes, depth) {
        return nodes.map(n => html `
      <div class="preview-tree-node" style="padding-left:${depth * 14}px">
        <span class="preview-tree-expand">${n.children?.length ? '\u25BE' : ''}</span>
        <div class="preview-checkbox"></div>
        <span>${n.label || n.value || '...'}</span>
      </div>
      ${n.children?.length ? this._renderTreePreviewNodes(n.children, depth + 1) : nothing}
    `);
    }
    _renderPresencePreview(label) {
        const cfg = this.draft.fieldPresenceConfig ?? { fields: [] };
        const fields = cfg.fields.length > 0 ? cfg.fields : ['field_1', 'field_2'];
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        ${fields.map(f => html `
          <div class="preview-presence-row">
            <div class="preview-presence-dot"></div>
            <span>${f}</span>
            <span style="color:#A8A29E; margin-left:auto; font-size:11px">Any</span>
          </div>
        `)}
      </div>
    `;
    }
    _renderPeriodPreview(label) {
        return html `
      <div class="preview-card">
        <div class="preview-label">${label}</div>
        <div class="chip-group">
          <span class="preview-chip">Q1 2025</span>
          <span class="preview-chip">Q2 2025</span>
          <span class="preview-chip">Q3 2025</span>
        </div>
      </div>
    `;
    }
    /* ── Summary card ── */
    _renderSummaryCard() {
        const dsName = this._selectedDataSourceId
            ? this.dataSources.find(d => d.id === this._selectedDataSourceId)?.name
            : undefined;
        return html `
      <div class="summary-card">
        <div class="summary-row">
          <span class="summary-key">Type</span>
          <span class="type-badge">${this.selectedType.replace(/_/g, ' ')}</span>
        </div>
        ${dsName ? html `
          <div class="summary-row">
            <span class="summary-key">Data Source</span>
            <span class="summary-value">${dsName}</span>
          </div>
        ` : nothing}
        ${this._labelTemplate ? html `
          <div class="summary-row">
            <span class="summary-key">Template</span>
            <span class="summary-value">${this._labelTemplate}</span>
          </div>
        ` : nothing}
        <div class="summary-row">
          <span class="summary-key">Session</span>
          <span class="summary-value">${this.draft.sessionBehavior ?? 'reset'}</span>
        </div>
        ${OPTIONS_TYPES.includes(this.selectedType) ? html `
          <div class="summary-row">
            <span class="summary-key">Options</span>
            <span class="summary-value">${this._options.length}</span>
          </div>
        ` : nothing}
        ${this.selectedType === 'tree_select' ? html `
          <div class="summary-row">
            <span class="summary-key">Levels</span>
            <span class="summary-value">${this._treeLevels.filter(l => l.field).length}</span>
          </div>
          <div class="summary-row">
            <span class="summary-key">Nodes</span>
            <span class="summary-value">${this._countTreeNodes(this._computeTreePreview())}</span>
          </div>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzFilterStudio.prototype, "definition", void 0);
__decorate([
    property({ type: Array })
], PhzFilterStudio.prototype, "availableColumns", void 0);
__decorate([
    property({ type: Array })
], PhzFilterStudio.prototype, "data", void 0);
__decorate([
    property({ type: Array })
], PhzFilterStudio.prototype, "dataSources", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_helpOpen", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "selectedType", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "draft", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_treeSourceDsId", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_treeLevels", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_importColumn", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_validationError", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_selectedDataSourceId", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_selectedValueField", void 0);
__decorate([
    state()
], PhzFilterStudio.prototype, "_labelTemplate", void 0);
PhzFilterStudio = __decorate([
    safeCustomElement('phz-filter-studio')
], PhzFilterStudio);
export { PhzFilterStudio };
//# sourceMappingURL=phz-filter-studio.js.map