/**
 * @phozart/phz-widgets — Container Box Widget
 *
 * A visual container that groups child widgets with a configurable
 * appearance (background, border, shadow, padding) and optional
 * collapse/expand behavior.
 */
import { LitElement } from 'lit';
import type { ContainerBoxConfig } from '@phozart/phz-shared/types';
export declare class PhzContainerBox extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Container box configuration. */
    config: ContainerBoxConfig;
    /** Optional title displayed in the header. */
    boxTitle?: string;
    private boxState;
    willUpdate(changedProps: Map<string, unknown>): void;
    private handleToggle;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-container-box': PhzContainerBox;
    }
}
//# sourceMappingURL=phz-container-box.d.ts.map