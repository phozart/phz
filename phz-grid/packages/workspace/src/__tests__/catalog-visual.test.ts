/**
 * S.4 — Catalog Browser Visual Redesign tests
 */

import { describe, it, expect } from 'vitest';

describe('Catalog Visual (S.4)', () => {
  describe('VISIBILITY_TABS', () => {
    it('contains My Work, Shared, and Published tabs', async () => {
      const { VISIBILITY_TABS } = await import('../catalog/catalog-visual.js');
      expect(VISIBILITY_TABS).toHaveLength(3);
      expect(VISIBILITY_TABS.map(t => t.id)).toEqual(['my-work', 'shared', 'published']);
    });

    it('each tab has id and label', async () => {
      const { VISIBILITY_TABS } = await import('../catalog/catalog-visual.js');
      for (const tab of VISIBILITY_TABS) {
        expect(tab.id).toBeTruthy();
        expect(tab.label).toBeTruthy();
      }
    });
  });

  describe('ARTIFACT_TYPE_COLORS', () => {
    it('maps dashboard to blue', async () => {
      const { ARTIFACT_TYPE_COLORS } = await import('../catalog/catalog-visual.js');
      expect(ARTIFACT_TYPE_COLORS.dashboard).toBe('#3B82F6');
    });

    it('maps report to emerald', async () => {
      const { ARTIFACT_TYPE_COLORS } = await import('../catalog/catalog-visual.js');
      expect(ARTIFACT_TYPE_COLORS.report).toBe('#10B981');
    });

    it('maps grid-definition to violet', async () => {
      const { ARTIFACT_TYPE_COLORS } = await import('../catalog/catalog-visual.js');
      expect(ARTIFACT_TYPE_COLORS['grid-definition']).toBe('#8B5CF6');
    });

    it('maps kpi to coral', async () => {
      const { ARTIFACT_TYPE_COLORS } = await import('../catalog/catalog-visual.js');
      expect(ARTIFACT_TYPE_COLORS.kpi).toBe('#F97316');
    });

    it('maps alert-rule to red', async () => {
      const { ARTIFACT_TYPE_COLORS } = await import('../catalog/catalog-visual.js');
      expect(ARTIFACT_TYPE_COLORS['alert-rule']).toBe('#EF4444');
    });
  });

  describe('getArtifactCardProps()', () => {
    it('returns type icon, color, and display name', async () => {
      const { getArtifactCardProps } = await import('../catalog/catalog-visual.js');
      const props = getArtifactCardProps({
        id: '1', type: 'dashboard', name: 'Sales',
        description: 'Sales overview dashboard with key metrics',
        createdAt: 0, updatedAt: 0,
      });
      expect(props.typeIcon).toBeTruthy();
      expect(props.typeColor).toBe('#3B82F6');
      expect(props.displayName).toBe('Sales');
      expect(props.truncatedDescription).toBeDefined();
    });

    it('truncates long descriptions', async () => {
      const { getArtifactCardProps } = await import('../catalog/catalog-visual.js');
      const longDesc = 'A'.repeat(200);
      const props = getArtifactCardProps({
        id: '1', type: 'report', name: 'Test',
        description: longDesc,
        createdAt: 0, updatedAt: 0,
      });
      expect(props.truncatedDescription!.length).toBeLessThan(200);
      expect(props.truncatedDescription!.endsWith('...')).toBe(true);
    });

    it('handles undefined description', async () => {
      const { getArtifactCardProps } = await import('../catalog/catalog-visual.js');
      const props = getArtifactCardProps({
        id: '1', type: 'kpi', name: 'Revenue',
        createdAt: 0, updatedAt: 0,
      });
      expect(props.truncatedDescription).toBeUndefined();
    });
  });

  describe('getStatusBadge()', () => {
    it('returns Published badge for published artifacts', async () => {
      const { getStatusBadge } = await import('../catalog/catalog-visual.js');
      const badge = getStatusBadge({ id: '1', type: 'dashboard', name: 'X', createdAt: 0, updatedAt: 0, published: true });
      expect(badge.label).toBe('Published');
      expect(badge.variant).toBe('published');
    });

    it('returns Draft badge for unpublished artifacts', async () => {
      const { getStatusBadge } = await import('../catalog/catalog-visual.js');
      const badge = getStatusBadge({ id: '1', type: 'dashboard', name: 'X', createdAt: 0, updatedAt: 0, published: false });
      expect(badge.label).toBe('Draft');
      expect(badge.variant).toBe('draft');
    });

    it('returns Draft badge when published is undefined', async () => {
      const { getStatusBadge } = await import('../catalog/catalog-visual.js');
      const badge = getStatusBadge({ id: '1', type: 'dashboard', name: 'X', createdAt: 0, updatedAt: 0 });
      expect(badge.label).toBe('Draft');
      expect(badge.variant).toBe('draft');
    });
  });

  describe('filterByVisibility()', () => {
    it('filters by published status for "published" tab', async () => {
      const { filterByVisibility } = await import('../catalog/catalog-visual.js');
      const artifacts = [
        { id: '1', type: 'dashboard' as const, name: 'A', createdAt: 0, updatedAt: 0, published: true },
        { id: '2', type: 'report' as const, name: 'B', createdAt: 0, updatedAt: 0, published: false },
      ];
      const result = filterByVisibility(artifacts, 'published');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
});
