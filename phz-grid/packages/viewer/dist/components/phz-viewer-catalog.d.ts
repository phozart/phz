/**
 * @phozart/viewer — <phz-viewer-catalog> Custom Element
 *
 * Catalog screen showing browsable artifacts (dashboards, reports, grids).
 * Delegates logic to the headless catalog-state functions.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { ArtifactType, VisibilityMeta } from '@phozart/shared/artifacts';
import { type CatalogState } from '../screens/catalog-state.js';
export interface CatalogSelectEventDetail {
    artifactId: string;
    artifactType: ArtifactType;
    artifactName: string;
}
export declare class PhzViewerCatalog extends LitElement {
    static styles: import("lit").CSSResult;
    artifacts: VisibilityMeta[];
    pageSize: number;
    private _catalogState;
    willUpdate(changed: Map<string, unknown>): void;
    getCatalogState(): CatalogState;
    render(): TemplateResult;
    private _renderCard;
    private _handleSearch;
    private _handleTypeFilter;
    private _handleToggleView;
    private _handleSelect;
    private _setPage;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-catalog': PhzViewerCatalog;
    }
}
//# sourceMappingURL=phz-viewer-catalog.d.ts.map