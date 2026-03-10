# ADR-008: ESM-Only, No CommonJS

## Status
Accepted

## Context

JavaScript module systems have evolved through multiple eras:

1. **No Modules** (pre-2009) — Global scripts, manual dependency management
2. **CommonJS** (2009-2015) — `require()`, `module.exports`, synchronous loading, Node.js standard
3. **AMD** (2011-2015) — `define()`, asynchronous loading, RequireJS
4. **UMD** (2013-2018) — Universal wrapper supporting both CommonJS and AMD
5. **ES Modules (ESM)** (2015-present) — `import`/`export`, static analysis, native browser support

### Current State (2026)

- **Node.js 12+** (2019): Native ESM support via `.mjs` or `"type": "module"`
- **All Modern Browsers** (2020+): Native `<script type="module">`
- **Build Tools**: Vite, Rollup, esbuild all prefer ESM
- **npm Packages**: Trend toward ESM-only (Chalk 5, node-fetch 3, execa 6)

### The CommonJS Problem

```javascript
// CommonJS (legacy)
const grid = require('@phozart/phz-grid');

// Problems:
// 1. Synchronous (blocks event loop)
// 2. Dynamic requires hard to analyze (no tree-shaking)
// 3. No static imports (can't use top-level await)
// 4. Larger bundles (can't eliminate unused code)
```

### The ESM Advantage

```javascript
// ESM (modern)
import { createGrid } from '@phozart/phz-core';

// Benefits:
// 1. Async loading (non-blocking)
// 2. Static analysis (tree-shaking works)
// 3. Top-level await supported
// 4. Smaller bundles (dead code elimination)
```

### Market Analysis

| Library | ESM Support | CommonJS Support | Strategy |
|---------|-------------|------------------|----------|
| **AG Grid** | Yes | Yes | Dual package (ESM + CJS) |
| **MUI DataGrid** | Yes | Yes | Dual package |
| **TanStack Table** | Yes | Yes | Dual package |
| **Chalk** (v5+) | Yes | No | ESM-only (breaking change in v5) |
| **Lit** (v5) | Yes | No | ESM-only |
| **Vite** | Yes | Minimal | ESM-first |

### Dual Package Hazard

Supporting both ESM and CommonJS creates the "dual package hazard":

```javascript
// User code (ESM)
import { createGrid } from '@phozart/phz-core';
const grid1 = createGrid();

// Library code (accidentally CJS)
const { createGrid } = require('@phozart/phz-core');
const grid2 = createGrid();

// Problem: grid1 and grid2 are from DIFFERENT module instances
// - State is not shared
// - Singletons break
// - instanceof checks fail
```

### CommonJS Compatibility Burden

Maintaining dual packages requires:
1. Separate build outputs (`dist/esm/` and `dist/cjs/`)
2. Conditional exports in `package.json`
3. Different test configurations
4. Larger npm package size (2x the code)
5. Complexity in dependency resolution

### Modern Node.js Usage

Node.js 20 (LTS, released 2023) has native ESM support:

```json
// package.json
{
  "type": "module"
}
```

```javascript
// Native ESM in Node.js
import fs from 'fs/promises';
import { createGrid } from '@phozart/phz-core';

await fs.writeFile('data.json', JSON.stringify(gridState));
```

## Decision

phz-grid will be **ESM-only**. We will NOT ship CommonJS builds.

### Package Configuration

```json
// package.json
{
  "name": "@phozart/phz-core",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Import Syntax

```typescript
// ✅ Supported (ESM)
import { createGrid } from '@phozart/phz-core';
import { PhzGrid } from '@phozart/phz-grid';

// ❌ Not supported (CommonJS)
const { createGrid } = require('@phozart/phz-core');
```

### Migration Path for CommonJS Users

If users are stuck on CommonJS, they can use dynamic imports:

```javascript
// User code (CommonJS environment)
(async () => {
  const { createGrid } = await import('@phozart/phz-core');
  const grid = createGrid({ data, columns });
})();
```

Or use a bundler that transpiles ESM to CommonJS:

```bash
# Webpack, Rollup, esbuild can all transpile ESM to CJS
webpack --mode production
```

### Build Output Structure

```
dist/
├── index.js           # ESM entry point
├── index.d.ts         # TypeScript definitions
├── core.js            # Core module
├── virtualization.js  # Virtualization module
├── events.js          # Event system module
└── ...                # Other modules

