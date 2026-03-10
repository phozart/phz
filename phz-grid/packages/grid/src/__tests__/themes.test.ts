import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  lightTheme,
  darkTheme,
  midnightTheme,
  sandTheme,
  highContrastTheme,
  themes,
  applyGridTheme,
  detectColorScheme,
  resolveGridTheme,
  type GridTheme,
} from '../themes.js';

// -- Preset validation --

describe('Theme presets', () => {
  const allThemes = [lightTheme, darkTheme, midnightTheme, sandTheme, highContrastTheme];

  it('all presets have required token keys', () => {
    const requiredKeys = [
      '--phz-grid-bg',
      '--phz-grid-text',
      '--phz-grid-border',
      '--phz-header-bg',
      '--phz-header-text',
      '--phz-header-bar-bg',
      '--phz-row-bg-alt',
      '--phz-row-bg-hover',
      '--phz-row-bg-selected',
      '--phz-row-border',
      '--phz-footer-bg',
      '--phz-footer-text',
      '--phz-popover-bg',
      '--phz-popover-border',
      '--phz-color-primary',
      '--phz-shadow-lg',
    ];

    for (const theme of allThemes) {
      for (const key of requiredKeys) {
        expect(theme.tokens).toHaveProperty(key);
      }
    }
  });

  it('all presets have a name', () => {
    for (const theme of allThemes) {
      expect(theme.name).toBeTruthy();
    }
  });

  it('all presets have a colorScheme', () => {
    for (const theme of allThemes) {
      expect(['light', 'dark']).toContain(theme.colorScheme);
    }
  });

  it('dark themes declare dark colorScheme', () => {
    expect(darkTheme.colorScheme).toBe('dark');
    expect(midnightTheme.colorScheme).toBe('dark');
  });

  it('light themes declare light colorScheme', () => {
    expect(lightTheme.colorScheme).toBe('light');
    expect(sandTheme.colorScheme).toBe('light');
    expect(highContrastTheme.colorScheme).toBe('light');
  });

  it('token values are non-empty strings', () => {
    for (const theme of allThemes) {
      for (const [key, value] of Object.entries(theme.tokens)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});

// -- Registry --

describe('themes registry', () => {
  it('contains all named presets', () => {
    expect(themes).toHaveProperty('light');
    expect(themes).toHaveProperty('dark');
    expect(themes).toHaveProperty('midnight');
    expect(themes).toHaveProperty('sand');
    expect(themes).toHaveProperty('high-contrast');
  });

  it('registry values match exports', () => {
    expect(themes.light).toBe(lightTheme);
    expect(themes.dark).toBe(darkTheme);
    expect(themes.midnight).toBe(midnightTheme);
    expect(themes.sand).toBe(sandTheme);
    expect(themes['high-contrast']).toBe(highContrastTheme);
  });
});

// -- applyGridTheme --

describe('applyGridTheme', () => {
  let mockElement: HTMLElement;
  let properties: Map<string, string>;

  beforeEach(() => {
    properties = new Map();
    mockElement = {
      style: {
        setProperty: vi.fn((k: string, v: string) => properties.set(k, v)),
      },
    } as any;
  });

  it('applies all tokens from a theme object', () => {
    applyGridTheme(mockElement, darkTheme);
    expect(properties.get('--phz-grid-bg')).toBe('#1C1917');
    expect(properties.get('--phz-grid-text')).toBe('#F5F5F4');
    expect(properties.get('--phz-color-primary')).toBe('#60A5FA');
  });

  it('applies theme by name string', () => {
    applyGridTheme(mockElement, 'midnight');
    expect(properties.get('--phz-grid-bg')).toBe('#0F172A');
  });

  it('falls back to light when name is unknown', () => {
    applyGridTheme(mockElement, 'nonexistent');
    expect(properties.get('--phz-grid-bg')).toBe(lightTheme.tokens['--phz-grid-bg']);
  });

  it('sets the correct number of properties', () => {
    applyGridTheme(mockElement, lightTheme);
    expect(mockElement.style.setProperty).toHaveBeenCalledTimes(
      Object.keys(lightTheme.tokens).length,
    );
  });
});

// -- detectColorScheme --

describe('detectColorScheme', () => {
  it('returns light when matchMedia is unavailable', () => {
    const original = globalThis.matchMedia;
    (globalThis as any).matchMedia = undefined;
    expect(detectColorScheme()).toBe('light');
    globalThis.matchMedia = original;
  });

  it('returns dark when prefers-color-scheme matches dark', () => {
    const original = globalThis.matchMedia;
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: true }));
    expect(detectColorScheme()).toBe('dark');
    globalThis.matchMedia = original;
  });

  it('returns light when prefers-color-scheme does not match dark', () => {
    const original = globalThis.matchMedia;
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: false }));
    expect(detectColorScheme()).toBe('light');
    globalThis.matchMedia = original;
  });
});

// -- resolveGridTheme --

describe('resolveGridTheme', () => {
  it('resolves named themes', () => {
    expect(resolveGridTheme('dark')).toBe(darkTheme);
    expect(resolveGridTheme('midnight')).toBe(midnightTheme);
    expect(resolveGridTheme('sand')).toBe(sandTheme);
    expect(resolveGridTheme('high-contrast')).toBe(highContrastTheme);
    expect(resolveGridTheme('light')).toBe(lightTheme);
  });

  it('resolves "auto" to system preference', () => {
    const original = globalThis.matchMedia;
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: true }));
    expect(resolveGridTheme('auto')).toBe(darkTheme);
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: false }));
    expect(resolveGridTheme('auto')).toBe(lightTheme);
    globalThis.matchMedia = original;
  });

  it('resolves "system" same as "auto"', () => {
    const original = globalThis.matchMedia;
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: true }));
    expect(resolveGridTheme('system')).toBe(darkTheme);
    globalThis.matchMedia = original;
  });

  it('falls back to light for unknown names', () => {
    expect(resolveGridTheme('banana')).toBe(lightTheme);
  });
});
