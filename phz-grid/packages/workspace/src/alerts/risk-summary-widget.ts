/**
 * @phozart/workspace — Risk Summary Widget (N.3)
 *
 * Pure functions for computing risk summaries from breaches
 * and generating visual breach indicator CSS.
 */

import type { BreachRecord } from '../types.js';

export interface RiskSummaryConfig {
  showBySeverity: boolean;
  showAffectedArtifacts: boolean;
}

export interface RiskSummaryData {
  totalActive: number;
  bySeverity: { critical: number; warning: number; info: number };
  highestSeverity: BreachRecord['severity'] | undefined;
  affectedArtifacts: string[];
}

export interface BreachIndicatorConfig {
  className: string;
}

const SEVERITY_ORDER: BreachRecord['severity'][] = ['critical', 'warning', 'info'];

export function computeRiskSummary(breaches: BreachRecord[]): RiskSummaryData {
  const active = breaches.filter(b => b.status === 'active');

  const bySeverity = { critical: 0, warning: 0, info: 0 };
  const artifactSet = new Set<string>();

  for (const b of active) {
    bySeverity[b.severity]++;
    artifactSet.add(b.artifactId);
  }

  let highestSeverity: BreachRecord['severity'] | undefined;
  for (const sev of SEVERITY_ORDER) {
    if (bySeverity[sev] > 0) {
      highestSeverity = sev;
      break;
    }
  }

  return {
    totalActive: active.length,
    bySeverity,
    highestSeverity,
    affectedArtifacts: Array.from(artifactSet),
  };
}

// --- Breach visual indicators ---

export function withBreachIndicator(
  severity: BreachRecord['severity'] | undefined,
): BreachIndicatorConfig {
  if (!severity) return { className: '' };
  return { className: `phz-breach-${severity}` };
}

const SEVERITY_COLORS: Record<BreachRecord['severity'], string> = {
  critical: 'var(--phz-breach-critical, #dc2626)',
  warning: 'var(--phz-breach-warning, #f59e0b)',
  info: 'var(--phz-breach-info, #3b82f6)',
};

export function getBreachBorderCSS(severity: BreachRecord['severity'] | undefined): string {
  if (!severity) return '';
  return `border: 2px solid ${SEVERITY_COLORS[severity]};`;
}

export function getBreachGlowCSS(severity: BreachRecord['severity'] | undefined): string {
  if (!severity) return '';
  return `box-shadow: 0 0 8px 2px ${SEVERITY_COLORS[severity]};`;
}
