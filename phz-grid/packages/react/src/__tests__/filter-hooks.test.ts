/**
 * @phozart/phz-react — Filter Hooks + Component Tests
 *
 * Tests for useCriteria, useFilterDesigner, PhzPresetAdmin, PhzFilterConfigurator.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Setup ─────────────────────────────────────────────

let stateIndex = 0;
const stateStore: Array<{ value: unknown; setter: Function }> = [];

vi.mock('react', () => {
  const reactMock = {
    useState: (init: unknown) => {
      const idx = stateIndex++;
      if (!stateStore[idx]) {
        const setter = vi.fn((val: unknown) => {
          stateStore[idx].value = typeof val === 'function' ? (val as Function)(stateStore[idx].value) : val;
        });
        stateStore[idx] = { value: init, setter };
      }
      return [stateStore[idx].value, stateStore[idx].setter];
    },
    useEffect: vi.fn(),
    useCallback: (cb: Function, _deps?: unknown[]) => cb,
    useRef: (init: unknown) => ({ current: init }),
    forwardRef: (comp: Function) => comp,
    useImperativeHandle: vi.fn(),
    createElement: vi.fn((..._args: unknown[]) => null),
  };
  return { ...reactMock, default: reactMock };
});

// Provide stub element classes for createComponent()
vi.mock('@phozart/phz-criteria', () => {
  class S {}
  return { PhzPresetAdmin: S, PhzFilterConfigurator: S, PhzSelectionCriteria: S, PhzFilterDesigner: S };
});
vi.mock('@phozart/phz-core', () => ({}));
vi.mock('@phozart/phz-engine', () => ({}));
vi.mock('@lit/react', () => ({
  createComponent: ({ react: R }: any) => (props: any) => R.createElement('div', props),
}));

import { useCriteria } from '../hooks/use-criteria.js';
import { useFilterDesigner } from '../hooks/use-filter-designer.js';
import { PhzPresetAdmin, type PhzPresetAdminProps } from '../phz-preset-admin.js';
import { PhzFilterConfigurator, type PhzFilterConfiguratorProps } from '../phz-filter-configurator.js';
import type { CriteriaApi } from '../phz-selection-criteria.js';
import type { FilterDesignerApi } from '../phz-filter-designer.js';

// ─── Test Helpers ───────────────────────────────────────────

function resetHookState() {
  stateIndex = 0;
  stateStore.length = 0;
}

function createMockCriteriaApi(): CriteriaApi {
  return {
    getContext: vi.fn(() => ({ region: 'EMEA', status: ['active'] })),
    setContext: vi.fn(),
    apply: vi.fn(),
    reset: vi.fn(),
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
  };
}

function createMockDesignerApi(): FilterDesignerApi {
  return {
    getDefinitions: vi.fn(() => [{ id: 'region', label: 'Region', type: 'single_select' }]),
    getRules: vi.fn(() => [{ id: 'r1', type: 'exclude_pattern', enabled: true }]),
  };
}

// ─── useCriteria Tests ──────────────────────────────────────

describe('useCriteria', () => {
  beforeEach(resetHookState);

  it('returns context, getContext, setContext, apply, reset, openDrawer, closeDrawer', () => {
    const criteriaRef = { current: createMockCriteriaApi() };
    const result = useCriteria(criteriaRef);

    expect(result).toHaveProperty('context');
    expect(result).toHaveProperty('getContext');
    expect(result).toHaveProperty('setContext');
    expect(result).toHaveProperty('apply');
    expect(result).toHaveProperty('reset');
    expect(result).toHaveProperty('openDrawer');
    expect(result).toHaveProperty('closeDrawer');
  });

  it('initial context is null', () => {
    const criteriaRef = { current: createMockCriteriaApi() };
    const result = useCriteria(criteriaRef);
    expect(result.context).toBeNull();
  });

  it('getContext delegates to criteriaApi.getContext()', () => {
    const api = createMockCriteriaApi();
    const criteriaRef = { current: api };
    const { getContext } = useCriteria(criteriaRef);

    const ctx = getContext();
    expect(api.getContext).toHaveBeenCalled();
    expect(ctx).toEqual({ region: 'EMEA', status: ['active'] });
  });

  it('setContext delegates to criteriaApi.setContext()', () => {
    const api = createMockCriteriaApi();
    const criteriaRef = { current: api };
    const { setContext } = useCriteria(criteriaRef);

    setContext({ region: 'APAC' });
    expect(api.setContext).toHaveBeenCalledWith({ region: 'APAC' });
  });

  it('apply delegates to criteriaApi.apply()', () => {
    const api = createMockCriteriaApi();
    const criteriaRef = { current: api };
    const { apply } = useCriteria(criteriaRef);

    apply();
    expect(api.apply).toHaveBeenCalled();
  });

  it('reset delegates to criteriaApi.reset()', () => {
    const api = createMockCriteriaApi();
    const criteriaRef = { current: api };
    const { reset } = useCriteria(criteriaRef);

    reset();
    expect(api.reset).toHaveBeenCalled();
  });

  it('openDrawer delegates to criteriaApi.openDrawer()', () => {
    const api = createMockCriteriaApi();
    const criteriaRef = { current: api };
    const { openDrawer } = useCriteria(criteriaRef);

    openDrawer();
    expect(api.openDrawer).toHaveBeenCalled();
  });

  it('closeDrawer delegates to criteriaApi.closeDrawer()', () => {
    const api = createMockCriteriaApi();
    const criteriaRef = { current: api };
    const { closeDrawer } = useCriteria(criteriaRef);

    closeDrawer();
    expect(api.closeDrawer).toHaveBeenCalled();
  });
});

// ─── useCriteria Null Safety ────────────────────────────────

describe('useCriteria null ref safety', () => {
  beforeEach(resetHookState);

  it('with null ref does not throw', () => {
    const criteriaRef = { current: null };
    expect(() => useCriteria(criteriaRef)).not.toThrow();
  });

  it('getContext returns null with null ref', () => {
    const criteriaRef = { current: null };
    const { getContext } = useCriteria(criteriaRef);
    expect(getContext()).toBeNull();
  });

  it('setContext is a no-op with null ref', () => {
    const criteriaRef = { current: null };
    const { setContext } = useCriteria(criteriaRef);
    expect(() => setContext({ region: 'EMEA' })).not.toThrow();
  });

  it('apply is a no-op with null ref', () => {
    const criteriaRef = { current: null };
    const { apply } = useCriteria(criteriaRef);
    expect(() => apply()).not.toThrow();
  });

  it('reset is a no-op with null ref', () => {
    const criteriaRef = { current: null };
    const { reset } = useCriteria(criteriaRef);
    expect(() => reset()).not.toThrow();
  });

  it('openDrawer is a no-op with null ref', () => {
    const criteriaRef = { current: null };
    const { openDrawer } = useCriteria(criteriaRef);
    expect(() => openDrawer()).not.toThrow();
  });

  it('closeDrawer is a no-op with null ref', () => {
    const criteriaRef = { current: null };
    const { closeDrawer } = useCriteria(criteriaRef);
    expect(() => closeDrawer()).not.toThrow();
  });
});

// ─── useFilterDesigner Tests ────────────────────────────────

describe('useFilterDesigner', () => {
  beforeEach(resetHookState);

  it('returns definitions, rules, getDefinitions, getRules', () => {
    const designerRef = { current: createMockDesignerApi() };
    const result = useFilterDesigner(designerRef);

    expect(result).toHaveProperty('definitions');
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('getDefinitions');
    expect(result).toHaveProperty('getRules');
  });

  it('initial definitions is null', () => {
    const designerRef = { current: createMockDesignerApi() };
    const result = useFilterDesigner(designerRef);
    expect(result.definitions).toBeNull();
  });

  it('initial rules is null', () => {
    const designerRef = { current: createMockDesignerApi() };
    const result = useFilterDesigner(designerRef);
    expect(result.rules).toBeNull();
  });

  it('getDefinitions delegates to designerApi.getDefinitions()', () => {
    const api = createMockDesignerApi();
    const designerRef = { current: api };
    const { getDefinitions } = useFilterDesigner(designerRef);

    const defs = getDefinitions();
    expect(api.getDefinitions).toHaveBeenCalled();
    expect(defs).toHaveLength(1);
  });

  it('getRules delegates to designerApi.getRules()', () => {
    const api = createMockDesignerApi();
    const designerRef = { current: api };
    const { getRules } = useFilterDesigner(designerRef);

    const rules = getRules();
    expect(api.getRules).toHaveBeenCalled();
    expect(rules).toHaveLength(1);
  });
});

// ─── useFilterDesigner Null Safety ──────────────────────────

describe('useFilterDesigner null ref safety', () => {
  beforeEach(resetHookState);

  it('with null ref does not throw', () => {
    const designerRef = { current: null };
    expect(() => useFilterDesigner(designerRef)).not.toThrow();
  });

  it('getDefinitions returns null with null ref', () => {
    const designerRef = { current: null };
    const { getDefinitions } = useFilterDesigner(designerRef);
    expect(getDefinitions()).toBeNull();
  });

  it('getRules returns null with null ref', () => {
    const designerRef = { current: null };
    const { getRules } = useFilterDesigner(designerRef);
    expect(getRules()).toBeNull();
  });
});

// ─── PhzPresetAdmin Tests ───────────────────────────────────

describe('PhzPresetAdmin Component', () => {
  it('is defined and is a function', () => {
    expect(PhzPresetAdmin).toBeDefined();
    expect(typeof PhzPresetAdmin).toBe('function');
  });

  it('can be called with props', () => {
    expect(() => PhzPresetAdmin({
      mode: 'cross-filter',
      sharedPresets: [{ id: 'sp1', name: 'Default' }],
    })).not.toThrow();
  });

  it('accepts cross-filter mode props', () => {
    const props: PhzPresetAdminProps = {
      mode: 'cross-filter',
      sharedPresets: [{ id: 'sp1', name: 'Default' }],
      userPresets: [],
      onPresetCreate: vi.fn(),
      onPresetUpdate: vi.fn(),
      onPresetDelete: vi.fn(),
    };
    expect(props.mode).toBe('cross-filter');
    expect(props.onPresetCreate).toBeDefined();
  });

  it('accepts per-filter mode props', () => {
    const props: PhzPresetAdminProps = {
      mode: 'per-filter',
      definitions: [{ id: 'region', label: 'Region', type: 'single_select' }],
      filterPresets: [{ id: 'fp1', filterDefinitionId: 'region', name: 'Default' }],
      dataSources: [],
      data: [{ region: 'EMEA' }],
      onFilterPresetCreate: vi.fn(),
      onFilterPresetUpdate: vi.fn(),
      onFilterPresetDelete: vi.fn(),
      onFilterPresetCopy: vi.fn(),
    };
    expect(props.mode).toBe('per-filter');
    expect(props.definitions).toHaveLength(1);
  });

  it('accepts styling props', () => {
    const props: PhzPresetAdminProps = {
      className: 'preset-admin',
      style: { width: '400px' },
    };
    expect(props.className).toBe('preset-admin');
  });
});

// ─── PhzFilterConfigurator Tests ────────────────────────────

describe('PhzFilterConfigurator Component', () => {
  it('is defined and is a function', () => {
    expect(PhzFilterConfigurator).toBeDefined();
    expect(typeof PhzFilterConfigurator).toBe('function');
  });

  it('can be called with props', () => {
    expect(() => PhzFilterConfigurator({
      definitions: [],
    })).not.toThrow();
  });

  it('accepts all props', () => {
    const props: PhzFilterConfiguratorProps = {
      definitions: [{ id: 'region', label: 'Region' }],
      bindings: [{ filterDefinitionId: 'region', artefactId: 'r1' }],
      artefactId: 'r1',
      artefactName: 'Sales Report',
      availableColumns: ['region', 'status'],
      onBindingAdd: vi.fn(),
      onBindingRemove: vi.fn(),
      onBindingUpdate: vi.fn(),
      onBindingReorder: vi.fn(),
      onOpenDesigner: vi.fn(),
      className: 'configurator',
      style: { height: '500px' },
    };
    expect(props.definitions).toHaveLength(1);
    expect(props.bindings).toHaveLength(1);
    expect(props.artefactId).toBe('r1');
    expect(props.onBindingAdd).toBeDefined();
    expect(props.onOpenDesigner).toBeDefined();
  });
});
