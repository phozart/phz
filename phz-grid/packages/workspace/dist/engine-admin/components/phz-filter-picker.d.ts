/**
 * @phozart/engine-admin — Filter Picker (Artefact Binding Selector)
 *
 * 2-panel component: Available Definitions (left) | Bound to Artefact (right).
 * Consumer owns persistence — component emits events, consumer passes updated bindings.
 *
 * Events:
 * - binding-add:     { bindings: FilterBinding[] }
 * - binding-remove:  { filterDefinitionId, artefactId }
 * - binding-update:  { filterDefinitionId, artefactId, patch }
 * - binding-reorder: { artefactId, orderedIds: string[] }
 */
import { LitElement } from 'lit';
import type { FilterDefinition, FilterBinding } from '@phozart/core';
export declare class PhzFilterPicker extends LitElement {
    static styles: import("lit").CSSResult[];
    /** All available filter definitions from the registry */
    definitions: FilterDefinition[];
    /** Current bindings for this artefact */
    bindings: FilterBinding[];
    /** The artefact these bindings belong to */
    artefactId: string;
    private _search;
    private _checked;
    private _expandedOverrides;
    private get _boundIds();
    private get _filteredDefs();
    private get _sortedBindings();
    private _emit;
    private _addSelected;
    private _removeBinding;
    private _moveBinding;
    private _updateOverride;
    private _toggleOverrides;
    private _toggleChecked;
    render(): import("lit-html").TemplateResult<1>;
    private _renderAvailablePanel;
    private _renderBoundPanel;
    private _renderOverrides;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-filter-picker': PhzFilterPicker;
    }
}
//# sourceMappingURL=phz-filter-picker.d.ts.map