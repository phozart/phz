/**
 * Sprint U.1 — FilterDefinition as catalog artifact
 *
 * Tests: type guards, creation/validation, binding resolution,
 * security binding evaluation, catalog integration.
 */

import { describe, it, expect } from 'vitest';
import {
  isFilterDefinition,
  createFilterDefinition,
  validateFilterDefinition,
  resolveBindingsForSource,
  evaluateSecurityBinding,
  resolveFilterDefault,
  type FilterDefinition,
  type FilterBinding,
  type SecurityBinding,
  type FilterValueSource,
  type FilterDefault,
  type FilterValueTransform,
} from '../filters/filter-definition.js';
import type { ViewerContext } from '../types.js';

describe('FilterDefinition (U.1)', () => {
  // ── Type guard ──
  describe('isFilterDefinition', () => {
    it('returns true for valid FilterDefinition', () => {
      const fd: FilterDefinition = {
        id: 'fd-1',
        label: 'Region',
        filterType: 'select',
        valueSource: { type: 'static', values: ['US', 'EU', 'APAC'] },
        bindings: [{ dataSourceId: 'sales', targetField: 'region' }],
      };
      expect(isFilterDefinition(fd)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isFilterDefinition(null)).toBe(false);
      expect(isFilterDefinition(undefined)).toBe(false);
    });

    it('returns false when required fields missing', () => {
      expect(isFilterDefinition({ id: 'x' })).toBe(false);
      expect(isFilterDefinition({ id: 'x', label: 'L' })).toBe(false);
      expect(isFilterDefinition({ id: 'x', label: 'L', filterType: 'select' })).toBe(false);
    });

    it('returns false for wrong filterType', () => {
      expect(isFilterDefinition({
        id: 'x', label: 'L', filterType: 'invalid',
        valueSource: { type: 'static', values: [] },
        bindings: [],
      })).toBe(false);
    });
  });

  // ── Creation ──
  describe('createFilterDefinition', () => {
    it('creates a FilterDefinition with defaults', () => {
      const fd = createFilterDefinition({
        label: 'Country',
        filterType: 'multi-select',
        valueSource: { type: 'static', values: ['US', 'UK'] },
        bindings: [{ dataSourceId: 'ds1', targetField: 'country' }],
      });
      expect(fd.id).toBeTruthy();
      expect(fd.label).toBe('Country');
      expect(fd.filterType).toBe('multi-select');
      expect(fd.required).toBe(false);
    });

    it('preserves optional fields', () => {
      const fd = createFilterDefinition({
        label: 'Status',
        description: 'Filter by status',
        filterType: 'select',
        valueSource: { type: 'lookup-table', entries: [{ value: 'active', label: 'Active' }] },
        bindings: [],
        required: true,
        dependsOn: ['fd-region'],
        defaultValue: { type: 'static', value: 'active' },
      });
      expect(fd.description).toBe('Filter by status');
      expect(fd.required).toBe(true);
      expect(fd.dependsOn).toEqual(['fd-region']);
    });
  });

  // ── Validation ──
  describe('validateFilterDefinition', () => {
    it('passes for valid definition', () => {
      const fd = createFilterDefinition({
        label: 'Region',
        filterType: 'select',
        valueSource: { type: 'static', values: ['US'] },
        bindings: [{ dataSourceId: 'ds1', targetField: 'region' }],
      });
      expect(validateFilterDefinition(fd).valid).toBe(true);
    });

    it('fails when label is empty', () => {
      const fd = createFilterDefinition({
        label: '',
        filterType: 'select',
        valueSource: { type: 'static', values: ['US'] },
        bindings: [],
      });
      const result = validateFilterDefinition(fd);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('label is required');
    });

    it('fails when data-source valueSource has no field', () => {
      const fd = createFilterDefinition({
        label: 'X',
        filterType: 'select',
        valueSource: { type: 'data-source', dataSourceId: 'ds1', field: '' },
        bindings: [],
      });
      const result = validateFilterDefinition(fd);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('field'))).toBe(true);
    });

    it('fails when lookup-table has no entries', () => {
      const fd = createFilterDefinition({
        label: 'X',
        filterType: 'select',
        valueSource: { type: 'lookup-table', entries: [] },
        bindings: [],
      });
      const result = validateFilterDefinition(fd);
      expect(result.valid).toBe(false);
    });
  });

  // ── Binding resolution ──
  describe('resolveBindingsForSource', () => {
    const bindings: FilterBinding[] = [
      { dataSourceId: 'sales', targetField: 'region' },
      { dataSourceId: 'inventory', targetField: 'warehouse_region' },
    ];

    it('returns matching binding for data source', () => {
      const result = resolveBindingsForSource(bindings, 'sales');
      expect(result).toHaveLength(1);
      expect(result[0].targetField).toBe('region');
    });

    it('returns empty array when no match', () => {
      expect(resolveBindingsForSource(bindings, 'unknown')).toEqual([]);
    });

    it('handles bindings with transform', () => {
      const withTransform: FilterBinding[] = [
        {
          dataSourceId: 'ds1',
          targetField: 'region_code',
          transform: { type: 'lookup', lookupSourceId: 'regions', keyField: 'code', valueField: 'name' },
        },
      ];
      const result = resolveBindingsForSource(withTransform, 'ds1');
      expect(result[0].transform?.type).toBe('lookup');
    });
  });

  // ── Security binding ──
  describe('evaluateSecurityBinding', () => {
    it('restricts with include-only', () => {
      const binding: SecurityBinding = {
        viewerAttribute: 'allowed_regions',
        restrictionType: 'include-only',
      };
      const viewer: ViewerContext = {
        attributes: { allowed_regions: ['US', 'EU'] },
      };
      const allValues = ['US', 'EU', 'APAC', 'LATAM'];
      const result = evaluateSecurityBinding(binding, viewer, allValues);
      expect(result).toEqual(['US', 'EU']);
    });

    it('restricts with exclude', () => {
      const binding: SecurityBinding = {
        viewerAttribute: 'excluded_regions',
        restrictionType: 'exclude',
      };
      const viewer: ViewerContext = {
        attributes: { excluded_regions: ['APAC'] },
      };
      const allValues = ['US', 'EU', 'APAC'];
      const result = evaluateSecurityBinding(binding, viewer, allValues);
      expect(result).toEqual(['US', 'EU']);
    });

    it('restricts with max-value', () => {
      const binding: SecurityBinding = {
        viewerAttribute: 'max_amount',
        restrictionType: 'max-value',
      };
      const viewer: ViewerContext = {
        attributes: { max_amount: 100 },
      };
      const allValues = [50, 100, 150, 200];
      const result = evaluateSecurityBinding(binding, viewer, allValues);
      expect(result).toEqual([50, 100]);
    });

    it('returns all values when no viewer context', () => {
      const binding: SecurityBinding = {
        viewerAttribute: 'allowed_regions',
        restrictionType: 'include-only',
      };
      const allValues = ['US', 'EU', 'APAC'];
      const result = evaluateSecurityBinding(binding, undefined, allValues);
      expect(result).toEqual(allValues);
    });

    it('returns all values when viewer attribute missing', () => {
      const binding: SecurityBinding = {
        viewerAttribute: 'allowed_regions',
        restrictionType: 'include-only',
      };
      const viewer: ViewerContext = { attributes: {} };
      const allValues = ['US', 'EU'];
      const result = evaluateSecurityBinding(binding, viewer, allValues);
      expect(result).toEqual(allValues);
    });
  });

  // ── Default resolution ──
  describe('resolveFilterDefault', () => {
    it('resolves static default', () => {
      const def: FilterDefault = { type: 'static', value: 'US' };
      expect(resolveFilterDefault(def)).toBe('US');
    });

    it('resolves viewer-attribute default', () => {
      const def: FilterDefault = { type: 'viewer-attribute', attribute: 'default_region' };
      const viewer: ViewerContext = { attributes: { default_region: 'EU' } };
      expect(resolveFilterDefault(def, viewer)).toBe('EU');
    });

    it('returns undefined for viewer-attribute when no viewer', () => {
      const def: FilterDefault = { type: 'viewer-attribute', attribute: 'default_region' };
      expect(resolveFilterDefault(def)).toBeUndefined();
    });

    it('resolves relative-date default', () => {
      const def: FilterDefault = { type: 'relative-date', offset: -7, unit: 'days' };
      const result = resolveFilterDefault(def);
      expect(result).toBeInstanceOf(Date);
    });

    it('resolves expression default as string passthrough', () => {
      const def: FilterDefault = { type: 'expression', expr: 'NOW() - INTERVAL 1 MONTH' };
      expect(resolveFilterDefault(def)).toBe('NOW() - INTERVAL 1 MONTH');
    });
  });
});
