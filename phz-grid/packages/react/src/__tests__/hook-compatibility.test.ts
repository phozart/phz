/**
 * @phozart/phz-react — Hook Compatibility Tests (WP-2.3)
 *
 * Verifies that all 9 hooks and the settingsToGridProps utility are
 * compatible with the @lit/react wrapper rewrite. Specifically:
 * 1. Each hook exports a function
 * 2. settingsToGridProps exports a function
 * 3. Hooks only depend on public APIs (GridApi from @phozart/phz-core,
 *    or type-only imports from wrapper files) — never on wrapper internals
 * 4. No hook accesses private _fields on elements
 */
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Mock Setup ─────────────────────────────────────────────
vi.mock('react', () => ({
  useState: (init: unknown) => [init, vi.fn()],
  useEffect: vi.fn(),
  useCallback: (cb: Function) => cb,
  useRef: (init: unknown) => ({ current: init }),
  forwardRef: (comp: Function) => comp,
  useImperativeHandle: vi.fn(),
  createElement: vi.fn(),
}));

vi.mock('@phozart/phz-core', () => ({}));
vi.mock('@phozart/phz-engine', () => ({}));
vi.mock('@phozart/phz-grid', () => ({}));
vi.mock('@phozart/phz-criteria', () => ({}));
vi.mock('@phozart/phz-grid-admin', () => ({}));

// ─── Hook Imports ───────────────────────────────────────────
import { useGridState } from '../hooks/use-grid-state.js';
import { useGridSelection } from '../hooks/use-grid-selection.js';
import { useGridSort } from '../hooks/use-grid-sort.js';
import { useGridFilter } from '../hooks/use-grid-filter.js';
import { useGridEdit } from '../hooks/use-grid-edit.js';
import { useGridData } from '../hooks/use-grid-data.js';
import { useGridAdmin } from '../hooks/use-grid-admin.js';
import { useCriteria } from '../hooks/use-criteria.js';
import { useFilterDesigner } from '../hooks/use-filter-designer.js';
import { settingsToGridProps } from '../utils/settings-to-grid-props.js';

// ─── Export verification ────────────────────────────────────

describe('Hook and utility exports', () => {
  const hooks = [
    { name: 'useGridState', fn: useGridState },
    { name: 'useGridSelection', fn: useGridSelection },
    { name: 'useGridSort', fn: useGridSort },
    { name: 'useGridFilter', fn: useGridFilter },
    { name: 'useGridEdit', fn: useGridEdit },
    { name: 'useGridData', fn: useGridData },
    { name: 'useGridAdmin', fn: useGridAdmin },
    { name: 'useCriteria', fn: useCriteria },
    { name: 'useFilterDesigner', fn: useFilterDesigner },
  ];

  for (const { name, fn } of hooks) {
    it(`${name} is an exported function`, () => {
      expect(fn).toBeDefined();
      expect(typeof fn).toBe('function');
    });
  }

  it('settingsToGridProps is an exported function', () => {
    expect(settingsToGridProps).toBeDefined();
    expect(typeof settingsToGridProps).toBe('function');
  });
});

// ─── Import source verification ─────────────────────────────

describe('Hooks import only from public APIs', () => {
  const hooksDir = path.resolve(__dirname, '../hooks');

  const hookFiles = [
    'use-grid-state.ts',
    'use-grid-selection.ts',
    'use-grid-sort.ts',
    'use-grid-filter.ts',
    'use-grid-edit.ts',
    'use-grid-data.ts',
    'use-grid-admin.ts',
    'use-criteria.ts',
    'use-filter-designer.ts',
  ];

  for (const file of hookFiles) {
    describe(file, () => {
      const filePath = path.join(hooksDir, file);
      const source = fs.readFileSync(filePath, 'utf-8');

      it('does not import from phz-grid.ts (wrapper component)', () => {
        // Should not have runtime imports from wrapper component files
        // Type-only imports from ../phz-*.js are acceptable (they only import interfaces)
        const runtimeImports = source.match(/^import\s+\{[^}]+\}\s+from\s+['"]\.\.\/phz-/gm) ?? [];
        const nonTypeImports = runtimeImports.filter((imp) => !imp.includes('import type'));
        expect(nonTypeImports).toEqual([]);
      });

      it('does not access private _fields on elements', () => {
        // Hooks should only use public API methods, not el._something
        const privateAccess = source.match(/\b\w+\._\w+/g) ?? [];
        expect(privateAccess).toEqual([]);
      });

      it('does not use createElement (wrapper-specific pattern)', () => {
        expect(source).not.toContain('createElement');
      });

      it('does not use useImperativeHandle (wrapper-specific pattern)', () => {
        expect(source).not.toContain('useImperativeHandle');
      });

      it('does not use useRef (hooks use RefObject from caller, not their own ref)', () => {
        // Hooks accept RefObject<GridApi> as parameter; they should not create internal refs
        const useRefCalls = source.match(/\buseRef\s*\(/g) ?? [];
        expect(useRefCalls).toEqual([]);
      });
    });
  }
});

// ─── settingsToGridProps import verification ────────────────

describe('settingsToGridProps imports', () => {
  const utilPath = path.resolve(__dirname, '../utils/settings-to-grid-props.ts');
  const source = fs.readFileSync(utilPath, 'utf-8');

  it('imports PhzGridProps type from phz-grid.ts (type-only, acceptable)', () => {
    // This is a type import, not a runtime import — it will be erased at compile time
    expect(source).toContain("import type { PhzGridProps }");
  });

  it('does not access private _fields', () => {
    const privateAccess = source.match(/\b\w+\._\w+/g) ?? [];
    expect(privateAccess).toEqual([]);
  });

  it('does not depend on createElement or useEffect', () => {
    expect(source).not.toContain('createElement');
    expect(source).not.toContain('useEffect');
  });
});
