import { describe, it, expect } from 'vitest';
import { initialCatalogSearchState, setCatalogSearchMode, setCatalogSearchQuery, clearCatalogSearch, setCatalogTypeFilter, selectCatalogDataSource, selectCatalogDataElement, setCatalogSort, setCatalogArtifacts, setCatalogDataSources, setCatalogDataElements, getArtifactSearchResults, getDataSourceSearchResults, getDataElementSearchResults, getUnifiedSearchResults, getAvailableCatalogArtifactTypes, getArtifactCountByDataSource, getArtifactCountByDataElement, } from '../catalog-search-state.js';
// ---------------------------------------------------------------------------
// Test Data Factories
// ---------------------------------------------------------------------------
function makeArtifact(overrides = {}) {
    return {
        id: 'art-1',
        name: 'Sales Report',
        type: 'report',
        description: 'Monthly sales breakdown',
        dataSourceId: 'ds-1',
        dataSourceName: 'Sales DB',
        dataElements: ['revenue', 'units_sold'],
        updatedAt: 1000,
        ...overrides,
    };
}
function makeDataSource(overrides = {}) {
    return {
        id: 'ds-1',
        name: 'Sales DB',
        type: 'duckdb',
        artifactCount: 3,
        ...overrides,
    };
}
function makeDataElement(overrides = {}) {
    return {
        name: 'revenue',
        role: 'measure',
        dataSourceId: 'ds-1',
        dataSourceName: 'Sales DB',
        usedInArtifactIds: ['art-1', 'art-2'],
        ...overrides,
    };
}
/** Builds a state pre-loaded with test data for result-computation tests. */
function stateWithData() {
    let s = initialCatalogSearchState();
    s = setCatalogArtifacts(s, [
        makeArtifact({ id: 'art-1', name: 'Sales Report', type: 'report', description: 'Monthly sales breakdown', dataSourceId: 'ds-1', dataElements: ['revenue', 'units_sold'], updatedAt: 3000 }),
        makeArtifact({ id: 'art-2', name: 'KPI Dashboard', type: 'dashboard', description: 'Key performance indicators', dataSourceId: 'ds-1', dataElements: ['revenue', 'margin'], updatedAt: 1000 }),
        makeArtifact({ id: 'art-3', name: 'Inventory Report', type: 'report', description: 'Stock levels and supply', dataSourceId: 'ds-2', dataElements: ['stock_level'], updatedAt: 2000 }),
        makeArtifact({ id: 'art-4', name: 'Customer KPI', type: 'kpi', description: 'Customer health metrics', dataSourceId: 'ds-2', dataElements: ['churn_rate', 'revenue'], updatedAt: 4000 }),
    ]);
    s = setCatalogDataSources(s, [
        makeDataSource({ id: 'ds-1', name: 'Sales DB', type: 'duckdb', artifactCount: 2 }),
        makeDataSource({ id: 'ds-2', name: 'Inventory API', type: 'rest', artifactCount: 2 }),
    ]);
    s = setCatalogDataElements(s, [
        makeDataElement({ name: 'revenue', role: 'measure', dataSourceId: 'ds-1', dataSourceName: 'Sales DB', usedInArtifactIds: ['art-1', 'art-2', 'art-4'] }),
        makeDataElement({ name: 'units_sold', role: 'measure', dataSourceId: 'ds-1', dataSourceName: 'Sales DB', usedInArtifactIds: ['art-1'] }),
        makeDataElement({ name: 'margin', role: 'measure', dataSourceId: 'ds-1', dataSourceName: 'Sales DB', usedInArtifactIds: ['art-2'] }),
        makeDataElement({ name: 'stock_level', role: 'measure', dataSourceId: 'ds-2', dataSourceName: 'Inventory API', usedInArtifactIds: ['art-3'] }),
        makeDataElement({ name: 'churn_rate', role: 'kpi', dataSourceId: 'ds-2', dataSourceName: 'Inventory API', usedInArtifactIds: ['art-4'] }),
    ]);
    return s;
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CatalogSearchState', () => {
    // =========================================================================
    // Initialization
    // =========================================================================
    describe('initialCatalogSearchState', () => {
        it('starts in artifacts mode', () => {
            const s = initialCatalogSearchState();
            expect(s.mode).toBe('artifacts');
        });
        it('starts with empty query', () => {
            const s = initialCatalogSearchState();
            expect(s.query).toBe('');
        });
        it('starts with empty collections', () => {
            const s = initialCatalogSearchState();
            expect(s.allArtifacts).toHaveLength(0);
            expect(s.allDataSources).toHaveLength(0);
            expect(s.allDataElements).toHaveLength(0);
        });
        it('starts with no selections', () => {
            const s = initialCatalogSearchState();
            expect(s.selectedDataSourceId).toBeNull();
            expect(s.selectedDataElement).toBeNull();
            expect(s.typeFilter).toBeNull();
        });
        it('starts sorted by name ascending', () => {
            const s = initialCatalogSearchState();
            expect(s.sortBy).toBe('name');
            expect(s.sortDirection).toBe('asc');
        });
    });
    // =========================================================================
    // Mode & Query
    // =========================================================================
    describe('setCatalogSearchMode', () => {
        it('switches mode', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSearchMode(s, 'data-sources');
            expect(s.mode).toBe('data-sources');
        });
        it('returns same state if mode unchanged', () => {
            const s = initialCatalogSearchState();
            const next = setCatalogSearchMode(s, 'artifacts');
            expect(next).toBe(s);
        });
        it('clears selections when switching mode', () => {
            let s = initialCatalogSearchState();
            s = selectCatalogDataSource(s, 'ds-1');
            s = selectCatalogDataElement(s, 'revenue');
            s = setCatalogSearchMode(s, 'data-elements');
            expect(s.selectedDataSourceId).toBeNull();
            expect(s.selectedDataElement).toBeNull();
        });
        it('preserves query when switching mode', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSearchQuery(s, 'sales');
            s = setCatalogSearchMode(s, 'data-sources');
            expect(s.query).toBe('sales');
        });
    });
    describe('setCatalogSearchQuery', () => {
        it('sets query text', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSearchQuery(s, 'revenue');
            expect(s.query).toBe('revenue');
        });
        it('allows empty query', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSearchQuery(s, 'test');
            s = setCatalogSearchQuery(s, '');
            expect(s.query).toBe('');
        });
    });
    describe('clearCatalogSearch', () => {
        it('clears query and all selections', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSearchQuery(s, 'test');
            s = selectCatalogDataSource(s, 'ds-1');
            s = selectCatalogDataElement(s, 'revenue');
            s = setCatalogTypeFilter(s, 'dashboard');
            s = clearCatalogSearch(s);
            expect(s.query).toBe('');
            expect(s.selectedDataSourceId).toBeNull();
            expect(s.selectedDataElement).toBeNull();
            expect(s.typeFilter).toBeNull();
        });
        it('preserves mode', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSearchMode(s, 'data-elements');
            s = setCatalogSearchQuery(s, 'test');
            s = clearCatalogSearch(s);
            expect(s.mode).toBe('data-elements');
        });
    });
    // =========================================================================
    // Filters
    // =========================================================================
    describe('setCatalogTypeFilter', () => {
        it('sets type filter', () => {
            let s = initialCatalogSearchState();
            s = setCatalogTypeFilter(s, 'dashboard');
            expect(s.typeFilter).toBe('dashboard');
        });
        it('clears type filter with null', () => {
            let s = initialCatalogSearchState();
            s = setCatalogTypeFilter(s, 'report');
            s = setCatalogTypeFilter(s, null);
            expect(s.typeFilter).toBeNull();
        });
    });
    describe('selectCatalogDataSource', () => {
        it('selects a data source', () => {
            let s = initialCatalogSearchState();
            s = selectCatalogDataSource(s, 'ds-1');
            expect(s.selectedDataSourceId).toBe('ds-1');
        });
        it('deselects with null', () => {
            let s = initialCatalogSearchState();
            s = selectCatalogDataSource(s, 'ds-1');
            s = selectCatalogDataSource(s, null);
            expect(s.selectedDataSourceId).toBeNull();
        });
    });
    describe('selectCatalogDataElement', () => {
        it('selects a data element', () => {
            let s = initialCatalogSearchState();
            s = selectCatalogDataElement(s, 'revenue');
            expect(s.selectedDataElement).toBe('revenue');
        });
        it('deselects with null', () => {
            let s = initialCatalogSearchState();
            s = selectCatalogDataElement(s, 'revenue');
            s = selectCatalogDataElement(s, null);
            expect(s.selectedDataElement).toBeNull();
        });
    });
    // =========================================================================
    // Sort
    // =========================================================================
    describe('setCatalogSort', () => {
        it('sets sort field', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSort(s, 'updated');
            expect(s.sortBy).toBe('updated');
        });
        it('toggles direction when same field clicked', () => {
            let s = initialCatalogSearchState();
            // Default: name asc
            s = setCatalogSort(s, 'name');
            expect(s.sortDirection).toBe('desc'); // toggled
        });
        it('defaults to asc when switching fields', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSort(s, 'updated'); // different field
            expect(s.sortDirection).toBe('asc');
        });
        it('respects explicit direction override', () => {
            let s = initialCatalogSearchState();
            s = setCatalogSort(s, 'name', 'desc');
            expect(s.sortDirection).toBe('desc');
        });
    });
    // =========================================================================
    // Data Loading
    // =========================================================================
    describe('data loading', () => {
        it('setCatalogArtifacts replaces all artifacts', () => {
            let s = initialCatalogSearchState();
            const artifacts = [makeArtifact(), makeArtifact({ id: 'art-2', name: 'Other' })];
            s = setCatalogArtifacts(s, artifacts);
            expect(s.allArtifacts).toHaveLength(2);
        });
        it('setCatalogDataSources replaces all data sources', () => {
            let s = initialCatalogSearchState();
            s = setCatalogDataSources(s, [makeDataSource()]);
            expect(s.allDataSources).toHaveLength(1);
        });
        it('setCatalogDataElements replaces all data elements', () => {
            let s = initialCatalogSearchState();
            s = setCatalogDataElements(s, [makeDataElement(), makeDataElement({ name: 'units' })]);
            expect(s.allDataElements).toHaveLength(2);
        });
    });
    // =========================================================================
    // Artifact Search Results
    // =========================================================================
    describe('getArtifactSearchResults', () => {
        it('returns all artifacts when no filters applied', () => {
            const s = stateWithData();
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(4);
            expect(result.totalCount).toBe(4);
        });
        it('filters by type', () => {
            let s = stateWithData();
            s = setCatalogTypeFilter(s, 'report');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(2);
            expect(result.artifacts.every(a => a.type === 'report')).toBe(true);
        });
        it('filters by query on name', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'sales');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(1);
            expect(result.artifacts[0].name).toBe('Sales Report');
        });
        it('filters by query on description', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'breakdown');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(1);
            expect(result.artifacts[0].id).toBe('art-1');
        });
        it('filters by query on type', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'kpi');
            const result = getArtifactSearchResults(s);
            // Matches "Customer KPI" (type=kpi) and "KPI Dashboard" (name contains 'kpi')
            expect(result.artifacts).toHaveLength(2);
            expect(result.artifacts.some(a => a.type === 'kpi')).toBe(true);
        });
        it('query is case-insensitive', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'SALES');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(1);
        });
        it('combines type filter and query', () => {
            let s = stateWithData();
            s = setCatalogTypeFilter(s, 'report');
            s = setCatalogSearchQuery(s, 'inventory');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(1);
            expect(result.artifacts[0].name).toBe('Inventory Report');
        });
        it('sorts by name ascending (default)', () => {
            const s = stateWithData();
            const result = getArtifactSearchResults(s);
            const names = result.artifacts.map(a => a.name);
            expect(names).toEqual(['Customer KPI', 'Inventory Report', 'KPI Dashboard', 'Sales Report']);
        });
        it('sorts by name descending', () => {
            let s = stateWithData();
            s = setCatalogSort(s, 'name', 'desc');
            const result = getArtifactSearchResults(s);
            const names = result.artifacts.map(a => a.name);
            expect(names).toEqual(['Sales Report', 'KPI Dashboard', 'Inventory Report', 'Customer KPI']);
        });
        it('sorts by updated', () => {
            let s = stateWithData();
            s = setCatalogSort(s, 'updated');
            const result = getArtifactSearchResults(s);
            const ids = result.artifacts.map(a => a.id);
            expect(ids).toEqual(['art-2', 'art-3', 'art-1', 'art-4']); // 1000, 2000, 3000, 4000
        });
        it('sorts by type then name', () => {
            let s = stateWithData();
            s = setCatalogSort(s, 'type');
            const result = getArtifactSearchResults(s);
            const pairs = result.artifacts.map(a => `${a.type}:${a.name}`);
            expect(pairs).toEqual([
                'dashboard:KPI Dashboard',
                'kpi:Customer KPI',
                'report:Inventory Report',
                'report:Sales Report',
            ]);
        });
        it('returns empty when no match', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'nonexistent');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(0);
            expect(result.totalCount).toBe(0);
        });
        it('trims query whitespace', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, '  sales  ');
            const result = getArtifactSearchResults(s);
            expect(result.artifacts).toHaveLength(1);
        });
    });
    // =========================================================================
    // Data Source Search Results
    // =========================================================================
    describe('getDataSourceSearchResults', () => {
        it('returns all data sources when no query', () => {
            const s = stateWithData();
            const result = getDataSourceSearchResults(s);
            expect(result.dataSources).toHaveLength(2);
            expect(result.linkedArtifacts).toHaveLength(0);
        });
        it('filters data sources by name query', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'sales');
            const result = getDataSourceSearchResults(s);
            expect(result.dataSources).toHaveLength(1);
            expect(result.dataSources[0].name).toBe('Sales DB');
        });
        it('filters data sources by type query', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'rest');
            const result = getDataSourceSearchResults(s);
            expect(result.dataSources).toHaveLength(1);
            expect(result.dataSources[0].name).toBe('Inventory API');
        });
        it('shows linked artifacts when data source selected', () => {
            let s = stateWithData();
            s = selectCatalogDataSource(s, 'ds-1');
            const result = getDataSourceSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(2);
            expect(result.linkedArtifacts.map(a => a.id).sort()).toEqual(['art-1', 'art-2']);
        });
        it('applies type filter to linked artifacts', () => {
            let s = stateWithData();
            s = selectCatalogDataSource(s, 'ds-1');
            s = setCatalogTypeFilter(s, 'report');
            const result = getDataSourceSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(1);
            expect(result.linkedArtifacts[0].type).toBe('report');
        });
        it('sorts linked artifacts', () => {
            let s = stateWithData();
            s = selectCatalogDataSource(s, 'ds-1');
            s = setCatalogSort(s, 'name', 'desc');
            const result = getDataSourceSearchResults(s);
            expect(result.linkedArtifacts[0].name).toBe('Sales Report');
            expect(result.linkedArtifacts[1].name).toBe('KPI Dashboard');
        });
        it('returns no linked artifacts when no source selected', () => {
            const s = stateWithData();
            const result = getDataSourceSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(0);
        });
    });
    // =========================================================================
    // Data Element Search Results (Cross-referencing)
    // =========================================================================
    describe('getDataElementSearchResults', () => {
        it('returns all data elements when no query', () => {
            const s = stateWithData();
            const result = getDataElementSearchResults(s);
            expect(result.dataElements).toHaveLength(5);
            expect(result.linkedArtifacts).toHaveLength(0);
        });
        it('filters data elements by name query', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'revenue');
            const result = getDataElementSearchResults(s);
            expect(result.dataElements).toHaveLength(1);
            expect(result.dataElements[0].name).toBe('revenue');
        });
        it('filters data elements by role query', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'kpi');
            const result = getDataElementSearchResults(s);
            expect(result.dataElements).toHaveLength(1);
            expect(result.dataElements[0].name).toBe('churn_rate');
        });
        it('filters data elements by data source name', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'inventory');
            const result = getDataElementSearchResults(s);
            expect(result.dataElements).toHaveLength(2);
            expect(result.dataElements.every(de => de.dataSourceName === 'Inventory API')).toBe(true);
        });
        it('shows linked artifacts when element selected — the cross-reference query', () => {
            let s = stateWithData();
            s = selectCatalogDataElement(s, 'revenue');
            const result = getDataElementSearchResults(s);
            // revenue is used in art-1, art-2, art-4
            expect(result.linkedArtifacts).toHaveLength(3);
            expect(result.linkedArtifacts.map(a => a.id).sort()).toEqual(['art-1', 'art-2', 'art-4']);
        });
        it('applies type filter to linked artifacts', () => {
            let s = stateWithData();
            s = selectCatalogDataElement(s, 'revenue');
            s = setCatalogTypeFilter(s, 'dashboard');
            const result = getDataElementSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(1);
            expect(result.linkedArtifacts[0].name).toBe('KPI Dashboard');
        });
        it('sorts linked artifacts', () => {
            let s = stateWithData();
            s = selectCatalogDataElement(s, 'revenue');
            s = setCatalogSort(s, 'updated', 'desc');
            const result = getDataElementSearchResults(s);
            expect(result.linkedArtifacts[0].id).toBe('art-4'); // updatedAt 4000
            expect(result.linkedArtifacts[1].id).toBe('art-1'); // updatedAt 3000
            expect(result.linkedArtifacts[2].id).toBe('art-2'); // updatedAt 1000
        });
        it('returns no linked artifacts for unknown element', () => {
            let s = stateWithData();
            s = selectCatalogDataElement(s, 'nonexistent');
            const result = getDataElementSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(0);
        });
        it('returns no linked artifacts when no element selected', () => {
            const s = stateWithData();
            const result = getDataElementSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(0);
        });
        it('answers: which dashboards contain this KPI?', () => {
            let s = stateWithData();
            s = selectCatalogDataElement(s, 'revenue');
            s = setCatalogTypeFilter(s, 'dashboard');
            const result = getDataElementSearchResults(s);
            expect(result.linkedArtifacts).toHaveLength(1);
            expect(result.linkedArtifacts[0].name).toBe('KPI Dashboard');
        });
    });
    // =========================================================================
    // Unified Search Results
    // =========================================================================
    describe('getUnifiedSearchResults', () => {
        it('returns results for all three modes', () => {
            const s = stateWithData();
            const result = getUnifiedSearchResults(s);
            expect(result.artifacts.totalCount).toBe(4);
            expect(result.dataSources.dataSources).toHaveLength(2);
            expect(result.dataElements.dataElements).toHaveLength(5);
        });
        it('applies query across all modes', () => {
            let s = stateWithData();
            s = setCatalogSearchQuery(s, 'sales');
            const result = getUnifiedSearchResults(s);
            expect(result.artifacts.totalCount).toBe(1); // "Sales Report"
            expect(result.dataSources.dataSources).toHaveLength(1); // "Sales DB"
            // 3 elements have dataSourceName "Sales DB" which contains "sales"
            expect(result.dataElements.dataElements).toHaveLength(3);
        });
    });
    // =========================================================================
    // Queries
    // =========================================================================
    describe('getAvailableCatalogArtifactTypes', () => {
        it('returns unique artifact types sorted', () => {
            const s = stateWithData();
            const types = getAvailableCatalogArtifactTypes(s);
            expect(types).toEqual(['dashboard', 'kpi', 'report']);
        });
        it('returns empty for empty catalog', () => {
            const s = initialCatalogSearchState();
            const types = getAvailableCatalogArtifactTypes(s);
            expect(types).toHaveLength(0);
        });
    });
    describe('getArtifactCountByDataSource', () => {
        it('returns artifact counts per data source', () => {
            const s = stateWithData();
            const counts = getArtifactCountByDataSource(s);
            expect(counts.get('ds-1')).toBe(2);
            expect(counts.get('ds-2')).toBe(2);
        });
        it('returns empty map for empty catalog', () => {
            const s = initialCatalogSearchState();
            const counts = getArtifactCountByDataSource(s);
            expect(counts.size).toBe(0);
        });
    });
    describe('getArtifactCountByDataElement', () => {
        it('returns artifact count for a data element', () => {
            const s = stateWithData();
            expect(getArtifactCountByDataElement(s, 'revenue')).toBe(3);
            expect(getArtifactCountByDataElement(s, 'units_sold')).toBe(1);
            expect(getArtifactCountByDataElement(s, 'stock_level')).toBe(1);
        });
        it('returns 0 for unknown element', () => {
            const s = stateWithData();
            expect(getArtifactCountByDataElement(s, 'nonexistent')).toBe(0);
        });
    });
    // =========================================================================
    // Immutability
    // =========================================================================
    describe('immutability', () => {
        it('never mutates the original state', () => {
            const original = stateWithData();
            const frozen = JSON.parse(JSON.stringify(original));
            setCatalogSearchMode(original, 'data-elements');
            setCatalogSearchQuery(original, 'test');
            clearCatalogSearch(original);
            setCatalogTypeFilter(original, 'dashboard');
            selectCatalogDataSource(original, 'ds-1');
            selectCatalogDataElement(original, 'revenue');
            setCatalogSort(original, 'updated', 'desc');
            setCatalogArtifacts(original, []);
            setCatalogDataSources(original, []);
            setCatalogDataElements(original, []);
            // Original state must be unchanged
            expect(original.mode).toBe(frozen.mode);
            expect(original.query).toBe(frozen.query);
            expect(original.selectedDataSourceId).toBe(frozen.selectedDataSourceId);
            expect(original.selectedDataElement).toBe(frozen.selectedDataElement);
            expect(original.typeFilter).toBe(frozen.typeFilter);
            expect(original.sortBy).toBe(frozen.sortBy);
            expect(original.sortDirection).toBe(frozen.sortDirection);
            expect(original.allArtifacts).toHaveLength(frozen.allArtifacts.length);
            expect(original.allDataSources).toHaveLength(frozen.allDataSources.length);
            expect(original.allDataElements).toHaveLength(frozen.allDataElements.length);
        });
    });
});
//# sourceMappingURL=catalog-search-state.test.js.map