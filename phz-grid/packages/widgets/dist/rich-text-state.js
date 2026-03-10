/**
 * @phozart/phz-widgets — Rich Text State
 *
 * Headless state machine for rich text widget display.
 * Manages content, format detection, and truncation logic.
 */
/**
 * Create initial rich text state.
 *
 * @param content - The text content
 * @param format - The content format (defaults to 'plain')
 */
export function createRichTextState(content, format = 'plain') {
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
export function shouldTruncate(state, containerHeight, lineHeight = 20) {
    if (containerHeight <= 0)
        return false;
    const estimatedLines = state.content.split('\n').length;
    const estimatedHeight = estimatedLines * lineHeight;
    return estimatedHeight > containerHeight;
}
/**
 * Update the content of the rich text state.
 */
export function updateContent(state, content, format) {
    return {
        ...state,
        content,
        format: format ?? state.format,
    };
}
/**
 * Set the max height constraint and recompute truncation.
 */
export function setMaxHeight(state, maxHeight, lineHeight = 20) {
    const truncated = maxHeight !== undefined
        ? shouldTruncate(state, maxHeight, lineHeight)
        : false;
    return { ...state, maxHeight, truncated };
}
/**
 * Count the number of lines in the content.
 */
export function getLineCount(state) {
    return state.content.split('\n').length;
}
/**
 * Get a preview (first N characters) of the content.
 */
export function getPreview(state, maxChars = 200) {
    if (state.content.length <= maxChars)
        return state.content;
    return state.content.slice(0, maxChars) + '...';
}
//# sourceMappingURL=rich-text-state.js.map