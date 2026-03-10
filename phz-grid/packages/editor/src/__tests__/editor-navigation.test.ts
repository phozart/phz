/**
 * Tests for editor navigation (B-2.02)
 */
import {
  parseRoute,
  buildRoutePath,
  buildBreadcrumbs,
  getScreenLabel,
  buildEditorDeepLink,
} from '../editor-navigation.js';
import type { EditorRoute, Breadcrumb, NavigationEntry } from '../index.js';

describe('parseRoute', () => {
  it('parses catalog route', () => {
    expect(parseRoute('/editor')).toEqual({ screen: 'catalog' });
    expect(parseRoute('/editor/')).toEqual({ screen: 'catalog' });
    expect(parseRoute('/editor/catalog')).toEqual({ screen: 'catalog' });
    expect(parseRoute('/editor/catalog/')).toEqual({ screen: 'catalog' });
  });

  it('parses dashboard view route', () => {
    const route = parseRoute('/editor/dashboard/dash-123');
    expect(route).toEqual({ screen: 'dashboard-view', artifactId: 'dash-123' });
  });

  it('parses dashboard edit route', () => {
    const route = parseRoute('/editor/dashboard/dash-123/edit');
    expect(route).toEqual({ screen: 'dashboard-edit', artifactId: 'dash-123' });
  });

  it('parses report route', () => {
    const route = parseRoute('/editor/report/rpt-456');
    expect(route).toEqual({ screen: 'report', artifactId: 'rpt-456' });
  });

  it('parses explorer routes', () => {
    expect(parseRoute('/editor/explorer')).toEqual({ screen: 'explorer' });
    expect(parseRoute('/editor/explorer/ds-1')).toEqual({
      screen: 'explorer',
      artifactId: 'ds-1',
    });
  });

  it('parses sharing route', () => {
    const route = parseRoute('/editor/sharing/art-789');
    expect(route).toEqual({ screen: 'sharing', artifactId: 'art-789' });
  });

  it('parses alerts route', () => {
    expect(parseRoute('/editor/alerts')).toEqual({ screen: 'alerts' });
  });

  it('returns null for unknown paths', () => {
    expect(parseRoute('/unknown')).toBeNull();
    expect(parseRoute('/viewer/dashboard/123')).toBeNull();
    expect(parseRoute('')).toBeNull();
  });

  it('strips query parameters before matching', () => {
    const route = parseRoute('/editor/dashboard/dash-1?filter=active');
    expect(route).toEqual({ screen: 'dashboard-view', artifactId: 'dash-1' });
  });

  it('strips hash fragments before matching', () => {
    const route = parseRoute('/editor/report/rpt-1#section');
    expect(route).toEqual({ screen: 'report', artifactId: 'rpt-1' });
  });
});

describe('buildRoutePath', () => {
  it('builds catalog path', () => {
    expect(buildRoutePath({ screen: 'catalog' })).toBe('/editor/catalog');
  });

  it('builds dashboard view path', () => {
    expect(buildRoutePath({ screen: 'dashboard-view', artifactId: 'dash-1' }))
      .toBe('/editor/dashboard/dash-1');
  });

  it('builds dashboard edit path', () => {
    expect(buildRoutePath({ screen: 'dashboard-edit', artifactId: 'dash-1' }))
      .toBe('/editor/dashboard/dash-1/edit');
  });

  it('builds report path', () => {
    expect(buildRoutePath({ screen: 'report', artifactId: 'rpt-1' }))
      .toBe('/editor/report/rpt-1');
  });

  it('builds explorer path without artifact', () => {
    expect(buildRoutePath({ screen: 'explorer' })).toBe('/editor/explorer');
  });

  it('builds explorer path with artifact', () => {
    expect(buildRoutePath({ screen: 'explorer', artifactId: 'ds-1' }))
      .toBe('/editor/explorer/ds-1');
  });

  it('builds sharing path', () => {
    expect(buildRoutePath({ screen: 'sharing', artifactId: 'art-1' }))
      .toBe('/editor/sharing/art-1');
  });

  it('builds alerts path', () => {
    expect(buildRoutePath({ screen: 'alerts' })).toBe('/editor/alerts');
  });

  it('falls back to catalog when artifact missing for artifact screens', () => {
    expect(buildRoutePath({ screen: 'dashboard-view' })).toBe('/editor/catalog');
    expect(buildRoutePath({ screen: 'report' })).toBe('/editor/catalog');
    expect(buildRoutePath({ screen: 'sharing' })).toBe('/editor/catalog');
  });
});

describe('buildBreadcrumbs', () => {
  it('builds breadcrumbs from history', () => {
    const history: NavigationEntry[] = [
      { screen: 'catalog', artifactId: null, artifactType: null },
      { screen: 'dashboard-view', artifactId: 'dash-1', artifactType: 'dashboard' },
    ];

    const crumbs = buildBreadcrumbs(history, 1);
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].label).toBe('Catalog');
    expect(crumbs[0].active).toBe(false);
    expect(crumbs[1].label).toBe('Dashboard');
    expect(crumbs[1].active).toBe(true);
    expect(crumbs[1].artifactId).toBe('dash-1');
  });

  it('uses artifact names when provided', () => {
    const history: NavigationEntry[] = [
      { screen: 'catalog', artifactId: null, artifactType: null },
      { screen: 'dashboard-view', artifactId: 'dash-1', artifactType: 'dashboard' },
    ];
    const names = new Map([['dash-1', 'Sales Dashboard']]);

    const crumbs = buildBreadcrumbs(history, 1, names);
    expect(crumbs[1].label).toBe('Sales Dashboard');
  });

  it('only shows entries up to historyIndex', () => {
    const history: NavigationEntry[] = [
      { screen: 'catalog', artifactId: null, artifactType: null },
      { screen: 'dashboard-view', artifactId: 'dash-1', artifactType: 'dashboard' },
      { screen: 'report', artifactId: 'rpt-1', artifactType: 'report' },
    ];

    const crumbs = buildBreadcrumbs(history, 1);
    expect(crumbs).toHaveLength(2);
  });
});

describe('getScreenLabel', () => {
  it('returns labels for all screens', () => {
    expect(getScreenLabel('catalog')).toBe('Catalog');
    expect(getScreenLabel('dashboard-view')).toBe('Dashboard');
    expect(getScreenLabel('dashboard-edit')).toBe('Edit Dashboard');
    expect(getScreenLabel('report')).toBe('Report');
    expect(getScreenLabel('explorer')).toBe('Explorer');
    expect(getScreenLabel('sharing')).toBe('Sharing');
    expect(getScreenLabel('alerts')).toBe('Alerts & Subscriptions');
  });
});

describe('buildEditorDeepLink', () => {
  it('builds full URL with base', () => {
    const url = buildEditorDeepLink('https://app.example.com', 'dashboard-view', 'dash-1');
    expect(url).toBe('https://app.example.com/editor/dashboard/dash-1');
  });

  it('strips trailing slashes from base URL', () => {
    const url = buildEditorDeepLink('https://app.example.com/', 'catalog');
    expect(url).toBe('https://app.example.com/editor/catalog');
  });

  it('appends query parameters', () => {
    const url = buildEditorDeepLink('https://app.example.com', 'report', 'rpt-1', {
      filter: 'active',
    });
    expect(url).toBe('https://app.example.com/editor/report/rpt-1?filter=active');
  });
});
