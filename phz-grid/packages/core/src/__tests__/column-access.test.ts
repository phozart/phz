/**
 * @phozart/phz-core — Column Access Control Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { createGrid } from '../create-grid.js';
import type { ColumnDefinition } from '../types/column.js';

const sampleData = [
  { id: 1, name: 'Alice', ssn: '123-45-6789', salary: 90000 },
  { id: 2, name: 'Bob', ssn: '987-65-4321', salary: 75000 },
  { id: 3, name: 'Charlie', ssn: '555-12-3456', salary: 110000 },
];

const maskSSN = (value: any) => {
  const str = String(value ?? '');
  return str.length > 4 ? '***-**-' + str.slice(-4) : '****';
};

function makeColumns(): ColumnDefinition[] {
  return [
    { field: 'name', header: 'Name' },
    {
      field: 'ssn',
      header: 'SSN',
      access: {
        requiredRoles: ['admin'],
        mask: maskSSN,
      },
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      access: {
        requiredRoles: ['admin', 'editor'],
      },
    },
  ];
}

describe('Column Access Control', () => {
  describe('visibility', () => {
    it('hides columns when user lacks required role and no mask', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const state = grid.getColumnState();
      expect(state.visibility['name']).toBe(true);
      expect(state.visibility['ssn']).toBe(true); // has mask → visible
      expect(state.visibility['salary']).toBe(false); // no mask → hidden
    });

    it('shows masked columns as visible when user lacks role but mask exists', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'user',
      });
      const state = grid.getColumnState();
      expect(state.visibility['ssn']).toBe(true); // masked, not hidden
    });

    it('shows all columns when no userRole provided (backward compat)', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
      });
      const state = grid.getColumnState();
      expect(state.visibility['name']).toBe(true);
      expect(state.visibility['ssn']).toBe(true);
      expect(state.visibility['salary']).toBe(true);
    });

    it('shows all columns when user has required role', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'admin',
      });
      const state = grid.getColumnState();
      expect(state.visibility['name']).toBe(true);
      expect(state.visibility['ssn']).toBe(true);
      expect(state.visibility['salary']).toBe(true);
    });
  });

  describe('setColumnVisibility guard', () => {
    it('blocks showing a restricted column', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      // salary is restricted for viewer
      grid.setColumnVisibility('salary', true);
      expect(grid.getColumnState().visibility['salary']).toBe(false);
    });

    it('emits column:access:denied event when blocked', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const handler = vi.fn();
      grid.on('column:access:denied', handler);
      grid.setColumnVisibility('salary', true);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]).toMatchObject({
        type: 'column:access:denied',
        field: 'salary',
        userRole: 'viewer',
        requiredRoles: ['admin', 'editor'],
      });
    });

    it('allows hiding a restricted column', () => {
      // This is a no-op since it's already hidden, but shouldn't throw
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      grid.setColumnVisibility('salary', false);
      expect(grid.getColumnState().visibility['salary']).toBe(false);
    });

    it('allows toggling non-restricted columns freely', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      grid.setColumnVisibility('name', false);
      expect(grid.getColumnState().visibility['name']).toBe(false);
      grid.setColumnVisibility('name', true);
      expect(grid.getColumnState().visibility['name']).toBe(true);
    });
  });

  describe('resetColumns', () => {
    it('keeps restricted columns hidden after reset', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      grid.setColumnVisibility('name', false);
      grid.resetColumns();
      expect(grid.getColumnState().visibility['name']).toBe(true);
      expect(grid.getColumnState().visibility['salary']).toBe(false);
    });
  });

  describe('API methods', () => {
    it('getAccessibleColumns excludes restricted columns', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const accessible = grid.getAccessibleColumns();
      const fields = accessible.map(c => c.field);
      expect(fields).toContain('name');
      expect(fields).toContain('ssn'); // masked, not restricted
      expect(fields).not.toContain('salary'); // restricted
    });

    it('getRestrictedFields returns correct set', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const restricted = grid.getRestrictedFields();
      expect(restricted.has('salary')).toBe(true);
      expect(restricted.has('ssn')).toBe(false);
      expect(restricted.has('name')).toBe(false);
    });

    it('getMaskedFields returns correct set', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const masked = grid.getMaskedFields();
      expect(masked.has('ssn')).toBe(true);
      expect(masked.has('salary')).toBe(false);
      expect(masked.has('name')).toBe(false);
    });

    it('returns empty sets when user has full access', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'admin',
      });
      expect(grid.getRestrictedFields().size).toBe(0);
      expect(grid.getMaskedFields().size).toBe(0);
    });

    it('returns empty sets when no userRole provided', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
      });
      expect(grid.getRestrictedFields().size).toBe(0);
      expect(grid.getMaskedFields().size).toBe(0);
    });
  });

  describe('exportCsv', () => {
    it('excludes restricted fields from export', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const csv = grid.exportCsv();
      expect(csv).toContain('Name');
      expect(csv).toContain('SSN');
      expect(csv).not.toContain('Salary');
    });

    it('applies mask function for masked fields in export', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const csv = grid.exportCsv();
      expect(csv).toContain('***-**-6789');
      expect(csv).not.toContain('123-45-6789');
    });

    it('exports all fields without masking when user has access', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'admin',
      });
      const csv = grid.exportCsv();
      expect(csv).toContain('Salary');
      expect(csv).toContain('123-45-6789');
      expect(csv).toContain('90000');
    });
  });

  describe('importState', () => {
    it('re-enforces restricted column visibility after import', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });

      // Export state from an admin grid
      const adminGrid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'admin',
      });
      const adminState = adminGrid.exportState();

      // Import admin state into viewer grid
      grid.importState(adminState);

      // salary should still be hidden
      expect(grid.getColumnState().visibility['salary']).toBe(false);
      // name and ssn should remain visible
      expect(grid.getColumnState().visibility['name']).toBe(true);
    });
  });
});
