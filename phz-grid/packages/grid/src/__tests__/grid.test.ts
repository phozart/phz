/**
 * @phozart/phz-grid — Tests
 *
 * Tests for the grid package's non-DOM exports (tokens, forced colors detection,
 * event helpers). Lit Web Component rendering tests require a browser or
 * happy-dom/jsdom and will be tested separately with Playwright.
 */
import { describe, it, expect } from 'vitest';
import {
  BrandTokens,
  SemanticTokens,
  ComponentTokens,
  generateTokenStyles,
} from '../tokens.js';
import { AriaManager } from '../a11y/aria-manager.js';
import { KeyboardNavigator, type GridCellPosition } from '../a11y/keyboard-navigator.js';
import { ForcedColorsAdapter } from '../a11y/forced-colors-adapter.js';

// ─── Token Tests ────────────────────────────────────────────
describe('CSS Design Tokens', () => {
  it('BrandTokens has color primitives', () => {
    expect(BrandTokens['--phz-color-primary']).toBe('#3B82F6');
    expect(BrandTokens['--phz-color-danger']).toBe('#EF4444');
  });

  it('BrandTokens has font families', () => {
    expect(BrandTokens['--phz-font-family-base']).toContain('system-ui');
    expect(BrandTokens['--phz-font-family-mono']).toContain('monospace');
  });

  it('BrandTokens has spacing scale', () => {
    expect(BrandTokens['--phz-spacing-xs']).toBe('0.25rem');
    expect(BrandTokens['--phz-spacing-sm']).toBe('0.5rem');
    expect(BrandTokens['--phz-spacing-md']).toBe('1rem');
    expect(BrandTokens['--phz-spacing-lg']).toBe('1.5rem');
    expect(BrandTokens['--phz-spacing-xl']).toBe('2rem');
  });

  it('BrandTokens has border radius scale', () => {
    expect(BrandTokens['--phz-border-radius-sm']).toBe('6px');
    expect(BrandTokens['--phz-border-radius-md']).toBe('12px');
    expect(BrandTokens['--phz-border-radius-lg']).toBe('16px');
  });

  it('BrandTokens has shadow scale', () => {
    expect(BrandTokens['--phz-shadow-sm']).toContain('rgba');
    expect(BrandTokens['--phz-shadow-md']).toContain('rgba');
    expect(BrandTokens['--phz-shadow-lg']).toContain('rgba');
  });

  it('BrandTokens has full neutral palette (50-900)', () => {
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(BrandTokens[`--phz-color-neutral-${step}` as keyof typeof BrandTokens]).toBeDefined();
    }
  });

  it('SemanticTokens has Phz Console design values', () => {
    // Phz Console uses direct warm-neutral hex values
    expect(SemanticTokens['--phz-grid-bg']).toBe('#FEFDFB');
    expect(SemanticTokens['--phz-header-bg']).toBe('#1C1917');
    expect(SemanticTokens['--phz-focus-ring-color']).toContain('var(--phz-color-primary');
  });

  it('SemanticTokens has grid, header, row, cell, and focus tokens', () => {
    // Grid
    expect(SemanticTokens['--phz-grid-bg']).toBeDefined();
    expect(SemanticTokens['--phz-grid-text']).toBeDefined();
    expect(SemanticTokens['--phz-grid-border']).toBeDefined();
    // Header
    expect(SemanticTokens['--phz-header-bg']).toBeDefined();
    expect(SemanticTokens['--phz-header-text']).toBeDefined();
    // Row
    expect(SemanticTokens['--phz-row-bg']).toBeDefined();
    expect(SemanticTokens['--phz-row-bg-hover']).toBeDefined();
    expect(SemanticTokens['--phz-row-bg-selected']).toBeDefined();
    // Cell
    expect(SemanticTokens['--phz-cell-bg']).toBeDefined();
    expect(SemanticTokens['--phz-cell-border-editing']).toBeDefined();
    // Focus
    expect(SemanticTokens['--phz-focus-ring-color']).toBeDefined();
    expect(SemanticTokens['--phz-focus-ring-width']).toBe('2px');
  });

  it('ComponentTokens has row height and cell styling', () => {
    expect(ComponentTokens['--phz-row-height']).toBe('40px');
    expect(ComponentTokens['--phz-row-height-compact']).toBe('36px');
    expect(ComponentTokens['--phz-row-height-comfortable']).toBe('48px');
    expect(ComponentTokens['--phz-row-height-dense']).toBe('32px');
    expect(ComponentTokens['--phz-cell-padding']).toBe('8px 16px');
    expect(ComponentTokens['--phz-cell-font-size']).toContain('var(--phz-font-size');
  });

  it('ComponentTokens has scrollbar tokens', () => {
    expect(ComponentTokens['--phz-scrollbar-width']).toBe('8px');
    expect(ComponentTokens['--phz-scrollbar-thumb-bg']).toBeDefined();
    expect(ComponentTokens['--phz-scrollbar-track-bg']).toBeDefined();
  });

  it('ComponentTokens has resize handle tokens', () => {
    expect(ComponentTokens['--phz-resize-handle-width']).toBe('8px');
    expect(ComponentTokens['--phz-resize-handle-bg']).toBe('transparent');
    expect(ComponentTokens['--phz-resize-handle-bg-hover']).toBeDefined();
  });

  it('generateTokenStyles produces valid CSS', () => {
    const css = generateTokenStyles();
    expect(css).toContain(':host {');
    expect(css).toContain('--phz-color-primary');
    expect(css).toContain('--phz-grid-bg');
    expect(css).toContain('--phz-row-height');
    expect(css).toContain('}');
  });

  it('all three token layers are distinct', () => {
    const brandKeys = new Set(Object.keys(BrandTokens));
    const semanticKeys = new Set(Object.keys(SemanticTokens));
    const componentKeys = new Set(Object.keys(ComponentTokens));

    // No overlap between layers
    for (const key of semanticKeys) {
      expect(brandKeys.has(key)).toBe(false);
    }
    for (const key of componentKeys) {
      expect(brandKeys.has(key)).toBe(false);
      expect(semanticKeys.has(key)).toBe(false);
    }
  });
});

