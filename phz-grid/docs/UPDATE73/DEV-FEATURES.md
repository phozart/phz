# Dev Features Agent Instructions

> You build new widget types, async reports, personal alerts, subscriptions,
> usage analytics, the OpenAPI generator, the expression builder, and the
> message pool system. Your work depends on foundation types (A-1) and
> shell infrastructure (B-1).

## Your Responsibilities

1. **New widget types.** Decision tree, container box, expandable widget support, widget view groups, rich text widget.
2. **Async reports.** "Run in Background" UI, feature detection + admin activation, Exports tab.
3. **Personal alerts.** Threshold + trend triggers, grace period with admin bounds, creation from KPI widgets, My Work management.
4. **Subscriptions.** Subscribe button, schedule config, delivery mode selection, Subscriptions tab, deep link helper.
5. **Usage analytics.** Event tracking across all shells, fire-and-forget, opt-in per category.
6. **OpenAPI spec generator.** Pure function producing OpenAPI 3.1 from dataset config.
7. **Shared components.** Expression builder (structured + raw), preview-as-viewer context picker.
8. **Attention system.** Workspace-generated items + consumer items, priority sorting, acknowledge/snooze.
9. **Message pools.** 20-40 messages per error/empty scenario, 3 tone variants, consumer customization.

## Key Spec Sections

- §4 Widget System (types, morph groups, expansion types)
- §9 Decision Tree Widget
- §10 Expandable Widgets & Smart Boxes
- §13 Widget View Switching
- §14 Async Report Generation
- §15 API Specification & Data Access
- §16 Usage Analytics & Telemetry
- §19 Personal Alerts
- §20 Report & Dashboard Subscriptions
- §21 Error States & Empty States (message pools)

## Development Rules

1. **Widgets are Lit Web Components.** Follow the existing widget pattern in the widgets package. Each widget gets a component file and a config type.
2. **Pure functions for logic.** Widget state transitions, expression evaluation, chart suggestion, OpenAPI generation — all pure functions testable in Node.
3. **Feature detection pattern.** Async reports check for executeQueryAsync on DataAdapter. Subscriptions check for SubscriptionAdapter. If the adapter/method doesn't exist, the feature UI doesn't render. No errors, no fallbacks — just absence.
4. **Expression builder is shared.** Used by filter rules (admin), alert rules (admin), decision tree conditions (admin), and personal alerts (viewer, simplified). Build it in phz-shared with configurable complexity modes.
5. **Message pools are data.** Each message pool is a plain TypeScript const array. No logic, no template strings. The rendering component picks a random message from the pool based on a hash of the current timestamp (deterministic per session, different between sessions).
6. **Usage analytics is zero-impact when disabled.** When the admin hasn't opted in, no tracking code runs. The UsageAnalyticsAdapter is checked at mount time. If absent or analytics disabled, all trackEvent calls are no-ops.

## Message Pool Specification

Create the following pool files in phz-shared/src/message-pools/:

| File | Scenario | Messages per tone | Tones |
|---|---|---|---|
| dashboard-error.ts | Dashboard load failure | 30 | default, minimal, playful |
| widget-error.ts | Widget load failure | 25 | default, minimal, playful |
| filter-error.ts | Filter load failure | 20 | default, minimal, playful |
| export-error.ts | Export failure | 20 | default, minimal, playful |
| explorer-error.ts | Explorer query failure | 20 | default, minimal, playful |
| data-source-error.ts | Data source unavailable | 25 | default, minimal, playful |
| retries-exhausted.ts | All retries failed | 25 | default, minimal, playful |
| field-removed.ts | Field removed by admin | 20 | default, minimal, playful |
| catalog-empty.ts | Empty catalog | 25 | default, minimal, playful |
| my-work-empty.ts | Empty My Work | 20 | default, minimal, playful |
| exports-empty.ts | Empty Exports | 20 | default, minimal, playful |
| subscriptions-empty.ts | Empty Subscriptions | 20 | default, minimal, playful |
| search-empty.ts | No search results | 20 | default, minimal, playful |
| dashboard-empty.ts | Dashboard no widgets | 20 | default, minimal, playful |
| explorer-empty.ts | Explorer no source | 20 | default, minimal, playful |
| alerts-empty.ts | No personal alerts | 20 | default, minimal, playful |
| filter-empty.ts | Filter no values | 20 | default, minimal, playful |

Each file exports: `{ default: string[], minimal: string[], playful: string[] }`

Messages must be: natural, varied, non-repetitive, non-technical, human-readable. No error codes, no jargon. The playful tone can be light but never condescending.

## Your Tasks

All tasks prefixed with `C-` in TASK-BREAKDOWN.md. Two phases: C-1 (widgets), C-2 (async/subscriptions/analytics).

## When You're Done

1. Update TRACKER.md
2. Append to CHANGELOG.md
3. Notify test agents
4. Flag interface changes for architect review
