/**
 * @phozart/engine — Alert Evaluation Contract (C-2.04)
 *
 * Defines the contract between alert definitions and their evaluation.
 * This is an SPI that consumer applications implement to provide
 * alert evaluation, subscription, and history retrieval.
 *
 * The contract includes a default in-memory implementation for testing.
 */
// ========================================================================
// In-memory implementation (for testing and local playground)
// ========================================================================
/**
 * Create an in-memory AlertEvaluationContract implementation.
 * Useful for tests and the local playground.
 */
export function createInMemoryAlertContract() {
    const history = new Map();
    const subscribers = new Map();
    return {
        async evaluate(alertId, _dataSourceId) {
            const result = {
                alertId,
                triggered: false,
                severity: 'info',
                currentValue: 0,
                thresholdValue: 100,
                message: `Alert ${alertId}: no data available`,
                withinGracePeriod: false,
            };
            // Store in history
            const alertHistory = history.get(alertId) ?? [];
            alertHistory.push(result);
            history.set(alertId, alertHistory);
            // Notify subscribers
            const subs = subscribers.get(alertId);
            if (subs) {
                for (const cb of subs) {
                    cb(result);
                }
            }
            return result;
        },
        subscribe(alertId, callback) {
            let subs = subscribers.get(alertId);
            if (!subs) {
                subs = new Set();
                subscribers.set(alertId, subs);
            }
            subs.add(callback);
            return () => {
                subs.delete(callback);
                if (subs.size === 0) {
                    subscribers.delete(alertId);
                }
            };
        },
        getHistory(alertId, limit) {
            const alertHistory = history.get(alertId) ?? [];
            const n = limit ?? 10;
            // Return most recent entries first
            return alertHistory.slice(-n).reverse();
        },
    };
}
//# sourceMappingURL=alert-contract.js.map