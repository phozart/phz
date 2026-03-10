/**
 * @phozart/phz-workspace — NavigationEvent emission (V.3)
 *
 * Bridges NavigationLink with the InteractionBus 'navigate' event.
 * Resolves filter mappings and emits a typed navigate event.
 */
import { resolveNavigationFilters } from './navigation-link.js';
// ========================================================================
// Build navigate event from a NavigationLink + source values
// ========================================================================
export function buildNavigationEvent(link, sourceValues) {
    const resolved = resolveNavigationFilters(link.filterMappings, sourceValues);
    const filters = Object.entries(resolved).map(([filterDefinitionId, value]) => ({ filterDefinitionId, value }));
    return {
        type: 'navigate',
        targetArtifactId: link.targetArtifactId,
        filters,
    };
}
// ========================================================================
// Emit navigation event on the InteractionBus
// ========================================================================
export function emitNavigationEvent(bus, link, sourceValues) {
    const event = buildNavigationEvent(link, sourceValues);
    bus.emit(event);
}
//# sourceMappingURL=navigation-event.js.map