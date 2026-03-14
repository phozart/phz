/**
 * @phozart/engine — Alert Evaluation Contract (C-2.04)
 *
 * Defines the contract between alert definitions and their evaluation.
 * This is an SPI that consumer applications implement to provide
 * alert evaluation, subscription, and history retrieval.
 *
 * The contract includes a default in-memory implementation for testing.
 */

import type { AlertEvaluationResult } from './personal-alert-engine.js';

// ========================================================================
// AlertEvaluationContract
// ========================================================================

/**
 * Contract for alert evaluation. Implementations may be backed by
 * server-side evaluation, local polling, or a combination.
 */
export interface AlertEvaluationContract {
  /**
   * Evaluate a single alert against its data source.
   * Returns the evaluation result (triggered/not, severity, values).
   */
  evaluate(alertId: string, dataSourceId: string): Promise<AlertEvaluationResult>;

  /**
   * Subscribe to evaluation results for an alert.
   * The callback is invoked each time the alert is re-evaluated.
   * Returns an unsubscribe function.
   */
  subscribe(alertId: string, callback: (result: AlertEvaluationResult) => void): () => void;

  /**
   * Get the evaluation history for an alert.
   *
   * @param alertId - The alert to retrieve history for.
   * @param limit - Maximum number of results to return (defaults to 10).
   */
  getHistory(alertId: string, limit?: number): AlertEvaluationResult[];
}

// ========================================================================
// In-memory implementation (for testing and local playground)
// ========================================================================

/**
 * Create an in-memory AlertEvaluationContract implementation.
 * Useful for tests and the local playground.
 */
export function createInMemoryAlertContract(): AlertEvaluationContract {
  const history = new Map<string, AlertEvaluationResult[]>();
  const subscribers = new Map<string, Set<(result: AlertEvaluationResult) => void>>();

  return {
    async evaluate(alertId: string, _dataSourceId: string): Promise<AlertEvaluationResult> {
      const result: AlertEvaluationResult = {
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

    subscribe(alertId: string, callback: (result: AlertEvaluationResult) => void): () => void {
      let subs = subscribers.get(alertId);
      if (!subs) {
        subs = new Set();
        subscribers.set(alertId, subs);
      }
      subs.add(callback);

      return () => {
        subs!.delete(callback);
        if (subs!.size === 0) {
          subscribers.delete(alertId);
        }
      };
    },

    getHistory(alertId: string, limit?: number): AlertEvaluationResult[] {
      const alertHistory = history.get(alertId) ?? [];
      const n = limit ?? 10;
      // Return most recent entries first
      return alertHistory.slice(-n).reverse();
    },
  };
}
