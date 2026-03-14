/**
 * @phozart/grid — DOM Custom Event Map
 *
 * These are the CustomEvent types dispatched by the <phz-grid> element.
 * They bridge the internal EventEmitter (colon-separated names) to
 * standard DOM events (hyphen-separated names).
 */
import type {
  GridApi,
  StateChangeEvent,
  CellClickEvent,
  CellDoubleClickEvent,
  SelectionChangeEvent,
  SortChangeEvent,
  FilterChangeEvent,
  CellEditStartEvent,
  CellEditCommitEvent,
  CellEditCancelEvent,
  ScrollEvent,
} from '@phozart/core';
import type { DrillThroughConfig, GridRowDrillSource } from '@phozart/core';

export interface RowClickEventDetail {
  rowId: string | number;
  rowIndex: number;
  data: unknown;
  originalEvent: Event;
}

export interface RowActionEventDetail {
  actionId: string;
  rowId: string | number;
  rowData: Record<string, unknown>;
  href?: string;
  isBulk: boolean;
  rowIds?: (string | number)[];
}

export interface GenerateDashboardEventDetail {
  dataMode: 'filtered' | 'full';
  reportId?: string;
  reportName?: string;
  currentFilters: Array<{ field: string; operator: string; value: unknown }>;
  currentSort: Array<{ field: string; direction: 'asc' | 'desc' }>;
  visibleColumns: Array<{ field: string; header?: string; type?: string }>;
  href?: string;
}

export interface PhzGridEventMap {
  'grid-ready': CustomEvent<{ gridInstance: GridApi }>;
  'state-change': CustomEvent<StateChangeEvent>;
  'cell-click': CustomEvent<CellClickEvent>;
  'cell-dblclick': CustomEvent<CellDoubleClickEvent>;
  'row-click': CustomEvent<RowClickEventDetail>;
  'selection-change': CustomEvent<SelectionChangeEvent>;
  'sort-change': CustomEvent<SortChangeEvent>;
  'filter-change': CustomEvent<FilterChangeEvent>;
  'edit-start': CustomEvent<CellEditStartEvent>;
  'edit-commit': CustomEvent<CellEditCommitEvent>;
  'edit-cancel': CustomEvent<CellEditCancelEvent>;
  'scroll': CustomEvent<ScrollEvent>;
  'resize': CustomEvent<{ width: number; height: number }>;
  'copy': CustomEvent<{ text: string; rowCount: number; colCount: number; source: 'cell' | 'range' | 'rows' }>;
  'drill-through': CustomEvent<{
    source: GridRowDrillSource;
    config: DrillThroughConfig;
    field: string;
    value: unknown;
  }>;
  'row-action': CustomEvent<RowActionEventDetail>;
  'generate-dashboard': CustomEvent<GenerateDashboardEventDetail>;
  'virtual-scroll': CustomEvent<{ startIndex: number; endIndex: number; totalCount: number }>;
  'remote-data-load': CustomEvent<{ offset: number; count: number; totalCount: number }>;
  'remote-data-error': CustomEvent<{ error: Error; offset: number }>;
  'bulk-delete': CustomEvent<{ rowIds: (string | number)[] }>;
  'admin-settings': CustomEvent<Record<string, never>>;
}

export function dispatchGridEvent<K extends keyof PhzGridEventMap>(
  host: HTMLElement,
  eventName: K,
  detail: PhzGridEventMap[K]['detail'],
): void {
  host.dispatchEvent(
    new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
    }),
  );
}
