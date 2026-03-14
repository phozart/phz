# ADR-002: DOM Virtualization as Default, Canvas as Opt-In Feature

## Status
Accepted

## Context

Data grids must render large datasets (100K+ rows) without crashing the browser. Two primary rendering strategies exist:

1. **DOM Virtualization** — Render only visible rows as DOM elements, recycle nodes on scroll
2. **Canvas Rendering** — Draw cells directly to `<canvas>` element using 2D drawing API

### DOM Virtualization
**Pros:**
- Native browser features work (selection, copy/paste, find-in-page)
- Full CSS styling and theming
- Screen reader accessibility (ARIA attributes)
- Easier to implement custom cell renderers
- Interactivity is straightforward (click, hover, focus)

**Cons:**
- Memory usage scales with visible rows (~40 MB per 1000 visible rows)
- Rendering cost is higher (browser layout + paint)
- Practical limit ~300K-500K rows before performance degrades

### Canvas Rendering
**Pros:**
- Extreme performance (can render millions of rows)
- Memory efficiency (single canvas buffer)
- GPU-accelerated rendering
- Smooth scrolling at 60fps even with 10M rows

**Cons:**
- No native browser features (must reimplement selection, copy/paste)
- No CSS styling (must draw everything manually)
- Accessibility is extremely difficult (canvas is a bitmap, screen readers see nothing)
- Custom cell renderers require canvas drawing code
- Interactivity requires manual hit testing

### Market Analysis

| Grid | Default Strategy | Canvas Option | Accessibility |
|------|------------------|---------------|---------------|
| AG Grid | DOM virtualization | Enterprise canvas (read-only) | Poor (ARIA issues) |
| Handsontable | DOM virtualization | No canvas | Poor |
| MUI DataGrid | DOM virtualization | No canvas | Fair |
| TanStack Table | No default rendering | User implements | N/A (headless) |
| Excel Web | Canvas rendering | No DOM fallback | Poor |

**Key Finding:** No grid provides accessible canvas rendering. AG Grid's canvas mode explicitly disables editing to avoid accessibility complexity.

## Decision

We will implement a **hybrid three-mode system**:

### Mode 1: DOM Virtualization (Default)
- Target dataset size: 10K-500K rows
- Memory budget: <500 MB at 100K rows
- Full ARIA support, keyboard navigation, screen reader compatibility
- Uses node recycling with transform-based positioning
- Supports all cell editors, custom renderers, theming

### Mode 2: Canvas High-Performance (Opt-In, Read-Heavy)
- Target dataset size: 500K-100M rows
- Memory budget: <1 GB at 10M rows
- Optimized for streaming data (financial tickers, IoT sensors)
- Read-only or minimal editing (double-click cell → opens modal editor)
- Renders in OffscreenCanvas Web Worker for 60fps scrolling
- **Parallel accessibility tree:** Semantic shadow DOM maintains ARIA structure while canvas renders visuals

### Mode 3: Hybrid DOM + Canvas (Advanced)
- Canvas renders read-only data viewport
- DOM renders interactive elements (headers, filters, editable cells, selection checkboxes)
- Semantic shadow tree provides full screen reader support
- Best of both worlds: performance + accessibility + interactivity

### Rendering Mode Selection

```typescript
import { PhzGrid } from '@phozart/grid';

// Mode 1: DOM virtualization (default)
<phz-grid .data=${data} .columns=${columns}></phz-grid>

// Mode 2: Canvas (opt-in)
<phz-grid
  .data=${data}
  .columns=${columns}
  .renderMode=${'canvas'}
></phz-grid>

// Mode 3: Hybrid (advanced)
<phz-grid
  .data=${data}
  .columns=${columns}
  .renderMode=${'hybrid'}
  .canvasLayers=${['data']}  // Canvas renders data cells only
  .domLayers=${['headers', 'editors']}  // DOM renders interactive parts
></phz-grid>
```

### Implementation Strategy

**Phase 1 (MVP):** DOM virtualization only
**Phase 2:** Add canvas read-only mode
**Phase 3:** Add hybrid mode with semantic shadow tree

## Consequences

### Positive

