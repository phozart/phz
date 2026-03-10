/**
 * @phozart/phz-criteria — Filter Configurator
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
import { LitElement } from 'lit';
import type { FilterDefinition, FilterBinding } from '@phozart/phz-core';
import '@phozart/phz-criteria';
export declare class PhzFilterConfigurator extends LitElement {
    static styles: import("lit").CSSResult[];
    definitions: FilterDefinition[];
    bindings: FilterBinding[];
    artefactId: string;
    artefactName: string;
    availableColumns: string[];
    private _helpOpen;
    private _expandedId;
    private _pickerOpen;
    private _hasPicker;
    private _pickerChecked;
    private _pickerSelected;
    render(): import("lit-html").TemplateResult<1>;
    private _renderHelp;
    private _renderBindingCard;
    private _renderExpandedForm;
    private _renderPickerDrawer;
    private _renderFallbackPicker;
    private _openPicker;
    private _closePicker;
    private _handlePickerSelect;
    private _addSelected;
    private _removeBinding;
    private _toggleVisibility;
    private _updateBinding;
    private _updateBarConfig;
    private _dispatchEvent;
}
//# sourceMappingURL=phz-filter-configurator.d.ts.map