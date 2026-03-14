/**
 * Tests for empty state types and helpers.
 */
import {
  createDefaultEmptyStateConfig,
  createEmptyState,
  DEFAULT_EMPTY_STATES,
} from '@phozart/shared/types';
import type { EmptyScenario } from '@phozart/shared/types';

// ========================================================================
// createDefaultEmptyStateConfig
// ========================================================================

describe('createDefaultEmptyStateConfig', () => {
  const ALL_SCENARIOS: EmptyScenario[] = [
    'no-data', 'no-results', 'no-access', 'not-configured',
    'loading-failed', 'first-time', 'no-selection', 'empty-dashboard',
    'no-favorites',
  ];

  it.each(ALL_SCENARIOS)('creates config for scenario "%s"', (scenario) => {
    const config = createDefaultEmptyStateConfig(scenario);
    expect(config.scenario).toBe(scenario);
    expect(typeof config.icon).toBe('string');
    expect(typeof config.title).toBe('string');
    expect(typeof config.description).toBe('string');
  });

  it('defaults to "no-data" when no scenario is given', () => {
    const config = createDefaultEmptyStateConfig();
    expect(config.scenario).toBe('no-data');
  });

  it('returns a fresh copy each time', () => {
    const a = createDefaultEmptyStateConfig('no-data');
    const b = createDefaultEmptyStateConfig('no-data');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('no-data has actionLabel and actionId', () => {
    const config = createDefaultEmptyStateConfig('no-data');
    expect(config.actionLabel).toBe('Add Data Source');
    expect(config.actionId).toBe('add-data-source');
  });

  it('no-results has clear-filters action', () => {
    const config = createDefaultEmptyStateConfig('no-results');
    expect(config.actionLabel).toBe('Clear Filters');
    expect(config.actionId).toBe('clear-filters');
  });

  it('no-access has no action', () => {
    const config = createDefaultEmptyStateConfig('no-access');
    expect(config.actionLabel).toBeUndefined();
    expect(config.actionId).toBeUndefined();
  });

  it('no-selection has no action', () => {
    const config = createDefaultEmptyStateConfig('no-selection');
    expect(config.actionLabel).toBeUndefined();
  });

  it('first-time has get-started action', () => {
    const config = createDefaultEmptyStateConfig('first-time');
    expect(config.actionLabel).toBe('Get Started');
    expect(config.actionId).toBe('get-started');
  });

  it('empty-dashboard has browse-templates action', () => {
    const config = createDefaultEmptyStateConfig('empty-dashboard');
    expect(config.actionLabel).toBe('Browse Templates');
  });

  it('no-favorites has browse-catalog action', () => {
    const config = createDefaultEmptyStateConfig('no-favorites');
    expect(config.actionLabel).toBe('Browse Catalog');
  });
});

// ========================================================================
// createEmptyState (deprecated legacy)
// ========================================================================

describe('createEmptyState', () => {
  it('creates an empty state with reason, title, message', () => {
    const state = createEmptyState('no-data', 'No Data', 'There is nothing here.');
    expect(state.reason).toBe('no-data');
    expect(state.title).toBe('No Data');
    expect(state.message).toBe('There is nothing here.');
  });

  it('does not set icon, actionLabel, or actionTarget by default', () => {
    const state = createEmptyState('no-results', 'T', 'M');
    expect(state.icon).toBeUndefined();
    expect(state.actionLabel).toBeUndefined();
    expect(state.actionTarget).toBeUndefined();
  });
});

// ========================================================================
// DEFAULT_EMPTY_STATES
// ========================================================================

describe('DEFAULT_EMPTY_STATES', () => {
  it('has entries for all legacy EmptyStateReason values', () => {
    const reasons = ['no-data', 'no-results', 'no-access', 'not-configured', 'loading-failed', 'first-time'];
    for (const reason of reasons) {
      expect(DEFAULT_EMPTY_STATES[reason as keyof typeof DEFAULT_EMPTY_STATES]).toBeDefined();
      expect(DEFAULT_EMPTY_STATES[reason as keyof typeof DEFAULT_EMPTY_STATES].reason).toBe(reason);
      expect(typeof DEFAULT_EMPTY_STATES[reason as keyof typeof DEFAULT_EMPTY_STATES].title).toBe('string');
      expect(typeof DEFAULT_EMPTY_STATES[reason as keyof typeof DEFAULT_EMPTY_STATES].message).toBe('string');
    }
  });
});
