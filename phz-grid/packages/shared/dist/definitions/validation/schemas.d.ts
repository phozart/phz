/**
 * Zod schemas for all definition types.
 */
import { z } from 'zod';
export declare const DefinitionIdentitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    schemaVersion: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: string;
    description?: string | undefined;
    createdBy?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: string;
    description?: string | undefined;
    createdBy?: string | undefined;
}>;
export declare const LocalDataSourceSchema: z.ZodObject<{
    type: z.ZodLiteral<"local">;
    data: z.ZodArray<z.ZodUnknown, "many">;
}, "strip", z.ZodTypeAny, {
    type: "local";
    data: unknown[];
}, {
    type: "local";
    data: unknown[];
}>;
export declare const UrlDataSourceSchema: z.ZodObject<{
    type: z.ZodLiteral<"url">;
    url: z.ZodString;
    method: z.ZodOptional<z.ZodEnum<["GET", "POST"]>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    dataPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "url";
    url: string;
    method?: "GET" | "POST" | undefined;
    headers?: Record<string, string> | undefined;
    dataPath?: string | undefined;
}, {
    type: "url";
    url: string;
    method?: "GET" | "POST" | undefined;
    headers?: Record<string, string> | undefined;
    dataPath?: string | undefined;
}>;
export declare const DataProductDataSourceSchema: z.ZodObject<{
    type: z.ZodLiteral<"data-product">;
    dataProductId: z.ZodString;
    queryOverride: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "data-product";
    dataProductId: string;
    queryOverride?: string | undefined;
}, {
    type: "data-product";
    dataProductId: string;
    queryOverride?: string | undefined;
}>;
export declare const DuckDBQueryDataSourceSchema: z.ZodObject<{
    type: z.ZodLiteral<"duckdb-query">;
    sql: z.ZodString;
    parameterized: z.ZodOptional<z.ZodBoolean>;
    connectionKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "duckdb-query";
    sql: string;
    parameterized?: boolean | undefined;
    connectionKey?: string | undefined;
}, {
    type: "duckdb-query";
    sql: string;
    parameterized?: boolean | undefined;
    connectionKey?: string | undefined;
}>;
export declare const DefinitionDataSourceSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"local">;
    data: z.ZodArray<z.ZodUnknown, "many">;
}, "strip", z.ZodTypeAny, {
    type: "local";
    data: unknown[];
}, {
    type: "local";
    data: unknown[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"url">;
    url: z.ZodString;
    method: z.ZodOptional<z.ZodEnum<["GET", "POST"]>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    dataPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "url";
    url: string;
    method?: "GET" | "POST" | undefined;
    headers?: Record<string, string> | undefined;
    dataPath?: string | undefined;
}, {
    type: "url";
    url: string;
    method?: "GET" | "POST" | undefined;
    headers?: Record<string, string> | undefined;
    dataPath?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"data-product">;
    dataProductId: z.ZodString;
    queryOverride: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "data-product";
    dataProductId: string;
    queryOverride?: string | undefined;
}, {
    type: "data-product";
    dataProductId: string;
    queryOverride?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"duckdb-query">;
    sql: z.ZodString;
    parameterized: z.ZodOptional<z.ZodBoolean>;
    connectionKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "duckdb-query";
    sql: string;
    parameterized?: boolean | undefined;
    connectionKey?: string | undefined;
}, {
    type: "duckdb-query";
    sql: string;
    parameterized?: boolean | undefined;
    connectionKey?: string | undefined;
}>]>;
export declare const DefinitionColumnSpecSchema: z.ZodObject<{
    field: z.ZodString;
    header: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "date", "custom"]>>;
    width: z.ZodOptional<z.ZodNumber>;
    minWidth: z.ZodOptional<z.ZodNumber>;
    maxWidth: z.ZodOptional<z.ZodNumber>;
    sortable: z.ZodOptional<z.ZodBoolean>;
    filterable: z.ZodOptional<z.ZodBoolean>;
    editable: z.ZodOptional<z.ZodBoolean>;
    resizable: z.ZodOptional<z.ZodBoolean>;
    frozen: z.ZodOptional<z.ZodNullable<z.ZodEnum<["left", "right"]>>>;
    priority: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
    visible: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    field: string;
    type?: "string" | "number" | "boolean" | "custom" | "date" | undefined;
    priority?: 2 | 1 | 3 | undefined;
    header?: string | undefined;
    width?: number | undefined;
    minWidth?: number | undefined;
    maxWidth?: number | undefined;
    sortable?: boolean | undefined;
    filterable?: boolean | undefined;
    editable?: boolean | undefined;
    resizable?: boolean | undefined;
    frozen?: "left" | "right" | null | undefined;
    visible?: boolean | undefined;
}, {
    field: string;
    type?: "string" | "number" | "boolean" | "custom" | "date" | undefined;
    priority?: 2 | 1 | 3 | undefined;
    header?: string | undefined;
    width?: number | undefined;
    minWidth?: number | undefined;
    maxWidth?: number | undefined;
    sortable?: boolean | undefined;
    filterable?: boolean | undefined;
    editable?: boolean | undefined;
    resizable?: boolean | undefined;
    frozen?: "left" | "right" | null | undefined;
    visible?: boolean | undefined;
}>;
export declare const DefinitionDefaultsSchema: z.ZodOptional<z.ZodObject<{
    sort: z.ZodOptional<z.ZodObject<{
        field: z.ZodString;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        direction: "asc" | "desc";
    }, {
        field: string;
        direction: "asc" | "desc";
    }>>;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodString;
        value: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: string;
        value?: unknown;
    }, {
        field: string;
        operator: string;
        value?: unknown;
    }>, "many">>;
    groupBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    columnOrder: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    columnVisibility: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    columnWidths: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    sort?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
    columnOrder?: string[] | undefined;
    columnWidths?: Record<string, number> | undefined;
    filters?: {
        field: string;
        operator: string;
        value?: unknown;
    }[] | undefined;
    groupBy?: string[] | undefined;
    columnVisibility?: Record<string, boolean> | undefined;
}, {
    sort?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
    columnOrder?: string[] | undefined;
    columnWidths?: Record<string, number> | undefined;
    filters?: {
        field: string;
        operator: string;
        value?: unknown;
    }[] | undefined;
    groupBy?: string[] | undefined;
    columnVisibility?: Record<string, boolean> | undefined;
}>>;
export declare const DefinitionBehaviorSchema: z.ZodOptional<z.ZodObject<{
    density: z.ZodOptional<z.ZodEnum<["compact", "comfortable", "spacious"]>>;
    editMode: z.ZodOptional<z.ZodEnum<["none", "click", "dblclick", "manual"]>>;
    selectionMode: z.ZodOptional<z.ZodEnum<["none", "single", "multi", "range"]>>;
    enableVirtualization: z.ZodOptional<z.ZodBoolean>;
    enableGrouping: z.ZodOptional<z.ZodBoolean>;
    enableColumnResize: z.ZodOptional<z.ZodBoolean>;
    enableColumnReorder: z.ZodOptional<z.ZodBoolean>;
    showToolbar: z.ZodOptional<z.ZodBoolean>;
    showPagination: z.ZodOptional<z.ZodBoolean>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    density?: "compact" | "comfortable" | "spacious" | undefined;
    enableGrouping?: boolean | undefined;
    pageSize?: number | undefined;
    enableVirtualization?: boolean | undefined;
    editMode?: "none" | "click" | "dblclick" | "manual" | undefined;
    selectionMode?: "multi" | "none" | "single" | "range" | undefined;
    enableColumnResize?: boolean | undefined;
    enableColumnReorder?: boolean | undefined;
    showToolbar?: boolean | undefined;
    showPagination?: boolean | undefined;
}, {
    density?: "compact" | "comfortable" | "spacious" | undefined;
    enableGrouping?: boolean | undefined;
    pageSize?: number | undefined;
    enableVirtualization?: boolean | undefined;
    editMode?: "none" | "click" | "dblclick" | "manual" | undefined;
    selectionMode?: "multi" | "none" | "single" | "range" | undefined;
    enableColumnResize?: boolean | undefined;
    enableColumnReorder?: boolean | undefined;
    showToolbar?: boolean | undefined;
    showPagination?: boolean | undefined;
}>>;
export declare const DefinitionAccessSchema: z.ZodOptional<z.ZodObject<{
    visibility: z.ZodOptional<z.ZodEnum<["public", "private", "role-restricted"]>>;
    allowedRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    owner: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    visibility?: "public" | "private" | "role-restricted" | undefined;
    allowedRoles?: string[] | undefined;
    owner?: string | undefined;
}, {
    visibility?: "public" | "private" | "role-restricted" | undefined;
    allowedRoles?: string[] | undefined;
    owner?: string | undefined;
}>>;
export declare const GridDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    schemaVersion: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodOptional<z.ZodString>;
} & {
    dataSource: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"local">;
        data: z.ZodArray<z.ZodUnknown, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "local";
        data: unknown[];
    }, {
        type: "local";
        data: unknown[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"url">;
        url: z.ZodString;
        method: z.ZodOptional<z.ZodEnum<["GET", "POST"]>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dataPath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "url";
        url: string;
        method?: "GET" | "POST" | undefined;
        headers?: Record<string, string> | undefined;
        dataPath?: string | undefined;
    }, {
        type: "url";
        url: string;
        method?: "GET" | "POST" | undefined;
        headers?: Record<string, string> | undefined;
        dataPath?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"data-product">;
        dataProductId: z.ZodString;
        queryOverride: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "data-product";
        dataProductId: string;
        queryOverride?: string | undefined;
    }, {
        type: "data-product";
        dataProductId: string;
        queryOverride?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"duckdb-query">;
        sql: z.ZodString;
        parameterized: z.ZodOptional<z.ZodBoolean>;
        connectionKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "duckdb-query";
        sql: string;
        parameterized?: boolean | undefined;
        connectionKey?: string | undefined;
    }, {
        type: "duckdb-query";
        sql: string;
        parameterized?: boolean | undefined;
        connectionKey?: string | undefined;
    }>]>;
    columns: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        header: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "date", "custom"]>>;
        width: z.ZodOptional<z.ZodNumber>;
        minWidth: z.ZodOptional<z.ZodNumber>;
        maxWidth: z.ZodOptional<z.ZodNumber>;
        sortable: z.ZodOptional<z.ZodBoolean>;
        filterable: z.ZodOptional<z.ZodBoolean>;
        editable: z.ZodOptional<z.ZodBoolean>;
        resizable: z.ZodOptional<z.ZodBoolean>;
        frozen: z.ZodOptional<z.ZodNullable<z.ZodEnum<["left", "right"]>>>;
        priority: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
        visible: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        type?: "string" | "number" | "boolean" | "custom" | "date" | undefined;
        priority?: 2 | 1 | 3 | undefined;
        header?: string | undefined;
        width?: number | undefined;
        minWidth?: number | undefined;
        maxWidth?: number | undefined;
        sortable?: boolean | undefined;
        filterable?: boolean | undefined;
        editable?: boolean | undefined;
        resizable?: boolean | undefined;
        frozen?: "left" | "right" | null | undefined;
        visible?: boolean | undefined;
    }, {
        field: string;
        type?: "string" | "number" | "boolean" | "custom" | "date" | undefined;
        priority?: 2 | 1 | 3 | undefined;
        header?: string | undefined;
        width?: number | undefined;
        minWidth?: number | undefined;
        maxWidth?: number | undefined;
        sortable?: boolean | undefined;
        filterable?: boolean | undefined;
        editable?: boolean | undefined;
        resizable?: boolean | undefined;
        frozen?: "left" | "right" | null | undefined;
        visible?: boolean | undefined;
    }>, "many">;
    defaults: z.ZodOptional<z.ZodObject<{
        sort: z.ZodOptional<z.ZodObject<{
            field: z.ZodString;
            direction: z.ZodEnum<["asc", "desc"]>;
        }, "strip", z.ZodTypeAny, {
            field: string;
            direction: "asc" | "desc";
        }, {
            field: string;
            direction: "asc" | "desc";
        }>>;
        filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodString;
            value: z.ZodUnknown;
        }, "strip", z.ZodTypeAny, {
            field: string;
            operator: string;
            value?: unknown;
        }, {
            field: string;
            operator: string;
            value?: unknown;
        }>, "many">>;
        groupBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        columnOrder: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        columnVisibility: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
        columnWidths: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        sort?: {
            field: string;
            direction: "asc" | "desc";
        } | undefined;
        columnOrder?: string[] | undefined;
        columnWidths?: Record<string, number> | undefined;
        filters?: {
            field: string;
            operator: string;
            value?: unknown;
        }[] | undefined;
        groupBy?: string[] | undefined;
        columnVisibility?: Record<string, boolean> | undefined;
    }, {
        sort?: {
            field: string;
            direction: "asc" | "desc";
        } | undefined;
        columnOrder?: string[] | undefined;
        columnWidths?: Record<string, number> | undefined;
        filters?: {
            field: string;
            operator: string;
            value?: unknown;
        }[] | undefined;
        groupBy?: string[] | undefined;
        columnVisibility?: Record<string, boolean> | undefined;
    }>>;
    formatting: z.ZodOptional<z.ZodObject<{
        conditionalRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            condition: z.ZodString;
            value: z.ZodUnknown;
            style: z.ZodRecord<z.ZodString, z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            field: string;
            condition: string;
            style: Record<string, string>;
            value?: unknown;
        }, {
            field: string;
            condition: string;
            style: Record<string, string>;
            value?: unknown;
        }>, "many">>;
        tableSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        conditionalRules?: {
            field: string;
            condition: string;
            style: Record<string, string>;
            value?: unknown;
        }[] | undefined;
        tableSettings?: Record<string, unknown> | undefined;
    }, {
        conditionalRules?: {
            field: string;
            condition: string;
            style: Record<string, string>;
            value?: unknown;
        }[] | undefined;
        tableSettings?: Record<string, unknown> | undefined;
    }>>;
    behavior: z.ZodOptional<z.ZodObject<{
        density: z.ZodOptional<z.ZodEnum<["compact", "comfortable", "spacious"]>>;
        editMode: z.ZodOptional<z.ZodEnum<["none", "click", "dblclick", "manual"]>>;
        selectionMode: z.ZodOptional<z.ZodEnum<["none", "single", "multi", "range"]>>;
        enableVirtualization: z.ZodOptional<z.ZodBoolean>;
        enableGrouping: z.ZodOptional<z.ZodBoolean>;
        enableColumnResize: z.ZodOptional<z.ZodBoolean>;
        enableColumnReorder: z.ZodOptional<z.ZodBoolean>;
        showToolbar: z.ZodOptional<z.ZodBoolean>;
        showPagination: z.ZodOptional<z.ZodBoolean>;
        pageSize: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        density?: "compact" | "comfortable" | "spacious" | undefined;
        enableGrouping?: boolean | undefined;
        pageSize?: number | undefined;
        enableVirtualization?: boolean | undefined;
        editMode?: "none" | "click" | "dblclick" | "manual" | undefined;
        selectionMode?: "multi" | "none" | "single" | "range" | undefined;
        enableColumnResize?: boolean | undefined;
        enableColumnReorder?: boolean | undefined;
        showToolbar?: boolean | undefined;
        showPagination?: boolean | undefined;
    }, {
        density?: "compact" | "comfortable" | "spacious" | undefined;
        enableGrouping?: boolean | undefined;
        pageSize?: number | undefined;
        enableVirtualization?: boolean | undefined;
        editMode?: "none" | "click" | "dblclick" | "manual" | undefined;
        selectionMode?: "multi" | "none" | "single" | "range" | undefined;
        enableColumnResize?: boolean | undefined;
        enableColumnReorder?: boolean | undefined;
        showToolbar?: boolean | undefined;
        showPagination?: boolean | undefined;
    }>>;
    views: z.ZodOptional<z.ZodObject<{
        views: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            isDefault: z.ZodOptional<z.ZodBoolean>;
            state: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            state: Record<string, unknown>;
            isDefault?: boolean | undefined;
        }, {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            state: Record<string, unknown>;
            isDefault?: boolean | undefined;
        }>, "many">;
        defaultViewId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        views: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            state: Record<string, unknown>;
            isDefault?: boolean | undefined;
        }[];
        defaultViewId?: string | undefined;
    }, {
        views: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            state: Record<string, unknown>;
            isDefault?: boolean | undefined;
        }[];
        defaultViewId?: string | undefined;
    }>>;
    access: z.ZodOptional<z.ZodObject<{
        visibility: z.ZodOptional<z.ZodEnum<["public", "private", "role-restricted"]>>;
        allowedRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        owner: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        visibility?: "public" | "private" | "role-restricted" | undefined;
        allowedRoles?: string[] | undefined;
        owner?: string | undefined;
    }, {
        visibility?: "public" | "private" | "role-restricted" | undefined;
        allowedRoles?: string[] | undefined;
        owner?: string | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    columns: {
        field: string;
        type?: "string" | "number" | "boolean" | "custom" | "date" | undefined;
        priority?: 2 | 1 | 3 | undefined;
        header?: string | undefined;
        width?: number | undefined;
        minWidth?: number | undefined;
        maxWidth?: number | undefined;
        sortable?: boolean | undefined;
        filterable?: boolean | undefined;
        editable?: boolean | undefined;
        resizable?: boolean | undefined;
        frozen?: "left" | "right" | null | undefined;
        visible?: boolean | undefined;
    }[];
    createdAt: string;
    updatedAt: string;
    schemaVersion: string;
    dataSource: {
        type: "local";
        data: unknown[];
    } | {
        type: "url";
        url: string;
        method?: "GET" | "POST" | undefined;
        headers?: Record<string, string> | undefined;
        dataPath?: string | undefined;
    } | {
        type: "data-product";
        dataProductId: string;
        queryOverride?: string | undefined;
    } | {
        type: "duckdb-query";
        sql: string;
        parameterized?: boolean | undefined;
        connectionKey?: string | undefined;
    };
    description?: string | undefined;
    createdBy?: string | undefined;
    defaults?: {
        sort?: {
            field: string;
            direction: "asc" | "desc";
        } | undefined;
        columnOrder?: string[] | undefined;
        columnWidths?: Record<string, number> | undefined;
        filters?: {
            field: string;
            operator: string;
            value?: unknown;
        }[] | undefined;
        groupBy?: string[] | undefined;
        columnVisibility?: Record<string, boolean> | undefined;
    } | undefined;
    formatting?: {
        conditionalRules?: {
            field: string;
            condition: string;
            style: Record<string, string>;
            value?: unknown;
        }[] | undefined;
        tableSettings?: Record<string, unknown> | undefined;
    } | undefined;
    behavior?: {
        density?: "compact" | "comfortable" | "spacious" | undefined;
        enableGrouping?: boolean | undefined;
        pageSize?: number | undefined;
        enableVirtualization?: boolean | undefined;
        editMode?: "none" | "click" | "dblclick" | "manual" | undefined;
        selectionMode?: "multi" | "none" | "single" | "range" | undefined;
        enableColumnResize?: boolean | undefined;
        enableColumnReorder?: boolean | undefined;
        showToolbar?: boolean | undefined;
        showPagination?: boolean | undefined;
    } | undefined;
    views?: {
        views: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            state: Record<string, unknown>;
            isDefault?: boolean | undefined;
        }[];
        defaultViewId?: string | undefined;
    } | undefined;
    access?: {
        visibility?: "public" | "private" | "role-restricted" | undefined;
        allowedRoles?: string[] | undefined;
        owner?: string | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name: string;
    columns: {
        field: string;
        type?: "string" | "number" | "boolean" | "custom" | "date" | undefined;
        priority?: 2 | 1 | 3 | undefined;
        header?: string | undefined;
        width?: number | undefined;
        minWidth?: number | undefined;
        maxWidth?: number | undefined;
        sortable?: boolean | undefined;
        filterable?: boolean | undefined;
        editable?: boolean | undefined;
        resizable?: boolean | undefined;
        frozen?: "left" | "right" | null | undefined;
        visible?: boolean | undefined;
    }[];
    createdAt: string;
    updatedAt: string;
    schemaVersion: string;
    dataSource: {
        type: "local";
        data: unknown[];
    } | {
        type: "url";
        url: string;
        method?: "GET" | "POST" | undefined;
        headers?: Record<string, string> | undefined;
        dataPath?: string | undefined;
    } | {
        type: "data-product";
        dataProductId: string;
        queryOverride?: string | undefined;
    } | {
        type: "duckdb-query";
        sql: string;
        parameterized?: boolean | undefined;
        connectionKey?: string | undefined;
    };
    description?: string | undefined;
    createdBy?: string | undefined;
    defaults?: {
        sort?: {
            field: string;
            direction: "asc" | "desc";
        } | undefined;
        columnOrder?: string[] | undefined;
        columnWidths?: Record<string, number> | undefined;
        filters?: {
            field: string;
            operator: string;
            value?: unknown;
        }[] | undefined;
        groupBy?: string[] | undefined;
        columnVisibility?: Record<string, boolean> | undefined;
    } | undefined;
    formatting?: {
        conditionalRules?: {
            field: string;
            condition: string;
            style: Record<string, string>;
            value?: unknown;
        }[] | undefined;
        tableSettings?: Record<string, unknown> | undefined;
    } | undefined;
    behavior?: {
        density?: "compact" | "comfortable" | "spacious" | undefined;
        enableGrouping?: boolean | undefined;
        pageSize?: number | undefined;
        enableVirtualization?: boolean | undefined;
        editMode?: "none" | "click" | "dblclick" | "manual" | undefined;
        selectionMode?: "multi" | "none" | "single" | "range" | undefined;
        enableColumnResize?: boolean | undefined;
        enableColumnReorder?: boolean | undefined;
        showToolbar?: boolean | undefined;
        showPagination?: boolean | undefined;
    } | undefined;
    views?: {
        views: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            state: Record<string, unknown>;
            isDefault?: boolean | undefined;
        }[];
        defaultViewId?: string | undefined;
    } | undefined;
    access?: {
        visibility?: "public" | "private" | "role-restricted" | undefined;
        allowedRoles?: string[] | undefined;
        owner?: string | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map