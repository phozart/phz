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
import { LitElement } from 'lit';
import type { CriteriaConfig, SelectionContext, SelectionFieldDef, SelectionPreset, DataSet } from '@phozart/phz-core';
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
export declare class PhzSelectionCriteria extends LitElement {
    static styles: import("lit").CSSResult[];
    config: CriteriaConfig;
    data: Record<string, unknown>[];
    presets: SelectionPreset[];
    initialState: SelectionContext;
    dataSources?: Record<string, DataSet>;
    /** Registry mode: when true, fields are resolved from filterRegistry + filterBindings instead of config */
    registryMode: boolean;
    /** Filter registry instance (registryMode only) */
    filterRegistry?: import('@phozart/phz-engine').FilterRegistry;
    /** Filter binding store instance (registryMode only) */
    filterBindings?: import('@phozart/phz-engine').FilterBindingStore;
    /** Filter state manager instance (registryMode only) */
    filterStateManager?: import('@phozart/phz-engine').FilterStateManager;
    /** Filter rule engine instance (registryMode only) */
    filterRuleEngine?: import('@phozart/phz-engine').FilterRuleEngine;
    /** Criteria output manager instance (registryMode only) */
    criteriaOutputManager?: import('@phozart/phz-engine').CriteriaOutputManager;
    /** Artefact ID for registry mode */
    artefactId?: string;
    private _drawerOpen;
    private _pinned;
    private _pendingContext;
    /** Returns a copy of the current selection context. */
    getContext(): SelectionContext;
    /** Sets the selection context (replaces current values). */
    setContext(ctx: SelectionContext): void;
    /** Validates and applies current filters (dispatches criteria-apply event). */
    apply(): void;
    /** Resets all fields to defaults (dispatches criteria-reset event). */
    reset(): void;
    /** Opens the filter drawer programmatically. */
    openDrawer(): void;
    /** Closes the filter drawer programmatically. */
    closeDrawer(): void;
    private _expandedModalField;
    private _expandedSections;
    private _validationResult;
    private _initialized;
    /**
     * In registry mode, resolved fields can be passed via a separate property.
     * The host should call engine.resolveFields() and pass the result here.
     */
    resolvedFields?: SelectionFieldDef[];
    /** Returns the effective config — in registry mode, uses resolvedFields */
    private get _resolvedConfig();
    private get _behavior();
    private get _drawerWidth();
    private get _pinnable();
    updated(changed: Map<string, unknown>): void;
    /** Count active values for a given field */
    private _fieldCount;
    private _onBarOpenDrawer;
    private _onBarClearAll;
    private _onBarRemoveFilter;
    private _onDrawerClose;
    private _onDrawerPinToggle;
    private _onFieldChange;
    private _onPresenceChange;
    private _onApply;
    private _onReset;
    private _emitChange;
    private _onExpandRequest;
    private _onModalClose;
    private _onPresetSelect;
    private _renderField;
    private _renderExpandedModal;
    private _renderDrawerContent;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-selection-criteria.d.ts.map