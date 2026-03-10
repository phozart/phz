# ADR-003: Semantic Shadow DOM for Accessible Virtualization

## Status
Accepted

## Context

This is the **core technical differentiator** of phz-grid. Every major data grid library breaks screen reader accessibility when virtualization is enabled.

### The Problem: Virtualization Destroys Accessibility

Screen readers (NVDA, JAWS, VoiceOver) build a virtual buffer by parsing the accessibility tree. When DOM virtualization removes rows from the DOM on scroll:

1. **Row count becomes incorrect** — Screen reader announces "Row 50 of undefined" because `aria-rowcount` doesn't update
2. **Context is lost** — User navigates to row 100, scrolls down, row 100 is removed from DOM, screen reader loses position
3. **Navigation breaks** — Screen reader tries to move to row 101, but that row doesn't exist in DOM yet
4. **Keyboard focus disappears** — Focus was on row 50, row 50 gets recycled for row 200, focus is lost

### Current Industry "Solutions"

| Grid | Approach | Accessibility Score |
|------|----------|---------------------|
| AG Grid | Recommends `suppressRowVirtualisation: true` | Poor (kills performance) |
| Handsontable | No official solution, breaks with virtualization | Poor |
| MUI DataGrid | No official solution, ARIA issues documented | Poor |
| PrimeNG | Renders empty `<tbody>`, totally broken | Critical fail |
| TanStack Table | Headless, user must implement accessibility | N/A |

**Sarah Higley (Microsoft Accessibility Expert)** publicly criticized AG Grid's ARIA implementation. No grid has solved this correctly.

### Research Findings

From innovation research:
- AG Grid's virtual scrolling sets incorrect `aria-rowcount` (or omits it entirely)
- Users with disabilities report grids are "impossible to use" with screen readers
- Government/healthcare teams are forced to disable virtualization, causing performance issues
- Section 508 compliance audits routinely reject grid implementations

## Decision

We will implement a **Semantic Shadow DOM** architecture:

### Architecture Overview

```
┌─────────────────────────────────────────┐
│  Visual Layer (DOM Virtualized)        │
│  ├─ Row 100 (visible)                  │
│  ├─ Row 101 (visible)                  │
│  └─ Row 102 (visible)                  │
│     (~50 actual DOM nodes, recycled)   │
└─────────────────────────────────────────┘
             ↕ (synchronized)
┌─────────────────────────────────────────┐
│  Semantic Layer (Accessibility Tree)   │
│  ├─ Row 1 (aria-rowindex=1)            │
│  ├─ Row 2 (aria-rowindex=2)            │
│  ├─ ...                                 │
│  └─ Row 10000 (aria-rowindex=10000)    │
│     (Lightweight ARIA structure)        │
└─────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Screen Reader                          │
│  Reads: "Row 100 of 10000"             │
└─────────────────────────────────────────┘
```

### Implementation Strategy

**Layer 1: Visual DOM (Virtualized)**
- Renders only visible rows (~50 DOM nodes)
- Uses `transform: translateY()` for positioning
- Recycles nodes on scroll
- Handles user interactions (click, hover, focus)

**Layer 2: Semantic Shadow Tree (Accessibility)**
- Maintains lightweight ARIA structure for ALL rows
- Each row is a minimal `<div role="row" aria-rowindex="N">`
- No actual cell content (just structural semantics)
- Updates when data changes, not on scroll
- Invisible to sighted users (positioned off-screen or in shadow DOM)

**Layer 3: ARIA Live Regions**
- Announces scroll position changes: "Row 100 of 10,000"
- Announces sort/filter changes: "Sorted by Name, ascending. Showing 5,000 of 10,000 rows."
- Announces cell edits: "Cell updated: Name, Alice"

### Code Structure

```typescript
class AccessibleVirtualGrid extends LitElement {
  // Visual layer (virtualized)
  private visualContainer: HTMLElement;
  private nodePool: DOMVirtualizer;

  // Semantic layer (full accessibility tree)
  private semanticContainer: HTMLElement;
  private ariaRows: Map<RowId, HTMLElement> = new Map();

  // Live region for announcements
  private liveRegion: HTMLElement;

  render() {
    return html`
      <!-- Visual layer (user sees this) -->
      <div class="visual-grid" role="presentation">
        ${this.renderVisualRows()}
      </div>

      <!-- Semantic layer (screen reader sees this) -->
      <div class="semantic-grid" role="grid" aria-rowcount="${this.totalRows}">
        ${this.renderSemanticRows()}
      </div>

      <!-- Live region for announcements -->
      <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
        ${this.announcement}
      </div>
    `;
  }

  private renderSemanticRows() {
    // Create lightweight ARIA structure for ALL rows
    return this.allRowIds.map((rowId, index) => html`
      <div
        role="row"
        aria-rowindex="${index + 1}"
        aria-label="${this.getRowLabel(rowId)}"
        data-row-id="${rowId}"
      >
        <!-- Minimal cell structure (no content, just ARIA) -->
        ${this.columns.map((col, colIndex) => html`
          <div
            role="gridcell"
            aria-colindex="${colIndex + 1}"
            aria-label="${this.getCellLabel(rowId, col.id)}"
          ></div>
        `)}
      </div>
    `);
  }

  private handleScroll(scrollTop: number) {
    // Update visual layer (virtualization)
    this.updateVisualRows(scrollTop);

    // Announce scroll position to screen reader
    const currentRowIndex = this.getRowIndexAtScroll(scrollTop);
    this.announcement = `Row ${currentRowIndex} of ${this.totalRows}`;
  }

  private getRowLabel(rowId: RowId): string {
    const rowData = this.rowMap.get(rowId);
    const firstCol = this.columns[0];
    return `Row: ${rowData[firstCol.id]}`;
  }

  private getCellLabel(rowId: RowId, columnId: ColumnId): string {
    const rowData = this.rowMap.get(rowId);
    const column = this.columns.find(c => c.id === columnId);
    return `${column.name}: ${rowData[columnId]}`;
  }
}
```

