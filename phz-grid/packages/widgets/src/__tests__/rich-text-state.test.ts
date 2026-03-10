/**
 * @phozart/phz-widgets — Rich Text State Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createRichTextState,
  shouldTruncate,
  updateContent,
  setMaxHeight,
  getLineCount,
  getPreview,
} from '../rich-text-state.js';

describe('createRichTextState', () => {
  it('creates state with plain format by default', () => {
    const state = createRichTextState('Hello world');
    expect(state.content).toBe('Hello world');
    expect(state.format).toBe('plain');
    expect(state.truncated).toBe(false);
    expect(state.maxHeight).toBeUndefined();
  });

  it('creates state with specified format', () => {
    const state = createRichTextState('<p>Hello</p>', 'html');
    expect(state.format).toBe('html');
  });

  it('creates state with markdown format', () => {
    const state = createRichTextState('# Title', 'markdown');
    expect(state.format).toBe('markdown');
  });
});

describe('shouldTruncate', () => {
  it('returns true when content exceeds container height', () => {
    const state = createRichTextState('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    // 5 lines * 20px = 100px > 60px container
    expect(shouldTruncate(state, 60)).toBe(true);
  });

  it('returns false when content fits in container', () => {
    const state = createRichTextState('Short');
    // 1 line * 20px = 20px < 100px container
    expect(shouldTruncate(state, 100)).toBe(false);
  });

  it('returns false when container height is zero', () => {
    const state = createRichTextState('Any content');
    expect(shouldTruncate(state, 0)).toBe(false);
  });

  it('returns false when container height is negative', () => {
    const state = createRichTextState('Any content');
    expect(shouldTruncate(state, -10)).toBe(false);
  });

  it('uses custom line height', () => {
    const state = createRichTextState('Line 1\nLine 2');
    // 2 lines * 50px = 100px > 80px
    expect(shouldTruncate(state, 80, 50)).toBe(true);
    // 2 lines * 30px = 60px < 80px
    expect(shouldTruncate(state, 80, 30)).toBe(false);
  });
});

describe('updateContent', () => {
  it('updates content preserving format', () => {
    const state = createRichTextState('Original', 'html');
    const updated = updateContent(state, 'Updated');
    expect(updated.content).toBe('Updated');
    expect(updated.format).toBe('html');
  });

  it('updates both content and format', () => {
    const state = createRichTextState('Original', 'plain');
    const updated = updateContent(state, '# New', 'markdown');
    expect(updated.content).toBe('# New');
    expect(updated.format).toBe('markdown');
  });
});

describe('setMaxHeight', () => {
  it('sets max height and computes truncation', () => {
    const state = createRichTextState('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    const updated = setMaxHeight(state, 60);
    expect(updated.maxHeight).toBe(60);
    // 5 lines * 20px = 100px > 60px
    expect(updated.truncated).toBe(true);
  });

  it('clears truncation when maxHeight is undefined', () => {
    const state = createRichTextState('Line 1\nLine 2\nLine 3');
    const withMax = setMaxHeight(state, 20);
    expect(withMax.truncated).toBe(true);
    const cleared = setMaxHeight(withMax, undefined);
    expect(cleared.truncated).toBe(false);
    expect(cleared.maxHeight).toBeUndefined();
  });
});

describe('getLineCount', () => {
  it('returns 1 for single-line content', () => {
    const state = createRichTextState('Hello');
    expect(getLineCount(state)).toBe(1);
  });

  it('counts newlines correctly', () => {
    const state = createRichTextState('A\nB\nC');
    expect(getLineCount(state)).toBe(3);
  });

  it('returns 1 for empty string', () => {
    const state = createRichTextState('');
    expect(getLineCount(state)).toBe(1);
  });
});

describe('getPreview', () => {
  it('returns full content when under limit', () => {
    const state = createRichTextState('Short');
    expect(getPreview(state)).toBe('Short');
  });

  it('truncates and adds ellipsis when over limit', () => {
    const content = 'A'.repeat(300);
    const state = createRichTextState(content);
    const preview = getPreview(state, 200);
    expect(preview).toHaveLength(203); // 200 + '...'
    expect(preview.endsWith('...')).toBe(true);
  });

  it('uses default max of 200 characters', () => {
    const content = 'B'.repeat(250);
    const state = createRichTextState(content);
    const preview = getPreview(state);
    expect(preview).toHaveLength(203);
  });

  it('returns content exactly at the limit without ellipsis', () => {
    const content = 'C'.repeat(200);
    const state = createRichTextState(content);
    const preview = getPreview(state, 200);
    expect(preview).toBe(content); // exactly 200 chars, no truncation
    expect(preview).not.toContain('...');
  });

  it('returns empty string for empty content', () => {
    const state = createRichTextState('');
    expect(getPreview(state)).toBe('');
  });
});

// ========================================================================
// Additional edge-case coverage for Wave 2
// ========================================================================

describe('createRichTextState — additional', () => {
  it('creates state with empty content', () => {
    const state = createRichTextState('');
    expect(state.content).toBe('');
    expect(state.truncated).toBe(false);
  });

  it('handles multiline content', () => {
    const state = createRichTextState('a\nb\nc\nd');
    expect(state.content).toBe('a\nb\nc\nd');
  });
});

describe('updateContent — additional', () => {
  it('returns a new state (immutable)', () => {
    const state = createRichTextState('old');
    const next = updateContent(state, 'new');
    expect(next).not.toBe(state);
  });

  it('preserves maxHeight and truncated', () => {
    let state = createRichTextState('a\nb\nc\nd\ne');
    state = setMaxHeight(state, 60);
    const updated = updateContent(state, 'short');
    expect(updated.maxHeight).toBe(60);
    // truncated is NOT recomputed by updateContent, stays from before
    expect(updated.truncated).toBe(true);
  });
});

describe('setMaxHeight — additional', () => {
  it('uses custom line height', () => {
    const state = createRichTextState('a\nb'); // 2 lines
    // 2 lines * 50px = 100px > 80px
    const updated = setMaxHeight(state, 80, 50);
    expect(updated.truncated).toBe(true);
  });

  it('not truncated with large enough container', () => {
    const state = createRichTextState('a\nb'); // 2 lines
    // 2 lines * 20px = 40px < 200px
    const updated = setMaxHeight(state, 200);
    expect(updated.truncated).toBe(false);
  });
});

describe('shouldTruncate — boundary conditions', () => {
  it('exact fit does not truncate', () => {
    const state = createRichTextState('Line 1\nLine 2'); // 2 lines
    // 2 * 20 = 40, container = 40 => not > 40
    expect(shouldTruncate(state, 40)).toBe(false);
  });

  it('one pixel less than fit does truncate', () => {
    const state = createRichTextState('Line 1\nLine 2'); // 2 lines
    // 2 * 20 = 40 > 39
    expect(shouldTruncate(state, 39)).toBe(true);
  });
});
