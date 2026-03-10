/**
 * @phozart/phz-widgets — Rich Text State
 *
 * Headless state machine for rich text widget display.
 * Manages content, format detection, and truncation logic.
 */

/** Supported rich text formats. */
export type RichTextFormat = 'markdown' | 'html' | 'plain';

/** Immutable state for a rich text widget. */
export interface RichTextState {
  content: string;
  format: RichTextFormat;
  maxHeight?: number;
  truncated: boolean;
}

/**
 * Create initial rich text state.
 *
 * @param content - The text content
 * @param format - The content format (defaults to 'plain')
 */
export function createRichTextState(
  content: string,
  format: RichTextFormat = 'plain',
): RichTextState {
  return {
    content,
    format,
    maxHeight: undefined,
    truncated: false,
  };
}

/**
 * Determine whether content should be truncated based on container height.
 * Uses a simple heuristic: estimated line count times line height vs available space.
 *
 * @param state - Current rich text state
 * @param containerHeight - Available height in pixels
 * @param lineHeight - Approximate line height in pixels (default 20)
 * @returns true if the content would overflow the container
 */
export function shouldTruncate(
  state: RichTextState,
  containerHeight: number,
  lineHeight: number = 20,
): boolean {
  if (containerHeight <= 0) return false;
  const estimatedLines = state.content.split('\n').length;
  const estimatedHeight = estimatedLines * lineHeight;
  return estimatedHeight > containerHeight;
}

/**
 * Update the content of the rich text state.
 */
export function updateContent(
  state: RichTextState,
  content: string,
  format?: RichTextFormat,
): RichTextState {
  return {
    ...state,
    content,
    format: format ?? state.format,
  };
}

/**
 * Set the max height constraint and recompute truncation.
 */
export function setMaxHeight(
  state: RichTextState,
  maxHeight: number | undefined,
  lineHeight: number = 20,
): RichTextState {
  const truncated = maxHeight !== undefined
    ? shouldTruncate(state, maxHeight, lineHeight)
    : false;
  return { ...state, maxHeight, truncated };
}

/**
 * Count the number of lines in the content.
 */
export function getLineCount(state: RichTextState): number {
  return state.content.split('\n').length;
}

/**
 * Get a preview (first N characters) of the content.
 */
export function getPreview(state: RichTextState, maxChars: number = 200): string {
  if (state.content.length <= maxChars) return state.content;
  return state.content.slice(0, maxChars) + '...';
}
