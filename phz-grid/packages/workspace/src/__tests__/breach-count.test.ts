/**
 * Catalog Breach Count (L.7) — Tests
 *
 * Pure utility functions for showing breach counts per artifact in the catalog.
 */
import { describe, it, expect } from 'vitest';
import {
  countBreachesByArtifact,
  sortByBreachCount,
  getBreachBadge,
} from '../catalog/breach-count.js';
import type { BreachRecord, BreachId, AlertRuleId } from '../types.js';

function makeBreach(artifactId: string, severity: BreachRecord['severity'] = 'warning'): BreachRecord {
  return {
    id: `b-${artifactId}-${Math.random()}` as BreachId,
    ruleId: 'r1' as AlertRuleId,
    artifactId,
    status: 'active',
    detectedAt: Date.now(),
    currentValue: 100,
    thresholdValue: 50,
    severity,
    message: 'test breach',
  };
}

describe('countBreachesByArtifact', () => {
  it('returns empty map for no breaches', () => {
    const result = countBreachesByArtifact([]);
    expect(result.size).toBe(0);
  });

  it('counts breaches per artifact', () => {
    const breaches = [
      makeBreach('a1'),
      makeBreach('a1'),
      makeBreach('a2'),
    ];
    const result = countBreachesByArtifact(breaches);
    expect(result.get('a1')?.total).toBe(2);
    expect(result.get('a2')?.total).toBe(1);
  });

  it('tracks highest severity per artifact', () => {
    const breaches = [
      makeBreach('a1', 'info'),
      makeBreach('a1', 'critical'),
      makeBreach('a1', 'warning'),
    ];
    const result = countBreachesByArtifact(breaches);
    expect(result.get('a1')?.highestSeverity).toBe('critical');
  });

  it('counts by severity', () => {
    const breaches = [
      makeBreach('a1', 'info'),
      makeBreach('a1', 'warning'),
      makeBreach('a1', 'warning'),
      makeBreach('a1', 'critical'),
    ];
    const result = countBreachesByArtifact(breaches);
    const counts = result.get('a1')!;
    expect(counts.bySeverity.info).toBe(1);
    expect(counts.bySeverity.warning).toBe(2);
    expect(counts.bySeverity.critical).toBe(1);
  });
});

describe('sortByBreachCount', () => {
  it('sorts artifact IDs by descending breach count', () => {
    const breaches = [
      makeBreach('a1'),
      makeBreach('a2'),
      makeBreach('a2'),
      makeBreach('a3'),
      makeBreach('a3'),
      makeBreach('a3'),
    ];
    const counts = countBreachesByArtifact(breaches);
    const sorted = sortByBreachCount(['a1', 'a2', 'a3'], counts);
    expect(sorted).toEqual(['a3', 'a2', 'a1']);
  });

  it('preserves order for artifacts with no breaches', () => {
    const sorted = sortByBreachCount(['a1', 'a2'], new Map());
    expect(sorted).toEqual(['a1', 'a2']);
  });

  it('sorts breached artifacts before non-breached', () => {
    const breaches = [makeBreach('a2')];
    const counts = countBreachesByArtifact(breaches);
    const sorted = sortByBreachCount(['a1', 'a2', 'a3'], counts);
    expect(sorted[0]).toBe('a2');
  });
});

describe('getBreachBadge', () => {
  it('returns null for no breaches', () => {
    expect(getBreachBadge(new Map(), 'a1')).toBeNull();
  });

  it('returns badge with count and severity', () => {
    const breaches = [makeBreach('a1', 'critical'), makeBreach('a1', 'warning')];
    const counts = countBreachesByArtifact(breaches);
    const badge = getBreachBadge(counts, 'a1');
    expect(badge).not.toBeNull();
    expect(badge!.count).toBe(2);
    expect(badge!.severity).toBe('critical');
    expect(badge!.label).toContain('2');
  });
});
