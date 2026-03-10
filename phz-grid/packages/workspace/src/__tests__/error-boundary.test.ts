import { describe, it, expect } from 'vitest';
import {
  createWidgetErrorState,
  isRecoverable,
  formatErrorForUser,
  type WidgetErrorState,
} from '../layout/widget-error-boundary.js';

describe('WidgetErrorBoundary', () => {
  describe('createWidgetErrorState', () => {
    it('creates error state from Error object', () => {
      const err = new Error('Network timeout');
      const state = createWidgetErrorState('w1', err);
      expect(state.widgetId).toBe('w1');
      expect(state.message).toBe('Network timeout');
      expect(state.timestamp).toBeGreaterThan(0);
      expect(state.retryCount).toBe(0);
    });

    it('creates error state from string', () => {
      const state = createWidgetErrorState('w1', 'Something failed');
      expect(state.message).toBe('Something failed');
    });

    it('creates error state from unknown value', () => {
      const state = createWidgetErrorState('w1', 42);
      expect(state.message).toBe('Unknown error');
    });

    it('increments retryCount when previous state provided', () => {
      const prev: WidgetErrorState = {
        widgetId: 'w1',
        message: 'first',
        timestamp: Date.now(),
        retryCount: 2,
      };
      const state = createWidgetErrorState('w1', 'second', prev);
      expect(state.retryCount).toBe(3);
    });
  });

  describe('isRecoverable', () => {
    it('returns true for network errors', () => {
      expect(isRecoverable(new Error('fetch failed'))).toBe(true);
      expect(isRecoverable(new Error('NetworkError'))).toBe(true);
    });

    it('returns true for timeout errors', () => {
      expect(isRecoverable(new Error('timeout'))).toBe(true);
      expect(isRecoverable(new Error('AbortError'))).toBe(true);
    });

    it('returns false for programming errors', () => {
      expect(isRecoverable(new TypeError('Cannot read properties of undefined'))).toBe(false);
      expect(isRecoverable(new ReferenceError('x is not defined'))).toBe(false);
    });

    it('returns true for generic errors by default', () => {
      expect(isRecoverable(new Error('some error'))).toBe(true);
    });
  });

  describe('formatErrorForUser', () => {
    it('returns user-friendly message for network errors', () => {
      const msg = formatErrorForUser(new Error('fetch failed'));
      expect(msg).not.toContain('fetch failed');
      expect(msg.length).toBeGreaterThan(0);
    });

    it('returns generic message for unknown errors', () => {
      const msg = formatErrorForUser(new Error('obscure internal error'));
      expect(msg.length).toBeGreaterThan(0);
    });

    it('handles non-Error values', () => {
      const msg = formatErrorForUser('string error');
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});
