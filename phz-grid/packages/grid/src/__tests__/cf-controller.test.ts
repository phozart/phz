import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConditionalFormattingController, type ConditionalFormattingHost } from '../controllers/conditional-formatting.controller.js';

vi.mock('../features/conditional-formatting.js', () => ({
  createConditionalFormattingEngine: () => ({
    addRule: vi.fn(),
    clearRules: vi.fn(),
    evaluate: vi.fn(() => ({ backgroundColor: '#f00', color: '#fff' })),
  }),
}));

vi.mock('../features/anomaly-detector.js', () => ({
  detectAnomalies: vi.fn(() => [
    { rowId: 'r1', field: 'score', value: 999, score: 3.2, type: 'outlier', reason: 'Z-score > 3' },
    { rowId: 'r2', field: 'score', value: 10, score: 0.1, type: 'format', reason: 'Normal value' },
  ]),
}));

function makeHost(overrides?: Partial<ConditionalFormattingHost>): ConditionalFormattingHost {
  return {
    visibleRows: [
      { __id: 'r1', score: 999 },
      { __id: 'r2', score: 10 },
    ] as any[],
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

describe('ConditionalFormattingController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('implements ReactiveController lifecycle', () => {
    const host = makeHost();
    const ctrl = new ConditionalFormattingController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
    ctrl.hostConnected();
    ctrl.hostDisconnected();
  });

  describe('addFormattingRule / removeFormattingRule', () => {
    it('delegates addRule to the engine', () => {
      const host = makeHost();
      const ctrl = new ConditionalFormattingController(host);
      const rule = { field: 'score', operator: 'gt', value: 100, style: { backgroundColor: '#f00' } };
      ctrl.addFormattingRule(rule as any);
      expect(ctrl.cfEngine.addRule).toHaveBeenCalledWith(rule);
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it('replaces all rules via setRules', () => {
      const host = makeHost();
      const ctrl = new ConditionalFormattingController(host);
      const rules = [{ field: 'x', operator: 'gt', value: 0, style: {} }];
      ctrl.setRules(rules as any[]);
      expect(ctrl.cfEngine.clearRules).toHaveBeenCalled();
      expect(ctrl.cfEngine.addRule).toHaveBeenCalledWith(rules[0]);
    });
  });

  describe('getCellConditionalStyle', () => {
    it('delegates to cfEngine.evaluate', () => {
      const host = makeHost();
      const ctrl = new ConditionalFormattingController(host);
      const result = ctrl.getCellConditionalStyle(999, 'score', { __id: 'r1' } as any);
      expect(ctrl.cfEngine.evaluate).toHaveBeenCalledWith(999, 'score', { __id: 'r1' });
      expect(result).toEqual({ backgroundColor: '#f00', color: '#fff' });
    });
  });

  describe('anomaly detection', () => {
    it('runs anomaly detection and populates lookup', () => {
      const host = makeHost();
      const ctrl = new ConditionalFormattingController(host);
      ctrl.runAnomalyDetection('score');

      expect(ctrl.anomalies.has('score')).toBe(true);
      expect(ctrl.anomalies.get('score')).toHaveLength(2);
      expect(ctrl.isAnomalous('r1', 'score')).toBe(true);
      expect(ctrl.isAnomalous('r2', 'score')).toBe(false);
    });

    it('getAnomalyResult returns the anomaly for a cell', () => {
      const host = makeHost();
      const ctrl = new ConditionalFormattingController(host);
      ctrl.runAnomalyDetection('score');

      const a = ctrl.getAnomalyResult('r1', 'score');
      expect(a?.type).toBe('outlier');
      expect(a?.score).toBe(3.2);
    });
  });
});
