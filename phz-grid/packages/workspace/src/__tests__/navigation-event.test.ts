/**
 * Sprint V.3 — Consumer-side NavigationEvent emission
 *
 * Tests: InteractionBus navigate event, resolving filters for navigation,
 * building navigation event from NavigationLink.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildNavigationEvent,
  emitNavigationEvent,
} from '../navigation/navigation-event.js';
import { createInteractionBus } from '../interaction-bus.js';
import type { NavigationLink, NavigationFilterMapping } from '../navigation/navigation-link.js';

function makeLink(overrides?: Partial<NavigationLink>): NavigationLink {
  return {
    id: 'nl-1',
    sourceArtifactId: 'dash-1',
    targetArtifactId: 'report-1',
    targetArtifactType: 'report',
    label: 'View Details',
    filterMappings: [],
    ...overrides,
  };
}

describe('NavigationEvent (V.3)', () => {
  describe('buildNavigationEvent', () => {
    it('builds navigate event from link without filters', () => {
      const link = makeLink();
      const event = buildNavigationEvent(link, {});
      expect(event.type).toBe('navigate');
      expect(event.targetArtifactId).toBe('report-1');
      expect(event.filters).toEqual([]);
    });

    it('builds navigate event with resolved filter mappings', () => {
      const link = makeLink({
        filterMappings: [
          { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' },
        ],
      });
      const sourceValues = { region: 'US' };
      const event = buildNavigationEvent(link, sourceValues);
      expect(event.type).toBe('navigate');
      expect(event.filters).toEqual([
        { filterDefinitionId: 'fd-region', value: 'US' },
      ]);
    });

    it('skips filter mappings with missing source values', () => {
      const link = makeLink({
        filterMappings: [
          { sourceField: 'missing', targetFilterDefinitionId: 'fd-x', transform: 'passthrough' },
        ],
      });
      const event = buildNavigationEvent(link, {});
      expect(event.filters).toEqual([]);
    });
  });

  describe('emitNavigationEvent', () => {
    it('emits a navigate event on the interaction bus', () => {
      const bus = createInteractionBus();
      const handler = vi.fn();
      bus.on('navigate', handler);

      const link = makeLink();
      emitNavigationEvent(bus, link, { region: 'US' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'navigate',
        targetArtifactId: 'report-1',
      }));
    });

    it('passes resolved filters through', () => {
      const bus = createInteractionBus();
      const handler = vi.fn();
      bus.on('navigate', handler);

      const link = makeLink({
        filterMappings: [
          { sourceField: 'year', targetFilterDefinitionId: 'fd-year', transform: 'passthrough' },
        ],
      });
      emitNavigationEvent(bus, link, { year: 2025 });

      const emittedEvent = handler.mock.calls[0][0];
      expect(emittedEvent.filters).toEqual([
        { filterDefinitionId: 'fd-year', value: 2025 },
      ]);
    });
  });
});
