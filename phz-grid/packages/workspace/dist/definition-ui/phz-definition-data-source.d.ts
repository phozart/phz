/**
 * @phozart/phz-definitions — <phz-definition-data-source>
 *
 * Searchable data product picker with schema preview.
 * Emits `data-source-change` when a data product is selected.
 *
 * Migrated from phz-grid-admin's phz-admin-data-source with new tag name.
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
export declare class PhzDefinitionDataSource extends LitElement {
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
        'phz-definition-data-source': PhzDefinitionDataSource;
    }
}
//# sourceMappingURL=phz-definition-data-source.d.ts.map