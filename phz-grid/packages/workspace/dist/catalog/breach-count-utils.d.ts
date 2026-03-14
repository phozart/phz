/**
 * @phozart/workspace — Breach Count Utils (L.7)
 *
 * Computes per-artifact breach counts and sorts artifacts by breach severity.
 */
import type { ArtifactMeta, BreachRecord } from '../types.js';
export declare function computeBreachCounts(_artifacts: ArtifactMeta[], breaches: BreachRecord[]): Map<string, number>;
export declare function sortByBreachCount(artifacts: ArtifactMeta[], counts: Map<string, number>): ArtifactMeta[];
//# sourceMappingURL=breach-count-utils.d.ts.map