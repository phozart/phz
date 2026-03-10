/**
 * @phozart/phz-criteria — Criteria Admin
 *
 * Narrow vertical admin panel (320px) with 3 tabs: Fields, Rules, Settings.
 * Designed for side-panel placement following BI tool patterns (MicroStrategy, Cognos).
 *
 * - Fields: expand-to-edit cards (label, type, required, default, lock, reorder)
 * - Rules: field dependencies (stacked vertically) + shared presets
 * - Settings: behavior toggles + panel style
 *
 * Phz UI console mode: monochrome icons, warm neutrals, narrow-optimised layout.
 *
 * @deprecated Use `<phz-filter-designer>` for definition management and
 * `<phz-filter-configurator>` for artefact binding. This component remains
 * functional for backward compatibility.
 */
import { LitElement } from 'lit';
import type { CriteriaConfig, ColumnDefinition, DataSet, FilterDefinition, FilterBinding, FilterRule, SelectionPreset } from '@phozart/phz-core';
export declare class PhzCriteriaAdmin extends LitElement {
    static styles: import("lit").CSSResult[];
    criteriaConfig: CriteriaConfig;
    availableFields: string[];
    columns: ColumnDefinition[];
    data: Record<string, unknown>[];
    dataSources?: Record<string, DataSet>;
    /** Central filter definitions from registry */
    filterDefinitions: FilterDefinition[];
    /** Filter bindings for the current artefact */
    filterBindings: FilterBinding[];
    /** Filter rules */
    filterRules: FilterRule[];
    /** Shared presets */
    sharedPresets: SelectionPreset[];
    /** User presets */
    userPresets: SelectionPreset[];
    /** Current artefact ID (report/dashboard) */
    artefactId: string;
    /** Enable drag-to-resize handle on the right edge */
    resizable: boolean;
    minWidth: number;
    maxWidth: number;
    private _activeTab;
    private _expandedFieldIdx;
    private _showColumnPicker;
    private _showDefinitionPicker;
    private _resizing;
    private _studioOpen;
    private _editingDef?;
    private _startX;
    private _startWidth;
    private _deprecationWarned;
    connectedCallback(): void;
    private _onResizeStart;
    private _onResizeMove;
    private _onResizeEnd;
    disconnectedCallback(): void;
    private _emit;
    /** Whether registry definitions are available for this admin */
    private get _isRegistryBacked();
    /** Artefact ID as branded type */
    private get _artId();
    /**
     * Resolved fields: merged view of FilterDefinition + FilterBinding (registry-backed)
     * or raw SelectionFieldDef from criteriaConfig (legacy fallback).
     */
    private get _resolvedFields();
    /** Definitions not yet bound to this artefact */
    private get _unboundDefinitions();
    private _emitBindingAdd;
    private _emitBindingRemove;
    private _emitBindingUpdate;
    private _emitBindingReorder;
    private _emitDefinitionCreate;
    /** Columns not yet used as criteria fields */
    private get _unusedColumns();
    /** Whether we have column metadata to drive the picker */
    private get _hasColumns();
    private _addField;
    private _addFieldFromColumn;
    private _removeField;
    private _updateField;
    private _updateDateConfig;
    private _toggleGranularity;
    private _togglePresetGroup;
    private _updatePresenceConfig;
    private _togglePresenceField;
    private _supportsSelectionMode;
    private _supportsOptions;
    private _getDataSetNames;
    private _getDataSetColumns;
    private _toFilterDataSources;
    private _getOptionsMode;
    private _updateOptionsSource;
    private _defaultSelectionMode;
    private _moveField;
    private _toggleFieldExpand;
    /** Reorder a registry-backed binding field by emitting binding-reorder */
    private _moveBindingField;
    private _addDependency;
    private _removeDependency;
    private _updateDependency;
    private _updateBehavior;
    private get _layout();
    private _updateLayout;
    private get _summaryLayout();
    private _updateSummaryLayout;
    private _renderFieldCard;
    private _renderDateConfig;
    private _renderPresenceConfig;
    private _renderOptionsSourceConfig;
    private _renderFieldsTab;
    /** Renders the "Add" button/picker appropriate to the current mode */
    private _renderFieldAdder;
    /** Registry definition picker — lists unbound definitions with "Create New" at the bottom */
    private _renderDefinitionPicker;
    /** Render a field card for a registry-backed (definition+binding) resolved field */
    private _renderBindingFieldCard;
    private _renderRulesTab;
    private _renderLayoutTab;
    private _renderSummaryBarPreview;
    private _renderSummaryStripStyles;
    private _renderSettingsTab;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-criteria-admin.d.ts.map