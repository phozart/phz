/**
 * S.7 — Component Patterns CSS + Helpers tests
 */

import { describe, it, expect } from 'vitest';

describe('Component Patterns (S.7)', () => {
  describe('getFormDensityClasses()', () => {
    it('returns compact form classes', async () => {
      const { getFormDensityClasses } = await import('../styles/component-patterns.js');
      const classes = getFormDensityClasses('compact');
      expect(classes.label).toBe('form-label--compact');
      expect(classes.input).toBe('form-input--compact');
      expect(classes.toggle).toBe('form-toggle--compact');
    });

    it('returns default form classes', async () => {
      const { getFormDensityClasses } = await import('../styles/component-patterns.js');
      const classes = getFormDensityClasses('default');
      expect(classes.label).toBe('form-label--default');
      expect(classes.input).toBe('form-input--default');
    });
  });

  describe('getModalClasses()', () => {
    it('returns centered modal with backdrop', async () => {
      const { getModalClasses } = await import('../styles/component-patterns.js');
      const classes = getModalClasses({ open: true });
      expect(classes.backdrop).toContain('modal-backdrop');
      expect(classes.backdrop).toContain('modal-backdrop--visible');
      expect(classes.container).toContain('modal-container');
    });

    it('returns hidden classes when closed', async () => {
      const { getModalClasses } = await import('../styles/component-patterns.js');
      const classes = getModalClasses({ open: false });
      expect(classes.backdrop).not.toContain('modal-backdrop--visible');
    });
  });

  describe('getDrawerClasses()', () => {
    it('returns slide-right drawer', async () => {
      const { getDrawerClasses } = await import('../styles/component-patterns.js');
      const classes = getDrawerClasses({ open: true, position: 'right' });
      expect(classes.drawer).toContain('drawer--right');
      expect(classes.drawer).toContain('drawer--open');
    });

    it('defaults width to 400px', async () => {
      const { getDrawerClasses, DRAWER_DEFAULTS } = await import('../styles/component-patterns.js');
      expect(DRAWER_DEFAULTS.width).toBe(400);
      expect(DRAWER_DEFAULTS.maxWidth).toBe(560);
    });
  });

  describe('getEmptyStateProps()', () => {
    it('returns geometric icon, title, description', async () => {
      const { getEmptyStateProps } = await import('../styles/component-patterns.js');
      const state = getEmptyStateProps('no-data');
      expect(state.icon).toBeTruthy();
      expect(state.title).toBeTruthy();
      expect(state.description).toBeTruthy();
    });

    it('returns CTA text when provided', async () => {
      const { getEmptyStateProps } = await import('../styles/component-patterns.js');
      const state = getEmptyStateProps('no-data');
      expect(state.ctaLabel).toBeDefined();
    });
  });

  describe('getSkeletonClass()', () => {
    it('returns shimmer animation class', async () => {
      const { getSkeletonClass } = await import('../styles/component-patterns.js');
      expect(getSkeletonClass('text')).toBe('skeleton skeleton--text');
      expect(getSkeletonClass('card')).toBe('skeleton skeleton--card');
      expect(getSkeletonClass('chart')).toBe('skeleton skeleton--chart');
    });
  });

  describe('STATUS_BADGE_VARIANTS', () => {
    it('contains all 6 status types', async () => {
      const { STATUS_BADGE_VARIANTS } = await import('../styles/component-patterns.js');
      expect(STATUS_BADGE_VARIANTS.published).toBeDefined();
      expect(STATUS_BADGE_VARIANTS.shared).toBeDefined();
      expect(STATUS_BADGE_VARIANTS.personal).toBeDefined();
      expect(STATUS_BADGE_VARIANTS.draft).toBeDefined();
      expect(STATUS_BADGE_VARIANTS.breach).toBeDefined();
      expect(STATUS_BADGE_VARIANTS.processing).toBeDefined();
    });

    it('each variant has bgColor and textColor', async () => {
      const { STATUS_BADGE_VARIANTS } = await import('../styles/component-patterns.js');
      for (const variant of Object.values(STATUS_BADGE_VARIANTS)) {
        expect(variant.bgColor).toBeTruthy();
        expect(variant.textColor).toBeTruthy();
        expect(variant.label).toBeTruthy();
      }
    });
  });

  describe('getOverflowClasses()', () => {
    it('returns truncation classes', async () => {
      const { getOverflowClasses } = await import('../styles/component-patterns.js');
      const classes = getOverflowClasses();
      expect(classes.truncate).toBe('text-truncate');
      expect(classes.minWidth).toBe('min-w-0');
      expect(classes.wordBreak).toBe('word-break');
    });
  });
});
