/**
 * Sprint V.5 — DefaultPresentation + personal view persistence
 *
 * Tests: merge precedence, preset with presentation, personal views.
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultPresentation,
  mergePresentation,
  createPersonalView,
  applyPersonalView,
  type DefaultPresentation,
  type PersonalView,
} from '../navigation/default-presentation.js';

describe('DefaultPresentation (V.5)', () => {
  describe('createDefaultPresentation', () => {
    it('creates presentation with defaults', () => {
      const pres = createDefaultPresentation({});
      expect(pres.density).toBe('comfortable');
      expect(pres.theme).toBe('light');
      expect(pres.columnOrder).toEqual([]);
      expect(pres.columnWidths).toEqual({});
      expect(pres.hiddenColumns).toEqual([]);
    });

    it('accepts overrides', () => {
      const pres = createDefaultPresentation({
        density: 'compact',
        theme: 'dark',
        columnOrder: ['id', 'name'],
        frozenColumns: 2,
      });
      expect(pres.density).toBe('compact');
      expect(pres.theme).toBe('dark');
      expect(pres.columnOrder).toEqual(['id', 'name']);
      expect(pres.frozenColumns).toBe(2);
    });
  });

  describe('mergePresentation', () => {
    it('merges admin defaults with user overrides', () => {
      const admin = createDefaultPresentation({
        density: 'comfortable',
        theme: 'light',
        columnOrder: ['id', 'name', 'email'],
      });
      const user: Partial<DefaultPresentation> = {
        density: 'compact',
        hiddenColumns: ['email'],
      };
      const merged = mergePresentation(admin, user);
      expect(merged.density).toBe('compact'); // user override wins
      expect(merged.theme).toBe('light'); // admin default kept
      expect(merged.hiddenColumns).toEqual(['email']);
      expect(merged.columnOrder).toEqual(['id', 'name', 'email']); // admin default kept
    });

    it('returns admin defaults when no user overrides', () => {
      const admin = createDefaultPresentation({ density: 'dense', theme: 'dark' });
      const merged = mergePresentation(admin, {});
      expect(merged).toEqual(admin);
    });
  });

  describe('PersonalView', () => {
    it('creates a personal view with artifact context', () => {
      const view = createPersonalView({
        userId: 'user-1',
        artifactId: 'report-1',
        presentation: { density: 'compact' },
        filterValues: { 'fd-region': 'US' },
      });
      expect(view.id).toBeTruthy();
      expect(view.userId).toBe('user-1');
      expect(view.artifactId).toBe('report-1');
      expect(view.presentation.density).toBe('compact');
      expect(view.filterValues).toEqual({ 'fd-region': 'US' });
    });

    it('applies personal view over defaults', () => {
      const adminDefaults = createDefaultPresentation({
        density: 'comfortable',
        theme: 'light',
        columnOrder: ['a', 'b', 'c'],
      });
      const personalView: PersonalView = {
        id: 'pv-1',
        userId: 'user-1',
        artifactId: 'report-1',
        presentation: { density: 'dense', hiddenColumns: ['c'] },
        filterValues: { 'fd-x': 'val' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const { presentation, filterValues } = applyPersonalView(adminDefaults, personalView);
      expect(presentation.density).toBe('dense');
      expect(presentation.theme).toBe('light');
      expect(presentation.hiddenColumns).toEqual(['c']);
      expect(filterValues).toEqual({ 'fd-x': 'val' });
    });

    it('returns admin defaults and empty filters when no personal view', () => {
      const adminDefaults = createDefaultPresentation({ density: 'comfortable' });
      const { presentation, filterValues } = applyPersonalView(adminDefaults, undefined);
      expect(presentation).toEqual(adminDefaults);
      expect(filterValues).toEqual({});
    });
  });
});
