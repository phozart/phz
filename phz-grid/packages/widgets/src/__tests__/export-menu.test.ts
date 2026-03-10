import { describe, it, expect } from 'vitest';

describe('PhzExportMenu', () => {
  it('defines the correct menu items', async () => {
    const { EXPORT_MENU_ITEMS } = await import('../components/phz-export-menu.js');
    expect(EXPORT_MENU_ITEMS).toEqual([
      { id: 'csv', label: 'Export as CSV', icon: 'table' },
      { id: 'clipboard', label: 'Copy to clipboard', icon: 'clipboard' },
      { id: 'image', label: 'Save as image', icon: 'image' },
    ]);
  });

  it('exports PhzExportMenu class', async () => {
    const mod = await import('../components/phz-export-menu.js');
    expect(mod.PhzExportMenu).toBeDefined();
    expect(typeof mod.PhzExportMenu).toBe('function');
  });
});
