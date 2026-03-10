/**
 * Sprint U.3 — ArtifactFilterContract
 *
 * Tests: contract resolution, missing definitions, default resolution,
 * validation with prune/clamp/invalidate, orphaned preset handling.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveFilterContract,
  validateFilterValues,
  type ResolvedFilterContract,
  type ResolvedFilter,
} from '../filters/filter-contract-resolver.js';
import type {
  FilterDefinition,
  FilterBinding,
} from '../filters/filter-definition.js';
import type {
  ArtifactFilterContract,
  DashboardFilterRef,
  FilterDefault,
  FilterValueTransform,
} from '../types.js';
import type { ViewerContext } from '../types.js';

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

describe('FilterContractResolver (U.3)', () => {
  // ── resolveFilterContract ──
  describe('resolveFilterContract', () => {
    it('resolves all accepted filters', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          { filterDefinitionId: 'fd-region' },
          { filterDefinitionId: 'fd-status' },
        ],
      };
      const defs = [makeDef('fd-region'), makeDef('fd-status')];
      const result = resolveFilterContract(contract, defs);
      expect(result.filters).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);
    });

    it('produces warning for missing definition', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          { filterDefinitionId: 'fd-missing' },
        ],
      };
      const result = resolveFilterContract(contract, []);
      expect(result.filters).toHaveLength(0);
      expect(result.warnings.some(w => w.includes('fd-missing'))).toBe(true);
    });

    it('applies overrides from DashboardFilterRef', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          {
            filterDefinitionId: 'fd-region',
            overrides: { label: 'Sales Region', required: true },
          },
        ],
      };
      const defs = [makeDef('fd-region')];
      const result = resolveFilterContract(contract, defs);
      expect(result.filters[0].overrides?.label).toBe('Sales Region');
      expect(result.filters[0].overrides?.required).toBe(true);
    });

    it('applies queryLayer from ref', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [
          { filterDefinitionId: 'fd-region', queryLayer: 'server' },
        ],
      };
      const defs = [makeDef('fd-region')];
      const result = resolveFilterContract(contract, defs);
      expect(result.filters[0].queryLayer).toBe('server');
    });

    it('defaults queryLayer to auto', () => {
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-region' }],
      };
      const defs = [makeDef('fd-region')];
      const result = resolveFilterContract(contract, defs);
      expect(result.filters[0].queryLayer).toBe('auto');
    });

    it('resolves default from definition', () => {
      const defs = [makeDef('fd-region', {
        defaultValue: { type: 'static', value: 'US' },
      })];
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-region' }],
      };
      const result = resolveFilterContract(contract, defs);
      expect(result.filters[0].resolvedDefault).toBe('US');
    });

    it('resolves default from override, taking precedence', () => {
      const defs = [makeDef('fd-region', {
        defaultValue: { type: 'static', value: 'US' },
      })];
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{
          filterDefinitionId: 'fd-region',
          overrides: { defaultValue: { type: 'static', value: 'EU' } },
        }],
      };
      const result = resolveFilterContract(contract, defs);
      expect(result.filters[0].resolvedDefault).toBe('EU');
    });

    it('resolves viewer-attribute default', () => {
      const defs = [makeDef('fd-region', {
        defaultValue: { type: 'viewer-attribute', attribute: 'home_region' },
      })];
      const contract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-region' }],
      };
      const viewer: ViewerContext = { attributes: { home_region: 'APAC' } };
      const result = resolveFilterContract(contract, defs, viewer);
      expect(result.filters[0].resolvedDefault).toBe('APAC');
    });
  });

  // ── validateFilterValues ──
  describe('validateFilterValues', () => {
    const defs = [
      makeDef('fd-region'),
      makeDef('fd-status', {
        valueSource: { type: 'static', values: ['active', 'inactive', 'pending'] },
      }),
    ];
    const contract: ArtifactFilterContract = {
      acceptedFilters: [
        { filterDefinitionId: 'fd-region' },
        { filterDefinitionId: 'fd-status' },
      ],
    };

    it('validates all known values as valid', () => {
      const values = { 'fd-region': 'A', 'fd-status': 'active' };
      const result = validateFilterValues(contract, values, defs);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('prunes unknown filter IDs (default behavior)', () => {
      const values = { 'fd-region': 'A', 'unknown-filter': 'value' };
      const result = validateFilterValues(contract, values, defs);
      expect(result.valid).toBe(true);
      expect(result.pruned).not.toHaveProperty('unknown-filter');
      expect(result.pruned).toHaveProperty('fd-region');
    });

    it('validates with prune strategy for invalid values', () => {
      const contractWithValidation: ArtifactFilterContract = {
        ...contract,
        validation: { onInvalid: 'prune' },
      };
      const values = { 'fd-status': 'deleted' }; // not in static values
      const result = validateFilterValues(contractWithValidation, values, defs);
      expect(result.pruned).not.toHaveProperty('fd-status');
      expect(result.warnings.some(w => w.includes('pruned'))).toBe(true);
    });

    it('validates with ignore strategy', () => {
      const contractWithValidation: ArtifactFilterContract = {
        ...contract,
        validation: { onInvalid: 'ignore' },
      };
      const values = { 'fd-status': 'deleted' };
      const result = validateFilterValues(contractWithValidation, values, defs);
      expect(result.valid).toBe(true);
      expect(result.pruned).toHaveProperty('fd-status', 'deleted');
    });

    it('validates with invalidate strategy', () => {
      const contractWithValidation: ArtifactFilterContract = {
        ...contract,
        validation: { onInvalid: 'invalidate' },
      };
      const values = { 'fd-status': 'deleted' };
      const result = validateFilterValues(contractWithValidation, values, defs);
      expect(result.valid).toBe(false);
    });

    it('handles empty values', () => {
      const result = validateFilterValues(contract, {}, defs);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.pruned)).toHaveLength(0);
    });

    it('keeps values for non-static value sources', () => {
      const dataDefs = [makeDef('fd-dynamic', {
        valueSource: { type: 'data-source', dataSourceId: 'ds1', field: 'col' },
      })];
      const dynContract: ArtifactFilterContract = {
        acceptedFilters: [{ filterDefinitionId: 'fd-dynamic' }],
        validation: { onInvalid: 'prune' },
      };
      const values = { 'fd-dynamic': 'anything' };
      const result = validateFilterValues(dynContract, values, dataDefs);
      // data-source values can't be validated statically, so keep them
      expect(result.pruned).toHaveProperty('fd-dynamic', 'anything');
    });
  });
});
