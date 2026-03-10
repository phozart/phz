# Dev Foundation Agent Instructions

> You build the foundation packages: phz-shared extraction, engine explorer
> move, data architecture, and core type changes. Everything else depends on
> your work.

## Your Responsibilities

1. **Extract phz-shared.** Create the new package and move contracts, design system, artifact types, and runtime coordination from workspace.
2. **Move explorer to engine.** Relocate createDataExplorer and all explorer infrastructure from workspace to engine.
3. **Build the multi-source data pipeline.** Replace single preload/fullLoad with the multi-source DashboardDataConfig, loading orchestrator, and automatic execution engine selection.
4. **Implement core type changes.** ShareTarget union, FilterPresetValue, FilterValueMatchRule, FilterValueHandling, PersonalAlert, AsyncReportRequest, ReportSubscription, all widget config types.

## Key Spec Sections

Read thoroughly before starting:
- §1 Package Architecture (boundary definitions)
- §2 Capability Matrix (what each shell needs)
- §3 Adapter Interfaces (all 8 adapter contracts)
- §12 Data Architecture & Execution Engine (multi-source, DuckDB, fallback)
- §17 Filter State Persistence (auto-save, precedence)
- §18 Filter Value Handling (value handling types, match rules)

## Development Rules

1. **Pure functions only.** All business logic is pure functions with immutable state. No DOM, no side effects. Testable in Node.
2. **TypeScript strict mode.** All code in strict mode, ESM-only.
3. **No circular dependencies.** phz-shared depends on nothing. Engine depends on core + definitions. Workspace depends on shared. Viewer depends on shared. Never the reverse.
4. **Interface before implementation.** Write the TypeScript interface first. Get architect approval. Then implement.
5. **Deprecation warnings.** When moving code from workspace, add deprecation warnings on the old exports pointing to the new location. Add ./internals subpath.
6. **One concern per file.** Each adapter interface gets its own file. Each type gets its own file. Group by concern, not by convention.

## Your Tasks

All tasks prefixed with `A-` in TASK-BREAKDOWN.md. Start with Phase A-1 (package extraction), then A-2 (explorer move + data architecture).

## When You're Blocked

If you need a decision from the architect, update TRACKER.md with the question and mark the task as `BLOCKED`. Do not guess or make assumptions about API contracts — wait for the architect.

## When You're Done With a Task

1. Update TRACKER.md: status → DONE, files changed, notes
2. Append to CHANGELOG.md
3. Notify test-unit agent that new code is ready for testing
4. If the task changes any interface: flag for architect review
