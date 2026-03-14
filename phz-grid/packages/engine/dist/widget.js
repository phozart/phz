/**
 * @phozart/engine — Widget Configuration Types
 *
 * 10 widget types for dashboards: KPI cards, scorecards, charts, tables, and more.
 */
// --- Validation ---
export function validateWidget(widget) {
    const errors = [];
    if (!widget.id)
        errors.push({ path: 'id', message: 'Widget ID is required' });
    if (!widget.type)
        errors.push({ path: 'type', message: 'Widget type is required' });
    if (!widget.position)
        errors.push({ path: 'position', message: 'Position is required' });
    if (!widget.size)
        errors.push({ path: 'size', message: 'Size is required' });
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=widget.js.map