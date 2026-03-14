/**
 * @phozart/shared — Navigation Events (A-1.05)
 *
 * Types and helpers for cross-artifact navigation events.
 * Bridges navigation links with the interaction bus.
 *
 * Extracted from workspace/navigation/navigation-event.ts and
 * workspace/navigation/navigation-link.ts.
 */
// ========================================================================
// Resolve navigation filter mappings
// ========================================================================
export function resolveNavigationFilters(mappings, sourceValues) {
    const result = {};
    for (const mapping of mappings) {
        const value = sourceValues[mapping.sourceField];
        if (value === undefined)
            continue;
        result[mapping.targetFilterDefinitionId] = value;
    }
    return result;
}
// ========================================================================
// Build navigate event from filter mappings + source values
// ========================================================================
export function buildNavigationEvent(targetArtifactId, filterMappings, sourceValues) {
    const resolved = resolveNavigationFilters(filterMappings, sourceValues);
    const filters = Object.entries(resolved).map(([filterDefinitionId, value]) => ({ filterDefinitionId, value }));
    return {
        type: 'navigate',
        targetArtifactId,
        filters,
    };
}
// ========================================================================
// Emit navigation event on an InteractionBus
// ========================================================================
export function emitNavigationEvent(bus, targetArtifactId, filterMappings, sourceValues) {
    const event = buildNavigationEvent(targetArtifactId, filterMappings, sourceValues);
    bus.emit(event);
}
//# sourceMappingURL=navigation-events.js.map