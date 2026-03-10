/**
 * @phozart/phz-workspace — NavigationEvent emission (V.3)
 *
 * Bridges NavigationLink with the InteractionBus 'navigate' event.
 * Resolves filter mappings and emits a typed navigate event.
 */
import type { InteractionBus, WidgetEvent } from '../interaction-bus.js';
import type { NavigationLink } from './navigation-link.js';
export interface NavigationFilter {
    filterDefinitionId: string;
    value: unknown;
}
export declare function buildNavigationEvent(link: NavigationLink, sourceValues: Record<string, unknown>): Extract<WidgetEvent, {
    type: 'navigate';
}> & {
    filters: NavigationFilter[];
};
export declare function emitNavigationEvent(bus: InteractionBus, link: NavigationLink, sourceValues: Record<string, unknown>): void;
//# sourceMappingURL=navigation-event.d.ts.map