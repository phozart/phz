/**
 * @phozart/grid — Date Formatter
 *
 * Oracle/SQL-style date format tokens with greedy longest-first matching.
 *
 * Tokens:
 *   dddd  full day name      ddd  short day name    dd  zero-padded day    d  day
 *   mmmm  full month name    mmm  short month name  mm  zero-padded month  m  month
 *   yyyy  4-digit year       yy   2-digit year
 *   hh24  24h hour           hh12 12h hour          hh  alias for hh24
 *   mi    minutes            ss   seconds
 *   AM/am meridiem (case-sensitive output)
 *   All other characters pass through as literals.
 */
/**
 * Format a Date using an Oracle/SQL-style format string.
 * Returns the original string representation for invalid dates.
 */
export declare function formatDate(date: Date, format: string): string;
export declare const DEFAULT_DATE_FORMAT = "dd/mm/yyyy";
export declare const DEFAULT_DATETIME_FORMAT = "dd/mm/yyyy hh24:mi";
export declare const DATE_FORMAT_PRESETS: Array<{
    value: string;
    label: string;
}>;
//# sourceMappingURL=date-formatter.d.ts.map