/**
 * S.1 — Design Tokens + Shell Visual Styling tests
 */

import { describe, it, expect } from 'vitest';

describe('Design Tokens (S.1)', () => {
  describe('DESIGN_TOKENS export', () => {
    it('exports all color tokens', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.headerBg).toBe('#1C1917');
      expect(DESIGN_TOKENS.bgBase).toBe('#FEFDFB');
      expect(DESIGN_TOKENS.bgSubtle).toBe('#FAF9F7');
      expect(DESIGN_TOKENS.bgMuted).toBe('#F5F5F4');
      expect(DESIGN_TOKENS.bgEmphasis).toBe('#292524');
      expect(DESIGN_TOKENS.textPrimary).toBe('#1C1917');
      expect(DESIGN_TOKENS.textSecondary).toBe('#57534E');
      expect(DESIGN_TOKENS.textMuted).toBe('#78716C');
      expect(DESIGN_TOKENS.textFaint).toBe('#A8A29E');
      expect(DESIGN_TOKENS.borderDefault).toBe('#E7E5E4');
      expect(DESIGN_TOKENS.borderEmphasis).toBe('#D6D3D1');
    });

    it('exports header-specific tokens', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.headerText).toBe('#FAFAF9');
      expect(DESIGN_TOKENS.headerTextMuted).toBe('#A8A29E');
      expect(DESIGN_TOKENS.headerBorder).toBe('#292524');
      expect(DESIGN_TOKENS.headerAccent).toBe('#F59E0B');
    });

    it('exports semantic color tokens', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.primary500).toBe('#3B82F6');
      expect(DESIGN_TOKENS.info500).toBe('#06B6D4');
      expect(DESIGN_TOKENS.error500).toBe('#EF4444');
      expect(DESIGN_TOKENS.warning500).toBe('#F59E0B');
    });

    it('exports spacing tokens on 4px grid', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.space1).toBe('4px');
      expect(DESIGN_TOKENS.space2).toBe('8px');
      expect(DESIGN_TOKENS.space3).toBe('12px');
      expect(DESIGN_TOKENS.space4).toBe('16px');
      expect(DESIGN_TOKENS.space6).toBe('24px');
      expect(DESIGN_TOKENS.space8).toBe('32px');
      expect(DESIGN_TOKENS.space12).toBe('48px');
      expect(DESIGN_TOKENS.space16).toBe('64px');
    });

    it('exports typography tokens', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.fontSans).toBeDefined();
      expect(DESIGN_TOKENS.fontMono).toBeDefined();
      expect(DESIGN_TOKENS.textXs).toBeDefined();
      expect(DESIGN_TOKENS.textSm).toBeDefined();
      expect(DESIGN_TOKENS.textBase).toBeDefined();
      expect(DESIGN_TOKENS.textLg).toBeDefined();
      expect(DESIGN_TOKENS.textXl).toBeDefined();
      expect(DESIGN_TOKENS.text2xl).toBeDefined();
    });

    it('exports border radius tokens', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.radiusSm).toBe('6px');
      expect(DESIGN_TOKENS.radiusMd).toBe('8px');
      expect(DESIGN_TOKENS.radiusLg).toBe('12px');
      expect(DESIGN_TOKENS.radiusXl).toBe('16px');
      expect(DESIGN_TOKENS.radiusFull).toBe('9999px');
    });

    it('exports shadow tokens', async () => {
      const { DESIGN_TOKENS } = await import('../styles/design-tokens.js');
      expect(DESIGN_TOKENS.shadowXs).toBeDefined();
      expect(DESIGN_TOKENS.shadowSm).toBeDefined();
      expect(DESIGN_TOKENS.shadowMd).toBeDefined();
      expect(DESIGN_TOKENS.shadowLg).toBeDefined();
      expect(DESIGN_TOKENS.shadowXl).toBeDefined();
      expect(DESIGN_TOKENS.shadow2xl).toBeDefined();
    });
  });

  describe('generateTokenCSS()', () => {
    it('generates CSS custom properties string', async () => {
      const { generateTokenCSS } = await import('../styles/design-tokens.js');
      const css = generateTokenCSS();
      expect(css).toContain('--phz-header-bg: #1C1917');
      expect(css).toContain('--phz-bg-base: #FEFDFB');
      expect(css).toContain('--phz-space-1: 4px');
      expect(css).toContain('--phz-radius-sm: 6px');
      expect(css).toContain('--phz-primary-500: #3B82F6');
    });
  });

  describe('SHELL_LAYOUT constants', () => {
    it('exports shell layout dimensions', async () => {
      const { SHELL_LAYOUT } = await import('../styles/design-tokens.js');
      expect(SHELL_LAYOUT.headerHeight).toBe(56);
      expect(SHELL_LAYOUT.sidebarWidth).toBe(240);
      expect(SHELL_LAYOUT.contentMaxWidth).toBe(1440);
      expect(SHELL_LAYOUT.headerZ).toBe(50);
    });
  });

  describe('SECTION_HEADERS', () => {
    it('exports uppercase section header labels', async () => {
      const { SECTION_HEADERS } = await import('../styles/design-tokens.js');
      expect(SECTION_HEADERS).toContain('CONTENT');
      expect(SECTION_HEADERS).toContain('DATA');
      expect(SECTION_HEADERS).toContain('GOVERN');
    });
  });
});
