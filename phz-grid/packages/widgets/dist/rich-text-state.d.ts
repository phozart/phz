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
export declare function createRichTextState(content: string, format?: RichTextFormat): RichTextState;
/**
 * Determine whether content should be truncated based on container height.
 * Uses a simple heuristic: estimated line count times line height vs available space.
 *
 * @param state - Current rich text state
 * @param containerHeight - Available height in pixels
 * @param lineHeight - Approximate line height in pixels (default 20)
 * @returns true if the content would overflow the container
 */
export declare function shouldTruncate(state: RichTextState, containerHeight: number, lineHeight?: number): boolean;
/**
 * Update the content of the rich text state.
 */
export declare function updateContent(state: RichTextState, content: string, format?: RichTextFormat): RichTextState;
/**
 * Set the max height constraint and recompute truncation.
 */
export declare function setMaxHeight(state: RichTextState, maxHeight: number | undefined, lineHeight?: number): RichTextState;
/**
 * Count the number of lines in the content.
 */
export declare function getLineCount(state: RichTextState): number;
/**
 * Get a preview (first N characters) of the content.
 */
export declare function getPreview(state: RichTextState, maxChars?: number): string;
//# sourceMappingURL=rich-text-state.d.ts.map