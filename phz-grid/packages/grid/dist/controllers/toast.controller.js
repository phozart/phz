const DEFAULT_DURATION = 2500;
export class ToastController {
    constructor(host) {
        this.timer = null;
        this.toast = null;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() {
        this.clearTimer();
        this.toast = null;
    }
    show(message, type = 'info', options) {
        this.clearTimer();
        this.toast = { message, type, ...options };
        const duration = options?.duration ?? DEFAULT_DURATION;
        this.timer = setTimeout(() => {
            this.toast = null;
            this.host.requestUpdate();
        }, duration);
        this.host.requestUpdate();
    }
    dismiss() {
        this.clearTimer();
        this.toast = null;
        this.host.requestUpdate();
    }
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
//# sourceMappingURL=toast.controller.js.map