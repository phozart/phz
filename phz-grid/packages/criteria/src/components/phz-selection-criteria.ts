/**
 * @phozart/phz-criteria — Selection Criteria (Bar + Drawer Orchestrator)
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

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  CriteriaConfig,
  SelectionContext,
  SelectionFieldDef,
  SelectionPreset,
  SelectionValidationResult,
  FilterBarBehavior,
  PresenceState,
  DataSet,
} from '@phozart/phz-core';
import {
  resolveDynamicDefaults,
  validateCriteria,
  resolveFieldOptions,
} from '@phozart/phz-engine';
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
@customElement('phz-selection-criteria')
export class PhzSelectionCriteria extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; }
  `];

  @property({ type: Object }) config: CriteriaConfig = { fields: [] };
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Array }) presets: SelectionPreset[] = [];
  @property({ type: Object }) initialState: SelectionContext = {};
  @property({ type: Object }) dataSources?: Record<string, DataSet>;

  /** Registry mode: when true, fields are resolved from filterRegistry + filterBindings instead of config */
  @property({ type: Boolean }) registryMode = false;

  /** Filter registry instance (registryMode only) */
  @property({ type: Object }) filterRegistry?: import('@phozart/phz-engine').FilterRegistry;

  /** Filter binding store instance (registryMode only) */
  @property({ type: Object }) filterBindings?: import('@phozart/phz-engine').FilterBindingStore;

  /** Filter state manager instance (registryMode only) */
  @property({ type: Object }) filterStateManager?: import('@phozart/phz-engine').FilterStateManager;

  /** Filter rule engine instance (registryMode only) */
  @property({ type: Object }) filterRuleEngine?: import('@phozart/phz-engine').FilterRuleEngine;

  /** Criteria output manager instance (registryMode only) */
  @property({ type: Object }) criteriaOutputManager?: import('@phozart/phz-engine').CriteriaOutputManager;

  /** Artefact ID for registry mode */
  @property({ type: String }) artefactId?: string;

  @state() private _drawerOpen = false;
  @state() private _pinned = false;
  @state() private _pendingContext: SelectionContext = {};

  /** Returns a copy of the current selection context. */
  public getContext(): SelectionContext {
    return { ...this._pendingContext };
  }

  /** Sets the selection context (replaces current values). */
  public setContext(ctx: SelectionContext): void {
    this._pendingContext = { ...ctx };
  }

  /** Validates and applies current filters (dispatches criteria-apply event). */
  public apply(): void {
    this._onApply();
  }

  /** Resets all fields to defaults (dispatches criteria-reset event). */
  public reset(): void {
    this._onReset();
  }

  /** Opens the filter drawer programmatically. */
  public openDrawer(): void {
    this._drawerOpen = true;
  }

  /** Closes the filter drawer programmatically. */
  public closeDrawer(): void {
    this._drawerOpen = false;
  }
  @state() private _expandedModalField: string | null = null;
  @state() private _expandedSections = new Set<string>();
  @state() private _validationResult: SelectionValidationResult = { valid: true, errors: [] };
  @state() private _initialized = false;

  /**
   * In registry mode, resolved fields can be passed via a separate property.
   * The host should call engine.resolveFields() and pass the result here.
   */
  @property({ type: Array }) resolvedFields?: SelectionFieldDef[];

  /** Returns the effective config — in registry mode, uses resolvedFields */
  private get _resolvedConfig(): CriteriaConfig {
    if (this.registryMode && this.resolvedFields) {
      return { ...this.config, fields: this.resolvedFields };
    }
    return this.config;
  }

  private get _behavior(): FilterBarBehavior {
    return (this._resolvedConfig.behavior ?? {}) as FilterBarBehavior;
  }

  private get _drawerWidth(): number {
    return this._behavior.drawerWidth ?? 520;
  }

  private get _pinnable(): boolean {
    return this._behavior.pinnable ?? false;
  }

  updated(changed: Map<string, unknown>) {
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
  private _fieldCount(field: SelectionFieldDef): number {
    const v = this._pendingContext[field.id];
    if (v === null || v === undefined) return 0;
    if (Array.isArray(v)) return v.length;
    if (typeof v === 'string' && v === '') return 0;
    return 1;
  }

  private _onBarOpenDrawer() {
    this._drawerOpen = true;
  }

  private _onBarClearAll() {
    const cleared: SelectionContext = {};
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

  private _onBarRemoveFilter(e: CustomEvent<{ fieldId: string }>) {
    const { fieldId } = e.detail;
    const newCtx = { ...this._pendingContext };
    delete newCtx[fieldId];
    this._pendingContext = newCtx;
    this._emitChange();
  }

  private _onDrawerClose() {
    this._drawerOpen = false;
  }

  private _onDrawerPinToggle(e: CustomEvent<{ pinned: boolean }>) {
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

  private _onFieldChange(fieldId: string, value: string | string[] | null) {
    this._pendingContext = { ...this._pendingContext, [fieldId]: value };

    // Auto-apply if configured
    if (this._behavior.autoApply) {
      this._emitChange();
    }
  }

  private _onPresenceChange(fieldId: string, filters: Record<string, PresenceState>) {
    // Serialize presence map as JSON string value
    this._pendingContext = { ...this._pendingContext, [fieldId]: JSON.stringify(filters) };
    if (this._behavior.autoApply) {
      this._emitChange();
    }
  }

  private _onApply() {
    const result = validateCriteria(this.config, this._pendingContext);
    this._validationResult = result;
    if (!result.valid) return;

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

  private _onReset() {
    const defaults = resolveDynamicDefaults(this.config);
    this._pendingContext = { ...defaults };
    this._emitChange();
    this.dispatchEvent(new CustomEvent('criteria-reset', {
      bubbles: true, composed: true,
    }));
  }

  private _emitChange() {
    this.dispatchEvent(new CustomEvent('criteria-change', {
      detail: { context: { ...this._pendingContext } },
      bubbles: true, composed: true,
    }));
  }

  private _onExpandRequest(fieldId: string) {
    this._expandedModalField = fieldId;
  }

  private _onModalClose() {
    this._expandedModalField = null;
  }

  private _onPresetSelect(e: CustomEvent<{ preset: SelectionPreset }>) {
    this._pendingContext = { ...e.detail.preset.values };
    if (this._behavior.autoApply) {
      this._emitChange();
    }
  }

  private _renderField(field: SelectionFieldDef) {
    const value = this._pendingContext[field.id];
    const isLocked = field.locked;
    const effectiveOptions = resolveFieldOptions(field, this.dataSources, this.data);

    switch (field.type) {
      case 'tree_select':
        return html`
          <phz-tree-select
            .nodes=${field.treeOptions ?? []}
            .value=${Array.isArray(value) ? value : []}
            ?disabled=${isLocked}
            ?inline=${true}
            .maxVisibleItems=${field.barConfig?.maxVisibleItems ?? 0}
            .selectionMode=${field.selectionMode}
            ?showExpandButton=${(field.treeOptions?.length ?? 0) > 20}
            @tree-change=${(e: CustomEvent) => this._onFieldChange(field.id, e.detail.value)}
            @tree-expand-request=${() => this._onExpandRequest(field.id)}
          ></phz-tree-select>
        `;

      case 'chip_group':
      case 'multi_select':
        return html`
          <phz-chip-select
            .options=${effectiveOptions ?? []}
            .value=${Array.isArray(value) ? value : []}
            ?disabled=${isLocked}
            .selectionMode=${field.selectionMode}
            @chip-change=${(e: CustomEvent) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-chip-select>
        `;

      case 'field_presence':
        return html`
          <phz-field-presence-filter
            .fields=${field.fieldPresenceConfig?.fields ?? []}
            .value=${value ? JSON.parse(value as string) : undefined}
            ?compact=${field.fieldPresenceConfig?.compact}
            label=${field.label}
            @presence-change=${(e: CustomEvent) => this._onPresenceChange(field.id, e.detail.filters)}
          ></phz-field-presence-filter>
        `;

      case 'single_select':
        return html`
          <select
            class="phz-sc-select"
            .value=${(value as string) ?? ''}
            ?disabled=${isLocked || field.selectionMode === 'none'}
            @change=${(e: Event) => this._onFieldChange(field.id, (e.target as HTMLSelectElement).value || null)}
          >
            ${field.placeholder ? html`<option value="">${field.placeholder}</option>` : nothing}
            ${(effectiveOptions ?? []).map(o => html`
              <option value=${o.value} ?selected=${value === o.value}>${o.label}</option>
            `)}
          </select>
        `;

      case 'date_range':
        return html`
          <phz-date-range-picker
            .config=${field.dateRangeConfig ?? {}}
            .value=${value as string ?? ''}
            ?disabled=${isLocked}
            @date-range-change=${(e: CustomEvent) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-date-range-picker>
        `;

      case 'numeric_range':
        return html`
          <phz-numeric-range-input
            .config=${field.numericRangeConfig ?? {}}
            .value=${value as string ?? ''}
            ?disabled=${isLocked}
            @numeric-range-change=${(e: CustomEvent) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-numeric-range-input>
        `;

      case 'search':
        return html`
          <phz-searchable-dropdown
            .options=${effectiveOptions ?? []}
            .value=${(value as string) ?? ''}
            ?disabled=${isLocked}
            placeholder=${field.placeholder ?? 'Search...'}
            @search-change=${(e: CustomEvent) => this._onFieldChange(field.id, e.detail.value)}
          ></phz-searchable-dropdown>
        `;

      case 'text':
        return html`
          <input
            class="phz-sc-input"
            type="text"
            .value=${(value as string) ?? ''}
            ?disabled=${isLocked}
            placeholder=${field.placeholder ?? ''}
            @input=${(e: Event) => this._onFieldChange(field.id, (e.target as HTMLInputElement).value || null)}
          />
        `;

      default:
        return html`<span style="font-size:12px;color:#A8A29E">Unsupported type: ${field.type}</span>`;
    }
  }

  private _renderExpandedModal() {
    if (!this._expandedModalField) return nothing;
    const field = this.config.fields.find(f => f.id === this._expandedModalField);
    if (!field) return nothing;

    const value = this._pendingContext[field.id];

    return html`
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
          @tree-change=${(e: CustomEvent) => this._onFieldChange(field.id, e.detail.value)}
        ></phz-tree-select>
      </phz-expanded-modal>
    `;
  }

  private _renderDrawerContent() {
    return html`
      ${this.config.fields.map(field => {
        const isExpanded = this._expandedSections.has(field.id);
        const count = this._fieldCount(field);
        const error = this._validationResult.errors.find(e => e.field === field.id);

        return html`
          <phz-filter-section
            label=${field.label}
            ?expanded=${isExpanded}
            .count=${count}
            ?required=${field.required ?? false}
            @section-toggle=${(e: CustomEvent) => {
              const sections = new Set(this._expandedSections);
              if (e.detail.expanded) sections.add(field.id);
              else sections.delete(field.id);
              this._expandedSections = sections;
            }}
          >
            ${field.locked ? html`
              <span class="phz-sc-locked-badge">Locked</span>
            ` : nothing}
            ${this._renderField(field)}
            ${error ? html`<div class="phz-sc-error">${error.message}</div>` : nothing}
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

    return html`
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
}
