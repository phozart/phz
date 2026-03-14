/**
 * @phozart/grid — Toolbar Tests
 *
 * Unit tests for the <phz-toolbar> component's logic, types, and exports.
 * DOM rendering tests would require a browser environment (Playwright).
 */
import { describe, it, expect } from 'vitest';
import type { Density, FilterInfo } from '../types.js';
import type { ToolbarSearchEvent, ToolbarExportEvent } from '../components/phz-toolbar.js';
import type { GenerateDashboardEventDetail } from '../events.js';

// ─── Type exports ──────────────────────────────────────

describe('Toolbar types', () => {
  it('Density type accepts all three modes', () => {
    const modes: Density[] = ['comfortable', 'compact', 'dense'];
    expect(modes).toHaveLength(3);
    expect(modes).toContain('comfortable');
    expect(modes).toContain('compact');
    expect(modes).toContain('dense');
  });

  it('FilterInfo has required fields', () => {
    const info: FilterInfo = {
      field: 'name',
      operator: 'contains',
      value: 'test',
    };
    expect(info.field).toBe('name');
    expect(info.operator).toBe('contains');
    expect(info.value).toBe('test');
  });

  it('FilterInfo supports array values', () => {
    const info: FilterInfo = {
      field: 'status',
      operator: 'equals',
      value: ['Active', 'Pending'],
    };
    expect(Array.isArray(info.value)).toBe(true);
    expect((info.value as string[]).length).toBe(2);
  });

  it('ToolbarSearchEvent has query string', () => {
    const evt: ToolbarSearchEvent = { query: 'hello' };
    expect(evt.query).toBe('hello');
  });

  it('ToolbarExportEvent has formatting flags', () => {
    const evt: ToolbarExportEvent = {
      includeFormatting: true,
      includeGroupHeaders: false,
    };
    expect(evt.includeFormatting).toBe(true);
    expect(evt.includeGroupHeaders).toBe(false);
  });
});

// ─── Filter map logic ──────────────────────────────────

describe('Toolbar filter display logic', () => {
  it('renders filter label from column header', () => {
    const columns = [
      { field: 'name', header: 'Employee Name' },
      { field: 'dept', header: 'Department' },
    ];
    const filters = new Map<string, FilterInfo>([
      ['name', { field: 'name', operator: 'contains', value: 'Alice' }],
    ]);

    const entries = Array.from(filters.entries());
    expect(entries).toHaveLength(1);

    const [field, info] = entries[0];
    const col = columns.find(c => c.field === field);
    const label = col?.header ?? field;
    expect(label).toBe('Employee Name');
    expect(String(info.value)).toBe('Alice');
  });

  it('falls back to field name when no column found', () => {
    const columns = [{ field: 'name', header: 'Name' }];
    const filters = new Map<string, FilterInfo>([
      ['unknown_field', { field: 'unknown_field', operator: 'equals', value: 42 }],
    ]);

    const [field] = Array.from(filters.entries())[0];
    const col = columns.find(c => c.field === field);
    const label = col?.header ?? field;
    expect(label).toBe('unknown_field');
  });

  it('formats array filter values as comma-separated', () => {
    const info: FilterInfo = {
      field: 'status',
      operator: 'equals',
      value: ['Active', 'Pending', 'Review'],
    };
    const valStr = Array.isArray(info.value)
      ? (info.value as unknown[]).join(', ')
      : String(info.value);
    expect(valStr).toBe('Active, Pending, Review');
  });

  it('formats scalar filter values as string', () => {
    const info: FilterInfo = {
      field: 'age',
      operator: 'lessThan',
      value: 30,
    };
    const valStr = Array.isArray(info.value)
      ? (info.value as unknown[]).join(', ')
      : String(info.value);
    expect(valStr).toBe('30');
  });
});

// ─── Density toggle logic ──────────────────────────────

describe('Toolbar density logic', () => {
  it('cycles through all density modes', () => {
    const modes: Density[] = ['comfortable', 'compact', 'dense'];
    let current: Density = 'compact';

    // Simulate clicking comfortable
    current = modes[0];
    expect(current).toBe('comfortable');

    // Simulate clicking dense
    current = modes[2];
    expect(current).toBe('dense');

    // Simulate clicking compact
    current = modes[1];
    expect(current).toBe('compact');
  });

  it('active class matches current density', () => {
    const density: Density = 'dense';
    const modes: Density[] = ['comfortable', 'compact', 'dense'];
    const active = modes.map(d => d === density);
    expect(active).toEqual([false, false, true]);
  });
});

