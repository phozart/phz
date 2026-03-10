/**
 * Catalog Search Enhancement (L.2) — Tests
 */
import { describe, it, expect } from 'vitest';
import type { ArtifactMeta, ArtifactType, TemplateDefinition } from '../types.js';
import {
  filterArtifactsBySearch,
  filterTemplatesBySearch,
  unifiedSearch,
  type UnifiedSearchResult,
} from '../catalog/catalog-utils.js';

function makeArtifact(id: string, type: ArtifactType, name: string): ArtifactMeta {
  return { id, type, name, createdAt: 0, updatedAt: 0 };
}

function makeTemplate(id: string, name: string, tags: string[] = []): TemplateDefinition {
  return {
    id: id as TemplateDefinition['id'],
    name,
    description: `${name} template`,
    category: 'general',
    layout: { kind: 'auto-grid' as const, columns: 2, gap: 16, widgets: [] },
    widgetSlots: [],
    matchRules: [],
    tags,
    builtIn: true,
  };
}

describe('Catalog Search (L.2)', () => {
  describe('filterTemplatesBySearch', () => {
    const templates = [
      makeTemplate('t1', 'Sales Overview', ['sales', 'kpi']),
      makeTemplate('t2', 'HR Dashboard', ['hr']),
      makeTemplate('t3', 'Financial Summary', ['finance']),
    ];

    it('returns all when query is empty', () => {
      expect(filterTemplatesBySearch(templates, '')).toHaveLength(3);
    });

    it('filters by name case-insensitively', () => {
      const result = filterTemplatesBySearch(templates, 'sales');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Overview');
    });

    it('matches by tag', () => {
      const result = filterTemplatesBySearch(templates, 'finance');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Financial Summary');
    });

    it('matches by description', () => {
      const result = filterTemplatesBySearch(templates, 'template');
      expect(result).toHaveLength(3);
    });

    it('returns empty for no match', () => {
      expect(filterTemplatesBySearch(templates, 'zzz')).toHaveLength(0);
    });
  });

  describe('unifiedSearch', () => {
    const artifacts = [
      makeArtifact('r1', 'report', 'Sales Report'),
      makeArtifact('d1', 'dashboard', 'HR Dashboard'),
    ];
    const templates = [
      makeTemplate('t1', 'Sales Template'),
      makeTemplate('t2', 'HR Template'),
    ];

    it('returns artifacts and templates matching query', () => {
      const result = unifiedSearch(artifacts, templates, 'sales');
      expect(result.artifacts).toHaveLength(1);
      expect(result.templates).toHaveLength(1);
      expect(result.artifacts[0].name).toBe('Sales Report');
      expect(result.templates[0].name).toBe('Sales Template');
    });

    it('returns all when query is empty', () => {
      const result = unifiedSearch(artifacts, templates, '');
      expect(result.artifacts).toHaveLength(2);
      expect(result.templates).toHaveLength(2);
    });

    it('returns empty for no match', () => {
      const result = unifiedSearch(artifacts, templates, 'zzz');
      expect(result.artifacts).toHaveLength(0);
      expect(result.templates).toHaveLength(0);
    });

    it('totalCount sums both', () => {
      const result = unifiedSearch(artifacts, templates, 'hr');
      expect(result.totalCount).toBe(2);
    });
  });
});
