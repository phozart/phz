import { describe, it, expect } from 'vitest';
import {
  withBreachIndicator,
  getBreachBorderCSS,
  getBreachGlowCSS,
  type BreachIndicatorConfig,
} from '../alerts/risk-summary-widget.js';
import type { BreachRecord } from '../types.js';

describe('BreachIndicators', () => {
  describe('withBreachIndicator', () => {
    it('returns CSS class for critical severity', () => {
      const config = withBreachIndicator('critical');
      expect(config.className).toContain('critical');
    });

    it('returns CSS class for warning severity', () => {
      const config = withBreachIndicator('warning');
      expect(config.className).toContain('warning');
    });

    it('returns CSS class for info severity', () => {
      const config = withBreachIndicator('info');
      expect(config.className).toContain('info');
    });

    it('returns empty when no severity', () => {
      const config = withBreachIndicator(undefined);
      expect(config.className).toBe('');
    });
  });

  describe('getBreachBorderCSS', () => {
    it('generates red border for critical', () => {
      const css = getBreachBorderCSS('critical');
      expect(css).toContain('border');
      expect(css).toMatch(/red|#[a-f0-9]+|var\(--/i);
    });

    it('generates amber/orange border for warning', () => {
      const css = getBreachBorderCSS('warning');
      expect(css).toContain('border');
    });

    it('generates blue border for info', () => {
      const css = getBreachBorderCSS('info');
      expect(css).toContain('border');
    });

    it('returns empty for no severity', () => {
      expect(getBreachBorderCSS(undefined)).toBe('');
    });
  });

  describe('getBreachGlowCSS', () => {
    it('generates box-shadow glow for critical', () => {
      const css = getBreachGlowCSS('critical');
      expect(css).toContain('box-shadow');
    });

    it('generates glow for warning', () => {
      const css = getBreachGlowCSS('warning');
      expect(css).toContain('box-shadow');
    });

    it('returns empty for no severity', () => {
      expect(getBreachGlowCSS(undefined)).toBe('');
    });
  });
});
