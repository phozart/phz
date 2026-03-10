/**
 * @phozart/phz-grid — Token System Tests
 */
import { describe, it, expect } from 'vitest';
import { BrandTokens, SemanticTokens, ComponentTokens, generateTokenStyles } from '../tokens.js';

describe('BrandTokens', () => {
  it('contains primary color', () => {
    expect(BrandTokens['--phz-color-primary']).toBeDefined();
  });

  it('contains warm neutral palette (50-900)', () => {
    expect(BrandTokens['--phz-color-neutral-50']).toBeDefined();
    expect(BrandTokens['--phz-color-neutral-900']).toBeDefined();
  });

  it('contains font families', () => {
    expect(BrandTokens['--phz-font-family-base']).toContain('SF Pro Display');
    expect(BrandTokens['--phz-font-family-mono']).toContain('SF Mono');
  });

  it('contains font sizes', () => {
    expect(BrandTokens['--phz-font-size-xs']).toBe('0.75rem');
    expect(BrandTokens['--phz-font-size-base']).toBe('0.875rem');
  });

  it('contains spacing values', () => {
    expect(BrandTokens['--phz-spacing-xs']).toBe('0.25rem');
    expect(BrandTokens['--phz-spacing-xl']).toBe('2rem');
  });

  it('contains border radii', () => {
    expect(BrandTokens['--phz-border-radius-sm']).toBe('6px');
    expect(BrandTokens['--phz-border-radius-full']).toBe('9999px');
  });

  it('contains shadow values', () => {
    expect(BrandTokens['--phz-shadow-sm']).toBeDefined();
    expect(BrandTokens['--phz-shadow-lg']).toBeDefined();
  });

  it('contains status colors', () => {
    expect(BrandTokens['--phz-color-success']).toBeDefined();
    expect(BrandTokens['--phz-color-warning']).toBeDefined();
    expect(BrandTokens['--phz-color-danger']).toBeDefined();
  });
});

describe('SemanticTokens', () => {
  it('contains grid background and text', () => {
    expect(SemanticTokens['--phz-grid-bg']).toBeDefined();
    expect(SemanticTokens['--phz-grid-text']).toBeDefined();
  });

  it('contains header tokens', () => {
    expect(SemanticTokens['--phz-header-bg']).toBe('#1C1917');
    expect(SemanticTokens['--phz-header-text']).toBe('#FAFAF9');
  });

  it('contains row alternating colors', () => {
    expect(SemanticTokens['--phz-row-bg']).toBeDefined();
    expect(SemanticTokens['--phz-row-bg-alt']).toBeDefined();
    expect(SemanticTokens['--phz-row-bg-hover']).toBeDefined();
    expect(SemanticTokens['--phz-row-bg-selected']).toBeDefined();
  });

  it('contains focus ring tokens', () => {
    expect(SemanticTokens['--phz-focus-ring-color']).toBeDefined();
    expect(SemanticTokens['--phz-focus-ring-width']).toBe('2px');
  });
});

describe('ComponentTokens', () => {
  it('contains cell styling tokens', () => {
    expect(ComponentTokens['--phz-cell-padding']).toBeDefined();
    expect(ComponentTokens['--phz-cell-font-size']).toBeDefined();
  });

  it('contains density scale row heights', () => {
    expect(ComponentTokens['--phz-row-height']).toBe('40px');
    expect(ComponentTokens['--phz-row-height-compact']).toBe('36px');
    expect(ComponentTokens['--phz-row-height-comfortable']).toBe('48px');
    expect(ComponentTokens['--phz-row-height-dense']).toBe('32px');
  });

  it('contains header styling tokens', () => {
    expect(ComponentTokens['--phz-header-text-transform']).toBe('uppercase');
    expect(ComponentTokens['--phz-header-letter-spacing']).toBe('0.06em');
  });
});

describe('generateTokenStyles', () => {
  it('returns a CSS string with :host selector', () => {
    const css = generateTokenStyles();
    expect(css).toContain(':host {');
    expect(css).toContain('}');
  });

  it('includes brand tokens', () => {
    const css = generateTokenStyles();
    expect(css).toContain('--phz-color-primary');
  });

  it('includes semantic tokens', () => {
    const css = generateTokenStyles();
    expect(css).toContain('--phz-grid-bg');
  });

  it('includes component tokens', () => {
    const css = generateTokenStyles();
    expect(css).toContain('--phz-cell-padding');
    expect(css).toContain('--phz-row-height');
  });
});
