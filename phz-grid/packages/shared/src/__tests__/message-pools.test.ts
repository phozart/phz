/**
 * Tests for Message Pools (C-2.13)
 */
import { describe, it, expect } from 'vitest';
import {
  ERROR_MESSAGE_POOLS,
  EMPTY_STATE_MESSAGE_POOLS,
  getRandomMessage,
  getAllMessages,
  getScenarios,
  countMessages,
} from '../types/message-pools.js';
import type { MessagePool, MessageTone } from '../types/message-pools.js';

const TONES: MessageTone[] = ['friendly', 'technical', 'minimal'];

describe('ERROR_MESSAGE_POOLS', () => {
  it('contains at least 13 scenarios', () => {
    const scenarios = getScenarios(ERROR_MESSAGE_POOLS);
    expect(scenarios.length).toBeGreaterThanOrEqual(13);
  });

  it('has 3 tones per scenario', () => {
    const scenarios = getScenarios(ERROR_MESSAGE_POOLS);
    for (const scenario of scenarios) {
      for (const tone of TONES) {
        const pool = ERROR_MESSAGE_POOLS.find(p => p.scenario === scenario && p.tone === tone);
        expect(pool, `Missing ${tone} pool for ${scenario}`).toBeDefined();
      }
    }
  });

  it('has at least 3 messages per pool', () => {
    for (const pool of ERROR_MESSAGE_POOLS) {
      expect(
        pool.messages.length,
        `${pool.scenario}/${pool.tone} has only ${pool.messages.length} messages`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('has no empty messages', () => {
    for (const pool of ERROR_MESSAGE_POOLS) {
      for (const msg of pool.messages) {
        expect(msg.trim().length, `Empty message in ${pool.scenario}/${pool.tone}`).toBeGreaterThan(0);
      }
    }
  });

  it('includes expected error scenarios', () => {
    const scenarios = getScenarios(ERROR_MESSAGE_POOLS);
    expect(scenarios).toContain('network-error');
    expect(scenarios).toContain('auth-expired');
    expect(scenarios).toContain('forbidden');
    expect(scenarios).toContain('not-found');
    expect(scenarios).toContain('server-error');
    expect(scenarios).toContain('query-error');
    expect(scenarios).toContain('parse-error');
    expect(scenarios).toContain('quota-exceeded');
    expect(scenarios).toContain('timeout');
    expect(scenarios).toContain('unknown');
  });

  it('has a total of at least 150 error messages', () => {
    const total = countMessages(ERROR_MESSAGE_POOLS);
    expect(total).toBeGreaterThanOrEqual(150);
  });
});

describe('EMPTY_STATE_MESSAGE_POOLS', () => {
  it('contains at least 9 scenarios', () => {
    const scenarios = getScenarios(EMPTY_STATE_MESSAGE_POOLS);
    expect(scenarios.length).toBeGreaterThanOrEqual(9);
  });

  it('has 3 tones per scenario', () => {
    const scenarios = getScenarios(EMPTY_STATE_MESSAGE_POOLS);
    for (const scenario of scenarios) {
      for (const tone of TONES) {
        const pool = EMPTY_STATE_MESSAGE_POOLS.find(p => p.scenario === scenario && p.tone === tone);
        expect(pool, `Missing ${tone} pool for ${scenario}`).toBeDefined();
      }
    }
  });

  it('has at least 3 messages per pool', () => {
    for (const pool of EMPTY_STATE_MESSAGE_POOLS) {
      expect(
        pool.messages.length,
        `${pool.scenario}/${pool.tone} has only ${pool.messages.length} messages`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('has no empty messages', () => {
    for (const pool of EMPTY_STATE_MESSAGE_POOLS) {
      for (const msg of pool.messages) {
        expect(msg.trim().length, `Empty message in ${pool.scenario}/${pool.tone}`).toBeGreaterThan(0);
      }
    }
  });

  it('includes expected empty scenarios', () => {
    const scenarios = getScenarios(EMPTY_STATE_MESSAGE_POOLS);
    expect(scenarios).toContain('no-data');
    expect(scenarios).toContain('no-results');
    expect(scenarios).toContain('no-access');
    expect(scenarios).toContain('not-configured');
    expect(scenarios).toContain('loading-failed');
    expect(scenarios).toContain('first-time');
    expect(scenarios).toContain('no-selection');
    expect(scenarios).toContain('empty-dashboard');
    expect(scenarios).toContain('no-favorites');
  });

  it('has a total of at least 100 empty state messages', () => {
    const total = countMessages(EMPTY_STATE_MESSAGE_POOLS);
    expect(total).toBeGreaterThanOrEqual(100);
  });
});

describe('getRandomMessage', () => {
  it('returns a message from the correct pool', () => {
    const msg = getRandomMessage('network-error', 'friendly', ERROR_MESSAGE_POOLS);
    const pool = ERROR_MESSAGE_POOLS.find(p => p.scenario === 'network-error' && p.tone === 'friendly');
    expect(pool!.messages).toContain(msg);
  });

  it('returns fallback for unknown scenario', () => {
    const msg = getRandomMessage('nonexistent', 'friendly', ERROR_MESSAGE_POOLS);
    expect(msg).toBe('nonexistent: no message available');
  });

  it('returns fallback for unknown tone', () => {
    const msg = getRandomMessage('network-error', 'nonexistent' as MessageTone, ERROR_MESSAGE_POOLS);
    expect(msg).toContain('no message available');
  });

  it('works with empty state pools', () => {
    const msg = getRandomMessage('no-data', 'minimal', EMPTY_STATE_MESSAGE_POOLS);
    const pool = EMPTY_STATE_MESSAGE_POOLS.find(p => p.scenario === 'no-data' && p.tone === 'minimal');
    expect(pool!.messages).toContain(msg);
  });

  it('returns a different message sometimes (non-deterministic)', () => {
    // Run multiple times and collect messages
    const messages = new Set<string>();
    for (let i = 0; i < 50; i++) {
      messages.add(getRandomMessage('network-error', 'friendly', ERROR_MESSAGE_POOLS));
    }
    // With 5 messages and 50 tries, probability of getting only 1 is negligible
    expect(messages.size).toBeGreaterThan(1);
  });

  it('handles empty messages array', () => {
    const pools: MessagePool[] = [{ scenario: 'test', tone: 'friendly', messages: [] }];
    const msg = getRandomMessage('test', 'friendly', pools);
    expect(msg).toBe('test: no message available');
  });
});

describe('getAllMessages', () => {
  it('returns all messages grouped by tone', () => {
    const result = getAllMessages('network-error', ERROR_MESSAGE_POOLS);
    expect(result.friendly.length).toBeGreaterThan(0);
    expect(result.technical.length).toBeGreaterThan(0);
    expect(result.minimal.length).toBeGreaterThan(0);
  });

  it('returns empty arrays for unknown scenario', () => {
    const result = getAllMessages('nonexistent', ERROR_MESSAGE_POOLS);
    expect(result.friendly).toEqual([]);
    expect(result.technical).toEqual([]);
    expect(result.minimal).toEqual([]);
  });

  it('returns copies of arrays (not references)', () => {
    const result1 = getAllMessages('network-error', ERROR_MESSAGE_POOLS);
    const result2 = getAllMessages('network-error', ERROR_MESSAGE_POOLS);
    expect(result1.friendly).not.toBe(result2.friendly);
    expect(result1.friendly).toEqual(result2.friendly);
  });
});

describe('getScenarios', () => {
  it('returns sorted unique scenario names', () => {
    const scenarios = getScenarios(ERROR_MESSAGE_POOLS);
    const sorted = [...scenarios].sort();
    expect(scenarios).toEqual(sorted);
    // No duplicates
    const unique = new Set(scenarios);
    expect(unique.size).toBe(scenarios.length);
  });
});

describe('countMessages', () => {
  it('counts all messages across pools', () => {
    const count = countMessages(ERROR_MESSAGE_POOLS);
    // 13 scenarios x 3 tones x ~5 messages = ~195
    expect(count).toBeGreaterThanOrEqual(150);
  });

  it('returns 0 for empty pools', () => {
    expect(countMessages([])).toBe(0);
  });
});
