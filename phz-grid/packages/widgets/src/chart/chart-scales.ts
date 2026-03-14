/**
 * @phozart/widgets — Chart Scale Computation
 *
 * Pure functions for computing chart scales: linear (nice), band (categorical),
 * and time scales. Consolidates the duplicated computeNiceScale() from
 * phz-line-chart.ts and phz-scatter-chart.ts.
 *
 * Zero DOM dependency — fully unit-testable.
 */

// ========================================================================
// Linear Scale (Nice)
// ========================================================================

export interface LinearScaleResult {
  min: number;
  max: number;
  ticks: number[];
  step: number;
}

/**
 * Compute a "nice" linear scale with human-readable tick values.
 * Uses the 1-2-5-10 tick step rounding convention.
 *
 * Handles edge cases: equal min/max, zero range, negative values.
 */
export function computeNiceScale(
  min: number,
  max: number,
  targetTicks: number = 5,
): LinearScaleResult {
  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
    return computeNiceScale(min - padding, max + padding, targetTicks);
  }

  const range = max - min;
  const roughStep = range / (targetTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }

  return { min: niceMin, max: niceMax, ticks, step: niceStep };
}

// ========================================================================
// Band Scale (Categorical/Ordinal)
// ========================================================================

export interface BandScaleResult {
  /** Maps category value → center pixel position. */
  positions: Map<string, number>;
  /** Width of each band in pixels. */
  bandwidth: number;
  /** Ordered category values. */
  domain: string[];
}

/**
 * Compute a band scale for categorical/ordinal data.
 * Each category gets an equal-width band within the available range.
 *
 * @param categories - Unique category values in display order
 * @param rangeStart - Start pixel (e.g., left padding)
 * @param rangeEnd - End pixel (e.g., chart width - right padding)
 * @param paddingInner - Fraction of bandwidth used as gap between bands (0-1). Default: 0.1
 * @param paddingOuter - Fraction of bandwidth used as outer padding (0-1). Default: 0.05
 */
export function computeBandScale(
  categories: string[],
  rangeStart: number,
  rangeEnd: number,
  paddingInner: number = 0.1,
  paddingOuter: number = 0.05,
): BandScaleResult {
  if (categories.length === 0) {
    return { positions: new Map(), bandwidth: 0, domain: [] };
  }

  const totalRange = rangeEnd - rangeStart;
  const n = categories.length;

  // Total "steps" including inner padding
  // Each band takes 1 unit, inner padding takes paddingInner units, outer takes paddingOuter units
  const totalSteps = n + (n - 1) * paddingInner + 2 * paddingOuter;
  const stepSize = totalRange / totalSteps;
  const bandwidth = stepSize;

  const positions = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const offset = paddingOuter + i * (1 + paddingInner);
    positions.set(categories[i], rangeStart + offset * stepSize + bandwidth / 2);
  }

  return { positions, bandwidth, domain: categories };
}

// ========================================================================
// Time Scale
// ========================================================================

export interface TimeScaleResult {
  min: number;
  max: number;
  ticks: Date[];
  /** Maps a timestamp to a pixel position. */
  scale: (timestamp: number) => number;
}

/**
 * Compute a time scale with date-aware tick placement.
 * Auto-detects the appropriate time unit for ticks based on the range.
 *
 * @param timestamps - Array of timestamps (milliseconds since epoch)
 * @param rangeStart - Start pixel
 * @param rangeEnd - End pixel
 */
export function computeTimeScale(
  timestamps: number[],
  rangeStart: number,
  rangeEnd: number,
): TimeScaleResult {
  if (timestamps.length === 0) {
    const now = Date.now();
    return {
      min: now,
      max: now,
      ticks: [new Date(now)],
      scale: () => (rangeStart + rangeEnd) / 2,
    };
  }

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const range = max - min;

  // Choose tick interval based on data range
  const ticks = generateTimeTicks(min, max, range);

  const totalRange = rangeEnd - rangeStart;
  const dataRange = max - min || 1;

  const scale = (timestamp: number): number => {
    return rangeStart + ((timestamp - min) / dataRange) * totalRange;
  };

  return { min, max, ticks, scale };
}

function generateTimeTicks(min: number, max: number, range: number): Date[] {
  const DAY = 86400000;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;

  let interval: number;
  let align: (d: Date) => Date;

  if (range <= DAY * 2) {
    // Hours
    interval = 3600000 * Math.max(1, Math.ceil(range / (3600000 * 6)));
    align = (d: Date) => {
      d.setMinutes(0, 0, 0);
      return d;
    };
  } else if (range <= MONTH) {
    // Days
    interval = DAY * Math.max(1, Math.ceil(range / (DAY * 7)));
    align = (d: Date) => {
      d.setHours(0, 0, 0, 0);
      return d;
    };
  } else if (range <= YEAR) {
    // Months
    interval = MONTH;
    align = (d: Date) => {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    };
  } else {
    // Years
    interval = YEAR;
    align = (d: Date) => {
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    };
  }

  const ticks: Date[] = [];
  const start = align(new Date(min));
  let current = start.getTime();

  while (current <= max + interval * 0.01) {
    ticks.push(new Date(current));
    current += interval;
  }

  // Limit to reasonable number of ticks
  if (ticks.length > 12) {
    const step = Math.ceil(ticks.length / 8);
    return ticks.filter((_, i) => i % step === 0 || i === ticks.length - 1);
  }

  return ticks;
}

// ========================================================================
// Responsive Tick Count
// ========================================================================

/**
 * Determine optimal tick count based on available pixel width.
 * Ensures labels don't overlap by targeting ~80px per tick.
 */
export function responsiveTickCount(availableWidth: number, minPxPerTick: number = 80): number {
  return Math.max(2, Math.floor(availableWidth / minPxPerTick));
}
