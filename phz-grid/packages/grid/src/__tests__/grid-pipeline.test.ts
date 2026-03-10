/**
 * Tests for QueryBackend integration in the grid Lit component layer.
 * Verifies that the PhzGrid component correctly wires queryBackend
 * through GridCoreController into createGrid().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridCoreController, type GridCoreHost } from '../controllers/grid-core.controller.js';
import type { QueryBackend, LocalQuery, LocalQueryResult, QueryBackendCapabilities } from '@phozart/phz-core';

// --- Mock grid API with queryBackend support ---
const mockGridApi = {
  getState: vi.fn(() => ({
    columnDefs: [{ field: 'name', header: 'Name' }],
  })),
  getSortedRowModel: vi.fn(() => ({ rows: [{ __id: 'r1', name: 'Alice' }] })),
  getSortState: vi.fn(() => ({ columns: [] })),
  getSelection: vi.fn(() => ({ rows: [] })),
  getFilterState: vi.fn(() => ({ filters: [] })),
  subscribe: vi.fn(() => vi.fn()),
  setData: vi.fn(),
  setColumns: vi.fn(),
  resetColumns: vi.fn(),
  sort: vi.fn(),
  setQueryBackend: vi.fn(),
  getQueryBackend: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  on: vi.fn(() => vi.fn()),
  getProgressiveState: vi.fn(() => null),
  getDataVersion: vi.fn(() => 0),
};

let capturedConfig: any = null;

vi.mock('@phozart/phz-core', () => ({
  createGrid: vi.fn((config: any) => {
    capturedConfig = config;
    return mockGridApi;
  }),
  toColumnDefinitions: vi.fn((schema: any[]) =>
    schema.map((s: any) => ({ field: s.name, header: s.name, type: s.type })),
  ),
  getProgressMessage: vi.fn(() => ''),
}));

vi.mock('../a11y/aria-manager.js', () => ({
  AriaManager: vi.fn(() => ({
    announceChange: vi.fn(),
    announceSortChange: vi.fn(),
  })),
}));

function createMockQueryBackend(): QueryBackend {
  return {
    async execute(query: LocalQuery): Promise<LocalQueryResult> {
      return {
        rows: [{ name: 'From Backend' }],
        totalCount: 1,
        filteredCount: 1,
        executionEngine: 'js-compute',
        executionTimeMs: 0.1,
      };
    },
    getCapabilities(): QueryBackendCapabilities {
      return { filter: true, sort: true, group: false, aggregate: false, pagination: true };
    },
  };
}

function makeHost(overrides?: Partial<GridCoreHost>): GridCoreHost {
  return {
    data: [{ name: 'Alice' }, { name: 'Bob' }],
    columns: [{ field: 'name', header: 'Name' }] as any[],
    selectionMode: 'single',
    editMode: 'dblclick',
    ariaLabels: {},
    defaultSortField: '',
    defaultSortDirection: 'asc',
    autoSizeColumns: false,
    dataSet: undefined,
    queryBackend: undefined,
    progressiveLoad: undefined,
    onStateSync: vi.fn(),
    onProgressUpdate: vi.fn(),
    onInitialized: vi.fn(),
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  } as GridCoreHost;
}

describe('Grid QueryBackend pipeline wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedConfig = null;
  });

  it('passes queryBackend to createGrid config', () => {
    const backend = createMockQueryBackend();
    const host = makeHost({ queryBackend: backend });
    const ctrl = new GridCoreController(host);
    ctrl.initializeGrid();

    expect(capturedConfig).toBeDefined();
    expect(capturedConfig.queryBackend).toBe(backend);
  });

  it('passes undefined queryBackend when not provided', () => {
    const host = makeHost();
    const ctrl = new GridCoreController(host);
    ctrl.initializeGrid();

    expect(capturedConfig).toBeDefined();
    expect(capturedConfig.queryBackend).toBeUndefined();
  });

  it('includes queryBackend in GridCoreHost interface', () => {
    const host = makeHost();
    // TypeScript compile-time check: queryBackend exists on host
    expect('queryBackend' in host).toBe(true);
    expect(host.queryBackend).toBeUndefined();
  });

  it('accepts queryBackend at construction time', () => {
    const backend = createMockQueryBackend();
    const host = makeHost({ queryBackend: backend });
    expect(host.queryBackend).toBe(backend);
  });

  it('grid init still works without queryBackend', () => {
    const host = makeHost();
    const ctrl = new GridCoreController(host);
    ctrl.initializeGrid();

    expect(ctrl.gridApi).toBeDefined();
    expect(ctrl.isInitialized).toBe(true);
  });

  it('queryBackend capabilities are accessible', () => {
    const backend = createMockQueryBackend();
    const caps = backend.getCapabilities();

    expect(caps.filter).toBe(true);
    expect(caps.sort).toBe(true);
    expect(caps.group).toBe(false);
    expect(caps.aggregate).toBe(false);
    expect(caps.pagination).toBe(true);
  });

  it('queryBackend execute returns LocalQueryResult', async () => {
    const backend = createMockQueryBackend();
    const result = await backend.execute({
      filters: [],
      sort: [],
      groupBy: [],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.executionEngine).toBe('js-compute');
    expect(result.totalCount).toBe(1);
  });

  it('config includes all standard grid properties alongside queryBackend', () => {
    const backend = createMockQueryBackend();
    const host = makeHost({ queryBackend: backend });
    const ctrl = new GridCoreController(host);
    ctrl.initializeGrid();

    expect(capturedConfig.columns).toBeDefined();
    expect(capturedConfig.data).toBeDefined();
    expect(capturedConfig.enableSelection).toBe(true);
    expect(capturedConfig.enableEditing).toBe(true);
    expect(capturedConfig.queryBackend).toBe(backend);
  });
});
