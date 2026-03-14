/**
 * @phozart/react — PhzGridAdmin Component Tests
 *
 * Tests for the PhzGridAdmin React component that wraps the <phz-grid-admin> Web Component.
 * Structural validation: exports, component shape, prop interface, imperative API shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React before importing the component
vi.mock('react', () => {
  const forwardRefImpl = (renderFn: Function) => {
    const component = renderFn;
    (component as any).$$typeof = Symbol.for('react.forward_ref');
    (component as any).displayName = renderFn.name || 'ForwardRef';
    return component;
  };

  let imperativeHandleFactory: Function | null = null;

  return {
    default: {
      createElement: vi.fn((..._args: unknown[]) => null),
      forwardRef: forwardRefImpl,
      useRef: (init: unknown) => ({ current: init }),
      useEffect: vi.fn(),
      useImperativeHandle: vi.fn((_ref: unknown, factory: Function) => {
        imperativeHandleFactory = factory;
      }),
    },
    createElement: vi.fn((..._args: unknown[]) => null),
    forwardRef: forwardRefImpl,
    useRef: (init: unknown) => ({ current: init }),
    useEffect: vi.fn(),
    useImperativeHandle: vi.fn((_ref: unknown, factory: Function) => {
      imperativeHandleFactory = factory;
    }),
    __getImperativeFactory: () => imperativeHandleFactory,
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

// Mock side-effect imports
vi.mock('@phozart/grid-admin', () => ({
  PhzGridAdmin: class PhzGridAdmin {},
}));
vi.mock('@phozart/core', () => ({}));
vi.mock('@phozart/engine', () => ({}));

import { PhzGridAdmin, type PhzGridAdminProps, type GridAdminApi } from '../phz-grid-admin.js';

// ─── Component Existence Tests ──────────────────────────────

describe('PhzGridAdmin Component', () => {
  it('is defined and not null', () => {
    expect(PhzGridAdmin).toBeDefined();
    expect(PhzGridAdmin).not.toBeNull();
  });

  it('is a function (React component)', () => {
    expect(typeof PhzGridAdmin).toBe('function');
  });

  it('has a display name or function name', () => {
    const name =
      (PhzGridAdmin as any).displayName ||
      (PhzGridAdmin as any).name ||
      PhzGridAdmin.name;
    expect(name).toBeTruthy();
    expect(name).toContain('PhzGridAdmin');
  });

  it('has forwardRef marker ($$typeof)', () => {
    expect((PhzGridAdmin as any).$$typeof).toBe(Symbol.for('react.forward_ref'));
  });
});

// ─── Props Interface Tests ──────────────────────────────────

describe('PhzGridAdminProps type interface', () => {
  it('accepts all visibility props', () => {
    const props: PhzGridAdminProps = {
      open: true,
      mode: 'edit',
    };
    expect(props.open).toBe(true);
    expect(props.mode).toBe('edit');
  });

  it('accepts report identity props', () => {
    const props: PhzGridAdminProps = {
      reportId: 'report-1',
      reportName: 'Sales Report',
      reportDescription: 'Monthly sales data',
      reportCreated: 1709000000,
      reportUpdated: 1709100000,
      reportCreatedBy: 'admin',
      availableReports: [{ id: 'r2', name: 'Other Report' }],
    };
    expect(props.reportId).toBe('report-1');
    expect(props.reportName).toBe('Sales Report');
    expect(props.availableReports).toHaveLength(1);
  });

  it('accepts column config props', () => {
    const props: PhzGridAdminProps = {
      columns: [{ field: 'name', header: 'Name' }],
      fields: ['name', 'age'],
      columnTypes: { name: 'string', age: 'number' },
      columnFormatting: { name: { bold: true } },
      numberFormats: { age: { decimals: 0 } },
      statusColors: { active: { bg: '#green', color: '#white', dot: '#green' } },
      barThresholds: [{ min: 80, color: '#green' }],
      dateFormats: { created: 'dd/mm/yyyy' },
      linkTemplates: { url: '{value}' },
    };
    expect(props.columns).toHaveLength(1);
    expect(props.fields).toHaveLength(2);
  });

  it('accepts settings and formatting props', () => {
    const props: PhzGridAdminProps = {
      tableSettings: { density: 'compact' },
      formattingRules: [{ id: 'r1', field: 'status' }],
      filterPresets: { preset1: { name: 'Active', filters: [] } },
      themeTokens: { '--bg': '#fff' },
    };
    expect(props.tableSettings).toBeDefined();
    expect(props.formattingRules).toHaveLength(1);
  });

  it('accepts data source props', () => {
    const props: PhzGridAdminProps = {
      selectedDataProductId: 'dp-1',
      dataProducts: [{ id: 'dp-1', name: 'Sales Data' }],
      schemaFields: [{ field: 'revenue', type: 'number' }],
    };
    expect(props.selectedDataProductId).toBe('dp-1');
    expect(props.dataProducts).toHaveLength(1);
  });

  it('accepts criteria props', () => {
    const props: PhzGridAdminProps = {
      criteriaDefinitions: [{ id: 'cd-1', label: 'Region' }],
      criteriaBindings: [{ id: 'cb-1', definitionId: 'cd-1' }],
    };
    expect(props.criteriaDefinitions).toHaveLength(1);
    expect(props.criteriaBindings).toHaveLength(1);
  });

  it('accepts gridRef for shared-ref pattern', () => {
    const gridRef = { current: null };
    const props: PhzGridAdminProps = {
      gridRef: gridRef as any,
    };
    expect(props.gridRef).toBe(gridRef);
  });

  it('accepts event handler props', () => {
    const handlers = {
      onSettingsSave: vi.fn(),
      onSettingsAutoSave: vi.fn(),
      onSettingsReset: vi.fn(),
      onClose: vi.fn(),
      onCopySettingsRequest: vi.fn(),
      onExportDownload: vi.fn(),
    };

    const props: PhzGridAdminProps = { ...handlers };

    expect(props.onSettingsSave).toBe(handlers.onSettingsSave);
    expect(props.onSettingsAutoSave).toBe(handlers.onSettingsAutoSave);
    expect(props.onSettingsReset).toBe(handlers.onSettingsReset);
    expect(props.onClose).toBe(handlers.onClose);
    expect(props.onCopySettingsRequest).toBe(handlers.onCopySettingsRequest);
    expect(props.onExportDownload).toBe(handlers.onExportDownload);
  });

  it('accepts styling props', () => {
    const props: PhzGridAdminProps = {
      className: 'admin-panel',
      style: { maxWidth: '800px' },
    };
    expect(props.className).toBe('admin-panel');
    expect(props.style).toEqual({ maxWidth: '800px' });
  });

  it('mode accepts create and edit', () => {
    const modes: PhzGridAdminProps['mode'][] = ['create', 'edit'];
    modes.forEach((mode) => {
      const props: PhzGridAdminProps = { mode };
      expect(props.mode).toBe(mode);
    });
  });
});

// ─── GridAdminApi Shape Tests ────────────────────────────────

describe('GridAdminApi interface', () => {
  it('can be satisfied by a mock object', () => {
    const api: GridAdminApi = {
      getSettings: () => ({}),
      setSettings: () => {},
      open: () => {},
      close: () => {},
    };

    expect(typeof api.getSettings).toBe('function');
    expect(typeof api.setSettings).toBe('function');
    expect(typeof api.open).toBe('function');
    expect(typeof api.close).toBe('function');
  });

  it('getSettings returns ReportPresentation shape', () => {
    const api: GridAdminApi = {
      getSettings: () => ({
        tableSettings: { density: 'compact' },
        columnFormatting: { name: { bold: true } },
      }),
      setSettings: () => {},
      open: () => {},
      close: () => {},
    };

    const settings = api.getSettings();
    expect(settings).toHaveProperty('tableSettings');
    expect(settings).toHaveProperty('columnFormatting');
  });
});

// ─── Component Invocation Shape ─────────────────────────────

describe('PhzGridAdmin invocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('can be called as a function with props and ref', () => {
    const props: PhzGridAdminProps = {
      open: true,
      reportId: 'test-report',
    };
    const ref = { current: null };

    expect(() => (PhzGridAdmin as Function)(props, ref)).not.toThrow();
  });

  it('GridAdminApi shape can be constructed manually matching the interface', () => {
    const api: GridAdminApi = {
      getSettings: () => ({}),
      setSettings: (_p) => {},
      open: () => {},
      close: () => {},
    };

    expect(typeof api.getSettings).toBe('function');
    expect(typeof api.setSettings).toBe('function');
    expect(typeof api.open).toBe('function');
    expect(typeof api.close).toBe('function');
    expect(api.getSettings()).toEqual({});
  });

  it('imperative API methods are safe with null element', () => {
    const api: GridAdminApi = {
      getSettings: () => {
        const el = null as any;
        return el?.getSettings?.() ?? {};
      },
      setSettings: (presentation) => {
        const el = null as any;
        el?.setSettings?.(presentation);
      },
      open: () => {
        const el = null as any;
        if (el) el.open = true;
      },
      close: () => {
        const el = null as any;
        if (el) el.open = false;
      },
    };

    expect(api.getSettings()).toEqual({});
    expect(() => api.setSettings({ tableSettings: {} })).not.toThrow();
    expect(() => api.open()).not.toThrow();
    expect(() => api.close()).not.toThrow();
  });
});
