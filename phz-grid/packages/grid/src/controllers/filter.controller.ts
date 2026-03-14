import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/core';
import type { FilterInfo } from '../types.js';
import type { FilterValueEntry, FilterApplyEvent } from '../components/phz-filter-popover.js';
import type { AriaManager } from '../a11y/aria-manager.js';

export interface FilterHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  ariaManager: AriaManager | null;
  columnDefs: ColumnDefinition[];
  visibleRows: RowData[];
  renderRoot: Element | ShadowRoot | DocumentFragment;
}

export class FilterController implements ReactiveController {
  private host: FilterHost;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _cachedFilteredRows: RowData[] | null = null;
  private _filterCacheKey: string = '';

  filterOpen: boolean = false;
  filterField: string = '';
  filterAnchorRect: DOMRect | null = null;
  filterValues: FilterValueEntry[] = [];
  filterColumnType: string = 'string';
  activeFilters: Map<string, FilterInfo> = new Map();
  searchQuery: string = '';

  // Pagination dependency — reset to 0 on search
  onSearchChange?: (query: string) => void;

  constructor(host: FilterHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }

  handleSearchInput(value: string): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.searchQuery = value;
      this.onSearchChange?.(value);
      this.host.requestUpdate();
    }, 150);
  }

  get filteredRows(): RowData[] {
    const cacheKey = `${this.searchQuery}:${this.host.visibleRows.length}`;
    if (this._cachedFilteredRows && this._filterCacheKey === cacheKey) {
      return this._cachedFilteredRows;
    }
    this._filterCacheKey = cacheKey;
    if (!this.searchQuery) {
      this._cachedFilteredRows = this.host.visibleRows;
    } else {
      const q = this.searchQuery.toLowerCase();
      this._cachedFilteredRows = this.host.visibleRows.filter(row =>
        this.host.columnDefs.some(col => {
          const val = row[col.field];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    return this._cachedFilteredRows;
  }

  invalidateCache(): void {
    this._cachedFilteredRows = null;
  }

  openFilterPopover(field: string, e?: MouseEvent): void {
    if (this.filterOpen && this.filterField === field) {
      this.filterOpen = false;
      this.host.requestUpdate();
      return;
    }

    const col = this.host.columnDefs.find(c => c.field === field);
    if (!col) return;

    let anchorRect: DOMRect;
    if (e) {
      const target = (e.target as HTMLElement).closest('.phz-header-cell, th');
      anchorRect = target ? target.getBoundingClientRect() : new DOMRect(e.clientX, e.clientY, 0, 0);
    } else {
      const headerCell = (this.host.renderRoot as Element).querySelector(`th[aria-colindex="${this.host.columnDefs.indexOf(col) + 1}"]`);
      anchorRect = headerCell ? headerCell.getBoundingClientRect() : new DOMRect(200, 100, 0, 0);
    }

    const valueCounts = new Map<string, { value: unknown; count: number }>();
    let blanks = 0;

    for (const row of this.host.visibleRows) {
      const val = col.valueGetter ? col.valueGetter(row) : row[col.field];
      if (val == null || val === '') {
        blanks++;
      } else {
        const key = String(val);
        const existing = valueCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          valueCounts.set(key, { value: val, count: 1 });
        }
      }
    }

    const activeFilter = this.activeFilters.get(field);
    const activeValues = activeFilter?.operator === 'in' && Array.isArray(activeFilter.value)
      ? new Set((activeFilter.value as unknown[]).map(String))
      : null;

    const entries: FilterValueEntry[] = [];
    for (const [key, info] of valueCounts) {
      entries.push({
        value: info.value,
        displayText: key,
        count: info.count,
        checked: activeValues ? activeValues.has(key) : true,
      });
    }
    entries.sort((a, b) => a.displayText.localeCompare(b.displayText));

    if (blanks > 0) {
      entries.push({
        value: null,
        displayText: '(Blanks)',
        count: blanks,
        checked: activeValues ? activeValues.has('null') : true,
      });
    }

    this.filterField = field;
    this.filterAnchorRect = anchorRect;
    this.filterValues = entries;

    let detectedType = (col.type as string) ?? 'string';
    if (detectedType === 'string' || detectedType === 'custom') {
      let dateCount = 0;
      const sample = entries.slice(0, 20);
      for (const entry of sample) {
        if (entry.value == null) continue;
        const s = String(entry.value);
        if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s) ||
            /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(s) ||
            (s.length >= 8 && !isNaN(new Date(s).getTime()) && /[-/:]/.test(s))) {
          dateCount++;
        }
      }
      if (sample.length > 0 && dateCount / sample.length > 0.5) detectedType = 'date';
    }
    this.filterColumnType = detectedType;
    this.filterOpen = true;
    this.host.requestUpdate();
  }

  handleFilterApply(detail: FilterApplyEvent, onPageReset?: () => void): void {
    if (!this.host.gridApi) return;
    const { field, selectedValues, customFilter, datePartFilters } = detail;

    const currentFilters = this.host.gridApi.getFilterState().filters;
    const keepFilters = currentFilters.filter(f => f.field !== field);
    const newFieldFilters: Array<{ field: string; operator: any; value: unknown }> = [];

    if (customFilter) {
      newFieldFilters.push({ field, operator: customFilter.operator, value: customFilter.value });
    } else if (selectedValues.length > 0 && selectedValues.length < this.filterValues.length) {
      newFieldFilters.push({ field, operator: 'in', value: selectedValues });
    }

    if (datePartFilters) {
      for (const dp of datePartFilters) {
        newFieldFilters.push({ field, operator: dp.type, value: dp.values });
      }
    }

    this.host.gridApi.setFilters([...keepFilters, ...newFieldFilters]);
    onPageReset?.();

    this.host.updateComplete.then(() => {
      this.host.ariaManager?.announceChange(`Filtered to ${this.filteredRows.length} rows`);
    });
  }

  syncFromGridState(filters: Array<{ field: string; operator: any; value: unknown }>): void {
    const newFilters = new Map<string, FilterInfo>();
    for (const f of filters) {
      newFilters.set(f.field, { field: f.field, operator: f.operator, value: f.value });
    }
    this.activeFilters = newFilters;
    this._cachedFilteredRows = null;
  }
}
