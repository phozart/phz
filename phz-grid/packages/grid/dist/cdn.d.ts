/**
 * @phozart/phz-grid — CDN Entry Point
 *
 * Single-file bundle for use via <script type="module"> in plain HTML.
 * Registers all custom elements and re-exports everything from the main entry.
 *
 * Usage:
 *   <script type="module" src="https://cdn.phz-grid.dev/v1/phz-grid.js"></script>
 *   <phz-grid id="myGrid"></phz-grid>
 *   <script>
 *     const grid = document.getElementById('myGrid');
 *     grid.columns = [{ field: 'name', header: 'Name' }];
 *     grid.data = [{ name: 'Alice' }];
 *   </script>
 */
import './components/phz-grid.js';
import './components/phz-context-menu.js';
import './components/phz-filter-popover.js';
import './components/phz-column-chooser.js';
import './components/phz-chart-popover.js';
import './components/phz-toolbar.js';
import './components/phz-report-view.js';
export * from './index.js';
//# sourceMappingURL=cdn.d.ts.map