/**
 * Empty States (L.14) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  EMPTY_STATES,
  getEmptyState,
  type EmptyStateConfig,
} from '../shell/empty-states.js';

describe('Empty States (L.14)', () => {
  describe('EMPTY_STATES', () => {
    const expectedKeys = [
      'catalog',
      'template-gallery',
      'alert-rules',
      'active-breaches',
      'widget-picker',
      'search',
      'dashboard-canvas',
    ];

    it('has all required empty state keys', () => {
      for (const key of expectedKeys) {
        expect(EMPTY_STATES).toHaveProperty(key);
      }
    });

    it('each has title, message, and actionLabel', () => {
      for (const key of expectedKeys) {
        const state = EMPTY_STATES[key];
        expect(state.title, `${key}.title`).toBeTruthy();
        expect(state.message, `${key}.message`).toBeTruthy();
        expect(state.actionLabel, `${key}.actionLabel`).toBeTruthy();
      }
    });

    it('each has an actionId for programmatic handling', () => {
      for (const key of expectedKeys) {
        expect(EMPTY_STATES[key].actionId).toBeTruthy();
      }
    });

    it('each has an icon', () => {
      for (const key of expectedKeys) {
        expect(EMPTY_STATES[key].icon).toBeTruthy();
      }
    });
  });

  describe('getEmptyState', () => {
    it('returns config for known key', () => {
      const state = getEmptyState('catalog');
      expect(state).toBeDefined();
      expect(state!.title).toBeTruthy();
    });

    it('returns undefined for unknown key', () => {
      expect(getEmptyState('nonexistent')).toBeUndefined();
    });

    it('returned config is a copy (not the original reference)', () => {
      const a = getEmptyState('catalog');
      const b = getEmptyState('catalog');
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });

  describe('EmptyStateConfig shape', () => {
    it('supports optional secondaryAction', () => {
      const config: EmptyStateConfig = {
        title: 'Test',
        message: 'Test message',
        icon: 'x',
        actionLabel: 'Do something',
        actionId: 'test',
        secondaryActionLabel: 'Or do this',
        secondaryActionId: 'test-secondary',
      };
      expect(config.secondaryActionLabel).toBe('Or do this');
    });
  });
});
