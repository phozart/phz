import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @phozart/phz-grid to avoid side-effect import (registers custom element)
vi.mock('@phozart/phz-grid', () => ({}));

import {
  createPhzGridComponent,
  createGridService,
  createSelectionService,
  createSortService,
  createFilterService,
  createEditService,
  createDataService,
} from '../factories.js';

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

function createMockAngularRuntime() {
  return {
    Component: vi.fn(),
    Input: vi.fn(),
    Output: vi.fn(),
    EventEmitter: class {
      emit = vi.fn();
    },
    Injectable: vi.fn(),
  };
}

/**
 * Creates a mock DOM element that tracks property assignments
 * and attribute settings, and supports event listener registration.
 */
function createMockElement() {
  const listeners: Record<string, Function[]> = {};
  const attributes: Record<string, string> = {};
  const el: Record<string, any> = {
    _listeners: listeners,
    _attributes: attributes,
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    setAttribute: vi.fn((name: string, value: string) => {
      attributes[name] = value;
    }),
    querySelector: vi.fn(() => null), // returns null so el itself is used as the target
  };
  return el;
}

/**
 * Creates a mock elementRef whose nativeElement is or contains a mock element.
 * When querySelector('phz-grid') returns null, the host itself acts as the grid element.
 */
function createMockElementRef(gridEl?: any) {
  const nativeElement = gridEl ?? createMockElement();
  // querySelector returns null so the code falls back to using host itself
  if (!nativeElement.querySelector) {
    nativeElement.querySelector = vi.fn(() => null);
  }
  return { nativeElement };
}

class MockBehaviorSubject<T> {
  value: T;
  private subscribers: Array<(value: T) => void> = [];

  constructor(initial: T) {
    this.value = initial;
  }

  next(value: T) {
    this.value = value;
    for (const sub of this.subscribers) sub(value);
  }

  subscribe(observer: (value: T) => void) {
    this.subscribers.push(observer);
    observer(this.value);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== observer);
      },
    };
  }

  asObservable() {
    return { subscribe: (obs: any) => this.subscribe(obs) };
  }

  complete() {
    this.subscribers = [];
  }
}

class MockSubject<T> {
  private subscribers: Array<(value: T) => void> = [];

  next(value: T) {
    for (const sub of this.subscribers) sub(value);
  }

  subscribe(observer: (value: T) => void) {
    this.subscribers.push(observer);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== observer);
      },
    };
  }

  asObservable() {
    return { subscribe: (obs: any) => this.subscribe(obs) };
  }

  complete() {
    this.subscribers = [];
  }
}

function createMockRxJS() {
  return {
    BehaviorSubject: MockBehaviorSubject as any,
    Subject: MockSubject as any,
  };
}

function createMockGridApi() {
  return {
    getState: vi.fn(() => ({ sort: { columns: [] } })),
    getSortState: vi.fn(() => ({ columns: [] })),
    getFilterState: vi.fn(() => ({ filters: [], presets: {} })),
    getEditState: vi.fn(() => ({ status: 'idle' })),
    getSelection: vi.fn(() => ({ rows: ['r1'], cells: [{ rowId: 'r1', field: 'name' }] })),
    getData: vi.fn(() => [{ id: 1, name: 'A' }]),
    getDirtyRows: vi.fn(() => ['r1']),
    isDirty: vi.fn(() => true),
    subscribe: vi.fn((_cb: Function) => vi.fn()),
    on: vi.fn((_event: string, _cb: Function) => vi.fn()),
    sort: vi.fn(),
    multiSort: vi.fn(),
    clearSort: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    select: vi.fn(),
    deselect: vi.fn(),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    startEdit: vi.fn(),
    commitEdit: vi.fn(() => Promise.resolve(true)),
    cancelEdit: vi.fn(),
    setData: vi.fn(),
    addRow: vi.fn(() => 'new-row-id'),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
    exportCsv: vi.fn(() => 'csv-data'),
    destroy: vi.fn(),
  } as any;
}

// ===========================================================================
// createPhzGridComponent — lifecycle and syncProperties coverage
// ===========================================================================

