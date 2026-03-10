/**
 * @phozart/phz-grid — Date Formatter
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Tokens ordered longest-first for greedy matching
const TOKENS: Array<{ token: string; fn: (d: Date) => string }> = [
  { token: 'dddd', fn: d => DAY_NAMES[d.getDay()] },
  { token: 'ddd', fn: d => DAY_SHORT[d.getDay()] },
  { token: 'dd', fn: d => String(d.getDate()).padStart(2, '0') },
  { token: 'd', fn: d => String(d.getDate()) },
  { token: 'mmmm', fn: d => MONTH_NAMES[d.getMonth()] },
  { token: 'mmm', fn: d => MONTH_SHORT[d.getMonth()] },
  { token: 'mm', fn: d => String(d.getMonth() + 1).padStart(2, '0') },
  { token: 'mi', fn: d => String(d.getMinutes()).padStart(2, '0') },
  { token: 'm', fn: d => String(d.getMonth() + 1) },
  { token: 'yyyy', fn: d => String(d.getFullYear()) },
  { token: 'yy', fn: d => String(d.getFullYear()).slice(-2) },
  { token: 'hh24', fn: d => String(d.getHours()).padStart(2, '0') },
  { token: 'hh12', fn: d => { const h = d.getHours() % 12; return String(h === 0 ? 12 : h).padStart(2, '0'); } },
  { token: 'hh', fn: d => String(d.getHours()).padStart(2, '0') },
  { token: 'ss', fn: d => String(d.getSeconds()).padStart(2, '0') },
  { token: 'AM', fn: d => d.getHours() < 12 ? 'AM' : 'PM' },
  { token: 'am', fn: d => d.getHours() < 12 ? 'am' : 'pm' },
];

/**
 * Format a Date using an Oracle/SQL-style format string.
 * Returns the original string representation for invalid dates.
 */
export function formatDate(date: Date, format: string): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return String(date);
  }

  let result = '';
  let i = 0;

  while (i < format.length) {
    let matched = false;
    for (const { token, fn } of TOKENS) {
      if (format.substring(i, i + token.length) === token) {
        result += fn(date);
        i += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += format[i];
      i++;
    }
  }

  return result;
}

export const DEFAULT_DATE_FORMAT = 'dd/mm/yyyy';
export const DEFAULT_DATETIME_FORMAT = 'dd/mm/yyyy hh24:mi';

export const DATE_FORMAT_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'dd/mm/yyyy', label: 'dd/mm/yyyy' },
  { value: 'mm/dd/yyyy', label: 'mm/dd/yyyy' },
  { value: 'yyyy-mm-dd', label: 'yyyy-mm-dd (ISO)' },
  { value: 'dd/mmm/yyyy', label: 'dd/mmm/yyyy' },
  { value: 'dd/mm/yyyy hh24:mi', label: 'dd/mm/yyyy hh24:mi' },
  { value: 'mm/dd/yyyy hh24:mi', label: 'mm/dd/yyyy hh24:mi' },
  { value: 'yyyy-mm-dd hh24:mi', label: 'yyyy-mm-dd hh24:mi (ISO)' },
  { value: 'ddd dd/mmm/yyyy', label: 'ddd dd/mmm/yyyy' },
  { value: 'hh24:mi', label: 'hh24:mi (time only)' },
  { value: 'hh12:mi AM', label: 'hh12:mi AM (12h)' },
];
