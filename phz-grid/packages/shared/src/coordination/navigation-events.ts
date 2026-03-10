/**
 * @phozart/phz-shared — Navigation Events (A-1.05)
 *
 * Types and helpers for cross-artifact navigation events.
 * Bridges navigation links with the interaction bus.
 *
 * Extracted from workspace/navigation/navigation-event.ts and
 * workspace/navigation/navigation-link.ts.
 */

import type { WidgetEvent, InteractionBus } from './interaction-bus.js';

// ========================================================================
// NavigationFilterMapping
// ========================================================================

export interface NavigationFilterMapping {
  sourceField: string;
  targetFilterDefinitionId: string;
  transform: 'passthrough' | 'lookup' | 'expression';
  transformExpr?: string;
}

// ========================================================================
// NavigationFilter (carried in navigate event)
// ========================================================================

export interface NavigationFilter {
  filterDefinitionId: string;
  value: unknown;
}

// ========================================================================
// NavigationEvent — typed navigate event
// ========================================================================

export interface NavigationEvent {
  type: 'navigate';
  targetArtifactId: string;
  filters: NavigationFilter[];
}

// ========================================================================
// Resolve navigation filter mappings
// ========================================================================

export function resolveNavigationFilters(
  mappings: NavigationFilterMapping[],
  sourceValues: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    const value = sourceValues[mapping.sourceField];
    if (value === undefined) continue;
    result[mapping.targetFilterDefinitionId] = value;
  }

  return result;
}

// ========================================================================
// Build navigate event from filter mappings + source values
// ========================================================================

export function buildNavigationEvent(
  targetArtifactId: string,
  filterMappings: NavigationFilterMapping[],
  sourceValues: Record<string, unknown>,
): NavigationEvent {
  const resolved = resolveNavigationFilters(filterMappings, sourceValues);

  const filters: NavigationFilter[] = Object.entries(resolved).map(
    ([filterDefinitionId, value]) => ({ filterDefinitionId, value }),
  );

  return {
    type: 'navigate',
    targetArtifactId,
    filters,
  };
}

// ========================================================================
// Emit navigation event on an InteractionBus
// ========================================================================

export function emitNavigationEvent(
  bus: InteractionBus,
  targetArtifactId: string,
  filterMappings: NavigationFilterMapping[],
  sourceValues: Record<string, unknown>,
): void {
  const event = buildNavigationEvent(targetArtifactId, filterMappings, sourceValues);
  bus.emit(event as Extract<WidgetEvent, { type: 'navigate' }>);
}
