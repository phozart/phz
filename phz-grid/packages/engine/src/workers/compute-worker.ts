/**
 * @phozart/engine — Web Worker Entry Point
 *
 * Receives WorkerRequest messages and responds with WorkerResponse.
 * Offloads JS compute (aggregation, pivot, filter, calculated fields)
 * to a background thread so the UI thread stays responsive.
 */

import type { WorkerRequest, WorkerResponse } from './compute-worker-protocol.js';
import { JSComputeBackend } from '../compute-backend.js';

const backend = new JSComputeBackend();
let currentData: Record<string, unknown>[] = [];

function respond(msg: WorkerResponse): void {
  (self as unknown as { postMessage(msg: WorkerResponse): void }).postMessage(msg);
}

(self as unknown as { onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null }).onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    switch (req.type) {
      case 'setData':
        currentData = req.data;
        respond({ type: 'result', id: req.id, data: null });
        break;

      case 'aggregate': {
        const result = await backend.aggregate(currentData, req.config);
        respond({ type: 'result', id: req.id, data: result });
        break;
      }

      case 'pivot': {
        const result = await backend.pivot(currentData, req.config);
        respond({ type: 'result', id: req.id, data: result });
        break;
      }

      case 'filter': {
        const result = await backend.filter(currentData, req.criteria);
        respond({ type: 'result', id: req.id, data: result });
        break;
      }

      case 'computeCalc': {
        const result = await backend.computeCalculatedFields(currentData, req.fields);
        respond({ type: 'result', id: req.id, data: result });
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    respond({ type: 'error', id: req.id, error: message });
  }
};
