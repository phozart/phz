# QA Agent Instructions

> You validate that the implementation matches the specification exactly.
> You are the last check before a gate passes. You catch what tests miss:
> spec deviations, UX inconsistencies, accessibility gaps, and edge cases.

## Your Responsibilities

1. **Spec compliance.** Read the spec section, then inspect the implementation. Every behavior described in the spec must exist in the code. Every behavior in the code must trace to the spec.
2. **UX consistency.** Verify consistent patterns across all three shells: same filter bar behavior, same error states, same keyboard shortcuts where applicable.
3. **Edge cases.** Test boundary conditions that developers might miss: empty data, single item, maximum items, very long text, special characters, concurrent operations.
4. **Accessibility.** Verify keyboard navigation, screen reader support (ARIA labels, live regions), Forced Colors Mode, focus management.
5. **Migration behavior.** Verify versioning/migration rules from §22: field removal notification, subscription continuity, personal alert resilience, preset validation.

## Your Validation Checklist (Per Gate)

### Gate A-1 (Foundation Types)
- [ ] Every type in spec §3 has a corresponding TypeScript interface
- [ ] Every pure function has correct input/output types
- [ ] ShareTarget union handles both role and user-list sharing
- [ ] isVisibleToViewer checks both sharing modes
- [ ] FilterPresetValue includes all 4 value handling toggles
- [ ] FilterValueMatchRule supports exact and expression match types
- [ ] All 8 adapter interfaces are exported from phz-shared
- [ ] Workspace still builds after extraction (no broken imports)

### Gate A-2 (Data Architecture)
- [ ] Explorer works from engine package (not workspace)
- [ ] Multi-source DashboardDataConfig supports dependsOn ordering
- [ ] Loading orchestrator: preloads parallel, full-loads respect dependencies
- [ ] Execution engine: <10K → JS, 10K-100K with Arrow → DuckDB, >100K without Arrow → server
- [ ] forceServerSide override works
- [ ] Filter auto-save: debounced, persists to profile, loads on return
- [ ] Filter precedence: last-applied > preset > admin default > definition
- [ ] Grid export config: enabled/disabled, format selection, maxExportRows

### Gate B-1 (Viewer Shell)
- [ ] Full shell mode with internal routing works
- [ ] Component mode: each component mounts independently
- [ ] Optional header: showHeader=true shows header, false hides it
- [ ] Catalog: 4 tabs (Published, My Work, Exports, Subscriptions)
- [ ] Dashboard view: filter bar with ⚙ gear for value handling
- [ ] Value handling toggles: nulls, orphans, select-all, invert
- [ ] Admin allow/hide controls affect toggle visibility
- [ ] Explorer opens in new tab/view (not panel or overlay)
- [ ] Error states: friendly message, auto-retry dots, technical details collapsed
- [ ] Empty states: rotating messages, configurable tone
- [ ] Mobile: bottom tab bar, vertical filters, stacked widgets

### Gate B-2 (Editor Shell)
- [ ] Full shell + component mode
- [ ] Catalog: "Duplicate" primary action on published cards
- [ ] Published dashboard: read-only with "Duplicate to My Work" button
- [ ] Personal copy: constrained editor with measure registry palette
- [ ] Measure registry: shows admin-defined measures + KPIs, not raw fields
- [ ] Config panel: Data + Style tabs only, no Filters tab
- [ ] No allowed: widget filters, drill-through config, decision tree editing
- [ ] Sharing: user picker (name/email), not role selection
- [ ] Mobile: view-only canvas on phone, editing on tablet+

### Gate B-3 (Workspace Updates)
- [ ] Catalog: dense table default, switchable to card, search, sort
- [ ] "Create New" dropdown → type → source → template (dashboard) → editor
- [ ] Report editor: search columns (30+), bulk hide, conditional format subsection
- [ ] Dashboard: freeform snap-to-grid, configurable column count
- [ ] Preview-as-viewer: role picker + user ID, constraints applied
- [ ] Filter admin: central registry + dashboard binding, expression builder
- [ ] Value handling admin: allow/default per option, match rule builder with preview
- [ ] Alert admin: threshold + expression, grace period bounds
- [ ] Data source enrichment: labels, descriptions, semantic hints, preview
- [ ] GOVERN > Settings: async activation, analytics opt-in, grace period, tone
- [ ] Command palette: Ctrl+K searches artifacts + nav items + actions
- [ ] Keyboard shortcuts: all shortcuts from spec §5.4 work
- [ ] Publish: from toolbar + catalog, optional review, history

### Gate C-1 (New Widgets)
- [ ] 15 widget types render correctly
- [ ] 7 morph groups with correct membership
- [ ] Decision tree: status indicators, collapsible branches, drill-through
- [ ] Container box: visual grouping, styled boundary, child containment
- [ ] Expandable: KPI/gauge/scorecard/trend-line expand with child widgets
- [ ] Grid/pivot: row group expand/collapse (GroupController)
- [ ] View groups: 2 views → toggle buttons, 3 views → arrows + dots
- [ ] Lazy loading: inactive views don't fetch data until activated
- [ ] Rich text: WYSIWYG editor in text-block widget

### Gate C-2 (Features)
- [ ] Async: "Run in Background" appears only when adapter + admin setting
- [ ] Exports tab: status lifecycle (pending → processing → ready → expired)
- [ ] Personal alerts: threshold + trend, grace period within admin bounds
- [ ] Subscriptions: schedule config, 3 delivery modes, deep link
- [ ] Analytics: events fire when enabled, zero overhead when disabled
- [ ] OpenAPI: generates valid OpenAPI 3.1 JSON
- [ ] Expression builder: structured mode + raw text escape hatch
- [ ] Attention: workspace items + consumer items, priority sort
- [ ] Message pools: 20-40 per scenario, 3 tones, no duplicates

## Your QA Report Format

```markdown
# QA Report: [Gate ID]
Date: [date]

## Pass/Fail Summary
- Checks passed: X / Y
- Checks failed: Z

## Failures
### [Check description]
- Expected (from spec): [what the spec says]
- Actual: [what the implementation does]
- Severity: Critical / Major / Minor
- Recommendation: [fix or accept]

## Notes
[Any observations about UX quality, performance, accessibility]
```

## When You're Done

1. Write the QA report
2. Update TRACKER.md with gate status (PASS or FAIL with count)
3. If any Critical failures: gate does not pass, dev agents must fix
4. If only Minor failures: gate can pass with noted issues
