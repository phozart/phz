/**
 * @phozart/phz-editor — <phz-editor-catalog> (B-2.04)
 *
 * Catalog screen component for the editor. Displays artifacts
 * with search, filtering, sorting, and creation actions.
 */
import { LitElement } from 'lit';
import type { CatalogItem, CatalogState } from '../screens/catalog-state.js';
export declare class PhzEditorCatalog extends LitElement {
    static styles: import("lit").CSSResult;
    items: CatalogItem[];
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current catalog state. */
    getState(): CatalogState;
    private _onSearch;
    private _onTypeFilter;
    private _onCardClick;
    private _onCreate;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-editor-catalog': PhzEditorCatalog;
    }
}
//# sourceMappingURL=phz-editor-catalog.d.ts.map