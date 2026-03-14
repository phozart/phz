/**
 * Shared types for @phozart/grid components.
 * Extracted to avoid circular imports between phz-grid and phz-toolbar.
 */
import type { FilterOperator } from '@phozart/core';
export type Density = 'comfortable' | 'compact' | 'dense';
export type ScrollMode = 'paginate' | 'virtual';
export interface FilterInfo {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
export interface RowAction {
    id: string;
    label: string;
    icon?: string;
    href?: string;
    variant?: 'default' | 'danger';
    bulkEnabled?: boolean;
}
//# sourceMappingURL=types.d.ts.map