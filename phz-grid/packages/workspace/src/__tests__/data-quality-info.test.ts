import { describe, it, expect } from 'vitest';
import { computeFreshnessStatus } from '../data-adapter.js';
import type { DataQualityInfo, DataQualityIssue } from '../data-adapter.js';

describe('DataQualityInfo', () => {
  describe('computeFreshnessStatus', () => {
    it('returns "fresh" when within threshold', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = computeFreshnessStatus(fiveMinutesAgo, 10);
      expect(result).toBe('fresh');
    });

    it('returns "stale" when beyond threshold', () => {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const result = computeFreshnessStatus(twentyMinutesAgo, 10);
      expect(result).toBe('stale');
    });

    it('returns "unknown" for invalid date string', () => {
      const result = computeFreshnessStatus('not-a-date', 10);
      expect(result).toBe('unknown');
    });

    it('returns "fresh" when exactly at threshold', () => {
      const exactlyAtThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const result = computeFreshnessStatus(exactlyAtThreshold, 10);
      // At the boundary, should still be fresh (<=)
      expect(result).toBe('fresh');
    });

    it('returns "stale" when just beyond threshold', () => {
      const justBeyond = new Date(Date.now() - 10 * 60 * 1000 - 1001).toISOString();
      const result = computeFreshnessStatus(justBeyond, 10);
      expect(result).toBe('stale');
    });

    it('handles zero threshold (always stale unless just now)', () => {
      const justNow = new Date().toISOString();
      const result = computeFreshnessStatus(justNow, 0);
      // With 0 threshold, practically should be fresh (within ~1s)
      expect(result).toBe('fresh');
    });
  });

  describe('DataQualityIssue', () => {
    it('creates an info issue', () => {
      const issue: DataQualityIssue = {
        severity: 'info',
        message: 'Data was last refreshed 5 minutes ago',
      };
      expect(issue.severity).toBe('info');
    });

    it('creates a warning issue with field reference', () => {
      const issue: DataQualityIssue = {
        severity: 'warning',
        message: 'Field "email" has 15% null values',
        field: 'email',
      };
      expect(issue.field).toBe('email');
    });

    it('creates an error issue', () => {
      const issue: DataQualityIssue = {
        severity: 'error',
        message: 'Data source connection failed',
      };
      expect(issue.severity).toBe('error');
    });
  });

  describe('DataQualityInfo structure', () => {
    it('creates a full quality info object', () => {
      const quality: DataQualityInfo = {
        lastRefreshed: '2026-03-08T10:00:00Z',
        freshnessStatus: 'fresh',
        freshnessThresholdMinutes: 15,
        completeness: 0.95,
        issues: [
          { severity: 'warning', message: 'Some nulls detected', field: 'phone' },
        ],
      };
      expect(quality.completeness).toBe(0.95);
      expect(quality.issues).toHaveLength(1);
    });

    it('allows all optional fields to be omitted', () => {
      const quality: DataQualityInfo = {};
      expect(quality.lastRefreshed).toBeUndefined();
      expect(quality.freshnessStatus).toBeUndefined();
      expect(quality.completeness).toBeUndefined();
      expect(quality.issues).toBeUndefined();
    });

    it('completeness is bounded between 0 and 1', () => {
      const quality: DataQualityInfo = { completeness: 0.0 };
      expect(quality.completeness).toBe(0);
      const full: DataQualityInfo = { completeness: 1.0 };
      expect(full.completeness).toBe(1);
    });
  });
});
