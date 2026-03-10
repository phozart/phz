/**
 * @phozart/phz-workspace — Placement Model
 */
import type { PlacementId, ArtifactType } from './types.js';
import { placementId } from './types.js';
export { placementId };
export interface PlacementRecord {
    id: PlacementId;
    artifactType: ArtifactType;
    artifactId: string;
    target: string;
    config?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
export interface CreatePlacementInput {
    artifactType: ArtifactType;
    artifactId: string;
    target: string;
    config?: Record<string, unknown>;
}
export declare function createPlacement(input: CreatePlacementInput): PlacementRecord;
//# sourceMappingURL=placement.d.ts.map