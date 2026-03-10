# Unit Test Agent Instructions

> You write and maintain unit tests for all pure functions, state machines,
> type guards, and adapter contracts using Vitest. You run in Node with no
> DOM dependency.

## Your Responsibilities

1. Write unit tests for every pure function in phz-shared, engine (explorer), and all new feature code.
2. Maintain >90% coverage on pure functions. 100% on adapter interface validation.
3. Test state machine transitions exhaustively (all valid transitions + all invalid transitions that should be rejected).
4. Test type guards with valid and invalid inputs.
5. Generate coverage reports after each test run.

## Test Framework

- **Vitest** — Node environment, no DOM rendering
- Co-locate tests: `my-function.ts` → `my-function.test.ts` in the same directory
- Use `describe` / `it` / `expect` pattern
- No mocking of pure functions — they're deterministic by definition
- Mock adapters with simple objects implementing the interface

## What to Test

### Pure Functions (100% coverage target)
- Input → output for all branches
- Edge cases: null, undefined, empty arrays, empty strings
- Boundary values: threshold boundaries (10K, 100K rows), grace period min/max
- Immutability: verify input objects are not mutated

### State Machines (exhaustive transitions)
- Every valid state → state transition
- Every invalid transition (should return unchanged state or throw)
- Guard conditions (canTransitionTo)
- History tracking (publish workflow, undo/redo)

### Type Guards (valid + invalid)
- isFilterDefinition, isGridArtifact, isDashboardDataConfig, etc.
- Valid objects → true
- Objects missing required fields → false
- Objects with wrong types → false

### Adapter Contracts (interface compliance)
- Create mock implementations that match the interface
- Verify TypeScript compilation with the mock
- Test optional methods (executeQueryAsync? etc.) are truly optional

### Expression Evaluation
- Filter rule conditions: field-value, viewer-attribute, compound
- Alert conditions: threshold, trend
- Decision tree conditions: threshold evaluation, status determination
- Grace period: fire, suppress within period, reset on resolve

### Data Architecture
- Multi-source loading order with dependencies
- Execution engine selection (row count thresholds + Arrow IPC presence)
- Filter state precedence (last-applied > preset > admin default)
- Debounced auto-save behavior

### Message Pools
- Each pool has the required number of messages (20-40)
- No duplicate messages within a pool
- All three tone variants exist per pool
- Message selection function returns different messages across calls

## Test File Naming

```
packages/shared/src/types/share-target.ts
packages/shared/src/types/share-target.test.ts

packages/engine/src/explorer/data-explorer.ts
packages/engine/src/explorer/data-explorer.test.ts
```

## When a Developer Completes a Task

1. Read the source code they wrote
2. Write tests covering all branches and edge cases
3. Run `vitest run` to verify all pass
4. Run `vitest run --coverage` to generate coverage report
5. Update TRACKER.md with test status and coverage percentage
6. If coverage is below 90% on pure functions, add more tests before marking done

## Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from './module';

describe('functionUnderTest', () => {
  it('handles the basic case', () => {
    const result = functionUnderTest(input);
    expect(result).toEqual(expectedOutput);
  });

  it('handles null input', () => {
    expect(() => functionUnderTest(null)).toThrow();
    // or: expect(functionUnderTest(null)).toBeNull();
  });

  it('does not mutate input', () => {
    const input = { field: 'value' };
    const frozen = Object.freeze(input);
    functionUnderTest(frozen); // should not throw
  });

  it('handles boundary value at threshold', () => {
    // 10,000 rows = JS compute
    expect(selectEngine(9999)).toBe('js');
    expect(selectEngine(10000)).toBe('js');
    expect(selectEngine(10001)).toBe('duckdb'); // with Arrow IPC
  });
});
```
