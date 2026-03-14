/**
 * @phozart/workspace — Breach Highlight (L.8)
 *
 * CSS class helpers and breach bar data for dashboard breach visualization.
 */

import type { BreachRecord } from '../types.js';

type Severity = BreachRecord['severity'];

const SEVERITY_CSS: Record<Severity, string> = {
  info: 'phz-breach-info',
  warning: 'phz-breach-warning',
  critical: 'phz-breach-critical',
};

export function getBreachSeverityCSS(severity: Severity): string {
  return SEVERITY_CSS[severity];
}

export interface BreachBarData {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export function computeBreachBarData(breaches: BreachRecord[]): BreachBarData {
  const data: BreachBarData = { critical: 0, warning: 0, info: 0, total: 0 };
  for (const b of breaches) {
    data[b.severity]++;
    data.total++;
  }
  return data;
}

export function shouldPulse(severity: Severity): boolean {
  return severity === 'critical';
}
