/**
 * @phozart/workspace — Placement Model
 */
import { placementId } from './types.js';
export { placementId };
let counter = 0;
function generateId() {
    return `plc_${Date.now()}_${++counter}`;
}
export function createPlacement(input) {
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
//# sourceMappingURL=placement.js.map