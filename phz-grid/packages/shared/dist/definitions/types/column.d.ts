/**
 * Definition Column Spec — serializable subset of ColumnDefinition.
 * No functions (renderer, validator, etc.) — only data that can be JSON.stringify'd.
 *
 * DefinitionColumnType is a mirror of core's ColumnType.
 * A compile-time parity test ensures they stay in sync.
 */
export type DefinitionColumnType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'custom';
export interface DefinitionColumnSpec {
    field: string;
    header?: string;
    type?: DefinitionColumnType;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    resizable?: boolean;
    frozen?: 'left' | 'right' | null;
    priority?: 1 | 2 | 3;
    visible?: boolean;
}
//# sourceMappingURL=column.d.ts.map