/**
 * @phozart/phz-shared — Source Relationship Types
 *
 * Defines join semantics between data sources in a multi-source dashboard.
 * These operate at the filter propagation level, NOT SQL join level.
 * DataAdapter SPI stays unchanged — it still receives single-source queries.
 *
 * JoinType controls how filters propagate between sources:
 *  - inner: bidirectional propagation, non-matching rows excluded
 *  - left:  A→B propagation only, A preserved
 *  - right: B→A propagation only, B preserved
 *  - full:  bidirectional propagation, both preserved
 *  - none:  no auto-propagation, sources independent
 */

// ========================================================================
// Types
// ========================================================================

export type JoinType = 'inner' | 'left' | 'right' | 'full' | 'none';

export interface SourceJoinKey {
  leftField: string;
  rightField: string;
}

export interface SourceRelationship {
  id: string;
  leftSourceId: string;   // References DashboardSourceEntry.slotId
  rightSourceId: string;
  joinType: JoinType;
  joinKeys: SourceJoinKey[];
}

// ========================================================================
// Join resolution
// ========================================================================

/**
 * Resolves the effective join type for filter propagation from one source
 * to another. Returns 'none' if no relationship exists.
 */
export function resolveEffectiveJoin(
  relationships: SourceRelationship[],
  fromSourceId: string,
  toSourceId: string,
): JoinType {
  const direct = relationships.find(
    r =>
      (r.leftSourceId === fromSourceId && r.rightSourceId === toSourceId) ||
      (r.leftSourceId === toSourceId && r.rightSourceId === fromSourceId),
  );

  if (!direct) return 'none';

  // If the relationship is defined in the other direction, flip semantics
  if (direct.leftSourceId === fromSourceId) {
    return direct.joinType;
  }
  // Relationship is reversed — flip left/right semantics
  return flipJoinType(direct.joinType);
}

/**
 * Flips a join type for the reverse direction.
 * left ↔ right, inner/full/none stay the same.
 */
export function flipJoinType(joinType: JoinType): JoinType {
  if (joinType === 'left') return 'right';
  if (joinType === 'right') return 'left';
  return joinType; // inner, full, none are symmetric
}

/**
 * Checks whether filter propagation is allowed from `fromSourceId`
 * to `toSourceId` given the defined relationships.
 */
export function isJoinPropagationAllowed(
  relationships: SourceRelationship[],
  fromSourceId: string,
  toSourceId: string,
): boolean {
  const joinType = resolveEffectiveJoin(relationships, fromSourceId, toSourceId);
  return isForwardPropagationAllowed(joinType);
}

/**
 * Checks whether the join type allows forward (left→right) propagation.
 */
export function isForwardPropagationAllowed(joinType: JoinType): boolean {
  return joinType === 'inner' || joinType === 'left' || joinType === 'full';
}

/**
 * Checks whether the join type allows reverse (right→left) propagation.
 */
export function isReversePropagationAllowed(joinType: JoinType): boolean {
  return joinType === 'inner' || joinType === 'right' || joinType === 'full';
}

// ========================================================================
// Chain traversal
// ========================================================================

/**
 * Finds all sources reachable via filter propagation from a given source.
 * Uses BFS to traverse the relationship graph, respecting join direction.
 *
 * Returns an array of reachable source IDs (excludes the starting source).
 */
export function findReachableSources(
  relationships: SourceRelationship[],
  fromSourceId: string,
  allSourceIds: string[],
): string[] {
  const visited = new Set<string>([fromSourceId]);
  const queue = [fromSourceId];
  const reachable: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const targetId of allSourceIds) {
      if (visited.has(targetId)) continue;
      if (isJoinPropagationAllowed(relationships, current, targetId)) {
        visited.add(targetId);
        reachable.push(targetId);
        queue.push(targetId);
      }
    }
  }

  return reachable;
}

/**
 * Retrieves the join keys for a specific pair of sources.
 * Returns empty array if no relationship exists.
 */
export function getJoinKeysForPair(
  relationships: SourceRelationship[],
  sourceA: string,
  sourceB: string,
): SourceJoinKey[] {
  const rel = relationships.find(
    r =>
      (r.leftSourceId === sourceA && r.rightSourceId === sourceB) ||
      (r.leftSourceId === sourceB && r.rightSourceId === sourceA),
  );

  if (!rel) return [];

  // If the relationship is defined in the reverse order, flip the keys
  if (rel.leftSourceId === sourceA) {
    return rel.joinKeys;
  }
  return rel.joinKeys.map(k => ({ leftField: k.rightField, rightField: k.leftField }));
}
