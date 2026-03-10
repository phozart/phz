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
export type JoinType = 'inner' | 'left' | 'right' | 'full' | 'none';
export interface SourceJoinKey {
    leftField: string;
    rightField: string;
}
export interface SourceRelationship {
    id: string;
    leftSourceId: string;
    rightSourceId: string;
    joinType: JoinType;
    joinKeys: SourceJoinKey[];
}
/**
 * Resolves the effective join type for filter propagation from one source
 * to another. Returns 'none' if no relationship exists.
 */
export declare function resolveEffectiveJoin(relationships: SourceRelationship[], fromSourceId: string, toSourceId: string): JoinType;
/**
 * Flips a join type for the reverse direction.
 * left ↔ right, inner/full/none stay the same.
 */
export declare function flipJoinType(joinType: JoinType): JoinType;
/**
 * Checks whether filter propagation is allowed from `fromSourceId`
 * to `toSourceId` given the defined relationships.
 */
export declare function isJoinPropagationAllowed(relationships: SourceRelationship[], fromSourceId: string, toSourceId: string): boolean;
/**
 * Checks whether the join type allows forward (left→right) propagation.
 */
export declare function isForwardPropagationAllowed(joinType: JoinType): boolean;
/**
 * Checks whether the join type allows reverse (right→left) propagation.
 */
export declare function isReversePropagationAllowed(joinType: JoinType): boolean;
/**
 * Finds all sources reachable via filter propagation from a given source.
 * Uses BFS to traverse the relationship graph, respecting join direction.
 *
 * Returns an array of reachable source IDs (excludes the starting source).
 */
export declare function findReachableSources(relationships: SourceRelationship[], fromSourceId: string, allSourceIds: string[]): string[];
/**
 * Retrieves the join keys for a specific pair of sources.
 * Returns empty array if no relationship exists.
 */
export declare function getJoinKeysForPair(relationships: SourceRelationship[], sourceA: string, sourceB: string): SourceJoinKey[];
//# sourceMappingURL=source-relationship.d.ts.map