describe('createPhzGridComponent — lifecycle methods', () => {
  let ng: ReturnType<typeof createMockAngularRuntime>;
  let PhzGridComponent: any;

  beforeEach(() => {
    ng = createMockAngularRuntime();
    PhzGridComponent = createPhzGridComponent(ng);
  });

  describe('ngOnInit', () => {
    it('does nothing when elementRef is not set', () => {
      const instance = new PhzGridComponent();
      // Should not throw
      instance.ngOnInit();
      expect(instance.getGridInstance()).toBeNull();
    });

    it('does nothing when elementRef.nativeElement is null', () => {
      const instance = new PhzGridComponent({ nativeElement: null });
      instance.ngOnInit();
      expect(instance.getGridInstance()).toBeNull();
    });

    it('registers event listeners on the host element', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      // Should register listeners for: grid-ready, state-change, cell-click,
      // selection-change, sort-change, filter-change, edit-commit
      expect(el.addEventListener).toHaveBeenCalledTimes(7);
      expect(el.addEventListener).toHaveBeenCalledWith('grid-ready', expect.any(Function));
      expect(el.addEventListener).toHaveBeenCalledWith('state-change', expect.any(Function));
      expect(el.addEventListener).toHaveBeenCalledWith('cell-click', expect.any(Function));
      expect(el.addEventListener).toHaveBeenCalledWith('selection-change', expect.any(Function));
      expect(el.addEventListener).toHaveBeenCalledWith('sort-change', expect.any(Function));
      expect(el.addEventListener).toHaveBeenCalledWith('filter-change', expect.any(Function));
      expect(el.addEventListener).toHaveBeenCalledWith('edit-commit', expect.any(Function));
    });

    it('sets gridApi when grid-ready event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      // Find the grid-ready handler
      const gridReadyHandler = el._listeners['grid-ready']?.[0];
      expect(gridReadyHandler).toBeDefined();

      const mockApi = createMockGridApi();
      const event = { detail: { gridInstance: mockApi } } as unknown as Event;
      gridReadyHandler(event);

      expect(instance.getGridInstance()).toBe(mockApi);
      expect(instance.gridReady.emit).toHaveBeenCalledWith(mockApi);
    });

    it('emits on stateChange when state-change event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      const handler = el._listeners['state-change']?.[0];
      expect(handler).toBeDefined();

      const detail = { type: 'sort', state: {} };
      handler({ detail } as unknown as Event);
      expect(instance.stateChange.emit).toHaveBeenCalledWith(detail);
    });

    it('emits on cellClick when cell-click event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      const handler = el._listeners['cell-click']?.[0];
      const detail = { rowId: 'r1', field: 'name' };
      handler({ detail } as unknown as Event);
      expect(instance.cellClick.emit).toHaveBeenCalledWith(detail);
    });

    it('emits on selectionChange when selection-change event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      const handler = el._listeners['selection-change']?.[0];
      const detail = { rows: ['r1'], cells: [] };
      handler({ detail } as unknown as Event);
      expect(instance.selectionChange.emit).toHaveBeenCalledWith(detail);
    });

    it('emits on sortChange when sort-change event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      const handler = el._listeners['sort-change']?.[0];
      const detail = { columns: [{ field: 'name', direction: 'asc' }] };
      handler({ detail } as unknown as Event);
      expect(instance.sortChange.emit).toHaveBeenCalledWith(detail);
    });

    it('emits on filterChange when filter-change event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      const handler = el._listeners['filter-change']?.[0];
      const detail = { filters: [{ field: 'status', operator: 'eq', value: 'active' }] };
      handler({ detail } as unknown as Event);
      expect(instance.filterChange.emit).toHaveBeenCalledWith(detail);
    });

    it('emits on editCommit when edit-commit event fires', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      const handler = el._listeners['edit-commit']?.[0];
      const detail = { rowId: 'r1', field: 'name', oldValue: 'A', newValue: 'B' };
      handler({ detail } as unknown as Event);
      expect(instance.editCommit.emit).toHaveBeenCalledWith(detail);
    });

    it('calls syncProperties with initial property values', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      // Verify properties were synced: data and columns assigned
      expect(el.data).toEqual([]);
      expect(el.columns).toEqual([]);
      expect(el.theme).toBe('auto');
      expect(el.locale).toBe('en-US');
      expect(el.responsive).toBe(true);
      expect(el.virtualization).toBe(true);
      expect(el.loading).toBe(false);
    });

    it('uses querySelector result when phz-grid child is found', () => {
      const gridChild = createMockElement();
      const parentEl = createMockElement();
      parentEl.querySelector = vi.fn(() => gridChild);
      const elementRef = { nativeElement: parentEl };

      const instance = new PhzGridComponent(elementRef);
      instance.ngOnInit();

      // Event listeners should be on gridChild, not parentEl
      expect(gridChild.addEventListener).toHaveBeenCalled();
      // Properties synced to gridChild
      expect(gridChild.data).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('does nothing when elementRef is not set', () => {
      const instance = new PhzGridComponent();
      // Should not throw
      instance.ngOnChanges({});
    });

    it('does nothing when elementRef.nativeElement is null', () => {
      const instance = new PhzGridComponent({ nativeElement: null });
      instance.ngOnChanges({});
    });

    it('syncs properties to the element when changes occur', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.data = [{ id: 1 }];
      instance.columns = [{ field: 'id', header: 'ID' }];
      instance.theme = 'dark';
      instance.locale = 'de-DE';
      instance.responsive = false;
      instance.virtualization = false;
      instance.loading = true;

      instance.ngOnChanges({});

      expect(el.data).toEqual([{ id: 1 }]);
      expect(el.columns).toEqual([{ field: 'id', header: 'ID' }]);
      expect(el.theme).toBe('dark');
      expect(el.locale).toBe('de-DE');
      expect(el.responsive).toBe(false);
      expect(el.virtualization).toBe(false);
      expect(el.loading).toBe(true);
    });

    it('uses querySelector result when phz-grid child is found', () => {
      const gridChild = createMockElement();
      const parentEl = createMockElement();
      parentEl.querySelector = vi.fn(() => gridChild);
      const elementRef = { nativeElement: parentEl };

      const instance = new PhzGridComponent(elementRef);
      instance.data = [{ x: 1 }];
      instance.ngOnChanges({});

      expect(gridChild.data).toEqual([{ x: 1 }]);
    });
  });

  describe('ngOnDestroy', () => {
    it('removes all event listeners and nulls gridApi', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();

      // Simulate grid-ready to set gridApi
      const gridReadyHandler = el._listeners['grid-ready']?.[0];
      const mockApi = createMockGridApi();
      gridReadyHandler({ detail: { gridInstance: mockApi } } as unknown as Event);
      expect(instance.getGridInstance()).toBe(mockApi);

      instance.ngOnDestroy();

      expect(instance.getGridInstance()).toBeNull();
      // removeEventListener should have been called for each "listen" handler (6 total)
      expect(el.removeEventListener).toHaveBeenCalledTimes(6);
    });

    it('can be called multiple times safely', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.ngOnInit();
      instance.ngOnDestroy();
      instance.ngOnDestroy(); // second call should not throw

      expect(instance.getGridInstance()).toBeNull();
    });
  });

  describe('syncProperties — full branch coverage', () => {
    it('sets selectionMode attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.selectionMode = 'multi';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('selection-mode', 'multi');
    });

    it('sets editMode attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.editMode = 'click';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('edit-mode', 'click');
    });

    it('sets height as number (adds px suffix)', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.height = 500;
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-height', '500px');
    });

    it('sets height as string', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.height = '100vh';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-height', '100vh');
    });

    it('sets width as number (adds px suffix)', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.width = 800;
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-width', '800px');
    });

    it('sets width as string', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.width = '50%';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-width', '50%');
    });

    it('sets density property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.density = 'comfortable';
      instance.ngOnChanges({});

      expect(el.density).toBe('comfortable');
    });

    it('sets gridTitle attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.gridTitle = 'My Grid';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-title', 'My Grid');
    });

    it('sets gridSubtitle attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.gridSubtitle = 'Subtitle text';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-subtitle', 'Subtitle text');
    });

    it('sets scrollMode attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.scrollMode = 'virtual';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('scroll-mode', 'virtual');
    });

    it('sets pageSize attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.pageSize = 25;
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('page-size', '25');
    });

    it('sets pageSizeOptions property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.pageSizeOptions = [10, 25, 50];
      instance.ngOnChanges({});

      expect(el.pageSizeOptions).toEqual([10, 25, 50]);
    });

    it('sets showToolbar property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showToolbar = false;
      instance.ngOnChanges({});

      expect(el.showToolbar).toBe(false);
    });

    it('sets showDensityToggle property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showDensityToggle = false;
      instance.ngOnChanges({});

      expect(el.showDensityToggle).toBe(false);
    });

    it('sets showColumnEditor property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showColumnEditor = false;
      instance.ngOnChanges({});

      expect(el.showColumnEditor).toBe(false);
    });

    it('sets showAdminSettings property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showAdminSettings = true;
      instance.ngOnChanges({});

      expect(el.showAdminSettings).toBe(true);
    });

    it('sets showPagination property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showPagination = false;
      instance.ngOnChanges({});

      expect(el.showPagination).toBe(false);
    });

    it('sets showCheckboxes property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showCheckboxes = true;
      instance.ngOnChanges({});

      expect(el.showCheckboxes).toBe(true);
    });

    it('sets showRowActions property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showRowActions = true;
      instance.ngOnChanges({});

      expect(el.showRowActions).toBe(true);
    });

    it('sets showSelectionActions property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showSelectionActions = false;
      instance.ngOnChanges({});

      expect(el.showSelectionActions).toBe(false);
    });

    it('sets showEditActions property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showEditActions = false;
      instance.ngOnChanges({});

      expect(el.showEditActions).toBe(false);
    });

    it('sets showCopyActions property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.showCopyActions = false;
      instance.ngOnChanges({});

      expect(el.showCopyActions).toBe(false);
    });

    it('sets rowBanding property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.rowBanding = true;
      instance.ngOnChanges({});

      expect(el.rowBanding).toBe(true);
    });

    it('sets statusColors property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const colors = { active: { bg: '#0f0', color: '#000', dot: '#0f0' } };
      instance.statusColors = colors;
      instance.ngOnChanges({});

      expect(el.statusColors).toBe(colors);
    });

    it('sets barThresholds property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const thresholds = [{ min: 0, color: 'red' }, { min: 50, color: 'green' }];
      instance.barThresholds = thresholds;
      instance.ngOnChanges({});

      expect(el.barThresholds).toBe(thresholds);
    });

    it('sets dateFormats property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const formats = { created: 'YYYY-MM-DD' };
      instance.dateFormats = formats;
      instance.ngOnChanges({});

      expect(el.dateFormats).toBe(formats);
    });

    it('sets numberFormats property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const formats = { price: { decimals: 2, prefix: '$' } };
      instance.numberFormats = formats;
      instance.ngOnChanges({});

      expect(el.numberFormats).toBe(formats);
    });

    it('sets columnStyles property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const styles = { name: 'font-weight: bold' };
      instance.columnStyles = styles;
      instance.ngOnChanges({});

      expect(el.columnStyles).toBe(styles);
    });

    it('sets gridLines attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.gridLines = 'both';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-lines', 'both');
    });

    it('sets gridLineColor attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.gridLineColor = '#ccc';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-line-color', '#ccc');
    });

    it('sets gridLineWidth attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.gridLineWidth = 'medium';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('grid-line-width', 'medium');
    });

    it('sets bandingColor attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.bandingColor = '#eee';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('banding-color', '#eee');
    });

    it('sets hoverHighlight property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.hoverHighlight = false;
      instance.ngOnChanges({});

      expect(el.hoverHighlight).toBe(false);
    });

    it('sets cellTextOverflow attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.cellTextOverflow = 'ellipsis';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('cell-text-overflow', 'ellipsis');
    });

    it('sets compactNumbers property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.compactNumbers = true;
      instance.ngOnChanges({});

      expect(el.compactNumbers).toBe(true);
    });

    it('sets autoSizeColumns property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.autoSizeColumns = true;
      instance.ngOnChanges({});

      expect(el.autoSizeColumns).toBe(true);
    });

    it('sets aggregation property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.aggregation = true;
      instance.ngOnChanges({});

      expect(el.aggregation).toBe(true);
    });

    it('sets aggregationFn attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.aggregationFn = 'avg';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('aggregation-fn', 'avg');
    });

    it('sets aggregationPosition attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.aggregationPosition = 'top';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('aggregation-position', 'top');
    });

    it('sets groupBy property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.groupBy = ['category'];
      instance.ngOnChanges({});

      expect(el.groupBy).toEqual(['category']);
    });

    it('sets groupByLevels property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.groupByLevels = [['category'], ['subcategory']];
      instance.ngOnChanges({});

      expect(el.groupByLevels).toEqual([['category'], ['subcategory']]);
    });

    it('sets groupTotals property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.groupTotals = true;
      instance.ngOnChanges({});

      expect(el.groupTotals).toBe(true);
    });

    it('sets groupTotalsFn property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.groupTotalsFn = 'avg';
      instance.ngOnChanges({});

      expect(el.groupTotalsFn).toBe('avg');
    });

    it('sets conditionalFormattingRules property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const rules = [{ field: 'score', operator: 'gt', value: 90, style: { color: 'green' } }];
      instance.conditionalFormattingRules = rules;
      instance.ngOnChanges({});

      expect(el.conditionalFormattingRules).toBe(rules);
    });

    it('sets columnGroups property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      const groups = [{ header: 'Personal', children: ['name', 'age'] }];
      instance.columnGroups = groups;
      instance.ngOnChanges({});

      expect(el.columnGroups).toBe(groups);
    });

    it('sets userRole attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.userRole = 'admin';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('user-role', 'admin');
    });

    it('sets copyHeaders property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.copyHeaders = false;
      instance.ngOnChanges({});

      expect(el.copyHeaders).toBe(false);
    });

    it('sets copyFormatted property', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.copyFormatted = true;
      instance.ngOnChanges({});

      expect(el.copyFormatted).toBe(true);
    });

    it('sets loadingMode attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.loadingMode = 'lazy';
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('loading-mode', 'lazy');
    });

    it('sets virtualScrollThreshold attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.virtualScrollThreshold = 1000;
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('virtual-scroll-threshold', '1000');
    });

    it('sets fetchPageSize attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.fetchPageSize = 200;
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('fetch-page-size', '200');
    });

    it('sets prefetchPages attribute', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      instance.prefetchPages = 3;
      instance.ngOnChanges({});

      expect(el.setAttribute).toHaveBeenCalledWith('prefetch-pages', '3');
    });

    it('syncs all properties in a single ngOnChanges call', () => {
      const el = createMockElement();
      const elementRef = createMockElementRef(el);
      const instance = new PhzGridComponent(elementRef);

      // Set a wide variety of properties at once
      instance.data = [{ id: 1 }];
      instance.columns = [{ field: 'id' }];
      instance.theme = 'dark';
      instance.locale = 'fr-FR';
      instance.responsive = false;
      instance.virtualization = false;
      instance.selectionMode = 'range';
      instance.editMode = 'manual';
      instance.loading = true;
      instance.height = 400;
      instance.width = 600;
      instance.density = 'dense';
      instance.gridTitle = 'Test';
      instance.gridSubtitle = 'Sub';
      instance.scrollMode = 'virtual';
      instance.pageSize = 50;
      instance.pageSizeOptions = [25, 50, 100];
      instance.showToolbar = false;
      instance.showDensityToggle = false;
      instance.showColumnEditor = false;
      instance.showAdminSettings = true;
      instance.showPagination = false;
      instance.showCheckboxes = true;
      instance.showRowActions = true;
      instance.showSelectionActions = false;
      instance.showEditActions = false;
      instance.showCopyActions = false;
      instance.rowBanding = true;
      instance.statusColors = {};
      instance.barThresholds = [];
      instance.dateFormats = {};
      instance.numberFormats = {};
      instance.columnStyles = {};
      instance.gridLines = 'none';
      instance.gridLineColor = '#000';
      instance.gridLineWidth = 'medium';
      instance.bandingColor = '#f0f0f0';
      instance.hoverHighlight = false;
      instance.cellTextOverflow = 'clip';
      instance.compactNumbers = true;
      instance.autoSizeColumns = true;
      instance.aggregation = true;
      instance.aggregationFn = 'max';
      instance.aggregationPosition = 'both';
      instance.groupBy = ['cat'];
      instance.groupByLevels = [['a']];
      instance.groupTotals = true;
      instance.groupTotalsFn = 'count';
      instance.conditionalFormattingRules = [];
      instance.columnGroups = [];
      instance.userRole = 'editor';
      instance.copyHeaders = false;
      instance.copyFormatted = true;
      instance.loadingMode = 'lazy';
      instance.virtualScrollThreshold = 500;
      instance.fetchPageSize = 50;
      instance.prefetchPages = 1;

      instance.ngOnChanges({});

      // Verify a sample of each type
      expect(el.data).toEqual([{ id: 1 }]);
      expect(el.density).toBe('dense');
      expect(el.setAttribute).toHaveBeenCalledWith('selection-mode', 'range');
      expect(el.setAttribute).toHaveBeenCalledWith('edit-mode', 'manual');
      expect(el.setAttribute).toHaveBeenCalledWith('grid-height', '400px');
      expect(el.setAttribute).toHaveBeenCalledWith('grid-width', '600px');
      expect(el.setAttribute).toHaveBeenCalledWith('grid-title', 'Test');
      expect(el.setAttribute).toHaveBeenCalledWith('grid-subtitle', 'Sub');
      expect(el.setAttribute).toHaveBeenCalledWith('scroll-mode', 'virtual');
      expect(el.setAttribute).toHaveBeenCalledWith('page-size', '50');
      expect(el.showToolbar).toBe(false);
      expect(el.rowBanding).toBe(true);
      expect(el.setAttribute).toHaveBeenCalledWith('grid-lines', 'none');
      expect(el.setAttribute).toHaveBeenCalledWith('aggregation-fn', 'max');
      expect(el.setAttribute).toHaveBeenCalledWith('aggregation-position', 'both');
      expect(el.setAttribute).toHaveBeenCalledWith('user-role', 'editor');
      expect(el.setAttribute).toHaveBeenCalledWith('loading-mode', 'lazy');
      expect(el.setAttribute).toHaveBeenCalledWith('virtual-scroll-threshold', '500');
      expect(el.setAttribute).toHaveBeenCalledWith('fetch-page-size', '50');
      expect(el.setAttribute).toHaveBeenCalledWith('prefetch-pages', '1');
    });
  });

  describe('default grid display input values', () => {
    it('has correct defaults for all grid display properties', () => {
      const instance = new PhzGridComponent();

      expect(instance.density).toBe('compact');
      expect(instance.gridTitle).toBe('');
      expect(instance.gridSubtitle).toBe('');
      expect(instance.scrollMode).toBe('paginate');
      expect(instance.pageSize).toBe(10);
      expect(instance.pageSizeOptions).toEqual([5, 10, 20, 50]);
      expect(instance.showToolbar).toBe(true);
      expect(instance.showDensityToggle).toBe(true);
      expect(instance.showColumnEditor).toBe(true);
      expect(instance.showAdminSettings).toBe(false);
      expect(instance.showPagination).toBe(true);
      expect(instance.showCheckboxes).toBe(false);
      expect(instance.showRowActions).toBe(false);
      expect(instance.showSelectionActions).toBe(true);
      expect(instance.showEditActions).toBe(true);
      expect(instance.showCopyActions).toBe(true);
      expect(instance.rowBanding).toBe(false);
      expect(instance.statusColors).toEqual({});
      expect(instance.barThresholds).toEqual([]);
      expect(instance.dateFormats).toEqual({});
      expect(instance.numberFormats).toEqual({});
      expect(instance.columnStyles).toEqual({});
      expect(instance.gridLines).toBe('horizontal');
      expect(instance.gridLineColor).toBe('#E7E5E4');
      expect(instance.gridLineWidth).toBe('thin');
      expect(instance.bandingColor).toBe('#FAFAF9');
      expect(instance.hoverHighlight).toBe(true);
      expect(instance.cellTextOverflow).toBe('wrap');
      expect(instance.compactNumbers).toBe(false);
      expect(instance.autoSizeColumns).toBe(false);
      expect(instance.aggregation).toBe(false);
      expect(instance.aggregationFn).toBe('sum');
      expect(instance.aggregationPosition).toBe('bottom');
      expect(instance.groupBy).toEqual([]);
      expect(instance.groupByLevels).toEqual([]);
      expect(instance.groupTotals).toBe(false);
      expect(instance.groupTotalsFn).toBe('sum');
      expect(instance.conditionalFormattingRules).toEqual([]);
      expect(instance.columnGroups).toEqual([]);
      expect(instance.userRole).toBe('user');
      expect(instance.copyHeaders).toBe(true);
      expect(instance.copyFormatted).toBe(false);
      expect(instance.loadingMode).toBe('paginate');
      expect(instance.virtualScrollThreshold).toBe(0);
      expect(instance.fetchPageSize).toBe(100);
      expect(instance.prefetchPages).toBe(2);
    });
  });
});

