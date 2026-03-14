/**
 * @phozart/criteria — Preset Admin
 *
 * Admin UI for managing selection presets: admin preset CRUD,
 * user preset read-only view, scope badges. CSS prefix: phz-pa-
 *
 * Supports two modes:
 * - 'cross-filter' (default): manages SelectionPreset (multi-filter presets)
 * - 'per-filter': manages FilterDefinitionPreset (single-filter presets)
 *
 * Events (cross-filter mode):
 * - preset-create: { preset }
 * - preset-update: { presetId, patch }
 * - preset-delete: { presetId }
 *
 * Events (per-filter mode):
 * - filter-preset-create: { filterDefinitionId, name, value, scope }
 * - filter-preset-update: { presetId, patch }
 * - filter-preset-delete: { presetId }
 * - filter-preset-copy: { sourcePresetId, targetFilterDefinitionId }
 * - filter-preset-contextmenu: { presetId, preset, x, y }
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  SelectionPreset, PresetScope, FilterDefinition,
  FilterDefinitionPreset, SelectionFieldDef, SelectionFieldType,
  FilterDefinitionId, FilterDataSource, SelectionFieldOption,
} from '@phozart/core';
import { resolveLabelTemplate } from '@phozart/core';
import { criteriaStyles } from '../shared-styles.js';

// Ensure sub-components are registered
import './fields/phz-combobox.js';

// --- CtxMenuItem type (shared with filter-designer) ---

interface CtxMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  variant?: 'default' | 'danger';
}

// --- Pure helper functions (exported for testing) ---

/** Convert a FilterDefinition into the SelectionFieldDef shape that <phz-criteria-field> accepts */
export function defToFieldDef(def: FilterDefinition): SelectionFieldDef {
  return {
    id: def.id as string,
    label: def.label,
    type: def.type,
    options: def.options,
    treeOptions: def.treeOptions,
    dateRangeConfig: def.dateRangeConfig,
    numericRangeConfig: def.numericRangeConfig,
    searchConfig: def.searchConfig,
    fieldPresenceConfig: def.fieldPresenceConfig,
    dataField: def.dataField,
    defaultValue: def.defaultValue,
    allowNullValue: def.allowNullValue,
    selectionMode: def.selectionMode,
    required: def.required,
    optionsSource: def.valueSource?.optionsSource,
  };
}

/** Format a filter preset value into display chips */
export function formatPresetValuePreview(
  value: string | string[] | null,
  def: FilterDefinition,
): string[] {
  if (value === null || value === undefined) return ['(All)'];

  if (Array.isArray(value)) {
    return value.map(v => {
      const opt = def.options?.find(o => o.value === v);
      return opt ? opt.label : v;
    });
  }

  // Single string — try JSON parse for date_range / numeric_range
  if (def.type === 'date_range') {
    try {
      const parsed = JSON.parse(value);
      if (parsed.startDate && parsed.endDate) {
        return [parsed.presetLabel ?? `${parsed.startDate} \u2013 ${parsed.endDate}`];
      }
    } catch { /* fallback */ }
    return [value];
  }

  if (def.type === 'numeric_range') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed.min === 'number' && typeof parsed.max === 'number') {
        const unit = def.numericRangeConfig?.unit ?? '';
        return [`${parsed.min}${unit} \u2013 ${parsed.max}${unit}`];
      }
    } catch { /* fallback */ }
    return [value];
  }

  // Resolve label from options
  const opt = def.options?.find(o => o.value === value);
  return [opt ? opt.label : value];
}

/** Check if a preset can be copied between filter types */
export function isFilterTypeCompatible(sourceType: SelectionFieldType, targetType: SelectionFieldType): boolean {
  if (sourceType === targetType) return true;
  const multiGroup = new Set<SelectionFieldType>(['multi_select', 'chip_group']);
  return multiGroup.has(sourceType) && multiGroup.has(targetType);
}

