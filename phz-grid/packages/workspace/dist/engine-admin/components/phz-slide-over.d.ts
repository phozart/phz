/**
 * @phozart/phz-engine-admin — Slide-Over Panel
 *
 * Reusable right-side slide-over panel (380px, backdrop, Escape close, focus trap).
 */
import { LitElement } from 'lit';
export declare class PhzSlideOver extends LitElement {
    static styles: import("lit").CSSResult;
    open: boolean;
    heading: string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onKeyDown;
    private _close;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-slide-over': PhzSlideOver;
    }
}
//# sourceMappingURL=phz-slide-over.d.ts.map