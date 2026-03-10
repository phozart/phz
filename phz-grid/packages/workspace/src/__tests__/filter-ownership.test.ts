/**
 * Sprint U.5 — Filter ownership model integration
 *
 * Tests: admin vs user permissions, preset pruning,
 * security restriction, contract-based filter resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveFiltersFromContract,
  prunePresetValues,
  applySecurityRestrictions,
  buildFilterBarFromContract,
} from '../filters/filter-ownership.js';
import type { FilterDefinition } from '../filters/filter-definition.js';
import type { ArtifactFilterContract } from '../types.js';
import type { ViewerContext } from '../types.js';
import type { FilterPreset } from '../filters/filter-preset-manager.js';
import type { FilterRuleResult } from '../filters/filter-rule-engine.js';

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id,
    label: `Filter ${id}`,
    filterType: 'select',
    valueSource: { type: 'static', values: ['A', 'B', 'C'] },
    bindings: [{ dataSourceId: 'ds1', targetField: id }],
    ...overrides,
  };
}

describe('FilterOwnership (U.5)', () => {
  // ── Contract-based filter resolution ──
  describe('resolveFiltersFromContract', () => {
    it('resolves filters with defaults from contract', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          { filterDefinitionId: 'fd-region' },
          { filterDefinitionId: 'fd-status' },
        ],
      };
      const defs = [
        makeDef('fd-region', { defaultValue: { type: 'static', value: 'US' } }),
        makeDef('fd-status'),
      ];
      const result = resolveFiltersFromContract(contract, defs);
      expect(result.filters).toHaveLength(2);
      expect(result.defaults['fd-region']).toBe('US');
    });

    it('applies preset values over defaults', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-region' }],
      };
      const defs = [makeDef('fd-region', { defaultValue: { type: 'static', value: 'US' } })];
      const presetValues = { 'fd-region': 'EU' };
      const result = resolveFiltersFromContract(contract, defs, undefined, presetValues);
      expect(result.effectiveValues['fd-region']).toBe('EU');
    });

    it('uses default when no preset value', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-region' }],
      };
      const defs = [makeDef('fd-region', { defaultValue: { type: 'static', value: 'US' } })];
      const result = resolveFiltersFromContract(contract, defs);
      expect(result.effectiveValues['fd-region']).toBe('US');
    });
  });

  // ── Preset pruning ──
  describe('prunePresetValues', () => {
    it('removes values for filters no longer in contract', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-region' }],
      };
      const presetValues = { 'fd-region': 'A', 'fd-removed': 'old' };
      const defs = [makeDef('fd-region')];
      const result = prunePresetValues(presetValues, contract, defs);
      expect(result.pruned).toHaveProperty('fd-region', 'A');
      expect(result.pruned).not.toHaveProperty('fd-removed');
      expect(result.removed).toContain('fd-removed');
    });

    it('prunes invalid values for static source', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-status' }],
        validation: { onInvalid: 'prune' },
      };
      const defs = [makeDef('fd-status', {
        valueSource: { type: 'static', values: ['active', 'inactive'] },
      })];
      const presetValues = { 'fd-status': 'deleted' };
      const result = prunePresetValues(presetValues, contract, defs);
      expect(result.pruned).not.toHaveProperty('fd-status');
      expect(result.removed).toContain('fd-status');
    });

    it('keeps valid values', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-status' }],
        validation: { onInvalid: 'prune' },
      };
      const defs = [makeDef('fd-status', {
        valueSource: { type: 'static', values: ['active', 'inactive'] },
      })];
      const presetValues = { 'fd-status': 'active' };
      const result = prunePresetValues(presetValues, contract, defs);
      expect(result.pruned).toHaveProperty('fd-status', 'active');
    });
  });

  // ── Security restrictions ──
  describe('applySecurityRestrictions', () => {
    it('restricts values based on viewer context', () => {
      const def = makeDef('fd-region', {
        securityBinding: {
          viewerAttribute: 'allowed_regions',
          restrictionType: 'include-only',
        },
      });
      const viewer: ViewerContext = {
        attributes: { allowed_regions: ['US', 'EU'] },
      };
      const allValues = ['US', 'EU', 'APAC', 'LATAM'];
      const restricted = applySecurityRestrictions(def, viewer, allValues);
      expect(restricted).toEqual(['US', 'EU']);
    });

    it('returns all values when no security binding', () => {
      const def = makeDef('fd-region');
      const allValues = ['US', 'EU', 'APAC'];
      const restricted = applySecurityRestrictions(def, undefined, allValues);
      expect(restricted).toEqual(allValues);
    });

    it('returns all values when viewer has no matching attribute', () => {
      const def = makeDef('fd-region', {
        securityBinding: {
          viewerAttribute: 'allowed_regions',
          restrictionType: 'include-only',
        },
      });
      const viewer: ViewerContext = { attributes: {} };
      const allValues = ['US', 'EU'];
      const restricted = applySecurityRestrictions(def, viewer, allValues);
      expect(restricted).toEqual(allValues);
    });
  });

  // ── Filter bar from contract ──
  describe('buildFilterBarFromContract', () => {
    it('builds filter bar entries from contract + definitions', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          { filterDefinitionId: 'fd-region', overrides: { label: 'Sales Region' } },
          { filterDefinitionId: 'fd-status' },
        ],
      };
      const defs = [
        makeDef('fd-region', { filterType: 'select' }),
        makeDef('fd-status', { filterType: 'multi-select' }),
      ];
      const entries = buildFilterBarFromContract(contract, defs);
      expect(entries).toHaveLength(2);
      expect(entries[0].label).toBe('Sales Region');
      expect(entries[0].filterType).toBe('select');
      expect(entries[1].label).toBe('Filter fd-status');
      expect(entries[1].filterType).toBe('multi-select');
    });

    it('skips missing definitions', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          { filterDefinitionId: 'fd-missing' },
        ],
      };
      const entries = buildFilterBarFromContract(contract, []);
      expect(entries).toHaveLength(0);
    });
  });
});
