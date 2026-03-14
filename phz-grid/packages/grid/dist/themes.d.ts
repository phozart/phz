/**
 * @phozart/grid — Theme Presets
 *
 * Named theme presets that override the grid's CSS custom properties.
 * Each preset provides semantic tokens (colors, borders, shadows)
 * while sharing the same brand tokens (typography, spacing, radii).
 *
 * Usage:
 *   import { themes, applyGridTheme } from '@phozart/grid';
 *   applyGridTheme(gridElement, 'midnight');
 *
 * Or via the theme property:
 *   <phz-grid theme="midnight"></phz-grid>
 */
export interface GridThemeTokens {
    '--phz-grid-bg': string;
    '--phz-grid-text': string;
    '--phz-grid-border': string;
    '--phz-header-bg': string;
    '--phz-header-text': string;
    '--phz-header-bar-bg': string;
    '--phz-row-bg-alt': string;
    '--phz-row-bg-hover': string;
    '--phz-row-bg-selected': string;
    '--phz-row-border': string;
    '--phz-footer-bg': string;
    '--phz-footer-text': string;
    '--phz-popover-bg': string;
    '--phz-popover-border': string;
    '--phz-color-primary': string;
    '--phz-shadow-lg': string;
    [key: `--phz-${string}`]: string;
}
export interface GridTheme {
    name: string;
    colorScheme: 'light' | 'dark';
    tokens: GridThemeTokens;
}
/** Default warm light theme — Phozart Surface mode */
export declare const lightTheme: GridTheme;
/** Phozart Console dark theme — warm stone dark palette */
export declare const darkTheme: GridTheme;
/** Deep blue-black theme for immersive dark environments */
export declare const midnightTheme: GridTheme;
/** Sand/warm neutral theme — Muji-inspired restraint */
export declare const sandTheme: GridTheme;
/** High-contrast theme for accessibility — WCAG AAA */
export declare const highContrastTheme: GridTheme;
export declare const themes: Record<string, GridTheme>;
/**
 * Apply a theme preset to a grid element by setting CSS custom properties.
 * Works with any HTMLElement (Lit host, or a wrapper div).
 */
export declare function applyGridTheme(element: HTMLElement, themeOrName: GridTheme | string): void;
/**
 * Detect system color scheme preference.
 */
export declare function detectColorScheme(): 'light' | 'dark';
/**
 * Resolve a theme name to a GridTheme, with 'auto'/'system' support.
 */
export declare function resolveGridTheme(name: string): GridTheme;
//# sourceMappingURL=themes.d.ts.map