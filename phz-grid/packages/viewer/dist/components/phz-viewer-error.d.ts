/**
 * @phozart/phz-viewer — <phz-viewer-error> Custom Element
 *
 * Displays user-friendly error states with recovery actions.
 * Uses shared ErrorState and ErrorStateConfig types.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { ErrorState, ErrorScenario, ErrorStateConfig } from '@phozart/phz-shared/types';
export declare class PhzViewerError extends LitElement {
    static styles: import("lit").CSSResult;
    error?: ErrorState;
    scenario?: ErrorScenario;
    config?: ErrorStateConfig;
    render(): TemplateResult;
    private _handleAction;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-error': PhzViewerError;
    }
}
//# sourceMappingURL=phz-viewer-error.d.ts.map