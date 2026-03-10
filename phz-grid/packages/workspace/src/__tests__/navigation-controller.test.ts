/**
 * Navigation Controller (L.3) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createNavigationState,
  navigateTo,
  canNavigateTo,
  goBack,
  goForward,
  type NavigationTarget,
  type NavigationState,
} from '../shell/navigation-controller.js';
import { DEFAULT_NAV_ITEMS } from '../shell/shell-utils.js';

describe('Navigation Controller (L.3)', () => {
  describe('createNavigationState', () => {
    it('starts at catalog by default', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      expect(state.activePanel).toBe('catalog');
      expect(state.breadcrumbs.entries).toHaveLength(1);
      expect(state.breadcrumbs.entries[0].id).toBe('catalog');
    });

    it('accepts custom initial panel', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS, 'dashboards');
      expect(state.activePanel).toBe('dashboards');
    });
  });

  describe('canNavigateTo', () => {
    it('allows navigation to known panel', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      expect(canNavigateTo(state, { panelId: 'explore' })).toBe(true);
    });

    it('rejects navigation to unknown panel', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      expect(canNavigateTo(state, { panelId: 'nonexistent' })).toBe(false);
    });

    it('allows artifact navigation if panelId is valid', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const target: NavigationTarget = {
        panelId: 'dashboards',
        artifactId: 'report-123',
        label: 'Sales Report',
      };
      expect(canNavigateTo(state, target)).toBe(true);
    });
  });

  describe('navigateTo', () => {
    it('updates active panel', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const next = navigateTo(state, { panelId: 'explore' });
      expect(next.activePanel).toBe('explore');
    });

    it('pushes breadcrumb entry', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const next = navigateTo(state, { panelId: 'explore' });
      expect(next.breadcrumbs.entries).toHaveLength(2);
      expect(next.breadcrumbs.entries[1].panelId).toBe('explore');
    });

    it('uses custom label in breadcrumb', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const next = navigateTo(state, {
        panelId: 'dashboards',
        label: 'Sales Report',
        artifactId: 'r1',
      });
      expect(next.breadcrumbs.entries[1].label).toBe('Sales Report');
    });

    it('is immutable', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const panelBefore = state.activePanel;
      navigateTo(state, { panelId: 'explore' });
      expect(state.activePanel).toBe(panelBefore);
    });
  });

  describe('goBack / goForward', () => {
    it('goBack moves to previous breadcrumb', () => {
      let state = createNavigationState(DEFAULT_NAV_ITEMS);
      state = navigateTo(state, { panelId: 'explore' });
      state = navigateTo(state, { panelId: 'dashboards' });
      const back = goBack(state);
      expect(back.activePanel).toBe('explore');
      expect(back.breadcrumbs.currentIndex).toBe(1);
    });

    it('goBack at start returns same state', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const back = goBack(state);
      expect(back.activePanel).toBe(state.activePanel);
    });

    it('goForward after goBack restores', () => {
      let state = createNavigationState(DEFAULT_NAV_ITEMS);
      state = navigateTo(state, { panelId: 'explore' });
      state = goBack(state);
      const fwd = goForward(state);
      expect(fwd.activePanel).toBe('explore');
    });

    it('goForward at end returns same state', () => {
      const state = createNavigationState(DEFAULT_NAV_ITEMS);
      const fwd = goForward(state);
      expect(fwd.activePanel).toBe(state.activePanel);
    });
  });
});
