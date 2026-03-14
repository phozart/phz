/**
 * @phozart/criteria — Selection Criteria (Bar + Drawer Orchestrator)
 *
 * Top-level component composing:
 *  - phz-criteria-bar (compact horizontal bar)
 *  - phz-filter-drawer (right-side slide-out)
 *  - phz-filter-section (collapsible sections inside drawer)
 *  - phz-expanded-modal (full-screen for large tree selects)
 *
 * Routes each field type to the appropriate sub-component.
 * Uses engine functions for validation, formatting, defaults.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resolveDynamicDefaults, validateCriteria, resolveFieldOptions, } from '@phozart/engine';
import { criteriaStyles } from '../shared-styles.js';
// Import sub-components for side-effect registration
import './phz-criteria-bar.js';
import './phz-filter-drawer.js';
import './phz-filter-section.js';
import './phz-expanded-modal.js';
import './phz-preset-sidebar.js';
import './fields/phz-tree-select.js';
import './fields/phz-chip-select.js';
import './fields/phz-match-filter-pill.js';
import './fields/phz-field-presence-filter.js';
import './fields/phz-date-range-picker.js';
import './fields/phz-numeric-range-input.js';
import './fields/phz-searchable-dropdown.js';
let PhzSelectionCriteria = class PhzSelectionCriteria extends LitElement {
    constructor() {
        super(...arguments);
        this.config = { fields: [] };
        this.data = [];
        this.presets = [];
        this.initialState = {};
        /** Registry mode: when true, fields are resolved from filterRegistry + filterBindings instead of config */
        this.registryMode = false;
        this._drawerOpen = false;
        this._pinned = false;
        this._pendingContext = {};
        this._expandedModalField = null;
        this._expandedSections = new Set();
        this._validationResult = { valid: true, errors: [] };
        this._initialized = false;
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: block; }
  `]; }
    /** Returns a copy of the current selection context. */
    getContext() {
        return { ...this._pendingContext };
    }
    /** Sets the selection context (replaces current values). */
    setContext(ctx) {
        this._pendingContext = { ...ctx };
    }
    /** Validates and applies current filters (dispatches criteria-apply event). */
    apply() {
        this._onApply();
    }
    /** Resets all fields to defaults (dispatches criteria-reset event). */
    reset() {
        this._onReset();
    }
    /** Opens the filter drawer programmatically. */
    openDrawer() {
        this._drawerOpen = true;
    }
    /** Closes the filter drawer programmatically. */
    closeDrawer() {
        this._drawerOpen = false;
    }
    /** Returns the effective config — in registry mode, uses resolvedFields */
    get _resolvedConfig() {
        if (this.registryMode && this.resolvedFields) {
            return { ...this.config, fields: this.resolvedFields };
        }
        return this.config;
    }
    get _behavior() {
        return (this._resolvedConfig.behavior ?? {});
    }
    get _drawerWidth() {
        return this._behavior.drawerWidth ?? 520;
    }
    get _pinnable() {
        return this._behavior.pinnable ?? false;
    }
    updated(changed) {
        if (!this._initialized && this.config.fields.length > 0) {
            // Initialize pending context from initialState or dynamic defaults
            const defaults = resolveDynamicDefaults(this.config);
            this._pendingContext = { ...defaults, ...this.initialState };
            // Set initially expanded sections
            for (const field of this.config.fields) {
                if (field.barConfig?.defaultOpen) {
                    this._expandedSections = new Set([...this._expandedSections, field.id]);
                }
            }
            // Initialize pinned state from behavior config
            if (this._behavior.defaultPinned && this._pinnable) {
                this._pinned = true;
                this._drawerOpen = true;
            }
            this._initialized = true;
        }
    }
    /** Count active values for a given field */
    _fieldCount(field) {
        const v = this._pendingContext[field.id];
        if (v === null || v === undefined)
            return 0;
        if (Array.isArray(v))
            return v.length;
        if (typeof v === 'string' && v === '')
            return 0;
        return 1;
    }
    _onBarOpenDrawer() {
        this._drawerOpen = true;
    }
    _onBarClearAll() {
        const cleared = {};
        // Preserve locked fields
        for (const field of this.config.fields) {
            if (field.locked && field.lockedValue !== undefined) {
                cleared[field.id] = field.lockedValue;
            }
        }
        this._pendingContext = cleared;
        this._emitChange();
        this.dispatchEvent(new CustomEvent('criteria-apply', {
            detail: { context: { ...this._pendingContext } },
            bubbles: true, composed: true,
        }));
    }
    _onBarRemoveFilter(e) {
        const { fieldId } = e.detail;
        const newCtx = { ...this._pendingContext };
        delete newCtx[fieldId];
        this._pendingContext = newCtx;
        this._emitChange();
    }
    _onDrawerClose() {
        this._drawerOpen = false;
    }
    _onDrawerPinToggle(e) {
        this._pinned = e.detail.pinned;
        if (this._pinned) {
            // Keep drawer open when pinning
            this._drawerOpen = true;
        }
        this.dispatchEvent(new CustomEvent('criteria-pin-change', {
            detail: { pinned: this._pinned, width: this._drawerWidth },
            bubbles: true, composed: true,
        }));
    }
    _onFieldChange(fieldId, value) {
        this._pendingContext = { ...this._pendingContext, [fieldId]: value };
        // Auto-apply if configured
        if (this._behavior.autoApply) {
            this._emitChange();
        }
    }
    _onPresenceChange(fieldId, filters) {
        // Serialize presence map as JSON string value
        this._pendingContext = { ...this._pendingContext, [fieldId]: JSON.stringify(filters) };
        if (this._behavior.autoApply) {
            this._emitChange();
        }
    }
    _onApply() {
        const result = validateCriteria(this.config, this._pendingContext);
        this._validationResult = result;
        if (!result.valid)
            return;
        // Only close drawer on apply if not pinned
        if (!this._pinned) {
            this._drawerOpen = false;
        }
        this._emitChange();
        this.dispatchEvent(new CustomEvent('criteria-apply', {
            detail: { context: { ...this._pendingContext } },
            bubbles: true, composed: true,
        }));
    }
    _onReset() {
        const defaults = resolveDynamicDefaults(this.config);
        this._pendingContext = { ...defaults };
        this._emitChange();
        this.dispatchEvent(new CustomEvent('criteria-reset', {
            bubbles: true, composed: true,
        }));
    }
    _emitChange() {
        this.dispatchEvent(new CustomEvent('criteria-change', {
            detail: { context: { ...this._pendingContext } },
            bubbles: true, composed: true,
        }));
    }
    _onExpandRequest(fieldId) {
        this._expandedModalField = fieldId;
    }
    _onModalClose() {
        this._expandedModalField = null;
    }
    _onPresetSelect(e) {
        this._pendingContext = { ...e.detail.preset.values };
        if (this._behavior.autoApply) {
            this._emitChange();
        }
    }
    _renderField(field) {
        const value = this._pendingContext[field.id];
        const isLocked = field.locked;
        const effectiveOptions = resolveFieldOptions(field, this.dataSources, this.data);
        switch (field.type) {
            case 'tree_select':
                return html `
          <phz-tree-select
            .nodes=${field.treeOptions ?? []}
            .value=${Array.isArray(value) ? value : []}
            ?disabled=${isLocked}
            ?inline=${true}
            .maxVisibleItems=${field.barConfig?.maxVisibleItems ?? 0}
            .selectionMode=${field.selectionMode}
            ?showExpandButton=${(field.treeOptions?.length ?? 0) > 20}
            @tree-change=${(e) => this._onFieldChange(field.id, e.detail.value)}
            @tree-expand-request=${() => this._onExpandRequest(field.id)}
          ></phz-tree-select>
        `;
            case 'chip_group':
            case 'multi_select':
                return html `
          <phz-chip-select
            .options=${effectiveOptions ?? []}
            .value=${Array.isArray(value) ? value : []}
            ?disabled=${isLocked}
            .selectionMode=${field.selectionMode}
            @chip-change=${(e) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-chip-select>
        `;
            case 'field_presence':
                return html `
          <phz-field-presence-filter
            .fields=${field.fieldPresenceConfig?.fields ?? []}
            .value=${value ? JSON.parse(value) : undefined}
            ?compact=${field.fieldPresenceConfig?.compact}
            label=${field.label}
            @presence-change=${(e) => this._onPresenceChange(field.id, e.detail.filters)}
          ></phz-field-presence-filter>
        `;
            case 'single_select':
                return html `
          <select
            class="phz-sc-select"
            .value=${value ?? ''}
            ?disabled=${isLocked || field.selectionMode === 'none'}
            @change=${(e) => this._onFieldChange(field.id, e.target.value || null)}
          >
            ${field.placeholder ? html `<option value="">${field.placeholder}</option>` : nothing}
            ${(effectiveOptions ?? []).map(o => html `
              <option value=${o.value} ?selected=${value === o.value}>${o.label}</option>
            `)}
          </select>
        `;
            case 'date_range':
                return html `
          <phz-date-range-picker
            .config=${field.dateRangeConfig ?? {}}
            .value=${value ?? ''}
            ?disabled=${isLocked}
            @date-range-change=${(e) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-date-range-picker>
        `;
            case 'numeric_range':
                return html `
          <phz-numeric-range-input
            .config=${field.numericRangeConfig ?? {}}
            .value=${value ?? ''}
            ?disabled=${isLocked}
            @numeric-range-change=${(e) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-numeric-range-input>
        `;
            case 'search':
                return html `
          <phz-searchable-dropdown
            .options=${effectiveOptions ?? []}
            .value=${value ?? ''}
            ?disabled=${isLocked}
            placeholder=${field.placeholder ?? 'Search...'}
            @search-change=${(e) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-searchable-dropdown>
        `;
            case 'text':
                return html `
          <input
            class="phz-sc-input"
            type="text"
            .value=${value ?? ''}
            ?disabled=${isLocked}
            placeholder=${field.placeholder ?? ''}
            @input=${(e) => this._onFieldChange(field.id, e.target.value || null)}
          />
        `;
            default:
                return html `<span style="font-size:12px;color:#A8A29E">Unsupported type: ${field.type}</span>`;
        }
    }
    _renderExpandedModal() {
        if (!this._expandedModalField)
            return nothing;
        const field = this.config.fields.find(f => f.id === this._expandedModalField);
        if (!field)
            return nothing;
        const value = this._pendingContext[field.id];
        return html `
      <phz-expanded-modal
        ?open=${true}
        modalTitle=${field.label}
        @modal-close=${this._onModalClose}
      >
        <phz-preset-sidebar
          slot="sidebar"
          .presets=${this.presets}
          @preset-select=${this._onPresetSelect}
        ></phz-preset-sidebar>
        <phz-tree-select
          .nodes=${field.treeOptions ?? []}
          .value=${Array.isArray(value) ? value : []}
          ?inline=${true}
          @tree-change=${(e) => this._onFieldChange(field.id, e.detail.value)}
        ></phz-tree-select>
      </phz-expanded-modal>
    `;
    }
    _renderDrawerContent() {
        return html `
      ${this.config.fields.map(field => {
            const isExpanded = this._expandedSections.has(field.id);
            const count = this._fieldCount(field);
            const error = this._validationResult.errors.find(e => e.field === field.id);
            return html `
          <phz-filter-section
            label=${field.label}
            ?expanded=${isExpanded}
            .count=${count}
            ?required=${field.required ?? false}
            @section-toggle=${(e) => {
                const sections = new Set(this._expandedSections);
                if (e.detail.expanded)
                    sections.add(field.id);
                else
                    sections.delete(field.id);
                this._expandedSections = sections;
            }}
          >
            ${field.locked ? html `
              <span class="phz-sc-locked-badge">Locked</span>
            ` : nothing}
            ${this._renderField(field)}
            ${error ? html `<div class="phz-sc-error">${error.message}</div>` : nothing}
          </phz-filter-section>
        `;
        })}

      <div slot="footer">
        <button class="phz-sc-btn" @click=${this._onReset}>Reset</button>
        <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._onApply}>Apply Filters</button>
      </div>
    `;
    }
    render() {
        const showBackdrop = this._behavior.showBackdrop !== false;
        const isPinned = this._pinned;
        const drawerOpen = this._drawerOpen || isPinned;
        return html `
      <phz-criteria-bar
        .config=${this.config}
        .selectionContext=${this._pendingContext}
        .layout=${this._behavior.layout ?? {}}
        @bar-open-drawer=${this._onBarOpenDrawer}
        @bar-clear-all=${this._onBarClearAll}
        @bar-remove-filter=${this._onBarRemoveFilter}
      ></phz-criteria-bar>

      <phz-filter-drawer
        ?open=${drawerOpen}
        .width=${this._drawerWidth}
        ?showBackdrop=${showBackdrop}
        ?pinnable=${this._pinnable}
        ?pinned=${isPinned}
        drawerTitle="Filters"
        @drawer-close=${this._onDrawerClose}
        @drawer-pin-toggle=${this._onDrawerPinToggle}
      >
        ${this._renderDrawerContent()}
      </phz-filter-drawer>

      ${this._renderExpandedModal()}
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "config", void 0);
__decorate([
    property({ type: Array })
], PhzSelectionCriteria.prototype, "data", void 0);
__decorate([
    property({ type: Array })
], PhzSelectionCriteria.prototype, "presets", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "initialState", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "dataSources", void 0);
__decorate([
    property({ type: Boolean })
], PhzSelectionCriteria.prototype, "registryMode", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "filterRegistry", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "filterBindings", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "filterStateManager", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "filterRuleEngine", void 0);
__decorate([
    property({ type: Object })
], PhzSelectionCriteria.prototype, "criteriaOutputManager", void 0);
__decorate([
    property({ type: String })
], PhzSelectionCriteria.prototype, "artefactId", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_drawerOpen", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_pinned", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_pendingContext", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_expandedModalField", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_expandedSections", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_validationResult", void 0);
__decorate([
    state()
], PhzSelectionCriteria.prototype, "_initialized", void 0);
__decorate([
    property({ type: Array })
], PhzSelectionCriteria.prototype, "resolvedFields", void 0);
PhzSelectionCriteria = __decorate([
    customElement('phz-selection-criteria')
], PhzSelectionCriteria);
export { PhzSelectionCriteria };
//# sourceMappingURL=phz-selection-criteria.js.map