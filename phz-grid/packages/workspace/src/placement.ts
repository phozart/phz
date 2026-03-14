/**
 * @phozart/workspace — Placement Model
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

let counter = 0;
function generateId(): string {
  return `plc_${Date.now()}_${++counter}`;
}

export function createPlacement(input: CreatePlacementInput): PlacementRecord {
  const now = Date.now();
  return {
    id: placementId(generateId()),
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    target: input.target,
    config: input.config,
    createdAt: now,
    updatedAt: now,
  };
}
