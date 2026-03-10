/**
 * @phozart/phz-workspace — RTL Utilities (L.18)
 *
 * Pure functions for RTL layout support.
 * Maps physical CSS properties to logical properties and
 * generates RTL override CSS blocks.
 */
import type { I18nProvider } from '../i18n/i18n-provider.js';
export interface DirectionConfig {
    direction: 'ltr' | 'rtl';
    textAlign: 'left' | 'right';
    flexDirection: 'row' | 'row-reverse';
}
export declare function resolveDirection(i18n?: I18nProvider): 'ltr' | 'rtl';
export declare function logicalProperty(physicalProp: string, direction: 'ltr' | 'rtl'): string;
export declare function generateRTLOverrides(): string;
//# sourceMappingURL=rtl-utils.d.ts.map