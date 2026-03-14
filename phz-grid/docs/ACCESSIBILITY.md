# phozart Accessibility

## Why Accessibility is Our Audio Fidelity

A Moog System 55 synthesizer sounds right on every speaker, through every
amplifier, in every room. Not because "sounds right" was added at the end of
the signal chain, but because every oscillator, every filter, every envelope
generator was engineered for clean signal from the start. Audio fidelity is
not a feature of the System 55. It is the engineering discipline that makes
the instrument what it is.

phozart works the same way. Every component in the stack -- from the headless
core engine to the Web Components rendering layer to the CSS token system --
is engineered for accessible interaction. Screen readers, keyboard navigation,
forced colors mode, motor impairment accommodations: these are not features
we bolted on after the grid rendered correctly for sighted mouse users. They
are the reason the grid renders correctly for everyone.

This distinction matters. When accessibility is treated as a feature, it
competes with other features for priority and budget. When accessibility is
treated as engineering discipline, it becomes the quality standard that
every feature must meet before it ships. phozart chose the latter.

**The headless core has zero DOM noise in the data path.** The `@phozart/core`
package manages state, sorting, filtering, grouping, and selection as pure
data transformations. No DOM elements are created. No ARIA attributes are
attached to phantom nodes. The data path is a clean oscillator signal -- it
produces correct output regardless of what rendering layer consumes it.

**The three-layer CSS token system adapts to any display context.** Public API
tokens (`--phz-*`) give consumers control. Internal computed tokens (`--_*`)
derive density-responsive and theme-responsive values. Component styles
reference internal tokens with fallbacks. This three-layer system ensures
that accessibility properties -- focus ring colors, minimum contrast ratios,
row heights for touch targets -- cascade correctly through density modes
(`compact`, `dense`, `comfortable`) and themes (`light`, `dark`, `sand`,
`midnight`, `high-contrast`) without requiring consumers to re-implement
accessibility for each combination.

This is the calibrated output stage. The signal stays clean from headless
core to rendered pixel.

## What We Support

### Screen Readers

The `AriaManager` class (`packages/grid/src/a11y/aria-manager.ts`, 103 lines)
manages ARIA attributes on the grid's DOM elements, including the semantic
shadow layer for virtualized content.

**Grid structure.** The grid renders as a semantic `<table>` element with
`role="grid"`, `aria-rowcount`, and `aria-colcount` attributes. Column
headers are `<th>` elements. Data rows are `<tr>` elements with
`aria-rowindex` and `aria-selected`. This is a real HTML table -- not a
`<div>` grid with ARIA roles layered on top of CSS Grid layout.

**Live region announcements.** The AriaManager creates a visually-hidden
live region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`)
that announces state changes to screen reader users:

- Sort changes: "Sorted by Salary descending"
- Filter changes: "Filtered to 42 rows"
- Page changes: "Page 3 of 10"
- Group toggle: "Group North expanded" / "Group North collapsed"
- Selection changes: announced via `aria-selected` attribute updates on rows

**ARIA sort indicators.** Every sortable column header carries an `aria-sort`
attribute (`none`, `ascending`, or `descending`). Screen readers announce the
current sort state when users navigate to a column header.

**Customizable labels.** The `AriaLabels` interface allows consumers to
override default ARIA labels for localization:

```typescript
import type { AriaLabels } from '@phozart/core';

