/**
 * S.6 — Role-Specific Shell Variants tests
 *
 * v15 (A-2.11): 'viewer' removed from WorkspaceRole. Tests updated to
 * verify isValidRole rejects 'viewer', while isLegacyRole and getShellConfig
 * still accept it as a deprecated fallback.
 */

import { describe, it, expect, vi } from 'vitest';

describe('Shell Roles (S.6)', () => {
  describe('WorkspaceRole type', () => {
    it('accepts admin and author', async () => {
      const { isValidRole } = await import('../shell/shell-roles.js');
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('author')).toBe(true);
    });

    it('rejects viewer (removed in v15)', async () => {
      const { isValidRole } = await import('../shell/shell-roles.js');
      expect(isValidRole('viewer')).toBe(false);
    });

    it('rejects other invalid roles', async () => {
      const { isValidRole } = await import('../shell/shell-roles.js');
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });
  });

  describe('isLegacyRole()', () => {
    it('accepts admin, author, and viewer', async () => {
      const { isLegacyRole } = await import('../shell/shell-roles.js');
      expect(isLegacyRole('admin')).toBe(true);
      expect(isLegacyRole('author')).toBe(true);
      expect(isLegacyRole('viewer')).toBe(true);
    });

    it('rejects invalid roles', async () => {
      const { isLegacyRole } = await import('../shell/shell-roles.js');
      expect(isLegacyRole('superadmin')).toBe(false);
      expect(isLegacyRole('')).toBe(false);
    });
  });

  describe('getShellConfig()', () => {
    it('returns all 3 sidebar sections for admin', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('admin');
      expect(config.sidebarSections).toEqual(['CONTENT', 'DATA', 'GOVERN']);
    });

    it('returns no GOVERN section for author', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('author');
      expect(config.sidebarSections).toEqual(['CONTENT', 'DATA']);
      expect(config.sidebarSections).not.toContain('GOVERN');
    });

    it('returns empty config for deprecated viewer with console warning', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = getShellConfig('viewer');
      expect(config.sidebarSections).toEqual([]);
      expect(config.showSidebar).toBe(false);
      expect(config.filterMode).toBe('readonly');
      expect(config.catalogMode).toBe('card');
      expect(config.presetOnly).toBe(true);
      warnSpy.mockRestore();
    });

    it('admin can publish', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('admin');
      expect(config.canPublish).toBe(true);
      expect(config.canSetAlert).toBe(true);
    });

    it('author cannot publish or set alerts', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('author');
      expect(config.canPublish).toBe(false);
      expect(config.canSetAlert).toBe(false);
    });

    it('admin has full filter mode', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('admin');
      expect(config.filterMode).toBe('full');
    });

    it('author has limited filter mode', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('author');
      expect(config.filterMode).toBe('limited');
    });

    it('admin uses full catalog', async () => {
      const { getShellConfig } = await import('../shell/shell-roles.js');
      const config = getShellConfig('admin');
      expect(config.catalogMode).toBe('full');
    });
  });

  describe('getNavItemsForRole()', () => {
    it('returns all nav items for admin', async () => {
      const { getNavItemsForRole } = await import('../shell/shell-roles.js');
      const items = getNavItemsForRole('admin');
      const sections = items.map(i => i.section);
      expect(sections).toContain('CONTENT');
      expect(sections).toContain('DATA');
      expect(sections).toContain('GOVERN');
    });

    it('excludes GOVERN items for author', async () => {
      const { getNavItemsForRole } = await import('../shell/shell-roles.js');
      const items = getNavItemsForRole('author');
      const sections = items.map(i => i.section);
      expect(sections).not.toContain('GOVERN');
    });

    it('returns only catalog-like items for deprecated viewer', async () => {
      const { getNavItemsForRole } = await import('../shell/shell-roles.js');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const items = getNavItemsForRole('viewer');
      expect(items.length).toBeLessThanOrEqual(2);
      warnSpy.mockRestore();
    });
  });
});
