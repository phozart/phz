/**
 * Rust data-service client.
 *
 * All source-data queries route through the Rust service when available.
 * Falls back to direct PG (via Next.js API routes) when the service is down.
 */

/** Server-side URL (container-to-container or localhost) */
export const DATA_SERVICE_URL =
  process.env.DATA_SERVICE_URL ?? 'http://localhost:8080';

/** Client-side URL (browser → Rust service) */
export const DATA_SERVICE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_DATA_SERVICE_URL ?? 'http://localhost:8080';

/** Cache the Rust service availability to avoid repeated slow timeouts */
let rustAvailable: boolean | null = null;
let lastHealthCheck = 0;
let pendingCheck: Promise<boolean> | null = null;
const HEALTH_CHECK_INTERVAL = 30_000; // re-check every 30s

/**
 * Quick health check — 500ms timeout (localhost should respond instantly).
 * Caches result for 30s. Deduplicates concurrent calls.
 */
async function isRustServiceAvailable(): Promise<boolean> {
  const now = Date.now();
  if (rustAvailable !== null && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return rustAvailable;
  }
  // Deduplicate: if a check is already in-flight, reuse it
  if (pendingCheck) return pendingCheck;

  pendingCheck = (async () => {
    try {
      await fetch(`${DATA_SERVICE_URL}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(500),
      });
      rustAvailable = true;
    } catch {
      rustAvailable = false;
    }
    lastHealthCheck = Date.now();
    pendingCheck = null;
    return rustAvailable;
  })();

  return pendingCheck;
}

/**
 * Proxy a data request to the Rust service.
 * Returns the Response if successful, or null if the service is unreachable.
 * Does a fast health check first to avoid 120s timeouts when Rust is down.
 */
export async function proxyToDataService(
  path: string,
  headers?: Record<string, string>,
): Promise<Response | null> {
  // Fast bail-out if Rust is known to be down
  if (!(await isRustServiceAvailable())) return null;

  try {
    const url = `${DATA_SERVICE_URL}${path}`;
    const res = await fetch(url, {
      headers: {
        // Forward auth headers for future use
        ...(headers ?? {}),
      },
      signal: AbortSignal.timeout(120_000),
    });
    return res;
  } catch {
    // Service unreachable — mark as down and let caller fall back
    rustAvailable = false;
    return null;
  }
}
