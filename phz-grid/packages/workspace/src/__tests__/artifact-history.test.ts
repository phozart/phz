import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryWorkspaceAdapter } from '../adapters/memory-adapter.js';
import {
  hasHistorySupport,
  generateChangeDescription,
  type VersionSummary,
} from '../workspace-adapter.js';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import { reportId } from '@phozart/phz-engine';
import type { ReportConfig } from '@phozart/phz-engine';

function makeReport(id: string, name: string): ReportConfig {
  return { id: reportId(id), name } as ReportConfig;
}

describe('ArtifactHistory', () => {
  describe('hasHistorySupport type guard', () => {
    it('returns true for MemoryWorkspaceAdapter', () => {
      const adapter = new MemoryWorkspaceAdapter();
      expect(hasHistorySupport(adapter)).toBe(true);
    });

    it('returns false for adapter without history methods', () => {
      // Create a minimal adapter mock without history
      const adapter = {
        savePlacement: async () => ({} as any),
        loadPlacements: async () => [],
        deletePlacement: async () => {},
        listArtifacts: async () => [],
        initialize: async () => {},
        clear: async () => {},
      } as unknown as WorkspaceAdapter;
      expect(hasHistorySupport(adapter)).toBe(false);
    });
  });

  describe('generateChangeDescription', () => {
    it('returns "Initial version" for undefined previous', () => {
      const desc = generateChangeDescription(undefined, { name: 'Report A' });
      expect(desc).toBe('Initial version');
    });

    it('describes added fields', () => {
      const prev = { name: 'Report A' };
      const curr = { name: 'Report A', description: 'Sales data' };
      const desc = generateChangeDescription(prev, curr);
      expect(desc).toContain('Added');
      expect(desc).toContain('description');
    });

    it('describes removed fields', () => {
      const prev = { name: 'Report A', description: 'Old' };
      const curr = { name: 'Report A' };
      const desc = generateChangeDescription(prev, curr);
      expect(desc).toContain('Removed');
      expect(desc).toContain('description');
    });

    it('describes modified fields', () => {
      const prev = { name: 'Report A' };
      const curr = { name: 'Report B' };
      const desc = generateChangeDescription(prev, curr);
      expect(desc).toContain('Modified');
      expect(desc).toContain('name');
    });

    it('returns "No changes" for identical objects', () => {
      const obj = { name: 'Report A', value: 42 };
      const desc = generateChangeDescription(obj, { ...obj });
      expect(desc).toBe('No changes');
    });
  });

  describe('MemoryWorkspaceAdapter history', () => {
    let adapter: MemoryWorkspaceAdapter;

    beforeEach(async () => {
      adapter = new MemoryWorkspaceAdapter();
      await adapter.initialize();
    });

    it('saves report versions automatically', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      await adapter.saveReport({ ...r, name: 'V2' });
      await adapter.saveReport({ ...r, name: 'V3' });

      const history = await adapter.getArtifactHistory('r1');
      expect(history).toHaveLength(3);
      expect(history[0].version).toBe(3); // most recent first
      expect(history[2].version).toBe(1);
    });

    it('getArtifactVersion retrieves a specific version', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      await adapter.saveReport({ ...r, name: 'V2' });

      const v1 = await adapter.getArtifactVersion('r1', 1) as ReportConfig;
      expect(v1.name).toBe('V1');

      const v2 = await adapter.getArtifactVersion('r1', 2) as ReportConfig;
      expect(v2.name).toBe('V2');
    });

    it('returns empty history for unknown artifact', async () => {
      const history = await adapter.getArtifactHistory('nonexistent');
      expect(history).toEqual([]);
    });

    it('returns undefined for unknown version', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      const v99 = await adapter.getArtifactVersion('r1', 99);
      expect(v99).toBeUndefined();
    });

    it('respects limit option', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      await adapter.saveReport({ ...r, name: 'V2' });
      await adapter.saveReport({ ...r, name: 'V3' });

      const history = await adapter.getArtifactHistory('r1', { limit: 2 });
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(3);
      expect(history[1].version).toBe(2);
    });

    it('respects before option', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      await adapter.saveReport({ ...r, name: 'V2' });
      await adapter.saveReport({ ...r, name: 'V3' });

      const history = await adapter.getArtifactHistory('r1', { before: 3 });
      expect(history.every(h => h.version < 3)).toBe(true);
    });

    it('restoreArtifactVersion replaces current with old version', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      await adapter.saveReport({ ...r, name: 'V2' });

      await adapter.restoreArtifactVersion('r1', 1);

      const reports = await adapter.loadReports();
      expect(reports[0].name).toBe('V1');
    });

    it('version summary includes sizeBytes', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);

      const history = await adapter.getArtifactHistory('r1');
      expect(history[0].sizeBytes).toBeGreaterThan(0);
    });

    it('clear resets history', async () => {
      const r = makeReport('r1', 'V1');
      await adapter.saveReport(r);
      await adapter.saveReport({ ...r, name: 'V2' });

      await adapter.clear();

      const history = await adapter.getArtifactHistory('r1');
      expect(history).toEqual([]);
    });
  });
});
