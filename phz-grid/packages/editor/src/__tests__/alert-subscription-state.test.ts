/**
 * Tests for Alert & Subscription State (B-2.12)
 */
import {
  createAlertSubscriptionState,
  setAlertSubTab,
  searchAlertsSubs,
  setAlerts,
  addAlert,
  updateAlert,
  removeAlert,
  toggleAlertEnabled,
  setSubscriptions,
  addSubscription,
  updateSubscription,
  removeSubscription,
  toggleSubscriptionEnabled,
  openCreateAlert,
  closeCreateAlert,
  openCreateSubscription,
  closeCreateSubscription,
  startEditingAlert,
  startEditingSubscription,
  cancelEditing,
  setAlertSubLoading,
  setAlertSubError,
} from '../authoring/alert-subscription-state.js';
import type { PersonalAlert } from '@phozart/phz-shared/types';
import type { Subscription } from '@phozart/phz-shared/types';

const ALERT: PersonalAlert = {
  id: 'al-1',
  userId: 'u1',
  name: 'Revenue Alert',
  alertRuleId: 'rule-1',
  channels: ['email'],
  enabled: true,
  createdAt: 1000,
  updatedAt: 1000,
};

const ALERT_2: PersonalAlert = {
  id: 'al-2',
  userId: 'u1',
  name: 'User Alert',
  description: 'Daily active users',
  alertRuleId: 'rule-2',
  channels: ['in-app'],
  enabled: false,
  createdAt: 2000,
  updatedAt: 2000,
};

const SUB: Subscription = {
  id: 'sub-1',
  artifactId: 'dash-1',
  userId: 'u1',
  frequency: 'daily',
  format: 'pdf',
  recipients: ['user@example.com'],
  enabled: true,
  createdAt: 1000,
  updatedAt: 1000,
};

const SUB_2: Subscription = {
  id: 'sub-2',
  artifactId: 'report-1',
  userId: 'u1',
  frequency: 'weekly',
  format: 'csv',
  recipients: ['team@example.com'],
  enabled: true,
  createdAt: 2000,
  updatedAt: 2000,
};

describe('createAlertSubscriptionState', () => {
  it('creates empty state', () => {
    const state = createAlertSubscriptionState();
    expect(state.alerts).toEqual([]);
    expect(state.subscriptions).toEqual([]);
    expect(state.activeTab).toBe('alerts');
    expect(state.createAlertOpen).toBe(false);
    expect(state.createSubscriptionOpen).toBe(false);
    expect(state.editingAlertId).toBeNull();
    expect(state.editingSubscriptionId).toBeNull();
    expect(state.searchQuery).toBe('');
  });

  it('creates with data', () => {
    const state = createAlertSubscriptionState([ALERT], [SUB]);
    expect(state.alerts).toHaveLength(1);
    expect(state.subscriptions).toHaveLength(1);
    expect(state.filteredAlerts).toHaveLength(1);
    expect(state.filteredSubscriptions).toHaveLength(1);
  });
});

describe('tab switching', () => {
  it('switches tabs', () => {
    let state = createAlertSubscriptionState();
    state = setAlertSubTab(state, 'subscriptions');
    expect(state.activeTab).toBe('subscriptions');
    state = setAlertSubTab(state, 'alerts');
    expect(state.activeTab).toBe('alerts');
  });
});

describe('search', () => {
  it('filters alerts by name', () => {
    let state = createAlertSubscriptionState([ALERT, ALERT_2], [SUB]);
    state = searchAlertsSubs(state, 'revenue');
    expect(state.filteredAlerts).toHaveLength(1);
    expect(state.filteredAlerts[0].id).toBe('al-1');
  });

  it('filters alerts by description', () => {
    let state = createAlertSubscriptionState([ALERT, ALERT_2]);
    state = searchAlertsSubs(state, 'daily active');
    expect(state.filteredAlerts).toHaveLength(1);
    expect(state.filteredAlerts[0].id).toBe('al-2');
  });

  it('filters subscriptions by artifactId', () => {
    let state = createAlertSubscriptionState([], [SUB, SUB_2]);
    state = searchAlertsSubs(state, 'dash');
    expect(state.filteredSubscriptions).toHaveLength(1);
    expect(state.filteredSubscriptions[0].id).toBe('sub-1');
  });

  it('filters subscriptions by frequency', () => {
    let state = createAlertSubscriptionState([], [SUB, SUB_2]);
    state = searchAlertsSubs(state, 'weekly');
    expect(state.filteredSubscriptions).toHaveLength(1);
    expect(state.filteredSubscriptions[0].id).toBe('sub-2');
  });

  it('shows all when query is empty', () => {
    let state = createAlertSubscriptionState([ALERT, ALERT_2], [SUB, SUB_2]);
    state = searchAlertsSubs(state, 'revenue');
    state = searchAlertsSubs(state, '');
    expect(state.filteredAlerts).toHaveLength(2);
    expect(state.filteredSubscriptions).toHaveLength(2);
  });
});

