/**
 * @phozart/engine — Date Grouping Utility
 *
 * Provides date bucketing for pivot tables and grouping operations.
 * Includes both JS runtime functions and DuckDB SQL expression generators.
 */

export type DateGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day';

/**
 * Group a date value into a bucket string.
 * Handles Date objects, ISO strings, and numeric timestamps.
 */
export function groupDate(value: unknown, granularity: DateGranularity): string {
  if (value === null || value === undefined) return '';

  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  switch (granularity) {
    case 'year':
      return String(date.getFullYear());

    case 'quarter': {
      const q = Math.ceil((date.getMonth() + 1) / 3);
      return `Q${q} ${date.getFullYear()}`;
    }

    case 'month': {
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${date.getFullYear()}-${m}`;
    }

    case 'week': {
      // ISO week number
      const target = new Date(date.getTime());
      target.setHours(0, 0, 0, 0);
      // Set to nearest Thursday: current date + 4 - current day number (Mon=1..Sun=7)
      const dayNum = target.getDay() || 7;
      target.setDate(target.getDate() + 4 - dayNum);
      const yearStart = new Date(target.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${target.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }

    case 'day': {
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${m}-${d}`;
    }
  }
}

/**
 * Pre-process rows, adding a bucketed field for pivot/grouping.
 * Returns new array with the output field added to each row.
 */
export function addDateBuckets(
  rows: Record<string, unknown>[],
  field: string,
  granularity: DateGranularity,
  outputField?: string,
): Record<string, unknown>[] {
  const outField = outputField ?? `${field}_${granularity}`;
  return rows.map(row => ({
    ...row,
    [outField]: groupDate(row[field], granularity),
  }));
}

/**
 * Generate a DuckDB SQL expression for date bucketing.
 * The returned expression can be used in SELECT / GROUP BY clauses.
 */
export function dateGroupingSQL(field: string, granularity: DateGranularity): string {
  const quoted = `"${field}"`;

  switch (granularity) {
    case 'year':
      return `CAST(EXTRACT(YEAR FROM ${quoted}) AS INTEGER)`;

    case 'quarter':
      return `'Q' || EXTRACT(QUARTER FROM ${quoted}) || ' ' || EXTRACT(YEAR FROM ${quoted})`;

    case 'month':
      return `STRFTIME(${quoted}, '%Y-%m')`;

    case 'week':
      return `STRFTIME(${quoted}, '%G-W%V')`;

    case 'day':
      return `CAST(${quoted} AS DATE)`;
  }
}
