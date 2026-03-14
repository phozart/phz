/**
 * @phozart/widgets — Container Query Widget Adaptations Tests (C-1.08)
 *
 * Tests the new container query helpers for decision tree,
 * container box, and rich text widgets.
 */
import { describe, it, expect } from 'vitest';
import {
  getDecisionTreeClass,
  getContainerBoxClass,
  shouldStackContainerChildren,
  getRichTextClass,
} from '@phozart/shared/design-system';

describe('getDecisionTreeClass', () => {
  it('returns tree--full for wide containers', () => {
    expect(getDecisionTreeClass(600)).toBe('tree--full');
    expect(getDecisionTreeClass(501)).toBe('tree--full');
  });

  it('returns tree--compact for medium containers', () => {
    expect(getDecisionTreeClass(500)).toBe('tree--compact');
    expect(getDecisionTreeClass(300)).toBe('tree--compact');
  });

  it('returns tree--minimal for narrow containers', () => {
    expect(getDecisionTreeClass(299)).toBe('tree--minimal');
    expect(getDecisionTreeClass(100)).toBe('tree--minimal');
  });
});

describe('getContainerBoxClass', () => {
  it('returns container--full for wide containers', () => {
    expect(getContainerBoxClass(700)).toBe('container--full');
    expect(getContainerBoxClass(601)).toBe('container--full');
  });

  it('returns container--medium for medium containers', () => {
    expect(getContainerBoxClass(600)).toBe('container--medium');
    expect(getContainerBoxClass(400)).toBe('container--medium');
  });

  it('returns container--small for narrow containers', () => {
    expect(getContainerBoxClass(399)).toBe('container--small');
    expect(getContainerBoxClass(200)).toBe('container--small');
  });
});

describe('shouldStackContainerChildren', () => {
  it('always stacks when width < 400', () => {
    expect(shouldStackContainerChildren(300, 1)).toBe(true);
    expect(shouldStackContainerChildren(399, 1)).toBe(true);
  });

  it('stacks at medium width when more than 2 children', () => {
    expect(shouldStackContainerChildren(500, 3)).toBe(true);
    expect(shouldStackContainerChildren(500, 4)).toBe(true);
  });

  it('does not stack at medium width with 2 or fewer children', () => {
    expect(shouldStackContainerChildren(500, 2)).toBe(false);
    expect(shouldStackContainerChildren(500, 1)).toBe(false);
  });

  it('does not stack at wide containers', () => {
    expect(shouldStackContainerChildren(700, 5)).toBe(false);
    expect(shouldStackContainerChildren(600, 3)).toBe(false);
  });
});

describe('getRichTextClass', () => {
  it('returns rich-text--full for wide containers', () => {
    expect(getRichTextClass(600)).toBe('rich-text--full');
    expect(getRichTextClass(501)).toBe('rich-text--full');
  });

  it('returns rich-text--compact for medium containers', () => {
    expect(getRichTextClass(500)).toBe('rich-text--compact');
    expect(getRichTextClass(300)).toBe('rich-text--compact');
  });

  it('returns rich-text--minimal for narrow containers', () => {
    expect(getRichTextClass(299)).toBe('rich-text--minimal');
    expect(getRichTextClass(100)).toBe('rich-text--minimal');
  });
});
