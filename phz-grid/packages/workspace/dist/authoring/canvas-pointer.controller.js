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
import { pixelToGrid } from './freeform-grid-state.js';
// ========================================================================
// Controller
// ========================================================================
export class CanvasPointerController {
    constructor(host, callback, gridConfig) {
        this._zoom = 1;
        // Tracking state
        this._active = false;
        this._mode = 'none';
        this._startX = 0;
        this._startY = 0;
        this._startCol = 0;
        this._startRow = 0;
        this._lastCol = 0;
        this._lastRow = 0;
        // --- Internal event handlers (arrow functions for stable `this`) ---
        this._onPointerDown = (e) => {
            if (e.button !== 0)
                return; // left button only
            const target = e.target;
            const widgetSlot = target.closest('[data-widget-id]');
            const resizeHandle = target.closest('[data-resize-handle]');
            const rect = this._host.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this._startX = x;
            this._startY = y;
            this._startCol = this._pixelToGridCol(x);
            this._startRow = this._pixelToGridRow(y);
            this._lastCol = this._startCol;
            this._lastRow = this._startRow;
            this._active = true;
            if (resizeHandle && widgetSlot) {
                // Resize mode
                this._mode = 'resize';
                this._activeWidgetId = widgetSlot.dataset.widgetId;
                this._activeHandle = resizeHandle.dataset.resizeHandle;
                this._host.setPointerCapture(e.pointerId);
                this._callback({
                    type: 'resize-start',
                    widgetId: this._activeWidgetId,
                    gridCol: this._startCol,
                    gridRow: this._startRow,
                    deltaCol: 0,
                    deltaRow: 0,
                    resizeHandle: this._activeHandle,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                });
            }
            else if (widgetSlot) {
                // Drag mode
                this._mode = 'drag';
                this._activeWidgetId = widgetSlot.dataset.widgetId;
                this._host.setPointerCapture(e.pointerId);
                this._callback({
                    type: 'drag-start',
                    widgetId: this._activeWidgetId,
                    gridCol: this._startCol,
                    gridRow: this._startRow,
                    deltaCol: 0,
                    deltaRow: 0,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                });
            }
            else {
                // Canvas click — could become area selection
                this._mode = 'select';
                this._callback({
                    type: 'select-start',
                    gridCol: this._startCol,
                    gridRow: this._startRow,
                    deltaCol: 0,
                    deltaRow: 0,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                });
            }
        };
        this._onPointerMove = (e) => {
            if (!this._active)
                return;
            // Throttle to 60fps via rAF
            this._pendingMove = e;
            if (this._rafId === undefined) {
                this._rafId = requestAnimationFrame(this._processPendingMove);
            }
        };
        this._processPendingMove = () => {
            this._rafId = undefined;
            const e = this._pendingMove;
            if (!e)
                return;
            this._pendingMove = undefined;
            const rect = this._host.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = this._pixelToGridCol(x);
            const row = this._pixelToGridRow(y);
            const deltaCol = col - this._startCol;
            const deltaRow = row - this._startRow;
            // Skip if grid position hasn't changed
            if (col === this._lastCol && row === this._lastRow)
                return;
            this._lastCol = col;
            this._lastRow = row;
            const eventType = this._mode === 'drag' ? 'drag-move'
                : this._mode === 'resize' ? 'resize-move'
                    : 'select-move';
            this._callback({
                type: eventType,
                widgetId: this._activeWidgetId,
                gridCol: col,
                gridRow: row,
                deltaCol,
                deltaRow,
                resizeHandle: this._activeHandle,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
            });
        };
        this._onPointerUp = (e) => {
            if (!this._active)
                return;
            this._active = false;
            const rect = this._host.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = this._pixelToGridCol(x);
            const row = this._pixelToGridRow(y);
            const deltaCol = col - this._startCol;
            const deltaRow = row - this._startRow;
            // Determine if this was a click (no significant movement)
            const isClick = Math.abs(deltaCol) === 0 && Math.abs(deltaRow) === 0;
            if (this._mode === 'drag') {
                if (isClick) {
                    this._callback({
                        type: 'widget-click',
                        widgetId: this._activeWidgetId,
                        gridCol: col,
                        gridRow: row,
                        deltaCol: 0,
                        deltaRow: 0,
                        shiftKey: e.shiftKey,
                        altKey: e.altKey,
                        metaKey: e.metaKey,
                    });
                }
                else {
                    this._callback({
                        type: 'drag-end',
                        widgetId: this._activeWidgetId,
                        gridCol: col,
                        gridRow: row,
                        deltaCol,
                        deltaRow,
                        shiftKey: e.shiftKey,
                        altKey: e.altKey,
                        metaKey: e.metaKey,
                    });
                }
            }
            else if (this._mode === 'resize') {
                this._callback({
                    type: 'resize-end',
                    widgetId: this._activeWidgetId,
                    gridCol: col,
                    gridRow: row,
                    deltaCol,
                    deltaRow,
                    resizeHandle: this._activeHandle,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                });
            }
            else if (this._mode === 'select') {
                if (isClick) {
                    this._callback({
                        type: 'canvas-click',
                        gridCol: col,
                        gridRow: row,
                        deltaCol: 0,
                        deltaRow: 0,
                        shiftKey: e.shiftKey,
                        altKey: e.altKey,
                        metaKey: e.metaKey,
                    });
                }
                else {
                    this._callback({
                        type: 'select-end',
                        gridCol: col,
                        gridRow: row,
                        deltaCol,
                        deltaRow,
                        shiftKey: e.shiftKey,
                        altKey: e.altKey,
                        metaKey: e.metaKey,
                    });
                }
            }
            this._host.releasePointerCapture(e.pointerId);
            this._mode = 'none';
            this._activeWidgetId = undefined;
            this._activeHandle = undefined;
            if (this._rafId !== undefined) {
                cancelAnimationFrame(this._rafId);
                this._rafId = undefined;
            }
        };
        this._onPointerCancel = (e) => {
            if (!this._active)
                return;
            this._active = false;
            if (this._mode === 'drag') {
                this._callback({
                    type: 'drag-cancel',
                    widgetId: this._activeWidgetId,
                    gridCol: this._lastCol,
                    gridRow: this._lastRow,
                    deltaCol: 0,
                    deltaRow: 0,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                });
            }
            this._host.releasePointerCapture(e.pointerId);
            this._mode = 'none';
            this._activeWidgetId = undefined;
            this._activeHandle = undefined;
            if (this._rafId !== undefined) {
                cancelAnimationFrame(this._rafId);
                this._rafId = undefined;
            }
        };
        this._onKeyDown = (e) => {
            if (e.key === 'Escape' && this._active) {
                this._active = false;
                if (this._mode === 'drag') {
                    this._callback({
                        type: 'drag-cancel',
                        widgetId: this._activeWidgetId,
                        gridCol: this._lastCol,
                        gridRow: this._lastRow,
                        deltaCol: 0,
                        deltaRow: 0,
                        shiftKey: false,
                        altKey: false,
                        metaKey: false,
                    });
                }
                this._mode = 'none';
                this._activeWidgetId = undefined;
                this._activeHandle = undefined;
            }
        };
        this._host = host;
        this._callback = callback;
        this._gridConfig = gridConfig;
        host.addController(this);
    }
    // --- Lifecycle ---
    hostConnected() {
        this._host.addEventListener('pointerdown', this._onPointerDown);
        this._host.addEventListener('pointermove', this._onPointerMove);
        this._host.addEventListener('pointerup', this._onPointerUp);
        this._host.addEventListener('pointercancel', this._onPointerCancel);
        this._host.addEventListener('keydown', this._onKeyDown);
    }
    hostDisconnected() {
        this._host.removeEventListener('pointerdown', this._onPointerDown);
        this._host.removeEventListener('pointermove', this._onPointerMove);
        this._host.removeEventListener('pointerup', this._onPointerUp);
        this._host.removeEventListener('pointercancel', this._onPointerCancel);
        this._host.removeEventListener('keydown', this._onKeyDown);
        if (this._rafId !== undefined) {
            cancelAnimationFrame(this._rafId);
            this._rafId = undefined;
        }
    }
    // --- Public API ---
    updateGridConfig(config) {
        this._gridConfig = config;
    }
    updateZoom(zoom) {
        this._zoom = zoom;
    }
    // --- Internal coordinate helpers ---
    _pixelToGridCol(px) {
        return pixelToGrid(px / this._zoom, this._gridConfig.cellSizePx, this._gridConfig.gapPx);
    }
    _pixelToGridRow(py) {
        return pixelToGrid(py / this._zoom, this._gridConfig.cellSizePx, this._gridConfig.gapPx);
    }
}
//# sourceMappingURL=canvas-pointer.controller.js.map