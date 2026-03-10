import { describe, it, expect, vi } from 'vitest';
import { createInteractionBus, type WidgetEvent, type InteractionBus } from '../interaction-bus.js';

describe('InteractionBus', () => {
  let bus: InteractionBus;

  beforeEach(() => {
    bus = createInteractionBus();
  });

  describe('emit and on', () => {
    it('delivers event to matching handler', () => {
      const handler = vi.fn();
      bus.on('drill-through', handler);

      const event: WidgetEvent = {
        type: 'drill-through',
        sourceWidgetId: 'w1',
        field: 'region',
        value: 'US',
      };
      bus.emit(event);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('does not deliver to non-matching handler', () => {
      const handler = vi.fn();
      bus.on('cross-filter', handler);

      bus.emit({
        type: 'drill-through',
        sourceWidgetId: 'w1',
        field: 'region',
        value: 'US',
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple handlers for same event type', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on('cross-filter', h1);
      bus.on('cross-filter', h2);

      bus.emit({ type: 'cross-filter', sourceWidgetId: 'w1', filters: [{ field: 'x' }] });

      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it('supports multiple event types independently', () => {
      const drillHandler = vi.fn();
      const filterHandler = vi.fn();
      bus.on('drill-through', drillHandler);
      bus.on('cross-filter', filterHandler);

      bus.emit({ type: 'drill-through', sourceWidgetId: 'w1', field: 'x', value: 1 });

      expect(drillHandler).toHaveBeenCalledOnce();
      expect(filterHandler).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('on() returns unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.on('drill-through', handler);

      bus.emit({ type: 'drill-through', sourceWidgetId: 'w1', field: 'x', value: 1 });
      expect(handler).toHaveBeenCalledOnce();

      unsub();

      bus.emit({ type: 'drill-through', sourceWidgetId: 'w1', field: 'x', value: 2 });
      expect(handler).toHaveBeenCalledOnce(); // no second call
    });

    it('unsubscribing one handler does not affect others', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const unsub1 = bus.on('selection-change', h1);
      bus.on('selection-change', h2);

      unsub1();

      bus.emit({ type: 'selection-change', sourceWidgetId: 'w1', selectedRows: [] });

      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledOnce();
    });
  });

  describe('off', () => {
    it('removes a handler via off()', () => {
      const handler = vi.fn();
      bus.on('navigate', handler);
      bus.off('navigate', handler);

      bus.emit({ type: 'navigate', targetArtifactId: 'a1' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('off() is idempotent for unknown handlers', () => {
      const handler = vi.fn();
      // Should not throw even if handler was never registered
      expect(() => bus.off('navigate', handler)).not.toThrow();
    });
  });

  describe('all event types', () => {
    it('handles drill-through event', () => {
      const handler = vi.fn();
      bus.on('drill-through', handler);
      bus.emit({ type: 'drill-through', sourceWidgetId: 'w1', field: 'region', value: 'EMEA' });
      expect(handler).toHaveBeenCalledOnce();
    });

    it('handles cross-filter event', () => {
      const handler = vi.fn();
      bus.on('cross-filter', handler);
      bus.emit({ type: 'cross-filter', sourceWidgetId: 'w1', filters: [] });
      expect(handler).toHaveBeenCalledOnce();
    });

    it('handles clear-cross-filter event', () => {
      const handler = vi.fn();
      bus.on('clear-cross-filter', handler);
      bus.emit({ type: 'clear-cross-filter', sourceWidgetId: 'w1' });
      expect(handler).toHaveBeenCalledOnce();
    });

    it('handles selection-change event', () => {
      const handler = vi.fn();
      bus.on('selection-change', handler);
      bus.emit({ type: 'selection-change', sourceWidgetId: 'w1', selectedRows: [{ id: 1 }] });
      expect(handler).toHaveBeenCalledOnce();
    });

    it('handles time-range-change event', () => {
      const handler = vi.fn();
      bus.on('time-range-change', handler);
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');
      bus.emit({ type: 'time-range-change', sourceWidgetId: 'w1', from, to });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ from, to }),
      );
    });

    it('handles navigate event', () => {
      const handler = vi.fn();
      bus.on('navigate', handler);
      bus.emit({ type: 'navigate', targetArtifactId: 'dashboard-1', filters: [{ field: 'status', value: 'active' }] });
      expect(handler).toHaveBeenCalledOnce();
    });

    it('handles export-request event', () => {
      const handler = vi.fn();
      bus.on('export-request', handler);
      bus.emit({ type: 'export-request', sourceWidgetId: 'w1', format: 'csv' });
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('no handlers registered', () => {
    it('emit is a no-op when no handlers exist for event type', () => {
      // Should not throw
      expect(() => {
        bus.emit({ type: 'drill-through', sourceWidgetId: 'w1', field: 'x', value: 1 });
      }).not.toThrow();
    });
  });
});
