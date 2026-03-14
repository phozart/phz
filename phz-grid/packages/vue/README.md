# @phozart/vue

Vue 3 adapter for the phz-grid Web Component library. Uses a **factory pattern** -- you pass Vue runtime utilities into factory functions that return components and composables. This avoids a hard build-time dependency on Vue, so the package works across Vue 3.x versions and build systems.

> **Status:** Functional but not battle-tested in production. The API surface is complete and the factories compile clean, but real-world usage has been limited to internal testing.

## Installation

```bash
npm install @phozart/vue @phozart/grid @phozart/core
```

**Peer dependency:** `vue ^3.0.0`

## API

### `createPhzGridComponent(vue)`

Factory that returns a Vue component wrapping `<phz-grid>`.

### `createUseGrid(vue)`

Factory that returns a `useGrid()` composable for state export/import.

### `createUseGridSelection(vue)`

Factory that returns a `useGridSelection(gridRef)` composable for reactive selection state.

### `createUseGridSort(vue)`

Factory that returns a `useGridSort(gridRef)` composable for reactive sort state.

### `createUseGridFilter(vue)`

Factory that returns a `useGridFilter(gridRef)` composable for reactive filter state.

### `createUseGridEdit(vue)`

Factory that returns a `useGridEdit(gridRef)` composable for reactive edit state.

All factories accept a `VueRuntime` object: `{ defineComponent, h, ref, watch, onMounted, onUnmounted }`.

## Quick Start

```ts
// grid-plugin.ts — create instances with your Vue runtime
import { defineComponent, h, ref, watch, onMounted, onUnmounted } from 'vue';
import { createPhzGridComponent, createUseGridSelection } from '@phozart/vue';

const vue = { defineComponent, h, ref, watch, onMounted, onUnmounted };

export const PhzGrid = createPhzGridComponent(vue);
export const useGridSelection = createUseGridSelection(vue);
```

```vue
<template>
  <PhzGrid :data="data" :columns="columns" selection-mode="multi" @grid-ready="onGridReady" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PhzGrid } from './grid-plugin';
import type { GridApi, ColumnDefinition } from '@phozart/core';

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
</script>
```

## Three-Shell Architecture

phz-grid uses a three-shell model. The Vue adapter wraps the grid component itself. The shells determine the surrounding context:

| Shell         | Package              | Purpose                                                   |
| ------------- | -------------------- | --------------------------------------------------------- |
| **Workspace** | `@phozart/workspace` | Admin/authoring: build dashboards, configure data sources |
| **Editor**    | `@phozart/editor`    | BI authoring: create reports, alerts, sharing             |
| **Viewer**    | `@phozart/viewer`    | Read-only consumption: dashboards, reports, explorer      |

The Vue adapter gives you `<phz-grid>` in any shell context. Import types from `@phozart/core` directly -- this package does not re-export them.

## License

MIT
