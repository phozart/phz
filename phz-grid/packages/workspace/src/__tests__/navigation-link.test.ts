/**
 * Sprint V.1 — NavigationLink types + mapper
 *
 * Tests: NavigationSource, NavigationFilterMapping, resolveNavigationFilters,
 * circular detection.
 */

import { describe, it, expect } from 'vitest';
import {
  isNavigationLink,
  createNavigationLink,
  resolveNavigationFilters,
  detectCircularLinks,
  type NavigationLink,
  type NavigationSource,
  type NavigationFilterMapping,
} from '../navigation/navigation-link.js';

describe('NavigationLink (V.1)', () => {
  // ── Type guard ──
  describe('isNavigationLink', () => {
    it('returns true for a valid NavigationLink', () => {
      const link: NavigationLink = {
        id: 'nl-1',
        sourceArtifactId: 'dashboard-1',
        targetArtifactId: 'report-1',
        targetArtifactType: 'report',
        label: 'View Details',
        filterMappings: [],
      };
      expect(isNavigationLink(link)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isNavigationLink(null)).toBe(false);
      expect(isNavigationLink(undefined)).toBe(false);
    });

    it('returns false when required fields are missing', () => {
      expect(isNavigationLink({ id: 'x' })).toBe(false);
      expect(isNavigationLink({
        id: 'x', sourceArtifactId: 's',
      })).toBe(false);
    });
  });

  // ── Creation ──
  describe('createNavigationLink', () => {
    it('creates a link with defaults', () => {
      const link = createNavigationLink({
        sourceArtifactId: 'dash-1',
        targetArtifactId: 'report-1',
        targetArtifactType: 'report',
        label: 'Drill to Report',
      });
      expect(link.id).toBeTruthy();
      expect(link.filterMappings).toEqual([]);
      expect(link.openBehavior).toBe('same-panel');
    });

    it('preserves filter mappings', () => {
      const mappings: NavigationFilterMapping[] = [
        { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
      ];
      const link = createNavigationLink({
        sourceArtifactId: 'dash-1',
        targetArtifactId: 'report-1',
        targetArtifactType: 'report',
        label: 'Drill',
        filterMappings: mappings,
      });
      expect(link.filterMappings).toHaveLength(1);
      expect(link.filterMappings[0].sourceField).toBe('region');
    });
  });

  // ── Filter resolution ──
  describe('resolveNavigationFilters', () => {
    it('maps source values to target filters', () => {
      const mappings: NavigationFilterMapping[] = [
        { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
        { sourceField: 'year', targetFilterDefinitionId: 'fd-year', transform: 'passthrough' },
      ];
      const sourceValues: Record<string, unknown> = { region: 'US', year: 2025 };
      const result = resolveNavigationFilters(mappings, sourceValues);
      expect(result).toEqual({ 'fd-region': 'US', 'fd-year': 2025 });
    });

    it('skips mappings when source value is missing', () => {
      const mappings: NavigationFilterMapping[] = [
        { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
        { sourceField: 'missing', targetFilterDefinitionId: 'fd-x', transform: 'passthrough' },
      ];
      const sourceValues = { region: 'EU' };
      const result = resolveNavigationFilters(mappings, sourceValues);
      expect(result).toEqual({ 'fd-region': 'EU' });
    });

    it('handles empty mappings', () => {
      expect(resolveNavigationFilters([], {})).toEqual({});
    });
  });

  // ── Circular detection ──
  describe('detectCircularLinks', () => {
    it('returns false for acyclic links', () => {
      const links: NavigationLink[] = [
        createNavigationLink({ sourceArtifactId: 'A', targetArtifactId: 'B', targetArtifactType: 'report', label: 'A->B' }),
        createNavigationLink({ sourceArtifactId: 'B', targetArtifactId: 'C', targetArtifactType: 'report', label: 'B->C' }),
      ];
      expect(detectCircularLinks(links)).toEqual([]);
    });

    it('detects simple cycle', () => {
      const links: NavigationLink[] = [
        createNavigationLink({ sourceArtifactId: 'A', targetArtifactId: 'B', targetArtifactType: 'report', label: 'A->B' }),
        createNavigationLink({ sourceArtifactId: 'B', targetArtifactId: 'A', targetArtifactType: 'dashboard', label: 'B->A' }),
      ];
      const cycles = detectCircularLinks(links);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('detects multi-hop cycle', () => {
      const links: NavigationLink[] = [
        createNavigationLink({ sourceArtifactId: 'A', targetArtifactId: 'B', targetArtifactType: 'report', label: 'A->B' }),
        createNavigationLink({ sourceArtifactId: 'B', targetArtifactId: 'C', targetArtifactType: 'report', label: 'B->C' }),
        createNavigationLink({ sourceArtifactId: 'C', targetArtifactId: 'A', targetArtifactType: 'dashboard', label: 'C->A' }),
      ];
      const cycles = detectCircularLinks(links);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('handles empty links', () => {
      expect(detectCircularLinks([])).toEqual([]);
    });

    it('handles self-links', () => {
      const links: NavigationLink[] = [
        createNavigationLink({ sourceArtifactId: 'A', targetArtifactId: 'A', targetArtifactType: 'report', label: 'self' }),
      ];
      const cycles = detectCircularLinks(links);
      expect(cycles.length).toBeGreaterThan(0);
    });
  });
});
