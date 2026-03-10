# phz-grid Implementation Orchestration

> Master plan for multi-agent implementation of the phz-grid architecture
> spec (PHZ-GRID-ARCHITECTURE-SPEC.md v1.1.0).

---

## Agent Team Structure

```
                    ┌─────────────────┐
                    │ PRODUCT OWNER   │
                    │ Reviews, accepts│
                    │ validates UX    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ARCHITECT     │
                    │ Oversees all    │
                    │ resolves blocks │
                    │ enforces spec   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │ DEV TEAM A  │   │ DEV TEAM B  │   │ DEV TEAM C  │
   │ Foundation  │   │ Shells      │   │ Features    │
   │             │   │             │   │             │
   │ Dev + Test  │   │ Dev + Test  │   │ Dev + Test  │
   │ + QA + Docs │   │ + QA + Docs │   │ + QA + Docs │
   └─────────────┘   └─────────────┘   └─────────────┘
```

### Roles

| Role | Agent | Responsibility | Reads | Writes |
|---|---|---|---|---|
| Product Owner | `po-agent` | Validates UX against spec, acceptance testing, final sign-off | Spec, QA reports, docs | Acceptance notes, change requests |
| Architect | `architect-agent` | Oversees all work, resolves conflicts, enforces API contracts, reviews PRs | Everything | Architecture decisions, API reviews, block resolutions |
| Dev (Foundation) | `dev-foundation` | phz-shared extraction, engine explorer move, core type changes | Spec §1-3, §12, workstream A | Source code, unit tests |
| Dev (Shells) | `dev-shells` | Viewer shell, editor shell, workspace updates | Spec §5-7, workstream B | Source code, unit tests |
| Dev (Features) | `dev-features` | New widgets, async reports, subscriptions, analytics, API spec | Spec §9-20, workstream C | Source code, unit tests |
| Tester (Unit) | `test-unit` | Unit tests for pure functions, state machines, adapters | Source code, spec | Test files, coverage reports |
| Tester (E2E) | `test-e2e` | End-to-end tests via Playwright | Running apps, spec | E2E test files, test reports |
| QA | `qa-agent` | Validates implementation matches spec, accessibility, edge cases | Spec, running app, test reports | QA reports, bug tickets |
| Docs | `docs-agent` | Updates DEVELOPER-GUIDE, ADMIN-GUIDE, USER-GUIDE, AUTHOR-GUIDE, ANALYST-GUIDE, EDITOR-GUIDE (new) | Spec, source code, API changes | Documentation files |

---

## Workstreams

Three parallel workstreams with dependency gates between them.

### Workstream A: Foundation (Weeks 1-3)
Extract shared infrastructure, restructure packages, establish contracts.
Everything else depends on this.

### Workstream B: Shells (Weeks 2-5)
Build viewer and editor shells, update workspace shell. Can start in
week 2 once core types from Workstream A are available.

### Workstream C: Features (Weeks 3-7)
New widget types, async reports, subscriptions, analytics, API spec
generator. Depends on foundation types and shell infrastructure.

### Documentation: Continuous
Docs agent updates documentation after each workstream completion gate.

```
Week  1    2    3    4    5    6    7    8
      ├────┤────┤────┤────┤────┤────┤────┤
  A   ████████████████
  B        ███████████████████
  C             ██████████████████████
  Doc  ·    ·    ·    ·    ·    ·    ·   █
  QA   ·    ·    ·    █    █    █    █   █
  PO   ·    ·    ·    ·    █    ·    █   █
```

---

## Coordination Rules

### 1. Spec Is the Source of Truth

Every implementation decision must trace to PHZ-GRID-ARCHITECTURE-SPEC.md.
If a developer encounters ambiguity, they escalate to the architect, not
resolve it themselves. The architect consults the spec or the product owner.

### 2. API Contracts Before Implementation

Before coding any adapter, interface, or cross-package boundary, the
architect reviews and approves the TypeScript interface. Once approved,
the interface is frozen for that workstream phase. Changes require a
change request through the architect.

