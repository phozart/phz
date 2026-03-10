/**
 * @phozart/phz-workspace — Editor Criteria State
 *
 * Pure functions for managing criteria bar integration in editors.
 * Controls criteria visibility, configuration, and active filters
 * within report and dashboard editors.
 */

export interface CriteriaFilterEntry {
  id: string;
  field: string;
  operator: string;
  value: unknown;
  label: string;
}

export interface CriteriaConfig {
  position: 'top' | 'left';
  collapsible: boolean;
  showActiveCount: boolean;
}

export interface EditorCriteriaState {
  criteriaVisible: boolean;
  criteriaConfig: CriteriaConfig;
  activeFilters: CriteriaFilterEntry[];
}

export function initialEditorCriteriaState(): EditorCriteriaState {
  return {
    criteriaVisible: false,
    criteriaConfig: {
      position: 'top',
      collapsible: true,
      showActiveCount: true,
    },
    activeFilters: [],
  };
}

export function toggleCriteria(state: EditorCriteriaState): EditorCriteriaState {
  return { ...state, criteriaVisible: !state.criteriaVisible };
}

export function setCriteriaConfig(
  state: EditorCriteriaState,
  config: Partial<CriteriaConfig>,
): EditorCriteriaState {
  return {
    ...state,
    criteriaConfig: { ...state.criteriaConfig, ...config },
  };
}

export function addCriteriaFilter(
  state: EditorCriteriaState,
  filter: CriteriaFilterEntry,
): EditorCriteriaState {
  // Replace existing filter with same id
  const filtered = state.activeFilters.filter(f => f.id !== filter.id);
  return { ...state, activeFilters: [...filtered, filter] };
}

export function removeCriteriaFilter(
  state: EditorCriteriaState,
  filterId: string,
): EditorCriteriaState {
  return {
    ...state,
    activeFilters: state.activeFilters.filter(f => f.id !== filterId),
  };
}

export function clearCriteriaFilters(state: EditorCriteriaState): EditorCriteriaState {
  return { ...state, activeFilters: [] };
}
