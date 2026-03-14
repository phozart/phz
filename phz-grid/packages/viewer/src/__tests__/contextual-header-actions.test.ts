/**
 * Tests for contextual header actions — UX-007
 *
 * Headless state for computing context-aware column header actions
 * based on column type and current report state.
 */
import { describe, it, expect } from 'vitest';
import {
  createReportViewState,
  setHoveredColumn,
  computeHeaderActions,
} from '../screens/report-state.js';
import type {
  ColumnHeaderAction,
  HeaderActionType,
} from '../screens/report-state.js';

// ── Helpers ──────────────────────────────────────────────────────────

/** Get a single action by type from the action list. */
function findAction(actions: ColumnHeaderAction[], type: HeaderActionType): ColumnHeaderAction | undefined {
  return actions.find(a => a.type === type);
}

/** Get all action types from the action list. */
function actionTypes(actions: ColumnHeaderAction[]): HeaderActionType[] {
  return actions.map(a => a.type);
}

// ── Test Suite ───────────────────────────────────────────────────────

describe('contextual-header-actions', () => {
  // ── computeHeaderActions — universal actions ─────────────────────

  describe('computeHeaderActions — universal actions', () => {
    it('returns sort-asc and sort-desc for any column type', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');
      expect(actionTypes(actions)).toContain('sort-asc');
      expect(actionTypes(actions)).toContain('sort-desc');
    });

    it('returns sort-asc and sort-desc for number columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'amount', 'number');
      expect(actionTypes(actions)).toContain('sort-asc');
      expect(actionTypes(actions)).toContain('sort-desc');
    });

    it('returns sort-asc and sort-desc for date columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'created', 'date');
      expect(actionTypes(actions)).toContain('sort-asc');
      expect(actionTypes(actions)).toContain('sort-desc');
    });

    it('returns filter action for any column type', () => {
      const state = createReportViewState();
      const stringActions = computeHeaderActions(state, 'name', 'string');
      const numberActions = computeHeaderActions(state, 'amount', 'number');
      const dateActions = computeHeaderActions(state, 'created', 'date');

      expect(actionTypes(stringActions)).toContain('filter');
      expect(actionTypes(numberActions)).toContain('filter');
      expect(actionTypes(dateActions)).toContain('filter');
    });

    it('returns hide action for any column type', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');
      const hide = findAction(actions, 'hide');

      expect(hide).toBeDefined();
      expect(hide!.enabled).toBe(true);
      expect(hide!.active).toBe(false);
    });

    it('returns pin-left and pin-right actions for any column type', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');

      expect(actionTypes(actions)).toContain('pin-left');
      expect(actionTypes(actions)).toContain('pin-right');

      const pinLeft = findAction(actions, 'pin-left');
      const pinRight = findAction(actions, 'pin-right');
      expect(pinLeft!.enabled).toBe(true);
      expect(pinRight!.enabled).toBe(true);
    });
  });

  // ── computeHeaderActions — type-specific actions ─────────────────

  describe('computeHeaderActions — type-specific actions', () => {
    it('returns group action for string columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'region', 'string');
      expect(actionTypes(actions)).toContain('group');
    });

    it('returns group action for date columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'created', 'date');
      expect(actionTypes(actions)).toContain('group');
    });

    it('does NOT return group for number columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'amount', 'number');
      expect(actionTypes(actions)).not.toContain('group');
    });

    it('returns aggregate for number columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'amount', 'number');
      expect(actionTypes(actions)).toContain('aggregate');
    });

    it('does NOT return aggregate for string columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');
      expect(actionTypes(actions)).not.toContain('aggregate');
    });

    it('does NOT return aggregate for date columns', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'created', 'date');
      expect(actionTypes(actions)).not.toContain('aggregate');
    });
  });

  // ── computeHeaderActions — sort active state ─────────────────────

  describe('computeHeaderActions — sort active state', () => {
    it('sort-asc has active=true when column is sorted asc', () => {
      const state = createReportViewState({
        sortColumns: [{ field: 'name', direction: 'asc' }],
      });
      const actions = computeHeaderActions(state, 'name', 'string');
      const sortAsc = findAction(actions, 'sort-asc');

      expect(sortAsc!.active).toBe(true);
    });

    it('sort-desc has active=true when column is sorted desc', () => {
      const state = createReportViewState({
        sortColumns: [{ field: 'name', direction: 'desc' }],
      });
      const actions = computeHeaderActions(state, 'name', 'string');
      const sortDesc = findAction(actions, 'sort-desc');

      expect(sortDesc!.active).toBe(true);
    });

    it('sort-asc has active=false when column is sorted desc', () => {
      const state = createReportViewState({
        sortColumns: [{ field: 'name', direction: 'desc' }],
      });
      const actions = computeHeaderActions(state, 'name', 'string');
      const sortAsc = findAction(actions, 'sort-asc');

      expect(sortAsc!.active).toBe(false);
    });

    it('sort-desc has active=false when column is sorted asc', () => {
      const state = createReportViewState({
        sortColumns: [{ field: 'name', direction: 'asc' }],
      });
      const actions = computeHeaderActions(state, 'name', 'string');
      const sortDesc = findAction(actions, 'sort-desc');

      expect(sortDesc!.active).toBe(false);
    });

    it('sort actions have active=false when a different column is sorted', () => {
      const state = createReportViewState({
        sortColumns: [{ field: 'amount', direction: 'asc' }],
      });
      const actions = computeHeaderActions(state, 'name', 'string');
      const sortAsc = findAction(actions, 'sort-asc');
      const sortDesc = findAction(actions, 'sort-desc');

      expect(sortAsc!.active).toBe(false);
      expect(sortDesc!.active).toBe(false);
    });
  });

  // ── computeHeaderActions — clear-sort ────────────────────────────

  describe('computeHeaderActions — clear-sort', () => {
    it('clear-sort is present and enabled when column has active sort', () => {
      const state = createReportViewState({
        sortColumns: [{ field: 'name', direction: 'asc' }],
      });
      const actions = computeHeaderActions(state, 'name', 'string');
      const clearSort = findAction(actions, 'clear-sort');

      expect(clearSort).toBeDefined();
      expect(clearSort!.enabled).toBe(true);
    });

    it('clear-sort is disabled when column is not sorted', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');
      const clearSort = findAction(actions, 'clear-sort');

      expect(clearSort).toBeDefined();
      expect(clearSort!.enabled).toBe(false);
    });
  });

  // ── computeHeaderActions — action labels and icons ───────────────

  describe('computeHeaderActions — labels and icons', () => {
    it('all actions have non-empty labels', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');

      for (const action of actions) {
        expect(action.label).toBeTruthy();
        expect(typeof action.label).toBe('string');
      }
    });

    it('all actions have non-empty icon identifiers', () => {
      const state = createReportViewState();
      const actions = computeHeaderActions(state, 'name', 'string');

      for (const action of actions) {
        expect(action.icon).toBeTruthy();
        expect(typeof action.icon).toBe('string');
      }
    });
  });

  // ── setHoveredColumn ─────────────────────────────────────────────

  describe('setHoveredColumn', () => {
    it('sets the hovered column field', () => {
      const state = createReportViewState();
      const next = setHoveredColumn(state, 'name');

      expect(next.hoveredColumn).toBe('name');
    });

    it('clears the hovered column when passed null', () => {
      const state = createReportViewState({ hoveredColumn: 'name' });
      const next = setHoveredColumn(state, null);

      expect(next.hoveredColumn).toBeNull();
    });

    it('returns a new state object (immutable)', () => {
      const state = createReportViewState();
      const next = setHoveredColumn(state, 'name');

      expect(next).not.toBe(state);
    });

    it('preserves other state fields', () => {
      const state = createReportViewState({
        reportId: 'rpt-1',
        title: 'Test Report',
        page: 3,
      });
      const next = setHoveredColumn(state, 'amount');

      expect(next.reportId).toBe('rpt-1');
      expect(next.title).toBe('Test Report');
      expect(next.page).toBe(3);
    });
  });

  // ── createReportViewState — hoveredColumn default ────────────────

  describe('createReportViewState — hoveredColumn', () => {
    it('initializes hoveredColumn to null by default', () => {
      const state = createReportViewState();
      expect(state.hoveredColumn).toBeNull();
    });
  });
});