/** Build context menu items for a filter-specific preset card */
export function buildFilterPresetContextItems(preset: FilterDefinitionPreset): CtxMenuItem[] {
  return [
    { id: 'edit-filter-preset', label: 'Edit', icon: '\u270E' },
    { id: 'set-default-filter-preset', label: preset.isDefault ? 'Remove Default' : 'Set as Default', icon: '\u2605' },
    { id: 'copy-filter-preset', label: 'Copy to Filter', icon: '\u29C9' },
    { id: 'sep', label: '', separator: true },
    { id: 'delete-filter-preset', label: 'Delete', icon: '\u2715', variant: 'danger' },
  ];
}

/**
 * Resolve available options for a FilterDefinition.
 * Priority: valueSource.optionsSource (from FilterDataSource) > static options > derive from data via dataField.
 */
export function resolveDefinitionOptions(
  def: FilterDefinition,
  dataSources: FilterDataSource[],
  data: Record<string, unknown>[],
): SelectionFieldOption[] {
  // Priority 1: external dataset via valueSource.optionsSource
  const src = def.valueSource?.optionsSource;
  if (src) {
    const ds = dataSources.find(d => d.id === src.dataSetId);
    const rows = ds?.sampleRows;
    if (rows && rows.length > 0) {
      const seen = new Set<string>();
      const options: SelectionFieldOption[] = [];
      for (const row of rows) {
        const rawVal = row[src.valueField];
        if (rawVal == null || rawVal === '') continue;
        const val = String(rawVal);
        if (seen.has(val)) continue;
        seen.add(val);
        const label = src.labelTemplate
          ? resolveLabelTemplate(src.labelTemplate, row)
          : (src.labelField ? String(row[src.labelField] ?? val) : val);
        options.push({ value: val, label });
      }
      options.sort((a, b) => a.label.localeCompare(b.label));
      return options;
    }
  }

  // Priority 2: static options on the definition
  if (def.options && def.options.length > 0) {
    return def.options;
  }

  // Priority 3: derive from data via dataField
  if (data.length > 0 && def.dataField) {
    const seen = new Set<string>();
    const options: SelectionFieldOption[] = [];
    for (const row of data) {
      const raw = row[def.dataField];
      if (raw == null || raw === '') continue;
      const val = String(raw);
      if (!seen.has(val)) {
        seen.add(val);
        options.push({ value: val, label: val });
      }
    }
    options.sort((a, b) => a.label.localeCompare(b.label));
    return options;
  }

  return [];
}

