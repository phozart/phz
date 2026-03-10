/**
 * @phozart/phz-workspace — Format Value Utility
 *
 * Formats numeric values according to UnitSpec using Intl.NumberFormat.
 * Also validates aggregation compatibility with field data types.
 */

import type { UnitSpec, FieldMetadata } from '../data-adapter.js';

// --- Aggregation Warning ---

export interface AggregationWarning {
  severity: 'warning' | 'error';
  message: string;
  field: string;
  aggregation: string;
}

// --- Duration suffixes ---

const DURATION_SUFFIXES: Record<string, string> = {
  seconds: 's',
  minutes: 'm',
  hours: 'h',
  days: 'd',
};

// --- Abbreviation ---

function abbreviateNumber(value: number, locale: string, decimalPlaces?: number): string {
  const formatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: decimalPlaces ?? 1,
  });
  return formatter.format(value);
}

// --- Main formatter ---

export function formatValue(
  value: number | null,
  unit: UnitSpec | undefined,
  locale: string,
  options?: { compact?: boolean },
): string {
  if (value === null) {
    return '\u2014'; // em-dash
  }

  if (unit === undefined) {
    if (options?.compact) {
      return abbreviateNumber(value, locale);
    }
    return new Intl.NumberFormat(locale).format(value);
  }

  switch (unit.type) {
    case 'currency': {
      if (unit.abbreviate) {
        const abbreviated = abbreviateNumber(value, locale, unit.decimalPlaces);
        const symbol = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: unit.currencyCode ?? 'USD',
          maximumFractionDigits: 0,
        }).format(0).replace(/[\d\s.,]/g, '').trim();
        return `${symbol}${abbreviated}`;
      }
      const fmt = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: unit.currencyCode ?? 'USD',
        minimumFractionDigits: unit.decimalPlaces ?? 2,
        maximumFractionDigits: unit.decimalPlaces ?? 2,
      });
      return fmt.format(value);
    }

    case 'percent': {
      const fmt = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: unit.decimalPlaces ?? 0,
        maximumFractionDigits: unit.decimalPlaces ?? 0,
      });
      return fmt.format(value);
    }

    case 'number': {
      if (unit.abbreviate || options?.compact) {
        let result = abbreviateNumber(value, locale, unit.decimalPlaces);
        if (unit.showSign && value > 0) {
          result = '+' + result;
        }
        return result;
      }

      const fmtOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: unit.decimalPlaces,
        maximumFractionDigits: unit.decimalPlaces,
      };
      if (unit.showSign) {
        fmtOptions.signDisplay = 'exceptZero';
      }
      const fmt = new Intl.NumberFormat(locale, fmtOptions);
      return fmt.format(value);
    }

    case 'duration': {
      const suffix = DURATION_SUFFIXES[unit.durationUnit ?? 'seconds'] ?? 's';
      const fmtOptions: Intl.NumberFormatOptions = {};
      if (unit.decimalPlaces !== undefined) {
        fmtOptions.minimumFractionDigits = unit.decimalPlaces;
        fmtOptions.maximumFractionDigits = unit.decimalPlaces;
      }
      const formatted = new Intl.NumberFormat(locale, fmtOptions).format(value);
      return `${formatted}${suffix}`;
    }

    case 'custom': {
      const fmtOptions: Intl.NumberFormatOptions = {};
      if (unit.decimalPlaces !== undefined) {
        fmtOptions.minimumFractionDigits = unit.decimalPlaces;
        fmtOptions.maximumFractionDigits = unit.decimalPlaces;
      }
      const formatted = new Intl.NumberFormat(locale, fmtOptions).format(value);
      return `${formatted}${unit.suffix ?? ''}`;
    }

    default:
      return new Intl.NumberFormat(locale).format(value);
  }
}

// --- Aggregation validation ---

const NUMERIC_ONLY_AGGREGATIONS = new Set([
  'sum', 'avg', 'median', 'stddev', 'variance',
]);

const UNIVERSAL_AGGREGATIONS = new Set([
  'count', 'countDistinct', 'count_distinct', 'first', 'last',
]);

const ORDERABLE_AGGREGATIONS = new Set([
  'min', 'max',
]);

export function validateAggregation(
  field: FieldMetadata,
  aggregation: string,
): AggregationWarning | null {
  // Universal aggregations work on any type
  if (UNIVERSAL_AGGREGATIONS.has(aggregation)) {
    return null;
  }

  // Orderable aggregations (min/max) work on number, date, string
  if (ORDERABLE_AGGREGATIONS.has(aggregation)) {
    if (field.dataType === 'boolean') {
      return {
        severity: 'error',
        message: `Cannot apply ${aggregation} to boolean field "${field.name}"`,
        field: field.name,
        aggregation,
      };
    }
    return null;
  }

  // Numeric-only aggregations
  if (NUMERIC_ONLY_AGGREGATIONS.has(aggregation)) {
    if (field.dataType !== 'number') {
      return {
        severity: 'error',
        message: `Cannot apply ${aggregation} to ${field.dataType} field "${field.name}". ${aggregation} requires a numeric field.`,
        field: field.name,
        aggregation,
      };
    }

    // Warn about nullable fields
    if (field.nullable) {
      return {
        severity: 'warning',
        message: `Field "${field.name}" is nullable. ${aggregation} will ignore null values, which may produce unexpected results.`,
        field: field.name,
        aggregation,
      };
    }

    return null;
  }

  // Unknown aggregation — allow but warn
  return {
    severity: 'warning',
    message: `Unknown aggregation "${aggregation}" on field "${field.name}"`,
    field: field.name,
    aggregation,
  };
}