// ===========================================================================
// createGridService — additional coverage
// ===========================================================================

describe('createGridService — additional coverage', () => {
  it('methods are safe to call without gridApi (no-op)', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();

    // These should not throw when gridApi is null
    svc.sort('name', 'asc');
    svc.clearSort();
    svc.addFilter('age', 'gt', 18);
    svc.removeFilter('age');
    svc.clearFilters();
    svc.select(['r1']);
    svc.deselect(['r1']);
    svc.selectAll();
    svc.deselectAll();
    svc.startEdit({ rowId: 'r1', field: 'name' });
    svc.commitEdit({ rowId: 'r1', field: 'name' }, 'val');
    svc.cancelEdit({ rowId: 'r1', field: 'name' });
    svc.destroy();
  });

  it('destroy nullifies gridApi and delegates to gridApi.destroy', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);
    svc.destroy();

    expect(api.destroy).toHaveBeenCalled();
    // After destroy, getState should return null
    expect(svc.getState()).toBeNull();
  });

  it('getSortState returns api value when set', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);
    expect(svc.getSortState()).toEqual({ columns: [] });
    expect(api.getSortState).toHaveBeenCalled();
  });

  it('getFilterState returns api value when set', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);
    expect(svc.getFilterState()).toEqual({ filters: [], presets: {} });
    expect(api.getFilterState).toHaveBeenCalled();
  });

  it('getEditState returns api value when set', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);
    expect(svc.getEditState()).toEqual({ status: 'idle' });
    expect(api.getEditState).toHaveBeenCalled();
  });

  it('getSelection returns api value when set', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);
    expect(svc.getSelection()).toEqual({ rows: ['r1'], cells: [{ rowId: 'r1', field: 'name' }] });
    expect(api.getSelection).toHaveBeenCalled();
  });

  it('exportCsv passes options through to api', () => {
    const ng = createMockAngularRuntime();
    const GridService = createGridService(ng);
    const svc = new GridService();
    const api = createMockGridApi();

    svc.setGridApi(api);
    const opts = { separator: ';' };
    const result = svc.exportCsv(opts);

    expect(api.exportCsv).toHaveBeenCalledWith(opts);
    expect(result).toBe('csv-data');
  });
});

