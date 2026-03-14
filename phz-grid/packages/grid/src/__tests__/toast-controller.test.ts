import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastController, type ToastInfo, type ToastOptions } from '../controllers/toast.controller.js';
import type { ReactiveControllerHost } from 'lit';

function makeHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

describe('ToastController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic behavior (backward compatibility) ──

  it('registers with host on construction', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    expect(host.addController).toHaveBeenCalledWith(ctrl);
  });

  it('starts with null toast', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    expect(ctrl.toast).toBeNull();
  });

  it('show() sets toast with message and type', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Hello', 'success');
    expect(ctrl.toast).toEqual(expect.objectContaining({
      message: 'Hello',
      type: 'success',
    }));
  });

  it('show() defaults type to info', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Info message');
    expect(ctrl.toast!.type).toBe('info');
  });

  it('show() requests host update', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Test', 'info');
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('auto-dismisses after default 2500ms', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Bye', 'success');
    expect(ctrl.toast).not.toBeNull();

    vi.advanceTimersByTime(2499);
    expect(ctrl.toast).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(ctrl.toast).toBeNull();
  });

  it('clears previous timer when show() called again', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('First', 'info');
    vi.advanceTimersByTime(2000);
    ctrl.show('Second', 'success');
    vi.advanceTimersByTime(600);
    // First timer would have fired at 2500, but was cleared
    expect(ctrl.toast).not.toBeNull();
    expect(ctrl.toast!.message).toBe('Second');
  });

  it('hostDisconnected clears timer and toast', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Temp', 'info');
    ctrl.hostDisconnected();
    expect(ctrl.toast).toBeNull();
    vi.advanceTimersByTime(3000);
    // Timer was cleared, no errors or state changes after disconnect
  });

  // ── Enhanced features (icon, duration, dismissible) ──

  it('show() accepts optional icon', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Cell copied', 'success', { icon: 'copy' });
    expect(ctrl.toast!.icon).toBe('copy');
  });

  it('show() without options has no icon', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Plain toast', 'info');
    expect(ctrl.toast!.icon).toBeUndefined();
  });

  it('show() accepts custom duration', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Slow', 'info', { duration: 5000 });
    vi.advanceTimersByTime(4999);
    expect(ctrl.toast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(ctrl.toast).toBeNull();
  });

  it('show() accepts dismissible flag', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Closeable', 'error', { dismissible: true });
    expect(ctrl.toast!.dismissible).toBe(true);
  });

  it('show() can combine icon + duration + dismissible', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Full options', 'success', { icon: 'check', duration: 4000, dismissible: true });
    expect(ctrl.toast).toEqual({
      message: 'Full options',
      type: 'success',
      icon: 'check',
      duration: 4000,
      dismissible: true,
    });
    vi.advanceTimersByTime(4000);
    expect(ctrl.toast).toBeNull();
  });

  it('dismiss() immediately hides toast', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Dismissable', 'info', { dismissible: true });
    expect(ctrl.toast).not.toBeNull();
    ctrl.dismiss();
    expect(ctrl.toast).toBeNull();
    expect(host.requestUpdate).toHaveBeenCalledTimes(2); // once for show, once for dismiss
  });

  it('dismiss() clears auto-dismiss timer', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    ctrl.show('Test', 'info');
    ctrl.dismiss();
    // After dismiss, advancing time should not cause issues
    vi.advanceTimersByTime(3000);
    expect(ctrl.toast).toBeNull();
  });

  it('dismiss() is safe to call when no toast', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    expect(() => ctrl.dismiss()).not.toThrow();
  });

  // ── Icon types ──

  it('supports all icon types', () => {
    const host = makeHost();
    const ctrl = new ToastController(host);
    const icons: Array<ToastOptions['icon']> = ['copy', 'export', 'check', 'error', 'info'];
    for (const icon of icons) {
      ctrl.show('Test', 'info', { icon });
      expect(ctrl.toast!.icon).toBe(icon);
    }
  });
});
