# @phozart/angular

Angular adapter for the phz-grid Web Component library. Uses a **factory pattern** -- you pass Angular runtime decorators and utilities into factory functions that return components and services. This avoids a hard build-time dependency on Angular, so the package works across Angular versions without peer dependency conflicts at compile time.

> **Status:** Functional but not battle-tested in production. The API surface is complete and the factories compile clean, but real-world usage has been limited to internal testing.

## Installation

```bash
npm install @phozart/angular @phozart/grid @phozart/core
```

**Peer dependencies:** `@angular/core ^19.0.0`, `rxjs ^7.0.0`

## API

### `createPhzGridComponent(ng)`

Factory that returns a standalone Angular component wrapping `<phz-grid>`. The component implements `OnInit`, `OnChanges`, and `OnDestroy` lifecycle hooks.

**Inputs:** `data`, `columns`, `theme`, `locale`, `selectionMode`, `editMode`, `height`, `width`, `loading`, `density`, and all grid display properties.

**Outputs:** `gridReady`, `stateChange`, `cellClick`, `selectionChange`, `sortChange`, `filterChange`, `editCommit`.

### `createGridService(ng)`

Factory that returns an injectable service wrapping the `GridApi` for imperative grid control (sort, filter, select, edit, export).

### RxJS Service Factories

For reactive state management, these factories accept an `RxJSRuntime` (`{ BehaviorSubject, Subject }`) and return service constructors that take a `GridApi`:

- `createSelectionService(rxjs)` -- returns `selectedRows$`, `selectedCells$` observables
- `createSortService(rxjs)` -- returns `sortState$` observable
- `createFilterService(rxjs)` -- returns `filterState$` observable
- `createEditService(rxjs)` -- returns `editState$`, `isDirty$`, `dirtyRows$` observables
- `createDataService(rxjs)` -- returns `data$` observable

All RxJS services return a `destroy()` method that completes subjects and unsubscribes.

## Quick Start

```ts
// grid.providers.ts
import { Component, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { createPhzGridComponent, createSelectionService } from '@phozart/angular';

export const PhzGridComponent = createPhzGridComponent({
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
});

export const createSelection = createSelectionService({ BehaviorSubject, Subject });
```

```ts
// app.component.ts
import { Component } from '@angular/core';
import { PhzGridComponent } from './grid.providers';
import type { ColumnDefinition, GridApi } from '@phozart/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PhzGridComponent],
  template: `
    <phz-grid
      [data]="data"
      [columns]="columns"
      selectionMode="multi"
      (gridReady)="onGridReady($event)"
    ></phz-grid>
  `,
})
export class AppComponent {
  columns: ColumnDefinition[] = [
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'age', header: 'Age', type: 'number' },
  ];

  data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ];

  onGridReady(api: GridApi) {
    console.log('Grid ready', api);
  }
}
```

## Three-Shell Architecture

phz-grid uses a three-shell model. The Angular adapter wraps the grid component itself. The shells determine the surrounding context:

| Shell         | Package              | Purpose                                                   |
| ------------- | -------------------- | --------------------------------------------------------- |
| **Workspace** | `@phozart/workspace` | Admin/authoring: build dashboards, configure data sources |
| **Editor**    | `@phozart/editor`    | BI authoring: create reports, alerts, sharing             |
| **Viewer**    | `@phozart/viewer`    | Read-only consumption: dashboards, reports, explorer      |

The Angular adapter gives you `<phz-grid>` in any shell context. Import types from `@phozart/core` directly -- this package does not re-export them.

## License

MIT
