import { describe, it, expect, beforeEach } from 'vitest';
import { initialDashboardEditorState, addWidget, removeWidget, moveWidget, resizeWidget, morphWidget, getMorphGroup, getMorphOptions, canMorph, updateWidgetConfig, updateWidgetData, selectWidget, deselectWidget, duplicateWidget, switchCanvasMode, migrateToFreeform, migrateToAutoGrid, _resetWidgetCounter, } from '../dashboard-editor-state.js';
describe('DashboardEditorState', () => {
    beforeEach(() => {
        _resetWidgetCounter();
    });
    describe('initialDashboardEditorState', () => {
        it('sets name and dataSourceId', () => {
            const s = initialDashboardEditorState('My Dashboard', 'ds-1');
            expect(s.name).toBe('My Dashboard');
            expect(s.dataSourceId).toBe('ds-1');
        });
        it('starts with empty widgets', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.widgets).toEqual([]);
        });
        it('starts with freeform layout', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.layout.kind).toBe('freeform');
        });
        it('starts with default filter bar config', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.filters.position).toBe('top');
            expect(s.filters.collapsible).toBe(true);
            expect(s.filters.filters).toEqual([]);
            expect(s.filters.dependencies).toEqual([]);
        });
        it('starts with configPanelTab "data"', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.configPanelTab).toBe('data');
        });
        it('starts with showFieldPalette true', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.showFieldPalette).toBe(true);
        });
        it('starts with showConfigPanel false', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.showConfigPanel).toBe(false);
        });
        it('starts with canvasZoom 1', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.canvasZoom).toBe(1);
        });
        it('starts with gridSnap true', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.gridSnap).toBe(true);
        });
        it('has no selectedWidgetId', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.selectedWidgetId).toBeUndefined();
        });
        it('starts with canvasMode freeform', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.canvasMode).toBe('freeform');
        });
        it('starts with freeformConfig using 48-col defaults', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.freeformConfig).toEqual({
                columns: 48,
                rows: 36,
                cellSizePx: 20,
                gapPx: 4,
                snapToGrid: true,
            });
        });
    });
    describe('getMorphGroup', () => {
        it('returns category-chart for bar-chart', () => {
            expect(getMorphGroup('bar-chart')).toBe('category-chart');
        });
        it('returns category-chart for line-chart', () => {
            expect(getMorphGroup('line-chart')).toBe('category-chart');
        });
        it('returns single-value for kpi-card', () => {
            expect(getMorphGroup('kpi-card')).toBe('single-value');
        });
        it('returns tabular for data-table', () => {
            expect(getMorphGroup('data-table')).toBe('tabular');
        });
        it('returns text for text-block', () => {
            expect(getMorphGroup('text-block')).toBe('text');
        });
        it('returns navigation for drill-link', () => {
            expect(getMorphGroup('drill-link')).toBe('navigation');
        });
        it('defaults to text for unknown types', () => {
            expect(getMorphGroup('unknown-widget')).toBe('text');
        });
    });
    describe('getMorphOptions', () => {
        it('returns other category-chart types for bar-chart', () => {
            const opts = getMorphOptions('bar-chart');
            expect(opts).toContain('line-chart');
            expect(opts).toContain('area-chart');
            expect(opts).toContain('pie-chart');
            expect(opts).not.toContain('bar-chart');
        });
        it('returns other single-value types for kpi-card', () => {
            const opts = getMorphOptions('kpi-card');
            expect(opts).toContain('gauge');
            expect(opts).toContain('kpi-scorecard');
            expect(opts).toContain('trend-line');
            expect(opts).not.toContain('kpi-card');
        });
        it('returns other tabular types for data-table', () => {
            const opts = getMorphOptions('data-table');
            expect(opts).toContain('pivot-table');
            expect(opts).not.toContain('data-table');
        });
        it('returns other text types for text-block', () => {
            const opts = getMorphOptions('text-block');
            expect(opts).toContain('heading');
            expect(opts).not.toContain('text-block');
        });
        it('returns empty array for navigation (only one type)', () => {
            const opts = getMorphOptions('drill-link');
            expect(opts).toEqual([]);
        });
    });
    describe('canMorph', () => {
        it('returns true within same morph group', () => {
            expect(canMorph('bar-chart', 'pie-chart')).toBe(true);
        });
        it('returns false across different morph groups', () => {
            expect(canMorph('bar-chart', 'kpi-card')).toBe(false);
        });
        it('returns false for same type', () => {
            expect(canMorph('bar-chart', 'bar-chart')).toBe(false);
        });
        it('returns true for kpi-card to gauge', () => {
            expect(canMorph('kpi-card', 'gauge')).toBe(true);
        });
        it('returns false for data-table to bar-chart', () => {
            expect(canMorph('data-table', 'bar-chart')).toBe(false);
        });
    });
    describe('addWidget', () => {
        it('creates widget with unique id', () => {
            const s0 = initialDashboardEditorState('d', 'ds');
            const s1 = addWidget(s0, 'bar-chart');
            expect(s1.widgets).toHaveLength(1);
            expect(s1.widgets[0].id).toMatch(/^w_\d+_\d+$/);
        });
        it('assigns correct morph group', () => {
            const s0 = initialDashboardEditorState('d', 'ds');
            const s1 = addWidget(s0, 'kpi-card');
            expect(s1.widgets[0].morphGroup).toBe('single-value');
        });
        it('uses freeform smart placement when no position provided', () => {
            const s0 = initialDashboardEditorState('d', 'ds');
            const s1 = addWidget(s0, 'bar-chart');
            // In freeform mode, findOpenPosition returns {col: 0, row: 0} for first widget
            // Default freeform widget size is 8 cols x 6 rows
            expect(s1.widgets[0].position).toEqual({ row: 0, col: 0, colSpan: 8, rowSpan: 6 });
        });
        it('places second widget in next open position in freeform mode', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            s = addWidget(s, 'kpi-card');
            // Second widget should be placed next to first (col 8, row 0) since first occupies cols 0-7
            expect(s.widgets[1].position.col).toBe(8);
            expect(s.widgets[1].position.row).toBe(0);
        });
        it('uses custom position when provided', () => {
            const s0 = initialDashboardEditorState('d', 'ds');
            const pos = { row: 2, col: 3, colSpan: 4, rowSpan: 1 };
            const s1 = addWidget(s0, 'bar-chart', pos);
            expect(s1.widgets[0].position).toEqual(pos);
        });
        it('starts with empty dataConfig', () => {
            const s0 = initialDashboardEditorState('d', 'ds');
            const s1 = addWidget(s0, 'bar-chart');
            expect(s1.widgets[0].dataConfig).toEqual({
                dimensions: [],
                measures: [],
                filters: [],
            });
        });
        it('generates unique ids for multiple widgets', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            s = addWidget(s, 'line-chart');
            expect(s.widgets[0].id).not.toBe(s.widgets[1].id);
        });
        it('uses auto-grid default position when canvasMode is auto-grid', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = switchCanvasMode(s, 'auto-grid');
            s = addWidget(s, 'bar-chart');
            // In auto-grid mode without position, uses { row: 0, col: widgets.length, colSpan: 2, rowSpan: 2 }
            expect(s.widgets[0].position).toEqual({ row: 0, col: 0, colSpan: 2, rowSpan: 2 });
        });
    });
    describe('removeWidget', () => {
        it('removes widget by id', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const widgetId = s.widgets[0].id;
            s = removeWidget(s, widgetId);
            expect(s.widgets).toHaveLength(0);
        });
        it('returns unchanged state for non-existent id', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const before = s;
            const result = removeWidget(s, 'non-existent');
            expect(result.widgets).toHaveLength(1);
        });
        it('preserves other widgets', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            s = addWidget(s, 'kpi-card');
            const firstId = s.widgets[0].id;
            s = removeWidget(s, firstId);
            expect(s.widgets).toHaveLength(1);
            expect(s.widgets[0].type).toBe('kpi-card');
        });
    });
    describe('moveWidget', () => {
        it('updates position', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            const newPos = { row: 5, col: 3, colSpan: 1, rowSpan: 1 };
            s = moveWidget(s, id, newPos);
            expect(s.widgets[0].position).toEqual(newPos);
        });
        it('does not affect other widgets', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            s = addWidget(s, 'kpi-card');
            const firstId = s.widgets[0].id;
            const secondPos = { ...s.widgets[1].position };
            s = moveWidget(s, firstId, { row: 10, col: 10, colSpan: 3, rowSpan: 3 });
            expect(s.widgets[1].position).toEqual(secondPos);
        });
    });
    describe('resizeWidget', () => {
        it('updates colSpan', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = resizeWidget(s, id, { colSpan: 4 });
            expect(s.widgets[0].position.colSpan).toBe(4);
            // row/col unchanged
            expect(s.widgets[0].position.row).toBe(0);
        });
        it('updates rowSpan', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = resizeWidget(s, id, { rowSpan: 5 });
            expect(s.widgets[0].position.rowSpan).toBe(5);
        });
        it('updates both colSpan and rowSpan', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = resizeWidget(s, id, { colSpan: 6, rowSpan: 3 });
            expect(s.widgets[0].position.colSpan).toBe(6);
            expect(s.widgets[0].position.rowSpan).toBe(3);
        });
    });
    describe('morphWidget', () => {
        it('changes type within same morph group', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = morphWidget(s, id, 'pie-chart');
            expect(s.widgets[0].type).toBe('pie-chart');
            expect(s.widgets[0].morphGroup).toBe('category-chart');
        });
        it('preserves dataConfig after morph', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            const dataConfig = {
                dimensions: [{ field: 'region' }],
                measures: [{ field: 'revenue', aggregation: 'sum' }],
                filters: [{ field: 'year', operator: 'eq', value: 2024 }],
            };
            s = updateWidgetData(s, id, dataConfig);
            s = morphWidget(s, id, 'line-chart');
            expect(s.widgets[0].dataConfig.dimensions).toEqual([{ field: 'region' }]);
            expect(s.widgets[0].dataConfig.measures).toEqual([{ field: 'revenue', aggregation: 'sum' }]);
            expect(s.widgets[0].dataConfig.filters).toEqual([{ field: 'year', operator: 'eq', value: 2024 }]);
        });
        it('returns unchanged state for invalid morph (different group)', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            const before = s;
            s = morphWidget(s, id, 'kpi-card');
            expect(s.widgets[0].type).toBe('bar-chart');
        });
        it('returns unchanged state for same type morph', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = morphWidget(s, id, 'bar-chart');
            expect(s.widgets[0].type).toBe('bar-chart');
        });
        it('returns unchanged state for non-existent widget', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const result = morphWidget(s, 'non-existent', 'pie-chart');
            expect(result).toBe(s);
        });
        it('updates morphGroup on morph', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'kpi-card');
            const id = s.widgets[0].id;
            s = morphWidget(s, id, 'gauge');
            expect(s.widgets[0].morphGroup).toBe('single-value');
        });
    });
    describe('updateWidgetConfig', () => {
        it('merges into config', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = updateWidgetConfig(s, id, { color: 'blue', showLegend: true });
            expect(s.widgets[0].config).toEqual({ color: 'blue', showLegend: true });
        });
        it('preserves existing config keys', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = updateWidgetConfig(s, id, { color: 'blue' });
            s = updateWidgetConfig(s, id, { showLegend: true });
            expect(s.widgets[0].config).toEqual({ color: 'blue', showLegend: true });
        });
        it('overwrites existing config keys', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = updateWidgetConfig(s, id, { color: 'blue' });
            s = updateWidgetConfig(s, id, { color: 'red' });
            expect(s.widgets[0].config.color).toBe('red');
        });
    });
    describe('updateWidgetData', () => {
        it('replaces data config', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            const dataConfig = {
                dimensions: [{ field: 'category' }],
                measures: [{ field: 'amount', aggregation: 'sum' }],
                filters: [],
            };
            s = updateWidgetData(s, id, dataConfig);
            expect(s.widgets[0].dataConfig).toEqual(dataConfig);
        });
    });
    describe('selectWidget / deselectWidget', () => {
        it('selectWidget sets selectedWidgetId and shows config panel', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = selectWidget(s, id);
            expect(s.selectedWidgetId).toBe(id);
            expect(s.showConfigPanel).toBe(true);
        });
        it('deselectWidget clears selectedWidgetId and hides config panel', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = selectWidget(s, id);
            s = deselectWidget(s);
            expect(s.selectedWidgetId).toBeUndefined();
            expect(s.showConfigPanel).toBe(false);
        });
        it('selecting a new widget replaces the previous selection', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            s = addWidget(s, 'kpi-card');
            const id1 = s.widgets[0].id;
            const id2 = s.widgets[1].id;
            s = selectWidget(s, id1);
            s = selectWidget(s, id2);
            expect(s.selectedWidgetId).toBe(id2);
        });
    });
    describe('duplicateWidget', () => {
        it('creates copy with new id', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const originalId = s.widgets[0].id;
            s = duplicateWidget(s, originalId);
            expect(s.widgets).toHaveLength(2);
            expect(s.widgets[1].id).not.toBe(originalId);
            expect(s.widgets[1].id).toMatch(/^w_\d+_\d+$/);
        });
        it('preserves type and morph group', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'kpi-card');
            const id = s.widgets[0].id;
            s = duplicateWidget(s, id);
            expect(s.widgets[1].type).toBe('kpi-card');
            expect(s.widgets[1].morphGroup).toBe('single-value');
        });
        it('offsets position by +2 col and +2 row in freeform mode', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart', { row: 1, col: 2, colSpan: 3, rowSpan: 2 });
            const id = s.widgets[0].id;
            s = duplicateWidget(s, id);
            expect(s.widgets[1].position).toEqual({ row: 3, col: 4, colSpan: 3, rowSpan: 2 });
        });
        it('offsets position by +1 col in auto-grid mode', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = switchCanvasMode(s, 'auto-grid');
            s = addWidget(s, 'bar-chart', { row: 1, col: 2, colSpan: 3, rowSpan: 2 });
            const id = s.widgets[0].id;
            s = duplicateWidget(s, id);
            expect(s.widgets[1].position).toEqual({ row: 1, col: 3, colSpan: 3, rowSpan: 2 });
        });
        it('deep copies dataConfig', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = updateWidgetData(s, id, {
                dimensions: [{ field: 'region' }],
                measures: [{ field: 'revenue', aggregation: 'sum' }],
                filters: [],
            });
            s = duplicateWidget(s, id);
            // Verify data is equal
            expect(s.widgets[1].dataConfig.dimensions).toEqual([{ field: 'region' }]);
            // Verify it is a separate array reference
            expect(s.widgets[1].dataConfig.dimensions).not.toBe(s.widgets[0].dataConfig.dimensions);
        });
        it('deep copies config', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const id = s.widgets[0].id;
            s = updateWidgetConfig(s, id, { color: 'blue' });
            s = duplicateWidget(s, id);
            expect(s.widgets[1].config).toEqual({ color: 'blue' });
            expect(s.widgets[1].config).not.toBe(s.widgets[0].config);
        });
        it('returns unchanged state for non-existent widget', () => {
            const s = initialDashboardEditorState('d', 'ds');
            const result = duplicateWidget(s, 'non-existent');
            expect(result).toBe(s);
        });
    });
    describe('canvas mode switching', () => {
        it('switchCanvasMode to freeform is no-op when already freeform', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.canvasMode).toBe('freeform');
            const result = switchCanvasMode(s, 'freeform');
            expect(result).toBe(s); // same reference = no-op
        });
        it('switchCanvasMode to auto-grid migrates widgets', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart', { row: 0, col: 0, colSpan: 8, rowSpan: 6 });
            s = addWidget(s, 'kpi-card', { row: 0, col: 8, colSpan: 8, rowSpan: 6 });
            const result = switchCanvasMode(s, 'auto-grid');
            expect(result.canvasMode).toBe('auto-grid');
            expect(result.layout.kind).toBe('auto-grid');
            expect(result.widgets).toHaveLength(2);
        });
        it('migrateToFreeform multiplies positions by 4', () => {
            // Start in auto-grid mode with 12-col positions
            let s = initialDashboardEditorState('d', 'ds');
            s = switchCanvasMode(s, 'auto-grid');
            s = addWidget(s, 'bar-chart', { row: 0, col: 0, colSpan: 3, rowSpan: 2 });
            const result = migrateToFreeform(s);
            expect(result.canvasMode).toBe('freeform');
            expect(result.widgets[0].position).toEqual({
                col: 0,
                row: 0,
                colSpan: 12,
                rowSpan: 8,
            });
            expect(result.layout.kind).toBe('freeform');
        });
        it('migrateToAutoGrid sorts and converts positions', () => {
            let s = initialDashboardEditorState('d', 'ds');
            // Add widgets in freeform mode with 48-col positions
            s = addWidget(s, 'bar-chart', { row: 0, col: 0, colSpan: 8, rowSpan: 8 });
            s = addWidget(s, 'kpi-card', { row: 0, col: 16, colSpan: 8, rowSpan: 8 });
            s = addWidget(s, 'line-chart', { row: 0, col: 8, colSpan: 8, rowSpan: 8 });
            const result = migrateToAutoGrid(s);
            expect(result.canvasMode).toBe('auto-grid');
            expect(result.layout.kind).toBe('auto-grid');
            // Widgets should be sorted by position and converted to 12-col
            expect(result.widgets).toHaveLength(3);
            // First widget (col 0, row 0) → position col: 0, row: 0
            expect(result.widgets[0].type).toBe('bar-chart');
            expect(result.widgets[0].position.col).toBe(0);
            // Second widget (col 8, row 0) → position col: 4, row: 0
            expect(result.widgets[1].type).toBe('line-chart');
            expect(result.widgets[1].position.col).toBe(4);
            // Third widget (col 16, row 0) → position col: 8, row: 0
            expect(result.widgets[2].type).toBe('kpi-card');
            expect(result.widgets[2].position.col).toBe(8);
        });
        it('addWidget in freeform mode uses findOpenPosition', () => {
            let s = initialDashboardEditorState('d', 'ds');
            // Add first widget at explicit position to fill some space
            s = addWidget(s, 'bar-chart', { row: 0, col: 0, colSpan: 16, rowSpan: 6 });
            // Add second widget without position — should use smart placement
            s = addWidget(s, 'kpi-card');
            // findOpenPosition should place it at col 16 (first open spot after 16 cols occupied)
            expect(s.widgets[1].position.col).toBe(16);
            expect(s.widgets[1].position.row).toBe(0);
            expect(s.widgets[1].position.colSpan).toBe(8);
            expect(s.widgets[1].position.rowSpan).toBe(6);
        });
        it('duplicateWidget in freeform mode offsets by +2/+2', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart', { row: 4, col: 10, colSpan: 8, rowSpan: 6 });
            const id = s.widgets[0].id;
            s = duplicateWidget(s, id);
            expect(s.widgets[1].position.col).toBe(12); // 10 + 2
            expect(s.widgets[1].position.row).toBe(6); // 4 + 2
            expect(s.widgets[1].position.colSpan).toBe(8);
            expect(s.widgets[1].position.rowSpan).toBe(6);
        });
        it('switchCanvasMode round-trip freeform → auto-grid → freeform', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart', { row: 0, col: 0, colSpan: 8, rowSpan: 6 });
            expect(s.canvasMode).toBe('freeform');
            // Switch to auto-grid
            s = switchCanvasMode(s, 'auto-grid');
            expect(s.canvasMode).toBe('auto-grid');
            expect(s.layout.kind).toBe('auto-grid');
            // Switch back to freeform
            s = switchCanvasMode(s, 'freeform');
            expect(s.canvasMode).toBe('freeform');
            expect(s.layout.kind).toBe('freeform');
            expect(s.freeformConfig.columns).toBe(48);
        });
        it('initial state has freeformConfig with correct defaults', () => {
            const s = initialDashboardEditorState('d', 'ds');
            expect(s.freeformConfig.columns).toBe(48);
            expect(s.freeformConfig.rows).toBe(36);
            expect(s.freeformConfig.cellSizePx).toBe(20);
            expect(s.freeformConfig.gapPx).toBe(4);
            expect(s.freeformConfig.snapToGrid).toBe(true);
        });
    });
    describe('immutability', () => {
        it('addWidget does not mutate original state', () => {
            const original = initialDashboardEditorState('d', 'ds');
            const frozen = { ...original, widgets: [...original.widgets] };
            addWidget(original, 'bar-chart');
            expect(original.widgets).toEqual(frozen.widgets);
        });
        it('removeWidget does not mutate original state', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const before = [...s.widgets];
            removeWidget(s, s.widgets[0].id);
            expect(s.widgets).toEqual(before);
        });
        it('morphWidget does not mutate original state', () => {
            let s = initialDashboardEditorState('d', 'ds');
            s = addWidget(s, 'bar-chart');
            const originalType = s.widgets[0].type;
            morphWidget(s, s.widgets[0].id, 'pie-chart');
            expect(s.widgets[0].type).toBe(originalType);
        });
        it('each function returns a new object reference', () => {
            const s0 = initialDashboardEditorState('d', 'ds');
            const s1 = addWidget(s0, 'bar-chart');
            const s2 = selectWidget(s1, s1.widgets[0].id);
            const s3 = deselectWidget(s2);
            expect(s0).not.toBe(s1);
            expect(s1).not.toBe(s2);
            expect(s2).not.toBe(s3);
        });
    });
});
//# sourceMappingURL=dashboard-editor-state.test.js.map