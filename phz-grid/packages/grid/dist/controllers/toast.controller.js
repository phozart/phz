export class ToastController {
    constructor(host) {
        this.timer = null;
        this.toast = null;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() {
        if (this.timer)
            clearTimeout(this.timer);
    }
    show(message, type = 'info') {
        if (this.timer)
            clearTimeout(this.timer);
        this.toast = { message, type };
        this.timer = setTimeout(() => {
            this.toast = null;
            this.host.requestUpdate();
        }, 2500);
        this.host.requestUpdate();
    }
}
//# sourceMappingURL=toast.controller.js.map