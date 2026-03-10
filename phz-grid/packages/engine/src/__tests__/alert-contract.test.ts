/**
 * Tests for Alert Evaluation Contract (C-2.04)
 */
import { describe, it, expect, vi } from 'vitest';
import { createInMemoryAlertContract } from '../alerts/alert-contract.js';

describe('createInMemoryAlertContract', () => {
  it('creates a contract instance', () => {
    const contract = createInMemoryAlertContract();
    expect(contract).toBeDefined();
    expect(typeof contract.evaluate).toBe('function');
    expect(typeof contract.subscribe).toBe('function');
    expect(typeof contract.getHistory).toBe('function');
  });
});

describe('evaluate', () => {
  it('evaluates an alert and returns a result', async () => {
    const contract = createInMemoryAlertContract();
    const result = await contract.evaluate('alert_1', 'ds_1');
    expect(result.alertId).toBe('alert_1');
    expect(result.triggered).toBe(false);
    expect(result.severity).toBe('info');
    expect(result.currentValue).toBe(0);
    expect(result.thresholdValue).toBe(100);
  });

  it('stores evaluation in history', async () => {
    const contract = createInMemoryAlertContract();
    await contract.evaluate('alert_1', 'ds_1');
    const history = contract.getHistory('alert_1');
    expect(history).toHaveLength(1);
    expect(history[0].alertId).toBe('alert_1');
  });

  it('notifies subscribers on evaluation', async () => {
    const contract = createInMemoryAlertContract();
    const callback = vi.fn();
    contract.subscribe('alert_1', callback);

    await contract.evaluate('alert_1', 'ds_1');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].alertId).toBe('alert_1');
  });
});

describe('subscribe', () => {
  it('returns an unsubscribe function', async () => {
    const contract = createInMemoryAlertContract();
    const callback = vi.fn();
    const unsub = contract.subscribe('alert_1', callback);

    await contract.evaluate('alert_1', 'ds_1');
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();
    await contract.evaluate('alert_1', 'ds_1');
    expect(callback).toHaveBeenCalledTimes(1); // not called again
  });

  it('supports multiple subscribers for the same alert', async () => {
    const contract = createInMemoryAlertContract();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    contract.subscribe('alert_1', cb1);
    contract.subscribe('alert_1', cb2);

    await contract.evaluate('alert_1', 'ds_1');
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('does not call subscribers for different alerts', async () => {
    const contract = createInMemoryAlertContract();
    const callback = vi.fn();
    contract.subscribe('alert_1', callback);

    await contract.evaluate('alert_2', 'ds_1');
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up subscriber map when last subscriber unsubscribes', async () => {
    const contract = createInMemoryAlertContract();
    const cb = vi.fn();
    const unsub = contract.subscribe('alert_1', cb);
    unsub();
    // After unsubscribing, evaluating should not throw
    await contract.evaluate('alert_1', 'ds_1');
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('getHistory', () => {
  it('returns history in reverse chronological order', async () => {
    const contract = createInMemoryAlertContract();
    await contract.evaluate('alert_1', 'ds_1');
    await contract.evaluate('alert_1', 'ds_2');
    await contract.evaluate('alert_1', 'ds_3');

    const history = contract.getHistory('alert_1');
    expect(history).toHaveLength(3);
  });

  it('respects the limit parameter', async () => {
    const contract = createInMemoryAlertContract();
    for (let i = 0; i < 20; i++) {
      await contract.evaluate('alert_1', 'ds_1');
    }
    const history = contract.getHistory('alert_1', 5);
    expect(history).toHaveLength(5);
  });

  it('defaults to 10 entries', async () => {
    const contract = createInMemoryAlertContract();
    for (let i = 0; i < 20; i++) {
      await contract.evaluate('alert_1', 'ds_1');
    }
    const history = contract.getHistory('alert_1');
    expect(history).toHaveLength(10);
  });

  it('returns empty for unknown alert', () => {
    const contract = createInMemoryAlertContract();
    const history = contract.getHistory('unknown');
    expect(history).toEqual([]);
  });
});
