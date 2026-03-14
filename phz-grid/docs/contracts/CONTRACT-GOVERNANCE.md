# Contract Governance and Change Management

**Title**: Contract Governance Document
**Date**: 2026-02-24
**Version**: 1.0
**Status**: ACTIVE

---

## Table of Contents

1. [Contract Registry](#contract-registry)
2. [Change Management Process](#change-management-process)
3. [Implementation Rules](#implementation-rules)
4. [Package Dependency Constraints](#package-dependency-constraints)
5. [Quality Gates for Implementation](#quality-gates-for-implementation)
6. [Contract Freeze Notice](#contract-freeze-notice)
7. [Versioning Strategy](#versioning-strategy)
8. [Deprecation Policy](#deprecation-policy)
9. [Contract Review Process](#contract-review-process)
10. [Emergency Change Process](#emergency-change-process)

---

## Contract Registry

Master list of all binding contracts with version, date, and ownership.

| Contract | Version | Date | Owner | Status | File Path |
|----------|---------|------|-------|--------|-----------|
| **API-CONTRACTS.md** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/contracts/API-CONTRACTS.md` |
| **PYTHON-API-CONTRACTS.md** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/contracts/PYTHON-API-CONTRACTS.md` |
| **DATA-MODEL.md** | 1.0 | 2026-02-24 | Data Architect | FINALIZED | `docs/architecture/DATA-MODEL.md` |
| **SYSTEM-ARCHITECTURE.md** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/SYSTEM-ARCHITECTURE.md` |
| **ADR-001: Headless Core + Lit** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-001-headless-core-lit-rendering.md` |
| **ADR-002: DOM Virtualization** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-002-dom-virtualization-default-canvas-enterprise.md` |
| **ADR-003: Semantic Shadow DOM** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-003-semantic-shadow-accessible-virtualization.md` |
| **ADR-004: DuckDB-WASM + Arrow** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-004-duckdb-wasm-apache-arrow.md` |
| **ADR-005: Yjs CRDTs** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-005-yjs-crdts-collaboration.md` |
| **ADR-006: Three-Layer Theming** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-006-three-layer-css-theming.md` |
| **ADR-007: Schema-as-Contract AI** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-007-schema-as-contract-ai.md` |
| **ADR-008: ESM-Only** | 1.0 | 2026-02-24 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-008-esm-only-no-commonjs.md` |
| **ADR-009: Three-Shell Architecture** | 1.0 | 2026-03-08 | Solution Architect | FINALIZED | `docs/architecture/ADR/ADR-009-three-shell-architecture.md` |
| **DESIGN-SYSTEM.md** | 1.0 | 2026-02-24 | UX/UI Designer | FINALIZED | `docs/design/DESIGN-SYSTEM.md` |
| **COMPONENT-SPECS.md** | 1.0 | 2026-02-24 | UX/UI Designer | FINALIZED | `docs/design/COMPONENT-SPECS.md` |
| **ACCESSIBILITY-SPEC.md** | 1.0 | 2026-02-24 | Accessibility Specialist | FINALIZED | `docs/accessibility/ACCESSIBILITY-SPEC.md` |
| **INTERACTION-PATTERNS.md** | 1.0 | 2026-02-24 | UX/UI Designer | FINALIZED | `docs/design/INTERACTION-PATTERNS.md` |

---

## Change Management Process

### How to Propose a Contract Change

All contract changes MUST follow this process:

#### Step 1: Create RFC (Request for Change)

Create a new file: `docs/contracts/rfcs/RFC-NNNN-[title].md`

```markdown
# RFC-NNNN: [Title]

**Proposed By**: [Name/Role]
**Date**: [YYYY-MM-DD]
**Status**: Proposed

## Problem Statement
[What issue does this change address?]

## Proposed Change
[Exact contract modifications with before/after examples]

## Impact Analysis
- Affected Packages: [List packages]
- Breaking Change: [Yes/No]
- Backward Compatibility: [Yes/No/Partial]

## Alternatives Considered
[Other approaches and why rejected]

## Implementation Plan
1. [Step 1]
2. [Step 2]
...

## Migration Path
[How existing code will be migrated]
```

#### Step 2: Review and Approval

Required approvals:

| Change Type | Required Approvers | Timeline |
|-------------|-------------------|----------|
| Breaking change (major) | Solution Architect + 2 Tech Leads + Product Manager | 5 business days |
| Non-breaking change (minor) | Solution Architect + 1 Tech Lead | 2 business days |
| Patch/typo fix | Solution Architect | 1 business day |
| Emergency fix | Solution Architect (post-facto review) | Immediate |

#### Step 3: Update Contracts

Once approved, Solution Architect updates:
1. The affected contract file(s)
2. Contract version number (semver)
3. This CONTRACT-GOVERNANCE.md registry
4. CHANGELOG.md with entry

#### Step 4: Notify Stakeholders

Solution Architect sends notification to:
- All implementation agents
- Engineering team
- Documentation team
- Product team (if breaking change)

Notification template:
```
Subject: [BREAKING/NON-BREAKING] Contract Change: [Contract Name] v[X.Y.Z]

Contract Changed: [Contract Name]
Previous Version: [X.Y.Z]
New Version: [X.Y.Z]
Change Type: [Breaking/Non-breaking/Patch]

Summary:
[Brief description of change]

Affected Packages:
- [Package 1]
- [Package 2]

Migration Required: [Yes/No]
Migration Guide: [Link if yes]

Full RFC: [Link to RFC document]
```

### Breaking vs Non-Breaking Changes

#### Breaking Changes (Require Major Version Bump)

- Removing a public API method
- Changing method signature (parameters or return type)
- Renaming public interfaces/types
- Changing default behavior in non-backward-compatible way
- Removing CSS custom properties
- Changing event payload structure
- Changing data model field names

**Example:**
```typescript
// BREAKING CHANGE: Renamed method
// Before (v1.x)
gridApi.setRowData(data);

// After (v2.x)
gridApi.setData(data);
```

#### Non-Breaking Changes (Require Minor Version Bump)

- Adding new optional parameters
- Adding new methods
- Adding new events
- Adding new CSS custom properties
- Adding new optional fields to interfaces
- Deprecating APIs (with continued support)

**Example:**
```typescript
// NON-BREAKING: Added optional parameter
// Before (v1.0)
gridApi.sort(field, direction);

// After (v1.1)
gridApi.sort(field, direction, priority?); // priority is optional
```

#### Patch Changes (Require Patch Version Bump)

- Bug fixes
- Performance improvements
- Documentation updates
- Internal refactoring
- Type clarifications

---

## Implementation Rules

All implementation code MUST adhere to these rules:

### Rule 1: API Contracts are Binding

**All code MUST implement the exact signatures in `API-CONTRACTS.md`.**

```typescript
// ✅ CORRECT: Matches API-CONTRACTS.md exactly
export function createGrid(config: GridConfig): GridInstance {
  // Implementation
}

// ❌ INCORRECT: Changed signature
export function createGrid(config: GridConfig, options?: CreateOptions): GridInstance {
  // This is a contract violation unless API-CONTRACTS.md is updated first
}
```

Violations will be caught by:
- TypeScript compiler errors
- Automated contract validation CI check
- Code review rejection

### Rule 2: TypeScript Types Must Match DATA-MODEL.md

**All TypeScript interfaces, types, and enums MUST match `DATA-MODEL.md` exactly.**

```typescript
// ✅ CORRECT: Matches DATA-MODEL.md
export interface GridState {
  readonly version: number;
  readonly lastModified: number;
  readonly sort: SortState;
  readonly filter: FilterState;
  // ... exact fields from DATA-MODEL.md
}

// ❌ INCORRECT: Added field not in DATA-MODEL.md
export interface GridState {
  readonly version: number;
  readonly lastModified: number;
  readonly customField: string; // ← Contract violation
  // ...
}
```

### Rule 3: CSS Custom Properties Must Match DESIGN-SYSTEM.md

**All CSS custom properties MUST be defined in `DESIGN-SYSTEM.md`.**

```css
/* ✅ CORRECT: Uses token from DESIGN-SYSTEM.md */
.phz-cell {
  padding: var(--phz-cell-padding);
  background: var(--phz-cell-bg);
}

/* ❌ INCORRECT: Undefined token */
.phz-cell {
  padding: var(--phz-custom-padding); /* ← Not in DESIGN-SYSTEM.md */
}
```

### Rule 4: ARIA Attributes Must Match ACCESSIBILITY-SPEC.md

**All ARIA attributes, roles, and screen reader announcements MUST follow `ACCESSIBILITY-SPEC.md`.**

```html
<!-- ✅ CORRECT: Matches ACCESSIBILITY-SPEC.md -->
<div role="grid" aria-rowcount="1000" aria-colcount="10">
  <div role="row" aria-rowindex="1">
    <div role="gridcell" aria-colindex="1">Cell 1</div>
  </div>
</div>

<!-- ❌ INCORRECT: Uses non-standard role -->
<div role="table"> <!-- ← Should be "grid" per ACCESSIBILITY-SPEC.md -->
```

### Rule 5: All ADR Decisions are Binding

**Implementation MUST follow all accepted ADRs.**

Examples:
- ADR-008: NO CommonJS builds, ESM-only
- ADR-003: Semantic Shadow DOM required for accessibility
- ADR-004: DuckDB-WASM for SQL queries (not SQLite)

### Rule 6: Python API Must Maintain Feature Parity

**Python package (`phz-grid`) MUST provide equivalent functionality to JS API.**

```python
# ✅ CORRECT: Equivalent to JS createGrid()
from phz_grid import Grid

grid = Grid(data=df, columns=columns)

# Feature parity maintained:
grid.sort(column='name', direction='asc')
grid.filter(column='status', operator='equals', value='active')
grid.get_selected_data()
```

### Rule 7: Deviations Require Formal ADR

**Any deviation from contracts requires a new ADR explaining the decision and updating the contract.**

Process:
1. Discover that contract cannot be followed (e.g., browser limitation)
2. Create ADR documenting the issue and proposed solution
3. Get approval from Solution Architect
4. Update affected contracts
5. Implement with new contract

---

## Package Dependency Constraints

### Core Package: Zero External Dependencies

`@phozart/core` MUST have ZERO npm dependencies.

```json
// packages/core/package.json
{
  "dependencies": {} // ← Must be empty
}
```

**Rationale**: Core engine must be lightweight and framework-agnostic.

### Grid Package: Only Core + Lit

`@phozart/grid` MAY only depend on:
- `@phozart/core` (workspace dependency)
- `lit@^5.0.0` (rendering library)

```json
// packages/grid/package.json
{
  "dependencies": {
    "@phozart/core": "workspace:*",
    "lit": "^5.0.0"
  }
}
```

**Prohibited**: React, Vue, Angular, or any framework-specific library.

### Framework Adapters: Only Core + Grid + Framework

Framework adapters MUST use peer dependencies:

```json
// packages/react/package.json
{
  "dependencies": {
    "@phozart/core": "workspace:*",
    "@phozart/grid": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### Extension Packages: Core + Specific Dependencies

Extension packages may depend on:
- `@phozart/core` (required)
- Specific libraries (e.g., DuckDB-WASM, Yjs)

```json
// packages/duckdb/package.json
{
  "dependencies": {
    "@phozart/core": "workspace:*",
    "@duckdb/duckdb-wasm": "^1.31.0",
    "apache-arrow": "^18.0.0"
  }
}
```

### Circular Dependency Prevention

NO circular dependencies allowed. Enforced by ESLint rule:

```json
// .eslintrc.json
{
  "rules": {
    "import/no-cycle": "error"
  }
}
```

### Individual Dependency Size Limit

NO single dependency may exceed 50 KB gzipped.

Verification:
```bash
npx bundlephobia <package-name>
```

If a dependency exceeds 50 KB:
1. Consider alternatives
2. Lazy-load if possible
3. Move to optional peer dependency
4. Document exception with ADR

---

## Quality Gates for Implementation

All packages MUST pass these quality gates before merging:

### Quality Gate 1: Unit Test Coverage

**Requirement**: >= 80% code coverage for all packages

```bash
npm run test:coverage

# CI check:
# - Branch coverage: >= 80%
# - Line coverage: >= 80%
# - Function coverage: >= 80%
```

**Exemptions**: None. All code must be tested.

### Quality Gate 2: E2E Test Coverage

**Requirement**: All user stories in RTM (Requirements Traceability Matrix) must have E2E tests

```bash
npm run test:e2e

# Each user story must have:
# - At least 1 happy path test
# - At least 1 error path test
# - Accessibility test (screen reader navigation)
```

### Quality Gate 3: Bundle Size Gates

**Per-package limits**:

| Package | Limit (gzipped) | Measurement |
|---------|----------------|-------------|
| `@phozart/core` | 50 KB | Rollup output |
| `@phozart/grid` | 70 KB | Core + Lit |
| `@phozart/react` | 5 KB | Adapter only |
| `@phozart/vue` | 5 KB | Adapter only |
| `@phozart/angular` | 5 KB | Adapter only |
| `@phozart/duckdb` | 3.5 MB | Includes DuckDB-WASM |
| `@phozart/ai` | 100 KB | Excludes LLM SDK |
| `@phozart/collab` | 200 KB | Includes Yjs |

CI check fails if any package exceeds limit.

### Quality Gate 4: Accessibility Audit

**Requirement**: WCAG 2.2 AA compliance

Automated checks (CI):
```bash
npm run test:a11y

# Checks:
# - axe-core automated scan (0 violations)
# - Lighthouse accessibility score >= 95
# - Color contrast ratios >= 4.5:1
```

Manual checks (pre-release):
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation (all features accessible)
- Forced colors mode testing
- Zoom to 200% (content remains readable)

### Quality Gate 5: Performance Benchmarks

**Requirements**:

| Benchmark | Target | Measurement |
|-----------|--------|-------------|
| 100K row scroll | 60 fps | Chrome DevTools Performance |
| 100K row sort | < 200 ms | Performance.now() |
| 100K row filter | < 100 ms | Performance.now() |
| Memory (100K rows) | < 500 MB | Chrome DevTools Memory |
| Initial render (10K rows) | < 500 ms | Lighthouse |

CI runs performance benchmarks on every PR.

### Quality Gate 6: TypeScript Strict Mode

**Requirement**: Zero TypeScript errors in strict mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Quality Gate 7: No `any` in Public API

**Requirement**: Public API surface MUST NOT use `any` type

```typescript
// ❌ REJECTED: any in public API
export function updateCell(value: any): void;

// ✅ APPROVED: Generic type
export function updateCell<T>(value: T): void;
```

Enforced by ESLint rule:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

---

## Contract Freeze Notice

### Freeze Date

**All contracts are FROZEN as of 2026-02-24.**

Implementation phase (Phase 6 and beyond) begins with these contracts as binding.

### What "Frozen" Means

1. **No changes without RFC** — All contract changes require formal RFC process
2. **Implementation starts now** — Development agents can begin coding against these contracts
3. **Stability guarantee** — Contracts will not change during Phase 6 (Implementation) except for critical bugs
4. **Breaking changes deferred** — Non-critical breaking changes will wait until Phase 10 (V2 Planning)

### Exceptions to Freeze

Contracts may be changed WITHOUT RFC in these cases:

1. **Critical security vulnerability** — Emergency ADR required post-facto
2. **Browser API deprecation** — If a browser removes an API we depend on
3. **Dependency security advisory** — If a dependency has a critical CVE
4. **Typo/documentation fix** — Clarifications that don't change semantics

All exceptions must be documented in CHANGELOG.md.

### Version Locking

During Phase 6 (Implementation), all contracts are locked to version 1.0.

| Phase | Contract Version | Changes Allowed |
|-------|-----------------|-----------------|
| Phase 5 (Current) | 1.0 | Finalization only |
| Phase 6 (Implementation) | 1.0 | Patch fixes only |
| Phase 7 (Testing) | 1.0 | No changes |
| Phase 8 (Launch) | 1.0 | No changes |
| Phase 9 (Growth) | 1.x | Minor additions only |
| Phase 10 (V2 Planning) | 2.0 | Breaking changes allowed |

---

## Versioning Strategy

All contracts follow Semantic Versioning (semver):

### Version Format: MAJOR.MINOR.PATCH

```
1.0.0
│ │ │
│ │ └─ PATCH: Bug fixes, typos, clarifications
│ └─── MINOR: New features, non-breaking additions
└───── MAJOR: Breaking changes
```

### Package Version Alignment

All packages in the monorepo MUST use the same major version:

```json
// All packages
{
  "version": "1.0.0"
}
```

When a breaking change is made to ANY contract, ALL packages bump to next major version.

### Version Update Process

1. Solution Architect updates contract version in document header
2. Solution Architect updates CONTRACT-GOVERNANCE.md registry
3. Solution Architect runs `npm version [major|minor|patch] --workspaces`
4. CI validates that all packages have matching versions
5. Git tag created: `v1.0.0`

### Pre-Release Versions

During development:
- `1.0.0-alpha.1` — Early development
- `1.0.0-beta.1` — Feature complete, testing
- `1.0.0-rc.1` — Release candidate

---

## Deprecation Policy

### Deprecation Timeline

Deprecated APIs MUST be supported for 2 major versions.

```typescript
// Version 1.x: Original API
export function setRowData(data: RowData[]): void;

// Version 2.0: Deprecate old API, introduce new API
/**
 * @deprecated Use `setData()` instead. Will be removed in v4.0.
 */
export function setRowData(data: RowData[]): void {
  console.warn('[phz-grid] setRowData() is deprecated. Use setData() instead.');
  this.setData(data);
}

export function setData(data: RowData[]): void;

// Version 3.x: Still supported with warnings

// Version 4.0: Remove deprecated API
// setRowData() no longer exists
```

### Deprecation Notice Requirements

All deprecated APIs MUST include:

1. **JSDoc `@deprecated` tag**
   ```typescript
   /**
    * @deprecated Use `setData()` instead. Will be removed in v4.0.
    */
   ```

2. **Console warning at runtime**
   ```typescript
   if (process.env.NODE_ENV !== 'production') {
     console.warn('[phz-grid] ...');
   }
   ```

3. **Entry in CHANGELOG.md**
   ```markdown
   ### Deprecated
   - `setRowData()` — Use `setData()` instead (removal in v4.0)
   ```

4. **Migration guide documentation**
   - Link from API docs
   - Example of old API → new API
   - Automated codemod if possible

---

## Contract Review Process

### Regular Review Cadence

Contracts are reviewed on this schedule:

| Review Type | Frequency | Participants | Purpose |
|-------------|-----------|--------------|---------|
| **Sprint Review** | Every 2 weeks | Solution Architect + Implementation Leads | Check for implementation blockers |
| **Quarterly Review** | Every 3 months | Solution Architect + Product + Engineering | Assess need for minor changes |
| **Annual Review** | Every 12 months | All stakeholders | Plan next major version |

### Review Checklist

During reviews, check:

- Are contracts still implementable?
- Have any browser APIs changed?
- Are there emerging standards we should adopt?
- Are there performance issues caused by contract design?
- Are there accessibility issues?
- Are there ergonomic issues (DX)?

### Review Outcomes

Possible outcomes:
1. **No changes** — Contracts remain as-is
2. **Minor clarifications** — Patch version bump
3. **Non-breaking additions** — Minor version bump, RFC required
4. **Breaking changes** — Deferred to next major version, ADR required

---

## Emergency Change Process

### When to Use Emergency Process

Use ONLY for:
- Critical security vulnerability
- Browser breaking change (API removal)
- Data corruption bug
- Accessibility blocker (WCAG violation in released code)

**Do NOT use for**:
- Feature requests
- Performance optimizations
- Nice-to-have improvements

### Emergency Process Steps

1. **Identify issue** — Document severity and impact
2. **Immediate fix** — Solution Architect makes contract change
3. **Notify stakeholders** — Send emergency notification
4. **Post-facto ADR** — Create ADR within 24 hours explaining decision
5. **Retrospective** — Review why issue wasn't caught earlier

### Emergency Notification Template

```
Subject: [EMERGENCY] Contract Change: [Contract Name]

EMERGENCY CONTRACT CHANGE

Issue: [Brief description of critical issue]
Severity: [Critical/High]
Impact: [Who/what is affected]

Change Made:
[Before/after comparison]

Reason:
[Why emergency process was necessary]

ADR: [Link to post-facto ADR]

Timeline:
- Issue discovered: [timestamp]
- Fix applied: [timestamp]
- Stakeholders notified: [timestamp]
```

---

## Contract Validation and Enforcement

### CI Validation

Automated checks run on every PR:

```bash
# 1. TypeScript type checking
npm run typecheck

# 2. Contract validation script
npm run validate:contracts

# 3. API compatibility check
npm run check:api-compatibility

# 4. Bundle size check
npm run check:bundle-size

# 5. Dependency audit
npm run check:dependencies
```

### Contract Validation Script

```typescript
// scripts/validate-contracts.ts

// Validates:
// 1. All exported APIs match API-CONTRACTS.md
// 2. All TypeScript types match DATA-MODEL.md
// 3. All CSS tokens match DESIGN-SYSTEM.md
// 4. All ARIA attributes match ACCESSIBILITY-SPEC.md
// 5. No circular dependencies
// 6. Dependency size limits

// Fails CI if any validation fails
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm run test:changed
```

### Pre-push Hooks

```bash
# .husky/pre-push
npm run validate:contracts
npm run test:all
```

---

## v15 Governance Additions

### New Packages in Governance Scope

v15 introduced three new packages that are subject to all governance rules:

| Package | Scope | Governance Notes |
|---------|-------|-----------------|
| `@phozart/shared` | Shared infrastructure (adapters, types, design system, artifacts, coordination) | Foundation package — breaking changes here affect ALL shells. Requires highest scrutiny. Changes require Solution Architect + 2 Tech Leads approval. |
| `@phozart/viewer` | Read-only consumption shell (state machines + Lit components) | Viewer-only deployments depend on this package. Changes must maintain backward compatibility with viewer configs. |
| `@phozart/editor` | Authoring shell (state machines + Lit components) | Author-facing editing capabilities. Changes must be validated against the measure palette constraint model. |

### Amendment Governance

v15 integrated four spec amendments (A through D). Each amendment followed this process:

1. **Amendment drafted** with explicit scope reference (e.g., "7A-A: Alert-Aware KPI Cards")
2. **Types defined first** in `@phozart/shared/types` — establishing the data contract before implementation
3. **Pure functions tested** with comprehensive unit tests before any Lit component code
4. **Cross-package contracts validated** — each amendment touches multiple packages (shared + engine/widgets/grid) and requires integration verification

| Amendment | Scope | Packages Affected | Contract Artifact |
|-----------|-------|-------------------|-------------------|
| A: Alert-Aware KPI Cards | `SingleValueAlertConfig`, alert design tokens | shared, widgets, engine | `shared/types/single-value-alert.ts`, `shared/design-system/alert-tokens.ts` |
| B: Micro-Widget Cell Renderers | `CellRendererRegistry`, 4 SVG renderers | shared, widgets, grid | `shared/types/micro-widget.ts`, `grid/formatters/micro-widget-cell.ts` |
| C: Impact Chain Widget | `ImpactChainNode`, variant picker | shared, widgets | `shared/types/impact-chain.ts`, `shared/design-system/chain-tokens.ts` |
| D: Faceted Attention Filtering | `filterAttentionItems`, `computeAttentionFacets` | shared, widgets, viewer | `shared/types/attention-filter.ts`, `shared/coordination/attention-faceted-state.ts` |

### CellRendererRegistry as a Runtime Contract

The `CellRendererRegistry` is a **runtime contract**, not a build-time contract. This is a deliberate architectural decision (see ADR-009).

**Why runtime registration?** The grid package needs to render micro-widget cells, but importing widget renderers at build time would create a circular dependency: `grid -> widgets -> engine -> grid`. Instead:

1. `@phozart/shared` defines the `CellRendererRegistry` interface and `createCellRendererRegistry()` factory
2. `@phozart/grid` imports the interface and calls `resolveCellRenderer()` during cell formatting
3. `@phozart/widgets` implements the four SVG renderers (`createSparklineRenderer()`, `createGaugeArcRenderer()`, etc.)
4. The consuming shell registers renderers at mount time: `registerAllMicroWidgetRenderers(registry)`

**Governance implication**: Changes to the `MicroWidgetRenderer` interface are breaking changes for ALL registered renderers. The interface has two methods (`render()`, `canRender()`) and their signatures are frozen.

### Three-Shell Architecture Contract

The three-shell architecture (ADR-009) establishes a hard dependency constraint:

```
shared  <--  viewer  (read-only)
shared  <--  editor  (authoring)
shared  <--  workspace (full admin)
```

**No shell imports another shell.** This is enforced by:
- Package.json dependency declarations (viewer/editor do NOT list workspace as a dependency)
- TypeScript project references (no cross-shell tsconfig references)
- CI validation (import cycle detection)

Consumers may deploy:
- Viewer only (smallest bundle — read-only consumption)
- Editor only (constrained authoring — measure palette, not raw fields)
- Full workspace (admin with Lit components)
- Any combination (viewer + editor, viewer + workspace, etc.)

---

## Appendix A: Terminology

| Term | Definition |
|------|------------|
| **Contract** | Binding agreement on API shape, data structure, or behavior |
| **RFC** | Request for Change — formal proposal to modify a contract |
| **ADR** | Architecture Decision Record — document explaining a design decision |
| **Breaking Change** | Change that requires users to modify their code |
| **Non-Breaking Change** | Change that is backward compatible |
| **Deprecation** | Marking API as obsolete but still supported |
| **Freeze** | Period where contracts cannot change without emergency process |
| **Semver** | Semantic Versioning (MAJOR.MINOR.PATCH) |

---

## Appendix B: Contact Information

| Role | Responsibility | Contact |
|------|---------------|---------|
| **Solution Architect** | Contract ownership, ADR approval | solution-architect@phozart.dev |
| **Data Architect** | Data model contracts | data-architect@phozart.dev |
| **UX/UI Designer** | Design system contracts | design@phozart.dev |
| **Accessibility Specialist** | A11y contracts | a11y@phozart.dev |
| **Implementation Leads** | Contract feedback | dev-leads@phozart.dev |

---

## Appendix C: Useful Links

- [API Contracts](./API-CONTRACTS.md)
- [Python API Contracts](./PYTHON-API-CONTRACTS.md)
- [Data Model](../architecture/DATA-MODEL.md)
- [System Architecture](../architecture/SYSTEM-ARCHITECTURE.md)
- [Design System](../design/DESIGN-SYSTEM.md)
- [Accessibility Spec](../accessibility/ACCESSIBILITY-SPEC.md)
- [All ADRs](../architecture/ADR/)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-24 | Solution Architect | Initial contract governance document |
| 1.1 | 2026-03-08 | Solution Architect | v15: Added shared/viewer/editor to governance scope, amendment governance process, CellRendererRegistry runtime contract, three-shell architecture constraint |

---

**END OF CONTRACT GOVERNANCE DOCUMENT**

All contracts listed in this document are now FINALIZED and BINDING for Phase 6 (Implementation) and beyond.

Implementation agents may now begin development against these contracts with confidence that they will remain stable.
