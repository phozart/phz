/**
 * RTL Layout (L.18) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  resolveDirection,
  logicalProperty,
  generateRTLOverrides,
  type DirectionConfig,
} from '../shell/rtl-utils.js';
import type { I18nProvider } from '../i18n/i18n-provider.js';

function makeI18n(direction: 'ltr' | 'rtl'): I18nProvider {
  return { t: (k: string) => k, locale: 'en', direction };
}

describe('RTL Layout (L.18)', () => {
  describe('resolveDirection', () => {
    it('returns ltr for English', () => {
      expect(resolveDirection(makeI18n('ltr'))).toBe('ltr');
    });

    it('returns rtl for RTL languages', () => {
      expect(resolveDirection(makeI18n('rtl'))).toBe('rtl');
    });

    it('defaults to ltr when no provider', () => {
      expect(resolveDirection(undefined)).toBe('ltr');
    });
  });

  describe('logicalProperty', () => {
    it('maps margin-left to margin-inline-start in LTR', () => {
      expect(logicalProperty('margin-left', 'ltr')).toBe('margin-inline-start');
    });

    it('maps margin-left to margin-inline-end in RTL', () => {
      expect(logicalProperty('margin-left', 'rtl')).toBe('margin-inline-end');
    });

    it('maps margin-right to margin-inline-end in LTR', () => {
      expect(logicalProperty('margin-right', 'ltr')).toBe('margin-inline-end');
    });

    it('maps margin-right to margin-inline-start in RTL', () => {
      expect(logicalProperty('margin-right', 'rtl')).toBe('margin-inline-start');
    });

    it('maps padding-left to padding-inline-start in LTR', () => {
      expect(logicalProperty('padding-left', 'ltr')).toBe('padding-inline-start');
    });

    it('maps padding-right to padding-inline-end in LTR', () => {
      expect(logicalProperty('padding-right', 'ltr')).toBe('padding-inline-end');
    });

    it('returns the input for unknown properties', () => {
      expect(logicalProperty('display', 'ltr')).toBe('display');
    });
  });

  describe('generateRTLOverrides', () => {
    it('generates CSS with dir=rtl selector', () => {
      const css = generateRTLOverrides();
      expect(css).toContain(':host([dir="rtl"])');
    });

    it('uses logical properties in RTL overrides', () => {
      const css = generateRTLOverrides();
      expect(css).toContain('margin-inline');
    });

    it('includes text-align override', () => {
      const css = generateRTLOverrides();
      expect(css).toContain('text-align');
    });

    it('returns valid CSS string (non-empty)', () => {
      const css = generateRTLOverrides();
      expect(css.length).toBeGreaterThan(0);
      expect(css).toContain('{');
      expect(css).toContain('}');
    });
  });

  describe('DirectionConfig', () => {
    it('can represent a complete direction config', () => {
      const config: DirectionConfig = {
        direction: 'rtl',
        textAlign: 'right',
        flexDirection: 'row-reverse',
      };
      expect(config.direction).toBe('rtl');
      expect(config.flexDirection).toBe('row-reverse');
    });
  });
});
