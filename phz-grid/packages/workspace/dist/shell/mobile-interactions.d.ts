/**
 * S.8 — Mobile Interaction Patterns
 *
 * Pure functions for bottom sheet, swipe detection, tap-to-place,
 * mobile dashboard layout, and floating action bar.
 */
export interface BottomSheetConfig {
    maxHeight: string;
    dragHandle: boolean;
    overscrollContain: boolean;
}
export declare function createBottomSheetConfig(overrides?: Partial<BottomSheetConfig>): BottomSheetConfig;
export interface BottomSheetClasses {
    sheet: string;
    overlay: string;
    handle: string;
}
export declare function getBottomSheetClasses(open: boolean): BottomSheetClasses;
export interface TouchPoint {
    x: number;
    y: number;
    time: number;
}
export interface SwipeOptions {
    minDistance?: number;
}
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export declare function detectSwipe(start: TouchPoint, end: TouchPoint, options?: SwipeOptions): SwipeDirection | null;
export interface MobileDashboardLayout {
    columns: number;
    filterCollapsed: boolean;
    singleColumn: boolean;
}
export declare function getMobileDashboardLayout(): MobileDashboardLayout;
export declare function getFloatingActionBarClasses(selectedCount: number): string;
export interface TapToPlaceConfig {
    mode: 'tap' | 'drag';
    insertPosition: 'end' | 'after-selected';
}
export declare function getTapToPlaceConfig(): TapToPlaceConfig;
//# sourceMappingURL=mobile-interactions.d.ts.map