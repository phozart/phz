import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  URLConnectionConfig,
  APIConnectionConfig,
  RemoteConnection,
  RemoteDataConnector,
  ConnectionStatus,
} from '../adapters/remote-connector.js';
import {
  connectionId,
  createURLConnection,
  createAPIConnection,
  MemoryRemoteConnector,
} from '../adapters/remote-connector.js';

describe('Remote Connector Types', () => {
  it('creates a ConnectionId branded type', () => {
    const id = connectionId('conn-001');
    expect(typeof id).toBe('string');
    expect(id).toBe('conn-001');
  });

  it('URLConnectionConfig has correct shape', () => {
    const config: URLConnectionConfig = {
      url: 'https://example.com/data.csv',
      format: 'csv',
      refreshIntervalMs: 300_000,
    };
    expect(config.url).toBe('https://example.com/data.csv');
    expect(config.format).toBe('csv');
    expect(config.refreshIntervalMs).toBe(300_000);
  });

  it('URLConnectionConfig supports all format types', () => {
    const formats: URLConnectionConfig['format'][] = ['csv', 'json', 'parquet'];
    for (const format of formats) {
      const config: URLConnectionConfig = { url: 'https://example.com/data', format };
      expect(config.format).toBe(format);
    }
  });

  it('URLConnectionConfig optional fields', () => {
    const minimal: URLConnectionConfig = {
      url: 'https://example.com/data.json',
      format: 'json',
    };
    expect(minimal.refreshIntervalMs).toBeUndefined();
    expect(minimal.headers).toBeUndefined();
  });

  it('APIConnectionConfig has correct shape', () => {
    const config: APIConnectionConfig = {
      endpoint: 'https://api.example.com/v1/records',
      method: 'GET',
      headers: { Authorization: 'Bearer token123' },
      pagination: { type: 'offset', pageSize: 100 },
    };
    expect(config.endpoint).toBe('https://api.example.com/v1/records');
    expect(config.method).toBe('GET');
    expect(config.pagination?.type).toBe('offset');
  });

  it('APIConnectionConfig supports POST method', () => {
    const config: APIConnectionConfig = {
      endpoint: 'https://api.example.com/query',
      method: 'POST',
      body: JSON.stringify({ query: 'SELECT *' }),
    };
    expect(config.method).toBe('POST');
    expect(config.body).toBeDefined();
  });

  it('RemoteConnection has full shape', () => {
    const conn: RemoteConnection = {
      id: connectionId('conn-1'),
      name: 'Sales API',
      type: 'api',
      config: {
        endpoint: 'https://api.example.com/sales',
        method: 'GET',
      } as APIConnectionConfig,
      status: 'connected',
      createdAt: Date.now(),
      lastRefreshedAt: Date.now(),
    };
    expect(conn.type).toBe('api');
    expect(conn.status).toBe('connected');
  });

  it('ConnectionStatus covers all states', () => {
    const statuses: ConnectionStatus[] = ['idle', 'connecting', 'connected', 'error', 'refreshing'];
    expect(statuses).toHaveLength(5);
  });

  it('createURLConnection produces a valid RemoteConnection', () => {
    const conn = createURLConnection({
      name: 'My CSV',
      url: 'https://example.com/data.csv',
      format: 'csv',
    });
    expect(conn.id).toBeDefined();
    expect(conn.name).toBe('My CSV');
    expect(conn.type).toBe('url');
    expect(conn.status).toBe('idle');
    expect(conn.createdAt).toBeGreaterThan(0);
    const urlConfig = conn.config as URLConnectionConfig;
    expect(urlConfig.url).toBe('https://example.com/data.csv');
    expect(urlConfig.format).toBe('csv');
  });

  it('createAPIConnection produces a valid RemoteConnection', () => {
    const conn = createAPIConnection({
      name: 'Sales API',
      endpoint: 'https://api.example.com/sales',
      method: 'GET',
    });
    expect(conn.id).toBeDefined();
    expect(conn.name).toBe('Sales API');
    expect(conn.type).toBe('api');
    expect(conn.status).toBe('idle');
    const apiConfig = conn.config as APIConnectionConfig;
    expect(apiConfig.endpoint).toBe('https://api.example.com/sales');
  });
});

describe('MemoryRemoteConnector', () => {
  let connector: MemoryRemoteConnector;

  beforeEach(() => {
    connector = new MemoryRemoteConnector();
  });

  it('connectURL stores a URL connection', async () => {
    const conn = await connector.connectURL({
      name: 'Data',
      url: 'https://example.com/data.csv',
      format: 'csv',
    });
    expect(conn.type).toBe('url');
    expect(conn.status).toBe('connected');

    const list = await connector.listConnections();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(conn.id);
  });

  it('connectAPI stores an API connection', async () => {
    const conn = await connector.connectAPI({
      name: 'API',
      endpoint: 'https://api.example.com/data',
      method: 'GET',
    });
    expect(conn.type).toBe('api');
    expect(conn.status).toBe('connected');

    const list = await connector.listConnections();
    expect(list).toHaveLength(1);
  });

  it('listConnections returns all connections', async () => {
    await connector.connectURL({ name: 'CSV', url: 'https://a.com/d.csv', format: 'csv' });
    await connector.connectAPI({ name: 'API', endpoint: 'https://a.com/api', method: 'GET' });

    const list = await connector.listConnections();
    expect(list).toHaveLength(2);
  });

  it('removeConnection removes a connection by id', async () => {
    const conn = await connector.connectURL({ name: 'CSV', url: 'https://a.com/d.csv', format: 'csv' });
    await connector.removeConnection(conn.id);

    const list = await connector.listConnections();
    expect(list).toHaveLength(0);
  });

  it('removeConnection is a no-op for unknown id', async () => {
    await connector.removeConnection(connectionId('nonexistent'));
    const list = await connector.listConnections();
    expect(list).toHaveLength(0);
  });

  it('refresh updates lastRefreshedAt', async () => {
    const conn = await connector.connectURL({ name: 'CSV', url: 'https://a.com/d.csv', format: 'csv' });
    const before = conn.lastRefreshedAt;

    // Small delay to ensure timestamp difference
    await new Promise(r => setTimeout(r, 5));

    const refreshed = await connector.refresh(conn.id);
    expect(refreshed.lastRefreshedAt).toBeGreaterThanOrEqual(before ?? 0);
    expect(refreshed.status).toBe('connected');
  });

  it('refresh throws for unknown connection', async () => {
    await expect(connector.refresh(connectionId('nonexistent'))).rejects.toThrow('not found');
  });
});
