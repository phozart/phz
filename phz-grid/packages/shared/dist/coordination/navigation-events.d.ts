/**
 * @phozart/phz-shared — Navigation Events (A-1.05)
 *
 * Types and helpers for cross-artifact navigation events.
 * Bridges navigation links with the interaction bus.
 *
 * Extracted from workspace/navigation/navigation-event.ts and
 * workspace/navigation/navigation-link.ts.
 */
import type { InteractionBus } from './interaction-bus.js';
export interface NavigationFilterMapping {
    sourceField: string;
    targetFilterDefinitionId: string;
    transform: 'passthrough' | 'lookup' | 'expression';
    transformExpr?: string;
}
export interface NavigationFilter {
    filterDefinitionId: string;
    value: unknown;
}
export interface NavigationEvent {
    type: 'navigate';
    targetArtifactId: string;
    filters: NavigationFilter[];
}
export declare function resolveNavigationFilters(mappings: NavigationFilterMapping[], sourceValues: Record<string, unknown>): Record<string, unknown>;
export declare function buildNavigationEvent(targetArtifactId: string, filterMappings: NavigationFilterMapping[], sourceValues: Record<string, unknown>): NavigationEvent;
export declare function emitNavigationEvent(bus: InteractionBus, targetArtifactId: string, filterMappings: NavigationFilterMapping[], sourceValues: Record<string, unknown>): void;
//# sourceMappingURL=navigation-events.d.ts.map