/**
 * @phozart/workspace — Breach Count Utils (L.7)
 *
 * Computes per-artifact breach counts and sorts artifacts by breach severity.
 */

import type { ArtifactMeta, BreachRecord } from '../types.js';

export function computeBreachCounts(
  _artifacts: ArtifactMeta[],
  breaches: BreachRecord[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const breach of breaches) {
    if (breach.status !== 'active') continue;
    counts.set(breach.artifactId, (counts.get(breach.artifactId) ?? 0) + 1);
  }
  return counts;
}

export function sortByBreachCount(
  artifacts: ArtifactMeta[],
  counts: Map<string, number>,
): ArtifactMeta[] {
  return [...artifacts].sort((a, b) => {
    const ca = counts.get(a.id) ?? 0;
    const cb = counts.get(b.id) ?? 0;
    return cb - ca;
  });
}
