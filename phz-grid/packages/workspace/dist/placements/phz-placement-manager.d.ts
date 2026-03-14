/**
 * @phozart/workspace — PlacementManager
 *
 * Lit Web Component for CRUD on PlacementRecords.
 * Uses WorkspaceAdapter placement methods (savePlacement, loadPlacements, deletePlacement).
 */
import { LitElement } from 'lit';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
export declare class PhzPlacementManager extends LitElement {
    static readonly TAG = "phz-placement-manager";
    static styles: import("lit").CSSResult;
    adapter?: WorkspaceAdapter;
    artifactId?: string;
    private placements;
    private loading;
    connectedCallback(): Promise<void>;
    refresh(): Promise<void>;
    private get filteredPlacements();
    private handleAdd;
    private handleDelete;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-placement-manager': PhzPlacementManager;
    }
}
//# sourceMappingURL=phz-placement-manager.d.ts.map