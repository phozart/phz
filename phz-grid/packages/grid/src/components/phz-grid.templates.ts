/**
 * Extracted render templates for phz-grid.
 * These are pure template functions that take data parameters
 * and return Lit TemplateResult.
 */
import { html, nothing, type TemplateResult } from 'lit';
import type { ColumnDefinition, RowData, RowGroup, RowId } from '@phozart/phz-core';
import type { RowAction } from '../types.js';
import type { AggregationController } from '../controllers/aggregation.controller.js';

type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';

export interface TitleBarOpts {
  titleBarBg: string;
  titleBarText: string;
  titleFontFamily: string;
  titleIcon: string;
  titleFontSize: number;
  gridTitle: string;
  gridSubtitle: string;
  subtitleFontSize: number;
  totalRowCount: number;
  filteredRowCount?: number;
}

export function renderTitleBar(opts: TitleBarOpts): TemplateResult {
  return html`
    <div class="phz-header-bar"
         style="background:${opts.titleBarBg};color:${opts.titleBarText};font-family:${opts.titleFontFamily};">
      <div class="phz-header-bar__left">
        ${opts.titleIcon ? html`<span class="phz-header-bar__logo">${opts.titleIcon}</span>` : nothing}
        <span class="phz-header-bar__title" style="font-size:${opts.titleFontSize}px">${opts.gridTitle}</span>
        ${opts.gridSubtitle ? html`
          <span class="phz-header-bar__divider">\u00B7</span>
          <span class="phz-header-bar__subtitle" style="font-size:${opts.subtitleFontSize}px">${opts.gridSubtitle}</span>` : nothing}
      </div>
      <div class="phz-header-bar__right">
        <div class="phz-header-bar__records">
          <span class="phz-header-bar__dot"></span>
          <span>${(opts.filteredRowCount ?? opts.totalRowCount).toLocaleString()} records</span>
        </div>
      </div>
    </div>`;
}

export interface PaginationOpts {
  filteredRowCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  align?: 'left' | 'center' | 'right';
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function renderPagination(opts: PaginationOpts): TemplateResult {
  const { currentPage: current, totalPages: total } = opts;
  const alignClass = opts.align === 'left' ? ' phz-pagination--left'
    : opts.align === 'center' ? ' phz-pagination--center' : '';
  return html`
    <div class="phz-pagination${alignClass}" role="navigation" aria-label="Pagination">
      <div class="phz-pagination__info">
        <span class="phz-pagination__rows">${opts.filteredRowCount.toLocaleString()} rows</span>
        <span class="phz-pagination__sep">\u00B7</span>
        <span>Page ${current + 1} of ${total || 1}</span>
      </div>
      <div class="phz-pagination__controls">
        <label class="phz-pagination__size-label">
          <span>Rows</span>
          <select class="phz-pagination__size"
                  aria-label="Rows per page"
                  .value=${String(opts.pageSize)}
                  @change=${(e: Event) => opts.onPageSizeChange(Number((e.target as HTMLSelectElement).value))}>
            ${opts.pageSizeOptions.map(n => html`<option value=${n} ?selected=${n === opts.pageSize}>${n}</option>`)}
          </select>
        </label>
        <div class="phz-pagination__nav">
          <button class="phz-pagination__btn" aria-label="First page" ?disabled=${current === 0}
                  @click=${() => opts.onPageChange(0)}>\u00AB</button>
          <button class="phz-pagination__btn" aria-label="Previous page" ?disabled=${current === 0}
                  @click=${() => opts.onPageChange(Math.max(0, current - 1))}>\u2039</button>
          <span class="phz-pagination__page">${current + 1}</span>
          <button class="phz-pagination__btn" aria-label="Next page" ?disabled=${current >= total - 1}
                  @click=${() => opts.onPageChange(Math.min(total - 1, current + 1))}>\u203A</button>
          <button class="phz-pagination__btn" aria-label="Last page" ?disabled=${current >= total - 1}
                  @click=${() => opts.onPageChange(total - 1)}>\u00BB</button>
        </div>
      </div>
    </div>`;
}

export interface GroupedRowsOpts {
  groups: RowGroup[];
  columnDefs: ColumnDefinition[];
  groupTotals: boolean;
  groupTotalsFn: AggregationFn;
  groupTotalsOverrides: Record<string, AggregationFn>;
  aggCtrl: AggregationController;
  renderRow: (row: RowData, rowIdx: number) => TemplateResult;
}

export function renderGroupedRows(opts: GroupedRowsOpts): TemplateResult {
  const result: TemplateResult[] = [];
  const walkGroups = (groups: RowGroup[], depth: number) => {
    for (const group of groups) {
      result.push(html`
        <tr class="phz-group-row" data-depth=${depth}>
          <td class="phz-group-cell" colspan=${opts.columnDefs.filter(c => !c.hidden).length}>
            <span style="padding-left:${depth * 16}px">
              \u25B8 ${String(group.value)} (${group.rows.length})
            </span>
          </td>
        </tr>`);
      if (group.subGroups && group.subGroups.length > 0) {
        walkGroups(group.subGroups, depth + 1);
      } else {
        for (const row of group.rows as RowData[]) {
          result.push(opts.renderRow(row, 0));
        }
        if (opts.groupTotals) {
          const visibleCols = opts.columnDefs.filter(c => !c.hidden);
          result.push(html`
            <tr class="phz-group-totals-row">
              ${visibleCols.map(col => {
                const fn = opts.groupTotalsOverrides[col.field] ?? opts.groupTotalsFn;
                const val = opts.aggCtrl.computeColumnAgg(group.rows as Record<string, unknown>[], col, fn);
                return html`<td class="phz-data-cell phz-data-cell--total">${val}</td>`;
              })}
            </tr>`);
        }
      }
    }
  };
  walkGroups(opts.groups, 0);
  return html`${result}`;
}

export interface ColumnGroupHeaderOpts {
  showCheckboxes: boolean;
  showRowActions: boolean;
  effectiveRowActions: RowAction[];
  columnGroups: Array<{ header: string; children: string[] }>;
  columnDefs: ColumnDefinition[];
}

export function renderColumnGroupHeader(opts: ColumnGroupHeaderOpts): TemplateResult {
  const checkboxSpan = opts.showCheckboxes ? html`<th class="phz-group-header-cell"></th>` : nothing;
  const actionSpan = (opts.showRowActions && opts.effectiveRowActions.length > 0)
    ? html`<th class="phz-group-header-cell"></th>` : nothing;
  return html`
    <tr class="phz-thead-row phz-thead-row--group">
      ${checkboxSpan}
      ${opts.columnGroups.map(g => {
        const childCount = g.children.filter(f => {
          const col = opts.columnDefs.find(c => c.field === f);
          return col && !col.hidden;
        }).length;
        return childCount > 0 ? html`<th class="phz-group-header-cell" colspan=${childCount}>${g.header}</th>` : nothing;
      })}
      ${actionSpan}
    </tr>`;
}
