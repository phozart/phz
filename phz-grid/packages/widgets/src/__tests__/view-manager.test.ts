import { describe, it, expect } from 'vitest';
import type { UserViewConfig } from '@phozart/engine';

describe('View Manager logic', () => {
  it('identifies the default view', () => {
    const views: UserViewConfig[] = [
      { id: 'v1', userId: 'u1', sourceType: 'report', sourceId: 'r1', overrides: {}, name: 'My View', isDefault: true },
      { id: 'v2', userId: 'u1', sourceType: 'report', sourceId: 'r1', overrides: {}, name: 'Alternate' },
    ];
    const defaultView = views.find(v => v.isDefault);
    expect(defaultView?.id).toBe('v1');
  });

  it('filters views by source', () => {
    const views: UserViewConfig[] = [
      { id: 'v1', userId: 'u1', sourceType: 'report', sourceId: 'r1', overrides: {} },
      { id: 'v2', userId: 'u1', sourceType: 'dashboard', sourceId: 'd1', overrides: {} },
    ];
    const reportViews = views.filter(v => v.sourceType === 'report');
    expect(reportViews).toHaveLength(1);
  });
});
