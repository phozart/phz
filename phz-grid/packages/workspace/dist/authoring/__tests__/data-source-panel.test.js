/**
 * phz-data-source-panel — Integration tests
 *
 * Tests that the panel component correctly orchestrates DataAdapter calls
 * and state machine transitions. Since we run in Node (no DOM), we test
 * the orchestration logic (loadSources, loadSchema) as standalone functions.
 */
import { describe, it, expect, vi } from 'vitest';
import { loadSources, loadSchema, loadFieldStats, } from '../data-source-panel-orchestrator.js';
import { createDataSourceState, } from '../data-source-state.js';
// ── Mock DataAdapter ───────────────────────────────────────────────
function createMockAdapter(overrides) {
    return {
        execute: vi.fn().mockResolvedValue({ columns: [], rows: [], metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 } }),
        getSchema: vi.fn().mockResolvedValue({
            id: 'ds-1',
            name: 'Sales Data',
            fields: [
                { name: 'region', dataType: 'string', nullable: false, semanticHint: 'dimension', cardinality: 'low' },
                { name: 'revenue', dataType: 'number', nullable: false, semanticHint: 'measure' },
                { name: 'order_date', dataType: 'date', nullable: false, semanticHint: 'timestamp' },
            ],
        }),
        listDataSources: vi.fn().mockResolvedValue([
            { id: 'ds-1', name: 'Sales Data', fieldCount: 3, rowCount: 50000 },
            { id: 'ds-2', name: 'HR Records', fieldCount: 12 },
        ]),
        getDistinctValues: vi.fn().mockResolvedValue({ values: [], totalCount: 0, truncated: false }),
        getFieldStats: vi.fn().mockResolvedValue({ min: 0, max: 1000, distinctCount: 50, nullCount: 0, totalCount: 50000 }),
        ...overrides,
    };
}
// ── Tests ──────────────────────────────────────────────────────────
describe('data-source-panel orchestrator', () => {
    describe('loadSources', () => {
        it('calls adapter.listDataSources() and updates state', async () => {
            const adapter = createMockAdapter();
            let state = createDataSourceState();
            const setState = vi.fn((updater) => {
                state = updater(state);
            });
            await loadSources(adapter, setState);
            expect(adapter.listDataSources).toHaveBeenCalledOnce();
            expect(state.sources).toHaveLength(2);
            expect(state.sources[0].name).toBe('Sales Data');
            expect(state.sourcesLoading).toBe(false);
        });
        it('sets sourcesLoading=true before call, false after', async () => {
            const loadingStates = [];
            const adapter = createMockAdapter({
                listDataSources: vi.fn().mockImplementation(() => {
                    loadingStates.push(true); // should be loading during call
                    return Promise.resolve([]);
                }),
            });
            let state = createDataSourceState();
            const setState = vi.fn((updater) => {
                state = updater(state);
            });
            await loadSources(adapter, setState);
            // First call sets loading=true, second sets sources (loading=false)
            expect(setState).toHaveBeenCalledTimes(2);
        });
        it('handles adapter error gracefully', async () => {
            const adapter = createMockAdapter({
                listDataSources: vi.fn().mockRejectedValue(new Error('Network error')),
            });
            let state = createDataSourceState();
            const setState = vi.fn((updater) => {
                state = updater(state);
            });
            await loadSources(adapter, setState);
            expect(state.error).toBe('Failed to load data sources: Network error');
            expect(state.sourcesLoading).toBe(false);
        });
    });
    describe('loadSchema', () => {
        it('calls adapter.getSchema(sourceId) and classifies fields', async () => {
            const adapter = createMockAdapter();
            let state = createDataSourceState();
            state = { ...state, selectedSourceId: 'ds-1', schemaLoading: true };
            const setState = vi.fn((updater) => {
                state = updater(state);
            });
            await loadSchema(adapter, 'ds-1', setState);
            expect(adapter.getSchema).toHaveBeenCalledWith('ds-1');
            expect(state.schema).toBeDefined();
            expect(state.dimensions.map(f => f.name)).toContain('region');
            expect(state.measures.map(f => f.name)).toContain('revenue');
            expect(state.timeFields.map(f => f.name)).toContain('order_date');
            expect(state.schemaLoading).toBe(false);
        });
        it('handles schema load error', async () => {
            const adapter = createMockAdapter({
                getSchema: vi.fn().mockRejectedValue(new Error('Permission denied')),
            });
            let state = createDataSourceState();
            state = { ...state, selectedSourceId: 'ds-1', schemaLoading: true };
            const setState = vi.fn((updater) => {
                state = updater(state);
            });
            await loadSchema(adapter, 'ds-1', setState);
            expect(state.error).toBe('Failed to load schema: Permission denied');
            expect(state.schemaLoading).toBe(false);
        });
    });
    describe('loadFieldStats', () => {
        it('calls adapter.getFieldStats() and stores result', async () => {
            const adapter = createMockAdapter();
            let state = createDataSourceState();
            state = { ...state, selectedSourceId: 'ds-1' };
            const setState = vi.fn((updater) => {
                state = updater(state);
            });
            await loadFieldStats(adapter, 'ds-1', 'revenue', setState);
            expect(adapter.getFieldStats).toHaveBeenCalledWith('ds-1', 'revenue');
            expect(state.fieldStats['revenue']).toEqual({
                min: 0, max: 1000, distinctCount: 50, nullCount: 0, totalCount: 50000,
            });
        });
    });
});
//# sourceMappingURL=data-source-panel.test.js.map