// ===========================================================================
// RxJS service factories — event callback coverage
// ===========================================================================

describe('createSelectionService — event callback fires sync', () => {
  it('updates observables when selection:change event fires', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    let capturedCallback: Function | null = null;
    api.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'selection:change') capturedCallback = cb;
      return vi.fn();
    });

    const svc = createSelectionService(rxjs)(api);

    // Update mock to return new selection
    api.getSelection.mockReturnValue({ rows: ['r1', 'r2'], cells: [{ rowId: 'r1', field: 'name' }] });

    // Trigger the event callback
    expect(capturedCallback).toBeTruthy();
    capturedCallback!();

    let emittedRows: any = null;
    svc.selectedRows$.subscribe((val: any) => {
      emittedRows = val;
    });
    expect(emittedRows).toEqual(['r1', 'r2']);

    let emittedCells: any = null;
    svc.selectedCells$.subscribe((val: any) => {
      emittedCells = val;
    });
    expect(emittedCells).toEqual([{ rowId: 'r1', field: 'name' }]);
  });
});

describe('createSortService — event callback fires sync', () => {
  it('updates sortState$ when sort:change event fires', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    let capturedCallback: Function | null = null;
    api.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'sort:change') capturedCallback = cb;
      return vi.fn();
    });

    const svc = createSortService(rxjs)(api);

    const newSortState = { columns: [{ field: 'name', direction: 'asc' }] };
    api.getSortState.mockReturnValue(newSortState);

    expect(capturedCallback).toBeTruthy();
    capturedCallback!();

    let emitted: any = null;
    svc.sortState$.subscribe((val: any) => {
      emitted = val;
    });
    expect(emitted).toEqual(newSortState);
  });
});

