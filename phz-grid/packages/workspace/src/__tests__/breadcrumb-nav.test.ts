/**
 * Breadcrumb Navigation (L.1) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createNavigationStack,
  pushCrumb,
  popTo,
  type BreadcrumbEntry,
  type NavigationStack,
} from '../shell/shell-utils.js';

function makeCrumb(id: string, label?: string): BreadcrumbEntry {
  return { id, label: label ?? id, panelId: id };
}

describe('Breadcrumb Navigation (L.1)', () => {
  describe('createNavigationStack', () => {
    it('returns an empty stack', () => {
      const stack = createNavigationStack();
      expect(stack.entries).toEqual([]);
      expect(stack.currentIndex).toBe(-1);
    });

    it('accepts initial entries', () => {
      const entries = [makeCrumb('catalog'), makeCrumb('report-1')];
      const stack = createNavigationStack(entries);
      expect(stack.entries).toHaveLength(2);
      expect(stack.currentIndex).toBe(1);
    });
  });

  describe('pushCrumb', () => {
    it('adds entry to empty stack', () => {
      const stack = createNavigationStack();
      const next = pushCrumb(stack, makeCrumb('catalog'));
      expect(next.entries).toHaveLength(1);
      expect(next.currentIndex).toBe(0);
      expect(next.entries[0].id).toBe('catalog');
    });

    it('appends to existing stack', () => {
      const stack = createNavigationStack([makeCrumb('catalog')]);
      const next = pushCrumb(stack, makeCrumb('report-1'));
      expect(next.entries).toHaveLength(2);
      expect(next.currentIndex).toBe(1);
    });

    it('does not duplicate the current entry', () => {
      const stack = createNavigationStack([makeCrumb('catalog')]);
      const next = pushCrumb(stack, makeCrumb('catalog'));
      expect(next.entries).toHaveLength(1);
      expect(next.currentIndex).toBe(0);
    });

    it('truncates forward history when pushing mid-stack', () => {
      const stack: NavigationStack = {
        entries: [makeCrumb('a'), makeCrumb('b'), makeCrumb('c')],
        currentIndex: 1,
      };
      const next = pushCrumb(stack, makeCrumb('d'));
      expect(next.entries.map(e => e.id)).toEqual(['a', 'b', 'd']);
      expect(next.currentIndex).toBe(2);
    });

    it('is immutable — does not modify original stack', () => {
      const stack = createNavigationStack([makeCrumb('a')]);
      const entriesBefore = [...stack.entries];
      pushCrumb(stack, makeCrumb('b'));
      expect(stack.entries).toEqual(entriesBefore);
    });
  });

  describe('popTo', () => {
    it('pops to a specific index', () => {
      const stack = createNavigationStack([
        makeCrumb('a'), makeCrumb('b'), makeCrumb('c'),
      ]);
      const next = popTo(stack, 0);
      expect(next.currentIndex).toBe(0);
      expect(next.entries).toHaveLength(3); // entries preserved, index moved
    });

    it('returns same stack if index is current', () => {
      const stack = createNavigationStack([makeCrumb('a'), makeCrumb('b')]);
      const next = popTo(stack, 1);
      expect(next.currentIndex).toBe(1);
    });

    it('clamps to valid range — negative index', () => {
      const stack = createNavigationStack([makeCrumb('a')]);
      const next = popTo(stack, -5);
      expect(next.currentIndex).toBe(0);
    });

    it('clamps to valid range — beyond end', () => {
      const stack = createNavigationStack([makeCrumb('a'), makeCrumb('b')]);
      const next = popTo(stack, 99);
      expect(next.currentIndex).toBe(1);
    });

    it('returns empty-index for empty stack', () => {
      const stack = createNavigationStack();
      const next = popTo(stack, 0);
      expect(next.currentIndex).toBe(-1);
    });

    it('is immutable', () => {
      const stack = createNavigationStack([makeCrumb('a'), makeCrumb('b')]);
      const idxBefore = stack.currentIndex;
      popTo(stack, 0);
      expect(stack.currentIndex).toBe(idxBefore);
    });
  });

  describe('BreadcrumbEntry shape', () => {
    it('supports optional metadata', () => {
      const entry: BreadcrumbEntry = {
        id: 'report-1',
        label: 'Sales Report',
        panelId: 'engine-admin',
        metadata: { artifactType: 'report' },
      };
      expect(entry.metadata).toEqual({ artifactType: 'report' });
    });
  });
});
