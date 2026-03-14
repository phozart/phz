/**
 * @phozart/engine — Base Types
 *
 * Branded ID types, config layers, and shared types for the BI engine.
 */

// --- Branded ID Types ---

export type KPIId = string & { readonly __brand: 'KPIId' };
export type MetricId = string & { readonly __brand: 'MetricId' };
export type ReportId = string & { readonly __brand: 'ReportId' };
export type DashboardId = string & { readonly __brand: 'DashboardId' };
export type WidgetId = string & { readonly __brand: 'WidgetId' };
export type DataProductId = string & { readonly __brand: 'DataProductId' };

// --- ID Factories ---

export function kpiId(id: string): KPIId { return id as KPIId; }
export function metricId(id: string): MetricId { return id as MetricId; }
export function reportId(id: string): ReportId { return id as ReportId; }
export function dashboardId(id: string): DashboardId { return id as DashboardId; }
export function widgetId(id: string): WidgetId { return id as WidgetId; }
export function dataProductId(id: string): DataProductId { return id as DataProductId; }

// --- Config Layers ---

export type ConfigLayer = 'system' | 'admin' | 'user';

// --- Validation ---

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

// --- Status ---

export type StatusLevel = 'ok' | 'warn' | 'crit' | 'unknown';

// --- ArtefactId Bridge ---
// Converts package-specific branded IDs to the generic ArtefactId
// used by the filter binding system. Prefixed to prevent collisions.

import type { ArtefactId } from '@phozart/core';
import { artefactId } from '@phozart/core';

export function reportArtefactId(id: ReportId): ArtefactId {
  return artefactId(`report:${id}`);
}

export function dashboardArtefactId(id: DashboardId): ArtefactId {
  return artefactId(`dashboard:${id}`);
}

export function widgetArtefactId(id: WidgetId): ArtefactId {
  return artefactId(`widget:${id}`);
}

export function parseArtefactId(id: ArtefactId): {
  type: 'report' | 'dashboard' | 'widget' | 'unknown';
  rawId: string;
} {
  const str = id as string;
  const colonIdx = str.indexOf(':');
  if (colonIdx === -1) return { type: 'unknown', rawId: str };
  const prefix = str.slice(0, colonIdx);
  const rawId = str.slice(colonIdx + 1);
  if (prefix === 'report' || prefix === 'dashboard' || prefix === 'widget') {
    return { type: prefix, rawId };
  }
  return { type: 'unknown', rawId: str };
}
