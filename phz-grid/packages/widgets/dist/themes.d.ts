/**
 * @phozart/widgets -- Dashboard Themes
 *
 * Theme system with light, dark, and high-contrast built-in themes.
 * Applies CSS custom properties for surface, text, border, accent,
 * status colors, and chart palettes.
 */
import { LitElement } from 'lit';
export interface ThemeTokens {
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    critical: string;
    chartPalette: string[];
}
export interface DashboardTheme {
    name: string;
    tokens: ThemeTokens;
}
export declare const lightTheme: DashboardTheme;
export declare const darkTheme: DashboardTheme;
export declare const highContrastTheme: DashboardTheme;
export declare function applyTheme(element: HTMLElement, theme: DashboardTheme): void;
export declare function detectSystemTheme(): 'light' | 'dark';
export declare function resolveTheme(name: string): DashboardTheme;
export declare class PhzThemeSwitcher extends LitElement {
    static styles: import("lit").CSSResult[];
    selected: string;
    private _systemListener?;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _watchSystem;
    private _unwatchSystem;
    private _onSystemChange;
    private _onSelect;
    private _emitThemeChange;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-theme-switcher': PhzThemeSwitcher;
    }
}
//# sourceMappingURL=themes.d.ts.map