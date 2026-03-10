/**
 * Tests for viewer-navigation.ts — Route/Screen Management
 */
import { describe, it, expect } from 'vitest';
import {
  parseRoute,
  buildRoutePath,
  entryToRoute,
  routeToEntry,
  routesEqual,
  screenForArtifactType,
} from '../viewer-navigation.js';

describe('viewer-navigation', () => {
  describe('parseRoute', () => {
    it('parses catalog route', () => {
      const route = parseRoute('/catalog');
      expect(route).toEqual({ screen: 'catalog', artifactId: undefined });
    });

    it('parses dashboard route with ID', () => {
      const route = parseRoute('/dashboard/dash-123');
      expect(route).toEqual({ screen: 'dashboard', artifactId: 'dash-123' });
    });

    it('parses report route with ID', () => {
      const route = parseRoute('/report/rpt-456');
      expect(route).toEqual({ screen: 'report', artifactId: 'rpt-456' });
    });

    it('parses explorer route', () => {
      const route = parseRoute('/explorer');
      expect(route).toEqual({ screen: 'explorer', artifactId: undefined });
    });

    it('handles empty path as catalog', () => {
      const route = parseRoute('');
      expect(route).toEqual({ screen: 'catalog' });
    });

    it('handles path without leading slash', () => {
      const route = parseRoute('dashboard/dash-1');
      expect(route).toEqual({ screen: 'dashboard', artifactId: 'dash-1' });
    });

    it('returns null for unknown routes', () => {
      expect(parseRoute('/unknown')).toBeNull();
      expect(parseRoute('/admin')).toBeNull();
    });
  });

  describe('buildRoutePath', () => {
    it('builds catalog path', () => {
      expect(buildRoutePath({ screen: 'catalog' })).toBe('/catalog');
    });

    it('builds dashboard path with ID', () => {
      expect(buildRoutePath({ screen: 'dashboard', artifactId: 'dash-1' })).toBe('/dashboard/dash-1');
    });

    it('builds report path without ID', () => {
      expect(buildRoutePath({ screen: 'report' })).toBe('/report');
    });

    it('encodes special characters in artifact ID', () => {
      expect(buildRoutePath({ screen: 'dashboard', artifactId: 'id with spaces' })).toBe(
        '/dashboard/id%20with%20spaces',
      );
    });
  });

  describe('entryToRoute / routeToEntry', () => {
    it('converts NavigationEntry to ViewerRoute', () => {
      const entry = { screen: 'dashboard' as const, artifactId: 'dash-1', artifactType: 'dashboard' };
      const route = entryToRoute(entry);
      expect(route.screen).toBe('dashboard');
      expect(route.artifactId).toBe('dash-1');
      expect(route.artifactType).toBe('dashboard');
    });

    it('converts ViewerRoute to NavigationEntry', () => {
      const route = { screen: 'report' as const, artifactId: 'rpt-1' };
      const entry = routeToEntry(route);
      expect(entry.screen).toBe('report');
      expect(entry.artifactId).toBe('rpt-1');
      expect(entry.artifactType).toBeNull();
    });

    it('handles null artifact IDs', () => {
      const entry = { screen: 'catalog' as const, artifactId: null, artifactType: null };
      const route = entryToRoute(entry);
      expect(route.artifactId).toBeUndefined();

      const back = routeToEntry(route);
      expect(back.artifactId).toBeNull();
    });
  });

  describe('routesEqual', () => {
    it('returns true for same screen and artifact', () => {
      expect(
        routesEqual(
          { screen: 'dashboard', artifactId: 'dash-1' },
          { screen: 'dashboard', artifactId: 'dash-1' },
        ),
      ).toBe(true);
    });

    it('returns false for different screens', () => {
      expect(
        routesEqual({ screen: 'dashboard' }, { screen: 'report' }),
      ).toBe(false);
    });

    it('returns false for different artifacts on same screen', () => {
      expect(
        routesEqual(
          { screen: 'dashboard', artifactId: 'dash-1' },
          { screen: 'dashboard', artifactId: 'dash-2' },
        ),
      ).toBe(false);
    });

    it('treats undefined and null artifact IDs as equal', () => {
      expect(
        routesEqual({ screen: 'catalog' }, { screen: 'catalog' }),
      ).toBe(true);
    });
  });

  describe('screenForArtifactType', () => {
    it('returns dashboard for dashboard type', () => {
      expect(screenForArtifactType('dashboard')).toBe('dashboard');
    });

    it('returns report for report type', () => {
      expect(screenForArtifactType('report')).toBe('report');
    });

    it('returns report for grid-definition type', () => {
      expect(screenForArtifactType('grid-definition')).toBe('report');
    });

    it('returns catalog for unknown types', () => {
      expect(screenForArtifactType('kpi')).toBe('catalog');
      expect(screenForArtifactType('unknown')).toBe('catalog');
    });
  });
});
