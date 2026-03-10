# Dev Shells Agent Instructions

> You build the viewer shell, editor shell, and workspace admin UX updates.
> Your work depends on the foundation (Workstream A). Start viewer in parallel
> once core types from A-1 are available.

## Your Responsibilities

1. **Build phz-viewer.** Full shell mode + individual mountable components. All 5 screens (catalog, dashboard, report, explorer, attention). Error/empty states. Mobile responsive.
2. **Build phz-editor.** Full shell + component mode. Constrained dashboard editing with measure registry palette. Sharing flow. All screens from spec §7.
3. **Update workspace admin UX.** Dense catalog, simplified creation wizard, 30+ column report editor, freeform dashboard editor, filter admin with value handling, alert admin, data source enrichment, GOVERN > Settings, command palette, keyboard shortcuts, publish workflow, navigation config, API Access.

## Key Spec Sections

Read thoroughly before starting:
- §5 Workspace Shell UX (all 13 subsections)
- §6 Viewer Shell UX (all 9 subsections including two modes)
- §7 Editor Shell UX (all 13 subsections)
- §21 Error States & Empty States (message pools, technical details panel)

## Development Rules

1. **Lit Web Components with Shadow DOM.** All UI components are Lit. Thin views that call pure functions from phz-shared or engine.
2. **Import from phz-shared, not workspace.** Design tokens, types, adapters — all from @phozart/phz-shared.
3. **Two modes for viewer and editor.** Both shells must work as full shell (internal routing) AND as individual mountable components. The consumer app chooses.
4. **Optional header.** The showHeader prop controls whether the shell renders its own header. Component mode never renders a header.
5. **Responsive first.** Every screen must handle desktop, laptop, tablet, and mobile breakpoints using the existing responsive helpers from phz-shared.
6. **Accessibility.** Screen reader support, keyboard navigation, ARIA attributes, Forced Colors Mode. Use the existing A11yController pattern.
7. **Error/empty states everywhere.** Every screen, every component that loads data, must handle error and empty states using the message pool system.

## Pattern for Building a Screen

```
1. Define the screen's state type (pure data, no DOM)
2. Write pure transition functions for all state changes
3. Write the Lit component as a thin view binding state to template
4. Wire adapter calls (DataAdapter, PersistenceAdapter) in the component
5. Add error/empty state handling
6. Add responsive breakpoint classes
7. Add accessibility attributes
```

## Your Tasks

All tasks prefixed with `B-` in TASK-BREAKDOWN.md. Three phases: B-1 (viewer), B-2 (editor), B-3 (workspace updates).

## Reuse Between Viewer and Editor

The explorer component (`<phz-explorer-view>`) is shared between viewer and editor. Build it once in viewer, export it, editor imports it. The editor adds "Add to Dashboard" as an extra action.

Error/empty state components are shared. Build them in phz-shared as reusable Lit components. All three shells import them.

The filter bar with value handling toggles is shared between viewer and editor. Build it in phz-shared.

## When You're Done With a Task

1. Update TRACKER.md
2. Append to CHANGELOG.md
3. Notify test-unit and test-e2e agents
4. Flag any interface changes for architect review
