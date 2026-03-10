/**
 * @phozart/phz-widgets — Alert-Aware Rendering State Machine (7A-A)
 *
 * Pure functions that compute CSS custom property overrides for
 * alert-aware single-value widgets. No DOM, no Lit — just state -> CSS props.
 */
import type { SingleValueAlertConfig, AlertVisualState, AlertContainerSize } from '@phozart/phz-shared/types';
/**
 * Compute CSS custom property overrides for a widget based on its alert config,
 * current alert visual state, and container size.
 *
 * Returns a Record<string, string> where keys are CSS custom property names
 * (without `var()`) and values are the resolved token values.
 *
 * The caller applies these as inline style overrides on the widget host.
 */
export declare function computeAlertStyles(config: SingleValueAlertConfig, state: AlertVisualState, containerSize: AlertContainerSize): Record<string, string>;
//# sourceMappingURL=alert-aware-rendering.d.ts.map