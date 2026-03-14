/**
 * @phozart/engine — OpenAPI Spec Generator (C-2.09)
 *
 * Generates an OpenAPI 3.1.0 document from the phz-grid API specification
 * types defined in @phozart/shared/types.
 *
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// paramToSchema — convert ApiParam to OpenAPI parameter schema
// ========================================================================
function paramTypeToSchema(type) {
    switch (type) {
        case 'string':
            return { type: 'string' };
        case 'number':
            return { type: 'number' };
        case 'boolean':
            return { type: 'boolean' };
        case 'array':
            return { type: 'array', items: { type: 'string' } };
        default:
            return { type: 'string' };
    }
}
function apiParamToOpenAPIParam(param, location) {
    const result = {
        name: param.name,
        in: location,
        required: location === 'path' ? true : param.required,
        schema: paramTypeToSchema(param.type),
    };
    if (param.description) {
        result.description = param.description;
    }
    if (param.defaultValue !== undefined) {
        result.schema.default = param.defaultValue;
    }
    return result;
}
// ========================================================================
// endpointToOperation
// ========================================================================
/**
 * Convert a single ApiEndpoint to an OpenAPI operation object.
 *
 * @param endpoint - The API endpoint definition.
 * @returns An OpenAPI operation object.
 */
export function endpointToOperation(endpoint) {
    const operation = {
        summary: endpoint.description,
    };
    // Parameters
    const params = [];
    if (endpoint.pathParams) {
        for (const p of endpoint.pathParams) {
            params.push(apiParamToOpenAPIParam(p, 'path'));
        }
    }
    if (endpoint.queryParams) {
        for (const p of endpoint.queryParams) {
            params.push(apiParamToOpenAPIParam(p, 'query'));
        }
    }
    if (endpoint.headers) {
        for (const p of endpoint.headers) {
            params.push(apiParamToOpenAPIParam(p, 'header'));
        }
    }
    if (params.length > 0) {
        operation.parameters = params;
    }
    // Request body
    if (endpoint.requestBody) {
        operation.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: endpoint.requestBody.$ref
                        ? { $ref: endpoint.requestBody.$ref }
                        : { type: endpoint.requestBody.type ?? 'object' },
                },
            },
        };
        if (endpoint.requestBody.description) {
            operation.requestBody.description = endpoint.requestBody.description;
        }
    }
    // Response
    const responseSchema = endpoint.responseBody
        ? endpoint.responseBody.$ref
            ? { $ref: endpoint.responseBody.$ref }
            : { type: endpoint.responseBody.type ?? 'object' }
        : undefined;
    operation.responses = {
        '200': {
            description: 'Successful response',
            ...(responseSchema
                ? { content: { 'application/json': { schema: responseSchema } } }
                : {}),
        },
    };
    // Security
    if (endpoint.auth === 'required') {
        operation.security = [{ bearerAuth: [] }];
    }
    else if (endpoint.auth === 'optional') {
        operation.security = [{ bearerAuth: [] }, {}];
    }
    // Tags (derive from first path segment)
    const tag = endpoint.path.split('/').filter(Boolean)[0];
    if (tag) {
        operation.tags = [tag];
    }
    return operation;
}
// ========================================================================
// generatePathItem
// ========================================================================
/**
 * Generate a complete OpenAPI path item from a group of endpoints sharing
 * the same path. Each endpoint produces a method (get, post, etc.) entry.
 *
 * @param endpoints - Endpoints sharing the same path.
 * @returns An OpenAPI path item object.
 */
export function generatePathItem(endpoints) {
    const pathItem = {};
    for (const ep of endpoints) {
        const method = ep.method.toLowerCase();
        pathItem[method] = endpointToOperation(ep);
    }
    return pathItem;
}
// ========================================================================
// generateOpenAPISpec
// ========================================================================
/**
 * Generate a complete OpenAPI 3.1.0 document from an APISpecConfig.
 *
 * @param config - The full API specification configuration.
 * @returns A complete OpenAPI 3.1.0 document object.
 */
export function generateOpenAPISpec(config) {
    // Group endpoints by path
    const pathGroups = new Map();
    for (const ep of config.endpoints) {
        const fullPath = `${config.basePath}${ep.path}`;
        const group = pathGroups.get(fullPath) ?? [];
        group.push(ep);
        pathGroups.set(fullPath, group);
    }
    // Build paths
    const paths = {};
    for (const [path, endpoints] of pathGroups) {
        paths[path] = generatePathItem(endpoints);
    }
    // Build document
    const doc = {
        openapi: '3.1.0',
        info: {
            title: config.title,
            version: config.version,
        },
        paths,
    };
    if (config.description) {
        doc.info.description = config.description;
    }
    // Add servers from CORS origins
    if (config.corsOrigins && config.corsOrigins.length > 0) {
        doc.servers = config.corsOrigins.map(origin => ({
            url: `${origin}${config.basePath}`,
        }));
    }
    // Add security scheme if any endpoint requires auth
    const hasAuth = config.endpoints.some(ep => ep.auth === 'required' || ep.auth === 'optional');
    if (hasAuth) {
        doc.components = {
            schemas: {},
        };
        // SecuritySchemes go outside schemas but inside components
        doc.components.securitySchemes = {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        };
    }
    return doc;
}
//# sourceMappingURL=openapi-generator.js.map