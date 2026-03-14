/**
 * @phozart/grid-admin — Criteria Binding Tab
 *
 * Two-panel interface: available filter definitions (left) and
 * bound filters (right). Admins add/remove/reorder/configure bindings.
 * Emits `criteria-binding-change` on any binding change.
 */
import { LitElement } from 'lit';
export interface CriteriaDefinitionItem {
    id: string;
    label: string;
    type: string;
    dataField?: string;
}
export interface CriteriaBindingItem {
    filterDefinitionId: string;
    label: string;
    type: string;
    visible: boolean;
    order: number;
    labelOverride?: string;
    defaultValueOverride?: string | string[] | null;
}
export declare class PhzAdminCriteria extends LitElement {
    static styles: import("lit").CSSResult[];
    availableDefinitions: CriteriaDefinitionItem[];
    bindings: CriteriaBindingItem[];
    private searchQuery;
    private editingBindingId;
    /** Definitions not yet bound */
    private get unboundDefinitions();
    private _emitChange;
    private _addBinding;
    private _removeBinding;
    private _moveBinding;
    private _toggleVisibility;
    private _toggleConfig;
    private _updateLabelOverride;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-criteria': PhzAdminCriteria;
    }
}
//# sourceMappingURL=phz-admin-criteria.d.ts.map