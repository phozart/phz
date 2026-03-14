/**
 * @phozart/viewer — <phz-viewer-explorer> Custom Element
 *
 * Explorer screen for self-service data exploration.
 * Delegates to @phozart/engine/explorer for the core logic.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { DataSourceMeta, FieldMetadata } from '@phozart/shared/adapters';
import type { DataExplorer } from '@phozart/engine/explorer';
import { type ExplorerScreenState } from '../screens/explorer-state.js';
export declare class PhzViewerExplorer extends LitElement {
    static styles: import("lit").CSSResult;
    dataSources: DataSourceMeta[];
    explorer?: DataExplorer;
    private _explorerState;
    willUpdate(changed: Map<string, unknown>): void;
    getExplorerState(): ExplorerScreenState;
    selectSource(sourceId: string): void;
    setSourceFields(fields: FieldMetadata[]): void;
    render(): TemplateResult;
    private _handleSourceSelect;
    private _handleFieldSearch;
    private _handleFieldClick;
    private _handlePreviewMode;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-explorer': PhzViewerExplorer;
    }
}
//# sourceMappingURL=phz-viewer-explorer.d.ts.map