# NO dist/cjs/ directory
# NO dist/umd/ directory (except for CDN UMD bundle)
```

### CDN Distribution (UMD for `<script>` tags)

For users who need `<script>` tag support (no bundler), we provide a single UMD bundle:

```html
<!-- CDN UMD bundle (for <script> tags only) -->
<script src="https://cdn.jsdelivr.net/npm/@phozart/phz-grid@1.0.0/dist/phz-grid.umd.js"></script>
<script>
  const grid = window.Phz.createGrid({ data, columns });
</script>
```

This is a separate build target, NOT part of the npm package.

## Consequences

### Positive

1. **Smaller Bundles** — Tree-shaking works perfectly (only import what you use)
2. **Simpler Codebase** — No dual package complexity
3. **Better DX** — Single import syntax, no confusion
4. **Future-Proof** — ESM is the future, we're ahead of the curve
5. **Faster Builds** — Only build ESM, not ESM + CJS
6. **Smaller npm Package** — Half the size (no CJS folder)
7. **Top-Level Await** — Can use modern JS features
8. **Avoids Dual Package Hazard** — No instance duplication bugs

### Negative

1. **Breaking for Legacy Users** — Users on old bundlers (Webpack 4) may struggle
2. **Node.js 20+ Required** — Older Node.js versions (12-18) need `"type": "module"`
3. **Learning Curve** — Some users unfamiliar with ESM syntax
4. **Migration Cost** — Users migrating from CommonJS libraries need to update imports

### Neutral

1. **Bundler Requirement** — Users without bundlers can use CDN UMD bundle
2. **Testing** — Unit tests run in ESM mode (Vitest supports this natively)

## Mitigation Strategies

### Migration Guide

We will provide a comprehensive migration guide:

```markdown
# Migrating to phz-grid (ESM-only)

## If you're using a modern bundler (Vite, Rollup, esbuild, Webpack 5+)
✅ No changes needed! Just install and import:

```js
import { createGrid } from '@phozart/phz-core';
```

## If you're using Webpack 4
1. Upgrade to Webpack 5 (recommended)
2. OR use dynamic import:

```js
import('@phozart/phz-core').then(({ createGrid }) => {
  const grid = createGrid({ data, columns });
});
```

## If you're using Node.js (CommonJS)
1. Add `"type": "module"` to package.json
2. OR use dynamic import:

```js
(async () => {
  const { createGrid } = await import('@phozart/phz-core');
})();
```

## If you're using `<script>` tags (no bundler)
Use the CDN UMD bundle:

```html
<script src="https://cdn.jsdelivr.net/npm/@phozart/phz-grid@1.0.0/dist/phz-grid.umd.js"></script>
```
```

### Clear Documentation

We will prominently document ESM-only in:
- README.md
- Installation guide
- FAQ
- Error messages (if CommonJS detected)

### Polite Error Message

```typescript
// index.js
if (typeof module !== 'undefined' && module.exports) {
  throw new Error(
    'phz-grid is ESM-only. Please use `import` instead of `require()`. ' +
    'See migration guide: https://phozart.dev/docs/esm-migration'
  );
}
```

## Alternatives Considered

### Alternative 1: Dual Package (ESM + CommonJS)
**Rejected** because:
- Dual package hazard
- Larger bundle size
- Maintenance burden
- Complexity in package.json exports

### Alternative 2: CommonJS-Only
**Rejected** because:
- Can't tree-shake (larger bundles)
- No top-level await
- Not future-proof
- Blocks modern features

### Alternative 3: UMD-Only
**Rejected** because:
- Larger bundle (wrapper overhead)
- No tree-shaking
- Not idiomatic for modern JS

## Browser Support

| Browser | ESM Support | Version |
|---------|-------------|---------|
| Chrome | ✅ | 61+ (2017) |
| Firefox | ✅ | 60+ (2018) |
| Safari | ✅ | 11+ (2017) |
| Edge | ✅ | 79+ (2020) |

All modern browsers support ESM natively. Users on IE11 need transpilation anyway (for Web Components).

## References

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [Dual Package Hazard](https://nodejs.org/api/packages.html#dual-package-hazard)
- [Pure ESM Package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
- [Vite ESM-First](https://vitejs.dev/guide/why.html#why-bundle-for-production)
- [Chalk ESM-Only Migration](https://github.com/chalk/chalk/releases/tag/v5.0.0)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Engineering Leads, DevRel, Product Manager
**Impact**: Breaking change for legacy users (acceptable trade-off)
