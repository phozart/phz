import { describe, it, expect, beforeAll } from 'vitest';
import {
  createDefaultI18nProvider,
  formatNumber,
  formatDate,
  DEFAULT_STRINGS,
} from '../i18n/i18n-provider.js';
import type { I18nProvider } from '../i18n/i18n-provider.js';

describe('I18nProvider', () => {
  describe('createDefaultI18nProvider', () => {
    it('creates a provider with default en locale', () => {
      const provider = createDefaultI18nProvider();
      expect(provider.locale).toBe('en');
      expect(provider.direction).toBe('ltr');
    });

    it('creates a provider with custom locale', () => {
      const provider = createDefaultI18nProvider('fr-FR');
      expect(provider.locale).toBe('fr-FR');
      expect(provider.direction).toBe('ltr');
    });

    it('detects RTL direction for Arabic', () => {
      const provider = createDefaultI18nProvider('ar');
      expect(provider.direction).toBe('rtl');
    });

    it('detects RTL direction for Hebrew', () => {
      const provider = createDefaultI18nProvider('he-IL');
      expect(provider.direction).toBe('rtl');
    });

    it('detects RTL direction for Farsi', () => {
      const provider = createDefaultI18nProvider('fa');
      expect(provider.direction).toBe('rtl');
    });

    it('detects RTL direction for Urdu', () => {
      const provider = createDefaultI18nProvider('ur');
      expect(provider.direction).toBe('rtl');
    });
  });

  describe('t() — string translation', () => {
    let provider: I18nProvider;

    beforeAll(() => {
      provider = createDefaultI18nProvider();
    });

    it('translates known keys', () => {
      expect(provider.t('shell.title')).toBe('Workspace');
      expect(provider.t('filter.clearAll')).toBe('Clear all');
      expect(provider.t('admin.save')).toBe('Save');
    });

    it('returns the key itself for unknown keys', () => {
      expect(provider.t('unknown.key.here')).toBe('unknown.key.here');
    });

    it('interpolates parameters', () => {
      const result = provider.t('filter.activeFilters', { count: 5 });
      expect(result).toBe('5 active filter(s)');
    });

    it('interpolates multiple parameters', () => {
      const result = provider.t('explorer.showingRows', { shown: 100, total: 5000 });
      expect(result).toBe('Showing first 100 of 5000 rows');
    });

    it('interpolates string parameters', () => {
      const result = provider.t('widget.staleData', { time: '5 minutes' });
      expect(result).toBe('Data updated 5 minutes ago');
    });

    it('handles missing parameters gracefully (leaves placeholder)', () => {
      const result = provider.t('filter.activeFilters');
      expect(result).toBe('{count} active filter(s)');
    });
  });

  describe('DEFAULT_STRINGS coverage', () => {
    it('has shell strings', () => {
      expect(DEFAULT_STRINGS['shell.title']).toBeDefined();
      expect(DEFAULT_STRINGS['shell.catalog']).toBeDefined();
      expect(DEFAULT_STRINGS['shell.create']).toBeDefined();
    });

    it('has filter strings', () => {
      expect(DEFAULT_STRINGS['filter.clearAll']).toBeDefined();
      expect(DEFAULT_STRINGS['filter.apply']).toBeDefined();
      expect(DEFAULT_STRINGS['filter.presets']).toBeDefined();
    });

    it('has explorer strings', () => {
      expect(DEFAULT_STRINGS['explorer.rows']).toBeDefined();
      expect(DEFAULT_STRINGS['explorer.columns']).toBeDefined();
      expect(DEFAULT_STRINGS['explorer.saveAsReport']).toBeDefined();
    });

    it('has admin strings', () => {
      expect(DEFAULT_STRINGS['admin.save']).toBeDefined();
      expect(DEFAULT_STRINGS['admin.undo']).toBeDefined();
      expect(DEFAULT_STRINGS['admin.addWidget']).toBeDefined();
    });

    it('has widget strings', () => {
      expect(DEFAULT_STRINGS['widget.loading']).toBeDefined();
      expect(DEFAULT_STRINGS['widget.error']).toBeDefined();
      expect(DEFAULT_STRINGS['widget.noData']).toBeDefined();
    });

    it('has alert strings', () => {
      expect(DEFAULT_STRINGS['alerts.title']).toBeDefined();
      expect(DEFAULT_STRINGS['alerts.critical']).toBeDefined();
      expect(DEFAULT_STRINGS['alerts.createRule']).toBeDefined();
    });

    it('has template strings', () => {
      expect(DEFAULT_STRINGS['templates.gallery']).toBeDefined();
      expect(DEFAULT_STRINGS['templates.startBlank']).toBeDefined();
      expect(DEFAULT_STRINGS['templates.bindFields']).toBeDefined();
    });

    it('has data quality strings', () => {
      expect(DEFAULT_STRINGS['quality.fresh']).toBeDefined();
      expect(DEFAULT_STRINGS['quality.stale']).toBeDefined();
    });

    it('has datasource strings', () => {
      expect(DEFAULT_STRINGS['datasource.upload']).toBeDefined();
      expect(DEFAULT_STRINGS['datasource.connectUrl']).toBeDefined();
    });

    it('has history strings', () => {
      expect(DEFAULT_STRINGS['history.title']).toBeDefined();
      expect(DEFAULT_STRINGS['history.restore']).toBeDefined();
    });
  });

  describe('formatNumber', () => {
    it('formats a number with default options', () => {
      const result = formatNumber(1234.56, 'en-US');
      expect(result).toBe('1,234.56');
    });

    it('formats with currency', () => {
      const result = formatNumber(42.5, 'en-US', { style: 'currency', currency: 'USD' });
      expect(result).toBe('$42.50');
    });

    it('formats with percent', () => {
      const result = formatNumber(0.85, 'en-US', { style: 'percent' });
      expect(result).toBe('85%');
    });
  });

  describe('formatDate', () => {
    it('formats a Date object', () => {
      const date = new Date('2026-01-15T12:00:00Z');
      const result = formatDate(date, 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('formats a string date', () => {
      const result = formatDate('2026-06-01', 'en-US', { year: 'numeric', month: 'long' });
      expect(result).toContain('June');
      expect(result).toContain('2026');
    });

    it('formats a timestamp number', () => {
      const ts = new Date('2026-03-08T00:00:00Z').getTime();
      const result = formatDate(ts, 'en-US', { year: 'numeric' });
      expect(result).toContain('2026');
    });
  });
});
