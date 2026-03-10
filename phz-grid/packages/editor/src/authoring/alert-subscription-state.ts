/**
 * @phozart/phz-editor — Alert & Subscription State (B-2.12)
 *
 * State machine for personal alerts and report subscriptions.
 * Authors can create, edit, and manage their alert thresholds
 * and scheduled report deliveries.
 */

import type { PersonalAlert, PersonalAlertPreference } from '@phozart/phz-shared/types';
import type { Subscription } from '@phozart/phz-shared/types';

// ========================================================================
// AlertSubscriptionState
// ========================================================================

export interface AlertSubscriptionState {
  /** All personal alerts for the current user. */
  alerts: PersonalAlert[];
  /** All subscriptions for the current user. */
  subscriptions: Subscription[];
  /** Active tab: alerts or subscriptions. */
  activeTab: 'alerts' | 'subscriptions';
  /** Whether the create alert dialog is open. */
  createAlertOpen: boolean;
  /** Whether the create subscription dialog is open. */
  createSubscriptionOpen: boolean;
  /** ID of the alert currently being edited (null = not editing). */
  editingAlertId: string | null;
  /** ID of the subscription currently being edited. */
  editingSubscriptionId: string | null;
  /** Search query for filtering alerts/subscriptions. */
  searchQuery: string;
  /** Filtered alerts after search. */
  filteredAlerts: PersonalAlert[];
  /** Filtered subscriptions after search. */
  filteredSubscriptions: Subscription[];
  /** Loading state. */
  loading: boolean;
  /** Error state. */
  error: unknown;
}

// ========================================================================
// Internal: filter helpers
// ========================================================================

function filterAlerts(alerts: PersonalAlert[], query: string): PersonalAlert[] {
  if (!query.trim()) return alerts;
  const q = query.toLowerCase();
  return alerts.filter(
    a =>
      a.name.toLowerCase().includes(q) ||
      (a.description?.toLowerCase().includes(q) ?? false),
  );
}

function filterSubscriptions(subs: Subscription[], query: string): Subscription[] {
  if (!query.trim()) return subs;
  const q = query.toLowerCase();
  return subs.filter(
    s =>
      s.artifactId.toLowerCase().includes(q) ||
      s.frequency.toLowerCase().includes(q),
  );
}

// ========================================================================
// Factory
// ========================================================================

export function createAlertSubscriptionState(
  alerts?: PersonalAlert[],
  subscriptions?: Subscription[],
): AlertSubscriptionState {
  const a = alerts ?? [];
  const s = subscriptions ?? [];
  return {
    alerts: a,
    subscriptions: s,
    activeTab: 'alerts',
    createAlertOpen: false,
    createSubscriptionOpen: false,
    editingAlertId: null,
    editingSubscriptionId: null,
    searchQuery: '',
    filteredAlerts: a,
    filteredSubscriptions: s,
    loading: false,
    error: null,
  };
}

// ========================================================================
// Tab switching
// ========================================================================

/**
 * Switch between alerts and subscriptions tabs.
 */
export function setAlertSubTab(
  state: AlertSubscriptionState,
  tab: 'alerts' | 'subscriptions',
): AlertSubscriptionState {
  return { ...state, activeTab: tab };
}

// ========================================================================
// Search
// ========================================================================

/**
 * Search alerts and subscriptions.
 */
export function searchAlertsSubs(
  state: AlertSubscriptionState,
  query: string,
): AlertSubscriptionState {
  return {
    ...state,
    searchQuery: query,
    filteredAlerts: filterAlerts(state.alerts, query),
    filteredSubscriptions: filterSubscriptions(state.subscriptions, query),
  };
}

// ========================================================================
// Alert operations
// ========================================================================

/**
 * Set the alerts list (e.g. after loading from persistence).
 */
export function setAlerts(
  state: AlertSubscriptionState,
  alerts: PersonalAlert[],
): AlertSubscriptionState {
  return {
    ...state,
    alerts,
    filteredAlerts: filterAlerts(alerts, state.searchQuery),
    loading: false,
  };
}

/**
 * Add a new alert.
 */
export function addAlert(
  state: AlertSubscriptionState,
  alert: PersonalAlert,
): AlertSubscriptionState {
  const alerts = [...state.alerts, alert];
  return {
    ...state,
    alerts,
    filteredAlerts: filterAlerts(alerts, state.searchQuery),
    createAlertOpen: false,
  };
}

/**
 * Update an existing alert.
 */
export function updateAlert(
  state: AlertSubscriptionState,
  alertId: string,
  updates: Partial<PersonalAlert>,
): AlertSubscriptionState {
  const alerts = state.alerts.map(a =>
    a.id === alertId ? { ...a, ...updates } : a,
  );
  return {
    ...state,
    alerts,
    filteredAlerts: filterAlerts(alerts, state.searchQuery),
    editingAlertId: null,
  };
}

/**
 * Remove an alert.
 */
