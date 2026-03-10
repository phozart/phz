# @phozart/phz-angular

Angular wrapper for the phz-grid Web Component. Uses a factory pattern to avoid hard Angular build dependencies, providing a standalone component and an RxJS-based service.

## Installation

```bash
npm install @phozart/phz-angular @phozart/phz-grid @phozart/phz-core
```

**Peer dependencies:** `@angular/core ^19.0.0`, `rxjs ^7.0.0`

## Quick Start

```ts
// grid.providers.ts — create instances with your Angular runtime
import { Component, Input, Output, EventEmitter, ElementRef, NgZone } from '@angular/core';
import { Injectable } from '@angular/core';
import { createPhzGridComponent, createGridService } from '@phozart/phz-angular';

export const PhzGridComponent = createPhzGridComponent({
  Component, Input, Output, EventEmitter, ElementRef, NgZone,
});

export const GridService = createGridService({ Injectable });
```

```ts
// app.component.ts
import { Component } from '@angular/core';
import { PhzGridComponent } from './grid.providers';
import type { ColumnDefinition } from '@phozart/phz-angular';

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
      (selectionChange)="onSelectionChange($event)"
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

  onGridReady(api: any) {
    console.log('Grid ready', api);
  }

  onSelectionChange(event: any) {
    console.log('Selection:', event);
  }
}
```

## Factory Pattern

This package uses factory functions that accept Angular runtime decorators and utilities as arguments. This avoids a hard build-time dependency on Angular, enabling the package to work across different Angular versions without peer dependency conflicts at compile time.

### `createPhzGridComponent(deps)`

Creates a standalone Angular component that wraps the `<phz-grid>` Web Component.

**Inputs:** `data`, `columns`, `theme`, `locale`, `selectionMode`, `editMode`, `height`, `width`, `loading`, `responsive`, `virtualization`

**Outputs:** `gridReady`, `stateChange`, `cellClick`, `cellDoubleClick`, `selectionChange`, `sortChange`, `filterChange`, `editStart`, `editCommit`, `editCancel`, `scroll`

### `createGridService(deps)`

Creates an injectable Angular service that wraps the `GridApi` with RxJS observables for reactive state management.

## Re-exports

This package re-exports all types from `@phozart/phz-core` for convenience.

## License

MIT
