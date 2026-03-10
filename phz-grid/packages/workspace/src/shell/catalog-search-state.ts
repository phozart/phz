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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  type: string;  // e.g. 'duckdb', 'rest', 'csv'
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

// ---------------------------------------------------------------------------
// Search Results (computed from state)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export function initialCatalogSearchState(): CatalogSearchState {
  return {
    mode: 'artifacts',
    query: '',
    allArtifacts: [],
    allDataSources: [],
    allDataElements: [],
    selectedDataSourceId: null,
    selectedDataElement: null,
    typeFilter: null,
    sortBy: 'name',
    sortDirection: 'asc',
  };
}

// ---------------------------------------------------------------------------
// Mode & Query
// ---------------------------------------------------------------------------

/** Switches search mode. Clears selections but preserves query. */
export function setCatalogSearchMode(
  state: CatalogSearchState,
  mode: CatalogSearchMode,
): CatalogSearchState {
  if (state.mode === mode) return state;
  return {
    ...state,
    mode,
    selectedDataSourceId: null,
    selectedDataElement: null,
  };
}

/** Updates the search query text. */
export function setCatalogSearchQuery(
  state: CatalogSearchState,
  query: string,
): CatalogSearchState {
  return { ...state, query };
}

/** Clears the search query and all selections. */
export function clearCatalogSearch(
  state: CatalogSearchState,
): CatalogSearchState {
  return {
    ...state,
    query: '',
    selectedDataSourceId: null,
    selectedDataElement: null,
    typeFilter: null,
  };
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** Filters by artifact type (report, dashboard, kpi, etc.). null = all types. */
export function setCatalogTypeFilter(
  state: CatalogSearchState,
  typeFilter: CatalogArtifactType | null,
): CatalogSearchState {
  return { ...state, typeFilter };
}

/** In data-sources mode, selects a data source to show its linked artifacts. */
export function selectCatalogDataSource(
  state: CatalogSearchState,
  dataSourceId: string | null,
): CatalogSearchState {
  return { ...state, selectedDataSourceId: dataSourceId };
}

/** In data-elements mode, selects an element to show which artifacts use it. */
export function selectCatalogDataElement(
  state: CatalogSearchState,
  elementName: string | null,
): CatalogSearchState {
  return { ...state, selectedDataElement: elementName };
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export function setCatalogSort(
  state: CatalogSearchState,
  sortBy: CatalogSearchState['sortBy'],
  sortDirection?: CatalogSearchState['sortDirection'],
): CatalogSearchState {
  const dir = sortDirection ?? (state.sortBy === sortBy && state.sortDirection === 'asc' ? 'desc' : 'asc');
  return { ...state, sortBy, sortDirection: dir };
}

// ---------------------------------------------------------------------------
// Data Loading (adapter provides these)
// ---------------------------------------------------------------------------

/** Sets the full artifact catalog (from adapter). */
export function setCatalogArtifacts(
  state: CatalogSearchState,
  artifacts: CatalogArtifact[],
): CatalogSearchState {
  return { ...state, allArtifacts: artifacts };
}

/** Sets the data source list (from adapter). */
export function setCatalogDataSources(
  state: CatalogSearchState,
  dataSources: CatalogDataSource[],
): CatalogSearchState {
  return { ...state, allDataSources: dataSources };
}

/** Sets the data element index (from adapter). */
export function setCatalogDataElements(
  state: CatalogSearchState,
  dataElements: CatalogDataElement[],
): CatalogSearchState {
  return { ...state, allDataElements: dataElements };
}

// ---------------------------------------------------------------------------
// Result Computation (pure projections from state)
// ---------------------------------------------------------------------------

/** Computes artifact search results based on current state. */
export function getArtifactSearchResults(
  state: CatalogSearchState,
): ArtifactSearchResult {
  let filtered = state.allArtifacts;

  // Type filter
  if (state.typeFilter) {
    filtered = filtered.filter(a => a.type === state.typeFilter);
  }

  // Text search
  if (state.query.trim()) {
    const q = state.query.toLowerCase().trim();
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q),
    );
  }

  // Sort
  filtered = sortArtifacts(filtered, state.sortBy, state.sortDirection);

  return { artifacts: filtered, totalCount: filtered.length };
}

