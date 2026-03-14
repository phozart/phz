/**
 * @phozart/workspace — NavigationEvent emission (V.3)
 *
 * Bridges NavigationLink with the InteractionBus 'navigate' event.
 * Resolves filter mappings and emits a typed navigate event.
 */

import type { InteractionBus, WidgetEvent } from '../interaction-bus.js';
import type { NavigationLink } from './navigation-link.js';
import { resolveNavigationFilters } from './navigation-link.js';

// ========================================================================
// NavigationFilter (carried in navigate event)
// ========================================================================

export interface NavigationFilter {
  filterDefinitionId: string;
  value: unknown;
}

// ========================================================================
// Build navigate event from a NavigationLink + source values
// ========================================================================

export function buildNavigationEvent(
  link: NavigationLink,
  sourceValues: Record<string, unknown>,
): Extract<WidgetEvent, { type: 'navigate' }> & { filters: NavigationFilter[] } {
  const resolved = resolveNavigationFilters(link.filterMappings, sourceValues);

  const filters: NavigationFilter[] = Object.entries(resolved).map(
    ([filterDefinitionId, value]) => ({ filterDefinitionId, value }),
  );

  return {
    type: 'navigate',
    targetArtifactId: link.targetArtifactId,
    filters,
  };
}

// ========================================================================
// Emit navigation event on the InteractionBus
// ========================================================================

export function emitNavigationEvent(
  bus: InteractionBus,
  link: NavigationLink,
  sourceValues: Record<string, unknown>,
): void {
  const event = buildNavigationEvent(link, sourceValues);
  bus.emit(event);
}