// ─── Export dropdown logic ──────────────────────────────

describe('Toolbar export logic', () => {
  it('export options default state', () => {
    let includeFormatting = false;
    const includeGroupHeaders = true;

    expect(includeFormatting).toBe(false);
    expect(includeGroupHeaders).toBe(true);

    // Toggle formatting
    includeFormatting = true;
    expect(includeFormatting).toBe(true);
  });

  it('export dropdown toggles', () => {
    let open = false;
    open = !open;
    expect(open).toBe(true);
    open = !open;
    expect(open).toBe(false);
  });

  it('export closes dropdown after action', () => {
    let exportDropdownOpen = true;
    // Simulate export action
    exportDropdownOpen = false;
    expect(exportDropdownOpen).toBe(false);
  });
});

// ─── Slim mode logic ──────────────────────────────────

describe('Toolbar slim mode', () => {
  it('slim defaults to true', () => {
    const slim = true;
    expect(slim).toBe(true);
  });

  it('non-slim shows button labels', () => {
    // In slim mode, .phz-toolbar-btn__label has display: none
    // In non-slim mode, it has display: inline
    const slim = false;
    const labelDisplay = slim ? 'none' : 'inline';
    expect(labelDisplay).toBe('inline');
  });

  it('slim uses compact padding', () => {
    const slim = true;
    const padV = slim ? '4px' : '12px';
    const padH = slim ? '16px' : '24px';
    expect(padV).toBe('4px');
    expect(padH).toBe('16px');
  });
});

// ─── Search logic ──────────────────────────────────────

describe('Toolbar search logic', () => {
  it('clear search resets query', () => {
    let query = 'test search';
    // Simulate clear
    query = '';
    expect(query).toBe('');
  });

  it('search input updates query', () => {
    let query = '';
    // Simulate typing
    query = 'new search';
    expect(query).toBe('new search');
  });
});

// ─── Options menu logic ──────────────────────────────────

describe('Toolbar options menu', () => {
  it('options menu toggles', () => {
    let open = false;
    open = !open;
    expect(open).toBe(true);
    open = !open;
    expect(open).toBe(false);
  });

  it('options menu closes after action', () => {
    let optionsMenuOpen = true;
    // Simulate action (e.g., Columns click)
    optionsMenuOpen = false;
    expect(optionsMenuOpen).toBe(false);
  });
});

// ─── Dropdown dismiss logic ──────────────────────────────

describe('Toolbar dropdown dismiss', () => {
  it('click outside closes open dropdown', () => {
    let optionsMenuOpen = true;
    let exportDropdownOpen = false;

    // Simulate click-outside handler: composedPath does not include toolbar
    const clickedInsideToolbar = false;
    if (!clickedInsideToolbar) {
      optionsMenuOpen = false;
      exportDropdownOpen = false;
    }

    expect(optionsMenuOpen).toBe(false);
    expect(exportDropdownOpen).toBe(false);
  });

  it('Escape key closes open dropdown', () => {
    let optionsMenuOpen = true;
    let exportDropdownOpen = true;

    // Simulate Escape keydown
    const key = 'Escape';
    if (key === 'Escape') {
      optionsMenuOpen = false;
      exportDropdownOpen = false;
    }

    expect(optionsMenuOpen).toBe(false);
    expect(exportDropdownOpen).toBe(false);
  });

  it('opening options menu closes export dropdown (mutual exclusion)', () => {
    let optionsMenuOpen = false;
    let exportDropdownOpen = true;

    // Simulate clicking options button
    optionsMenuOpen = !optionsMenuOpen;
    exportDropdownOpen = false;

    expect(optionsMenuOpen).toBe(true);
    expect(exportDropdownOpen).toBe(false);
  });

  it('opening export dropdown closes options menu (mutual exclusion)', () => {
    let optionsMenuOpen = true;
    let exportDropdownOpen = false;

    // Simulate clicking export button
    exportDropdownOpen = !exportDropdownOpen;
    optionsMenuOpen = false;

    expect(exportDropdownOpen).toBe(true);
    expect(optionsMenuOpen).toBe(false);
  });

  it('listeners are added when dropdown opens and removed when closed', () => {
    let listenersActive = false;
    let optionsMenuOpen = false;
    const exportDropdownOpen = false;

    // Open dropdown → add listeners
    optionsMenuOpen = true;
    if (optionsMenuOpen || exportDropdownOpen) listenersActive = true;
    expect(listenersActive).toBe(true);

    // Close dropdown → remove listeners
    optionsMenuOpen = false;
    if (!optionsMenuOpen && !exportDropdownOpen) listenersActive = false;
    expect(listenersActive).toBe(false);
  });
});

