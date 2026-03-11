# phz-grid Testing Guide

Step-by-step instructions for verifying all packages work correctly.
Last validated: 2026-03-07 — 4045 unit tests pass, 51/51 browser integration tests pass.

---

## Prerequisites

- Node.js 22+
- npm 10+
- A modern browser (Chrome/Edge recommended)

---

## 1. Unit Tests (Vitest)

Run from the monorepo root:

```bash
cd phz-grid

# Install rollup platform binding if needed (linux-arm64 example):
npm install @rollup/rollup-linux-arm64-gnu --no-save --force 2>/dev/null

# Run all tests
npx vitest run

# Expected: 248 test files, 4045 tests, all passing
```

This covers all 16 packages including `core`, `engine`, `grid`, `criteria`, `definitions`, `ai`, `collab`, `widgets`, `engine-admin`, `grid-admin`, `grid-creator`, `react`, `duckdb`, `angular`, `vue`, and `python` (stubs).

---

## 2. TypeScript Build

Build all packages to verify types compile cleanly:

```bash
cd phz-grid

# Clean stale incremental caches (critical after any code changes)
find packages -name "tsconfig.tsbuildinfo" -delete

# Build in dependency order from root
npx tsc --build

# Expected: all 15 TypeScript packages compile with zero errors
```

Build order matters. The root `tsconfig.json` has project references that handle this automatically. If building individual packages, follow this order:

1. `core` (no deps)
2. `definitions` (depends on core)
3. `engine` (depends on core, definitions)
4. `grid` (depends on core)
5. `criteria` (depends on core, engine)
6. `grid-admin` (depends on core, grid, criteria, engine)
7. `widgets` (depends on core, engine)
8. `engine-admin` (depends on core, engine, criteria, widgets)
9. `grid-creator` (depends on core, grid, criteria, engine)
10. `react` (depends on all WC packages)
11. `ai`, `collab`, `duckdb` (independent)
12. `angular`, `vue` (depends on core)

---

## 3. Integration Test (Next.js Browser)

The `test/` folder is a Next.js 16 app that consumes packages via packed tarballs, simulating real npm installs.

### 3a. Pack and install (one-time setup)

```bash
cd phz-grid

# Pack each package into a tarball
mkdir -p /tmp/phz-packs
for pkg in core definitions engine grid criteria grid-admin react; do
  cd packages/$pkg
  npm pack --pack-destination /tmp/phz-packs
  cd ../..
done

# Install in test app
cd ../test
npm install
```

### 3b. Quick update (after code changes, skip packing)

If you just changed source code and rebuilt:

```bash
cd phz-grid

# Rebuild
find packages -name "tsconfig.tsbuildinfo" -delete
npx tsc --build

# Copy rebuilt dist files directly
for pkg in core criteria engine grid grid-admin react; do
  cp -r packages/$pkg/dist/* ../test/node_modules/@phozart/phz-$pkg/dist/
done

# Clear Next.js cache
rm -rf ../test/.next
```

### 3c. Run the test app

```bash
cd test
npx next dev -p 3001
```

### 3d. Verify in browser

Open `http://localhost:3001` — you should see the Employee Directory grid with:
- 50 rows of data across 10 columns
- Density buttons (compact/comfortable/dense) that change row heights
- Pagination showing "Page 1 of 5" with "Rows 10" selector
- Column sorting, filtering, selection checkboxes
- Dark/light theme toggle

Open `http://localhost:3001/packages` — automated package test suite:
- **@phozart/phz-core** (3 tests): createGrid, EventEmitter, StateManager
- **@phozart/phz-engine** (7 tests): createBIEngine, registries, services, criteria engine
- **@phozart/phz-grid** (7 tests): Web Component registration (2 auto + 5 lazy)
- **@phozart/phz-criteria** (24 tests): All selection criteria components registered
- **@phozart/phz-grid-admin** (11 tests): All admin panel components registered
- **@phozart/phz-react** (4 tests): PhzGrid, PhzSelectionCriteria, PhzGridAdmin, useGridOrchestrator

Expected result: **51 PASS, 0 FAIL** (plus 11 SKIP for lazy-loaded and non-installed packages).

---

## 4. Manual Feature Tests

With the grid loaded at `http://localhost:3001`:

### Density modes
Click each density button and verify row heights:
- **compact**: ~42px rows, 10 visible per page, single-line truncated text
- **dense**: ~34px rows, tighter spacing
- **comfortable**: ~52px rows, multi-line text allowed

### Column interactions
- Click a column header to sort (ascending/descending/none)
- Drag column borders to resize
- Right-click a column header for context menu (if enabled)

### Selection
- Click row checkboxes to select individual rows
- Click the header checkbox to select all visible rows

### Editing
- Double-click a cell to enter edit mode (if DblClick Edit is selected)
- Tab between editable cells
- Press Escape to cancel, Enter to confirm

### Filtering
- Click the "Filters" bar to open the criteria panel
- Set a filter (e.g., Department = Engineering)
- Verify the grid updates to show filtered rows
- Clear the filter

### Pagination
- Navigate between pages using the pagination controls
- Change the rows-per-page selector

### Theme
- Toggle between Dark and Light themes
- Verify all components respect the theme

---

## 5. Package-by-Package Export Verification

To verify a specific package exports the correct API:

```bash
cd phz-grid
node -e "const m = require('./packages/PACKAGE_NAME/dist/index.js'); console.log(Object.keys(m).sort().join('\n'))"
```

Replace `PACKAGE_NAME` with: `core`, `engine`, `grid`, `criteria`, `definitions`, `ai`, `collab`, `widgets`, `engine-admin`, `grid-admin`, `grid-creator`, `react`.

---

## Common Issues

**"Cannot find module @rollup/rollup-linux-arm64-gnu"**
Install the platform-specific rollup binding: `npm install @rollup/rollup-linux-arm64-gnu --no-save --force`

**tsc --build says "up to date" but dist/ is empty**
Delete stale incremental caches: `find packages -name "tsconfig.tsbuildinfo" -delete`

**Browser shows "Internal Server Error" but curl returns 200**
Clear browser cookies/storage for localhost. Stale Next-Router-State-Tree headers from different Next.js versions cause parsing failures.

**Packages not loading after rebuild**
The test/ folder uses packed tarballs, not symlinks. You must manually copy rebuilt dist files to `test/node_modules/@phozart/*/dist/` and clear `test/.next`.

**Web Components like phz-column-chooser not registered**
These are lazy-loaded by the grid on user interaction (right-click, filter click, etc.). They register at runtime, not on import.
