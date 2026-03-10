/**
 * @phozart/phz-vue — Factory functions
 *
 * Creates Vue components and composables without a hard dependency on Vue.
 * Usage:
 *   import { ref, onMounted, onUnmounted, defineComponent, h } from 'vue';
 *   import { createPhzGridComponent } from '@phozart/phz-vue';
 *   const PhzGrid = createPhzGridComponent({ defineComponent, h, ref, ... });
 */
import type { GridApi } from '@phozart/phz-core';
import type { UseGridReturn, UseGridSelectionReturn, UseGridSortReturn, UseGridFilterReturn, UseGridEditReturn } from './types.js';
import '@phozart/phz-grid';
/**
 * Minimal Vue runtime interface needed by the factories.
 * This avoids importing Vue directly.
 */
export interface VueRuntime {
    defineComponent: Function;
    h: Function;
    ref: <T>(value: T) => {
        value: T;
    };
    onMounted: (fn: () => void) => void;
    onUnmounted: (fn: () => void) => void;
    watch: (source: any, cb: any) => void;
}
export declare function createPhzGridComponent(vue: VueRuntime): any;
export declare function createUseGrid(vue: VueRuntime): () => UseGridReturn;
export declare function createUseGridSelection(vue: VueRuntime): (gridInstance?: {
    value: GridApi | null;
}) => UseGridSelectionReturn;
export declare function createUseGridSort(vue: VueRuntime): (gridInstance?: {
    value: GridApi | null;
}) => UseGridSortReturn;
export declare function createUseGridFilter(vue: VueRuntime): (gridInstance?: {
    value: GridApi | null;
}) => UseGridFilterReturn;
export declare function createUseGridEdit(vue: VueRuntime): (gridInstance?: {
    value: GridApi | null;
}) => UseGridEditReturn;
//# sourceMappingURL=factories.d.ts.map