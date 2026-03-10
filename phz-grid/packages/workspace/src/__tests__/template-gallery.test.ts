import { describe, it, expect } from 'vitest';
import { filterTemplates, groupTemplatesByCategory } from '../templates/phz-template-gallery.js';
import type { TemplateDefinition } from '../types.js';
import { templateId } from '../types.js';

function makeTpl(id: string, name: string, category: string, tags: string[] = []): TemplateDefinition {
  return {
    id: templateId(id),
    name,
    description: `${name} template`,
    category,
    layout: { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [] },
    widgetSlots: [],
    matchRules: [],
    tags,
    builtIn: true,
  } as TemplateDefinition;
}

describe('TemplateGallery utilities', () => {
  const templates = [
    makeTpl('1', 'KPI Overview', 'overview', ['kpi']),
    makeTpl('2', 'Time Series', 'analytics', ['chart', 'time']),
    makeTpl('3', 'Tabular Report', 'reports', ['table']),
    makeTpl('4', 'Executive Summary', 'overview', ['executive']),
  ];

  describe('filterTemplates', () => {
    it('returns all when query is empty', () => {
      expect(filterTemplates(templates, '')).toHaveLength(4);
    });

    it('filters by name case-insensitively', () => {
      const result = filterTemplates(templates, 'kpi');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('KPI Overview');
    });

    it('filters by tag', () => {
      const result = filterTemplates(templates, 'chart');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Time Series');
    });

    it('returns empty for no match', () => {
      expect(filterTemplates(templates, 'nonexistent')).toEqual([]);
    });
  });

  describe('groupTemplatesByCategory', () => {
    it('groups templates by category', () => {
      const groups = groupTemplatesByCategory(templates);
      expect(groups.get('overview')).toHaveLength(2);
      expect(groups.get('analytics')).toHaveLength(1);
      expect(groups.get('reports')).toHaveLength(1);
    });

    it('returns empty map for empty array', () => {
      expect(groupTemplatesByCategory([]).size).toBe(0);
    });
  });
});
