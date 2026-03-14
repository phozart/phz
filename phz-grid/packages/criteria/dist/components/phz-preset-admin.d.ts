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
import { LitElement } from 'lit';
import type { SelectionPreset, FilterDefinition, FilterDefinitionPreset, SelectionFieldDef, SelectionFieldType, FilterDataSource, SelectionFieldOption } from '@phozart/core';
import './fields/phz-combobox.js';
interface CtxMenuItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    separator?: boolean;
    variant?: 'default' | 'danger';
}
/** Convert a FilterDefinition into the SelectionFieldDef shape that <phz-criteria-field> accepts */
export declare function defToFieldDef(def: FilterDefinition): SelectionFieldDef;
/** Format a filter preset value into display chips */
export declare function formatPresetValuePreview(value: string | string[] | null, def: FilterDefinition): string[];
/** Check if a preset can be copied between filter types */
export declare function isFilterTypeCompatible(sourceType: SelectionFieldType, targetType: SelectionFieldType): boolean;
/** Build context menu items for a filter-specific preset card */
export declare function buildFilterPresetContextItems(preset: FilterDefinitionPreset): CtxMenuItem[];
/**
 * Resolve available options for a FilterDefinition.
 * Priority: valueSource.optionsSource (from FilterDataSource) > static options > derive from data via dataField.
 */
export declare function resolveDefinitionOptions(def: FilterDefinition, dataSources: FilterDataSource[], data: Record<string, unknown>[]): SelectionFieldOption[];
export declare class PhzPresetAdmin extends LitElement {
    static styles: import("lit").CSSResult[];
    sharedPresets: SelectionPreset[];
    userPresets: SelectionPreset[];
    mode: 'cross-filter' | 'per-filter';
    definitions: FilterDefinition[];
    filterPresets: FilterDefinitionPreset[];
    dataSources: FilterDataSource[];
    data: Record<string, unknown>[];
    private _tab;
    private _selectedDefId;
    private _modalOpen;
    private _editingPreset;
    private _modalName;
    private _modalValue;
    private _modalSearch;
    private _copyModalOpen;
    private _copySourcePreset;
    private _copyTargetDefId;
    render(): import("lit-html").TemplateResult<1>;
    private _renderCrossFilterMode;
    private get _currentPresets();
    private _renderPreset;
    private _renderPerFilterMode;
    private _renderFilterPresetCard;
    private _renderFilterPresetModal;
    private _toggleOption;
    private _selectAllVisible;
    private _deselectAllVisible;
    private _renderCopyModal;
    private _openCreateModal;
    private _openEditModal;
    private _closeModal;
    private _saveFilterPreset;
    private _openCopyModal;
    private _closeCopyModal;
    private _executeCopy;
    private _handleFilterPresetContextMenu;
    private _handleCardContextMenu;
    private _handleBgContextMenu;
    private _dispatchEvent;
}
export {};
//# sourceMappingURL=phz-preset-admin.d.ts.map