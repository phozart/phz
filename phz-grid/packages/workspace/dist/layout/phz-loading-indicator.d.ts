/**
 * @phozart/phz-workspace — Loading Indicator State (T.6)
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
export declare function createLoadingIndicatorState(): LoadingIndicatorState;
//# sourceMappingURL=phz-loading-indicator.d.ts.map