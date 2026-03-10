/**
 * @phozart/phz-engine — FormatRegistry
 *
 * Instance-based registry of named formatters. Each BIEngine instance gets
 * its own FormatRegistry so custom formatters are scoped per-engine.
 * Ships with 8 built-in formatters.
 */
/** A format function that converts a value to a display string. */
export type FormatFunction = (value: unknown, locale?: string) => string;
export declare class FormatRegistry {
    private readonly formatters;
    constructor(locale?: string);
    /** Register a named formatter. Overwrites if name already exists. */
    register(name: string, fn: FormatFunction): void;
    /** Get a formatter by name. Returns undefined if not registered. */
    get(name: string): FormatFunction | undefined;
    /** Check whether a formatter is registered. */
    has(name: string): boolean;
    /** Format a value using a named formatter. Returns empty string if formatter not found. */
    format(value: unknown, name: string, locale?: string): string;
    /** Remove all registered formatters including built-ins. */
    clear(): void;
}
//# sourceMappingURL=format-registry.d.ts.map