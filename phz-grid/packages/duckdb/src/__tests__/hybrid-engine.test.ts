/**
 * @phozart/duckdb — Hybrid Engine Tests (WI 23)
 *
 * Tests auto-switching between JS row model and DuckDB SQL based on row count.
 */

import { describe, it, expect } from 'vitest';
import { HybridEngine, type HybridEngineConfig } from '../hybrid-engine.js';

describe('HybridEngine', () => {
  describe('shouldUseDuckDB', () => {
    it('returns false when row count is below default threshold (10000)', () => {
      const engine = new HybridEngine();
      expect(engine.shouldUseDuckDB(5000)).toBe(false);
    });

    it('returns true when row count is at default threshold (10000)', () => {
      const engine = new HybridEngine();
      expect(engine.shouldUseDuckDB(10000)).toBe(true);
    });

    it('returns true when row count exceeds default threshold', () => {
      const engine = new HybridEngine();
      expect(engine.shouldUseDuckDB(50000)).toBe(true);
    });

    it('respects custom threshold', () => {
      const engine = new HybridEngine({ threshold: 500 });
      expect(engine.shouldUseDuckDB(499)).toBe(false);
      expect(engine.shouldUseDuckDB(500)).toBe(true);
      expect(engine.shouldUseDuckDB(1000)).toBe(true);
    });

    it('always uses DuckDB when forceDuckDB is true', () => {
      const engine = new HybridEngine({ forceDuckDB: true });
      expect(engine.shouldUseDuckDB(1)).toBe(true);
      expect(engine.shouldUseDuckDB(0)).toBe(true);
    });

    it('never uses DuckDB when forceJS is true', () => {
      const engine = new HybridEngine({ forceJS: true });
      expect(engine.shouldUseDuckDB(1000000)).toBe(false);
    });
  });

  describe('getMode', () => {
    it('returns "js" for small datasets', () => {
      const engine = new HybridEngine();
      expect(engine.getMode(100)).toBe('js');
    });

    it('returns "duckdb" for large datasets', () => {
      const engine = new HybridEngine();
      expect(engine.getMode(100000)).toBe('duckdb');
    });
  });

  describe('getThreshold', () => {
    it('returns the default threshold', () => {
      const engine = new HybridEngine();
      expect(engine.getThreshold()).toBe(10000);
    });

    it('returns the custom threshold', () => {
      const engine = new HybridEngine({ threshold: 5000 });
      expect(engine.getThreshold()).toBe(5000);
    });
  });

  describe('setThreshold', () => {
    it('updates the threshold', () => {
      const engine = new HybridEngine();
      engine.setThreshold(2000);
      expect(engine.getThreshold()).toBe(2000);
      expect(engine.shouldUseDuckDB(1999)).toBe(false);
      expect(engine.shouldUseDuckDB(2000)).toBe(true);
    });
  });
});
