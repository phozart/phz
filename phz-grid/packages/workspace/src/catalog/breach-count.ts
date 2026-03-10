/**
 * Catalog Breach Count (L.7)
 *
 * Pure utility functions for computing and displaying breach counts
 * per artifact in the catalog browser.
 */

import type { BreachRecord } from '../types.js';

const SEVERITY_ORDER: Record<BreachRecord['severity'], number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

export interface ArtifactBreachCounts {
  total: number;
  highestSeverity: BreachRecord['severity'];
  bySeverity: { info: number; warning: number; critical: number };
}

export interface BreachBadge {
  count: number;
  severity: BreachRecord['severity'];
  label: string;
}

export function countBreachesByArtifact(
  breaches: BreachRecord[],
): Map<string, ArtifactBreachCounts> {
  const result = new Map<string, ArtifactBreachCounts>();
  for (const b of breaches) {
    let entry = result.get(b.artifactId);
    if (!entry) {
      entry = { total: 0, highestSeverity: 'info', bySeverity: { info: 0, warning: 0, critical: 0 } };
      result.set(b.artifactId, entry);
    }
    entry.total++;
    entry.bySeverity[b.severity]++;
    if (SEVERITY_ORDER[b.severity] > SEVERITY_ORDER[entry.highestSeverity]) {
      entry.highestSeverity = b.severity;
    }
  }
  return result;
}

export function sortByBreachCount(
  artifactIds: string[],
  counts: Map<string, ArtifactBreachCounts>,
): string[] {
  return [...artifactIds].sort((a, b) => {
    const ca = counts.get(a)?.total ?? 0;
    const cb = counts.get(b)?.total ?? 0;
    return cb - ca;
  });
}

export function getBreachBadge(
  counts: Map<string, ArtifactBreachCounts>,
  artifactId: string,
): BreachBadge | null {
  const entry = counts.get(artifactId);
  if (!entry) return null;
  return {
    count: entry.total,
    severity: entry.highestSeverity,
    label: `${entry.total} breach${entry.total === 1 ? '' : 'es'}`,
  };
}
