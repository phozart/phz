# @phozart/core

Headless grid engine for the phz-grid SDK. Provides the data model, state management, row model pipeline, events, and plugin system with zero DOM dependencies.

## Installation

```bash
npm install @phozart/core
```

## Quick Start

```ts
import { createGrid } from '@phozart/core';

const grid = createGrid({
  columns: [
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'age', header: 'Age', type: 'number' },
    { field: 'active', header: 'Active', type: 'boolean' },
  ],
  data: [
    { name: 'Alice', age: 30, active: true },
    { name: 'Bob', age: 25, active: false },
    { name: 'Carol', age: 35, active: true },
  ],
});
```

## API

### `createGrid(config): GridApi`

Creates a headless grid instance. The returned `GridApi` provides the full API for data manipulation, state management, and event handling.

#### Data Operations

```ts
// Get all rows
const rows = grid.getData();

// Replace data
grid.setData(newData);

// CRUD operations
grid.addRow({ name: 'Dave', age: 28, active: true });
grid.updateRow(rowId, { age: 29 });
grid.deleteRow(rowId);

// Bulk operations
grid.addRows([...]);
grid.updateRows([{ id: rowId, data: { age: 29 } }]);
grid.deleteRows([rowId1, rowId2]);
```

#### Sorting

```ts
grid.sort('age', 'asc');
grid.sort('age', 'desc');
grid.sort('age', null);        // clear sort on field
grid.multiSort([
  { field: 'active', direction: 'desc' },
  { field: 'name', direction: 'asc' },
]);
grid.clearSort();
grid.getSortState();
```

#### Filtering

```ts
grid.filter('age', 'greaterThan', 25);
grid.addFilter('active', 'equals', true);
grid.setFilters([
  { field: 'age', operator: 'greaterThan', value: 25 },
  { field: 'active', operator: 'equals', value: true },
]);
grid.removeFilter('age');
grid.clearFilters();
grid.getFilterState();

// Filter presets
grid.saveFilterPreset('adults');
grid.loadFilterPreset('adults');
grid.deleteFilterPreset('adults');
```

#### Selection

```ts
grid.select(rowId);
grid.select([rowId1, rowId2]);
grid.deselect(rowId);
grid.selectAll();
grid.deselectAll();
grid.selectRange(startCell, endCell);
grid.getSelection(); // { rows: [...], cells: [...] }
```

#### Editing

```ts
grid.startEdit({ rowId: '1', field: 'name' });
const success = await grid.commitEdit({ rowId: '1', field: 'name' }, 'Alice Updated');
grid.cancelEdit({ rowId: '1', field: 'name' });
grid.getEditState();
grid.isDirty();
grid.getDirtyRows();
```

#### Column Management

```ts
grid.setColumnOrder(['name', 'active', 'age']);
grid.setColumnWidth('name', 200);
grid.setColumnVisibility('active', false);
grid.getColumnState();
grid.resetColumns();
```

#### Grouping

```ts
grid.groupBy('active');
grid.groupBy(['department', 'active']);
grid.ungroupBy('active');
grid.ungroupBy();           // clear all
grid.expandGroup('true');
grid.collapseGroup('true');
grid.expandAllGroups();
grid.collapseAllGroups();
```

#### Row Model Pipeline

The row model pipeline processes data through filter, sort, group, flatten, and virtualize stages. Always use `getSortedRowModel()` for display — `getCoreRowModel()` skips filtering and sorting.

```ts
grid.getCoreRowModel();       // raw data
grid.getFilteredRowModel();   // after filters
grid.getSortedRowModel();     // after filters + sort (use this for display)
grid.getGroupedRowModel();    // after grouping
grid.getFlattenedRowModel();  // groups flattened to rows
grid.getVirtualRowModel();    // windowed for virtualization
```

#### Events

```ts
const unsubscribe = grid.on('sort:change', (event) => {
  console.log('Sort changed:', event.sort);
});

// One-time listener
grid.once('grid:ready', (event) => { ... });

// Remove listener
grid.off('sort:change', handler);
```

Available events: `grid:ready`, `data:change`, `row:update`, `row:add`, `row:delete`, `sort:change`, `sort:clear`, `filter:change`, `filter:clear`, `filter:preset:save`, `filter:preset:load`, `selection:change`, `edit:start`, `edit:commit`, `edit:cancel`, `edit:validation:error`, `column:resize`, `column:visibility:change`, `group:expand`, `group:collapse`.

#### State Serialization

```ts
const serialized = grid.exportState();
localStorage.setItem('gridState', JSON.stringify(serialized));

// Later...
grid.importState(JSON.parse(localStorage.getItem('gridState')));
```

#### CSV Export

```ts
const csv = grid.exportCsv();
const csvSelected = grid.exportCsv({ selectedOnly: true });
const csvCustom = grid.exportCsv({
  columns: ['name', 'age'],
  separator: ';',
  includeHeaders: true,
});
```

#### Plugins

```ts
grid.registerPlugin({
  id: 'my-plugin',
  hooks: {
    beforeSort: (sort) => { /* modify or cancel */ },
    afterSort: (sort) => { /* react */ },
    beforeFilter: (filter) => { /* modify or cancel */ },
    afterFilter: (filter) => { /* react */ },
    beforeEdit: (value) => { /* modify or cancel */ },
    afterEdit: (position, value) => { /* react */ },
    beforeSelect: (ids) => { /* modify or cancel */ },
    afterSelect: (ids) => { /* react */ },
    beforeDataChange: (data) => { /* modify or cancel */ },
    afterDataChange: (data) => { /* react */ },
  },
  initialize(api) { /* called when plugin is registered */ },
  destroy() { /* cleanup */ },
});

grid.unregisterPlugin('my-plugin');
grid.getPlugin('my-plugin');
```

#### Lifecycle

```ts
// Subscribe to all state changes
const unsub = grid.subscribe((state) => { ... });

// Cleanup
grid.destroy();
```

### Utilities

```ts
import {
  immutableUpdate,
  serializeCellPosition,
  deserializeCellPosition,
  serializeSelection,
  deserializeSelection,
  mergeSelection,
  validateSelection,
  createDataSet,
  inferDataSetColumns,
  toColumnDefinitions,
} from '@phozart/core';
```

### Type Guards

```ts
import {
  isEditStateIdle,
  isEditStateEditing,
  isLocalDataSource,
  isAsyncDataSource,
  isDuckDBDataSource,
} from '@phozart/core';
```

## Column Types

Core column types: `'string'`, `'number'`, `'boolean'`, `'date'`, `'custom'`.

```ts
import type { ColumnDefinition, ColumnType } from '@phozart/core';

const column: ColumnDefinition = {
  field: 'price',
  header: 'Price',
  type: 'number',
  width: 120,
  sortable: true,
  filterable: true,
  editable: true,
  validator: async ({ value }) => {
    if (value < 0) return 'Price must be positive';
    return true;
  },
};
```

## License

MIT
