/**
 * @phozart/phz-viewer — <phz-viewer-shell> Custom Element
 *
 * Top-level shell component for the read-only viewer. Renders
 * a navigation bar, screen content area, and attention dropdown.
 * Delegates all logic to the headless viewer-state functions.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { ViewerContext } from '@phozart/phz-shared/adapters';
import type { ErrorState, EmptyState } from '@phozart/phz-shared/types';
import { type ViewerScreen, type ViewerShellState } from '../viewer-state.js';
import type { ViewerShellConfig } from '../viewer-config.js';
export interface ViewerNavigateEventDetail {
    screen: ViewerScreen;
    artifactId?: string;
    artifactType?: string;
}
export interface ViewerErrorActionEventDetail {
    action: string;
    error: ErrorState;
}
export declare class PhzViewerShell extends LitElement {
    static styles: import("lit").CSSResult;
    config?: ViewerShellConfig;
    viewerContext?: ViewerContext;
    theme: string;
    mobile: boolean;
    private _shellState;
    connectedCallback(): void;
    getShellState(): ViewerShellState;
    navigate(screen: ViewerScreen, artifactId?: string, artifactType?: string): void;
    goBack(): void;
    goForward(): void;
    setShellError(error: ErrorState | null): void;
    setShellEmpty(empty: EmptyState | null): void;
    setShellLoading(loading: boolean): void;
    setShellAttentionCount(count: number): void;
    render(): TemplateResult;
    private _handleBack;
    private _handleForward;
    private _handleAttentionClick;
    private _dispatchNavigate;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-viewer-shell': PhzViewerShell;
    }
}
//# sourceMappingURL=phz-viewer-shell.d.ts.map