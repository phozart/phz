/**
 * X.2 — Overflow Prevention Verification
 *
 * Exercises overflow-related utilities from component-patterns.ts and
 * other pattern helpers (form density, modals, drawers, skeletons,
 * empty states, status badges).
 */

import { describe, it, expect } from 'vitest';
import {
  getOverflowClasses,
  getFormDensityClasses,
  getModalClasses,
  getDrawerClasses,
  getEmptyStateProps,
  getSkeletonClass,
  STATUS_BADGE_VARIANTS,
  DRAWER_DEFAULTS,
} from '../styles/component-patterns.js';

// ========================================================================
// Overflow Classes
// ========================================================================

describe('X.2 — Overflow prevention classes', () => {
  it('returns all three overflow utility classes', () => {
    const classes = getOverflowClasses();
    expect(classes.truncate).toBe('text-truncate');
    expect(classes.minWidth).toBe('min-w-0');
    expect(classes.wordBreak).toBe('word-break');
  });

  it('returns a stable object shape on repeated calls', () => {
    const a = getOverflowClasses();
    const b = getOverflowClasses();
    expect(a).toEqual(b);
  });

  it('contains no empty string values', () => {
    const classes = getOverflowClasses();
    for (const value of Object.values(classes)) {
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ========================================================================
// Form Density
// ========================================================================

describe('X.2 — Form density classes', () => {
  it('compact density uses --compact suffix', () => {
    const classes = getFormDensityClasses('compact');
    expect(classes.label).toBe('form-label--compact');
    expect(classes.input).toBe('form-input--compact');
    expect(classes.toggle).toBe('form-toggle--compact');
  });

  it('default density uses --default suffix', () => {
    const classes = getFormDensityClasses('default');
    expect(classes.label).toBe('form-label--default');
    expect(classes.input).toBe('form-input--default');
    expect(classes.toggle).toBe('form-toggle--default');
  });

  it('all class names are non-empty', () => {
    for (const density of ['compact', 'default'] as const) {
      const classes = getFormDensityClasses(density);
      expect(classes.label).toBeTruthy();
      expect(classes.input).toBeTruthy();
      expect(classes.toggle).toBeTruthy();
    }
  });
});

// ========================================================================
// Modal Classes
// ========================================================================

describe('X.2 — Modal classes', () => {
  it('open modal has visible backdrop', () => {
    const classes = getModalClasses({ open: true });
    expect(classes.backdrop).toContain('modal-backdrop--visible');
    expect(classes.container).toBe('modal-container');
  });

  it('closed modal has plain backdrop', () => {
    const classes = getModalClasses({ open: false });
    expect(classes.backdrop).toBe('modal-backdrop');
    expect(classes.backdrop).not.toContain('visible');
  });

  it('container class is always present regardless of open state', () => {
    expect(getModalClasses({ open: true }).container).toBe('modal-container');
    expect(getModalClasses({ open: false }).container).toBe('modal-container');
  });
});

// ========================================================================
// Drawer Classes
// ========================================================================

describe('X.2 — Drawer classes', () => {
  it('open left drawer includes position and open modifier', () => {
    const classes = getDrawerClasses({ open: true, position: 'left' });
    expect(classes.drawer).toContain('drawer--left');
    expect(classes.drawer).toContain('drawer--open');
  });

  it('closed right drawer has position but no open modifier', () => {
    const classes = getDrawerClasses({ open: false, position: 'right' });
    expect(classes.drawer).toContain('drawer--right');
    expect(classes.drawer).not.toContain('drawer--open');
  });

  it('drawer defaults are reasonable', () => {
    expect(DRAWER_DEFAULTS.width).toBeGreaterThan(0);
    expect(DRAWER_DEFAULTS.maxWidth).toBeGreaterThan(DRAWER_DEFAULTS.width);
  });
});

// ========================================================================
// Empty States
// ========================================================================

describe('X.2 — Empty state props', () => {
  const knownStates = ['no-data', 'no-results', 'no-selection', 'empty-dashboard'];

  it('returns props for all known state types', () => {
    for (const stateType of knownStates) {
      const props = getEmptyStateProps(stateType);
      expect(props.icon).toBeTruthy();
      expect(props.title).toBeTruthy();
      expect(props.description).toBeTruthy();
    }
  });

  it('no-data and empty-dashboard have CTA labels', () => {
    expect(getEmptyStateProps('no-data').ctaLabel).toBeTruthy();
    expect(getEmptyStateProps('empty-dashboard').ctaLabel).toBeTruthy();
  });

  it('no-selection has no CTA label', () => {
    expect(getEmptyStateProps('no-selection').ctaLabel).toBeUndefined();
  });

  it('unknown state type returns a fallback', () => {
    const props = getEmptyStateProps('never-heard-of-this');
    expect(props.icon).toBeTruthy();
    expect(props.title).toBeTruthy();
    expect(props.description).toBeTruthy();
  });
});

// ========================================================================
// Skeleton Classes
// ========================================================================

describe('X.2 — Loading skeleton classes', () => {
  const variants = ['text', 'card', 'chart', 'table'] as const;

  it('returns skeleton class for each variant', () => {
    for (const variant of variants) {
      const cls = getSkeletonClass(variant);
      expect(cls).toBe(`skeleton skeleton--${variant}`);
    }
  });

  it('all skeleton classes start with "skeleton"', () => {
    for (const variant of variants) {
      expect(getSkeletonClass(variant)).toMatch(/^skeleton /);
    }
  });
});

// ========================================================================
// Status Badge Variants
// ========================================================================

describe('X.2 — Status badge variants', () => {
  const expectedKeys = ['published', 'shared', 'personal', 'draft', 'breach', 'processing'];

  it('has all expected badge variants', () => {
    for (const key of expectedKeys) {
      expect(STATUS_BADGE_VARIANTS[key]).toBeDefined();
    }
  });

  it('each variant has bgColor, textColor, and label', () => {
    for (const key of expectedKeys) {
      const variant = STATUS_BADGE_VARIANTS[key];
      expect(variant.bgColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(variant.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(variant.label.length).toBeGreaterThan(0);
    }
  });

  it('breach variant uses red tones', () => {
    const breach = STATUS_BADGE_VARIANTS['breach'];
    // Red bg should be light-red, text should be dark-red
    expect(breach.bgColor).toBe('#FEE2E2');
    expect(breach.textColor).toBe('#991B1B');
    expect(breach.label).toBe('Breach');
  });
});
