/**
 * @phozart/workspace — Loading Indicator State (T.6)
 *
 * Manages loading progress bar state: phase transitions, messages,
 * progress percentage, and auto-dismiss after completion.
 *
 * Note: The Lit component rendering is handled separately; this module
 * provides the pure state management and auto-dismiss timer logic.
 */

import type { DashboardLoadingState } from '../types.js';

export interface LoadingIndicatorState {
  getPhase(): DashboardLoadingState['phase'];
  isVisible(): boolean;
  getMessage(): string | undefined;
  getProgress(): number;
  setPhase(phase: DashboardLoadingState['phase'], message?: string): void;
  setProgress(progress: number): void;
  subscribe(listener: () => void): () => void;
  destroy(): void;
}

const AUTO_DISMISS_MS = 3000;

export function createLoadingIndicatorState(): LoadingIndicatorState {
  let phase: DashboardLoadingState['phase'] = 'idle';
  let message: string | undefined;
  let progress = 0;
  let visible = false;
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function clearDismissTimer(): void {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  }

  function updateVisibility(): void {
    switch (phase) {
      case 'idle':
        visible = false;
        break;
      case 'preloading':
      case 'preload-complete':
      case 'full-loading':
      case 'error':
        visible = true;
        break;
      case 'full-complete':
        visible = true;
        // Auto-dismiss after 3s
        clearDismissTimer();
        dismissTimer = setTimeout(() => {
          dismissTimer = null;
          visible = false;
          notify();
        }, AUTO_DISMISS_MS);
        break;
    }
  }

  return {
    getPhase(): DashboardLoadingState['phase'] {
      return phase;
    },

    isVisible(): boolean {
      return visible;
    },

    getMessage(): string | undefined {
      if (phase === 'full-complete' && message === undefined) return 'Done';
      return message;
    },

    getProgress(): number {
      return progress;
    },

    setPhase(newPhase: DashboardLoadingState['phase'], newMessage?: string): void {
      clearDismissTimer();
      phase = newPhase;
      message = newMessage;
      updateVisibility();
      notify();
    },

    setProgress(p: number): void {
      progress = Math.max(0, Math.min(100, p));
      notify();
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    destroy(): void {
      clearDismissTimer();
      listeners.clear();
    },
  };
}
