import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncedFilterDispatch } from '../filters/filter-context.js';

describe('Filter Performance (O.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createDebouncedFilterDispatch', () => {
    it('debounces rapid calls with 150ms window', () => {
      const handler = vi.fn();
      const debounced = createDebouncedFilterDispatch(handler, 150);

      debounced('a');
      debounced('b');
      debounced('c');

      expect(handler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('c'); // last value wins
    });

    it('fires immediately if no rapid follow-up', () => {
      const handler = vi.fn();
      const debounced = createDebouncedFilterDispatch(handler, 150);

      debounced('a');
      vi.advanceTimersByTime(150);
      expect(handler).toHaveBeenCalledTimes(1);

      debounced('b');
      vi.advanceTimersByTime(150);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('cancels pending dispatch', () => {
      const handler = vi.fn();
      const debounced = createDebouncedFilterDispatch(handler, 150);

      debounced('a');
      debounced.cancel();
      vi.advanceTimersByTime(200);

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports AbortController integration', () => {
      const handler = vi.fn();
      const debounced = createDebouncedFilterDispatch(handler, 150);

      const controller = new AbortController();
      debounced('a', controller.signal);

      controller.abort();
      vi.advanceTimersByTime(200);

      expect(handler).not.toHaveBeenCalled();
    });

    it('uses default 150ms debounce interval', () => {
      const handler = vi.fn();
      const debounced = createDebouncedFilterDispatch(handler);

      debounced('a');
      vi.advanceTimersByTime(100);
      expect(handler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
