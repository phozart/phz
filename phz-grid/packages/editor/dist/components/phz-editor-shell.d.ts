/**
 * @phozart/editor — <phz-editor-shell> (B-2.02)
 *
 * Top-level Web Component for the editor shell. Manages screen
 * routing, toolbar, breadcrumbs, and delegates to child screen
 * components. All logic lives in the headless state machine;
 * this component is a thin Lit rendering layer.
 */
import { LitElement } from 'lit';
import type { EditorShellState, EditorScreen } from '../editor-state.js';
export declare class PhzEditorShell extends LitElement {
    static styles: import("lit").CSSResult;
    theme: string;
    locale: string;
    private _state;
    /** Navigate to a screen. Dispatches a screen-change event. */
    navigate(screen: EditorScreen, artifactId?: string, artifactType?: string): void;
    /** Go back in navigation history. */
    goBack(): void;
    /** Go forward in navigation history. */
    goForward(): void;
    /** Toggle editing mode. */
    toggleEdit(): void;
    /** Get the current shell state. */
    getState(): EditorShellState;
    private _dispatchScreenChange;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-editor-shell': PhzEditorShell;
    }
}
//# sourceMappingURL=phz-editor-shell.d.ts.map