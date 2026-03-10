/**
 * Mobile-Specific Layout Helpers
 *
 * Pure functions for mobile viewport adaptations: bottom sheet sizing,
 * touch target calculations, and gesture threshold constants.
 */
// ========================================================================
// Touch Target Constants
// ========================================================================
/** Minimum touch target size in pixels (WCAG 2.5.8 Target Size Level AAA). */
export const MIN_TOUCH_TARGET = 44;
/** Comfortable touch target size for primary actions. */
export const COMFORTABLE_TOUCH_TARGET = 48;
/**
 * Get dimensions for a mobile bottom sheet at a given size.
 *
 * @param size - Sheet size preset
 * @returns Height percentage, handle visibility, and background scroll behavior
 */
export function getBottomSheetDimensions(size) {
    switch (size) {
        case 'peek':
            return { heightPercent: 30, showHandle: true, backgroundScrollable: true };
        case 'half':
            return { heightPercent: 50, showHandle: true, backgroundScrollable: false };
        case 'full':
            return { heightPercent: 92, showHandle: true, backgroundScrollable: false };
    }
}
// ========================================================================
// Swipe Gesture Thresholds
// ========================================================================
export const SWIPE_THRESHOLDS = {
    /** Minimum horizontal distance (px) to register a swipe */
    minDistance: 50,
    /** Maximum vertical deviation (px) allowed during a horizontal swipe */
    maxVerticalDeviation: 30,
    /** Maximum time (ms) for the gesture to count as a swipe */
    maxDuration: 300,
    /** Velocity threshold (px/ms) for flick gestures */
    velocityThreshold: 0.3,
};
/**
 * Get navigation configuration for mobile viewports.
 * By default, mobile uses bottom tabs, hamburger menu, bottom sheets,
 * and stack navigation.
 */
export function getMobileNavConfig() {
    return {
        showBottomTabs: true,
        showHamburger: true,
        useBottomSheets: true,
        useStackNavigation: true,
    };
}
//# sourceMappingURL=mobile.js.map