import type { ReactiveController, ReactiveControllerHost } from 'lit';
export interface ToastInfo {
    message: string;
    type: 'success' | 'info' | 'error';
}
export declare class ToastController implements ReactiveController {
    private host;
    private timer;
    toast: ToastInfo | null;
    constructor(host: ReactiveControllerHost);
    hostConnected(): void;
    hostDisconnected(): void;
    show(message: string, type?: 'success' | 'info' | 'error'): void;
}
//# sourceMappingURL=toast.controller.d.ts.map