const labels: AriaLabels = {
  grid: 'Employee directory',
  // Additional labels for localized screen reader text
};
```

**Selection state.** Every data row carries `aria-selected="true"` or
`aria-selected="false"`. Checkboxes have `aria-label="Select row"` and
`aria-label="Select all rows"`. The selection bar is marked `role="status"`
with `aria-live="polite"` so screen readers announce selection count changes.

**Loading and empty states.** The loading overlay carries `aria-busy="true"`
and `aria-label="Loading data"`. The empty state container uses
`role="status"`. Progressive loading indicators use `aria-live="polite"`.

**Toast notifications.** Toast messages are rendered with `role="alert"` and
`aria-live="assertive"`, ensuring screen readers immediately announce
transient notifications (export complete, error messages, etc.). Dismissible
toasts include a close button with `aria-label="Dismiss"`.

### Keyboard Navigation

The `KeyboardNavigator` class (`packages/grid/src/a11y/keyboard-navigator.ts`,
336 lines) implements full roving tabindex navigation compliant with the
WAI-ARIA Grid pattern.

**Roving tabindex.** Only one cell in the grid has `tabindex="0"` at any time.
All other cells have `tabindex="-1"`. When the user navigates, the previous
cell's tabindex is reset to `-1` and the new cell receives `tabindex="0"` and
DOM focus. This is the correct pattern specified by WAI-ARIA Authoring
Practices for grid widgets.

**Navigation keys:**

| Key                      | Action                                                   |
| ------------------------ | -------------------------------------------------------- |
| Arrow Up/Down/Left/Right | Move focus one cell in the indicated direction           |
| Home                     | Move focus to the first cell in the current row          |
| End                      | Move focus to the last cell in the current row           |
| Ctrl+Home                | Move focus to the first cell in the first row            |
| Ctrl+End                 | Move focus to the last cell in the last row              |
| Page Up                  | Move focus up by one page (configurable page size)       |
| Page Down                | Move focus down by one page                              |
| Tab                      | Move focus out of the grid to the next focusable element |

**Editing keys:**

| Key    | Action                                                                       |
| ------ | ---------------------------------------------------------------------------- |
| F2     | Enter edit mode on the focused cell                                          |
| Enter  | Activate the focused cell (toggle sort on headers, enter edit on data cells) |
| Escape | Cancel the current edit and return to navigation mode                        |

**Selection keys:**

| Key         | Action                                            |
| ----------- | ------------------------------------------------- |
| Space       | Toggle selection on the focused row               |
| Ctrl+A      | Select all rows                                   |
| Shift+Arrow | Extend range selection in the indicated direction |
| Ctrl+C      | Copy selected content to clipboard                |

**Context menu:** Shift+F10 or the Context Menu key opens the context menu
at the focused cell's position, generated programmatically as a `contextmenu`
event so keyboard users have the same context menu as mouse users.

**No keyboard trap.** Tab moves focus into the grid; Tab moves focus out.
The grid never traps keyboard focus. This is a common failure in competing
grids where arrow key navigation prevents Tab from escaping the component.

**Filter popover navigation.** The filter popover implements its own keyboard
navigation: Arrow Down/Up to move between filter values, Enter/Space to
toggle a value, Escape to close. Focus is trapped within the popover while
it is open (modal behavior) and restored to the triggering element on close.

### Forced Colors Mode (Windows High Contrast)

The `ForcedColorsAdapter` class
(`packages/grid/src/a11y/forced-colors-adapter.ts`, 110 lines) detects and
adapts to Windows High Contrast mode and the CSS `forced-colors: active`
media query.

**Detection.** `ForcedColorsAdapter.detect()` checks
`matchMedia('(forced-colors: active)')` and returns a boolean. The
`onChange()` method returns a cleanup function for reactively adapting when
the user toggles high contrast mode at runtime.

**System color keywords.** When forced colors mode is active, all custom
colors are replaced with CSS system color keywords that respect the user's
chosen high contrast theme:

| Element              | Background   | Text            | Border                    |
| -------------------- | ------------ | --------------- | ------------------------- |
| Grid host            | `Canvas`     | `CanvasText`    | `CanvasText`              |
| Header cells         | `Canvas`     | `CanvasText`    | `CanvasText`              |
| Data cells           | (inherited)  | `CanvasText`    | `CanvasText`              |
| Selected rows        | `Highlight`  | `HighlightText` | --                        |
| Hover rows           | --           | --              | `LinkText` (2px outline)  |
| Focus indicator      | --           | --              | `Highlight` (2px outline) |
| Sort/filter icons    | --           | `LinkText`      | --                        |
| Editing cells        | `Field`      | `FieldText`     | `Highlight` (2px outline) |
| Checkboxes (checked) | `Highlight`  | `HighlightText` | `Highlight`               |
| Resize handles       | `CanvasText` | --              | --                        |

**`forced-color-adjust: none`.** The grid sets `forced-color-adjust: none` on
`:host` to prevent the browser from making its own (often incorrect) color
adjustments, then explicitly maps every visual element to the correct system
color keyword. This gives us full control over how the grid appears in every
Windows high contrast theme variant.

**No information conveyed by color alone.** Sort direction is indicated by
arrow glyphs (ascending/descending) in addition to any color styling. Filter
state uses both a visual badge and `aria-pressed` on the filter button.
Selected rows have both background color changes and `aria-selected` attribute
changes. This satisfies WCAG 1.4.1 (Use of Color).

### Motor Impairment

**Keyboard-first.** Every interaction the grid supports -- sorting, filtering,
selecting, editing, copying, context menus, pagination -- is available through
keyboard alone. No feature requires a mouse or fine pointer control.

**Keyboard alternatives to drag operations.** Column reordering and column
resizing have keyboard-accessible alternatives. Users are not required to
perform drag-and-drop operations to accomplish any task.

**Focus visibility.** Every focusable element displays a visible focus
indicator. Data cells use a 2px solid outline
(`var(--phz-focus-ring-color, #3B82F6)`) with `-2px` offset. Checkboxes use
a 2px solid outline with `2px` offset. In forced colors mode, focus indicators
use the system `Highlight` color, which the user has explicitly chosen for
maximum visibility.

### CSS Token System (the Calibrated Output)

The three-layer token architecture ensures accessibility properties work
correctly across all configuration combinations:

**Layer 1 -- Public API tokens (`--phz-*`).** Consumers override these to
customize the grid's appearance. Examples: `--phz-font-family-base`,
`--phz-row-height`, `--phz-focus-ring-color`, `--phz-cell-padding`.

**Layer 2 -- Internal computed tokens (`--_*`).** Derived from public tokens
per density mode and theme. The grid sets these on `:host` and density-specific
selectors (`:host([density="compact"])`, `:host([density="dense"])`,
`:host([density="comfortable"])`). Examples:

```css
:host([density='compact']) {
  --_row-height: var(--phz-row-height-compact, 42px);
  --_cell-padding: 8px 12px;
  --_cell-overflow: hidden;
  --_cell-white-space: nowrap;
}

:host([density='comfortable']) {
  --_row-height: var(--phz-row-height-comfortable, 52px);
  --_cell-padding: 14px 16px;
  --_cell-overflow: visible;
  --_cell-white-space: normal;
}
```

**Layer 3 -- Component styles.** Reference `--_*` tokens with fallbacks.
Components never hardcode accessibility-relevant values like row heights,
padding, or overflow behavior.

This layering means a consumer can set `density="compact"` and the grid
automatically switches to truncated text with `overflow: hidden`, while
`density="comfortable"` switches to wrapped text with `overflow: visible` --
and the focus ring, selection highlighting, and forced colors mapping all
continue to work correctly without additional configuration.

## WCAG 2.2 AA Compliance

phozart targets WCAG 2.2 Level AA conformance for the grid component and all
associated UI controls (filter popovers, context menus, column choosers,
pagination, toolbar).

### Automated Testing

The E2E test suite uses **axe-core** via `@axe-core/playwright` to perform
automated WCAG audits against the rendered grid in a real browser. The audit
runs with the following tag set:

```typescript
new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
```

This covers WCAG 2.0 Level A, WCAG 2.0 Level AA, and WCAG 2.2 Level AA
success criteria -- the standard required by most enterprise procurement
processes and government accessibility mandates.

### Browser Test Coverage

The E2E suite contains 21 browser tests across three spec files that verify
real rendered output in Chromium (not just source code inspection):

**`e2e/accessibility.spec.ts`** (9 tests):

| Test                                      | What it verifies                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| axe-core WCAG 2.2 AA audit                | Full automated accessibility audit of the rendered grid                |
| Grid has proper ARIA role                 | `table[role="grid"]` exists in shadow DOM                              |
| Column headers have `aria-sort`           | All `<th>` elements carry `aria-sort` attribute                        |
| Sortable columns announce sort state      | Clicking a header changes `aria-sort` to `ascending` or `descending`   |
| Grid has `aria-label`                     | The grid table has a descriptive `aria-label`                          |
| Data rows have `aria-selected`            | All `<tbody tr>` elements carry `aria-selected` attribute              |
| Selection change updates `aria-selected`  | Clicking a row sets `aria-selected="true"`                             |
| Focus is visible with keyboard navigation | Tab into grid produces visible focus indicator (outline or box-shadow) |
| Pagination buttons have `aria-labels`     | All pagination buttons have descriptive `aria-label` attributes        |

**`e2e/keyboard-navigation.spec.ts`** (5 tests):

| Test                            | What it verifies                                            |
| ------------------------------- | ----------------------------------------------------------- |
| Tab moves focus into the grid   | Tab key transfers focus to an element inside the shadow DOM |
| Clicking a cell gives it focus  | Click sets `tabindex="0"` on the target cell                |
| ArrowDown navigates within grid | Arrow key moves `activeElement` within shadow DOM           |
| Escape returns focus context    | Escape does not move focus outside the grid                 |
| Clicking header triggers sort   | Click on `<th>` changes `aria-sort` value                   |

**`e2e/grid-rendering.spec.ts`** (7 tests):

| Test                                 | What it verifies                      |
| ------------------------------------ | ------------------------------------- |
| Renders the grid element             | `<phz-grid>` is visible               |
| Renders correct number of data rows  | Expected row count in `<tbody>`       |
| Renders column headers               | Expected `<th>` count                 |
| Renders cell content correctly       | Text content matches data             |
| Renders with different density modes | `density` attribute propagates        |
| Shows toolbar when enabled           | `<phz-toolbar>` present in shadow DOM |
| Handles empty data gracefully        | Grid remains visible with zero rows   |

### Unit Test Coverage

In addition to E2E tests, the `@phozart/grid` package includes unit tests for
accessibility subsystems:

- **`keyboard-a11y.test.ts`** -- Roving tabindex behavior (tabindex reset on
  previous cell, tabindex="0" on current cell), context menu keyboard
  navigation (ArrowDown/ArrowUp skip separators and disabled items), toast
  `role="alert"` contract, screen reader announcement text format verification.

- **`filter-popover-a11y.test.ts`** -- Filter popover ARIA roles, focus
  management (show/hide lifecycle, `previousFocusElement` tracking), keyboard
  navigation (ArrowDown/ArrowUp with wrapping, Enter/Space to toggle values,
  Escape to close), focus trap behavior.

### Known Tracked Issues

Some toolbar icon buttons are missing `aria-label` attributes. This is a known
issue tracked for fix. The axe-core test filters these violations to prevent
them from blocking the test suite while the fix is in progress, but logs them
to the console for visibility:

```
KNOWN ISSUE: N toolbar button(s) missing discernible text (tracked for fix)
```

No other WCAG 2.2 AA violations have been identified in automated testing.

## The Competitive Landscape

Accessibility support in data grid libraries is either incomplete, inconsistent,
or paywalled. This is the market condition that motivated phozart's creation.

**AG Grid.** Enterprise accessibility features -- including screen reader
support and ARIA compliance -- require the AG Grid Enterprise license at
$1,650 per developer per year (as of 2025). The Community Edition has limited
accessibility support. Organizations subject to government accessibility
mandates must pay the enterprise price to achieve compliance, creating a
financial barrier to accessible software.

**TanStack Table.** Headless by design -- provides no DOM output, no ARIA
attributes, no keyboard navigation, no forced colors support. Every consuming
application must implement its own accessibility layer from scratch. This is
architecturally honest but practically burdensome: most teams either skip
accessibility entirely or implement it partially and inconsistently.

**Handsontable.** Provides basic keyboard navigation but lacks comprehensive
ARIA grid role implementation, forced colors mode support, and consistent focus
management. The keyboard navigation model does not follow WAI-ARIA Grid
pattern specifications.

**phozart.** Full accessibility in the MIT-licensed `@phozart/core` and
`@phozart/grid` packages. Screen reader support, keyboard navigation, forced
colors mode, focus management, and ARIA compliance are never behind a paywall.
This is a deliberate architectural decision, not a marketing gesture:
accessibility is infrastructure, and infrastructure belongs in the open core.

The phozart position is that charging for accessibility creates a market
incentive to ship inaccessible defaults. We decline to participate in that
incentive structure.

## Enterprise Readiness

### VPAT (Voluntary Product Accessibility Template)

phozart's accessibility implementation is structured to support VPAT
documentation under the ITI VPAT 2.5 format. The mapping between phozart
capabilities and VPAT criteria:

| VPAT Section      | phozart Coverage                                    |
| ----------------- | --------------------------------------------------- |
| WCAG 2.2 Level A  | Automated axe-core verification                     |
| WCAG 2.2 Level AA | Automated axe-core verification                     |
| Section 508       | Covered by WCAG 2.2 AA conformance                  |
| EN 301 549        | Covered by WCAG 2.2 AA conformance (Clause 9 - Web) |

### Section 508 (United States)

Section 508 of the Rehabilitation Act requires federal agencies to procure
accessible information and communication technology. Since the 2018 Section
508 Refresh, conformance is measured against WCAG 2.0 Level AA. phozart
targets WCAG 2.2 Level AA, which is a superset of the Section 508
requirement.

Federal agencies and their contractors can deploy phozart in Section 508-covered
systems without requiring accessibility remediation of the grid component itself.

### EN 301 549 (European Union)

EN 301 549 is the European harmonized standard for ICT accessibility, referenced
by the European Accessibility Act (Directive 2019/882) and public procurement
directives. Clause 9 (Web) requires WCAG 2.1 Level AA conformance. phozart
targets WCAG 2.2 Level AA, which is a superset.

Organizations deploying phozart in EU-regulated applications can reference the
grid's WCAG 2.2 AA conformance for EN 301 549 Clause 9 compliance.

### AODA (Ontario, Canada)

The Accessibility for Ontarians with Disabilities Act requires WCAG 2.0 Level
AA conformance for web content (IASR, Section 14). phozart's WCAG 2.2 AA
target exceeds this requirement.

### Procurement Documentation

For enterprise procurement processes that require accessibility evidence,
phozart provides:

1. **This document** -- technical description of accessibility architecture
   and capabilities
2. **Automated test results** -- axe-core WCAG 2.2 AA audit output from
   every CI run
3. **Source code** -- the `packages/grid/src/a11y/` directory is MIT-licensed
   and auditable
4. **E2E test specs** -- `e2e/accessibility.spec.ts` and
   `e2e/keyboard-navigation.spec.ts` are executable proof of conformance

## How to Verify

### Running the Full Accessibility Test Suite

```bash
# Run all E2E tests (includes axe-core audit, keyboard navigation, rendering)
npm run test:e2e
```

This starts the E2E test application, launches Playwright against Chromium,
and executes all 21 browser tests. The axe-core audit runs against the fully
rendered grid with real data, real Shadow DOM, and real CSS -- not a
synthetic test harness.

### Running Unit Tests for Accessibility Subsystems

```bash
# Run all @phozart/grid unit tests (includes a11y tests)
npm test --workspace=packages/grid
```

This executes the Vitest unit test suite, which includes:

- `packages/grid/src/__tests__/keyboard-a11y.test.ts` -- Verifies roving
  tabindex behavior, context menu keyboard navigation, toast alert role, and
  screen reader announcement text formatting.

- `packages/grid/src/__tests__/filter-popover-a11y.test.ts` -- Verifies
  filter popover ARIA roles, focus management lifecycle, keyboard navigation
  within the popover, and focus trap behavior.

### What Each Test File Checks

| File                                                      | Subsystem                                                     | Method                                      |
| --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `e2e/accessibility.spec.ts`                               | ARIA roles, axe-core audit, focus visibility, selection state | Playwright + axe-core against rendered grid |
| `e2e/keyboard-navigation.spec.ts`                         | Tab focus, arrow key navigation, sort via click               | Playwright keyboard simulation              |
| `e2e/grid-rendering.spec.ts`                              | DOM structure, density modes, empty state                     | Playwright DOM queries                      |
| `packages/grid/src/__tests__/keyboard-a11y.test.ts`       | Roving tabindex, context menu keys, toast role, SR text       | Vitest unit tests with mock GridApi         |
| `packages/grid/src/__tests__/filter-popover-a11y.test.ts` | Filter popover ARIA, focus management, keyboard nav           | Vitest unit tests with component instances  |

### Manual Verification

For screen reader testing, we recommend:

1. **NVDA + Firefox** on Windows -- the most common screen reader + browser
   combination for web applications
2. **VoiceOver + Safari** on macOS -- built-in screen reader for Apple platforms
3. **JAWS + Chrome** on Windows -- the enterprise standard for commercial
   screen reader testing

For forced colors mode testing:

1. Open Windows Settings > Accessibility > Contrast Themes
2. Select any high contrast theme (e.g., "High Contrast #1")
3. Verify the grid displays with system colors, all text remains readable,
   and focus indicators are visible

For keyboard-only testing:

1. Unplug the mouse
2. Tab into the grid
3. Navigate with arrow keys, sort with Enter on headers, filter with the
   filter button, select with Space, edit with F2
4. Tab out of the grid -- verify focus is not trapped
