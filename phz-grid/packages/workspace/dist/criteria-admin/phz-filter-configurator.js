/**
 * @phozart/criteria — Filter Configurator
 *
 * Configure which filter definitions appear on a specific report/dashboard,
 * assign data columns, set per-binding overrides. Single-view (no tabs).
 *
 * Composes engine-admin's <phz-filter-picker> via dynamic import for rich
 * definition selection; falls back to a checkbox list if engine-admin isn't installed.
 * Picker panel is provided by <phz-filter-drawer>.
 *
 * CSS prefix: phz-fc-
 *
 * Events:
 * - binding-add: { bindings: FilterBinding[] }
 * - binding-remove: { filterDefinitionId, artefactId }
 * - binding-update: { filterDefinitionId, artefactId, patch }
 * - binding-reorder: { artefactId, orderedIds }
 * - open-designer: {}
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { filterDefinitionId, artefactId as toArtefactId } from '@phozart/core';
import { criteriaStyles } from '@phozart/criteria/shared-styles';
// Ensure sub-components are registered (side-effect imports)
// Consumer component — registered via @phozart/criteria
import '@phozart/criteria';
/** Filter types that support a selectionMode override */
const HAS_SELECTION_MODE = ['single_select', 'multi_select', 'chip_group', 'tree_select', 'search'];
/** Drag-handle grip icon (3-line) */
const iconGrip = html `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
/** Close / remove icon (X) */
const iconX = html `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const CONFIGURATOR_HELP = {
    title: 'What are Filter Bindings?',
    body: 'A binding is an instance of a filter definition scoped to a specific report or dashboard. Bindings control which filters appear, in what order, and allow per-report overrides without changing the shared definition.',
    tips: [
        'Each binding links one filter definition to this artefact \u2014 add as many as needed',
        'Per-binding overrides \u2014 Change the label, allowed values, default selection, visibility, or selection mode for this report only',
        'Data Column \u2014 Map the filter to a different data column than the definition\u2019s default',
        'Display Order \u2014 Drag cards to reorder; the number on the left shows the current position',
        'Hidden Filters \u2014 Toggle visibility off to apply a filter behind the scenes without showing it to users',
    ],
};
let PhzFilterConfigurator = class PhzFilterConfigurator extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.definitions = [];
        this.bindings = [];
        this.artefactId = '';
        this.artefactName = '';
        this.availableColumns = [];
        // --- Internal state ---
        this._helpOpen = false;
        this._expandedId = null;
        this._pickerOpen = false;
        this._hasPicker = false;
        this._pickerChecked = false;
        this._pickerSelected = new Set();
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: block; height: 100%; }

    .phz-fc-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #FAFAF9;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      overflow: hidden;
    }

    .phz-fc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #FFFFFF;
      border-bottom: 1px solid #E7E5E4;
    }

    .phz-fc-title {
      font-size: 14px;
      font-weight: 700;
      color: #1C1917;
    }

    .phz-fc-subtitle {
      font-size: 11px;
      color: #78716C;
      margin-top: 2px;
    }

    .phz-fc-header-actions {
      display: flex;
      gap: 6px;
    }

    .phz-fc-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .phz-fc-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* -- Binding card -- */
    .phz-fc-card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.15s;
    }

    .phz-fc-card:hover { border-color: #A8A29E; }

    .phz-fc-card-collapsed {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
    }

    .phz-fc-card-order {
      font-size: 11px;
      font-weight: 700;
      color: #A8A29E;
      min-width: 20px;
      text-align: center;
    }

    .phz-fc-card-label {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .phz-fc-card-type {
      font-size: 11px;
      color: #78716C;
      background: #F5F5F4;
      padding: 2px 8px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .phz-fc-toggle {
      width: 36px;
      height: 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .phz-fc-toggle--on { background: #1C1917; }
    .phz-fc-toggle--off { background: #D6D3D1; }

    .phz-fc-toggle::after {
      content: '';
      position: absolute;
      top: 2px;
      width: 16px;
      height: 16px;
      border-radius: 8px;
      background: #FFFFFF;
      transition: left 0.2s;
    }

    .phz-fc-toggle--on::after { left: 18px; }
    .phz-fc-toggle--off::after { left: 2px; }

    .phz-fc-card-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: none;
      border: none;
      color: #A8A29E;
      cursor: pointer;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .phz-fc-card-remove:hover { color: #DC2626; background: #FEF2F2; }

    .phz-fc-card-drag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      color: #D6D3D1;
      flex-shrink: 0;
      user-select: none;
    }

    /* -- Expanded override form -- */
    .phz-fc-card-expanded {
      border-top: 1px solid #E7E5E4;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #FAFAF9;
    }

    .phz-fc-form-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .phz-fc-inherited {
      font-size: 11px;
      color: #A8A29E;
      font-style: italic;
    }

    .phz-fc-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .phz-fc-toggle-label {
      font-size: 12px;
      color: #44403C;
    }

    /* -- Segmented control -- */
    .phz-fc-segmented {
      display: flex;
      border: 1px solid #D6D3D1;
      border-radius: 6px;
      overflow: hidden;
    }

    .phz-fc-seg-btn {
      flex: 1;
      padding: 5px 8px;
      font-size: 11px;
      border: none;
      background: white;
      cursor: pointer;
      font-family: inherit;
      color: #44403C;
      border-right: 1px solid #D6D3D1;
    }

    .phz-fc-seg-btn:last-child { border-right: none; }
    .phz-fc-seg-btn--active { background: #1C1917; color: white; }

    /* -- Empty state -- */
    .phz-fc-empty {
      text-align: center;
      padding: 32px;
      color: #A8A29E;
      font-size: 13px;
    }

    /* -- Picker fallback (checkbox list) -- */
    .phz-fc-picker-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 0 16px;
    }

    .phz-fc-picker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      color: #1C1917;
    }

    .phz-fc-picker-item:hover { background: #F5F5F4; }

    .phz-fc-picker-item input { accent-color: #1C1917; }

    /* -- Help / Guidance -- */
    .phz-fc-help {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 10px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .phz-fc-help-toggle {
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

    .phz-fc-help-toggle:hover { background: rgba(251, 191, 36, 0.08); }

    .phz-fc-help-chevron {
      transition: transform 0.2s;
      font-size: 10px;
      flex-shrink: 0;
    }

    .phz-fc-help-chevron--open { transform: rotate(90deg); }

    .phz-fc-help-body {
      padding: 0 14px 12px;
      font-size: 12px;
      color: #78350F;
      line-height: 1.5;
    }

    .phz-fc-help-body p { margin: 0 0 8px; }

    .phz-fc-help-tips {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .phz-fc-help-tips li {
      padding: 3px 0;
      position: relative;
      padding-left: 16px;
    }

    .phz-fc-help-tips li::before {
      content: '\u2022';
      position: absolute;
      left: 4px;
      color: #D97706;
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-fc-help-chevron { transition: none; }
    }
  `]; }
    render() {
        const sorted = [...this.bindings].sort((a, b) => a.order - b.order);
        return html `
      <div class="phz-fc-root">
        <div class="phz-fc-header">
          <div>
            <div class="phz-fc-title">Filters for ${this.artefactName || this.artefactId || 'Artefact'}</div>
            <div class="phz-fc-subtitle">${sorted.length} filter${sorted.length !== 1 ? 's' : ''} bound</div>
          </div>
          <div class="phz-fc-header-actions">
            <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._openPicker}>Add Filters</button>
            <button class="phz-sc-btn" @click=${() => this._dispatchEvent('open-designer', {})}>New Definition</button>
          </div>
        </div>
        <div class="phz-fc-body">
          ${this._renderHelp()}
          <div class="phz-fc-list">
            ${sorted.length === 0 ? html `<div class="phz-fc-empty">No filters bound to this artefact yet</div>` : nothing}
            ${sorted.map((binding, idx) => this._renderBindingCard(binding, idx))}
          </div>
        </div>
      </div>
      ${this._renderPickerDrawer()}
    `;
    }
    // -- Help / Guidance Panel --
    _renderHelp() {
        return html `
      <div class="phz-fc-help">
        <button class="phz-fc-help-toggle" @click=${() => { this._helpOpen = !this._helpOpen; }}
                aria-expanded="${this._helpOpen}">
          <span class="phz-fc-help-chevron ${this._helpOpen ? 'phz-fc-help-chevron--open' : ''}"
                aria-hidden="true">\u25B6</span>
          <span>${CONFIGURATOR_HELP.title}</span>
        </button>
        ${this._helpOpen ? html `
          <div class="phz-fc-help-body">
            <p>${CONFIGURATOR_HELP.body}</p>
            <ul class="phz-fc-help-tips">
              ${CONFIGURATOR_HELP.tips.map(t => html `<li>${t}</li>`)}
            </ul>
          </div>
        ` : nothing}
      </div>
    `;
    }
    // -- Binding cards --
    _renderBindingCard(binding, idx) {
        const def = (this.definitions ?? []).find(d => d.id === binding.filterDefinitionId);
        const label = binding.labelOverride || def?.label || binding.filterDefinitionId;
        const isExpanded = this._expandedId === binding.filterDefinitionId;
        return html `
      <div class="phz-fc-card">
        <div class="phz-fc-card-collapsed"
             @click=${() => this._expandedId = isExpanded ? null : binding.filterDefinitionId}>
          <span class="phz-fc-card-drag" title="Drag to reorder">${iconGrip}</span>
          <span class="phz-fc-card-order">${idx + 1}</span>
          <span class="phz-fc-card-label">${label}</span>
          ${def ? html `<span class="phz-fc-card-type">${def.type.replace(/_/g, ' ')}</span>` : nothing}
          <button class="phz-fc-toggle ${binding.visible ? 'phz-fc-toggle--on' : 'phz-fc-toggle--off'}"
                  @click=${(e) => { e.stopPropagation(); this._toggleVisibility(binding); }}
                  aria-label="${binding.visible ? 'Hide' : 'Show'} filter"
                  title="${binding.visible ? 'Visible' : 'Hidden'}"></button>
          <button class="phz-fc-card-remove"
                  @click=${(e) => { e.stopPropagation(); this._removeBinding(binding); }}
                  title="Remove binding"
                  aria-label="Remove filter">${iconX}</button>
        </div>
        ${isExpanded ? this._renderExpandedForm(binding, def) : nothing}
      </div>
    `;
    }
    _renderExpandedForm(binding, def) {
        return html `
      <div class="phz-fc-card-expanded">
        <!-- Data Column Override -->
        <div class="phz-fc-form-row">
          <label class="phz-sc-field-label">Data Column</label>
          ${def?.dataField ? html `<span class="phz-fc-inherited">Inherited: ${def.dataField}</span>` : nothing}
          ${(this.availableColumns ?? []).length > 0 ? html `
            <phz-combobox
              .options=${(this.availableColumns ?? []).map(c => ({ value: c, label: c }))}
              .value=${binding.dataFieldOverride || ''}
              empty-label=${def?.dataField ? `Inherit (${def.dataField})` : '\u2014 None \u2014'}
              allow-empty
              @combobox-change=${(e) => this._updateBinding(binding, {
            dataFieldOverride: e.detail.value || undefined,
        })}
            ></phz-combobox>
          ` : html `
            <input class="phz-sc-input"
                   .value=${binding.dataFieldOverride || ''}
                   @change=${(e) => this._updateBinding(binding, {
            dataFieldOverride: e.target.value || undefined,
        })}
                   placeholder="${def?.dataField ? `Inherit (${def.dataField})` : 'Column name'}">
          `}
        </div>

        <!-- Label Override -->
        <div class="phz-fc-form-row">
          <label class="phz-sc-field-label">Label Override</label>
          <input class="phz-sc-input"
                 .value=${binding.labelOverride || ''}
                 @change=${(e) => this._updateBinding(binding, {
            labelOverride: e.target.value || undefined,
        })}
                 placeholder="${def?.label || 'Default label'}">
        </div>

        <!-- Required Override -->
        <div class="phz-fc-toggle-row">
          <span class="phz-fc-toggle-label">Required</span>
          <button class="phz-fc-toggle ${binding.requiredOverride ? 'phz-fc-toggle--on' : 'phz-fc-toggle--off'}"
                  @click=${() => this._updateBinding(binding, { requiredOverride: !binding.requiredOverride })}
                  aria-label="Toggle required"></button>
        </div>

        <!-- Selection Mode Override (only for applicable types) -->
        ${def && HAS_SELECTION_MODE.includes(def.type) ? html `
          <div class="phz-fc-form-row">
            <label class="phz-sc-field-label">Selection Mode</label>
            ${def.selectionMode ? html `<span class="phz-fc-inherited">Inherited: ${def.selectionMode}</span>` : nothing}
            <div class="phz-fc-segmented">
              ${['single', 'multiple', 'none'].map(m => html `
                <button class="phz-fc-seg-btn ${(binding.selectionModeOverride ?? def.selectionMode ?? (def.type === 'single_select' ? 'single' : 'multiple')) === m ? 'phz-fc-seg-btn--active' : ''}"
                        @click=${() => this._updateBinding(binding, { selectionModeOverride: m })}>${m[0].toUpperCase() + m.slice(1)}</button>
              `)}
            </div>
          </div>
        ` : nothing}

        <!-- Allow Null Value Override -->
        <div class="phz-fc-toggle-row">
          <span class="phz-fc-toggle-label">Allow Null Value</span>
          ${def?.allowNullValue ? html `<span class="phz-fc-inherited" style="margin-right:auto">Inherited: Yes</span>` : nothing}
          <button class="phz-fc-toggle ${binding.allowNullValueOverride ? 'phz-fc-toggle--on' : 'phz-fc-toggle--off'}"
                  @click=${() => this._updateBinding(binding, { allowNullValueOverride: !binding.allowNullValueOverride })}
                  aria-label="Toggle allow null value"></button>
        </div>

        <!-- Bar Config Overrides -->
        <div class="phz-fc-toggle-row">
          <span class="phz-fc-toggle-label">Pinned to Bar</span>
          <button class="phz-fc-toggle ${binding.barConfigOverride?.pinnedToBar ? 'phz-fc-toggle--on' : 'phz-fc-toggle--off'}"
                  @click=${() => this._updateBarConfig(binding, { pinnedToBar: !binding.barConfigOverride?.pinnedToBar })}
                  aria-label="Toggle pinned to bar"></button>
        </div>

        <div class="phz-fc-toggle-row">
          <span class="phz-fc-toggle-label">Default Open</span>
          <button class="phz-fc-toggle ${binding.barConfigOverride?.defaultOpen ? 'phz-fc-toggle--on' : 'phz-fc-toggle--off'}"
                  @click=${() => this._updateBarConfig(binding, { defaultOpen: !binding.barConfigOverride?.defaultOpen })}
                  aria-label="Toggle default open"></button>
        </div>

        <div class="phz-fc-toggle-row">
          <span class="phz-fc-toggle-label">Show on Summary</span>
          <button class="phz-fc-toggle ${binding.barConfigOverride?.showOnSummary ? 'phz-fc-toggle--on' : 'phz-fc-toggle--off'}"
                  @click=${() => this._updateBarConfig(binding, { showOnSummary: !binding.barConfigOverride?.showOnSummary })}
                  aria-label="Toggle show on summary"></button>
        </div>
      </div>
    `;
    }
    // -- Picker Drawer --
    _renderPickerDrawer() {
        const boundIds = new Set((this.bindings ?? []).map(b => b.filterDefinitionId));
        const unboundDefs = (this.definitions ?? []).filter(d => !d.deprecated && !boundIds.has(d.id));
        return html `
      <phz-filter-drawer
        ?open=${this._pickerOpen}
        .drawerTitle=${'Add Filters'}
        .width=${400}
        .resizable=${false}
        @drawer-close=${this._closePicker}
      >
        ${this._pickerOpen ? html `
          ${this._hasPicker
            ? html `<phz-filter-picker
                      .definitions=${unboundDefs}
                      @picker-select=${this._handlePickerSelect}
                    ></phz-filter-picker>`
            : this._renderFallbackPicker(unboundDefs)}
          <div slot="footer">
            <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._addSelected}>
              Add Selected (${this._pickerSelected.size})
            </button>
            <button class="phz-sc-btn" @click=${this._closePicker}>Cancel</button>
          </div>
        ` : nothing}
      </phz-filter-drawer>
    `;
    }
    _renderFallbackPicker(defs) {
        if (defs.length === 0) {
            return html `<div class="phz-fc-empty">All definitions are already bound</div>`;
        }
        return html `
      <div class="phz-fc-picker-list">
        ${defs.map(def => html `
          <label class="phz-fc-picker-item">
            <input type="checkbox"
                   .checked=${this._pickerSelected.has(def.id)}
                   @change=${(e) => {
            const checked = e.target.checked;
            const newSet = new Set(this._pickerSelected);
            if (checked)
                newSet.add(def.id);
            else
                newSet.delete(def.id);
            this._pickerSelected = newSet;
        }}>
            <span>${def.label}</span>
            <span style="font-size:11px;color:#78716C;margin-left:auto">${def.type.replace(/_/g, ' ')}</span>
          </label>
        `)}
      </div>
    `;
    }
    // -- Actions --
    async _openPicker() {
        if (!this._pickerChecked) {
            try {
                // @ts-ignore — optional side-effect import for feature detection
                await import('../engine-admin/index.js');
                this._hasPicker = true;
            }
            catch {
                this._hasPicker = false;
            }
            this._pickerChecked = true;
        }
        this._pickerSelected = new Set();
        this._pickerOpen = true;
    }
    _closePicker() {
        this._pickerOpen = false;
        this._pickerSelected = new Set();
    }
    _handlePickerSelect(e) {
        const ids = e.detail?.ids || [];
        this._pickerSelected = new Set(ids);
    }
    _addSelected() {
        if (this._pickerSelected.size === 0)
            return;
        const maxOrder = (this.bindings ?? []).reduce((max, b) => Math.max(max, b.order), -1);
        const artId = toArtefactId(this.artefactId);
        const newBindings = [];
        let order = maxOrder + 1;
        for (const id of this._pickerSelected) {
            newBindings.push({
                filterDefinitionId: filterDefinitionId(id),
                artefactId: artId,
                visible: true,
                order: order++,
            });
        }
        this._dispatchEvent('binding-add', { bindings: newBindings });
        this._closePicker();
    }
    _removeBinding(binding) {
        this._dispatchEvent('binding-remove', {
            filterDefinitionId: binding.filterDefinitionId,
            artefactId: binding.artefactId,
        });
    }
    _toggleVisibility(binding) {
        this._updateBinding(binding, { visible: !binding.visible });
    }
    _updateBinding(binding, patch) {
        this._dispatchEvent('binding-update', {
            filterDefinitionId: binding.filterDefinitionId,
            artefactId: binding.artefactId,
            patch,
        });
    }
    _updateBarConfig(binding, patch) {
        const current = binding.barConfigOverride || {};
        this._updateBinding(binding, {
            barConfigOverride: { ...current, ...patch },
        });
    }
    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
};
__decorate([
    property({ type: Array })
], PhzFilterConfigurator.prototype, "definitions", void 0);
__decorate([
    property({ type: Array })
], PhzFilterConfigurator.prototype, "bindings", void 0);
__decorate([
    property({ attribute: 'artefact-id' })
], PhzFilterConfigurator.prototype, "artefactId", void 0);
__decorate([
    property({ attribute: 'artefact-name' })
], PhzFilterConfigurator.prototype, "artefactName", void 0);
__decorate([
    property({ type: Array })
], PhzFilterConfigurator.prototype, "availableColumns", void 0);
__decorate([
    state()
], PhzFilterConfigurator.prototype, "_helpOpen", void 0);
__decorate([
    state()
], PhzFilterConfigurator.prototype, "_expandedId", void 0);
__decorate([
    state()
], PhzFilterConfigurator.prototype, "_pickerOpen", void 0);
__decorate([
    state()
], PhzFilterConfigurator.prototype, "_hasPicker", void 0);
__decorate([
    state()
], PhzFilterConfigurator.prototype, "_pickerChecked", void 0);
__decorate([
    state()
], PhzFilterConfigurator.prototype, "_pickerSelected", void 0);
PhzFilterConfigurator = __decorate([
    safeCustomElement('phz-filter-configurator')
], PhzFilterConfigurator);
export { PhzFilterConfigurator };
//# sourceMappingURL=phz-filter-configurator.js.map