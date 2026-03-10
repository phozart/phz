/**
 * T.3 — Arrow IPC support on DataResult
 * arrowBuffer field and hasArrowBuffer type guard.
 */
import { describe, it, expect } from 'vitest';
import type { DataResult } from '../data-adapter.js';
import { hasArrowBuffer } from '../data-adapter.js';

describe('Arrow IPC on DataResult (T.3)', () => {
  const baseResult: DataResult = {
    columns: [
      { name: 'region', dataType: 'string' },
      { name: 'revenue', dataType: 'number' },
    ],
    rows: [['US', 1000], ['EU', 2000]],
    metadata: { totalRows: 2, truncated: false, queryTimeMs: 10 },
  };

  describe('arrowBuffer on DataResult', () => {
    it('DataResult can have an arrowBuffer', () => {
      const buffer = new ArrayBuffer(64);
      const result: DataResult = {
        ...baseResult,
        arrowBuffer: buffer,
      };
      expect(result.arrowBuffer).toBeInstanceOf(ArrayBuffer);
      expect(result.arrowBuffer!.byteLength).toBe(64);
    });

    it('DataResult without arrowBuffer has undefined', () => {
      expect(baseResult.arrowBuffer).toBeUndefined();
    });
  });

  describe('hasArrowBuffer', () => {
    it('returns true when arrowBuffer is present and non-empty', () => {
      const result: DataResult = {
        ...baseResult,
        arrowBuffer: new ArrayBuffer(128),
      };
      expect(hasArrowBuffer(result)).toBe(true);
    });

    it('returns false when arrowBuffer is undefined', () => {
      expect(hasArrowBuffer(baseResult)).toBe(false);
    });

    it('returns false when arrowBuffer is empty (0 bytes)', () => {
      const result: DataResult = {
        ...baseResult,
        arrowBuffer: new ArrayBuffer(0),
      };
      expect(hasArrowBuffer(result)).toBe(false);
    });

    it('returns false for null input', () => {
      expect(hasArrowBuffer(null as unknown as DataResult)).toBe(false);
    });

    it('returns false for undefined input', () => {
      expect(hasArrowBuffer(undefined as unknown as DataResult)).toBe(false);
    });
  });
});
