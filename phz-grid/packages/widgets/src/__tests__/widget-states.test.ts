import { describe, it, expect } from 'vitest';
import {
  resolveWidgetState,
  type WidgetStateConfig,
  type WidgetStateResult,
} from '../widget-states.js';

describe('Widget state resolution', () => {
  it('returns loading state when loading is true', () => {
    const config: WidgetStateConfig = { loading: true, error: null, data: null };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('loading');
    expect(result.ariaLive).toBe('polite');
    expect(result.message).toBe('Loading...');
  });

  it('returns error state when error is present', () => {
    const config: WidgetStateConfig = { loading: false, error: 'Network error', data: null };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('error');
    expect(result.role).toBe('alert');
    expect(result.message).toBe('Network error');
  });

  it('returns empty state when data is null', () => {
    const config: WidgetStateConfig = { loading: false, error: null, data: null };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('empty');
    expect(result.message).toBe('No data available');
  });

  it('returns empty state when data is empty array', () => {
    const config: WidgetStateConfig = { loading: false, error: null, data: [] };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('empty');
  });

  it('returns ready state when data is present', () => {
    const config: WidgetStateConfig = { loading: false, error: null, data: [{ x: 1 }] };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('ready');
  });

  it('loading takes priority over error', () => {
    const config: WidgetStateConfig = { loading: true, error: 'stale error', data: null };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('loading');
  });

  it('error takes priority over empty', () => {
    const config: WidgetStateConfig = { loading: false, error: 'Something went wrong', data: null };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('error');
  });

  it('uses custom loading message', () => {
    const config: WidgetStateConfig = { loading: true, error: null, data: null, loadingMessage: 'Fetching KPIs...' };
    const result = resolveWidgetState(config);
    expect(result.message).toBe('Fetching KPIs...');
  });

  it('uses custom empty message', () => {
    const config: WidgetStateConfig = { loading: false, error: null, data: null, emptyMessage: 'No KPIs configured' };
    const result = resolveWidgetState(config);
    expect(result.message).toBe('No KPIs configured');
  });

  it('loading state has correct aria attributes', () => {
    const config: WidgetStateConfig = { loading: true, error: null, data: null };
    const result = resolveWidgetState(config);
    expect(result.ariaLive).toBe('polite');
    expect(result.ariaBusy).toBe(true);
  });

  it('error state has alert role', () => {
    const config: WidgetStateConfig = { loading: false, error: 'Timeout', data: null };
    const result = resolveWidgetState(config);
    expect(result.role).toBe('alert');
    expect(result.ariaBusy).toBeUndefined();
  });

  it('ready state has no special aria attributes', () => {
    const config: WidgetStateConfig = { loading: false, error: null, data: [1] };
    const result = resolveWidgetState(config);
    expect(result.state).toBe('ready');
    expect(result.ariaLive).toBeUndefined();
    expect(result.role).toBeUndefined();
  });
});