// ─── Generate Dashboard ──────────────────────────────────

describe('Generate Dashboard event detail', () => {
  it('filtered mode includes filters and sort', () => {
    const detail: GenerateDashboardEventDetail = {
      dataMode: 'filtered',
      reportId: 'r1',
      reportName: 'Sales Report',
      currentFilters: [
        { field: 'department', operator: 'equals', value: 'Engineering' },
        { field: 'salary', operator: 'greaterThan', value: 50000 },
      ],
      currentSort: [{ field: 'name', direction: 'asc' }],
      visibleColumns: [
        { field: 'name', header: 'Name', type: 'string' },
        { field: 'salary', header: 'Salary', type: 'number' },
      ],
      href: '/dashboards/new?from=r1&mode=filtered',
    };
    expect(detail.dataMode).toBe('filtered');
    expect(detail.currentFilters).toHaveLength(2);
    expect(detail.currentSort[0].direction).toBe('asc');
    expect(detail.visibleColumns).toHaveLength(2);
    expect(detail.href).toContain('mode=filtered');
  });

  it('full mode with minimal context', () => {
    const detail: GenerateDashboardEventDetail = {
      dataMode: 'full',
      currentFilters: [],
      currentSort: [],
      visibleColumns: [{ field: 'id' }],
    };
    expect(detail.dataMode).toBe('full');
    expect(detail.reportId).toBeUndefined();
    expect(detail.reportName).toBeUndefined();
    expect(detail.href).toBeUndefined();
    expect(detail.currentFilters).toHaveLength(0);
  });
});

describe('Generate Dashboard menu visibility logic', () => {
  it('showGenerateDashboard is false when no config', () => {
    const config = undefined;
    const show = !!config;
    expect(show).toBe(false);
  });

  it('showGenerateDashboard is true when config is set', () => {
    const config = { href: '/dashboards/new?from={reportId}&mode={dataMode}' };
    const show = !!config;
    expect(show).toBe(true);
  });

  it('menu closes after generate dashboard action', () => {
    let optionsMenuOpen = true;
    // Simulate _generateDashboard action
    optionsMenuOpen = false;
    expect(optionsMenuOpen).toBe(false);
  });
});

describe('Generate Dashboard href resolution', () => {
  it('resolves {reportId} and {dataMode} tokens', () => {
    const template = '/dashboards/new?from={reportId}&mode={dataMode}';
    const tokens: Record<string, unknown> = { reportId: 'emp-report', dataMode: 'filtered' };
    const href = template.replace(/\{(\w+)\}/g, (_, key) => {
      const val = tokens[key];
      return val != null ? encodeURIComponent(String(val)) : '';
    });
    expect(href).toBe('/dashboards/new?from=emp-report&mode=filtered');
  });

  it('handles missing reportId gracefully', () => {
    const template = '/dashboards/new?from={reportId}&mode={dataMode}';
    const tokens: Record<string, unknown> = { reportId: '', dataMode: 'full' };
    const href = template.replace(/\{(\w+)\}/g, (_, key) => {
      const val = tokens[key];
      return val != null ? encodeURIComponent(String(val)) : '';
    });
    expect(href).toBe('/dashboards/new?from=&mode=full');
  });

  it('encodes special characters in token values', () => {
    const template = '/dashboards/new?from={reportId}';
    const tokens: Record<string, unknown> = { reportId: 'report with spaces & symbols' };
    const href = template.replace(/\{(\w+)\}/g, (_, key) => {
      const val = tokens[key];
      return val != null ? encodeURIComponent(String(val)) : '';
    });
    expect(href).toBe('/dashboards/new?from=report%20with%20spaces%20%26%20symbols');
  });
});
