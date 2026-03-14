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

// -- Types --

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

// -- Built-in Presets --

/** Default warm light theme — Phozart Surface mode */
export const lightTheme: GridTheme = {
  name: 'light',
  colorScheme: 'light',
  tokens: {
    '--phz-grid-bg': '#FEFDFB',
    '--phz-grid-text': '#1C1917',
    '--phz-grid-border': '#E7E5E4',
    '--phz-header-bg': '#1C1917',
    '--phz-header-text': '#FAFAF9',
    '--phz-header-bar-bg': '#1C1917',
    '--phz-row-bg-alt': '#FAF9F7',
    '--phz-row-bg-hover': 'rgba(59, 130, 246, 0.06)',
    '--phz-row-bg-selected': 'rgba(59, 130, 246, 0.12)',
    '--phz-row-border': '#F5F5F4',
    '--phz-footer-bg': '#F5F5F4',
    '--phz-footer-text': '#44403C',
    '--phz-popover-bg': '#FEFDFB',
    '--phz-popover-border': '#E7E5E4',
    '--phz-color-primary': '#3B82F6',
    '--phz-shadow-lg': '0 10px 25px rgba(28,25,23,0.10), 0 4px 10px rgba(28,25,23,0.05)',
  },
};

/** Phozart Console dark theme — warm stone dark palette */
export const darkTheme: GridTheme = {
  name: 'dark',
  colorScheme: 'dark',
  tokens: {
    '--phz-grid-bg': '#1C1917',
    '--phz-grid-text': '#F5F5F4',
    '--phz-grid-border': '#44403C',
    '--phz-header-bg': '#292524',
    '--phz-header-text': '#D6D3D1',
    '--phz-header-bar-bg': '#0C0A09',
    '--phz-row-bg-alt': '#211E1B',
    '--phz-row-bg-hover': '#292524',
    '--phz-row-bg-selected': '#172554',
    '--phz-row-border': '#292524',
    '--phz-footer-bg': '#211E1B',
    '--phz-footer-text': '#78716C',
    '--phz-popover-bg': '#292524',
    '--phz-popover-border': '#44403C',
    '--phz-color-primary': '#60A5FA',
    '--phz-shadow-lg': '0 10px 25px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15)',
  },
};

/** Deep blue-black theme for immersive dark environments */
export const midnightTheme: GridTheme = {
  name: 'midnight',
  colorScheme: 'dark',
  tokens: {
    '--phz-grid-bg': '#0F172A',
    '--phz-grid-text': '#E2E8F0',
    '--phz-grid-border': '#334155',
    '--phz-header-bg': '#1E293B',
    '--phz-header-text': '#CBD5E1',
    '--phz-header-bar-bg': '#020617',
    '--phz-row-bg-alt': '#1E293B',
    '--phz-row-bg-hover': '#1E293B',
    '--phz-row-bg-selected': '#1E3A5F',
    '--phz-row-border': '#1E293B',
    '--phz-footer-bg': '#1E293B',
    '--phz-footer-text': '#64748B',
    '--phz-popover-bg': '#1E293B',
    '--phz-popover-border': '#334155',
    '--phz-color-primary': '#38BDF8',
    '--phz-shadow-lg': '0 10px 25px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.20)',
  },
};

/** Sand/warm neutral theme — Muji-inspired restraint */
export const sandTheme: GridTheme = {
  name: 'sand',
  colorScheme: 'light',
  tokens: {
    '--phz-grid-bg': '#FAFAF5',
    '--phz-grid-text': '#292524',
    '--phz-grid-border': '#D6D3D1',
    '--phz-header-bg': '#44403C',
    '--phz-header-text': '#FAFAF9',
    '--phz-header-bar-bg': '#292524',
    '--phz-row-bg-alt': '#F5F4F0',
    '--phz-row-bg-hover': 'rgba(168, 162, 158, 0.10)',
    '--phz-row-bg-selected': 'rgba(168, 162, 158, 0.20)',
    '--phz-row-border': '#E7E5E4',
    '--phz-footer-bg': '#F5F4F0',
    '--phz-footer-text': '#57534E',
    '--phz-popover-bg': '#FAFAF5',
    '--phz-popover-border': '#D6D3D1',
    '--phz-color-primary': '#57534E',
    '--phz-shadow-lg': '0 10px 25px rgba(41,37,36,0.08), 0 4px 10px rgba(41,37,36,0.04)',
  },
};

/** High-contrast theme for accessibility — WCAG AAA */
export const highContrastTheme: GridTheme = {
  name: 'high-contrast',
  colorScheme: 'light',
  tokens: {
    '--phz-grid-bg': '#FFFFFF',
    '--phz-grid-text': '#000000',
    '--phz-grid-border': '#000000',
    '--phz-header-bg': '#000000',
    '--phz-header-text': '#FFFFFF',
    '--phz-header-bar-bg': '#000000',
    '--phz-row-bg-alt': '#F5F5F5',
    '--phz-row-bg-hover': '#E5E5E5',
    '--phz-row-bg-selected': '#BFDBFE',
    '--phz-row-border': '#D4D4D4',
    '--phz-footer-bg': '#F5F5F5',
    '--phz-footer-text': '#000000',
    '--phz-popover-bg': '#FFFFFF',
    '--phz-popover-border': '#000000',
    '--phz-color-primary': '#0000EE',
    '--phz-shadow-lg': '0 0 0 2px #000000',
  },
};

// -- Preset registry --

export const themes: Record<string, GridTheme> = {
  light: lightTheme,
  dark: darkTheme,
  midnight: midnightTheme,
  sand: sandTheme,
  'high-contrast': highContrastTheme,
};

// -- Application --

/**
 * Apply a theme preset to a grid element by setting CSS custom properties.
 * Works with any HTMLElement (Lit host, or a wrapper div).
 */
export function applyGridTheme(element: HTMLElement, themeOrName: GridTheme | string): void {
  const theme = typeof themeOrName === 'string'
    ? themes[themeOrName] ?? lightTheme
    : themeOrName;

  for (const [prop, value] of Object.entries(theme.tokens)) {
    element.style.setProperty(prop, value);
  }
}

/**
 * Detect system color scheme preference.
 */
export function detectColorScheme(): 'light' | 'dark' {
  if (typeof globalThis.matchMedia !== 'function') return 'light';
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve a theme name to a GridTheme, with 'auto'/'system' support.
 */
export function resolveGridTheme(name: string): GridTheme {
  if (name === 'auto' || name === 'system') {
    return detectColorScheme() === 'dark' ? darkTheme : lightTheme;
  }
  return themes[name] ?? lightTheme;
}