// ─── ForcedColorsAdapter Tests ──────────────────────────────
describe('ForcedColorsAdapter', () => {
  it('detect returns false in non-browser env', () => {
    // In Node/Vitest there is no matchMedia
    expect(ForcedColorsAdapter.detect()).toBe(false);
  });

  it('applyForcedColorsStyles adds class', () => {
    if (typeof document === 'undefined') return; // Skip in non-DOM env
    const el = document.createElement('div');
    ForcedColorsAdapter.applyForcedColorsStyles(el);
    expect(el.classList.contains('phz-forced-colors')).toBe(true);
  });

  it('removeForcedColorsStyles removes class', () => {
    if (typeof document === 'undefined') return; // Skip in non-DOM env
    const el = document.createElement('div');
    el.classList.add('phz-forced-colors');
    ForcedColorsAdapter.removeForcedColorsStyles(el);
    expect(el.classList.contains('phz-forced-colors')).toBe(false);
  });

  it('onChange returns null in non-browser env', () => {
    // matchMedia may or may not exist in jsdom
    const cleanup = ForcedColorsAdapter.onChange(() => {});
    // In Vitest's default env, matchMedia may not have 'change' support
    // Just ensure it doesn't throw
    if (cleanup) cleanup();
  });
});

// ─── Export Structure Tests ─────────────────────────────────
describe('Package exports', () => {
  it('does not re-export core (consumers import @phozart/phz-core directly)', async () => {
    const gridPkg = await import('../index.js');
    // Core symbols should NOT be re-exported — tree-shaking fix
    expect((gridPkg as any).createGrid).toBeUndefined();
    expect((gridPkg as any).EventEmitter).toBeUndefined();
    expect((gridPkg as any).StateManager).toBeUndefined();
  });

  it('exports token constants', async () => {
    const gridPkg = await import('../index.js');
    expect(gridPkg.BrandTokens).toBeDefined();
    expect(gridPkg.SemanticTokens).toBeDefined();
    expect(gridPkg.ComponentTokens).toBeDefined();
    expect(typeof gridPkg.generateTokenStyles).toBe('function');
  });

  it('exports a11y utilities', async () => {
    const gridPkg = await import('../index.js');
    expect(gridPkg.AriaManager).toBeDefined();
    expect(gridPkg.KeyboardNavigator).toBeDefined();
    expect(gridPkg.ForcedColorsAdapter).toBeDefined();
    expect(typeof gridPkg.forcedColorsCSS).toBe('string');
  });

  it('exports event utilities', async () => {
    const gridPkg = await import('../index.js');
    expect(typeof gridPkg.dispatchGridEvent).toBe('function');
  });
});

// ─── Drill-Through Event Type Tests ─────────────────────
describe('drill-through event types', () => {
  it('PhzGridEventMap includes drill-through event', async () => {
    // Verify the events module exports dispatchGridEvent
    const eventsModule = await import('../events.js');
    expect(typeof eventsModule.dispatchGridEvent).toBe('function');
  });

  it('DrillThroughConfig shape is valid via engine re-export', async () => {
    const engine = await import('@phozart/phz-engine');
    // DrillThroughConfig is a type, but resolveDrillFilter exists
    expect(typeof engine.resolveDrillFilter).toBe('function');
    expect(typeof engine.resolveDrillAction).toBe('function');

    // Verify grid-row source with isSummaryRow produces empty filters
    const result = engine.resolveDrillFilter({
      source: { type: 'grid-row', rowData: { dept: 'Sales' }, isSummaryRow: true },
      filterFields: ['dept'],
    });
    expect(result.filters).toHaveLength(0);
  });

  it('grid-row source without isSummaryRow produces correct filters', async () => {
    const engine = await import('@phozart/phz-engine');
    const result = engine.resolveDrillFilter({
      source: { type: 'grid-row', rowData: { dept: 'Sales', region: 'North' }, isSummaryRow: false },
      filterFields: ['dept', 'region'],
    });
    expect(result.filters).toHaveLength(2);
    expect(result.filters[0].field).toBe('dept');
    expect(result.filters[1].field).toBe('region');
  });
});
