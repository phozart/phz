import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FetchWorkspaceAdapter } from '../adapters/fetch-adapter.js';

describe('FetchWorkspaceAdapter', () => {
  let adapter: FetchWorkspaceAdapter;
  const mockFetch = vi.fn();
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    adapter = new FetchWorkspaceAdapter({
      baseUrl: 'https://api.example.com',
      headers: { Authorization: 'Bearer token' },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('initialize calls health endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.initialize();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/health',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('initialize throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' });
    await expect(adapter.initialize()).rejects.toThrow();
  });

  // --- Reports ---

  it('saveReport sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.saveReport({ id: 'r1', name: 'Test' } as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/reports',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loadReports sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.loadReports();
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/reports',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('deleteReport sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.deleteReport('r1' as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/reports/r1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // --- Dashboards ---

  it('saveDashboard sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.saveDashboard({ id: 'd1', name: 'Exec' } as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/dashboards',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loadDashboards sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.loadDashboards();
    expect(result).toEqual([]);
  });

  it('deleteDashboard sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.deleteDashboard('d1' as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/dashboards/d1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // --- KPIs ---

  it('saveKPI sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.saveKPI({ id: 'k1', name: 'NPS' } as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/kpis',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loadKPIs sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.loadKPIs();
    expect(result).toEqual([]);
  });

  it('deleteKPI sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.deleteKPI('k1' as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/kpis/k1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // --- Metrics ---

  it('saveMetric sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.saveMetric({ id: 'm1', name: 'Revenue' } as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/metrics',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loadMetrics sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.loadMetrics();
    expect(result).toEqual([]);
  });

  it('deleteMetric sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.deleteMetric('m1' as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/metrics/m1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // --- Placements ---

  it('savePlacement sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'p1' }) });
    const result = await adapter.savePlacement({ id: 'p1' } as any);
    expect(result).toEqual({ id: 'p1' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/placements',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loadPlacements sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.loadPlacements();
    expect(result).toEqual([]);
  });

  it('loadPlacements with filter appends query params', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    await adapter.loadPlacements({ artifactType: 'report', target: 'home' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('artifactType=report');
    expect(url).toContain('target=home');
  });

  it('deletePlacement sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.deletePlacement('p1' as any);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/placements/p1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // --- Definitions ---

  it('save definition sends POST', async () => {
    const def = { id: 'def1', name: 'Grid' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(def) });
    const result = await adapter.save(def as any);
    expect(result).toEqual(def);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/definitions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('load definition sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'def1' }) });
    const result = await adapter.load('def1' as any);
    expect(result).toEqual({ id: 'def1' });
  });

  it('load definition returns undefined on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await adapter.load('missing' as any);
    expect(result).toBeUndefined();
  });

  it('list definitions sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.list();
    expect(result).toEqual([]);
  });

  it('delete definition sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ deleted: true }) });
    const result = await adapter.delete('def1' as any);
    expect(result).toBe(true);
  });

  // --- Catalog ---

  it('listArtifacts sends GET', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const result = await adapter.listArtifacts();
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/artifacts',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('listArtifacts with filter appends query params', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    await adapter.listArtifacts({ type: 'report', search: 'sales' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('type=report');
    expect(url).toContain('search=sales');
  });

  // --- Clear ---

  it('clear sends POST to clear endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await adapter.clear();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/clear',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  // --- Error handling ---

  it('throws on non-ok response for mutations', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });
    await expect(adapter.saveReport({ id: 'r1' } as any)).rejects.toThrow();
  });
});
