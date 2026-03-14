/**
 * @phozart/viewer — <phz-viewer-empty> Custom Element
 *
 * Displays user-friendly empty states with optional call-to-action.
 * Uses shared EmptyScenario and EmptyStateConfig types.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { EmptyScenario, EmptyStateConfig } from '@phozart/shared/types';
export declare class PhzViewerEmpty extends LitElement {
    static styles: import("lit").CSSResult;
    scenario: EmptyScenario;
    config?: EmptyStateConfig;
    render(): TemplateResult;
    private _handleAction;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-empty': PhzViewerEmpty;
    }
}
//# sourceMappingURL=phz-viewer-empty.d.ts.map