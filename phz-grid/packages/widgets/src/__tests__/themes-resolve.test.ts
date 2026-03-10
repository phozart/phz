/**
 * @phozart/phz-widgets — Theme Resolution Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { resolveTheme, lightTheme, darkTheme, highContrastTheme } from '../themes.js';

describe('resolveTheme', () => {
  it('resolves "light" to lightTheme', () => {
    expect(resolveTheme('light')).toBe(lightTheme);
  });

  it('resolves "dark" to darkTheme', () => {
    expect(resolveTheme('dark')).toBe(darkTheme);
  });

  it('resolves "high-contrast" to highContrastTheme', () => {
    expect(resolveTheme('high-contrast')).toBe(highContrastTheme);
  });

  it('resolves "system" to darkTheme when system prefers dark', () => {
    const origMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
    expect(resolveTheme('system')).toBe(darkTheme);
    globalThis.matchMedia = origMatchMedia;
  });

  it('resolves "system" to lightTheme when system prefers light', () => {
    const origMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
    expect(resolveTheme('system')).toBe(lightTheme);
    globalThis.matchMedia = origMatchMedia;
  });

  it('defaults to lightTheme for unknown names', () => {
    expect(resolveTheme('unknown')).toBe(lightTheme);
    expect(resolveTheme('')).toBe(lightTheme);
  });
});
