/**
 * @phozart/phz-grid-admin — Data Source Picker Tab
 *
 * Searchable list of DataProducts with schema preview.
 * Emits `data-source-change` when a data product is selected.
 */
import { LitElement } from 'lit';
export interface DataProductListItem {
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    fieldCount: number;
}
export interface DataProductFieldInfo {
    name: string;
    type: string;
    description?: string;
}
export declare class PhzAdminDataSource extends LitElement {
    static styles: import("lit").CSSResult[];
    selectedDataProductId: string;
    dataProducts: DataProductListItem[];
    schemaFields: DataProductFieldInfo[];
    private searchQuery;
    private get filteredProducts();
    private _selectProduct;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-data-source': PhzAdminDataSource;
    }
}
//# sourceMappingURL=phz-admin-data-source.d.ts.map