describe('createFilterService — event callback fires sync', () => {
  it('updates filterState$ when filter:change event fires', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    let capturedCallback: Function | null = null;
    api.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'filter:change') capturedCallback = cb;
      return vi.fn();
    });

    const svc = createFilterService(rxjs)(api);

    const newFilterState = { filters: [{ field: 'age', operator: 'gt', value: 18 }], presets: {} };
    api.getFilterState.mockReturnValue(newFilterState);

    expect(capturedCallback).toBeTruthy();
    capturedCallback!();

    let emitted: any = null;
    svc.filterState$.subscribe((val: any) => {
      emitted = val;
    });
    expect(emitted).toEqual(newFilterState);
  });
});

describe('createEditService — subscribe callback fires sync', () => {
  it('updates all observables when subscribe callback fires', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    let capturedCallback: Function | null = null;
    api.subscribe.mockImplementation((cb: Function) => {
      capturedCallback = cb;
      return vi.fn();
    });

    const svc = createEditService(rxjs)(api);

    // Update mock returns
    api.getEditState.mockReturnValue({ status: 'editing', rowId: 'r1', field: 'name' });
    api.isDirty.mockReturnValue(true);
    api.getDirtyRows.mockReturnValue(['r1']);

    expect(capturedCallback).toBeTruthy();
    capturedCallback!();

    let editState: any = null;
    svc.editState$.subscribe((val: any) => {
      editState = val;
    });
    expect(editState).toEqual({ status: 'editing', rowId: 'r1', field: 'name' });

    let isDirty: any = null;
    svc.isDirty$.subscribe((val: any) => {
      isDirty = val;
    });
    expect(isDirty).toBe(true);

    let dirtyRows: any = null;
    svc.dirtyRows$.subscribe((val: any) => {
      dirtyRows = val;
    });
    expect(dirtyRows).toEqual(['r1']);
  });

  it('destroy cleans up subscription and completes subjects', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    const unsub = vi.fn();
    api.subscribe.mockReturnValue(unsub);

    const svc = createEditService(rxjs)(api);
    svc.destroy();

    expect(unsub).toHaveBeenCalled();
  });

  it('commitEdit falls back to Promise.resolve(false) when api returns undefined', async () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    api.commitEdit.mockReturnValue(undefined);

    const svc = createEditService(rxjs)(api);
    const pos = { rowId: 'r1', field: 'name' };
    const result = await svc.commitEdit(pos, 'val');

    expect(result).toBe(false);
  });
});

