/**
 * PlacementManager component tests.
 *
 * Tests pure logic: filtering placements, CRUD operations via adapter.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryWorkspaceAdapter } from '../adapters/memory-adapter.js';
import { createPlacement } from '../placement.js';
import type { PlacementRecord } from '../placement.js';
import {
  filterPlacementsByArtifact,
  sortPlacementsByDate,
} from '../placements/placement-utils.js';

describe('PlacementManager', () => {
  describe('PhzPlacementManager class', () => {
    it('exists and is importable', async () => {
      const mod = await import('../placements/phz-placement-manager.js');
      expect(mod.PhzPlacementManager).toBeDefined();
    });

    it('has correct tag name', async () => {
      const mod = await import('../placements/phz-placement-manager.js');
      expect(mod.PhzPlacementManager.TAG).toBe('phz-placement-manager');
    });
  });

  describe('filterPlacementsByArtifact', () => {
    const placements: PlacementRecord[] = [
      createPlacement({ artifactType: 'report', artifactId: 'r1', target: 'main' }),
      createPlacement({ artifactType: 'dashboard', artifactId: 'd1', target: 'main' }),
      createPlacement({ artifactType: 'report', artifactId: 'r1', target: 'sidebar' }),
      createPlacement({ artifactType: 'kpi', artifactId: 'k1', target: 'main' }),
    ];

    it('returns all placements when no artifactId is provided', () => {
      const result = filterPlacementsByArtifact(placements, undefined);
      expect(result).toHaveLength(4);
    });

    it('filters by artifactId', () => {
      const result = filterPlacementsByArtifact(placements, 'r1');
      expect(result).toHaveLength(2);
      expect(result.every(p => p.artifactId === 'r1')).toBe(true);
    });

    it('returns empty for non-matching artifactId', () => {
      const result = filterPlacementsByArtifact(placements, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortPlacementsByDate', () => {
    it('sorts placements newest first', () => {
      const p1 = createPlacement({ artifactType: 'report', artifactId: 'r1', target: 'a' });
      const p2 = createPlacement({ artifactType: 'report', artifactId: 'r2', target: 'b' });
      const p3 = createPlacement({ artifactType: 'report', artifactId: 'r3', target: 'c' });
      // Override timestamps for deterministic ordering
      (p1 as any).createdAt = 100;
      (p2 as any).createdAt = 300;
      (p3 as any).createdAt = 200;

      const sorted = sortPlacementsByDate([p1, p2, p3]);
      expect(sorted[0].artifactId).toBe('r2');
      expect(sorted[1].artifactId).toBe('r3');
      expect(sorted[2].artifactId).toBe('r1');
    });

    it('returns empty array for empty input', () => {
      expect(sortPlacementsByDate([])).toEqual([]);
    });
  });

  describe('CRUD via MemoryWorkspaceAdapter', () => {
    let adapter: MemoryWorkspaceAdapter;

    beforeEach(async () => {
      adapter = new MemoryWorkspaceAdapter();
      await adapter.initialize();
    });

    it('creates and retrieves a placement', async () => {
      const placement = createPlacement({
        artifactType: 'report',
        artifactId: 'r1',
        target: 'main-panel',
      });
      await adapter.savePlacement(placement);
      const loaded = await adapter.loadPlacements();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].artifactId).toBe('r1');
      expect(loaded[0].target).toBe('main-panel');
    });

    it('filters placements by artifactId', async () => {
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 'main' }));
      await adapter.savePlacement(createPlacement({ artifactType: 'dashboard', artifactId: 'd1', target: 'main' }));

      const filtered = await adapter.loadPlacements({ artifactId: 'r1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artifactId).toBe('r1');
    });

    it('deletes a placement', async () => {
      const placement = createPlacement({ artifactType: 'kpi', artifactId: 'k1', target: 'sidebar' });
      await adapter.savePlacement(placement);
      expect(await adapter.loadPlacements()).toHaveLength(1);

      await adapter.deletePlacement(placement.id);
      expect(await adapter.loadPlacements()).toHaveLength(0);
    });

    it('clear removes all placements', async () => {
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 'a' }));
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r2', target: 'b' }));
      expect(await adapter.loadPlacements()).toHaveLength(2);

      await adapter.clear();
      expect(await adapter.loadPlacements()).toHaveLength(0);
    });
  });
});
