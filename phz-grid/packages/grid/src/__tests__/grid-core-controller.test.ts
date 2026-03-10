import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridCoreController, type GridCoreHost } from '../controllers/grid-core.controller.js';

let _mockDataVersion = 0;

const mockGridApi = {
  getState: vi.fn(() => ({
    columnDefs: [{ field: 'name', header: 'Name' }],
  })),
  getSortedRowModel: vi.fn(() => ({ rows: [{ __id: 'r1', name: 'Alice' }] })),
  getSortState: vi.fn(() => ({ columns: [] })),
  getSelection: vi.fn(() => ({ rows: [] })),
  getFilterState: vi.fn(() => ({ filters: [] })),
  subscribe: vi.fn(() => vi.fn()),
  on: vi.fn(() => vi.fn()),
  getProgressiveState: vi.fn(() => null),
  setData: vi.fn(() => { _mockDataVersion++; }),
  setColumns: vi.fn(),
  resetColumns: vi.fn(),
  sort: vi.fn(),
  getDataVersion: vi.fn(() => _mockDataVersion),
};

vi.mock('@phozart/phz-core', () => ({
  createGrid: vi.fn(() => mockGridApi),
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

describe('GridCoreController', () => {
  beforeEach(() => {
    _mockDataVersion = 0;
    vi.clearAllMocks();
  });

  it('registers with host', () => {
    const host = makeHost();
    const ctrl = new GridCoreController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
  });

  describe('initializeGrid', () => {
    it('creates a grid API and sets ariaManager', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      expect(ctrl.gridApi).toBeDefined();
      expect(ctrl.ariaManager).toBeDefined();
      expect(ctrl.isInitialized).toBe(true);
    });

    it('subscribes to grid state', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      expect(mockGridApi.subscribe).toHaveBeenCalled();
    });

    it('applies default sort when defaultSortField is set', () => {
      const host = makeHost({ defaultSortField: 'name', defaultSortDirection: 'desc' });
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      expect(mockGridApi.sort).toHaveBeenCalledWith('name', 'desc');
    });

    it('does not apply sort when defaultSortField is empty', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      expect(mockGridApi.sort).not.toHaveBeenCalled();
    });

    it('performs initial state sync so visibleRows is populated', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      // onStateSync should be called with the initial visible rows
      expect(host.onStateSync).toHaveBeenCalledWith(
        expect.objectContaining({
          visibleRows: expect.any(Array),
          totalRowCount: expect.any(Number),
          columnDefs: expect.any(Array),
        }),
      );
    });
  });

  describe('destroyGrid', () => {
    it('clears all subscriptions and references', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();
      ctrl.destroyGrid();

      expect(ctrl.gridApi).toBeNull();
      expect(ctrl.ariaManager).toBeNull();
      expect(ctrl.isInitialized).toBe(false);
    });
  });

  describe('onDataOrColumnsChanged', () => {
    it('pushes new data and columns to gridApi', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();
      ctrl.onDataOrColumnsChanged();

      expect(mockGridApi.setData).toHaveBeenCalled();
      expect(mockGridApi.resetColumns).toHaveBeenCalled();
    });

    it('does nothing without gridApi', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.onDataOrColumnsChanged(); // no init
      expect(mockGridApi.setData).not.toHaveBeenCalled();
    });

    it('skips setData when queryBackend is active', () => {
      const mockBackend = {
        execute: vi.fn(),
        getCapabilities: vi.fn(() => ({ filter: true, sort: true, group: false, aggregate: false, pagination: true })),
      };
      const host = makeHost({ queryBackend: mockBackend as any });
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();
      vi.clearAllMocks();

      ctrl.onDataOrColumnsChanged(true);

      // Should NOT call setData — backend owns the data
      expect(mockGridApi.setData).not.toHaveBeenCalled();
      // Should still reset columns
      expect(mockGridApi.resetColumns).toHaveBeenCalled();
    });

    it('skips setData when only columns changed (dataChanged=false)', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();
      vi.clearAllMocks();

      ctrl.onDataOrColumnsChanged(false);

      // Should NOT call setData — only columns changed
      expect(mockGridApi.setData).not.toHaveBeenCalled();
      // Should still reset columns
      expect(mockGridApi.resetColumns).toHaveBeenCalled();
    });

    it('calls setData when queryBackend is not set', () => {
      const host = makeHost({ queryBackend: undefined });
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();
      vi.clearAllMocks();

      ctrl.onDataOrColumnsChanged();

      expect(mockGridApi.setData).toHaveBeenCalled();
      expect(mockGridApi.resetColumns).toHaveBeenCalled();
    });

    it('skips setData when external code (bridge) has pushed data', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      // Simulate DuckDB bridge calling gridApi.setData() externally
      _mockDataVersion++;

      vi.clearAllMocks();

      // React re-renders → willUpdate → onDataOrColumnsChanged(true)
      // Host data is still the same length (2 items) — should skip
      ctrl.onDataOrColumnsChanged(true);

      expect(mockGridApi.setData).not.toHaveBeenCalled();
      expect(mockGridApi.resetColumns).toHaveBeenCalled();
    });

    it('pushes data when host data length changes despite external data', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();

      // Simulate bridge pushing data externally
      _mockDataVersion++;

      // Now host genuinely provides new data (different length)
      (host as any).data = [{ name: 'X' }, { name: 'Y' }, { name: 'Z' }];
      vi.clearAllMocks();

      ctrl.onDataOrColumnsChanged(true);

      // Should push because host data length changed (2 → 3)
      expect(mockGridApi.setData).toHaveBeenCalled();
    });

    it('allows normal data pushes when no external data was set', () => {
      const host = makeHost();
      const ctrl = new GridCoreController(host);
      ctrl.initializeGrid();
      vi.clearAllMocks();

      // Multiple prop-driven updates without external interference
      ctrl.onDataOrColumnsChanged(true);
      expect(mockGridApi.setData).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();
      ctrl.onDataOrColumnsChanged(true);
      expect(mockGridApi.setData).toHaveBeenCalledTimes(1);
    });
  });
});
