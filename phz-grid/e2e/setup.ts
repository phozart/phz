import '@phozart/grid';
import type { PhzGrid } from '@phozart/grid';
import type { ColumnDefinition } from '@phozart/core';

// Sample data for E2E tests
const SAMPLE_DATA = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 95000, startDate: '2022-01-15', active: true },
  { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 72000, startDate: '2021-06-01', active: true },
  { id: 3, name: 'Carol Williams', department: 'Engineering', salary: 110000, startDate: '2020-03-20', active: false },
  { id: 4, name: 'David Brown', department: 'Sales', salary: 85000, startDate: '2023-02-10', active: true },
  { id: 5, name: 'Eva Martinez', department: 'Engineering', salary: 98000, startDate: '2021-11-30', active: true },
  { id: 6, name: 'Frank Lee', department: 'Marketing', salary: 67000, startDate: '2022-07-22', active: false },
  { id: 7, name: 'Grace Chen', department: 'Sales', salary: 91000, startDate: '2020-09-15', active: true },
  { id: 8, name: 'Henry Wilson', department: 'Engineering', salary: 105000, startDate: '2019-04-01', active: true },
  { id: 9, name: 'Iris Davis', department: 'Marketing', salary: 78000, startDate: '2023-01-05', active: true },
  { id: 10, name: 'Jack Taylor', department: 'Sales', salary: 88000, startDate: '2022-08-18', active: false },
];

const COLUMNS: ColumnDefinition[] = [
  { field: 'id', header: 'ID', type: 'number', width: 60 },
  { field: 'name', header: 'Name', type: 'string', width: 180 },
  { field: 'department', header: 'Department', type: 'string', width: 130 },
  { field: 'salary', header: 'Salary', type: 'number', width: 120 },
  { field: 'startDate', header: 'Start Date', type: 'date', width: 130 },
  { field: 'active', header: 'Active', type: 'boolean', width: 80 },
];

// Wait for custom element to be defined, then configure
customElements.whenDefined('phz-grid').then(() => {
  const grid = document.getElementById('test-grid') as PhzGrid;
  if (grid) {
    grid.data = SAMPLE_DATA;
    grid.columns = COLUMNS;
    grid.showToolbar = true;
    grid.showPagination = true;
    grid.selectionMode = 'multi';

    // Signal that grid is ready for testing after next render cycle
    grid.updateComplete.then(() => {
      document.getElementById('status')!.textContent = 'GRID_READY';
    });
  }
});

// Expose configuration API for tests to modify grid state
(window as any).__phzTestUtils = {
  getGrid: () => document.getElementById('test-grid') as PhzGrid,
  setData: (data: unknown[]) => {
    const grid = document.getElementById('test-grid') as PhzGrid;
    if (grid) grid.data = data;
  },
  setColumns: (columns: ColumnDefinition[]) => {
    const grid = document.getElementById('test-grid') as PhzGrid;
    if (grid) grid.columns = columns;
  },
  setDensity: (density: 'comfortable' | 'compact' | 'dense') => {
    const grid = document.getElementById('test-grid') as PhzGrid;
    if (grid) grid.density = density;
  },
  setTheme: (theme: string) => {
    const grid = document.getElementById('test-grid') as PhzGrid;
    if (grid) grid.theme = theme;
  },
};
