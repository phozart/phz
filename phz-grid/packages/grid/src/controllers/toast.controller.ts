import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type ToastIcon = 'copy' | 'export' | 'check' | 'error' | 'info';

export interface ToastOptions {
  icon?: ToastIcon;
  duration?: number;
  dismissible?: boolean;
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'error';
  icon?: ToastIcon;
  duration?: number;
  dismissible?: boolean;
}

const DEFAULT_DURATION = 2500;

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
    this.clearTimer();
    this.toast = null;
  }

  show(message: string, type: 'success' | 'info' | 'error' = 'info', options?: ToastOptions): void {
    this.clearTimer();
    this.toast = { message, type, ...options };
    const duration = options?.duration ?? DEFAULT_DURATION;
    this.timer = setTimeout(() => {
      this.toast = null;
      this.host.requestUpdate();
    }, duration);
    this.host.requestUpdate();
  }

  dismiss(): void {
    this.clearTimer();
    this.toast = null;
    this.host.requestUpdate();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
