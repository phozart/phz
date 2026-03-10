/**
 * Sprint V.6 — Grid definitions as first-class artifacts
 *
 * Tests: grid artifact creation, catalog registration,
 * conversion between grid config and artifact meta.
 */

import { describe, it, expect } from 'vitest';
import {
  createGridArtifact,
  isGridArtifact,
  gridArtifactToMeta,
  type GridArtifact,
} from '../navigation/grid-artifact.js';
import type { ArtifactType } from '../types.js';

describe('GridArtifact (V.6)', () => {
  describe('createGridArtifact', () => {
    it('creates a grid artifact with defaults', () => {
      const artifact = createGridArtifact({
        name: 'Sales Grid',
        dataSourceId: 'ds-sales',
        columns: [
          { field: 'region', header: 'Region' },
          { field: 'amount', header: 'Amount' },
        ],
      });
      expect(artifact.id).toBeTruthy();
      expect(artifact.type).toBe('grid-definition' satisfies ArtifactType);
      expect(artifact.name).toBe('Sales Grid');
      expect(artifact.dataSourceId).toBe('ds-sales');
      expect(artifact.columns).toHaveLength(2);
      expect(artifact.createdAt).toBeGreaterThan(0);
    });

    it('preserves optional fields', () => {
      const artifact = createGridArtifact({
        name: 'Full Grid',
        dataSourceId: 'ds-1',
        columns: [],
        description: 'A full grid config',
        defaultSort: [{ field: 'name', direction: 'asc' }],
        defaultFilters: { region: 'US' },
        density: 'compact',
        enableGrouping: true,
      });
      expect(artifact.description).toBe('A full grid config');
      expect(artifact.defaultSort).toHaveLength(1);
      expect(artifact.density).toBe('compact');
      expect(artifact.enableGrouping).toBe(true);
    });
  });

  describe('isGridArtifact', () => {
    it('returns true for valid grid artifact', () => {
      const artifact = createGridArtifact({
        name: 'Test',
        dataSourceId: 'ds-1',
        columns: [],
      });
      expect(isGridArtifact(artifact)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isGridArtifact(null)).toBe(false);
      expect(isGridArtifact(undefined)).toBe(false);
    });

    it('returns false for wrong type', () => {
      expect(isGridArtifact({ id: 'x', type: 'report', name: 'X' })).toBe(false);
    });
  });

  describe('gridArtifactToMeta', () => {
    it('converts to ArtifactMeta', () => {
      const artifact = createGridArtifact({
        name: 'My Grid',
        dataSourceId: 'ds-1',
        columns: [],
        description: 'Grid desc',
      });
      const meta = gridArtifactToMeta(artifact);
      expect(meta.id).toBe(artifact.id);
      expect(meta.type).toBe('grid-definition');
      expect(meta.name).toBe('My Grid');
      expect(meta.description).toBe('Grid desc');
      expect(meta.createdAt).toBe(artifact.createdAt);
      expect(meta.updatedAt).toBe(artifact.updatedAt);
    });
  });
});
