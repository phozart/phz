/**
 * @phozart/engine — Web Worker Compute Protocol
 *
 * Typed message protocol for communication between the main thread
 * (WorkerComputeBackend) and the Web Worker (compute-worker.ts).
 */

import type { AggregationConfig, PivotConfig } from '@phozart/core';
import type { ComputeFilterInput, CalculatedFieldInput } from '../compute-backend.js';

export type WorkerRequest =
  | { type: 'setData'; id: string; data: Record<string, unknown>[] }
  | { type: 'aggregate'; id: string; config: AggregationConfig }
  | { type: 'pivot'; id: string; config: PivotConfig }
  | { type: 'filter'; id: string; criteria: ComputeFilterInput[] }
  | { type: 'computeCalc'; id: string; fields: CalculatedFieldInput[] };

export type WorkerResponse =
  | { type: 'result'; id: string; data: unknown }
  | { type: 'error'; id: string; error: string; code?: string };