export function removeAlert(
  state: AlertSubscriptionState,
  alertId: string,
): AlertSubscriptionState {
  const alerts = state.alerts.filter(a => a.id !== alertId);
  return {
    ...state,
    alerts,
    filteredAlerts: filterAlerts(alerts, state.searchQuery),
    editingAlertId: state.editingAlertId === alertId ? null : state.editingAlertId,
  };
}

/**
 * Toggle alert enabled/disabled.
 */
export function toggleAlertEnabled(
  state: AlertSubscriptionState,
  alertId: string,
): AlertSubscriptionState {
  const alerts = state.alerts.map(a =>
    a.id === alertId ? { ...a, enabled: !a.enabled } : a,
  );
  return {
    ...state,
    alerts,
    filteredAlerts: filterAlerts(alerts, state.searchQuery),
  };
}

// ========================================================================
// Subscription operations
// ========================================================================

/**
 * Set the subscriptions list.
 */
export function setSubscriptions(
  state: AlertSubscriptionState,
  subscriptions: Subscription[],
): AlertSubscriptionState {
  return {
    ...state,
    subscriptions,
    filteredSubscriptions: filterSubscriptions(subscriptions, state.searchQuery),
    loading: false,
  };
}

/**
 * Add a new subscription.
 */
export function addSubscription(
  state: AlertSubscriptionState,
  subscription: Subscription,
): AlertSubscriptionState {
  const subscriptions = [...state.subscriptions, subscription];
  return {
    ...state,
    subscriptions,
    filteredSubscriptions: filterSubscriptions(subscriptions, state.searchQuery),
    createSubscriptionOpen: false,
  };
}

/**
 * Update an existing subscription.
 */
export function updateSubscription(
  state: AlertSubscriptionState,
  subscriptionId: string,
  updates: Partial<Subscription>,
): AlertSubscriptionState {
  const subscriptions = state.subscriptions.map(s =>
    s.id === subscriptionId ? { ...s, ...updates } : s,
  );
  return {
    ...state,
    subscriptions,
    filteredSubscriptions: filterSubscriptions(subscriptions, state.searchQuery),
    editingSubscriptionId: null,
  };
}

/**
 * Remove a subscription.
 */
export function removeSubscription(
  state: AlertSubscriptionState,
  subscriptionId: string,
): AlertSubscriptionState {
  const subscriptions = state.subscriptions.filter(s => s.id !== subscriptionId);
  return {
    ...state,
    subscriptions,
    filteredSubscriptions: filterSubscriptions(subscriptions, state.searchQuery),
    editingSubscriptionId: state.editingSubscriptionId === subscriptionId
      ? null
      : state.editingSubscriptionId,
  };
}

/**
 * Toggle subscription enabled/disabled.
 */
export function toggleSubscriptionEnabled(
  state: AlertSubscriptionState,
  subscriptionId: string,
): AlertSubscriptionState {
  const subscriptions = state.subscriptions.map(s =>
    s.id === subscriptionId ? { ...s, enabled: !s.enabled } : s,
  );
  return {
    ...state,
    subscriptions,
    filteredSubscriptions: filterSubscriptions(subscriptions, state.searchQuery),
  };
}

// ========================================================================
// Dialog state
// ========================================================================

/**
 * Open the create alert dialog.
 */
export function openCreateAlert(state: AlertSubscriptionState): AlertSubscriptionState {
  return { ...state, createAlertOpen: true };
}

/**
 * Close the create alert dialog.
 */
export function closeCreateAlert(state: AlertSubscriptionState): AlertSubscriptionState {
  return { ...state, createAlertOpen: false };
}

/**
 * Open the create subscription dialog.
 */
export function openCreateSubscription(state: AlertSubscriptionState): AlertSubscriptionState {
  return { ...state, createSubscriptionOpen: true };
}

/**
 * Close the create subscription dialog.
 */
export function closeCreateSubscription(state: AlertSubscriptionState): AlertSubscriptionState {
  return { ...state, createSubscriptionOpen: false };
}

/**
 * Start editing an alert.
 */
export function startEditingAlert(
  state: AlertSubscriptionState,
  alertId: string,
): AlertSubscriptionState {
  return { ...state, editingAlertId: alertId };
}

/**
 * Start editing a subscription.
 */
export function startEditingSubscription(
  state: AlertSubscriptionState,
  subscriptionId: string,
): AlertSubscriptionState {
  return { ...state, editingSubscriptionId: subscriptionId };
}

/**
 * Cancel editing (alert or subscription).
 */
export function cancelEditing(state: AlertSubscriptionState): AlertSubscriptionState {
  return { ...state, editingAlertId: null, editingSubscriptionId: null };
}

// ========================================================================
// Loading / Error
// ========================================================================

/**
 * Set loading state.
 */
export function setAlertSubLoading(
  state: AlertSubscriptionState,
  loading: boolean,
): AlertSubscriptionState {
  return { ...state, loading };
}

/**
 * Set error state.
 */
export function setAlertSubError(
  state: AlertSubscriptionState,
  error: unknown,
): AlertSubscriptionState {
  return { ...state, error, loading: false };
}
