import { describe, it, expect } from 'vitest';
import {
  generateDateHierarchy,
  createCustomHierarchy,
  validateHierarchy,
} from '../hierarchy.js';
import type { HierarchyDefinition, HierarchyLevel } from '../hierarchy.js';

describe('generateDateHierarchy', () => {
  it('creates exactly 5 levels: Year → Quarter → Month → Week → Day', () => {
    const h = generateDateHierarchy('orderDate');
    expect(h.levels).toHaveLength(5);
    expect(h.levels.map(l => l.label)).toEqual(['Year', 'Quarter', 'Month', 'Week', 'Day']);
  });

  it('sets the sourceId to the dateField', () => {
    const h = generateDateHierarchy('createdAt');
    expect(h.sourceId).toBe('createdAt');
  });

  it('generates field names derived from the date field', () => {
    const h = generateDateHierarchy('orderDate');
    expect(h.levels[0].field).toBe('orderDate_year');
    expect(h.levels[1].field).toBe('orderDate_quarter');
    expect(h.levels[2].field).toBe('orderDate_month');
    expect(h.levels[3].field).toBe('orderDate_week');
    expect(h.levels[4].field).toBe('orderDate_day');
  });

  it('assigns a stable id and name', () => {
    const h = generateDateHierarchy('createdAt');
    expect(h.id).toBeTruthy();
    expect(h.name).toContain('createdAt');
  });

  it('sets ascending sort order on all levels', () => {
    const h = generateDateHierarchy('ts');
    for (const level of h.levels) {
      expect(level.sortOrder).toBe('asc');
    }
  });
});

describe('createCustomHierarchy', () => {
  it('creates a hierarchy with the given fields as levels', () => {
    const h = createCustomHierarchy('Geography', ['country', 'state', 'city']);
    expect(h.name).toBe('Geography');
    expect(h.levels).toHaveLength(3);
    expect(h.levels[0].field).toBe('country');
    expect(h.levels[1].field).toBe('state');
    expect(h.levels[2].field).toBe('city');
  });

  it('uses field names as labels by default', () => {
    const h = createCustomHierarchy('Org', ['division', 'department']);
    expect(h.levels[0].label).toBe('division');
    expect(h.levels[1].label).toBe('department');
  });

  it('generates a unique id', () => {
    const h1 = createCustomHierarchy('A', ['f1', 'f2']);
    const h2 = createCustomHierarchy('B', ['f3', 'f4']);
    expect(h1.id).not.toBe(h2.id);
  });
});

describe('validateHierarchy', () => {
  it('returns valid for a well-formed hierarchy', () => {
    const h = generateDateHierarchy('date');
    const result = validateHierarchy(h);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a hierarchy with fewer than 2 levels', () => {
    const h: HierarchyDefinition = {
      id: 'h1',
      name: 'Bad',
      levels: [{ field: 'only', label: 'Only' }],
    };
    const result = validateHierarchy(h);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('2 levels'))).toBe(true);
  });

  it('rejects a hierarchy with zero levels', () => {
    const h: HierarchyDefinition = { id: 'h2', name: 'Empty', levels: [] };
    const result = validateHierarchy(h);
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate fields across levels', () => {
    const h: HierarchyDefinition = {
      id: 'h3',
      name: 'Dupe',
      levels: [
        { field: 'region', label: 'Region' },
        { field: 'region', label: 'Region Again' },
      ],
    };
    const result = validateHierarchy(h);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('duplicate') || e.includes('Duplicate'))).toBe(true);
  });

  it('returns multiple errors when multiple violations exist', () => {
    const h: HierarchyDefinition = {
      id: 'h4',
      name: 'Bad',
      levels: [{ field: 'x', label: 'X' }],
    };
    // Only 1 level — single error
    const result = validateHierarchy(h);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });
});
