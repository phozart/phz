import { describe, it, expect, vi } from 'vitest';

import {
  lightTheme,
  darkTheme,
  highContrastTheme,
  applyTheme,
  detectSystemTheme,
  type DashboardTheme,
} from '../themes.js';

describe('DashboardTheme definitions', () => {
  it('lightTheme has required token categories', () => {
    expect(lightTheme.name).toBe('light');
    expect(lightTheme.tokens.surface).toBeDefined();
    expect(lightTheme.tokens.text).toBeDefined();
    expect(lightTheme.tokens.border).toBeDefined();
    expect(lightTheme.tokens.accent).toBeDefined();
    expect(lightTheme.tokens.success).toBeDefined();
    expect(lightTheme.tokens.warning).toBeDefined();
    expect(lightTheme.tokens.critical).toBeDefined();
    expect(lightTheme.tokens.chartPalette).toBeDefined();
    expect(Array.isArray(lightTheme.tokens.chartPalette)).toBe(true);
  });

  it('darkTheme has dark surfaces and light text', () => {
    expect(darkTheme.name).toBe('dark');
    // Dark surfaces should be dark (low lightness)
    expect(darkTheme.tokens.surface).toBeTruthy();
    expect(darkTheme.tokens.text).toBeTruthy();
    // Ensure surface !== text (dark surface, light text)
    expect(darkTheme.tokens.surface).not.toBe(darkTheme.tokens.text);
  });

  it('highContrastTheme has name high-contrast', () => {
    expect(highContrastTheme.name).toBe('high-contrast');
    expect(highContrastTheme.tokens.surface).toBeDefined();
    expect(highContrastTheme.tokens.border).toBeDefined();
  });

  it('all themes have chart palettes with at least 6 colors', () => {
    expect(lightTheme.tokens.chartPalette.length).toBeGreaterThanOrEqual(6);
    expect(darkTheme.tokens.chartPalette.length).toBeGreaterThanOrEqual(6);
    expect(highContrastTheme.tokens.chartPalette.length).toBeGreaterThanOrEqual(6);
  });
});

describe('applyTheme', () => {
  it('sets CSS custom properties on an element', () => {
    const styles: Record<string, string> = {};
    const mockElement = {
      style: {
        setProperty: (name: string, value: string) => {
          styles[name] = value;
        },
      },
    } as unknown as HTMLElement;

    applyTheme(mockElement, lightTheme);

    expect(styles['--phz-surface']).toBe(lightTheme.tokens.surface);
    expect(styles['--phz-text']).toBe(lightTheme.tokens.text);
    expect(styles['--phz-border']).toBe(lightTheme.tokens.border);
    expect(styles['--phz-accent']).toBe(lightTheme.tokens.accent);
    expect(styles['--phz-success']).toBe(lightTheme.tokens.success);
    expect(styles['--phz-warning']).toBe(lightTheme.tokens.warning);
    expect(styles['--phz-critical']).toBe(lightTheme.tokens.critical);
  });

  it('sets chart palette as indexed custom properties', () => {
    const styles: Record<string, string> = {};
    const mockElement = {
      style: {
        setProperty: (name: string, value: string) => {
          styles[name] = value;
        },
      },
    } as unknown as HTMLElement;

    applyTheme(mockElement, lightTheme);

    lightTheme.tokens.chartPalette.forEach((color, i) => {
      expect(styles[`--phz-chart-${i}`]).toBe(color);
    });
  });

  it('applies dark theme tokens correctly', () => {
    const styles: Record<string, string> = {};
    const mockElement = {
      style: {
        setProperty: (name: string, value: string) => {
          styles[name] = value;
        },
      },
    } as unknown as HTMLElement;

    applyTheme(mockElement, darkTheme);
    expect(styles['--phz-surface']).toBe(darkTheme.tokens.surface);
    expect(styles['--phz-text']).toBe(darkTheme.tokens.text);
  });
});

describe('detectSystemTheme', () => {
  it('returns "dark" when prefers-color-scheme is dark', () => {
    const origMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
    expect(detectSystemTheme()).toBe('dark');
    globalThis.matchMedia = origMatchMedia;
  });

  it('returns "light" when prefers-color-scheme is light', () => {
    const origMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
    expect(detectSystemTheme()).toBe('light');
    globalThis.matchMedia = origMatchMedia;
  });

  it('returns "light" when matchMedia is unavailable', () => {
    const origMatchMedia = globalThis.matchMedia;
    (globalThis as any).matchMedia = undefined;
    expect(detectSystemTheme()).toBe('light');
    globalThis.matchMedia = origMatchMedia;
  });
});