### 3. Gate Reviews

Each workstream has completion gates. Work cannot proceed past a gate
until:
- All tasks in the gate are complete
- Unit tests pass (>90% coverage for pure functions)
- Architect has reviewed the code
- QA has validated against the spec
- Docs have been updated

### 4. Task Tracker

All agents read and write to `TRACKER.md` in the project root. Format
defined in TRACKER-TEMPLATE.md. The architect updates the tracker daily.
Each agent updates their own task status.

### 5. Change Log

All agents append to `CHANGELOG.md` when completing a task. Format:
```
## [Date] - [Agent] - [Workstream]
### [Task ID]
- What was done
- Files changed
- Tests added
- Breaking changes (if any)
```

### 6. Conflict Resolution

If two agents need to modify the same file:
1. First agent to start owns the file
2. Second agent creates the change as a separate file with `.pending` suffix
3. Architect merges pending changes

### 7. Documentation Protocol

After each gate completion:
1. Dev agent writes a summary of what changed (interfaces, behavior, config)
2. Docs agent reads the summary and updates all affected guide files
3. QA validates the documentation against the running implementation
4. Product owner reviews the user-facing documentation

---

## File Structure (Target)

```
packages/
├── shared/                     ← NEW: @phozart/phz-shared
│   ├── src/
│   │   ├── adapters/           ← DataAdapter, PersistenceAdapter, etc.
│   │   ├── types/              ← ShareTarget, ArtifactVisibility, etc.
│   │   ├── design-system/      ← Tokens, responsive, container queries
│   │   ├── coordination/       ← Pipeline, FilterContext, InteractionBus
│   │   ├── components/         ← Preview picker, expression builder
│   │   └── index.ts
│   └── package.json
├── viewer/                     ← NEW: @phozart/phz-viewer
│   ├── src/
│   │   ├── shell/              ← Full shell mode
│   │   ├── components/         ← Individual mountable components
│   │   ├── screens/            ← Catalog, dashboard, report, explorer
│   │   └── index.ts
│   └── package.json
├── editor/                     ← NEW: @phozart/phz-editor
│   ├── src/
│   │   ├── shell/
│   │   ├── components/
│   │   ├── screens/
│   │   └── index.ts
│   └── package.json
├── workspace/                  ← UPDATED: admin + author only
├── engine/                     ← UPDATED: gains explorer
├── widgets/                    ← UPDATED: new widget types
├── core/
├── definitions/
├── criteria/
├── duckdb/
├── grid/
├── grid-admin/
├── engine-admin/
├── grid-creator/
├── ai/
├── collab/
├── react/
├── vue/
└── angular/

docs/
├── DEVELOPER-GUIDE.md          ← UPDATED
├── ADMIN-GUIDE.md              ← UPDATED
├── USER-GUIDE.md               ← UPDATED
├── AUTHOR-GUIDE.md             ← UPDATED
├── ANALYST-GUIDE.md            ← UPDATED
├── EDITOR-GUIDE.md             ← NEW
├── API-REFERENCE-V15.md        ← NEW VERSION
└── PHZ-GRID-ARCHITECTURE-SPEC.md

project/
├── TRACKER.md
├── CHANGELOG.md
└── implementation-plan/
    ├── ORCHESTRATION.md         (this file)
    ├── TASK-BREAKDOWN.md
    ├── TRACKER-TEMPLATE.md
    ├── agents/
    │   ├── ARCHITECT.md
    │   ├── DEV-FOUNDATION.md
    │   ├── DEV-SHELLS.md
    │   ├── DEV-FEATURES.md
    │   ├── TEST-UNIT.md
    │   ├── TEST-E2E.md
    │   ├── QA.md
    │   ├── DOCS.md
    │   └── PRODUCT-OWNER.md
    └── workstreams/
        ├── WORKSTREAM-A-FOUNDATION.md
        ├── WORKSTREAM-B-SHELLS.md
        └── WORKSTREAM-C-FEATURES.md
```
