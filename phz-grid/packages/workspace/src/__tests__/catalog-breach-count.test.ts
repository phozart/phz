/**
 * Breach Count in Catalog (L.7) — Tests
 */
import { describe, it, expect } from 'vitest';
import { computeBreachCounts, sortByBreachCount } from '../catalog/breach-count-utils.js';
import type { ArtifactMeta, BreachRecord, BreachId, AlertRuleId } from '../types.js';

function makeArtifact(id: string, name: string): ArtifactMeta {
  return { id, type: 'report', name, createdAt: 0, updatedAt: 0 };
}

function makeBreach(id: string, artifactId: string, status: BreachRecord['status'] = 'active'): BreachRecord {
  return {
    id: id as BreachId,
    ruleId: 'rule-1' as AlertRuleId,
    artifactId,
    status,
    detectedAt: Date.now(),
    currentValue: 100,
    thresholdValue: 50,
    severity: 'warning',
    message: 'threshold exceeded',
  };
}

describe('Breach Count Utils (L.7)', () => {
  describe('computeBreachCounts', () => {
    it('returns empty map for no breaches', () => {
      const counts = computeBreachCounts(
        [makeArtifact('a1', 'Report 1')],
        [],
      );
      expect(counts.size).toBe(0);
    });

    it('counts active breaches per artifact', () => {
      const artifacts = [makeArtifact('a1', 'R1'), makeArtifact('a2', 'R2')];
      const breaches = [
        makeBreach('b1', 'a1', 'active'),
        makeBreach('b2', 'a1', 'active'),
        makeBreach('b3', 'a2', 'active'),
        makeBreach('b4', 'a1', 'resolved'), // resolved — should not count
      ];
      const counts = computeBreachCounts(artifacts, breaches);
      expect(counts.get('a1')).toBe(2);
      expect(counts.get('a2')).toBe(1);
    });

    it('excludes resolved and acknowledged breaches', () => {
      const breaches = [
        makeBreach('b1', 'a1', 'resolved'),
        makeBreach('b2', 'a1', 'acknowledged'),
      ];
      const counts = computeBreachCounts([makeArtifact('a1', 'R1')], breaches);
      expect(counts.size).toBe(0);
    });
  });

  describe('sortByBreachCount', () => {
    it('sorts artifacts by breach count descending', () => {
      const artifacts = [
        makeArtifact('a1', 'Low'),
        makeArtifact('a2', 'High'),
        makeArtifact('a3', 'Medium'),
      ];
      const counts = new Map([['a1', 1], ['a2', 5], ['a3', 3]]);
      const sorted = sortByBreachCount(artifacts, counts);
      expect(sorted.map(a => a.id)).toEqual(['a2', 'a3', 'a1']);
    });

    it('puts artifacts with no breaches at the end', () => {
      const artifacts = [
        makeArtifact('a1', 'No breaches'),
        makeArtifact('a2', 'Has breaches'),
      ];
      const counts = new Map([['a2', 2]]);
      const sorted = sortByBreachCount(artifacts, counts);
      expect(sorted[0].id).toBe('a2');
      expect(sorted[1].id).toBe('a1');
    });

    it('returns empty array for empty input', () => {
      expect(sortByBreachCount([], new Map())).toEqual([]);
    });

    it('is immutable — does not mutate the original array', () => {
      const artifacts = [makeArtifact('a1', 'A'), makeArtifact('a2', 'B')];
      const original = [...artifacts];
      sortByBreachCount(artifacts, new Map([['a2', 5]]));
      expect(artifacts).toEqual(original);
    });
  });
});
