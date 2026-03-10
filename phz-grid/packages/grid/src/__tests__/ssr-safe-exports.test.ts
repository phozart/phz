import { describe, it, expect } from 'vitest';

describe('SSR-safe subpath exports', () => {
  describe('themes-only', () => {
    it('exports all theme symbols', async () => {
      const mod = await import('../themes-only.js');
      expect(mod.themes).toBeDefined();
      expect(mod.lightTheme).toBeDefined();
      expect(mod.darkTheme).toBeDefined();
      expect(mod.midnightTheme).toBeDefined();
      expect(mod.sandTheme).toBeDefined();
      expect(mod.highContrastTheme).toBeDefined();
      expect(mod.applyGridTheme).toBeTypeOf('function');
      expect(mod.resolveGridTheme).toBeTypeOf('function');
      expect(mod.detectColorScheme).toBeTypeOf('function');
    });

    it('does not import Lit components', async () => {
      const fs = await import('fs');
      const src = fs.readFileSync(
        new URL('../themes-only.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
        'utf-8',
      );
      expect(src).not.toMatch(/@customElement/);
      expect(src).not.toMatch(/import.*from.*components/);
      expect(src).not.toMatch(/import.*from.*lit/);
    });
  });

  describe('tokens-only', () => {
    it('exports all token symbols', async () => {
      const mod = await import('../tokens-only.js');
      expect(mod.BrandTokens).toBeDefined();
      expect(mod.SemanticTokens).toBeDefined();
      expect(mod.ComponentTokens).toBeDefined();
      expect(mod.generateTokenStyles).toBeTypeOf('function');
    });

    it('does not import Lit components', async () => {
      const fs = await import('fs');
      const src = fs.readFileSync(
        new URL('../tokens-only.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
        'utf-8',
      );
      expect(src).not.toMatch(/@customElement/);
      expect(src).not.toMatch(/import.*from.*components/);
      expect(src).not.toMatch(/import.*from.*lit/);
    });
  });
});
