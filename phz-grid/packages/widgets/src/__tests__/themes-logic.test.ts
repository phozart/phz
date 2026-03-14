/**
 * @phozart/widgets -- Themes Pure Logic Tests
 *
 * Tests for theme resolution, system theme detection, and theme application.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('lit', () => ({
  LitElement: class {},
  html: () => '',
  css: () => '',
}));
vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: any) => c,
  property: () => () => {},
  state: () => () => {},
}));

import {
  lightTheme,
  darkTheme,
  highContrastTheme,
  resolveTheme,
  detectSystemTheme,
  applyTheme,
  type DashboardTheme,
  type ThemeTokens,
} from '../themes.js';

describe('lightTheme', () => {
  it('has name "light"', () => {
    expect(lightTheme.name).toBe('light');
  });

  it('has white surface', () => {
    expect(lightTheme.tokens.surface).toBe('#FFFFFF');
  });

  it('has a chart palette with at least 8 colors', () => {
    expect(lightTheme.tokens.chartPalette.length).toBeGreaterThanOrEqual(8);
  });

  it('has all required token fields', () => {
    const tokens = lightTheme.tokens;
    expect(tokens.surface).toBeTruthy();
    expect(tokens.surfaceAlt).toBeTruthy();
    expect(tokens.text).toBeTruthy();
    expect(tokens.textMuted).toBeTruthy();
    expect(tokens.border).toBeTruthy();
    expect(tokens.accent).toBeTruthy();
    expect(tokens.success).toBeTruthy();
    expect(tokens.warning).toBeTruthy();
    expect(tokens.critical).toBeTruthy();
  });
});

describe('darkTheme', () => {
  it('has name "dark"', () => {
    expect(darkTheme.name).toBe('dark');
  });

  it('has dark surface', () => {
    expect(darkTheme.tokens.surface).toBe('#1C1917');
  });

  it('has light text', () => {
    expect(darkTheme.tokens.text).toBe('#FAFAF9');
  });
});

describe('highContrastTheme', () => {
  it('has name "high-contrast"', () => {
    expect(highContrastTheme.name).toBe('high-contrast');
  });

  it('has maximum contrast: white surface, black text', () => {
    expect(highContrastTheme.tokens.surface).toBe('#FFFFFF');
    expect(highContrastTheme.tokens.text).toBe('#000000');
  });

  it('has black border for maximum visibility', () => {
    expect(highContrastTheme.tokens.border).toBe('#000000');
  });
});

describe('resolveTheme', () => {
  it('returns dark theme for "dark"', () => {
    expect(resolveTheme('dark')).toBe(darkTheme);
  });

  it('returns high-contrast theme for "high-contrast"', () => {
    expect(resolveTheme('high-contrast')).toBe(highContrastTheme);
  });

  it('returns light theme for unknown name', () => {
    expect(resolveTheme('unknown')).toBe(lightTheme);
  });

  it('returns light theme for empty string', () => {
    expect(resolveTheme('')).toBe(lightTheme);
  });

  it('returns light theme for "light"', () => {
    expect(resolveTheme('light')).toBe(lightTheme);
  });
});

describe('detectSystemTheme', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
  });

  it('returns "light" when matchMedia is not available', () => {
    (globalThis as any).matchMedia = undefined;
    expect(detectSystemTheme()).toBe('light');
  });

  it('returns "dark" when prefers-color-scheme is dark', () => {
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
    expect(detectSystemTheme()).toBe('dark');
  });

  it('returns "light" when prefers-color-scheme is not dark', () => {
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
    expect(detectSystemTheme()).toBe('light');
  });
});

describe('resolveTheme with "system"', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
  });

  it('resolves to dark when system prefers dark', () => {
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
    const theme = resolveTheme('system');
    expect(theme).toBe(darkTheme);
  });

  it('resolves to light when system prefers light', () => {
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
    const theme = resolveTheme('system');
    expect(theme).toBe(lightTheme);
  });
});

describe('applyTheme', () => {
  it('sets CSS custom properties on the element', () => {
    const properties = new Map<string, string>();
    const mockElement = {
      style: {
        setProperty: vi.fn((key: string, value: string) => {
          properties.set(key, value);
        }),
      },
    } as any;

    applyTheme(mockElement, lightTheme);

    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--phz-surface', '#FFFFFF');
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--phz-text', '#1C1917');
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--phz-accent', '#3B82F6');
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--phz-success', '#16A34A');
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--phz-warning', '#D97706');
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--phz-critical', '#DC2626');
  });

  it('sets chart palette colors indexed by number', () => {
    const mockElement = {
      style: { setProperty: vi.fn() },
    } as any;

    applyTheme(mockElement, darkTheme);

    // Chart palette has 8 colors
    for (let i = 0; i < darkTheme.tokens.chartPalette.length; i++) {
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        `--phz-chart-${i}`,
        darkTheme.tokens.chartPalette[i],
      );
    }
  });

  it('applies all token properties', () => {
    const mockElement = {
      style: { setProperty: vi.fn() },
    } as any;

    applyTheme(mockElement, highContrastTheme);

    // 9 base tokens + chartPalette.length
    const expectedCalls = 9 + highContrastTheme.tokens.chartPalette.length;
    expect(mockElement.style.setProperty).toHaveBeenCalledTimes(expectedCalls);
  });
});
