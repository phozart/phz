/**
 * @phozart/editor — <phz-sharing-flow> (B-2.11)
 *
 * Sharing workflow component. Manages visibility transitions
 * and share target selection.
 */
import { LitElement } from 'lit';
import type { ArtifactVisibility } from '@phozart/shared/artifacts';
import type { SharingFlowState } from '../authoring/sharing-state.js';
export declare class PhzSharingFlow extends LitElement {
    static styles: import("lit").CSSResult;
    artifactId: string;
    visibility: ArtifactVisibility;
    canPublish: boolean;
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current sharing state. */
    getState(): SharingFlowState;
    private _setVisibility;
    private _onSave;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-sharing-flow': PhzSharingFlow;
    }
}
//# sourceMappingURL=phz-sharing-flow.d.ts.map