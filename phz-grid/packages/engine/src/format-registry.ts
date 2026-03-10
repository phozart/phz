/**
 * @phozart/phz-engine — FormatRegistry
 *
 * Instance-based registry of named formatters. Each BIEngine instance gets
 * its own FormatRegistry so custom formatters are scoped per-engine.
 * Ships with 8 built-in formatters.
 */

/** A format function that converts a value to a display string. */
export type FormatFunction = (value: unknown, locale?: string) => string;

export class FormatRegistry {
  private readonly formatters = new Map<string, FormatFunction>();

  constructor(locale: string = 'en-US') {
    // --- Built-in formatters ---

    this.register('currency', (v, loc) => {
      if (v == null || typeof v !== 'number') return '';
      return new Intl.NumberFormat(loc ?? locale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(v);
    });

    this.register('percentage', (v) => {
      if (v == null || typeof v !== 'number') return '';
      return `${(v * 100).toFixed(1)}%`;
    });

    this.register('date-short', (v) => {
      if (v == null) return '';
      const d = v instanceof Date ? v : new Date(String(v));
      if (isNaN(d.getTime())) return String(v);
      const day = d.getDate();
      const month = MONTHS_SHORT[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    });

    this.register('date-long', (v, loc) => {
      if (v == null) return '';
      const d = v instanceof Date ? v : new Date(String(v));
      if (isNaN(d.getTime())) return String(v);
      return d.toLocaleDateString(loc ?? locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    });

    this.register('compact', (v) => {
      if (v == null || typeof v !== 'number') return '';
      return formatCompact(v);
    });

    this.register('badge', (v) => String(v ?? ''));

    this.register('weight', (v) => {
      if (v == null || typeof v !== 'number') return '';
      return `${v.toFixed(1)} kg`;
    });

    this.register('duration', (v) => {
      if (v == null || typeof v !== 'number') return '';
      const totalMinutes = Math.round(v);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    });
  }

  /** Register a named formatter. Overwrites if name already exists. */
  register(name: string, fn: FormatFunction): void {
    this.formatters.set(name, fn);
  }

  /** Get a formatter by name. Returns undefined if not registered. */
  get(name: string): FormatFunction | undefined {
    return this.formatters.get(name);
  }

  /** Check whether a formatter is registered. */
  has(name: string): boolean {
    return this.formatters.has(name);
  }

  /** Format a value using a named formatter. Returns empty string if formatter not found. */
  format(value: unknown, name: string, locale?: string): string {
    const fn = this.formatters.get(name);
    if (!fn) return '';
    return fn(value, locale);
  }

  /** Remove all registered formatters including built-ins. */
  clear(): void {
    this.formatters.clear();
  }
}

// --- Helpers ---

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
