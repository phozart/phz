/**
 * @phozart/phz-editor — Alert & Subscription State (B-2.12)
 *
 * State machine for personal alerts and report subscriptions.
 * Authors can create, edit, and manage their alert thresholds
 * and scheduled report deliveries.
 */
import type { PersonalAlert } from '@phozart/phz-shared/types';
import type { Subscription } from '@phozart/phz-shared/types';
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
export declare function createAlertSubscriptionState(alerts?: PersonalAlert[], subscriptions?: Subscription[]): AlertSubscriptionState;
/**
 * Switch between alerts and subscriptions tabs.
 */
export declare function setAlertSubTab(state: AlertSubscriptionState, tab: 'alerts' | 'subscriptions'): AlertSubscriptionState;
/**
 * Search alerts and subscriptions.
 */
export declare function searchAlertsSubs(state: AlertSubscriptionState, query: string): AlertSubscriptionState;
/**
 * Set the alerts list (e.g. after loading from persistence).
 */
export declare function setAlerts(state: AlertSubscriptionState, alerts: PersonalAlert[]): AlertSubscriptionState;
/**
 * Add a new alert.
 */
export declare function addAlert(state: AlertSubscriptionState, alert: PersonalAlert): AlertSubscriptionState;
/**
 * Update an existing alert.
 */
export declare function updateAlert(state: AlertSubscriptionState, alertId: string, updates: Partial<PersonalAlert>): AlertSubscriptionState;
/**
 * Remove an alert.
 */
export declare function removeAlert(state: AlertSubscriptionState, alertId: string): AlertSubscriptionState;
/**
 * Toggle alert enabled/disabled.
 */
export declare function toggleAlertEnabled(state: AlertSubscriptionState, alertId: string): AlertSubscriptionState;
/**
 * Set the subscriptions list.
 */
export declare function setSubscriptions(state: AlertSubscriptionState, subscriptions: Subscription[]): AlertSubscriptionState;
/**
 * Add a new subscription.
 */
export declare function addSubscription(state: AlertSubscriptionState, subscription: Subscription): AlertSubscriptionState;
/**
 * Update an existing subscription.
 */
export declare function updateSubscription(state: AlertSubscriptionState, subscriptionId: string, updates: Partial<Subscription>): AlertSubscriptionState;
/**
 * Remove a subscription.
 */
export declare function removeSubscription(state: AlertSubscriptionState, subscriptionId: string): AlertSubscriptionState;
/**
 * Toggle subscription enabled/disabled.
 */
export declare function toggleSubscriptionEnabled(state: AlertSubscriptionState, subscriptionId: string): AlertSubscriptionState;
/**
 * Open the create alert dialog.
 */
export declare function openCreateAlert(state: AlertSubscriptionState): AlertSubscriptionState;
/**
 * Close the create alert dialog.
 */
export declare function closeCreateAlert(state: AlertSubscriptionState): AlertSubscriptionState;
/**
 * Open the create subscription dialog.
 */
export declare function openCreateSubscription(state: AlertSubscriptionState): AlertSubscriptionState;
/**
 * Close the create subscription dialog.
 */
export declare function closeCreateSubscription(state: AlertSubscriptionState): AlertSubscriptionState;
/**
 * Start editing an alert.
 */
export declare function startEditingAlert(state: AlertSubscriptionState, alertId: string): AlertSubscriptionState;
/**
 * Start editing a subscription.
 */
export declare function startEditingSubscription(state: AlertSubscriptionState, subscriptionId: string): AlertSubscriptionState;
/**
 * Cancel editing (alert or subscription).
 */
export declare function cancelEditing(state: AlertSubscriptionState): AlertSubscriptionState;
/**
 * Set loading state.
 */
export declare function setAlertSubLoading(state: AlertSubscriptionState, loading: boolean): AlertSubscriptionState;
/**
 * Set error state.
 */
export declare function setAlertSubError(state: AlertSubscriptionState, error: unknown): AlertSubscriptionState;
//# sourceMappingURL=alert-subscription-state.d.ts.map