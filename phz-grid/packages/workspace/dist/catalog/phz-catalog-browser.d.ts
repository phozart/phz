/**
 * @phozart/workspace — CatalogBrowser Component
 *
 * Lists artifacts grouped by type (reports, dashboards, KPIs, grids).
 * Supports search filtering and emits 'artifact-select' on item click.
 */
import { LitElement } from 'lit';
import type { ArtifactMeta, ArtifactFilter } from '../types.js';
export interface ArtifactListProvider {
    listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]>;
}
export declare class PhzCatalogBrowser extends LitElement {
    static readonly TAG: "phz-catalog-browser";
    static styles: import("lit").CSSResult;
    adapter?: ArtifactListProvider;
    private _artifacts;
    private _search;
    private _loading;
    private _error;
    private _mutationListener;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    /** Public: force-refresh the artifact list from the adapter. */
    refresh(): Promise<void>;
    private _loadArtifacts;
    private _onSearch;
    private _onSelect;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-catalog-browser': PhzCatalogBrowser;
    }
}
//# sourceMappingURL=phz-catalog-browser.d.ts.map