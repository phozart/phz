import { describe, it, expect, afterEach } from 'vitest';
import { createLocalServer, resolveConfig } from '../local-server.js';
import type { LocalServer, LocalServerConfig } from '../local-server.js';
import { homedir } from 'node:os';
import { join } from 'node:path';

describe('LocalServer config', () => {
  it('resolveConfig applies defaults', () => {
    const config = resolveConfig();
    expect(config.port).toBe(3847);
    expect(config.dataDir).toBe(join(homedir(), '.phz'));
    expect(config.openBrowser).toBe(true);
    expect(config.watchDir).toBe('');
    expect(config.cors).toBe(true);
  });

  it('resolveConfig applies overrides', () => {
    const config = resolveConfig({
      port: 8080,
      dataDir: '/tmp/phz-test',
      openBrowser: false,
      watchDir: '/data',
      cors: false,
    });
    expect(config.port).toBe(8080);
    expect(config.dataDir).toBe('/tmp/phz-test');
    expect(config.openBrowser).toBe(false);
    expect(config.watchDir).toBe('/data');
    expect(config.cors).toBe(false);
  });

  it('resolveConfig partial overrides', () => {
    const config = resolveConfig({ port: 9000 });
    expect(config.port).toBe(9000);
    expect(config.dataDir).toBe(join(homedir(), '.phz'));
  });
});

describe('LocalServer lifecycle', () => {
  let server: LocalServer | null = null;

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
  });

  it('creates a server with defaults', async () => {
    server = await createLocalServer({ port: 0 });
    expect(server).toBeDefined();
    expect(typeof server.start).toBe('function');
    expect(typeof server.stop).toBe('function');
    expect(typeof server.getPort).toBe('function');
    expect(typeof server.getDataDir).toBe('function');
  });

  it('getPort returns configured port', async () => {
    server = await createLocalServer({ port: 4567 });
    expect(server.getPort()).toBe(4567);
  });

  it('getDataDir returns configured data dir', async () => {
    server = await createLocalServer({ dataDir: '/tmp/test-phz' });
    expect(server.getDataDir()).toBe('/tmp/test-phz');
  });

  it('starts and stops without error', async () => {
    // Use a random high port to avoid conflicts
    const port = 30000 + Math.floor(Math.random() * 10000);
    server = await createLocalServer({ port, openBrowser: false });
    await server.start();
    await server.stop();
    server = null; // Already stopped
  });

  it('stop is safe to call when not started', async () => {
    server = await createLocalServer({ port: 4568 });
    // Should not throw
    await server.stop();
    server = null;
  });

  it('health endpoint responds', async () => {
    const port = 30000 + Math.floor(Math.random() * 10000);
    server = await createLocalServer({ port, openBrowser: false });
    await server.start();

    const response = await fetch(`http://127.0.0.1:${port}/health`);
    expect(response.ok).toBe(true);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.port).toBe(port);
  });

  it('unknown routes return 404', async () => {
    const port = 30000 + Math.floor(Math.random() * 10000);
    server = await createLocalServer({ port, openBrowser: false });
    await server.start();

    const response = await fetch(`http://127.0.0.1:${port}/nonexistent`);
    expect(response.status).toBe(404);
  });
});
