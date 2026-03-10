import { describe, it, expect } from 'vitest';
import {
  generateFreshnessBadgeHTML,
  generateQualityWarningHTML,
  generateStaleDimmingCSS,
} from '../layout/loading-renderer.js';
import type { DataQualityInfo } from '../data-adapter.js';

describe('Quality Rendering (K.7)', () => {
  describe('generateFreshnessBadgeHTML', () => {
    it('generates badge for stale data', () => {
      const quality: DataQualityInfo = {
        lastRefreshed: new Date(Date.now() - 3600000).toISOString(),
        freshnessStatus: 'stale',
      };
      const html = generateFreshnessBadgeHTML('w1', quality);
      expect(html).toContain('phz-freshness-badge');
      expect(html).toContain('stale');
    });

    it('generates badge for fresh data', () => {
      const quality: DataQualityInfo = {
        lastRefreshed: new Date().toISOString(),
        freshnessStatus: 'fresh',
      };
      const html = generateFreshnessBadgeHTML('w1', quality);
      expect(html).toContain('fresh');
    });

    it('returns empty for unknown quality', () => {
      const html = generateFreshnessBadgeHTML('w1', undefined);
      expect(html).toBe('');
    });

    it('includes last refreshed timestamp', () => {
      const ts = new Date('2026-01-15T10:30:00Z').toISOString();
      const quality: DataQualityInfo = {
        lastRefreshed: ts,
        freshnessStatus: 'fresh',
      };
      const html = generateFreshnessBadgeHTML('w1', quality);
      expect(html).toContain(ts);
    });
  });

  describe('generateQualityWarningHTML', () => {
    it('generates warning for quality issues', () => {
      const quality: DataQualityInfo = {
        issues: [
          { severity: 'warning', message: 'Missing values in revenue column', field: 'revenue' },
        ],
      };
      const html = generateQualityWarningHTML('w1', quality);
      expect(html).toContain('phz-quality-warning');
      expect(html).toContain('Missing values');
    });

    it('generates multiple warnings', () => {
      const quality: DataQualityInfo = {
        issues: [
          { severity: 'warning', message: 'Issue 1' },
          { severity: 'error', message: 'Issue 2' },
        ],
      };
      const html = generateQualityWarningHTML('w1', quality);
      expect(html).toContain('Issue 1');
      expect(html).toContain('Issue 2');
    });

    it('returns empty when no issues', () => {
      const quality: DataQualityInfo = { issues: [] };
      const html = generateQualityWarningHTML('w1', quality);
      expect(html).toBe('');
    });

    it('returns empty when quality is undefined', () => {
      const html = generateQualityWarningHTML('w1', undefined);
      expect(html).toBe('');
    });

    it('includes completeness info when available', () => {
      const quality: DataQualityInfo = {
        completeness: 0.85,
        issues: [{ severity: 'info', message: '15% missing data' }],
      };
      const html = generateQualityWarningHTML('w1', quality);
      expect(html).toContain('85%');
    });
  });

  describe('generateStaleDimmingCSS', () => {
    it('generates dimming CSS for stale widgets', () => {
      const css = generateStaleDimmingCSS('w1');
      expect(css).toContain('opacity');
      expect(css).toContain('w1');
    });

    it('sets reduced opacity', () => {
      const css = generateStaleDimmingCSS('w1');
      // Should set opacity to something less than 1
      expect(css).toMatch(/opacity:\s*0\.\d/);
    });
  });
});
