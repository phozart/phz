/**
 * WorkspaceShell component tests.
 *
 * Tests pure logic: nav items, panel resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NAV_ITEMS,
  resolveActivePanel,
  type NavItem,
} from '../shell/shell-utils.js';

describe('WorkspaceShell', () => {
  describe('PhzWorkspaceShell class', () => {
    it('exists and is importable', async () => {
      const mod = await import('../shell/phz-workspace-shell.js');
      expect(mod.PhzWorkspaceShell).toBeDefined();
    });

    it('has correct tag name', async () => {
      const mod = await import('../shell/phz-workspace-shell.js');
      expect(mod.PhzWorkspaceShell.TAG).toBe('phz-workspace-shell');
    });
  });

  describe('DEFAULT_NAV_ITEMS', () => {
    it('contains the core panels', () => {
      expect(DEFAULT_NAV_ITEMS.length).toBeGreaterThanOrEqual(5);
      const ids = DEFAULT_NAV_ITEMS.map(n => n.id);
      expect(ids).toContain('catalog');
      expect(ids).toContain('explore');
      expect(ids).toContain('dashboards');
      expect(ids).toContain('reports');
      expect(ids).toContain('data-sources');
    });

    it('each item has id, label, and icon', () => {
      for (const item of DEFAULT_NAV_ITEMS) {
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeTruthy();
      }
    });
  });

  describe('resolveActivePanel', () => {
    it('returns the matching nav item', () => {
      const result = resolveActivePanel('catalog', DEFAULT_NAV_ITEMS);
      expect(result).toBeDefined();
      expect(result!.id).toBe('catalog');
    });

    it('returns undefined for unknown panel', () => {
      expect(resolveActivePanel('nonexistent', DEFAULT_NAV_ITEMS)).toBeUndefined();
    });

    it('returns first item when activeId is empty', () => {
      const result = resolveActivePanel('', DEFAULT_NAV_ITEMS);
      expect(result).toBeDefined();
      expect(result!.id).toBe('catalog');
    });
  });
});
