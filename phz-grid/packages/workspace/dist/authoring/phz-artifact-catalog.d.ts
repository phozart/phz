/**
 * @phozart/phz-workspace — Artifact Catalog Component
 *
 * Home screen showing all reports and dashboards with search, tag filtering,
 * sorting, and status badges.
 */
import { LitElement } from 'lit';
import type { ArtifactMeta } from '../types.js';
export declare class PhzArtifactCatalog extends LitElement {
    artifacts: ArtifactMeta[];
    private _state;
    static styles: import("lit").CSSResult;
    willUpdate(changed: Map<string, unknown>): void;
    private _onSearch;
    private _onTypeFilter;
    private _onSort;
    private _onToggleTag;
    private _onArtifactClick;
    private _onNewReport;
    private _onNewDashboard;
    private _formatDate;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-artifact-catalog': PhzArtifactCatalog;
    }
}
//# sourceMappingURL=phz-artifact-catalog.d.ts.map