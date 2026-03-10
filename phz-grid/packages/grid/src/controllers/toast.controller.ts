import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'error';
}

export class ToastController implements ReactiveController {
  private host: ReactiveControllerHost;
  private timer: ReturnType<typeof setTimeout> | null = null;

  toast: ToastInfo | null = null;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  show(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
    if (this.timer) clearTimeout(this.timer);
    this.toast = { message, type };
    this.timer = setTimeout(() => {
      this.toast = null;
      this.host.requestUpdate();
    }, 2500);
    this.host.requestUpdate();
  }
}
