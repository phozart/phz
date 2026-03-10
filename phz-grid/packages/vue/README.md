# @phozart/phz-vue

Vue 3 wrapper for the phz-grid Web Component. Uses a factory pattern to avoid hard Vue build dependencies, providing a component and composables with idiomatic Vue APIs.

## Installation

```bash
npm install @phozart/phz-vue @phozart/phz-grid @phozart/phz-core
```

**Peer dependency:** `vue ^3.0.0`

## Quick Start

```ts
// grid-plugin.ts — create instances with your Vue runtime
import { ref, watch, onMounted, onUnmounted } from 'vue';
import {
  createPhzGridComponent,
  createUseGrid,
  createUseGridSelection,
  createUseGridSort,
  createUseGridFilter,
  createUseGridEdit,
} from '@phozart/phz-vue';

export const PhzGrid = createPhzGridComponent({ ref, watch, onMounted, onUnmounted });
export const useGrid = createUseGrid({ ref, watch, onMounted, onUnmounted });
export const useGridSelection = createUseGridSelection({ ref, watch });
export const useGridSort = createUseGridSort({ ref, watch });
export const useGridFilter = createUseGridFilter({ ref, watch });
export const useGridEdit = createUseGridEdit({ ref, watch });
```

```vue
<template>
  <PhzGrid
    :data="data"
    :columns="columns"
    selection-mode="multi"
    @grid-ready="onGridReady"
    @selection-change="onSelectionChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PhzGrid } from './grid-plugin';
import type { ColumnDefinition, GridApi } from '@phozart/phz-vue';

const columns: ColumnDefinition[] = [
  { field: 'name', header: 'Name', type: 'string' },
  { field: 'age', header: 'Age', type: 'number' },
];

const data = ref([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]);

function onGridReady(api: GridApi) {
  console.log('Grid ready', api);
}

function onSelectionChange(event: any) {
  console.log('Selected:', event.selectedRows);
}
</script>
```

## Factory Pattern

This package uses factory functions that accept Vue runtime utilities (`ref`, `watch`, `onMounted`, `onUnmounted`) as arguments. This avoids a hard build-time dependency on Vue, enabling the package to be used across different Vue versions and build systems.

## Composables

### `useGrid(api)`

```ts
const { state, subscribe } = useGrid(gridApi);
```

### `useGridSelection(api)`

```ts
const { selectedRows, select, deselect, selectAll, deselectAll } = useGridSelection(gridApi);
```

### `useGridSort(api)`

```ts
const { sortState, sort, multiSort, clearSort } = useGridSort(gridApi);
```

### `useGridFilter(api)`

```ts
const { filterState, filter, addFilter, removeFilter, clearFilters } = useGridFilter(gridApi);
```

### `useGridEdit(api)`

```ts
const { editState, startEdit, commitEdit, cancelEdit, isDirty } = useGridEdit(gridApi);
```

## Re-exports

This package re-exports all types from `@phozart/phz-core` for convenience.

## License

MIT
