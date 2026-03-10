/**
 * @phozart/phz-workspace — Canvas Pointer Controller (Canvas Phase 1E)
 *
 * Lit Reactive Controller that handles pointer events on the freeform canvas.
 * Converts pixel coordinates to grid coordinates via pixelToGrid(),
 * then delegates to pure state machine functions.
 *
 * The controller does NOT contain business logic — it translates DOM events
 * into state transitions and emits custom events for the host component to handle.
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { FreeformGridConfig, ResizeHandle } from './freeform-grid-state.js';
export interface CanvasPointerEvent {
    type: 'drag-start' | 'drag-move' | 'drag-end' | 'drag-cancel' | 'resize-start' | 'resize-move' | 'resize-end' | 'select-start' | 'select-move' | 'select-end' | 'widget-click' | 'canvas-click';
    widgetId?: string;
    gridCol: number;
    gridRow: number;
    deltaCol: number;
    deltaRow: number;
    resizeHandle?: ResizeHandle;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}
export type CanvasPointerCallback = (event: CanvasPointerEvent) => void;
export declare class CanvasPointerController implements ReactiveController {
    private _host;
    private _callback;
    private _gridConfig;
    private _zoom;
    private _active;
    private _mode;
    private _startX;
    private _startY;
    private _startCol;
    private _startRow;
    private _lastCol;
    private _lastRow;
    private _activeWidgetId?;
    private _activeHandle?;
    private _rafId?;
    private _pendingMove?;
    constructor(host: ReactiveControllerHost & HTMLElement, callback: CanvasPointerCallback, gridConfig: FreeformGridConfig);
    hostConnected(): void;
    hostDisconnected(): void;
    updateGridConfig(config: FreeformGridConfig): void;
    updateZoom(zoom: number): void;
    private _pixelToGridCol;
    private _pixelToGridRow;
    private _onPointerDown;
    private _onPointerMove;
    private _processPendingMove;
    private _onPointerUp;
    private _onPointerCancel;
    private _onKeyDown;
}
//# sourceMappingURL=canvas-pointer.controller.d.ts.map