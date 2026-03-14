/**
 * @phozart/react — PhzGrid Component Tests
 *
 * Tests for the PhzGrid React component that wraps the <phz-grid> Web Component
 * via @lit/react's createComponent(). Since we cannot render React in Node,
 * these tests focus on structural validation: exports, component shape,
 * prop interface, and event-wrapping logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so it's available inside vi.mock factories (which are hoisted)
const { createElementSpy } = vi.hoisted(() => ({
  createElementSpy: vi.fn((..._args: unknown[]) => null),
}));

// Mock React before importing the component
vi.mock('react', () => {
  const forwardRefImpl = (renderFn: Function) => {
    const component = renderFn;
    (component as any).$$typeof = Symbol.for('react.forward_ref');
    (component as any).displayName = renderFn.name || 'ForwardRef';
    return component;
  };

  const mod = {
    createElement: createElementSpy,
    forwardRef: forwardRefImpl,
    useRef: (init: unknown) => ({ current: init }),
    useEffect: vi.fn(),
    useCallback: (fn: Function) => fn,
    useImperativeHandle: vi.fn(),
  };

  return { ...mod, default: mod };
});

// Mock @lit/react createComponent to return a simple stand-in
vi.mock('@lit/react', () => ({
  createComponent: (opts: any) => {
    const component = function LitWrapper(_props: any) {
      return null;
    };
    (component as any).__litTagName = opts.tagName;
    (component as any).__litEvents = opts.events;
    (component as any).__litElementClass = opts.elementClass;
    return component;
  },
}));

// Mock @phozart/grid to provide a stub PhzGrid class
vi.mock('@phozart/grid', () => ({
  PhzGrid: class PhzGridStub {
    getGridApi() {
      return null;
    }
  },
}));

// Mock @phozart/core types
vi.mock('@phozart/core', () => ({}));

import { PhzGrid, type PhzGridProps } from '../phz-grid.js';

// ---- Component Existence Tests ----

describe('PhzGrid Component', () => {
  it('is defined and not null', () => {
    expect(PhzGrid).toBeDefined();
    expect(PhzGrid).not.toBeNull();
  });

  it('is a function (React component)', () => {
    expect(typeof PhzGrid).toBe('function');
  });

  it('has a display name or function name', () => {
    const name =
      (PhzGrid as any).displayName ||
      (PhzGrid as any).name ||
      PhzGrid.name;
    expect(name).toBeTruthy();
    expect(name).toContain('PhzGrid');
  });

  it('has forwardRef marker ($$typeof)', () => {
    expect((PhzGrid as any).$$typeof).toBe(Symbol.for('react.forward_ref'));
  });
});

// ---- Props Interface Tests ----

describe('PhzGridProps type interface', () => {
  it('accepts data and columns as required props', () => {
    const props: PhzGridProps = {
      data: [{ id: 1, name: 'Alice' }],
      columns: [{ field: 'name', header: 'Name', type: 'string' }],
    };
    expect(props.data).toHaveLength(1);
    expect(props.columns).toHaveLength(1);
  });

  it('accepts all optional display props', () => {
    const props: PhzGridProps = {
      data: [],
      columns: [],
      theme: 'dark',
      locale: 'en-US',
      responsive: true,
      virtualization: true,
      selectionMode: 'multi',
      editMode: 'click',
      loading: false,
      height: 500,
      width: '100%',
      className: 'my-grid',
      style: { border: '1px solid #ccc' },
    };
    expect(props.theme).toBe('dark');
    expect(props.selectionMode).toBe('multi');
    expect(props.editMode).toBe('click');
    expect(props.height).toBe(500);
    expect(props.width).toBe('100%');
  });

  it('accepts event handler props', () => {
    const handlers = {
      onGridReady: vi.fn(),
      onStateChange: vi.fn(),
      onCellClick: vi.fn(),
      onCellDoubleClick: vi.fn(),
      onSelectionChange: vi.fn(),
      onSortChange: vi.fn(),
      onFilterChange: vi.fn(),
      onEditStart: vi.fn(),
      onEditCommit: vi.fn(),
      onEditCancel: vi.fn(),
      onScroll: vi.fn(),
    };

    const props: PhzGridProps = {
      data: [],
      columns: [],
      ...handlers,
    };

    expect(props.onGridReady).toBe(handlers.onGridReady);
    expect(props.onCellClick).toBe(handlers.onCellClick);
    expect(props.onSelectionChange).toBe(handlers.onSelectionChange);
    expect(props.onSortChange).toBe(handlers.onSortChange);
    expect(props.onFilterChange).toBe(handlers.onFilterChange);
    expect(props.onEditStart).toBe(handlers.onEditStart);
    expect(props.onEditCommit).toBe(handlers.onEditCommit);
    expect(props.onEditCancel).toBe(handlers.onEditCancel);
    expect(props.onScroll).toBe(handlers.onScroll);
    expect(props.onStateChange).toBe(handlers.onStateChange);
    expect(props.onCellDoubleClick).toBe(handlers.onCellDoubleClick);
  });

  it('accepts extended event handler props', () => {
    const props: PhzGridProps = {
      data: [],
      columns: [],
      onRowAction: vi.fn(),
      onDrillThrough: vi.fn(),
      onCopy: vi.fn(),
      onGenerateDashboard: vi.fn(),
      onVirtualScroll: vi.fn(),
      onRemoteDataLoad: vi.fn(),
      onRemoteDataError: vi.fn(),
      onAdminSettings: vi.fn(),
    };
    expect(props.onRowAction).toBeDefined();
    expect(props.onDrillThrough).toBeDefined();
    expect(props.onCopy).toBeDefined();
    expect(props.onGenerateDashboard).toBeDefined();
    expect(props.onVirtualScroll).toBeDefined();
    expect(props.onRemoteDataLoad).toBeDefined();
    expect(props.onRemoteDataError).toBeDefined();
    expect(props.onAdminSettings).toBeDefined();
  });

  it('accepts slot props (header, footer, emptyState, loadingIndicator, toolbar)', () => {
    const props: PhzGridProps = {
      data: [],
      columns: [],
      header: 'Header content' as any,
      footer: 'Footer content' as any,
      emptyState: 'No data' as any,
      loadingIndicator: 'Loading...' as any,
      toolbar: 'Toolbar' as any,
      children: 'Children' as any,
    };
    expect(props.header).toBe('Header content');
    expect(props.footer).toBe('Footer content');
    expect(props.emptyState).toBe('No data');
    expect(props.loadingIndicator).toBe('Loading...');
    expect(props.toolbar).toBe('Toolbar');
    expect(props.children).toBe('Children');
  });
});

// ---- Selection Mode and Edit Mode Enum Tests ----

describe('PhzGridProps enum constraints', () => {
  it('selectionMode accepts all valid values', () => {
    const modes: PhzGridProps['selectionMode'][] = ['none', 'single', 'multi', 'range'];
    modes.forEach((mode) => {
      const props: PhzGridProps = { data: [], columns: [], selectionMode: mode };
      expect(props.selectionMode).toBe(mode);
    });
  });

  it('editMode accepts all valid values', () => {
    const modes: PhzGridProps['editMode'][] = ['none', 'click', 'dblclick', 'manual'];
    modes.forEach((mode) => {
      const props: PhzGridProps = { data: [], columns: [], editMode: mode };
      expect(props.editMode).toBe(mode);
    });
  });
});

// ---- Component Invocation Shape ----

describe('PhzGrid invocation', () => {
  beforeEach(() => {
    createElementSpy.mockClear();
  });

  it('can be called as a function with props and ref', () => {
    const props: PhzGridProps = {
      data: [{ id: 1 }],
      columns: [{ field: 'id', header: 'ID', type: 'number' }],
    };
    const ref = { current: null };

    expect(() => (PhzGrid as Function)(props, ref)).not.toThrow();
  });

  it('renders using PhzGridLit (createElement called with component)', () => {
    const props: PhzGridProps = {
      data: [{ id: 1 }],
      columns: [{ field: 'id', header: 'ID', type: 'number' }],
    };
    const ref = { current: null };

    (PhzGrid as Function)(props, ref);

    expect(createElementSpy).toHaveBeenCalled();
    const firstCallArgs = createElementSpy.mock.calls[0];
    // First arg is the PhzGridLit component (a function with __litTagName)
    expect(typeof firstCallArgs[0]).toBe('function');
    expect(firstCallArgs[0].__litTagName).toBe('phz-grid');
  });
});

// ---- Event Wrapping Tests ----

describe('PhzGrid event wrapping', () => {
  beforeEach(() => {
    createElementSpy.mockClear();
  });

  it('wraps onCellClick to extract .detail from CustomEvent', () => {
    const onCellClick = vi.fn();
    const props: PhzGridProps = {
      data: [],
      columns: [],
      onCellClick,
    };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];

    // The onCellClick should be a wrapper function, not the original
    expect(elementProps.onCellClick).not.toBe(onCellClick);
    expect(typeof elementProps.onCellClick).toBe('function');

    // Simulate the wrapper receiving a CustomEvent
    const mockDetail = { rowIndex: 0, colIndex: 1, field: 'name', value: 'Alice' };
    elementProps.onCellClick({ detail: mockDetail } as CustomEvent);

    expect(onCellClick).toHaveBeenCalledWith(mockDetail);
  });

  it('wraps onGridReady to capture gridInstance and call user handler', () => {
    const onGridReady = vi.fn();
    const props: PhzGridProps = {
      data: [],
      columns: [],
      onGridReady,
    };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];

    const mockApi = { getData: vi.fn() };
    elementProps.onGridReady({ detail: { gridInstance: mockApi } } as CustomEvent);

    expect(onGridReady).toHaveBeenCalledWith(mockApi);
  });

  it('does not pass undefined event handlers to element (except onGridReady)', () => {
    const props: PhzGridProps = {
      data: [],
      columns: [],
    };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];

    expect(elementProps.onCellClick).toBeUndefined();
    expect(elementProps.onStateChange).toBeUndefined();
    expect(elementProps.onSortChange).toBeUndefined();
    expect(elementProps.onFilterChange).toBeUndefined();
    // onGridReady is always present because it captures GridApi for ref
    expect(elementProps.onGridReady).toBeDefined();
  });

  it('wraps all typed event handlers to extract detail', () => {
    const handlers = {
      onStateChange: vi.fn(),
      onSelectionChange: vi.fn(),
      onSortChange: vi.fn(),
      onFilterChange: vi.fn(),
      onEditStart: vi.fn(),
      onEditCommit: vi.fn(),
      onEditCancel: vi.fn(),
      onScroll: vi.fn(),
      onRowAction: vi.fn(),
      onDrillThrough: vi.fn(),
      onCopy: vi.fn(),
      onVirtualScroll: vi.fn(),
    };

    const props: PhzGridProps = { data: [], columns: [], ...handlers };
    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];

    // Each event handler should be wrapped (not the same reference)
    for (const [key, handler] of Object.entries(handlers)) {
      expect(elementProps[key]).not.toBe(handler);
      expect(typeof elementProps[key]).toBe('function');

      // Call the wrapper and verify it extracts detail
      const detail = { test: key };
      elementProps[key]({ detail } as CustomEvent);
      expect(handler).toHaveBeenCalledWith(detail);
    }
  });
});

// ---- Height/Width Mapping Tests ----

describe('PhzGrid height/width prop mapping', () => {
  beforeEach(() => {
    createElementSpy.mockClear();
  });

  it('converts numeric height to gridHeight with px suffix', () => {
    const props: PhzGridProps = { data: [], columns: [], height: 500 };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];
    expect(elementProps.gridHeight).toBe('500px');
  });

  it('passes string height as gridHeight unchanged', () => {
    const props: PhzGridProps = { data: [], columns: [], height: '100vh' };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];
    expect(elementProps.gridHeight).toBe('100vh');
  });

  it('converts numeric width to gridWidth with px suffix', () => {
    const props: PhzGridProps = { data: [], columns: [], width: 800 };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];
    expect(elementProps.gridWidth).toBe('800px');
  });

  it('passes string width as gridWidth unchanged', () => {
    const props: PhzGridProps = { data: [], columns: [], width: '100%' };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];
    expect(elementProps.gridWidth).toBe('100%');
  });

  it('omits gridHeight/gridWidth when height/width are not provided', () => {
    const props: PhzGridProps = { data: [], columns: [] };

    (PhzGrid as Function)(props, { current: null });

    const elementProps = createElementSpy.mock.calls[0][1];
    expect(elementProps.gridHeight).toBeUndefined();
    expect(elementProps.gridWidth).toBeUndefined();
  });
});

// ---- Slot Children Tests ----

describe('PhzGrid slot rendering', () => {
  beforeEach(() => {
    createElementSpy.mockClear();
  });

  it('passes slot children as additional createElement args', () => {
    const props: PhzGridProps = {
      data: [],
      columns: [],
      toolbar: 'Toolbar' as any,
      header: 'Header' as any,
      footer: 'Footer' as any,
    };

    (PhzGrid as Function)(props, { current: null });

    expect(createElementSpy).toHaveBeenCalled();
    // Main createElement call should have slot args after elementProps
    const mainCall = createElementSpy.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function' && call[0].__litTagName === 'phz-grid',
    );
    expect(mainCall).toBeDefined();
  });
});
