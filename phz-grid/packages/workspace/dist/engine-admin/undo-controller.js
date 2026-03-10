import { UndoManager } from './undo-manager.js';
export class UndoController {
    constructor(host, options) {
        this.host = host;
        this.manager = new UndoManager({
            maxHistory: options?.maxHistory,
            isEqual: options?.isEqual,
        });
        this.onStateRestore = options?.onStateRestore;
        this.host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    get canUndo() {
        return this.manager.canUndo;
    }
    get canRedo() {
        return this.manager.canRedo;
    }
    push(state) {
        this.manager.push(state);
        this.host.requestUpdate();
    }
    undo() {
        const state = this.manager.undo();
        if (state !== null) {
            this.onStateRestore?.(state);
        }
        this.host.requestUpdate();
        return state;
    }
    redo() {
        const state = this.manager.redo();
        if (state !== null) {
            this.onStateRestore?.(state);
        }
        this.host.requestUpdate();
        return state;
    }
    clear() {
        this.manager.clear();
        this.host.requestUpdate();
    }
    handleKeydown(e) {
        const mod = e.ctrlKey || e.metaKey;
        if (!mod || e.key !== 'z')
            return;
        if (e.shiftKey) {
            const state = this.manager.redo();
            if (state !== null) {
                e.preventDefault();
                this.onStateRestore?.(state);
                this.host.requestUpdate();
            }
        }
        else {
            const state = this.manager.undo();
            if (state !== null) {
                e.preventDefault();
                this.onStateRestore?.(state);
                this.host.requestUpdate();
            }
        }
    }
}
//# sourceMappingURL=undo-controller.js.map