import { describe, it, expect, vi } from 'vitest';
import type { QueryCoordinator, QueryCoordinatorConfig } from '../data-adapter.js';
import { defaultQueryCoordinatorConfig, isQueryCoordinatorConfig } from '../data-adapter.js';

describe('QueryCoordinator types', () => {
  describe('QueryCoordinatorConfig', () => {
    it('has sensible defaults', () => {
      const config = defaultQueryCoordinatorConfig();
      expect(config.maxConcurrent).toBe(4);
      expect(config.batchWindowMs).toBe(50);
    });

    it('allows partial overrides', () => {
      const config = defaultQueryCoordinatorConfig({ maxConcurrent: 8 });
      expect(config.maxConcurrent).toBe(8);
      expect(config.batchWindowMs).toBe(50);
    });
  });

  describe('isQueryCoordinatorConfig', () => {
    it('returns true for valid config', () => {
      const config: QueryCoordinatorConfig = { maxConcurrent: 4, batchWindowMs: 50 };
      expect(isQueryCoordinatorConfig(config)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isQueryCoordinatorConfig(null)).toBe(false);
      expect(isQueryCoordinatorConfig(undefined)).toBe(false);
    });

    it('returns false when fields are wrong type', () => {
      expect(isQueryCoordinatorConfig({ maxConcurrent: 'four', batchWindowMs: 50 })).toBe(false);
    });

    it('returns false when fields are missing', () => {
      expect(isQueryCoordinatorConfig({ maxConcurrent: 4 })).toBe(false);
      expect(isQueryCoordinatorConfig({})).toBe(false);
    });
  });

  describe('QueryCoordinator interface', () => {
    it('satisfies the interface shape with mock functions', async () => {
      const mockResult = { data: [{ id: 1 }], meta: {} };
      const coordinator: QueryCoordinator = {
        submit: vi.fn().mockResolvedValue(mockResult),
        flush: vi.fn().mockResolvedValue(undefined),
        cancel: vi.fn(),
      };

      const result = await coordinator.submit('widget-1', { fields: ['revenue'] });
      expect(result).toBe(mockResult);
      expect(coordinator.submit).toHaveBeenCalledWith('widget-1', { fields: ['revenue'] });

      await coordinator.flush();
      expect(coordinator.flush).toHaveBeenCalled();

      coordinator.cancel('widget-1');
      expect(coordinator.cancel).toHaveBeenCalledWith('widget-1');
    });
  });
});