// ===========================================================================
// syncProperties — null/undefined branch coverage (false branches)
// ===========================================================================

describe('syncProperties — null property branches (skip-sync paths)', () => {
  let ng: ReturnType<typeof createMockAngularRuntime>;
  let PhzGridComponent: any;

  beforeEach(() => {
    ng = createMockAngularRuntime();
    PhzGridComponent = createPhzGridComponent(ng);
  });

  it('skips syncing theme when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).theme = null;
    instance.ngOnChanges({});

    expect(el.theme).toBeUndefined();
  });

  it('skips syncing locale when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).locale = null;
    instance.ngOnChanges({});

    expect(el.locale).toBeUndefined();
  });

  it('skips syncing responsive when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).responsive = null;
    instance.ngOnChanges({});

    expect(el.responsive).toBeUndefined();
  });

  it('skips syncing virtualization when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).virtualization = null;
    instance.ngOnChanges({});

    expect(el.virtualization).toBeUndefined();
  });

  it('skips syncing selectionMode when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).selectionMode = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('selection-mode', expect.anything());
  });

  it('skips syncing editMode when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).editMode = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('edit-mode', expect.anything());
  });

  it('skips syncing loading when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).loading = null;
    instance.ngOnChanges({});

    expect(el.loading).toBeUndefined();
  });

  it('skips syncing height when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).height = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-height', expect.anything());
  });

  it('skips syncing width when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).width = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-width', expect.anything());
  });

  it('skips syncing density when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).density = null;
    instance.ngOnChanges({});

    expect(el.density).toBeUndefined();
  });

  it('skips syncing gridTitle when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).gridTitle = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-title', expect.anything());
  });

  it('skips syncing gridSubtitle when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).gridSubtitle = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-subtitle', expect.anything());
  });

  it('skips syncing scrollMode when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).scrollMode = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('scroll-mode', expect.anything());
  });

  it('skips syncing pageSize when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).pageSize = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('page-size', expect.anything());
  });

  it('skips syncing pageSizeOptions when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).pageSizeOptions = null;
    instance.ngOnChanges({});

    expect(el.pageSizeOptions).toBeUndefined();
  });

  it('skips syncing showToolbar when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showToolbar = null;
    instance.ngOnChanges({});

    expect(el.showToolbar).toBeUndefined();
  });

  it('skips syncing showDensityToggle when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showDensityToggle = null;
    instance.ngOnChanges({});

    expect(el.showDensityToggle).toBeUndefined();
  });

  it('skips syncing showColumnEditor when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showColumnEditor = null;
    instance.ngOnChanges({});

    expect(el.showColumnEditor).toBeUndefined();
  });

  it('skips syncing showAdminSettings when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showAdminSettings = null;
    instance.ngOnChanges({});

    expect(el.showAdminSettings).toBeUndefined();
  });

  it('skips syncing showPagination when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showPagination = null;
    instance.ngOnChanges({});

    expect(el.showPagination).toBeUndefined();
  });

  it('skips syncing showCheckboxes when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showCheckboxes = null;
    instance.ngOnChanges({});

    expect(el.showCheckboxes).toBeUndefined();
  });

  it('skips syncing showRowActions when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showRowActions = null;
    instance.ngOnChanges({});

    expect(el.showRowActions).toBeUndefined();
  });

  it('skips syncing showSelectionActions when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showSelectionActions = null;
    instance.ngOnChanges({});

    expect(el.showSelectionActions).toBeUndefined();
  });

  it('skips syncing showEditActions when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showEditActions = null;
    instance.ngOnChanges({});

    expect(el.showEditActions).toBeUndefined();
  });

  it('skips syncing showCopyActions when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).showCopyActions = null;
    instance.ngOnChanges({});

    expect(el.showCopyActions).toBeUndefined();
  });

  it('skips syncing rowBanding when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).rowBanding = null;
    instance.ngOnChanges({});

    expect(el.rowBanding).toBeUndefined();
  });

  it('skips syncing statusColors when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).statusColors = null;
    instance.ngOnChanges({});

    expect(el.statusColors).toBeUndefined();
  });

  it('skips syncing barThresholds when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).barThresholds = null;
    instance.ngOnChanges({});

    expect(el.barThresholds).toBeUndefined();
  });

  it('skips syncing dateFormats when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).dateFormats = null;
    instance.ngOnChanges({});

    expect(el.dateFormats).toBeUndefined();
  });

  it('skips syncing numberFormats when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).numberFormats = null;
    instance.ngOnChanges({});

    expect(el.numberFormats).toBeUndefined();
  });

  it('skips syncing columnStyles when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).columnStyles = null;
    instance.ngOnChanges({});

    expect(el.columnStyles).toBeUndefined();
  });

  it('skips syncing gridLines when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).gridLines = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-lines', expect.anything());
  });

  it('skips syncing gridLineColor when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).gridLineColor = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-line-color', expect.anything());
  });

  it('skips syncing gridLineWidth when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).gridLineWidth = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('grid-line-width', expect.anything());
  });

  it('skips syncing bandingColor when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).bandingColor = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('banding-color', expect.anything());
  });

  it('skips syncing hoverHighlight when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).hoverHighlight = null;
    instance.ngOnChanges({});

    expect(el.hoverHighlight).toBeUndefined();
  });

  it('skips syncing cellTextOverflow when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).cellTextOverflow = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('cell-text-overflow', expect.anything());
  });

  it('skips syncing compactNumbers when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).compactNumbers = null;
    instance.ngOnChanges({});

    expect(el.compactNumbers).toBeUndefined();
  });

  it('skips syncing autoSizeColumns when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).autoSizeColumns = null;
    instance.ngOnChanges({});

    expect(el.autoSizeColumns).toBeUndefined();
  });

  it('skips syncing aggregation when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).aggregation = null;
    instance.ngOnChanges({});

    expect(el.aggregation).toBeUndefined();
  });

  it('skips syncing aggregationFn when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).aggregationFn = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('aggregation-fn', expect.anything());
  });

  it('skips syncing aggregationPosition when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).aggregationPosition = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('aggregation-position', expect.anything());
  });

  it('skips syncing groupBy when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).groupBy = null;
    instance.ngOnChanges({});

    expect(el.groupBy).toBeUndefined();
  });

  it('skips syncing groupByLevels when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).groupByLevels = null;
    instance.ngOnChanges({});

    expect(el.groupByLevels).toBeUndefined();
  });

  it('skips syncing groupTotals when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).groupTotals = null;
    instance.ngOnChanges({});

    expect(el.groupTotals).toBeUndefined();
  });

  it('skips syncing groupTotalsFn when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).groupTotalsFn = null;
    instance.ngOnChanges({});

    expect(el.groupTotalsFn).toBeUndefined();
  });

  it('skips syncing conditionalFormattingRules when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).conditionalFormattingRules = null;
    instance.ngOnChanges({});

    expect(el.conditionalFormattingRules).toBeUndefined();
  });

  it('skips syncing columnGroups when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).columnGroups = null;
    instance.ngOnChanges({});

    expect(el.columnGroups).toBeUndefined();
  });

  it('skips syncing userRole when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).userRole = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('user-role', expect.anything());
  });

  it('skips syncing copyHeaders when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).copyHeaders = null;
    instance.ngOnChanges({});

    expect(el.copyHeaders).toBeUndefined();
  });

  it('skips syncing copyFormatted when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).copyFormatted = null;
    instance.ngOnChanges({});

    expect(el.copyFormatted).toBeUndefined();
  });

  it('skips syncing loadingMode when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).loadingMode = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('loading-mode', expect.anything());
  });

  it('skips syncing virtualScrollThreshold when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).virtualScrollThreshold = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('virtual-scroll-threshold', expect.anything());
  });

  it('skips syncing fetchPageSize when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).fetchPageSize = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('fetch-page-size', expect.anything());
  });

  it('skips syncing prefetchPages when null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    (instance as any).prefetchPages = null;
    instance.ngOnChanges({});

    expect(el.setAttribute).not.toHaveBeenCalledWith('prefetch-pages', expect.anything());
  });

  it('skips multiple properties in one sync when all are null', () => {
    const el = createMockElement();
    const elementRef = createMockElementRef(el);
    const instance = new PhzGridComponent(elementRef);

    // Set everything to null
    (instance as any).theme = null;
    (instance as any).locale = null;
    (instance as any).responsive = null;
    (instance as any).virtualization = null;
    (instance as any).selectionMode = null;
    (instance as any).editMode = null;
    (instance as any).loading = null;
    (instance as any).height = null;
    (instance as any).width = null;
    (instance as any).density = null;
    (instance as any).gridTitle = null;
    (instance as any).gridSubtitle = null;
    (instance as any).scrollMode = null;
    (instance as any).pageSize = null;
    (instance as any).pageSizeOptions = null;
    (instance as any).showToolbar = null;
    (instance as any).showDensityToggle = null;
    (instance as any).showColumnEditor = null;
    (instance as any).showAdminSettings = null;
    (instance as any).showPagination = null;
    (instance as any).showCheckboxes = null;
    (instance as any).showRowActions = null;
    (instance as any).showSelectionActions = null;
    (instance as any).showEditActions = null;
    (instance as any).showCopyActions = null;
    (instance as any).rowBanding = null;
    (instance as any).statusColors = null;
    (instance as any).barThresholds = null;
    (instance as any).dateFormats = null;
    (instance as any).numberFormats = null;
    (instance as any).columnStyles = null;
    (instance as any).gridLines = null;
    (instance as any).gridLineColor = null;
    (instance as any).gridLineWidth = null;
    (instance as any).bandingColor = null;
    (instance as any).hoverHighlight = null;
    (instance as any).cellTextOverflow = null;
    (instance as any).compactNumbers = null;
    (instance as any).autoSizeColumns = null;
    (instance as any).aggregation = null;
    (instance as any).aggregationFn = null;
    (instance as any).aggregationPosition = null;
    (instance as any).groupBy = null;
    (instance as any).groupByLevels = null;
    (instance as any).groupTotals = null;
    (instance as any).groupTotalsFn = null;
    (instance as any).conditionalFormattingRules = null;
    (instance as any).columnGroups = null;
    (instance as any).userRole = null;
    (instance as any).copyHeaders = null;
    (instance as any).copyFormatted = null;
    (instance as any).loadingMode = null;
    (instance as any).virtualScrollThreshold = null;
    (instance as any).fetchPageSize = null;
    (instance as any).prefetchPages = null;

    instance.ngOnChanges({});

    // data and columns are always synced (no null check)
    expect(el.data).toEqual([]);
    expect(el.columns).toEqual([]);
    // But nothing else should have been set
    expect(el.setAttribute).not.toHaveBeenCalled();
    expect(el.theme).toBeUndefined();
    expect(el.locale).toBeUndefined();
  });
});

describe('createDataService — subscribe callback fires sync', () => {
  it('updates data$ when subscribe callback fires', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    let capturedCallback: Function | null = null;
    api.subscribe.mockImplementation((cb: Function) => {
      capturedCallback = cb;
      return vi.fn();
    });

    const svc = createDataService(rxjs)(api);

    // Update mock
    api.getData.mockReturnValue([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);

    expect(capturedCallback).toBeTruthy();
    capturedCallback!();

    let emitted: any = null;
    svc.data$.subscribe((val: any) => {
      emitted = val;
    });
    expect(emitted).toEqual([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  });

  it('addRow passes position parameter through', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();

    const svc = createDataService(rxjs)(api);
    svc.addRow({ id: 5, name: 'E' }, 2);

    expect(api.addRow).toHaveBeenCalledWith({ id: 5, name: 'E' }, 2);
  });

  it('addRow returns empty string when api.addRow returns undefined', () => {
    const rxjs = createMockRxJS();
    const api = createMockGridApi();
    api.addRow.mockReturnValue(undefined);

    const svc = createDataService(rxjs)(api);
    const result = svc.addRow({ id: 5, name: 'E' });

    expect(result).toBe('');
  });
});
