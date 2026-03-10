/**
 * Mobile-Specific Layout Helpers
 *
 * Pure functions for mobile viewport adaptations: bottom sheet sizing,
 * touch target calculations, and gesture threshold constants.
 */
/** Minimum touch target size in pixels (WCAG 2.5.8 Target Size Level AAA). */
export declare const MIN_TOUCH_TARGET = 44;
/** Comfortable touch target size for primary actions. */
export declare const COMFORTABLE_TOUCH_TARGET = 48;
export type BottomSheetSize = 'peek' | 'half' | 'full';
export interface BottomSheetDimensions {
    /** Height as a percentage of viewport height (0-100) */
    heightPercent: number;
    /** Whether the sheet shows a drag handle */
    showHandle: boolean;
    /** Whether background content is scrollable */
    backgroundScrollable: boolean;
}
/**
 * Get dimensions for a mobile bottom sheet at a given size.
 *
 * @param size - Sheet size preset
 * @returns Height percentage, handle visibility, and background scroll behavior
 */
export declare function getBottomSheetDimensions(size: BottomSheetSize): BottomSheetDimensions;
export declare const SWIPE_THRESHOLDS: {
    /** Minimum horizontal distance (px) to register a swipe */
    readonly minDistance: 50;
    /** Maximum vertical deviation (px) allowed during a horizontal swipe */
    readonly maxVerticalDeviation: 30;
    /** Maximum time (ms) for the gesture to count as a swipe */
    readonly maxDuration: 300;
    /** Velocity threshold (px/ms) for flick gestures */
    readonly velocityThreshold: 0.3;
};
export interface MobileNavConfig {
    /** Show the bottom tab bar */
    showBottomTabs: boolean;
    /** Show the hamburger menu button */
    showHamburger: boolean;
    /** Use bottom sheets instead of side drawers */
    useBottomSheets: boolean;
    /** Stack navigation (push/pop) instead of tab switching */
    useStackNavigation: boolean;
}
/**
 * Get navigation configuration for mobile viewports.
 * By default, mobile uses bottom tabs, hamburger menu, bottom sheets,
 * and stack navigation.
 */
export declare function getMobileNavConfig(): MobileNavConfig;
//# sourceMappingURL=mobile.d.ts.map