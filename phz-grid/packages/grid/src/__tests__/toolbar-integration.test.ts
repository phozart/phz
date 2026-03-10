/**
 * Toolbar–Grid integration tests
 *
 * Validates event wiring between <phz-toolbar> and <phz-grid> by inspecting
 * source code patterns. Runs in Node (no DOM rendering).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const toolbarSrc = fs.readFileSync(
  path.resolve(import.meta.dirname, '../components/phz-toolbar.ts'),
  'utf-8',
);
const gridSrc = fs.readFileSync(
  path.resolve(import.meta.dirname, '../components/phz-grid.ts'),
  'utf-8',
);

// Extract all events the toolbar emits via this._emit('toolbar-*', ...)
const emittedEvents = [
  ...toolbarSrc.matchAll(/this\._emit\(['"]([^'"]+)['"]/g),
].map(m => m[1]);

// Extract all toolbar-* events the grid listens for via @toolbar-*=
const listenedEvents = [
  ...gridSrc.matchAll(/@(toolbar-[a-z-]+)=/g),
].map(m => m[1]);

// ─── Event name consistency ──────────────────────────────

describe('Toolbar-Grid event wiring', () => {
  describe('event name consistency', () => {
    it('toolbar emits known toolbar-* events', () => {
      const toolbarEvents = emittedEvents.filter(e => e.startsWith('toolbar-'));
      expect(toolbarEvents.length).toBeGreaterThan(0);
      // Documented events from phz-toolbar.ts header comment
      expect(toolbarEvents).toContain('toolbar-search');
      expect(toolbarEvents).toContain('toolbar-density-change');
      expect(toolbarEvents).toContain('toolbar-export-csv');
      expect(toolbarEvents).toContain('toolbar-export-excel');
      expect(toolbarEvents).toContain('toolbar-generate-dashboard');
    });

    it('grid listens for core toolbar events', () => {
      expect(listenedEvents).toContain('toolbar-search');
      expect(listenedEvents).toContain('toolbar-filter-remove');
      expect(listenedEvents).toContain('toolbar-density-change');
      expect(listenedEvents).toContain('toolbar-export-csv');
      expect(listenedEvents).toContain('toolbar-export-excel');
      expect(listenedEvents).toContain('toolbar-generate-dashboard');
    });

    it('every emitted toolbar-* event that lacks auto-wire has a grid listener', () => {
      // Events the toolbar handles via .grid auto-wire (no grid listener needed)
      const autoWired = new Set([
        'toolbar-column-chooser-open', // auto-wires via grid.columnChooserOpen
        'toolbar-auto-size',           // auto-wires via grid.autoSizeAllColumns()
        'toolbar-admin-settings',      // standalone event for consumer apps
      ]);

      const unheard: string[] = [];
      for (const event of emittedEvents) {
        if (!event.startsWith('toolbar-')) continue;
        if (autoWired.has(event)) continue;
        if (!listenedEvents.includes(event)) {
          unheard.push(event);
        }
      }
      expect(unheard, `Grid is missing listeners for: ${unheard.join(', ')}`).toEqual([]);
    });
  });

  // ─── Density change propagation ──────────────────────────

  describe('density change propagation', () => {
    it('toolbar emits toolbar-density-change', () => {
      expect(emittedEvents).toContain('toolbar-density-change');
    });

    it('grid handler extracts density from event detail', () => {
      expect(gridSrc).toContain('toolbar-density-change');
      // Handler sets this.density = e.detail.density
      expect(gridSrc).toMatch(/e\.detail\.density/);
    });
  });

  // ─── Grid ref wiring ────────────────────────────────────

  describe('toolbar-grid ref wiring', () => {
    it('grid passes itself to toolbar via .grid=${this}', () => {
      expect(gridSrc).toMatch(/\.grid=\$\{this\}/);
    });

    it('toolbar declares a grid property', () => {
      expect(toolbarSrc).toMatch(/@property/);
      expect(toolbarSrc).toContain('grid:');
    });
  });

  // ─── Search event propagation ───────────────────────────

  describe('search event propagation', () => {
    it('toolbar emits toolbar-search with query', () => {
      expect(emittedEvents).toContain('toolbar-search');
      expect(toolbarSrc).toMatch(/toolbar-search.*query/s);
    });

    it('grid listens for toolbar-search', () => {
      expect(listenedEvents).toContain('toolbar-search');
    });
  });

  // ─── Export event propagation ───────────────────────────

  describe('export event propagation', () => {
    it('toolbar emits toolbar-export-csv', () => {
      expect(emittedEvents).toContain('toolbar-export-csv');
    });

    it('toolbar emits toolbar-export-excel', () => {
      expect(emittedEvents).toContain('toolbar-export-excel');
    });

    it('grid listens for both export events', () => {
      expect(listenedEvents).toContain('toolbar-export-csv');
      expect(listenedEvents).toContain('toolbar-export-excel');
    });
  });

  // ─── Filter removal ─────────────────────────────────────

  describe('filter removal event propagation', () => {
    it('toolbar emits toolbar-filter-remove with field', () => {
      expect(emittedEvents).toContain('toolbar-filter-remove');
      expect(toolbarSrc).toMatch(/toolbar-filter-remove.*field/s);
    });

    it('grid listens for toolbar-filter-remove', () => {
      expect(listenedEvents).toContain('toolbar-filter-remove');
    });
  });

  // ─── Auto-wired actions ──────────────────────────────────

  describe('auto-wired toolbar actions', () => {
    it('toolbar column-chooser-open auto-wires via grid ref', () => {
      expect(emittedEvents).toContain('toolbar-column-chooser-open');
      // Auto-wire: sets grid.columnChooserOpen = true
      expect(toolbarSrc).toContain('columnChooserOpen');
    });

    it('toolbar auto-size auto-wires via grid ref', () => {
      expect(emittedEvents).toContain('toolbar-auto-size');
      // Auto-wire: calls grid.autoSizeAllColumns()
      expect(toolbarSrc).toContain('autoSizeAllColumns');
    });
  });

  // ─── Grid listeners without matching toolbar emit ────────

  describe('grid-only listeners (no toolbar emit)', () => {
    it('toolbar-filter-clear-all is a grid-only listener (future or external)', () => {
      // Grid listens for toolbar-filter-clear-all but toolbar doesn't emit it.
      // This is for external/standalone toolbar usage or future toolbar additions.
      expect(listenedEvents).toContain('toolbar-filter-clear-all');
      expect(emittedEvents).not.toContain('toolbar-filter-clear-all');
    });

    it('toolbar-export-formatting-change is a grid-only listener', () => {
      expect(listenedEvents).toContain('toolbar-export-formatting-change');
      expect(emittedEvents).not.toContain('toolbar-export-formatting-change');
    });

    it('toolbar-export-group-headers-change is a grid-only listener', () => {
      expect(listenedEvents).toContain('toolbar-export-group-headers-change');
      expect(emittedEvents).not.toContain('toolbar-export-group-headers-change');
    });
  });
});
