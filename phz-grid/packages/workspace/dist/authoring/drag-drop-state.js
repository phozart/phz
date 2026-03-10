/**
 * @phozart/phz-workspace — Drag-and-Drop State
 *
 * Pure state management for drag-and-drop operations in the dashboard editor.
 */
import { addWidget, moveWidget, updateWidgetData } from './dashboard-editor-state.js';
export function initialDragDropState() {
    return { validTargets: [] };
}
export function startDrag(state, source) {
    return { ...state, dragging: source, hovering: undefined };
}
export function hoverTarget(state, target) {
    return { ...state, hovering: target };
}
export function cancelDrag(_state) {
    return initialDragDropState();
}
export function computeValidTargets(source, dashboardState) {
    const targets = [];
    switch (source.type) {
        case 'field-palette':
            // Can drop on canvas (auto-creates widget), widget data zones, or filter bar
            targets.push({ type: 'canvas-cell', row: 0, col: 0 });
            for (const w of dashboardState.widgets) {
                targets.push({ type: 'widget-data-zone', widgetId: w.id, zone: 'dimensions' });
                targets.push({ type: 'widget-data-zone', widgetId: w.id, zone: 'measures' });
                targets.push({ type: 'widget-data-zone', widgetId: w.id, zone: 'filters' });
            }
            targets.push({ type: 'filter-bar' });
            break;
        case 'widget-library':
            targets.push({ type: 'canvas-cell', row: 0, col: 0 });
            break;
        case 'existing-widget':
            targets.push({ type: 'canvas-cell', row: 0, col: 0 });
            for (const w of dashboardState.widgets) {
                if (w.id !== source.widgetId) {
                    targets.push({ type: 'widget-swap', widgetId: w.id });
                }
            }
            break;
        case 'filter-chip':
            targets.push({ type: 'filter-bar' });
            break;
    }
    return targets;
}
/**
 * Infer a sensible widget type from a field's data type.
 */
function inferWidgetType(dataType) {
    switch (dataType) {
        case 'number': return 'kpi-card';
        case 'date': return 'line-chart';
        default: return 'bar-chart';
    }
}
export function executeDrop(dashboardState, source, target) {
    if (source.type === 'field-palette' && target.type === 'canvas-cell') {
        // Auto-create widget from field
        const widgetType = inferWidgetType(source.dataType);
        const position = { row: target.row, col: target.col, colSpan: 2, rowSpan: 2 };
        let state = addWidget(dashboardState, widgetType, position);
        // Add field to the new widget's data config
        const newWidget = state.widgets[state.widgets.length - 1];
        if (newWidget) {
            const zone = source.dataType === 'number' ? 'measures' : 'dimensions';
            const dataConfig = { ...newWidget.dataConfig };
            if (zone === 'measures') {
                dataConfig.measures = [...dataConfig.measures, { field: source.field, aggregation: 'sum' }];
            }
            else {
                dataConfig.dimensions = [...dataConfig.dimensions, { field: source.field }];
            }
            state = updateWidgetData(state, newWidget.id, dataConfig);
        }
        return state;
    }
    if (source.type === 'field-palette' && target.type === 'widget-data-zone') {
        const widget = dashboardState.widgets.find(w => w.id === target.widgetId);
        if (!widget)
            return dashboardState;
        const dataConfig = {
            dimensions: [...widget.dataConfig.dimensions],
            measures: [...widget.dataConfig.measures],
            filters: [...widget.dataConfig.filters],
        };
        if (target.zone === 'dimensions') {
            dataConfig.dimensions = [...dataConfig.dimensions, { field: source.field }];
        }
        else if (target.zone === 'measures') {
            dataConfig.measures = [...dataConfig.measures, { field: source.field, aggregation: 'sum' }];
        }
        else if (target.zone === 'filters') {
            dataConfig.filters = [...dataConfig.filters, { field: source.field, operator: 'eq', value: null }];
        }
        return updateWidgetData(dashboardState, target.widgetId, dataConfig);
    }
    if (source.type === 'widget-library' && target.type === 'canvas-cell') {
        const position = { row: target.row, col: target.col, colSpan: 2, rowSpan: 2 };
        return addWidget(dashboardState, source.widgetType, position);
    }
    if (source.type === 'existing-widget' && target.type === 'canvas-cell') {
        return moveWidget(dashboardState, source.widgetId, {
            row: target.row,
            col: target.col,
            colSpan: 2,
            rowSpan: 2,
        });
    }
    if (source.type === 'existing-widget' && target.type === 'widget-swap') {
        // Swap positions between source widget and target widget
        const sourceWidget = dashboardState.widgets.find(w => w.id === source.widgetId);
        const targetWidget = dashboardState.widgets.find(w => w.id === target.widgetId);
        if (!sourceWidget || !targetWidget)
            return dashboardState;
        let state = moveWidget(dashboardState, source.widgetId, targetWidget.position);
        state = moveWidget(state, target.widgetId, sourceWidget.position);
        return state;
    }
    // Default: no-op for unhandled combos
    return dashboardState;
}
//# sourceMappingURL=drag-drop-state.js.map