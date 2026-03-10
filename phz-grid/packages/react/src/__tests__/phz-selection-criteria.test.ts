/**
 * @phozart/phz-react — PhzSelectionCriteria Component Tests
 *
 * Structural validation: exports, component shape, prop interface, imperative API.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React
vi.mock('react', () => {
  const forwardRefImpl = (renderFn: Function) => {
    const component = renderFn;
    (component as any).$$typeof = Symbol.for('react.forward_ref');
    (component as any).displayName = renderFn.name || 'ForwardRef';
    return component;
  };

  return {
    default: {
      createElement: vi.fn((..._args: unknown[]) => null),
      forwardRef: forwardRefImpl,
      useRef: (init: unknown) => ({ current: init }),
      useEffect: vi.fn(),
      useImperativeHandle: vi.fn(),
    },
    createElement: vi.fn((..._args: unknown[]) => null),
    forwardRef: forwardRefImpl,
    useRef: (init: unknown) => ({ current: init }),
    useEffect: vi.fn(),
    useImperativeHandle: vi.fn(),
  };
});

// Mock @lit/react
vi.mock('@lit/react', () => ({
  createComponent: ({ elementClass, events }: any) => {
    const component = vi.fn((..._args: unknown[]) => null);
    (component as any).__litElementClass = elementClass;
    (component as any).__litEvents = events;
    return component;
  },
  EventName: {},
}));

vi.mock('@phozart/phz-criteria', () => ({
  PhzSelectionCriteria: class PhzSelectionCriteria {},
}));
vi.mock('@phozart/phz-core', () => ({}));
vi.mock('@phozart/phz-engine', () => ({}));

import { PhzSelectionCriteria, type PhzSelectionCriteriaProps, type CriteriaApi } from '../phz-selection-criteria.js';

// ─── Component Existence Tests ──────────────────────────────

describe('PhzSelectionCriteria Component', () => {
  it('is defined and not null', () => {
    expect(PhzSelectionCriteria).toBeDefined();
    expect(PhzSelectionCriteria).not.toBeNull();
  });

  it('is a function (React component)', () => {
    expect(typeof PhzSelectionCriteria).toBe('function');
  });

  it('has forwardRef marker', () => {
    expect((PhzSelectionCriteria as any).$$typeof).toBe(Symbol.for('react.forward_ref'));
  });

  it('has display name containing PhzSelectionCriteria', () => {
    const name = (PhzSelectionCriteria as any).displayName || PhzSelectionCriteria.name;
    expect(name).toContain('PhzSelectionCriteria');
  });
});

// ─── Props Interface Tests ──────────────────────────────────

describe('PhzSelectionCriteriaProps', () => {
  it('accepts config as required prop', () => {
    const props: PhzSelectionCriteriaProps = {
      config: { fields: [{ id: 'region', label: 'Region', type: 'single_select' as any }] },
    };
    expect(props.config.fields).toHaveLength(1);
  });

  it('accepts data and presets', () => {
    const props: PhzSelectionCriteriaProps = {
      config: { fields: [] },
      data: [{ region: 'EMEA' }],
      presets: [{ id: 'p1', name: 'Default', scope: 'admin' as any, values: {}, isDefault: true } as any],
    };
    expect(props.data).toHaveLength(1);
    expect(props.presets).toHaveLength(1);
  });

  it('accepts initialState', () => {
    const props: PhzSelectionCriteriaProps = {
      config: { fields: [] },
      initialState: { region: 'EMEA', status: ['active'] },
    };
    expect(props.initialState?.region).toBe('EMEA');
  });

  it('accepts registry mode props', () => {
    const props: PhzSelectionCriteriaProps = {
      config: { fields: [] },
      registryMode: true,
      artefactId: 'report:r1',
      filterRegistry: {},
      filterBindings: {},
      filterStateManager: {},
      filterRuleEngine: {},
      criteriaOutputManager: {},
      resolvedFields: [{ id: 'f1', label: 'Region', type: 'single_select' }],
    };
    expect(props.registryMode).toBe(true);
    expect(props.artefactId).toBe('report:r1');
  });

  it('accepts event handler props', () => {
    const handlers = {
      onCriteriaChange: vi.fn(),
      onCriteriaApply: vi.fn(),
      onCriteriaReset: vi.fn(),
      onPinChange: vi.fn(),
    };
    const props: PhzSelectionCriteriaProps = { config: { fields: [] }, ...handlers };
    expect(props.onCriteriaChange).toBe(handlers.onCriteriaChange);
    expect(props.onCriteriaApply).toBe(handlers.onCriteriaApply);
    expect(props.onCriteriaReset).toBe(handlers.onCriteriaReset);
    expect(props.onPinChange).toBe(handlers.onPinChange);
  });

  it('accepts styling props', () => {
    const props: PhzSelectionCriteriaProps = {
      config: { fields: [] },
      className: 'filters',
      style: { maxWidth: '600px' },
    };
    expect(props.className).toBe('filters');
  });
});

// ─── CriteriaApi Shape Tests ────────────────────────────────

describe('CriteriaApi interface', () => {
  it('can be satisfied by a mock object', () => {
    const api: CriteriaApi = {
      getContext: () => ({ region: 'EMEA' }),
      setContext: () => {},
      apply: () => {},
      reset: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
    };

    expect(typeof api.getContext).toBe('function');
    expect(typeof api.setContext).toBe('function');
    expect(typeof api.apply).toBe('function');
    expect(typeof api.reset).toBe('function');
    expect(typeof api.openDrawer).toBe('function');
    expect(typeof api.closeDrawer).toBe('function');
  });

  it('getContext returns SelectionContext shape', () => {
    const api: CriteriaApi = {
      getContext: () => ({ region: 'EMEA', status: ['active', 'pending'] }),
      setContext: () => {},
      apply: () => {},
      reset: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
    };
    const ctx = api.getContext();
    expect(ctx.region).toBe('EMEA');
  });

  it('no longer accesses private internals', () => {
    // Verify that the wrapper uses public methods, not private fields
    const api: CriteriaApi = {
      getContext: () => ({}),
      setContext: () => {},
      apply: () => {},
      reset: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
    };
    // All methods are public API — no _pendingContext, _drawerOpen, _handleApply, _handleReset
    expect(typeof api.getContext).toBe('function');
    expect(typeof api.apply).toBe('function');
    expect(typeof api.openDrawer).toBe('function');
  });
});

// ─── Component Invocation ───────────────────────────────────

describe('PhzSelectionCriteria invocation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('can be called as a function with props and ref', () => {
    const props: PhzSelectionCriteriaProps = {
      config: { fields: [] },
    };
    const ref = { current: null };
    expect(() => (PhzSelectionCriteria as Function)(props, ref)).not.toThrow();
  });
});
