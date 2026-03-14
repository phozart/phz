/**
 * @phozart/engine-admin — Data Product Browser
 *
 * Two-panel: searchable product list (left) + schema inspector (right).
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { DataProductDef } from '@phozart/engine';
export declare class PhzDataBrowser extends LitElement {
    static styles: import("lit").CSSResult[];
    products: DataProductDef[];
    private selectedId?;
    private searchQuery;
    private get filteredProducts();
    private get selectedProduct();
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-data-browser': PhzDataBrowser;
    }
}
//# sourceMappingURL=phz-data-browser.d.ts.map