/**
 * Definition Defaults — initial state for sort, filter, grouping, column state.
 */

export interface DefinitionDefaults {
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  groupBy?: string[];
  columnOrder?: string[];
  columnVisibility?: Record<string, boolean>;
  columnWidths?: Record<string, number>;
}