describe('alert operations', () => {
  it('sets alerts', () => {
    let state = createAlertSubscriptionState();
    state = setAlerts(state, [ALERT, ALERT_2]);
    expect(state.alerts).toHaveLength(2);
    expect(state.filteredAlerts).toHaveLength(2);
    expect(state.loading).toBe(false);
  });

  it('adds an alert and closes dialog', () => {
    let state = createAlertSubscriptionState();
    state = openCreateAlert(state);
    state = addAlert(state, ALERT);
    expect(state.alerts).toHaveLength(1);
    expect(state.createAlertOpen).toBe(false);
  });

  it('updates an alert', () => {
    let state = createAlertSubscriptionState([ALERT]);
    state = startEditingAlert(state, 'al-1');
    state = updateAlert(state, 'al-1', { name: 'Updated Alert' });
    expect(state.alerts[0].name).toBe('Updated Alert');
    expect(state.editingAlertId).toBeNull();
  });

  it('removes an alert', () => {
    let state = createAlertSubscriptionState([ALERT, ALERT_2]);
    state = removeAlert(state, 'al-1');
    expect(state.alerts).toHaveLength(1);
    expect(state.alerts[0].id).toBe('al-2');
  });

  it('clears editing when edited alert is removed', () => {
    let state = createAlertSubscriptionState([ALERT]);
    state = startEditingAlert(state, 'al-1');
    state = removeAlert(state, 'al-1');
    expect(state.editingAlertId).toBeNull();
  });

  it('toggles alert enabled', () => {
    let state = createAlertSubscriptionState([ALERT]);
    expect(state.alerts[0].enabled).toBe(true);
    state = toggleAlertEnabled(state, 'al-1');
    expect(state.alerts[0].enabled).toBe(false);
    state = toggleAlertEnabled(state, 'al-1');
    expect(state.alerts[0].enabled).toBe(true);
  });
});

describe('subscription operations', () => {
  it('sets subscriptions', () => {
    let state = createAlertSubscriptionState();
    state = setSubscriptions(state, [SUB, SUB_2]);
    expect(state.subscriptions).toHaveLength(2);
  });

  it('adds a subscription and closes dialog', () => {
    let state = createAlertSubscriptionState();
    state = openCreateSubscription(state);
    state = addSubscription(state, SUB);
    expect(state.subscriptions).toHaveLength(1);
    expect(state.createSubscriptionOpen).toBe(false);
  });

  it('updates a subscription', () => {
    let state = createAlertSubscriptionState([], [SUB]);
    state = startEditingSubscription(state, 'sub-1');
    state = updateSubscription(state, 'sub-1', { frequency: 'monthly' });
    expect(state.subscriptions[0].frequency).toBe('monthly');
    expect(state.editingSubscriptionId).toBeNull();
  });

  it('removes a subscription', () => {
    let state = createAlertSubscriptionState([], [SUB, SUB_2]);
    state = removeSubscription(state, 'sub-1');
    expect(state.subscriptions).toHaveLength(1);
    expect(state.subscriptions[0].id).toBe('sub-2');
  });

  it('clears editing when edited subscription is removed', () => {
    let state = createAlertSubscriptionState([], [SUB]);
    state = startEditingSubscription(state, 'sub-1');
    state = removeSubscription(state, 'sub-1');
    expect(state.editingSubscriptionId).toBeNull();
  });

  it('toggles subscription enabled', () => {
    let state = createAlertSubscriptionState([], [SUB]);
    expect(state.subscriptions[0].enabled).toBe(true);
    state = toggleSubscriptionEnabled(state, 'sub-1');
    expect(state.subscriptions[0].enabled).toBe(false);
  });
});

describe('dialog state', () => {
  it('opens and closes create alert dialog', () => {
    let state = createAlertSubscriptionState();
    state = openCreateAlert(state);
    expect(state.createAlertOpen).toBe(true);
    state = closeCreateAlert(state);
    expect(state.createAlertOpen).toBe(false);
  });

  it('opens and closes create subscription dialog', () => {
    let state = createAlertSubscriptionState();
    state = openCreateSubscription(state);
    expect(state.createSubscriptionOpen).toBe(true);
    state = closeCreateSubscription(state);
    expect(state.createSubscriptionOpen).toBe(false);
  });

  it('starts and cancels editing', () => {
    let state = createAlertSubscriptionState([ALERT], [SUB]);
    state = startEditingAlert(state, 'al-1');
    expect(state.editingAlertId).toBe('al-1');
    state = startEditingSubscription(state, 'sub-1');
    expect(state.editingSubscriptionId).toBe('sub-1');
    state = cancelEditing(state);
    expect(state.editingAlertId).toBeNull();
    expect(state.editingSubscriptionId).toBeNull();
  });
});

describe('loading / error', () => {
  it('sets loading', () => {
    let state = createAlertSubscriptionState();
    state = setAlertSubLoading(state, true);
    expect(state.loading).toBe(true);
  });

  it('sets error and clears loading', () => {
    let state = setAlertSubLoading(createAlertSubscriptionState(), true);
    state = setAlertSubError(state, 'fetch failed');
    expect(state.error).toBe('fetch failed');
    expect(state.loading).toBe(false);
  });
});
