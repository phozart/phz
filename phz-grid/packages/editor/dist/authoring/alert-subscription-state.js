/**
 * @phozart/editor — Alert & Subscription State (B-2.12)
 *
 * State machine for personal alerts and report subscriptions.
 * Authors can create, edit, and manage their alert thresholds
 * and scheduled report deliveries.
 */
// ========================================================================
// Internal: filter helpers
// ========================================================================
function filterAlerts(alerts, query) {
    if (!query.trim())
        return alerts;
    const q = query.toLowerCase();
    return alerts.filter(a => a.name.toLowerCase().includes(q) ||
        (a.description?.toLowerCase().includes(q) ?? false));
}
function filterSubscriptions(subs, query) {
    if (!query.trim())
        return subs;
    const q = query.toLowerCase();
    return subs.filter(s => s.artifactId.toLowerCase().includes(q) ||
        s.frequency.toLowerCase().includes(q));
}
// ========================================================================
// Factory
// ========================================================================
export function createAlertSubscriptionState(alerts, subscriptions) {
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
export function setAlertSubTab(state, tab) {
    return { ...state, activeTab: tab };
}
// ========================================================================
// Search
// ========================================================================
/**
 * Search alerts and subscriptions.
 */
export function searchAlertsSubs(state, query) {
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
export function setAlerts(state, alerts) {
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
export function addAlert(state, alert) {
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
export function updateAlert(state, alertId, updates) {
    const alerts = state.alerts.map(a => a.id === alertId ? { ...a, ...updates } : a);
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
export function removeAlert(state, alertId) {
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
export function toggleAlertEnabled(state, alertId) {
    const alerts = state.alerts.map(a => a.id === alertId ? { ...a, enabled: !a.enabled } : a);
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
export function setSubscriptions(state, subscriptions) {
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
export function addSubscription(state, subscription) {
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
export function updateSubscription(state, subscriptionId, updates) {
    const subscriptions = state.subscriptions.map(s => s.id === subscriptionId ? { ...s, ...updates } : s);
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
export function removeSubscription(state, subscriptionId) {
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
export function toggleSubscriptionEnabled(state, subscriptionId) {
    const subscriptions = state.subscriptions.map(s => s.id === subscriptionId ? { ...s, enabled: !s.enabled } : s);
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
export function openCreateAlert(state) {
    return { ...state, createAlertOpen: true };
}
/**
 * Close the create alert dialog.
 */
export function closeCreateAlert(state) {
    return { ...state, createAlertOpen: false };
}
/**
 * Open the create subscription dialog.
 */
export function openCreateSubscription(state) {
    return { ...state, createSubscriptionOpen: true };
}
/**
 * Close the create subscription dialog.
 */
export function closeCreateSubscription(state) {
    return { ...state, createSubscriptionOpen: false };
}
/**
 * Start editing an alert.
 */
export function startEditingAlert(state, alertId) {
    return { ...state, editingAlertId: alertId };
}
/**
 * Start editing a subscription.
 */
export function startEditingSubscription(state, subscriptionId) {
    return { ...state, editingSubscriptionId: subscriptionId };
}
/**
 * Cancel editing (alert or subscription).
 */
export function cancelEditing(state) {
    return { ...state, editingAlertId: null, editingSubscriptionId: null };
}
// ========================================================================
// Loading / Error
// ========================================================================
/**
 * Set loading state.
 */
export function setAlertSubLoading(state, loading) {
    return { ...state, loading };
}
/**
 * Set error state.
 */
export function setAlertSubError(state, error) {
    return { ...state, error, loading: false };
}
//# sourceMappingURL=alert-subscription-state.js.map