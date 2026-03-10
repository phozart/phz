/**
 * @phozart/phz-react — PhzFilterDesigner Component Tests
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
  PhzFilterDesigner: class PhzFilterDesigner {},
}));
vi.mock('@phozart/phz-core', () => ({}));
vi.mock('@phozart/phz-engine', () => ({}));

import { PhzFilterDesigner, type PhzFilterDesignerProps, type FilterDesignerApi } from '../phz-filter-designer.js';

// ─── Component Existence Tests ──────────────────────────────

describe('PhzFilterDesigner Component', () => {
  it('is defined and not null', () => {
    expect(PhzFilterDesigner).toBeDefined();
    expect(PhzFilterDesigner).not.toBeNull();
  });

  it('is a function (React component)', () => {
    expect(typeof PhzFilterDesigner).toBe('function');
  });

  it('has forwardRef marker', () => {
    expect((PhzFilterDesigner as any).$$typeof).toBe(Symbol.for('react.forward_ref'));
  });

  it('has display name containing PhzFilterDesigner', () => {
    const name = (PhzFilterDesigner as any).displayName || PhzFilterDesigner.name;
    expect(name).toContain('PhzFilterDesigner');
  });
});

// ─── Props Interface Tests ──────────────────────────────────

describe('PhzFilterDesignerProps', () => {
  it('accepts definitions as required prop', () => {
    const props: PhzFilterDesignerProps = {
      definitions: [{ id: 'region', label: 'Region', type: 'single_select' }],
    };
    expect(props.definitions).toHaveLength(1);
  });

  it('accepts rules, presets, and data', () => {
    const props: PhzFilterDesignerProps = {
      definitions: [],
      rules: [{ id: 'r1', filterDefinitionId: 'region', type: 'exclude_pattern' }],
      sharedPresets: [{ id: 'sp1', name: 'Default' }],
      userPresets: [{ id: 'up1', name: 'My Preset' }],
      data: [{ region: 'EMEA' }],
      availableColumns: ['region', 'status', 'revenue'],
      rulePreviewResults: { r1: { before: 100, after: 85 } },
      dataSources: [{ id: 'ds1', name: 'Sales Data' }],
      filterPresets: [{ id: 'fp1', filterDefinitionId: 'region', name: 'Default' }],
    };
    expect(props.rules).toHaveLength(1);
    expect(props.availableColumns).toHaveLength(3);
  });

  it('accepts definition event handlers', () => {
    const handlers = {
      onDefinitionCreate: vi.fn(),
      onDefinitionUpdate: vi.fn(),
      onDefinitionDeprecate: vi.fn(),
      onDefinitionRestore: vi.fn(),
      onDefinitionDuplicate: vi.fn(),
    };
    const props: PhzFilterDesignerProps = { definitions: [], ...handlers };
    expect(props.onDefinitionCreate).toBe(handlers.onDefinitionCreate);
    expect(props.onDefinitionUpdate).toBe(handlers.onDefinitionUpdate);
    expect(props.onDefinitionDeprecate).toBe(handlers.onDefinitionDeprecate);
  });

  it('accepts rule event handlers', () => {
    const handlers = {
      onRuleAdd: vi.fn(),
      onRuleRemove: vi.fn(),
      onRuleToggle: vi.fn(),
      onRuleUpdate: vi.fn(),
    };
    const props: PhzFilterDesignerProps = { definitions: [], ...handlers };
    expect(props.onRuleAdd).toBe(handlers.onRuleAdd);
    expect(props.onRuleRemove).toBe(handlers.onRuleRemove);
  });

  it('accepts preset event handlers (cross-filter + per-filter)', () => {
    const handlers = {
      onPresetCreate: vi.fn(),
      onPresetUpdate: vi.fn(),
      onPresetDelete: vi.fn(),
      onFilterPresetCreate: vi.fn(),
      onFilterPresetUpdate: vi.fn(),
      onFilterPresetDelete: vi.fn(),
      onFilterPresetCopy: vi.fn(),
    };
    const props: PhzFilterDesignerProps = { definitions: [], ...handlers };
    expect(props.onPresetCreate).toBe(handlers.onPresetCreate);
    expect(props.onFilterPresetCreate).toBe(handlers.onFilterPresetCreate);
  });

  it('accepts styling props', () => {
    const props: PhzFilterDesignerProps = {
      definitions: [],
      className: 'designer',
      style: { height: '600px' },
    };
    expect(props.className).toBe('designer');
  });
});

// ─── FilterDesignerApi Shape Tests ──────────────────────────

describe('FilterDesignerApi interface', () => {
  it('can be satisfied by a mock object', () => {
    const api: FilterDesignerApi = {
      getDefinitions: () => [{ id: 'region', label: 'Region' }],
      getRules: () => [{ id: 'r1', type: 'exclude_pattern' }],
    };
    expect(typeof api.getDefinitions).toBe('function');
    expect(typeof api.getRules).toBe('function');
    expect(api.getDefinitions()).toHaveLength(1);
    expect(api.getRules()).toHaveLength(1);
  });
});

// ─── Component Invocation ───────────────────────────────────

describe('PhzFilterDesigner invocation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('can be called as a function with props and ref', () => {
    const props: PhzFilterDesignerProps = { definitions: [] };
    const ref = { current: null };
    expect(() => (PhzFilterDesigner as Function)(props, ref)).not.toThrow();
  });
});
