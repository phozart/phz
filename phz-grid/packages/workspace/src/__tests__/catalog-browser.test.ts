import { describe, it, expect } from 'vitest';
import type { ArtifactMeta, ArtifactType } from '../types.js';
import { groupArtifactsByType, filterArtifactsBySearch } from '../catalog/catalog-utils.js';

function makeArtifact(id: string, type: ArtifactType, name: string, published = false): ArtifactMeta {
  return { id, type, name, createdAt: 0, updatedAt: 0, published };
}

describe('CatalogBrowser', () => {
  describe('PhzCatalogBrowser class', () => {
    it('exists and is importable', async () => {
      const mod = await import('../catalog/phz-catalog-browser.js');
      expect(mod.PhzCatalogBrowser).toBeDefined();
    });

    it('has correct tag name', async () => {
      const mod = await import('../catalog/phz-catalog-browser.js');
      expect(mod.PhzCatalogBrowser.TAG).toBe('phz-catalog-browser');
    });
  });

  describe('groupArtifactsByType', () => {
    it('returns empty map for empty input', () => {
      const result = groupArtifactsByType([]);
      expect(result.size).toBe(0);
    });

    it('groups artifacts by type', () => {
      const artifacts = [
        makeArtifact('r1', 'report', 'Sales Report'),
        makeArtifact('r2', 'report', 'HR Report'),
        makeArtifact('d1', 'dashboard', 'Exec Dashboard'),
        makeArtifact('k1', 'kpi', 'NPS'),
      ];
      const grouped = groupArtifactsByType(artifacts);
      expect(grouped.get('report')).toHaveLength(2);
      expect(grouped.get('dashboard')).toHaveLength(1);
      expect(grouped.get('kpi')).toHaveLength(1);
    });

    it('preserves order within groups', () => {
      const artifacts = [
        makeArtifact('r1', 'report', 'Alpha'),
        makeArtifact('r2', 'report', 'Beta'),
        makeArtifact('r3', 'report', 'Charlie'),
      ];
      const grouped = groupArtifactsByType(artifacts);
      const names = grouped.get('report')!.map(a => a.name);
      expect(names).toEqual(['Alpha', 'Beta', 'Charlie']);
    });
  });

  describe('filterArtifactsBySearch', () => {
    const artifacts = [
      makeArtifact('r1', 'report', 'Sales Report'),
      makeArtifact('r2', 'report', 'HR Report'),
      makeArtifact('d1', 'dashboard', 'Sales Dashboard'),
      makeArtifact('k1', 'kpi', 'Net Promoter Score'),
    ];

    it('returns all when query is empty', () => {
      expect(filterArtifactsBySearch(artifacts, '')).toHaveLength(4);
    });

    it('filters by name case-insensitively', () => {
      const result = filterArtifactsBySearch(artifacts, 'sales');
      expect(result).toHaveLength(2);
      expect(result.map(a => a.name)).toEqual(['Sales Report', 'Sales Dashboard']);
    });

    it('returns empty for no match', () => {
      expect(filterArtifactsBySearch(artifacts, 'zzz')).toHaveLength(0);
    });

    it('trims whitespace from query', () => {
      const result = filterArtifactsBySearch(artifacts, '  promoter  ');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Net Promoter Score');
    });
  });
});
