export class SaveController {
    constructor(host) {
        this.saveGeneration = 0;
        this.state = 'idle';
        this.dirty = false;
        this.errorMessage = '';
        this.host = host;
        this.host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() {
        if (this.autoDismissTimer)
            clearTimeout(this.autoDismissTimer);
    }
    markDirty() {
        this.dirty = true;
        this.host.requestUpdate();
    }
    markClean() {
        this.dirty = false;
        this.host.requestUpdate();
    }
    async save(fn) {
        this.lastSaveFn = fn;
        const gen = ++this.saveGeneration;
        this.state = 'saving';
        this.errorMessage = '';
        this.host.requestUpdate();
        try {
            await fn();
            if (gen !== this.saveGeneration)
                return;
            this.state = 'saved';
            this.dirty = false;
            this.host.requestUpdate();
            this.scheduleAutoDismiss();
        }
        catch (err) {
            if (gen !== this.saveGeneration)
                return;
            this.state = 'error';
            this.errorMessage = err instanceof Error ? err.message : String(err);
            this.host.requestUpdate();
        }
    }
    async retry() {
        if (this.state !== 'error' || !this.lastSaveFn)
            return;
        await this.save(this.lastSaveFn);
    }
    dismiss() {
        this.state = 'idle';
        this.errorMessage = '';
        this.host.requestUpdate();
    }
    get beforeUnloadMessage() {
        return this.dirty ? 'You have unsaved changes. Are you sure you want to leave?' : '';
    }
    scheduleAutoDismiss() {
        if (this.autoDismissTimer)
            clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = setTimeout(() => {
            if (this.state === 'saved') {
                this.state = 'idle';
                this.host.requestUpdate();
            }
        }, 3000);
    }
}
//# sourceMappingURL=save-controller.js.map