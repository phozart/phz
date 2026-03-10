/**
 * Version History Utils (L.17) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  formatVersionSummary,
  computeChangeSummary,
  type VersionSummaryDisplay,
} from '../shell/version-history-utils.js';
import type { VersionSummary } from '../workspace-adapter.js';

function makeSummary(overrides?: Partial<VersionSummary>): VersionSummary {
  return {
    version: 1,
    savedAt: Date.now(),
    sizeBytes: 1024,
    ...overrides,
  };
}

describe('Version History Utils (L.17)', () => {
  describe('formatVersionSummary', () => {
    it('formats with relative time string', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const summary = makeSummary({ version: 3, savedAt: twoHoursAgo });
      const display = formatVersionSummary(summary);
      expect(display.version).toBe(3);
      expect(display.timeAgo).toContain('hour');
    });

    it('shows "just now" for very recent saves', () => {
      const summary = makeSummary({ savedAt: Date.now() - 5000 });
      const display = formatVersionSummary(summary);
      expect(display.timeAgo).toMatch(/just now|seconds/i);
    });

    it('shows minutes ago', () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const display = formatVersionSummary(makeSummary({ savedAt: fiveMinAgo }));
      expect(display.timeAgo).toContain('minute');
    });

    it('shows days ago', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const display = formatVersionSummary(makeSummary({ savedAt: threeDaysAgo }));
      expect(display.timeAgo).toContain('day');
    });

    it('preserves savedBy and changeDescription', () => {
      const display = formatVersionSummary(
        makeSummary({ savedBy: 'alice', changeDescription: 'Fixed title' }),
      );
      expect(display.savedBy).toBe('alice');
      expect(display.changeDescription).toBe('Fixed title');
    });

    it('accepts explicit now parameter for deterministic testing', () => {
      const now = 1_700_000_000_000;
      const savedAt = now - 60_000; // 1 minute ago
      const display = formatVersionSummary(makeSummary({ savedAt }), now);
      expect(display.timeAgo).toContain('minute');
    });
  });

  describe('computeChangeSummary', () => {
    it('returns changes list for modified keys', () => {
      const prev = { title: 'Old', color: 'red' };
      const curr = { title: 'New', color: 'red' };
      const changes = computeChangeSummary(prev, curr);
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some(c => c.includes('title'))).toBe(true);
    });

    it('detects added keys', () => {
      const prev = { a: 1 };
      const curr = { a: 1, b: 2 };
      const changes = computeChangeSummary(prev, curr);
      expect(changes.some(c => c.toLowerCase().includes('added') || c.includes('b'))).toBe(true);
    });

    it('detects removed keys', () => {
      const prev = { a: 1, b: 2 };
      const curr = { a: 1 };
      const changes = computeChangeSummary(prev, curr);
      expect(changes.some(c => c.toLowerCase().includes('removed') || c.includes('b'))).toBe(true);
    });

    it('returns empty array when configs are identical', () => {
      const config = { x: 1, y: 'hello' };
      expect(computeChangeSummary(config, config)).toEqual([]);
    });

    it('handles empty objects', () => {
      expect(computeChangeSummary({}, {})).toEqual([]);
    });
  });
});
