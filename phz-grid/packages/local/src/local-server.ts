/**
 * @phozart/local — Local Server
 *
 * Lightweight local Node.js server for the phz-grid workspace.
 * Binds to localhost only, serves workspace API endpoints,
 * and manages filesystem-backed persistence.
 */

import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface LocalServerConfig {
  port?: number;
  dataDir?: string;
  openBrowser?: boolean;
  watchDir?: string;
  cors?: boolean;
}

export interface LocalServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getPort(): number;
  getDataDir(): string;
}

export function resolveConfig(config?: Partial<LocalServerConfig>): Required<LocalServerConfig> {
  return {
    port: config?.port ?? 3847,
    dataDir: config?.dataDir ?? join(homedir(), '.phz'),
    openBrowser: config?.openBrowser ?? true,
    watchDir: config?.watchDir ?? '',
    cors: config?.cors ?? true,
  };
}

export async function createLocalServer(config?: LocalServerConfig): Promise<LocalServer> {
  const resolved = resolveConfig(config);
  let server: Server | null = null;

  function handleRequest(
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
  ): void {
    // CORS headers (localhost only)
    if (resolved.cors) {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', port: resolved.port, dataDir: resolved.dataDir }));
      return;
    }

    // 404 for unhandled routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  return {
    async start() {
      server = createServer(handleRequest);

      await new Promise<void>((resolve, reject) => {
        server!.on('error', reject);
        // Bind to localhost only (127.0.0.1) for security
        server!.listen(resolved.port, '127.0.0.1', () => resolve());
      });
    },

    async stop() {
      if (!server) return;
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
      server = null;
    },

    getPort() {
      return resolved.port;
    },

    getDataDir() {
      return resolved.dataDir;
    },
  };
}
