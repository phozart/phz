/**
 * @phozart/workspace — I18n Provider (H.19)
 *
 * Lightweight i18n interface with a default English provider.
 * Consumers can supply their own I18nProvider (e.g. wrapping i18next)
 * via WorkspaceClientOptions.
 */
export interface I18nProvider {
    t(key: string, params?: Record<string, string | number>): string;
    locale: string;
    direction: 'ltr' | 'rtl';
}
export declare const DEFAULT_STRINGS: Record<string, string>;
export declare function createDefaultI18nProvider(locale?: string): I18nProvider;
export declare function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string;
export declare function formatDate(value: Date | string | number, locale: string, options?: Intl.DateTimeFormatOptions): string;
//# sourceMappingURL=i18n-provider.d.ts.map