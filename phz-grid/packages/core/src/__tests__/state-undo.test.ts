import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager, createInitialState } from '../state.js';

describe('StateManager undo with labels', () => {
  let sm: StateManager;

  beforeEach(() => {
    const columns = [
      { field: 'name', type: 'string' as const },
      { field: 'value', type: 'number' as const },
    ];
    sm = new StateManager(createInitialState(columns));
  });

  it('should push undo with label', () => {
    sm.pushUndo('Sort by name');
    sm.setState({
      sort: { columns: [{ field: 'name', direction: 'asc' }] },
    });
    expect(sm.getState().history.lastActionLabel).toBe('Sort by name');
  });

  it('should track labels through undo/redo', () => {
    sm.pushUndo('Action 1');
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });

    sm.pushUndo('Action 2');
    sm.setState({ sort: { columns: [{ field: 'value', direction: 'desc' }] } });

    expect(sm.getState().history.lastActionLabel).toBe('Action 2');

    sm.undo();
    expect(sm.getState().history.lastActionLabel).toBe('Action 1');

    sm.undo();
    expect(sm.getState().history.lastActionLabel).toBeUndefined();

    sm.redo();
    expect(sm.getState().history.lastActionLabel).toBe('Action 1');
  });

  it('should performAction with automatic undo snapshot', () => {
    sm.performAction('Filter by A', () => {
      sm.setState({
        filter: { filters: [{ field: 'name', operator: 'equals', value: 'A' }], presets: {} },
      });
    });

    expect(sm.getState().history.canUndo).toBe(true);
    expect(sm.getState().history.lastActionLabel).toBe('Filter by A');

    sm.undo();
    expect(sm.getState().filter.filters).toEqual([]);
  });

  it('should clear redo stack on new action', () => {
    sm.pushUndo('Action 1');
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });

    sm.undo();
    expect(sm.getState().history.canRedo).toBe(true);

    sm.pushUndo('Action 2');
    expect(sm.getState().history.canRedo).toBe(false);
  });

  it('should support getLastActionLabel', () => {
    expect(sm.getLastActionLabel()).toBeUndefined();
    sm.pushUndo('Test');
    expect(sm.getLastActionLabel()).toBe('Test');
  });

  it('should maintain label stack within UNDO_MAX limit', () => {
    for (let i = 0; i < 55; i++) {
      sm.pushUndo(`Action ${i}`);
      sm.setState({ sort: { columns: [{ field: 'name', direction: i % 2 === 0 ? 'asc' : 'desc' }] } });
    }
    // Stack should be capped at 50
    expect(sm.getState().history.undoStack).toBe(50);
    expect(sm.getState().history.lastActionLabel).toBe('Action 54');
  });

  it('should restore label on redo after undo', () => {
    sm.pushUndo('Sort ascending');
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });

    sm.pushUndo('Sort descending');
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'desc' }] } });

    sm.undo();
    sm.undo();
    expect(sm.getState().history.lastActionLabel).toBeUndefined();

    sm.redo();
    expect(sm.getState().history.lastActionLabel).toBe('Sort ascending');

    sm.redo();
    expect(sm.getState().history.lastActionLabel).toBe('Sort descending');
  });

  it('should push undo without label (backward compat)', () => {
    sm.pushUndo();
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    expect(sm.getState().history.lastActionLabel).toBeUndefined();
    expect(sm.getState().history.canUndo).toBe(true);

    sm.undo();
    expect(sm.getState().sort.columns).toEqual([]);
  });

  it('should handle performAction followed by additional state changes', () => {
    sm.performAction('Complex action', () => {
      sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
      sm.setState({
        filter: { filters: [{ field: 'value', operator: 'greaterThan', value: 10 }], presets: {} },
      });
    });

    expect(sm.getState().history.lastActionLabel).toBe('Complex action');
    expect(sm.getState().sort.columns).toHaveLength(1);
    expect(sm.getState().filter.filters).toHaveLength(1);

    sm.undo();
    expect(sm.getState().sort.columns).toEqual([]);
    expect(sm.getState().filter.filters).toEqual([]);
  });
});
