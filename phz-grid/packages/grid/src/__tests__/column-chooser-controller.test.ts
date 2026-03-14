import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ColumnChooserController, type ColumnChooserHost } from '../controllers/column-chooser.controller.js';
import type { ColumnDefinition } from '@phozart/core';

function makeHost(overrides?: Partial<ColumnChooserHost>): ColumnChooserHost {
  return {
    columnDefs: [
      { field: 'name', header: 'Name', hidden: false },
      { field: 'age', header: 'Age', hidden: false },
      { field: 'email', header: 'Email', hidden: true },
    ] as ColumnDefinition[],
    setColumnDefs: vi.fn(),
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

describe('ColumnChooserController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers with host', () => {
    const host = makeHost();
    const ctrl = new ColumnChooserController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
  });

  it('starts with chooser closed', () => {
    const host = makeHost();
    const ctrl = new ColumnChooserController(host);
    expect(ctrl.columnChooserOpen).toBe(false);
    expect(ctrl.colPanelOpen).toBe(false);
  });

  describe('open/close', () => {
    it('opens the column chooser', () => {
      const host = makeHost();
      const ctrl = new ColumnChooserController(host);
      ctrl.open();
      expect(ctrl.columnChooserOpen).toBe(true);
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it('closes the column chooser', () => {
      const host = makeHost();
      const ctrl = new ColumnChooserController(host);
      ctrl.open();
      ctrl.close();
      expect(ctrl.columnChooserOpen).toBe(false);
    });
  });

  describe('handleColumnChooserChange', () => {
    it('shows/hides columns and reorders based on detail', () => {
      const host = makeHost();
      const ctrl = new ColumnChooserController(host);
      ctrl.handleColumnChooserChange({ visibility: { age: true, email: true, name: false }, order: ['email', 'age'] });

      expect(host.setColumnDefs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email', hidden: false }),
          expect.objectContaining({ field: 'age', hidden: false }),
          expect.objectContaining({ field: 'name', hidden: true }),
        ]),
      );
    });
  });

  describe('hideColumn', () => {
    it('hides a single column by field', () => {
      const host = makeHost();
      const ctrl = new ColumnChooserController(host);
      ctrl.hideColumn('name');

      expect(host.setColumnDefs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', hidden: true }),
          expect.objectContaining({ field: 'age', hidden: false }),
        ]),
      );
    });
  });
});
