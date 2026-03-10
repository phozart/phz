/**
 * @phozart/phz-widgets -- Export Menu Pure Logic Tests
 *
 * Tests for EXPORT_MENU_ITEMS and _renderIcon.
 */
import { describe, it, expect, vi } from 'vitest';

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

import { PhzExportMenu, EXPORT_MENU_ITEMS } from '../components/phz-export-menu.js';

describe('EXPORT_MENU_ITEMS', () => {
  it('contains three items', () => {
    expect(EXPORT_MENU_ITEMS).toHaveLength(3);
  });

  it('has csv item', () => {
    const csv = EXPORT_MENU_ITEMS.find(i => i.id === 'csv');
    expect(csv).toBeDefined();
    expect(csv!.label).toBe('Export as CSV');
    expect(csv!.icon).toBe('table');
  });

  it('has clipboard item', () => {
    const clip = EXPORT_MENU_ITEMS.find(i => i.id === 'clipboard');
    expect(clip).toBeDefined();
    expect(clip!.label).toBe('Copy to clipboard');
    expect(clip!.icon).toBe('clipboard');
  });

  it('has image item', () => {
    const img = EXPORT_MENU_ITEMS.find(i => i.id === 'image');
    expect(img).toBeDefined();
    expect(img!.label).toBe('Save as image');
    expect(img!.icon).toBe('image');
  });
});

describe('PhzExportMenu — _renderIcon', () => {
  const menu = new PhzExportMenu();

  it('returns table icon for "table"', () => {
    const icon = (menu as any)._renderIcon('table');
    expect(icon).toBe('\u2637');
  });

  it('returns clipboard icon for "clipboard"', () => {
    const icon = (menu as any)._renderIcon('clipboard');
    expect(icon).toBe('\u2398');
  });

  it('returns image icon for "image"', () => {
    const icon = (menu as any)._renderIcon('image');
    expect(icon).toBe('\u2B1C');
  });

  it('returns empty string for unknown icon', () => {
    const icon = (menu as any)._renderIcon('unknown');
    expect(icon).toBe('');
  });
});

describe('PhzExportMenu — default state', () => {
  it('starts closed', () => {
    const menu = new PhzExportMenu();
    expect((menu as any)._open).toBe(false);
    expect((menu as any)._focusIndex).toBe(-1);
  });
});
