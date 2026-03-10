import { describe, it, expect, vi } from 'vitest';
import { ComputedColumnsController, type ComputedColumnsHost } from '../controllers/computed-columns.controller.js';
import type { ColumnDefinition, RowData } from '@phozart/phz-core';

function makeHost(overrides?: Partial<ComputedColumnsHost>): ComputedColumnsHost {
  return {
    columnDefs: [
      { field: 'price', header: 'Price', type: 'number' },
      { field: 'qty', header: 'Qty', type: 'number' },
    ] as ColumnDefinition[],
    visibleRows: [
      { __id: 'r1', price: 10, qty: 5 },
      { __id: 'r2', price: 20, qty: 3 },
    ] as RowData[],
    setColumnDefs: vi.fn(),
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

describe('ComputedColumnsController', () => {
  it('registers with host', () => {
    const host = makeHost();
    const ctrl = new ComputedColumnsController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
  });

  describe('applyComputedColumns', () => {
    it('adds computed column defs and populates row data', () => {
      const host = makeHost();
      const ctrl = new ComputedColumnsController(host);
      ctrl.applyComputedColumns([
        { field: 'total', header: 'Total', formula: (row: any) => row.price * row.qty },
      ]);

      // Should add column def
      expect(host.setColumnDefs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ field: 'total', header: 'Total' }),
        ]),
      );

      // Should augment rows
      expect(host.visibleRows[0].total).toBe(50);
      expect(host.visibleRows[1].total).toBe(60);
    });

    it('does nothing with empty computed columns', () => {
      const host = makeHost();
      const ctrl = new ComputedColumnsController(host);
      ctrl.applyComputedColumns([]);
      expect(host.setColumnDefs).not.toHaveBeenCalled();
    });

    it('skips columns that already exist in columnDefs', () => {
      const host = makeHost();
      const ctrl = new ComputedColumnsController(host);
      ctrl.applyComputedColumns([
        { field: 'price', header: 'Price Override', formula: (row: any) => row.price * 2 },
      ]);

      // Should NOT add duplicate column def
      const callArgs = host.setColumnDefs as ReturnType<typeof vi.fn>;
      expect(callArgs).not.toHaveBeenCalled();
    });
  });
});
