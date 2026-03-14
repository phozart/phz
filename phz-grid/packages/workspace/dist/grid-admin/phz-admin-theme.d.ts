/**
 * @phozart/grid-admin — Theme / Styling Editor
 *
 * Color scheme toggle, token editors, density presets, preview.
 */
import { LitElement } from 'lit';
type Density = 'comfortable' | 'compact' | 'dense';
type ColorScheme = 'light' | 'dark' | 'auto';
export declare class PhzAdminTheme extends LitElement {
    static styles: import("lit").CSSResult[];
    colorScheme: ColorScheme;
    density: Density;
    tokens: Record<string, string>;
    private handleSchemeChange;
    private handleDensityChange;
    private handleTokenChange;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-theme': PhzAdminTheme;
    }
}
export {};
//# sourceMappingURL=phz-admin-theme.d.ts.map