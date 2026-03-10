/**
 * @phozart/phz-workspace — ResponsivePreview Component
 *
 * A device-preview simulator that constrains slotted content
 * to Desktop (1200px), Tablet (768px), or Mobile (375px) widths.
 * Uses container queries so child components can respond to the
 * constrained width rather than the viewport.
 */
import { LitElement } from 'lit';
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export declare const PREVIEW_WIDTHS: Record<PreviewDevice, number>;
export declare class PhzResponsivePreview extends LitElement {
    static readonly TAG: "phz-responsive-preview";
    static styles: import("lit").CSSResult;
    private activeDevice;
    private _setDevice;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=responsive-preview.d.ts.map