1. **Accessibility First** — DOM mode ensures WCAG 2.1 AA compliance out-of-the-box
2. **Progressive Enhancement** — Users start with accessible DOM mode, upgrade to canvas for performance
3. **Market Differentiation** — Only grid with accessible canvas rendering (via semantic shadow tree)
4. **Performance at Scale** — Canvas mode handles datasets 100x larger than competitors
5. **Developer Experience** — DOM mode is easier to work with (CSS, custom renderers, browser DevTools)
6. **MIT Licensed** — All rendering modes available under MIT license

### Negative

1. **Complexity** — Maintaining three rendering modes increases codebase complexity
2. **Testing Burden** — Must test all features in all three modes
3. **Documentation** — Need clear guidance on when to use each mode
4. **Canvas Limitations** — Even with semantic shadow tree, canvas mode has UX trade-offs (no native text selection, harder to implement rich editors)

### Neutral

1. **Bundle Size** — Canvas renderer adds ~20 KB (loaded on demand when canvas mode is enabled)
2. **Browser Support** — OffscreenCanvas requires Chrome 69+, Firefox 105+ (fallback to main thread canvas for older browsers)

## Alternatives Considered

### Alternative 1: Canvas-Only (Like Excel Web)
**Rejected** because accessibility would be impossible to achieve, violating our core value proposition.

### Alternative 2: DOM-Only (Like MUI DataGrid)
**Rejected** because we wouldn't be competitive for high-performance use cases (financial trading, real-time IoT dashboards).

### Alternative 3: WebGL Rendering
**Rejected** because WebGL has no text rendering support (would need to pre-render glyphs to textures, massive complexity). Also, WebGL is overkill for 2D grid rendering.

### Alternative 4: Virtual DOM (React-style)
**Rejected** because virtual DOM still produces real DOM (doesn't solve memory issues). Also, we're framework-agnostic.

## Implementation Notes

### DOM Virtualization: Node Recycling Algorithm

```typescript
class NodePool {
  private pool: HTMLElement[] = [];
  private active: Map<RowId, HTMLElement> = new Map();

  render(visibleRowIds: RowId[]) {
    // Return inactive nodes to pool
    for (const [rowId, node] of this.active) {
      if (!visibleRowIds.includes(rowId)) {
        this.pool.push(node);
        this.active.delete(rowId);
      }
    }

    // Render visible rows
    for (const rowId of visibleRowIds) {
      let node = this.active.get(rowId);
      if (!node) {
        node = this.pool.pop() ?? this.createNode();
        this.active.set(rowId, node);
      }
      this.updateNode(node, rowId);
    }
  }
}
```

### Canvas Rendering: OffscreenCanvas Worker

```typescript
// Main thread
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('./canvas-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

// Worker thread
self.onmessage = ({ data }) => {
  const ctx = data.canvas.getContext('2d');
  requestAnimationFrame(() => renderGrid(ctx));
};
```

### Semantic Shadow Tree (Accessibility for Canvas)

```typescript
class SemanticA11yTree {
  // Create lightweight ARIA structure parallel to canvas
  update(visibleRows: RowData[]) {
    const ariaTable = this.shadowRoot.querySelector('[role="grid"]');
    ariaTable.setAttribute('aria-rowcount', String(this.totalRows));

    // Create semantic rows (no visual rendering, just ARIA)
    for (const row of visibleRows) {
      const ariaRow = document.createElement('div');
      ariaRow.setAttribute('role', 'row');
      ariaRow.setAttribute('aria-label', this.getRowLabel(row));
      ariaTable.appendChild(ariaRow);
    }
  }
}
```

## Performance Benchmarks (Target)

| Mode | Dataset Size | Memory | FPS | Time to Interactive |
|------|--------------|--------|-----|---------------------|
| DOM Virtualization | 100K rows | <500 MB | 60 fps | <500 ms |
| Canvas | 1M rows | <1 GB | 60 fps | <1 sec |
| Canvas | 10M rows | <2 GB | 60 fps | <3 sec |
| Hybrid | 500K rows | <800 MB | 60 fps | <1 sec |

## References

- [AG Grid Canvas Rendering (Enterprise)](https://www.ag-grid.com/javascript-data-grid/canvas-rendering/)
- [OffscreenCanvas API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [Virtual Scrolling - Ionic Framework](https://ionicframework.com/docs/api/virtual-scroll)
- [Accessible Canvas Elements - W3C](https://www.w3.org/WAI/PF/HTML/wiki/Canvas_Accessibility_Use_Cases)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Engineering Leads, A11y Team, Product Manager
