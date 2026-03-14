# @phozart/react

React wrapper for the phz-grid Web Component. Provides a `<PhzGrid>` component and hooks for state management, selection, sorting, filtering, and editing.

## Installation

```bash
npm install @phozart/react @phozart/grid @phozart/core
```

**Peer dependencies:** `react ^18.0.0 || ^19.0.0`, `react-dom ^18.0.0 || ^19.0.0`

## Quick Start

```tsx
import { PhzGrid } from '@phozart/react';
import type { ColumnDefinition, GridApi } from '@phozart/react';

const columns: ColumnDefinition[] = [
  { field: 'name', header: 'Name', type: 'string' },
  { field: 'age', header: 'Age', type: 'number' },
];

const data = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];

function App() {
  const gridRef = useRef<GridApi>(null);

  return (
    <PhzGrid
      ref={gridRef}
      data={data}
      columns={columns}
      selectionMode="multi"
      editMode="dblclick"
      height="500px"
      onGridReady={(api) => console.log('Grid ready', api)}
      onSelectionChange={(e) => console.log('Selection:', e)}
      onSortChange={(e) => console.log('Sort:', e)}
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `unknown[]` | Row data array |
| `columns` | `ColumnDefinition[]` | Column definitions |
| `theme` | `string` | Theme name |
| `locale` | `string` | BCP 47 locale |
| `responsive` | `boolean` | Enable responsive layout |
| `virtualization` | `boolean` | Enable virtual scrolling |
| `selectionMode` | `'none' \| 'single' \| 'multi' \| 'range'` | Selection mode |
| `editMode` | `'none' \| 'click' \| 'dblclick' \| 'manual'` | Edit trigger |
| `loading` | `boolean` | Show loading state |
| `height` | `string \| number` | Grid height |
| `width` | `string \| number` | Grid width |

## Event Handlers

| Prop | Event Type | Description |
|------|------------|-------------|
| `onGridReady` | `GridApi` | Grid instance available |
| `onStateChange` | `StateChangeEvent` | Any state change |
| `onCellClick` | `CellClickEvent` | Cell clicked |
| `onCellDoubleClick` | `CellDoubleClickEvent` | Cell double-clicked |
| `onSelectionChange` | `SelectionChangeEvent` | Selection changed |
| `onSortChange` | `SortChangeEvent` | Sort changed |
| `onFilterChange` | `FilterChangeEvent` | Filter changed |
| `onEditStart` | `CellEditStartEvent` | Edit started |
| `onEditCommit` | `CellEditCommitEvent` | Edit committed |
| `onEditCancel` | `CellEditCancelEvent` | Edit cancelled |
| `onScroll` | `ScrollEvent` | Grid scrolled |

## Slots

Content can be passed via slot props:

```tsx
<PhzGrid
  data={data}
  columns={columns}
  toolbar={<MyToolbar />}
  header={<h2>My Grid</h2>}
  footer={<Pagination />}
  emptyState={<p>No data found</p>}
  loadingIndicator={<Spinner />}
/>
```

## Imperative API via Ref

Access the full `GridApi` through the forwarded ref:

```tsx
const gridRef = useRef<GridApi>(null);

// Sort programmatically
gridRef.current?.sort('name', 'asc');

// Get selection
const selection = gridRef.current?.getSelection();

// Export
const csv = gridRef.current?.exportCsv();
```

## Hooks

### `useGridState(api)`

Subscribe to grid state changes:

```tsx
const { state, subscribe } = useGridState(gridApi);
```

### `useGridSelection(api)`

Manage row/cell selection:

```tsx
const { selectedRows, select, deselect, selectAll, deselectAll } = useGridSelection(gridApi);
```

### `useGridSort(api)`

Control sorting:

```tsx
const { sortState, sort, multiSort, clearSort } = useGridSort(gridApi);
```

### `useGridFilter(api)`

Control filtering:

```tsx
const { filterState, filter, addFilter, removeFilter, clearFilters } = useGridFilter(gridApi);
```

### `useGridEdit(api)`

Manage cell editing:

```tsx
const { editState, startEdit, commitEdit, cancelEdit, isDirty } = useGridEdit(gridApi);
```

### `useGridData(api)`

Access row data reactively:

```tsx
const { data, setData, addRow, updateRow, deleteRow } = useGridData(gridApi);
```

## Re-exports

This package re-exports all types from `@phozart/core` for convenience.

## License

MIT
