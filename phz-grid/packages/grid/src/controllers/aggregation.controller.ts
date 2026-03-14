import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition, RowData } from '@phozart/core';

type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';

export interface AggregationHost extends ReactiveControllerHost {
  filteredRows: RowData[];
}

export class AggregationController implements ReactiveController {
  private host: AggregationHost;

  constructor(host: AggregationHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  computeColumnAgg(rows: Record<string, unknown>[], col: ColumnDefinition, fn: AggregationFn): string {
    const values = rows
      .map(r => col.valueGetter ? col.valueGetter(r as any) : r[col.field])
      .filter(v => v != null && v !== '');

    switch (fn) {
      case 'count': return String(values.length);
      case 'sum': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.reduce((s, n) => s + n, 0).toLocaleString();
      }
      case 'avg': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        if (nums.length === 0) return '0';
        return (nums.reduce((s, n) => s + n, 0) / nums.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
      case 'min': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length ? nums.reduce((m, v) => v < m ? v : m, Infinity).toLocaleString() : '';
      }
      case 'max': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length ? nums.reduce((m, v) => v > m ? v : m, -Infinity).toLocaleString() : '';
      }
      default: return String(values.length);
    }
  }

  /**
   * Compute a summary row for all visible columns.
   * Returns a map of field -> formatted aggregation value.
   */
  computeSummaryRow(
    rows: Record<string, unknown>[],
    columns: ColumnDefinition[],
    fn: AggregationFn,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const col of columns) {
      // Only numeric columns get sum/avg/min/max. Date/datetime values as strings
      // cannot be meaningfully Number()-coerced, so they only support count.
      if (col.type === 'number') {
        result[col.field] = this.computeColumnAgg(rows, col, fn);
      } else if (fn === 'count') {
        result[col.field] = this.computeColumnAgg(rows, col, 'count');
      } else {
        result[col.field] = '';
      }
    }

    return result;
  }

  static getSummaryLabel(fn: AggregationFn): string {
    const labels: Record<AggregationFn, string> = {
      sum: 'Sum',
      avg: 'Average',
      min: 'Minimum',
      max: 'Maximum',
      count: 'Count',
      none: '',
    };
    return labels[fn] ?? '';
  }
}
