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
export declare class ToastController implements ReactiveController {
    private host;
    private timer;
    toast: ToastInfo | null;
    constructor(host: ReactiveControllerHost);
    hostConnected(): void;
    hostDisconnected(): void;
    show(message: string, type?: 'success' | 'info' | 'error', options?: ToastOptions): void;
    dismiss(): void;
    private clearTimer;
}
//# sourceMappingURL=toast.controller.d.ts.map