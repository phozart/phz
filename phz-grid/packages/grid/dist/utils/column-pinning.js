const DEFAULT_COL_WIDTH = 150;
export function splitPinnedColumns(columns, pinOverrides) {
    const visible = columns.filter(c => !c.hidden);
    const left = [];
    const scrollable = [];
    const right = [];
    for (const col of visible) {
        const override = pinOverrides?.[col.field];
        const effectiveFrozen = override !== undefined ? override : (col.frozen ?? null);
        if (effectiveFrozen === 'left')
            left.push(col);
        else if (effectiveFrozen === 'right')
            right.push(col);
        else
            scrollable.push(col);
    }
    return { left, scrollable, right, hasPinned: left.length > 0 || right.length > 0 };
}
export function computePinnedOffsets(columns, side) {
    if (columns.length === 0)
        return [];
    if (side === 'left') {
        const offsets = [];
        let cumulative = 0;
        for (const col of columns) {
            offsets.push(cumulative);
            cumulative += col.width ?? DEFAULT_COL_WIDTH;
        }
        return offsets;
    }
    // Right: offsets go from right edge
    const offsets = new Array(columns.length);
    let cumulative = 0;
    for (let i = columns.length - 1; i >= 0; i--) {
        offsets[i] = cumulative;
        cumulative += columns[i].width ?? DEFAULT_COL_WIDTH;
    }
    return offsets;
}
export function getPinnedStyle(col, offset, side) {
    return `position:sticky;${side}:${offset}px;z-index:2;`;
}
//# sourceMappingURL=column-pinning.js.map