@customElement('phz-preset-admin')
export class PhzPresetAdmin extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; height: 100%; }

    .phz-pa-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #FAFAF9;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      overflow: hidden;
    }

    .phz-pa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #FFFFFF;
      border-bottom: 1px solid #E7E5E4;
    }

    .phz-pa-title {
      font-size: 14px;
      font-weight: 700;
      color: #1C1917;
    }

    .phz-pa-tabs {
      display: flex;
      border-bottom: 1px solid #E7E5E4;
      background: #FFFFFF;
    }

    .phz-pa-tab {
      flex: 1;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #78716C;
      cursor: pointer;
      border: none;
      background: none;
      border-bottom: 2px solid transparent;
      text-align: center;
      font-family: inherit;
    }

    .phz-pa-tab:hover { color: #44403C; }
    .phz-pa-tab--active { color: #1C1917; border-bottom-color: #1C1917; }

    .phz-pa-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .phz-pa-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .phz-pa-card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 12px;
    }

    .phz-pa-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .phz-pa-card-name {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
      flex: 1;
    }

    .phz-pa-scope-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .phz-pa-scope-badge--shared {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .phz-pa-scope-badge--personal {
      background: #DCFCE7;
      color: #166534;
    }

    .phz-pa-card-meta {
      font-size: 11px;
      color: #A8A29E;
      margin-top: 4px;
    }

    .phz-pa-card-values {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }

    .phz-pa-value-chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      background: #F5F5F4;
      color: #44403C;
    }

    .phz-pa-card-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .phz-pa-default-badge {
      font-size: 10px;
      font-weight: 600;
      color: #D97706;
      background: #FEF3C7;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .phz-pa-empty {
      text-align: center;
      padding: 32px;
      color: #A8A29E;
      font-size: 13px;
    }

    /* -- Filter selector -- */
    .phz-pa-filter-selector {
      margin-bottom: 12px;
    }

    .phz-pa-filter-selector label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #44403C;
      margin-bottom: 4px;
    }

    /* -- Modal -- */
    .phz-pa-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(28, 25, 23, 0.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .phz-pa-modal-panel {
      background: #FFFFFF;
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(28,25,23,0.18);
      width: 420px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .phz-pa-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid #E7E5E4;
    }

    .phz-pa-modal-title {
      font-size: 14px;
      font-weight: 700;
      color: #1C1917;
    }

    .phz-pa-modal-close {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 16px;
      color: #78716C;
      padding: 4px;
    }

    .phz-pa-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .phz-pa-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 18px;
      border-top: 1px solid #E7E5E4;
    }

    .phz-pa-field-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .phz-pa-field-label {
      font-size: 12px;
      font-weight: 600;
      color: #44403C;
    }

    /* -- Checkbox option list -- */
    .phz-pa-option-list {
      border: 1px solid #E7E5E4;
      border-radius: 8px;
      max-height: 260px;
      overflow-y: auto;
    }

    .phz-pa-option-search {
      position: sticky;
      top: 0;
      padding: 8px;
      background: #FFFFFF;
      border-bottom: 1px solid #E7E5E4;
      z-index: 1;
    }

    .phz-pa-option-search input {
      width: 100%;
      box-sizing: border-box;
    }

    .phz-pa-option-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 13px;
      color: #1C1917;
      user-select: none;
      border-bottom: 1px solid #F5F5F4;
    }

    .phz-pa-option-item:last-child { border-bottom: none; }
    .phz-pa-option-item:hover { background: #FAFAF9; }

    .phz-pa-option-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      accent-color: #1C1917;
    }

    .phz-pa-option-label { flex: 1; }

    .phz-pa-option-value {
      font-size: 11px;
      color: #A8A29E;
      flex-shrink: 0;
    }

    .phz-pa-option-actions {
      display: flex;
      gap: 8px;
      padding: 6px 10px;
      font-size: 11px;
      color: #78716C;
      border-bottom: 1px solid #E7E5E4;
      background: #FAFAF9;
    }

    .phz-pa-option-actions button {
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      color: #2563EB;
      padding: 0;
    }

    .phz-pa-option-actions button:hover { text-decoration: underline; }

    .phz-pa-selection-count {
      font-size: 11px;
      color: #78716C;
      margin-top: 4px;
    }

    .phz-pa-no-options {
      padding: 16px;
      text-align: center;
      color: #A8A29E;
      font-size: 12px;
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-pa-modal-backdrop { transition: none; }
    }
  `];

  // -- Cross-filter mode properties --
  @property({ type: Array }) sharedPresets: SelectionPreset[] = [];
  @property({ type: Array }) userPresets: SelectionPreset[] = [];

  // -- Per-filter mode properties --
  @property({ type: String }) mode: 'cross-filter' | 'per-filter' = 'cross-filter';
  @property({ type: Array }) definitions: FilterDefinition[] = [];
  @property({ type: Array }) filterPresets: FilterDefinitionPreset[] = [];
  @property({ type: Array }) dataSources: FilterDataSource[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];

  // -- Internal state --
  @state() private _tab: 'shared' | 'personal' = 'shared';

  // Per-filter state
  @state() private _selectedDefId: FilterDefinitionId | null = null;
  @state() private _modalOpen = false;
  @state() private _editingPreset: FilterDefinitionPreset | null = null;
  @state() private _modalName = '';
  @state() private _modalValue: string | string[] | null = null;
  @state() private _modalSearch = '';
  @state() private _copyModalOpen = false;
  @state() private _copySourcePreset: FilterDefinitionPreset | null = null;
  @state() private _copyTargetDefId: FilterDefinitionId | null = null;

  render() {
    if (this.mode === 'per-filter') return this._renderPerFilterMode();
    return this._renderCrossFilterMode();
  }

  // ============================
  // Cross-filter mode (existing)
  // ============================

  private _renderCrossFilterMode() {
    return html`
      <div class="phz-pa-root" @contextmenu=${(e: MouseEvent) => this._handleBgContextMenu(e)}>
        <div class="phz-pa-header">
          <span class="phz-pa-title">Presets</span>
          <button class="phz-sc-btn phz-sc-btn--primary"
                  @click=${() => this._dispatchEvent('preset-create', { scope: this._tab })}>+ New</button>
        </div>
        <div class="phz-pa-tabs">
          <button class="phz-pa-tab ${this._tab === 'shared' ? 'phz-pa-tab--active' : ''}"
                  @click=${() => this._tab = 'shared'}>
            Shared (${(this.sharedPresets ?? []).length})
          </button>
          <button class="phz-pa-tab ${this._tab === 'personal' ? 'phz-pa-tab--active' : ''}"
                  @click=${() => this._tab = 'personal'}>
            Personal (${(this.userPresets ?? []).length})
          </button>
        </div>
        <div class="phz-pa-body">
          <div class="phz-pa-list">
            ${this._currentPresets.length === 0 ? html`<div class="phz-pa-empty">No presets</div>` : nothing}
            ${this._currentPresets.map(p => this._renderPreset(p))}
          </div>
        </div>
      </div>
    `;
  }

  private get _currentPresets(): SelectionPreset[] {
    return this._tab === 'shared' ? this.sharedPresets : this.userPresets;
  }

  private _renderPreset(preset: SelectionPreset) {
    const valueEntries = Object.entries(preset.values ?? {}).filter(([, v]) => v !== null);
    const isReadOnly = this._tab === 'personal';

    return html`
      <div class="phz-pa-card"
           @contextmenu=${(e: MouseEvent) => this._handleCardContextMenu(e, preset)}>
        <div class="phz-pa-card-header">
          <span class="phz-pa-card-name">${preset.name}</span>
          <span class="phz-pa-scope-badge phz-pa-scope-badge--${preset.scope}">${preset.scope}</span>
          ${preset.isDefault ? html`<span class="phz-pa-default-badge">Default</span>` : nothing}
        </div>
        <div class="phz-pa-card-meta">
          By ${preset.owner} \u00B7 ${new Date(preset.updated).toLocaleDateString()}
        </div>
        ${valueEntries.length > 0 ? html`
          <div class="phz-pa-card-values">
            ${valueEntries.slice(0, 5).map(([key, val]) => html`
              <span class="phz-pa-value-chip">${key}: ${Array.isArray(val) ? val.join(', ') : val}</span>
            `)}
            ${valueEntries.length > 5 ? html`<span class="phz-pa-value-chip">+${valueEntries.length - 5} more</span>` : nothing}
          </div>
        ` : nothing}
        ${!isReadOnly ? html`
          <div class="phz-pa-card-actions">
            <button class="phz-sc-btn" style="font-size:11px"
                    @click=${() => this._dispatchEvent('preset-update', { presetId: preset.id })}>Edit</button>
            <button class="phz-sc-btn" style="color:#DC2626;font-size:11px"
                    @click=${() => this._dispatchEvent('preset-delete', { presetId: preset.id })}>Delete</button>
          </div>
        ` : nothing}
      </div>
    `;
  }

  // ============================
  // Per-filter mode (new)
  // ============================

  private _renderPerFilterMode() {
    const activeDefs = (this.definitions ?? []).filter(d => !d.deprecated);
    const comboOpts = activeDefs.map(d => ({ value: d.id as string, label: d.label }));
    const selectedDef = this._selectedDefId
      ? (this.definitions ?? []).find(d => d.id === this._selectedDefId) ?? null
      : null;

    const filteredPresets = this._selectedDefId
      ? (this.filterPresets ?? []).filter(p => p.filterDefinitionId === this._selectedDefId)
      : [];

    return html`
      <div class="phz-pa-root">
        <div class="phz-pa-header">
          <span class="phz-pa-title">Filter Presets</span>
          ${this._selectedDefId ? html`
            <button class="phz-sc-btn phz-sc-btn--primary"
                    @click=${() => this._openCreateModal()}>+ New Preset</button>
          ` : nothing}
        </div>
        <div class="phz-pa-body">
          <div class="phz-pa-filter-selector">
            <label>Filter</label>
            <phz-combobox
              .options=${comboOpts}
              .value=${(this._selectedDefId as string) ?? ''}
              allow-empty
              empty-label="\u2014 Select a filter \u2014"
              @combobox-change=${(e: CustomEvent) => {
                const val = (e.detail as { value: string }).value;
                this._selectedDefId = val ? val as FilterDefinitionId : null;
              }}
            ></phz-combobox>
          </div>

          ${!this._selectedDefId ? html`
            <div class="phz-pa-empty">Select a filter above to manage its presets.</div>
          ` : nothing}

          ${this._selectedDefId && filteredPresets.length === 0 ? html`
            <div class="phz-pa-empty">No presets for this filter. Click \u201C+ New Preset\u201D to create one.</div>
          ` : nothing}

          ${filteredPresets.length > 0 ? html`
            <div class="phz-pa-list">
              ${filteredPresets.map(fp => this._renderFilterPresetCard(fp, selectedDef!))}
            </div>
          ` : nothing}
        </div>
      </div>

      ${this._modalOpen ? this._renderFilterPresetModal(selectedDef) : nothing}
      ${this._copyModalOpen ? this._renderCopyModal() : nothing}
    `;
  }

  private _renderFilterPresetCard(preset: FilterDefinitionPreset, def: FilterDefinition) {
    const chips = formatPresetValuePreview(preset.value, def);

    return html`
      <div class="phz-pa-card"
           @contextmenu=${(e: MouseEvent) => this._handleFilterPresetContextMenu(e, preset)}>
        <div class="phz-pa-card-header">
          <span class="phz-pa-card-name">${preset.name}</span>
          <span class="phz-pa-scope-badge phz-pa-scope-badge--${preset.scope}">${preset.scope}</span>
          ${preset.isDefault ? html`<span class="phz-pa-default-badge">Default</span>` : nothing}
        </div>
        <div class="phz-pa-card-meta">
          By ${preset.owner} \u00B7 ${new Date(preset.updated).toLocaleDateString()}
        </div>
        <div class="phz-pa-card-values">
          ${chips.map(c => html`<span class="phz-pa-value-chip">${c}</span>`)}
        </div>
        <div class="phz-pa-card-actions">
          <button class="phz-sc-btn" style="font-size:11px"
                  @click=${() => this._openEditModal(preset)}>Edit</button>
          <button class="phz-sc-btn" style="font-size:11px"
                  @click=${() => this._openCopyModal(preset)}>Copy</button>
          <button class="phz-sc-btn" style="color:#DC2626;font-size:11px"
                  @click=${() => this._dispatchEvent('filter-preset-delete', { presetId: preset.id })}>Delete</button>
        </div>
      </div>
    `;
  }

  // -- Create/Edit Modal --

  private _renderFilterPresetModal(def: FilterDefinition | null) {
    if (!def) return nothing;
    const isEdit = !!this._editingPreset;
    const title = isEdit ? 'Edit Preset' : 'New Preset';
    const allOptions = resolveDefinitionOptions(def, this.dataSources, this.data);
    const selectedValues = Array.isArray(this._modalValue) ? this._modalValue : (this._modalValue ? [this._modalValue] : []);
    const searchLower = this._modalSearch.toLowerCase();
    const visibleOptions = searchLower
      ? allOptions.filter(o => o.label.toLowerCase().includes(searchLower) || o.value.toLowerCase().includes(searchLower))
      : allOptions;

    return html`
      <div class="phz-pa-modal-backdrop" @click=${() => this._closeModal()}
           @keydown=${(e: KeyboardEvent) => { if (e.key === 'Escape') this._closeModal(); }}>
        <div class="phz-pa-modal-panel" @click=${(e: Event) => e.stopPropagation()}
             role="dialog" aria-modal="true" aria-label=${title}>
          <div class="phz-pa-modal-header">
            <span class="phz-pa-modal-title">${title}</span>
            <button class="phz-pa-modal-close" @click=${() => this._closeModal()}
                    aria-label="Close">\u2715</button>
          </div>
          <div class="phz-pa-modal-body">
            <div class="phz-pa-field-row">
              <label class="phz-pa-field-label">Name</label>
              <input class="phz-sc-input" .value=${this._modalName}
                     @input=${(e: Event) => this._modalName = (e.target as HTMLInputElement).value}
                     placeholder="e.g. Eastern Regions">
            </div>
            <div class="phz-pa-field-row">
              <label class="phz-pa-field-label">Values (${selectedValues.length} of ${allOptions.length} selected)</label>
              ${allOptions.length > 0 ? html`
                <div class="phz-pa-option-list">
                  ${allOptions.length > 8 ? html`
                    <div class="phz-pa-option-search">
                      <input class="phz-sc-input" type="text"
                             placeholder="Search options..."
                             .value=${this._modalSearch}
                             @input=${(e: Event) => this._modalSearch = (e.target as HTMLInputElement).value}>
                    </div>
                  ` : nothing}
                  <div class="phz-pa-option-actions">
                    <button @click=${() => this._selectAllVisible(visibleOptions)}>Select all${searchLower ? ' visible' : ''}</button>
                    <button @click=${() => this._deselectAllVisible(visibleOptions)}>Deselect all${searchLower ? ' visible' : ''}</button>
                  </div>
                  ${visibleOptions.map(o => {
                    const checked = selectedValues.includes(o.value);
                    return html`
                      <label class="phz-pa-option-item">
                        <input type="checkbox"
                               .checked=${checked}
                               @change=${() => this._toggleOption(o.value)}>
                        <span class="phz-pa-option-label">${o.label}</span>
                        ${o.label !== o.value ? html`<span class="phz-pa-option-value">${o.value}</span>` : nothing}
                      </label>
                    `;
                  })}
                  ${visibleOptions.length === 0 && searchLower ? html`
                    <div class="phz-pa-no-options">No options match \u201C${this._modalSearch}\u201D</div>
                  ` : nothing}
                </div>
              ` : html`
                <div class="phz-pa-no-options">
                  No options available. Configure a data source or static options on this filter definition.
                </div>
              `}
            </div>
          </div>
          <div class="phz-pa-modal-footer">
            <button class="phz-sc-btn" @click=${() => this._closeModal()}>Cancel</button>
            <button class="phz-sc-btn phz-sc-btn--primary"
                    ?disabled=${!this._modalName.trim()}
                    @click=${() => this._saveFilterPreset()}>
              ${isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _toggleOption(value: string) {
    const current = Array.isArray(this._modalValue) ? [...this._modalValue] : (this._modalValue ? [this._modalValue] : []);
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    this._modalValue = current.length > 0 ? current : null;
  }

  private _selectAllVisible(visible: SelectionFieldOption[]) {
    const current = new Set(Array.isArray(this._modalValue) ? this._modalValue : (this._modalValue ? [this._modalValue] : []));
    for (const o of visible) current.add(o.value);
    const arr = Array.from(current);
    this._modalValue = arr.length > 0 ? arr : null;
  }

  private _deselectAllVisible(visible: SelectionFieldOption[]) {
    const toRemove = new Set(visible.map(o => o.value));
    const current = Array.isArray(this._modalValue) ? this._modalValue : (this._modalValue ? [this._modalValue] : []);
    const remaining = current.filter(v => !toRemove.has(v));
    this._modalValue = remaining.length > 0 ? remaining : null;
  }

  // -- Copy Modal --

  private _renderCopyModal() {
    if (!this._copySourcePreset) return nothing;
    const sourceDef = (this.definitions ?? []).find(d => d.id === this._copySourcePreset!.filterDefinitionId);
    if (!sourceDef) return nothing;

    const compatibleDefs = (this.definitions ?? []).filter(d =>
      !d.deprecated
      && d.id !== this._copySourcePreset!.filterDefinitionId
      && isFilterTypeCompatible(sourceDef.type, d.type)
    );
    const comboOpts = compatibleDefs.map(d => ({ value: d.id as string, label: d.label }));

    return html`
      <div class="phz-pa-modal-backdrop" @click=${() => this._closeCopyModal()}
           @keydown=${(e: KeyboardEvent) => { if (e.key === 'Escape') this._closeCopyModal(); }}>
        <div class="phz-pa-modal-panel" @click=${(e: Event) => e.stopPropagation()}
             role="dialog" aria-modal="true" aria-label="Copy Preset">
          <div class="phz-pa-modal-header">
            <span class="phz-pa-modal-title">Copy Preset</span>
            <button class="phz-pa-modal-close" @click=${() => this._closeCopyModal()}
                    aria-label="Close">\u2715</button>
          </div>
          <div class="phz-pa-modal-body">
            <div class="phz-pa-field-row">
              <label class="phz-pa-field-label">Source</label>
              <span style="font-size:13px;color:#1C1917">${this._copySourcePreset.name}</span>
            </div>
            <div class="phz-pa-field-row">
              <label class="phz-pa-field-label">Target Filter</label>
              ${compatibleDefs.length === 0 ? html`
                <span style="font-size:12px;color:#A8A29E">No compatible filters found.</span>
              ` : html`
                <phz-combobox
                  .options=${comboOpts}
                  .value=${(this._copyTargetDefId as string) ?? ''}
                  allow-empty
                  empty-label="\u2014 Select target filter \u2014"
                  @combobox-change=${(e: CustomEvent) => {
                    const val = (e.detail as { value: string }).value;
                    this._copyTargetDefId = val ? val as FilterDefinitionId : null;
                  }}
                ></phz-combobox>
              `}
            </div>
          </div>
          <div class="phz-pa-modal-footer">
            <button class="phz-sc-btn" @click=${() => this._closeCopyModal()}>Cancel</button>
            <button class="phz-sc-btn phz-sc-btn--primary"
                    ?disabled=${!this._copyTargetDefId}
                    @click=${() => this._executeCopy()}>
              Copy
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // -- Per-filter mode actions --

  private _openCreateModal() {
    this._editingPreset = null;
    this._modalName = '';
    this._modalValue = null;
    this._modalSearch = '';
    this._modalOpen = true;
  }

  private _openEditModal(preset: FilterDefinitionPreset) {
    this._editingPreset = preset;
    this._modalName = preset.name;
    this._modalValue = preset.value;
    this._modalSearch = '';
    this._modalOpen = true;
  }

  private _closeModal() {
    this._modalOpen = false;
    this._editingPreset = null;
    this._modalSearch = '';
  }

  private _saveFilterPreset() {
    const name = this._modalName.trim();
    if (!name) return;

    if (this._editingPreset) {
      this._dispatchEvent('filter-preset-update', {
        presetId: this._editingPreset.id,
        patch: { name, value: this._modalValue },
      });
    } else {
      this._dispatchEvent('filter-preset-create', {
        filterDefinitionId: this._selectedDefId as string,
        name,
        value: this._modalValue,
        scope: 'shared',
      });
    }
    this._closeModal();
  }

  private _openCopyModal(preset: FilterDefinitionPreset) {
    this._copySourcePreset = preset;
    this._copyTargetDefId = null;
    this._copyModalOpen = true;
  }

  private _closeCopyModal() {
    this._copyModalOpen = false;
    this._copySourcePreset = null;
    this._copyTargetDefId = null;
  }

  private _executeCopy() {
    if (!this._copySourcePreset || !this._copyTargetDefId) return;
    this._dispatchEvent('filter-preset-copy', {
      sourcePresetId: this._copySourcePreset.id,
      targetFilterDefinitionId: this._copyTargetDefId as string,
    });
    this._closeCopyModal();
  }

  private _handleFilterPresetContextMenu(e: MouseEvent, preset: FilterDefinitionPreset) {
    e.preventDefault();
    e.stopPropagation();
    this._dispatchEvent('filter-preset-contextmenu', {
      presetId: preset.id,
      preset: { ...preset },
      x: e.clientX,
      y: e.clientY,
    });
  }

  // -- Cross-filter context menu handlers --

  private _handleCardContextMenu(e: MouseEvent, preset: SelectionPreset) {
    e.preventDefault();
    e.stopPropagation();
    this._dispatchEvent('preset-contextmenu', {
      presetId: preset.id,
      preset: { ...preset },
      scope: this._tab,
      x: e.clientX,
      y: e.clientY,
    });
  }

  private _handleBgContextMenu(e: MouseEvent) {
    const path = e.composedPath();
    const isCard = path.some(
      el => el instanceof HTMLElement && el.classList?.contains('phz-pa-card')
    );
    if (isCard) return;
    e.preventDefault();
    this._dispatchEvent('presets-bg-contextmenu', {
      scope: this._tab,
      x: e.clientX,
      y: e.clientY,
    });
  }

  private _dispatchEvent(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}
