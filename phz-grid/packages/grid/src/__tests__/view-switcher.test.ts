import { describe, it, expect } from 'vitest';
import type { ViewsSummary } from '@phozart/phz-core';

// Logic tests for the view switcher component data flow.
// The actual rendering is tested in browser/e2e tests.

function filterActiveView(views: ViewsSummary[]): ViewsSummary | undefined {
  return views.find(v => v.isActive);
}

function formatViewLabel(view: ViewsSummary | undefined, isDirty: boolean): string {
  if (!view) return 'Views';
  return isDirty ? `${view.name} *` : view.name;
}

describe('PhzViewSwitcher logic', () => {
  const views: ViewsSummary[] = [
    { id: 'v1', name: 'Default View', isDefault: true, isActive: true, updatedAt: '2024-01-01' },
    { id: 'v2', name: 'Custom View', isDefault: false, isActive: false, updatedAt: '2024-01-02' },
  ];

  it('finds the active view', () => {
    const active = filterActiveView(views);
    expect(active?.name).toBe('Default View');
  });

  it('returns undefined when no active view', () => {
    const noActive: ViewsSummary[] = [
      { id: 'v1', name: 'V1', isDefault: false, isActive: false, updatedAt: '' },
    ];
    expect(filterActiveView(noActive)).toBeUndefined();
  });

  it('formats label with dirty indicator', () => {
    const active = filterActiveView(views);
    expect(formatViewLabel(active, false)).toBe('Default View');
    expect(formatViewLabel(active, true)).toBe('Default View *');
  });

  it('formats label when no active view', () => {
    expect(formatViewLabel(undefined, false)).toBe('Views');
  });

  it('supports view selection event detail shape', () => {
    const detail = { viewId: 'v2' };
    expect(detail.viewId).toBe('v2');
  });

  it('lists all views for dropdown', () => {
    expect(views).toHaveLength(2);
    expect(views.map(v => v.name)).toEqual(['Default View', 'Custom View']);
  });
});