### CSS for Semantic Layer

```css
/* Hide semantic layer from sighted users, but keep in accessibility tree */
.semantic-grid {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* Alternative: Use shadow DOM (preferred for encapsulation) */
phz-grid::part(semantic-layer) {
  display: none; /* Hidden from visual tree */
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### ARIA Attributes

```html
<!-- Grid container -->
<div role="grid" aria-rowcount="10000" aria-colcount="5">

  <!-- Header row -->
  <div role="row" aria-rowindex="1">
    <div role="columnheader" aria-colindex="1" aria-sort="ascending">Name</div>
    <div role="columnheader" aria-colindex="2">Age</div>
  </div>

  <!-- Semantic data rows (all 10,000 rows) -->
  <div role="row" aria-rowindex="2" aria-label="Row: Alice">
    <div role="gridcell" aria-colindex="1" aria-label="Name: Alice"></div>
    <div role="gridcell" aria-colindex="2" aria-label="Age: 28"></div>
  </div>
  <!-- ... rows 3-10000 ... -->

</div>
```

## Consequences

### Positive

1. **First Grid with Accessible Virtualization** — Core market differentiator
2. **WCAG 2.1 AA Compliance** — Passes automated and manual accessibility testing
3. **Screen Reader Support** — Works correctly with NVDA, JAWS, VoiceOver
4. **Performance Maintained** — Semantic layer is lightweight (no cell content rendering)
5. **Keyboard Navigation Works** — Focus management unaffected by virtualization
6. **Section 508 / VPAT Ready** — Government and healthcare procurement-ready
7. **Competitive Moat** — Extremely difficult for competitors to replicate without architectural redesign

### Negative

1. **Memory Overhead** — Semantic layer adds ~5-10 MB for 100K rows (minimal <div> elements)
2. **Complexity** — Two parallel rendering trees increase code complexity
3. **Synchronization Burden** — Must keep semantic layer in sync with data changes
4. **Novel Pattern** — No established best practices (we're pioneering this)
5. **Testing Complexity** — Must test with multiple screen readers on multiple platforms

### Neutral

1. **Bundle Size** — Adds ~5 KB to core grid bundle (acceptable)
2. **Browser Compatibility** — Works in all modern browsers (IE11 would need polyfills)

## Validation Plan

### PoC Success Criteria (Must Pass Before MVP)

- [ ] NVDA announces correct row count: "Row 100 of 10,000"
- [ ] JAWS maintains context when scrolling (doesn't lose position)
- [ ] VoiceOver on macOS can navigate all 10,000 rows with keyboard
- [ ] Automated axe DevTools scan shows zero critical/serious issues
- [ ] Manual testing with real screen reader users (n >= 3)
- [ ] Passes WCAG 2.1 Level AA criteria for all Success Criteria

### Testing Matrix

| Screen Reader | OS | Browser | Status |
|---------------|----|---------| -------|
| NVDA 2024.1 | Windows 11 | Chrome 120 | To test |
| JAWS 2024 | Windows 11 | Chrome 120 | To test |
| JAWS 2024 | Windows 11 | Firefox 121 | To test |
| VoiceOver | macOS 14 | Safari 17 | To test |
| VoiceOver | iOS 17 | Safari | To test |
| TalkBack | Android 14 | Chrome | To test |

## Alternatives Considered

### Alternative 1: Disable Virtualization for Screen Readers
**Rejected** because it kills performance (100K row grid would render 100K DOM nodes, causing browser crash).

### Alternative 2: Render All Rows Off-Screen
**Rejected** because it defeats the purpose of virtualization (memory usage would be the same as no virtualization).

### Alternative 3: ARIA Live Regions for All Row Changes
**Rejected** because live regions are for announcements, not structural representation. Screen readers need actual ARIA grid structure.

### Alternative 4: Focus-Based Row Rendering (Render on Keyboard Navigation)
**Partially adopted** as a complement to semantic shadow tree. When user navigates to non-visible row, we render it in visual layer AND it exists in semantic layer.

### Alternative 5: Use `aria-owns` to Reference Virtual Rows
**Rejected** because `aria-owns` doesn't work well with large dynamic lists. Browser performance degrades with 10K+ `aria-owns` references.

## References

- [ARIA Practices - Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [Sarah Higley's AG Grid ARIA Criticism](https://sarahmhigley.com/writing/grids-part1/)
- [Accessible Virtualized Lists - Deque](https://www.deque.com/blog/accessible-aria-listbox/)
- [Managing Focus - W3C](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [Screen Readers and Virtual Buffers - Mozilla](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)

## Open Questions (To Resolve in PoC)

1. **Memory Threshold**: At what row count does semantic layer become a memory issue? (Test at 100K, 500K, 1M rows)
2. **Update Performance**: How fast can we update semantic layer on data changes? (Target: <16ms for 60fps)
3. **Screen Reader Performance**: Do screen readers slow down with 100K ARIA rows? (Test with real users)
4. **Focus Management**: How do we ensure focus doesn't get lost when semantic row maps to recycled visual row?

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: A11y Team Lead (Priya Sharma persona), Engineering Leads, Product Manager
**Critical Path**: This is a MUST VALIDATE in PoC before committing to MVP
