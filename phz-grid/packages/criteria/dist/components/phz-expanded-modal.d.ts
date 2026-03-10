/**
 * @phozart/phz-criteria — Expanded Modal
 *
 * Near-full-screen modal with backdrop. Two-column layout:
 * sidebar (240px, for presets) | main content (tree/filter).
 * Escape key closes, focus trap.
 */
import { LitElement, nothing } from 'lit';
export declare class PhzExpandedModal extends LitElement {
    static styles: import("lit").CSSResult[];
    open: boolean;
    modalTitle: string;
    private _panel?;
    private _keydownHandler;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    private _close;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
}
//# sourceMappingURL=phz-expanded-modal.d.ts.map