/** Computes data source search results. When a source is selected, shows linked artifacts. */
export function getDataSourceSearchResults(
  state: CatalogSearchState,
): DataSourceSearchResult {
  let sources = state.allDataSources;

  // Text search on source names
  if (state.query.trim()) {
    const q = state.query.toLowerCase().trim();
    sources = sources.filter(ds =>
      ds.name.toLowerCase().includes(q) ||
      ds.type.toLowerCase().includes(q),
    );
  }

  // Linked artifacts when a source is selected
  let linkedArtifacts: CatalogArtifact[] = [];
  if (state.selectedDataSourceId) {
    linkedArtifacts = state.allArtifacts.filter(
      a => a.dataSourceId === state.selectedDataSourceId,
    );
    if (state.typeFilter) {
      linkedArtifacts = linkedArtifacts.filter(a => a.type === state.typeFilter);
    }
    linkedArtifacts = sortArtifacts(linkedArtifacts, state.sortBy, state.sortDirection);
  }

  return { dataSources: sources, linkedArtifacts };
}

/**
 * Computes data element search results. When an element is selected,
 * shows which artifacts contain it.
 *
 * This answers: "Which dashboards use this KPI?"
 */
export function getDataElementSearchResults(
  state: CatalogSearchState,
): DataElementSearchResult {
  let elements = state.allDataElements;

  // Text search on element names
  if (state.query.trim()) {
    const q = state.query.toLowerCase().trim();
    elements = elements.filter(de =>
      de.name.toLowerCase().includes(q) ||
      de.role.toLowerCase().includes(q) ||
      de.dataSourceName.toLowerCase().includes(q),
    );
  }

  // Linked artifacts when an element is selected
  let linkedArtifacts: CatalogArtifact[] = [];
  if (state.selectedDataElement) {
    const element = state.allDataElements.find(
      de => de.name === state.selectedDataElement,
    );
    if (element) {
      const artifactIds = new Set(element.usedInArtifactIds);
      linkedArtifacts = state.allArtifacts.filter(a => artifactIds.has(a.id));
      if (state.typeFilter) {
        linkedArtifacts = linkedArtifacts.filter(a => a.type === state.typeFilter);
      }
      linkedArtifacts = sortArtifacts(linkedArtifacts, state.sortBy, state.sortDirection);
    }
  }

  return { dataElements: elements, linkedArtifacts };
}

/**
 * Unified search: searches across all modes simultaneously.
 * Returns results for each mode so the UI can show combined results
 * or let the user pick a mode.
 */
export function getUnifiedSearchResults(state: CatalogSearchState): {
  artifacts: ArtifactSearchResult;
  dataSources: DataSourceSearchResult;
  dataElements: DataElementSearchResult;
} {
  return {
    artifacts: getArtifactSearchResults(state),
    dataSources: getDataSourceSearchResults(state),
    dataElements: getDataElementSearchResults(state),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Returns all artifact types present in the catalog for filter chips. */
export function getAvailableCatalogArtifactTypes(
  state: CatalogSearchState,
): CatalogArtifactType[] {
  const types = new Set<CatalogArtifactType>();
  for (const a of state.allArtifacts) {
    types.add(a.type);
  }
  return Array.from(types).sort();
}

/** Returns the count of artifacts per data source. */
export function getArtifactCountByDataSource(
  state: CatalogSearchState,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const a of state.allArtifacts) {
    if (a.dataSourceId) {
      counts.set(a.dataSourceId, (counts.get(a.dataSourceId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Returns the count of artifacts that use a given data element. */
export function getArtifactCountByDataElement(
  state: CatalogSearchState,
  elementName: string,
): number {
  const element = state.allDataElements.find(de => de.name === elementName);
  return element?.usedInArtifactIds.length ?? 0;
}

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

function sortArtifacts(
  artifacts: CatalogArtifact[],
  sortBy: CatalogSearchState['sortBy'],
  direction: CatalogSearchState['sortDirection'],
): CatalogArtifact[] {
  const sorted = [...artifacts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      case 'updated':
        return (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
    }
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}
