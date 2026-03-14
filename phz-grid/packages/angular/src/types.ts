/**
 * @phozart/angular — Type definitions
 */
import type {
  GridApi,
  ColumnDefinition,
  GridState,
  RowId,
  CellPosition,
  SortState,
  FilterState,
  FilterOperator,
  EditState,
  ConditionalFormattingRule,
  SelectionChangeEvent,
  SortChangeEvent,
  FilterChangeEvent,
  CellEditCommitEvent,
  CellClickEvent,
  ScrollEvent,
  StateChangeEvent,
} from '@phozart/core';

export interface PhzGridInputs {
  data: unknown[];
  columns: ColumnDefinition[];
  theme: string;
  locale: string;
  responsive: boolean;
  virtualization: boolean;
  selectionMode: 'none' | 'single' | 'multi' | 'range';
  editMode: 'none' | 'click' | 'dblclick' | 'manual';
  loading: boolean;
  height: string | number;
  width: string | number;

  // Grid display properties
  density: 'comfortable' | 'compact' | 'dense';
  gridTitle: string;
  gridSubtitle: string;
  scrollMode: 'paginate' | 'virtual';
  pageSize: number;
  pageSizeOptions: number[];
  showToolbar: boolean;
  showDensityToggle: boolean;
  showColumnEditor: boolean;
  showAdminSettings: boolean;
  showPagination: boolean;
  showCheckboxes: boolean;
  showRowActions: boolean;
  showSelectionActions: boolean;
  showEditActions: boolean;
  showCopyActions: boolean;
  rowBanding: boolean;
  statusColors: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds: Array<{ min: number; color: string }>;
  dateFormats: Record<string, string>;
  numberFormats: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }>;
  columnStyles: Record<string, string>;
  gridLines: 'none' | 'horizontal' | 'vertical' | 'both';
  gridLineColor: string;
  gridLineWidth: 'thin' | 'medium';
  bandingColor: string;
  hoverHighlight: boolean;
  cellTextOverflow: 'ellipsis' | 'clip' | 'wrap';
  compactNumbers: boolean;
  autoSizeColumns: boolean;
  aggregation: boolean;
  aggregationFn: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
  aggregationPosition: 'top' | 'bottom' | 'both';
  groupBy: string[];
  groupByLevels: string[][];
  groupTotals: boolean;
  groupTotalsFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
  conditionalFormattingRules: ConditionalFormattingRule[];
  columnGroups: Array<{ header: string; children: string[] }>;
  userRole: 'viewer' | 'user' | 'editor' | 'admin';
  copyHeaders: boolean;
  copyFormatted: boolean;
  loadingMode: 'paginate' | 'lazy';
  virtualScrollThreshold: number;
  fetchPageSize: number;
  prefetchPages: number;
}

export interface PhzGridOutputs {
  gridReady: { gridInstance: GridApi };
  stateChange: StateChangeEvent;
  cellClick: CellClickEvent;
  selectionChange: SelectionChangeEvent;
  sortChange: SortChangeEvent;
  filterChange: FilterChangeEvent;
  editCommit: CellEditCommitEvent;
  scroll: ScrollEvent;
}

export interface GridServiceConfig {
  gridApi: GridApi;
}

/**
 * Minimal RxJS runtime interface to avoid hard dependency on rxjs.
 * Consumers pass their RxJS instance to the service factories.
 */
export interface RxJSRuntime {
  BehaviorSubject: new <T>(initial: T) => BehaviorSubjectLike<T>;
  Subject: new <T>() => SubjectLike<T>;
}

export interface BehaviorSubjectLike<T> {
  value: T;
  next(value: T): void;
  subscribe(observer: (value: T) => void): { unsubscribe(): void };
  asObservable(): ObservableLike<T>;
  complete(): void;
}

export interface SubjectLike<T> {
  next(value: T): void;
  subscribe(observer: (value: T) => void): { unsubscribe(): void };
  asObservable(): ObservableLike<T>;
  complete(): void;
}

export interface ObservableLike<T> {
  subscribe(observer: (value: T) => void): { unsubscribe(): void };
}

export interface SelectionServiceReturn {
  selectedRows$: ObservableLike<RowId[]>;
  selectedCells$: ObservableLike<CellPosition[]>;
  select(ids: RowId | RowId[]): void;
  deselect(ids: RowId | RowId[]): void;
  selectAll(): void;
  deselectAll(): void;
  destroy(): void;
}

export interface SortServiceReturn {
  sortState$: ObservableLike<SortState | null>;
  sort(field: string, direction: 'asc' | 'desc' | null): void;
  multiSort(sorts: Array<{ field: string; direction: 'asc' | 'desc' }>): void;
  clearSort(): void;
  destroy(): void;
}

export interface FilterServiceReturn {
  filterState$: ObservableLike<FilterState | null>;
  addFilter(field: string, operator: FilterOperator, value: unknown): void;
  removeFilter(field: string): void;
  clearFilters(): void;
  destroy(): void;
}

export interface EditServiceReturn {
  editState$: ObservableLike<EditState | null>;
  isDirty$: ObservableLike<boolean>;
  dirtyRows$: ObservableLike<RowId[]>;
  startEdit(position: CellPosition): void;
  commitEdit(position: CellPosition, value: unknown): Promise<boolean>;
  cancelEdit(position: CellPosition): void;
  destroy(): void;
}

export interface DataServiceReturn {
  data$: ObservableLike<unknown[]>;
  setData(data: unknown[]): void;
  addRow(rowData: Record<string, unknown>, position?: number): RowId;
  updateRow(id: RowId, data: Partial<Record<string, unknown>>): void;
  deleteRow(id: RowId): void;
  destroy(): void;
}
