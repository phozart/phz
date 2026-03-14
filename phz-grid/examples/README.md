# phz-grid Examples

Starter examples showing how to build dashboards with the phz-grid BI stack.

## Examples

### hello-dashboard.html

Single-file HTML dashboard with no build step. Open directly in a browser.

Demonstrates:
- Creating a `BIEngine` with KPI definitions
- Rendering `phz-kpi-card`, `phz-bar-chart`, and `phz-trend-line` widgets
- Configuring widgets with inline sample data
- Listening for `drill-through` events

### react-dashboard.tsx

React integration pattern using Web Component wrappers.

Demonstrates:
- `useWebComponentRef` hook for passing complex properties to Web Components
- Creating React wrapper components for `phz-kpi-card`, `phz-bar-chart`, `phz-trend-line`
- Engine initialization with `useMemo`
- Event handling with `useCallback`/`useEffect`

Requires: `react`, `react-dom`, `@phozart/engine`, `@phozart/widgets`

### filtered-dashboard.html

Dashboard with criteria filters wired to widgets via the FilterAdapter.

Demonstrates:
- Setting up `CriteriaEngine` with filter definitions and bindings
- Creating a `FilterAdapter` to bridge criteria to data filtering
- Filter controls that update all widgets simultaneously
- `filterAdapter.subscribe()` for reactive filter notifications
- Active filter pill display

## Running the HTML Examples

The HTML examples import directly from the monorepo source. To run them:

1. Ensure the project is set up: `npm install`
2. Open the HTML file in a browser that supports `<script type="module">` with bare specifiers, or use a dev server:

```bash
npx vite --open examples/hello-dashboard.html
```

## Using in Your Project

In a real project with npm packages installed, replace the relative imports:

```js
// Instead of:
import { createBIEngine } from '../packages/engine/src/index.ts';

// Use:
import { createBIEngine } from '@phozart/engine';
import '@phozart/widgets'; // registers custom elements
```
