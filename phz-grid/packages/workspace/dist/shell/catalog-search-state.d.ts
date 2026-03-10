/**
 * Catalog Search State Machine
 *
 * Three search modes for finding artifacts by different axes:
 * 1. Artifacts — search by artifact name/type
 * 2. Data Sources — search by data source, shows artifacts using that source
 * 3. Data Elements — search by field/KPI/metric name, shows which artifacts contain it
 *
 * The third mode answers: "In which dashboards does this KPI appear?"
 * This is the core value — cross-referencing artifacts by what's inside them.
 *
 * Pure functions — no DOM, no side effects — testable in Node.
 */
export type CatalogSearchMode = 'artifacts' | 'data-sources' | 'data-elements';
export type CatalogArtifactType = 'report' | 'dashboard' | 'kpi' | 'filter' | 'hierarchy';
export interface CatalogArtifact {
    id: string;
    name: string;
    type: CatalogArtifactType;
    description?: string;
    dataSourceId?: string;
    dataSourceName?: string;
    /** Field/KPI/metric names contained in this artifact. */
    dataElements: string[];
    updatedAt?: number;
    createdBy?: string;
}
export interface CatalogDataSource {
    id: string;
    name: string;
    type: string;
    /** Number of artifacts that use this source. */
    artifactCount: number;
}
export interface CatalogDataElement {
    name: string;
    /** The role: dimension, measure, time, identifier, kpi, metric. */
    role: string;
    dataSourceId: string;
    dataSourceName: string;
    /** Artifact IDs that use this element. */
    usedInArtifactIds: string[];
}
export interface CatalogSearchState {
    /** Current search mode. */
    mode: CatalogSearchMode;
    /** Search query text. */
    query: string;
    /** All known artifacts (provided by adapter). */
    allArtifacts: CatalogArtifact[];
    /** All known data sources. */
    allDataSources: CatalogDataSource[];
    /** All known data elements (fields, KPIs, metrics). */
    allDataElements: CatalogDataElement[];
    /** Currently selected data source filter (in data-sources mode). */
    selectedDataSourceId: string | null;
    /** Currently selected data element (in data-elements mode). */
    selectedDataElement: string | null;
    /** Artifact type filter (applies in all modes). */
    typeFilter: CatalogArtifactType | null;
    /** Sort order. */
    sortBy: 'name' | 'updated' | 'type';
    sortDirection: 'asc' | 'desc';
}
export interface ArtifactSearchResult {
    artifacts: CatalogArtifact[];
    totalCount: number;
}
export interface DataSourceSearchResult {
    dataSources: CatalogDataSource[];
    /** When a source is selected, the artifacts that use it. */
    linkedArtifacts: CatalogArtifact[];
}
export interface DataElementSearchResult {
    dataElements: CatalogDataElement[];
    /** When an element is selected, the artifacts that contain it. */
    linkedArtifacts: CatalogArtifact[];
}
export declare function initialCatalogSearchState(): CatalogSearchState;
/** Switches search mode. Clears selections but preserves query. */
export declare function setCatalogSearchMode(state: CatalogSearchState, mode: CatalogSearchMode): CatalogSearchState;
/** Updates the search query text. */
export declare function setCatalogSearchQuery(state: CatalogSearchState, query: string): CatalogSearchState;
/** Clears the search query and all selections. */
export declare function clearCatalogSearch(state: CatalogSearchState): CatalogSearchState;
/** Filters by artifact type (report, dashboard, kpi, etc.). null = all types. */
export declare function setCatalogTypeFilter(state: CatalogSearchState, typeFilter: CatalogArtifactType | null): CatalogSearchState;
/** In data-sources mode, selects a data source to show its linked artifacts. */
export declare function selectCatalogDataSource(state: CatalogSearchState, dataSourceId: string | null): CatalogSearchState;
/** In data-elements mode, selects an element to show which artifacts use it. */
export declare function selectCatalogDataElement(state: CatalogSearchState, elementName: string | null): CatalogSearchState;
export declare function setCatalogSort(state: CatalogSearchState, sortBy: CatalogSearchState['sortBy'], sortDirection?: CatalogSearchState['sortDirection']): CatalogSearchState;
/** Sets the full artifact catalog (from adapter). */
export declare function setCatalogArtifacts(state: CatalogSearchState, artifacts: CatalogArtifact[]): CatalogSearchState;
/** Sets the data source list (from adapter). */
export declare function setCatalogDataSources(state: CatalogSearchState, dataSources: CatalogDataSource[]): CatalogSearchState;
/** Sets the data element index (from adapter). */
export declare function setCatalogDataElements(state: CatalogSearchState, dataElements: CatalogDataElement[]): CatalogSearchState;
/** Computes artifact search results based on current state. */
export declare function getArtifactSearchResults(state: CatalogSearchState): ArtifactSearchResult;
/** Computes data source search results. When a source is selected, shows linked artifacts. */
export declare function getDataSourceSearchResults(state: CatalogSearchState): DataSourceSearchResult;
/**
 * Computes data element search results. When an element is selected,
 * shows which artifacts contain it.
 *
 * This answers: "Which dashboards use this KPI?"
 */
export declare function getDataElementSearchResults(state: CatalogSearchState): DataElementSearchResult;
/**
 * Unified search: searches across all modes simultaneously.
 * Returns results for each mode so the UI can show combined results
 * or let the user pick a mode.
 */
export declare function getUnifiedSearchResults(state: CatalogSearchState): {
    artifacts: ArtifactSearchResult;
    dataSources: DataSourceSearchResult;
    dataElements: DataElementSearchResult;
};
/** Returns all artifact types present in the catalog for filter chips. */
export declare function getAvailableCatalogArtifactTypes(state: CatalogSearchState): CatalogArtifactType[];
/** Returns the count of artifacts per data source. */
export declare function getArtifactCountByDataSource(state: CatalogSearchState): Map<string, number>;
/** Returns the count of artifacts that use a given data element. */
export declare function getArtifactCountByDataElement(state: CatalogSearchState, elementName: string): number;
//# sourceMappingURL=catalog-search-state.d.ts.map