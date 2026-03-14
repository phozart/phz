/**
 * @phozart/core — Export audit event tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createGrid } from '../create-grid.js';

const sampleData = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
];

const columns = [
  { field: 'name', header: 'Name' },
  { field: 'age', header: 'Age', type: 'number' as const },
];

describe('export audit events', () => {
  it('emits export:start before generating CSV', () => {
    const grid = createGrid({ data: sampleData, columns });
    const handler = vi.fn();
    grid.on('export:start', handler);
    grid.exportCsv();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'export:start',
      format: 'csv',
      rowCount: 2,
      columnCount: 2,
    });
  });

  it('emits export:complete after generating CSV', () => {
    const grid = createGrid({ data: sampleData, columns });
    const handler = vi.fn();
    grid.on('export:complete', handler);
    grid.exportCsv();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'export:complete',
      format: 'csv',
      rowCount: 2,
    });
  });

  it('export:start fires before export:complete', () => {
    const grid = createGrid({ data: sampleData, columns });
    const order: string[] = [];
    grid.on('export:start', () => { order.push('start'); });
    grid.on('export:complete', () => { order.push('complete'); });
    grid.exportCsv();
    expect(order).toEqual(['start', 'complete']);
  });

  it('export:start includes correct columnCount for selectedOnly', () => {
    const grid = createGrid({ data: sampleData, columns });
    const handler = vi.fn();
    grid.on('export:start', handler);
    grid.exportCsv({ columns: ['name'] });
    expect(handler.mock.calls[0][0].columnCount).toBe(1);
  });
});
