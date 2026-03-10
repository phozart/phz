/**
 * Tests for Tasks 2.5, 2.6, 2.7:
 * - 2.5: Filter cascade — parent filter change → child dropdown repopulation
 * - 2.6: URL sync — filter state ↔ URL parameters
 * - 2.7: Filter admin — save FilterDefinitions via WorkspaceAdapter
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createUrlFilterSync,
  createCascadeWiring,
  createFilterAdminPersistence,
} from '../filters/filter-lifecycle-wiring.js';
import { createFilterContext } from '@phozart/phz-shared';

describe('filter-lifecycle-wiring', () => {
  // =====================================================================
  // Task 2.6: URL sync
  // =====================================================================
  describe('createUrlFilterSync', () => {
    it('serializes filter state to URL on filter change', () => {
      const ctx = createFilterContext();
      const pushState = vi.fn();

      const sync = createUrlFilterSync(ctx, { pushState });

      ctx.setFilter({
        filterId: 'region',
        field: 'region',
        operator: 'equals',
        value: 'US',
        label: 'Region: US',
      });

      // Should have serialized the filter to URL
      expect(pushState).toHaveBeenCalledTimes(1);
      const url = pushState.mock.calls[0][0] as string;
      expect(url).toContain('f.region=equals:US');

      sync.destroy();
    });

    it('restores filter state from URL string', () => {
      const ctx = createFilterContext();
      const pushState = vi.fn();

      const sync = createUrlFilterSync(ctx, { pushState });
      sync.restoreFromUrl('f.region=in:US,EU');

      const filters = ctx.resolveFilters();
      expect(filters.length).toBeGreaterThanOrEqual(1);

      const regionFilter = filters.find(f => f.field === 'region');
      expect(regionFilter).toBeDefined();
      expect(regionFilter!.operator).toBe('in');
      expect(regionFilter!.value).toEqual(['US', 'EU']);

      sync.destroy();
    });

    it('cleans up subscription on destroy', () => {
      const ctx = createFilterContext();
      const pushState = vi.fn();

      const sync = createUrlFilterSync(ctx, { pushState });
      sync.destroy();

      ctx.setFilter({
        filterId: 'x',
        field: 'x',
        operator: 'equals',
        value: 1,
        label: 'x',
      });

      expect(pushState).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // Task 2.5: Filter cascade
  // =====================================================================
  describe('createCascadeWiring', () => {
    it('triggers child value reload when parent filter changes', async () => {
      const ctx = createFilterContext();
      const mockAdapter = {
        getDistinctValues: vi.fn().mockResolvedValue({
          values: ['Widget A', 'Widget B'],
          totalCount: 2,
          truncated: false,
        }),
      };

      const onChildValues = vi.fn();

      const cascade = createCascadeWiring(ctx, mockAdapter as any, {
        dependencies: [
          { parentFilterId: 'country', childFilterId: 'city', cascadeField: 'city' },
        ],
        filterDefs: [
          { id: 'city', field: 'city', dataSourceId: 'sales', label: 'City', filterType: 'select' as any, required: false, appliesTo: [] },
        ],
        onChildValuesLoaded: onChildValues,
      });

      // Set parent filter
      ctx.setFilter({
        filterId: 'country',
        field: 'country',
        operator: 'equals',
        value: 'US',
        label: 'Country: US',
      });

      // Wait for async cascade
      await new Promise(r => setTimeout(r, 50));

      expect(mockAdapter.getDistinctValues).toHaveBeenCalledTimes(1);
      expect(onChildValues).toHaveBeenCalledWith('city', ['Widget A', 'Widget B']);

      cascade.destroy();
    });

    it('does nothing if no cascade dependencies defined', () => {
      const ctx = createFilterContext();

      const cascade = createCascadeWiring(ctx, {} as any, {
        dependencies: [],
        filterDefs: [],
      });

      // Should not throw
      ctx.setFilter({
        filterId: 'x',
        field: 'x',
        operator: 'equals',
        value: 1,
        label: 'x',
      });

      cascade.destroy();
    });
  });

  // =====================================================================
  // Task 2.7: Filter admin persistence
  // =====================================================================
  describe('createFilterAdminPersistence', () => {
    it('saves filter definition via workspace adapter', async () => {
      const mockAdapter = {
        saveArtifact: vi.fn().mockResolvedValue(undefined),
      };

      const persistence = createFilterAdminPersistence(mockAdapter as any);

      await persistence.saveFilterDefinition({
        id: 'fd-1',
        label: 'Region Filter',
        filterType: 'select',
        valueSource: { type: 'data-source', dataSourceId: 'sales', field: 'region' },
        bindings: [{ dataSourceId: 'sales', targetField: 'region' }],
        required: false,
      });

      expect(mockAdapter.saveArtifact).toHaveBeenCalledTimes(1);
      const call = mockAdapter.saveArtifact.mock.calls[0];
      expect(call[0]).toBe('filter-definition');
      expect(call[1].id).toBe('fd-1');
      expect(call[1].label).toBe('Region Filter');
    });

    it('deletes filter definition via workspace adapter', async () => {
      const mockAdapter = {
        deleteArtifact: vi.fn().mockResolvedValue(undefined),
      };

      const persistence = createFilterAdminPersistence(mockAdapter as any);
      await persistence.deleteFilterDefinition('fd-1');

      expect(mockAdapter.deleteArtifact).toHaveBeenCalledWith('filter-definition', 'fd-1');
    });

    it('lists filter definitions via workspace adapter', async () => {
      const mockAdapter = {
        listArtifacts: vi.fn().mockResolvedValue([
          { id: 'fd-1', type: 'filter-definition', name: 'Region', createdAt: 0, updatedAt: 0, visibility: 'published' },
        ]),
      };

      const persistence = createFilterAdminPersistence(mockAdapter as any);
      const defs = await persistence.listFilterDefinitions();

      expect(mockAdapter.listArtifacts).toHaveBeenCalledWith('filter-definition');
      expect(defs).toHaveLength(1);
    });
  });
});
