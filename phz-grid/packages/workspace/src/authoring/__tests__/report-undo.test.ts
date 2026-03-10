import { describe, it, expect } from 'vitest';
import { createReportUndoManager } from '../report-undo.js';
import {
  initialReportEditorState,
  addColumn,
  removeColumn,
  setDensity,
} from '../report-editor-state.js';

describe('ReportUndoManager', () => {
  function makeInitial() {
    return initialReportEditorState('Test', 'ds-1');
  }

  describe('initial state', () => {
    it('canUndo is false after creation', () => {
      const undo = createReportUndoManager(makeInitial());
      expect(undo.canUndo).toBe(false);
    });

    it('canRedo is false after creation', () => {
      const undo = createReportUndoManager(makeInitial());
      expect(undo.canRedo).toBe(false);
    });

    it('history is empty after creation', () => {
      const undo = createReportUndoManager(makeInitial());
      expect(undo.history).toEqual([]);
    });
  });

  describe('execute', () => {
    it('sets canUndo to true after one execute', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      const s1 = addColumn(initial, 'name');
      undo.execute(s1, 'Add column: name');
      expect(undo.canUndo).toBe(true);
    });

    it('adds an entry to history', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      const s1 = addColumn(initial, 'name');
      undo.execute(s1, 'Add column: name');
      expect(undo.history).toHaveLength(1);
      expect(undo.history[0].label).toBe('Add column: name');
    });

    it('history entries have timestamps', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      const before = Date.now();
      undo.execute(addColumn(initial, 'x'), 'test');
      const after = Date.now();
      expect(undo.history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(undo.history[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('undo', () => {
    it('returns the previous state', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      const s1 = addColumn(initial, 'name', 'Name');
      undo.execute(s1, 'Add column');
      const undone = undo.undo();
      expect(undone).toEqual(initial);
    });

    it('returns null when nothing to undo', () => {
      const undo = createReportUndoManager(makeInitial());
      expect(undo.undo()).toBeNull();
    });

    it('sets canRedo to true after undo', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      undo.execute(addColumn(initial, 'name'), 'Add column');
      undo.undo();
      expect(undo.canRedo).toBe(true);
    });

    it('sets canUndo to false after undoing single action', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      undo.execute(addColumn(initial, 'name'), 'Add column');
      undo.undo();
      expect(undo.canUndo).toBe(false);
    });

    it('supports multiple undos', () => {
      const s0 = makeInitial();
      const undo = createReportUndoManager(s0);
      const s1 = addColumn(s0, 'name');
      const s2 = addColumn(s1, 'revenue');
      undo.execute(s1, 'Add name');
      undo.execute(s2, 'Add revenue');
      expect(undo.undo()).toEqual(s1);
      expect(undo.undo()).toEqual(s0);
    });
  });

  describe('redo', () => {
    it('returns the next state after undo', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      const s1 = addColumn(initial, 'name', 'Name');
      undo.execute(s1, 'Add column');
      undo.undo();
      const redone = undo.redo();
      expect(redone).toEqual(s1);
    });

    it('returns null when nothing to redo', () => {
      const undo = createReportUndoManager(makeInitial());
      expect(undo.redo()).toBeNull();
    });

    it('canRedo becomes false after new execute invalidates redo stack', () => {
      const initial = makeInitial();
      const undo = createReportUndoManager(initial);
      const s1 = addColumn(initial, 'name');
      undo.execute(s1, 'Add name');
      undo.undo();
      expect(undo.canRedo).toBe(true);

      // New action should truncate redo stack
      const s2 = addColumn(initial, 'revenue');
      undo.execute(s2, 'Add revenue');
      expect(undo.canRedo).toBe(false);
    });

    it('supports undo then redo round-trip', () => {
      const s0 = makeInitial();
      const undo = createReportUndoManager(s0);
      const s1 = addColumn(s0, 'a');
      const s2 = addColumn(s1, 'b');
      const s3 = addColumn(s2, 'c');
      undo.execute(s1, 'step 1');
      undo.execute(s2, 'step 2');
      undo.execute(s3, 'step 3');

      // Undo twice
      undo.undo(); // back to s2
      undo.undo(); // back to s1
      expect(undo.canUndo).toBe(true);  // can still undo to s0
      expect(undo.canRedo).toBe(true);

      // Redo twice
      expect(undo.redo()).toEqual(s2);
      expect(undo.redo()).toEqual(s3);
      expect(undo.canRedo).toBe(false);
    });
  });

  describe('history', () => {
    it('accumulates labeled entries across multiple executions', () => {
      const s0 = makeInitial();
      const undo = createReportUndoManager(s0);
      undo.execute(addColumn(s0, 'a'), 'Add A');
      undo.execute(addColumn(addColumn(s0, 'a'), 'b'), 'Add B');
      undo.execute(setDensity(s0, 'compact'), 'Change density');
      expect(undo.history).toHaveLength(3);
      expect(undo.history.map(h => h.label)).toEqual(['Add A', 'Add B', 'Change density']);
    });

    it('returns a copy of the history array', () => {
      const undo = createReportUndoManager(makeInitial());
      undo.execute(addColumn(makeInitial(), 'x'), 'test');
      const h1 = undo.history;
      const h2 = undo.history;
      expect(h1).not.toBe(h2);
      expect(h1).toEqual(h2);
    });
  });

  describe('maxHistory option', () => {
    it('passes maxHistory through to underlying UndoManager', () => {
      const s0 = makeInitial();
      const undo = createReportUndoManager(s0, { maxHistory: 3 });

      // Push 3 states (plus initial = 4 total, but maxHistory is 3)
      let current = s0;
      for (let i = 0; i < 4; i++) {
        current = addColumn(current, `col-${i}`);
        undo.execute(current, `Add col-${i}`);
      }

      // Can only undo maxHistory - 1 times (3 - 1 = 2 undos)
      let undoCount = 0;
      while (undo.canUndo) {
        undo.undo();
        undoCount++;
      }
      expect(undoCount).toBe(2);
    });
  });
});
