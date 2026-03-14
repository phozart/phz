# Phase A Architecture Specification

**Phase**: A — Fix Broken/Incomplete Features
**Date**: 2026-03-14
**Status**: APPROVED

---

## WI 8: Column Pinning Runtime Wiring (HIGH)

### Problem

`splitPinnedColumns()` in `packages/grid/src/utils/column-pinning.ts` reads `col.frozen` directly, ignoring `pinOverrides` from the grid state (UX-008). Runtime pin/unpin via `pinColumn()`/`unpinColumn()` in `@phozart/core` has no visible effect because the rendering layer doesn't consult the overrides.

### Architecture

**Pattern**: Pass-through parameter (no new abstractions)

The fix mirrors the logic already in `getEffectivePinState()` at `packages/core/src/state.ts:152-161` but keeps it local to the grid package to avoid cross-package coupling in the hot render path.

**Modified Files**:

- `packages/grid/src/utils/column-pinning.ts` — Add `pinOverrides?` parameter to `splitPinnedColumns()`
- `packages/grid/src/components/phz-grid.ts` — Pass `pinOverrides` from grid state to `splitPinnedColumns()` calls (lines 834, 906)
- `packages/grid/src/__tests__/column-pinning.test.ts` — Add 5 tests for override behavior

### Implementation

In `splitPinnedColumns()`, add optional second parameter `pinOverrides?: Record<string, 'left' | 'right' | null>`. In the column loop, compute effective frozen state:

```typescript
const override = pinOverrides?.[col.field];
const effectiveFrozen = override !== undefined ? override : (col.frozen ?? null);
```

In `phz-grid.ts`, retrieve `pinOverrides` from grid state and pass to both `splitPinnedColumns()` call sites:

```typescript
const pinOverrides = this._coreCtrl?.gridApi?.getState()?.columns?.pinOverrides;
const pinned = splitPinnedColumns(this.columnDefs, pinOverrides);
```

### Tests

1. "uses pinOverrides to pin an unfrozen column"
2. "unpins a frozen column when pinOverrides sets null"
3. "pinOverrides 'right' overrides frozen 'left'"
4. "works without pinOverrides (backward compat)"
5. "hasPinned reflects overrides"

---

## WI 7: Sort Debouncing (HIGH)

### Problem

`SortController.handleHeaderClick()` executes immediately. `debounceMs` is declared in QueryPlan/PerformanceConfig but never consumed by the sort path. Filter search IS debounced (150ms in filter.controller.ts) but sort is not.

### Architecture

**Pattern**: Timer-based debounce in existing controller (no new files except test)

**Modified Files**:

- `packages/grid/src/controllers/sort.controller.ts` — Add debounce logic
- `packages/grid/src/components/phz-grid.ts` — Add `sort-debounce-ms` property
- `packages/grid/src/__tests__/sort-controller.test.ts` — New file, 6 tests

### Implementation

Add `sortDebounceMs?: number` to `SortHost` interface. In `SortController`:

- Private `debounceTimer: ReturnType<typeof setTimeout> | null = null`
- Extract sort execution + ARIA announcement into `private executeSortAction()`
- In `handleHeaderClick()`: if `sortDebounceMs > 0`, use `clearTimeout`/`setTimeout`; otherwise execute immediately
- Clear timer in `hostDisconnected()`

On `phz-grid.ts`, add:

```typescript
@property({ type: Number, attribute: 'sort-debounce-ms' }) sortDebounceMs = 0;
```

### Tests

1. "executes sort immediately when debounceMs is 0"
2. "debounces sort when debounceMs > 0"
3. "cancels pending debounced sort on new click"
4. "does not debounce when debounceMs is undefined"
5. "clears debounce timer on hostDisconnected"
6. "announces sort after debounce completes"

---

## WI 9: DuckDB Parameterized Queries — Fallback Path (SECURITY)

### Problem

`fromArrowTable()` fallback path (lines 443-450 in `duckdb-data-source.ts`) uses string interpolation via `sanitizeStringLiteral()` instead of parameterized queries. SQL injection risk exists in the fallback path when `insertArrowTable()` is unavailable.

Sub-items 9.1 (Arrow IPC detection) and 9.2 (batch INSERT) are already fixed.

### Architecture

**Pattern**: Replace string interpolation with `?` placeholders and params array

**Modified Files**:

- `packages/duckdb/src/duckdb-data-source.ts` — Parameterize fallback INSERT (lines 441-451)
- `packages/duckdb/src/__tests__/duckdb-data-source-bugs.test.ts` — Update Task #8 tests, add 4 new tests

### Implementation

Replace the string-interpolated values with positional `?` placeholders:

```typescript
const placeholderRow = `(${columns.map(() => '?').join(', ')})`;
const placeholders = batch.map(() => placeholderRow).join(', ');
const params: unknown[] = [];
for (const row of batch) {
  for (const c of columns) {
    const v = (row as Record<string, unknown>)[c];
    params.push(v === undefined ? null : v);
  }
}
await conn.query(`INSERT INTO "${safeTable}" VALUES ${placeholders}`, params);
```

### Risk Mitigation

DuckDB WASM may have parameter count limits. With BATCH_SIZE=1000 and 20 columns = 20,000 params. If this causes errors, reduce BATCH_SIZE to 100.

### Tests

1. "fromArrowTable fallback uses ? placeholders not literal values"
2. "fromArrowTable fallback passes values as params array"
3. "fromArrowTable SQL does not contain raw user values"
4. Updated Task #8 tests to assert params array instead of SQL string contents

---

## WI 6: Default Sort Validation (LOW)

### Problem

`defaultSortField` is wired and working (grid-core.controller.ts:133-135), but there is no validation that the field exists in the columns array. Invalid field names cause silent failure.

### Architecture

**Pattern**: Guard clause with console.warn (no new abstractions)

**Modified Files**:

- `packages/grid/src/controllers/grid-core.controller.ts` — Add field existence check at line 133
- `packages/grid/src/__tests__/grid-core-controller.test.ts` — Add 2 tests

### Implementation

```typescript
if (this.host.defaultSortField) {
  const fieldExists = this._columnDefs.some((c) => c.field === this.host.defaultSortField);
  if (fieldExists) {
    this.gridApi.sort(this.host.defaultSortField, this.host.defaultSortDirection);
  } else {
    console.warn(
      `@phozart/grid: defaultSortField "${this.host.defaultSortField}" does not match any column.`,
    );
  }
}
```

### Tests

1. "does not apply sort when defaultSortField does not match any column"
2. "logs warning when defaultSortField is invalid"
