/**
 * Tests for the unified <phz-workspace> component logic
 * (Vitest node env — tests pure logic, not DOM rendering)
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getNavItemsForRole,
  getShellConfig,
  type LegacyWorkspaceRole,
} from '../shell/shell-roles.js';
import { icon, NAV_ICONS, ICONS, type IconName } from '../styles/icons.js';

// ── Panel routing ───────────────────────────────────────────────────────

describe('PhzWorkspace panel routing', () => {
  const PANEL_IDS = [
    'catalog', 'explore', 'dashboards', 'reports',
    'data-sources', 'connectors', 'alerts', 'permissions',
  ];

  it('admin role has access to all panels', () => {
    const items = getNavItemsForRole('admin');
    const ids = items.map(i => i.id);
    expect(ids).toContain('catalog');
    expect(ids).toContain('explore');
    expect(ids).toContain('data-sources');
    expect(ids).toContain('alerts');
    expect(ids).toContain('permissions');
  });

  it('author role has CONTENT and DATA sections only', () => {
    const items = getNavItemsForRole('author');
    const sections = new Set(items.map(i => i.section));
    expect(sections.has('CONTENT')).toBe(true);
    expect(sections.has('DATA')).toBe(true);
    expect(sections.has('GOVERN')).toBe(false);
  });

  it('deprecated viewer role gets minimal nav items (catalog + dashboards)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const items = getNavItemsForRole('viewer');
    const ids = items.map(i => i.id);
    expect(ids).toContain('catalog');
    expect(ids).toContain('dashboards');
    expect(ids.length).toBeLessThanOrEqual(3);
    warnSpy.mockRestore();
  });

  it('default panel is first nav item', () => {
    const items = getNavItemsForRole('admin');
    expect(items[0]?.id).toBe('catalog');
  });
});

// ── Shell config ────────────────────────────────────────────────────────

describe('PhzWorkspace shell config', () => {
  it('admin config shows sidebar with all 3 sections', () => {
    const config = getShellConfig('admin');
    expect(config.showSidebar).toBe(true);
    expect(config.sidebarSections).toEqual(['CONTENT', 'DATA', 'GOVERN']);
    expect(config.canPublish).toBe(true);
    expect(config.canSetAlert).toBe(true);
  });

  it('author config hides GOVERN section', () => {
    const config = getShellConfig('author');
    expect(config.showSidebar).toBe(true);
    expect(config.sidebarSections).not.toContain('GOVERN');
    expect(config.canPublish).toBe(false);
  });

  it('deprecated viewer config hides sidebar', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = getShellConfig('viewer');
    expect(config.showSidebar).toBe(false);
    expect(config.filterMode).toBe('readonly');
    expect(config.catalogMode).toBe('card');
    expect(config.presetOnly).toBe(true);
    warnSpy.mockRestore();
  });
});

// ── Icon integration for nav ────────────────────────────────────────────

describe('PhzWorkspace icon integration', () => {
  const ICON_MAP: Record<string, IconName> = {
    catalog: 'catalog',
    explore: 'explore',
    dashboard: 'dashboard',
    report: 'report',
    data: 'sourceDatabase',
    connector: 'sourceUrl',
    alert: 'alertRule',
    lock: 'lock',
    settings: 'settings',
  };

  it('every nav item icon maps to a valid SVG icon', () => {
    const items = getNavItemsForRole('admin');
    for (const item of items) {
      const iconName = ICON_MAP[item.icon] ?? NAV_ICONS[item.icon];
      expect(iconName, `Icon mapping for "${item.icon}" should exist`).toBeDefined();
      const svg = icon(iconName as IconName, 18);
      expect(svg, `SVG for "${item.icon}" should render`).toContain('<svg');
    }
  });

  it('renders icons at different sizes for header and sidebar', () => {
    const smallSvg = icon('catalog', 16);
    const largeSvg = icon('catalog', 28);
    expect(smallSvg).toContain('width="16"');
    expect(largeSvg).toContain('width="28"');
  });
});

// ── Panel descriptors ───────────────────────────────────────────────────

describe('PhzWorkspace panel descriptors', () => {
  const PANELS: Record<string, { tag: string; label: string; emptyIcon: IconName }> = {
    catalog: { tag: 'phz-catalog-browser', label: 'Catalog', emptyIcon: 'catalog' },
    explore: { tag: 'phz-data-explorer', label: 'Explore', emptyIcon: 'explore' },
    dashboards: { tag: 'phz-dashboard-builder', label: 'Dashboards', emptyIcon: 'dashboard' },
    reports: { tag: 'phz-report-designer', label: 'Reports', emptyIcon: 'report' },
    'data-sources': { tag: 'phz-data-source-panel', label: 'Data Sources', emptyIcon: 'sourceDatabase' },
    connectors: { tag: 'phz-connection-editor', label: 'Connectors', emptyIcon: 'sourceUrl' },
    alerts: { tag: 'phz-alert-rule-designer', label: 'Alerts', emptyIcon: 'alertRule' },
    permissions: { tag: 'phz-permissions-panel', label: 'Permissions', emptyIcon: 'lock' },
    'grid-admin': { tag: 'phz-grid-admin', label: 'Grid Admin', emptyIcon: 'grid' },
    'engine-admin': { tag: 'phz-engine-admin', label: 'Engine Admin', emptyIcon: 'settings' },
    'grid-creator': { tag: 'phz-grid-creator', label: 'Grid Creator', emptyIcon: 'add' },
  };

  it('every panel has a valid tag name (kebab-case with phz- prefix)', () => {
    for (const [id, panel] of Object.entries(PANELS)) {
      expect(panel.tag, `Panel "${id}" tag should start with phz-`).toMatch(/^phz-[a-z-]+$/);
    }
  });

  it('every panel empty icon exists in the icon registry', () => {
    for (const [id, panel] of Object.entries(PANELS)) {
      expect(ICONS[panel.emptyIcon], `ICONS["${panel.emptyIcon}"] for panel "${id}" should exist`).toBeDefined();
    }
  });

  it('every panel has a non-empty label', () => {
    for (const [id, panel] of Object.entries(PANELS)) {
      expect(panel.label.length, `Panel "${id}" label should be non-empty`).toBeGreaterThan(0);
    }
  });
});

// ── Role-based accessibility ────────────────────────────────────────────

describe('PhzWorkspace role accessibility', () => {
  const roles: LegacyWorkspaceRole[] = ['admin', 'author', 'viewer'];

  for (const role of roles) {
    it(`${role} role produces valid nav items`, () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const items = getNavItemsForRole(role);
      expect(Array.isArray(items)).toBe(true);
      // Every item has id, label, icon, section
      for (const item of items) {
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeTruthy();
        expect(item.section).toBeTruthy();
      }
      warnSpy.mockRestore();
    });
  }

  it('no duplicate nav item IDs within a role', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const role of roles) {
      const items = getNavItemsForRole(role);
      const ids = items.map(i => i.id);
      const unique = new Set(ids);
      expect(unique.size, `${role} nav items should have unique IDs`).toBe(ids.length);
    }
    warnSpy.mockRestore();
  });
});
