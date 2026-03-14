import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClipboardController, type ClipboardHost } from '../controllers/clipboard.controller.js';
import * as copyEngine from '../clipboard/copy-engine.js';
import type { RowData, ColumnDefinition, RowId } from '@phozart/core';

vi.mock('../clipboard/copy-engine.js', () => ({
  formatCellForCopy: vi.fn(() => 'formatted-value'),
  copyToClipboard: vi.fn(),
  buildCopyText: vi.fn(() => ({ text: 'copy-text', rowCount: 1, colCount: 2 })),
}));

function makeHost(overrides?: Partial<ClipboardHost>): ClipboardHost {
  const host: ClipboardHost = {
    visibleRows: [
      { __id: 'r1', name: 'Alice', age: 30 },
      { __id: 'r2', name: 'Bob', age: 25 },
      { __id: 'r3', name: 'Carol', age: 35 },
    ] as RowData[],
    columnDefs: [
      { field: 'name', header: 'Name' },
      { field: 'age', header: 'Age', type: 'number' },
    ] as ColumnDefinition[],
    selectedRowIds: new Set<RowId>(),
    copyHeaders: true,
    copyFormatted: false,
    maxCopyRows: 0,
    excludeFieldsFromCopy: [],
    dateFormats: {},
    cellRangeAnchor: null,
    cellRangeEnd: null,
    toast: { show: vi.fn() } as any,
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
  return host;
}

describe('ClipboardController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('implements ReactiveController lifecycle', () => {
    const host = makeHost();
    const ctrl = new ClipboardController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
    ctrl.hostConnected();
    ctrl.hostDisconnected();
  });

  describe('copyCell', () => {
    it('copies a single cell value to clipboard', () => {
      const host = makeHost();
      const ctrl = new ClipboardController(host);
      ctrl.copyCell('r1' as RowId, 'name');

      expect(copyEngine.formatCellForCopy).toHaveBeenCalledWith(
        'Alice',
        'string',
        false,
        undefined,
      );
      expect(copyEngine.copyToClipboard).toHaveBeenCalledWith('formatted-value');
      expect(host.toast.show).toHaveBeenCalledWith('Cell copied', 'success', { icon: 'copy' });
    });

    it('does nothing when row not found', () => {
      const host = makeHost();
      const ctrl = new ClipboardController(host);
      ctrl.copyCell('nonexistent' as RowId, 'name');

      expect(copyEngine.copyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('copyRow', () => {
    it('copies a full row to clipboard', () => {
      const host = makeHost();
      const ctrl = new ClipboardController(host);
      ctrl.copyRow('r1' as RowId);

      expect(copyEngine.buildCopyText).toHaveBeenCalledWith(
        [expect.objectContaining({ __id: 'r1' })],
        host.columnDefs,
        { includeHeaders: true, formatted: false, dateFormats: {} },
      );
      expect(copyEngine.copyToClipboard).toHaveBeenCalledWith('copy-text');
      expect(host.toast.show).toHaveBeenCalledWith('Row copied', 'success', { icon: 'copy' });
    });

    it('excludes fields listed in excludeFieldsFromCopy', () => {
      const host = makeHost({ excludeFieldsFromCopy: ['age'] });
      const ctrl = new ClipboardController(host);
      ctrl.copyRow('r1' as RowId);

      expect(copyEngine.buildCopyText).toHaveBeenCalledWith(
        expect.anything(),
        [expect.objectContaining({ field: 'name' })],
        expect.anything(),
      );
    });
  });

  describe('copyCellRange', () => {
    it('copies a cell range to clipboard', () => {
      const host = makeHost({
        cellRangeAnchor: { rowIndex: 0, colIndex: 0 },
        cellRangeEnd: { rowIndex: 1, colIndex: 1 },
      });
      const ctrl = new ClipboardController(host);
      ctrl.copyCellRange(true);

      expect(copyEngine.buildCopyText).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ __id: 'r1' })]),
        expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
        { includeHeaders: true, formatted: false, dateFormats: {} },
      );
      expect(host.toast.show).toHaveBeenCalledWith('4 cells copied', 'success', { icon: 'copy' });
    });

    it('does nothing when no range is selected', () => {
      const host = makeHost();
      const ctrl = new ClipboardController(host);
      ctrl.copyCellRange(false);

      expect(copyEngine.copyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('copySelectedRows', () => {
    it('copies selected rows to clipboard', () => {
      const host = makeHost({ selectedRowIds: new Set(['r1', 'r3'] as RowId[]) });
      const ctrl = new ClipboardController(host);
      ctrl.copySelectedRows(false);

      expect(copyEngine.buildCopyText).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ __id: 'r1' }),
          expect.objectContaining({ __id: 'r3' }),
        ]),
        host.columnDefs,
        { includeHeaders: false, formatted: false, dateFormats: {} },
      );
      expect(host.toast.show).toHaveBeenCalledWith('2 rows copied', 'success', { icon: 'copy' });
    });

    it('rejects when exceeding maxCopyRows', () => {
      const host = makeHost({
        selectedRowIds: new Set(['r1', 'r2', 'r3'] as RowId[]),
        maxCopyRows: 2,
      });
      const ctrl = new ClipboardController(host);
      ctrl.copySelectedRows(false);

      expect(copyEngine.copyToClipboard).not.toHaveBeenCalled();
      expect(host.toast.show).toHaveBeenCalledWith('Cannot copy more than 2 rows', 'error', { icon: 'error' });
    });
  });
});
