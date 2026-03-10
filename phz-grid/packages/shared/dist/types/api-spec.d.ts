/**
 * @phozart/phz-shared — API spec types (A-1.22)
 *
 * REST API specification types for backend integration, including
 * role-based access control and complete API configuration.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface ApiParam {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    description?: string;
    defaultValue?: unknown;
}
export interface ApiSchemaRef {
    $ref?: string;
    type?: string;
    description?: string;
}
/**
 * Defines which workspace roles (admin, author, viewer) can access
 * a specific API endpoint. Used by the API gateway / middleware
 * to enforce authorization.
 */
export interface APIRoleAccess {
    /** Roles that can call this endpoint. Empty = no restriction. */
    allowedRoles: Array<'admin' | 'author' | 'viewer'>;
    /** Whether the endpoint requires authentication at all. */
    requiresAuth: boolean;
    /** Optional rate limit per minute per user. */
    rateLimitPerMinute?: number;
    /** Optional custom permission string for fine-grained access. */
    permission?: string;
}
export interface ApiEndpoint {
    method: HttpMethod;
    path: string;
    description: string;
    requestBody?: ApiSchemaRef;
    responseBody?: ApiSchemaRef;
    queryParams?: ApiParam[];
    pathParams?: ApiParam[];
    headers?: ApiParam[];
    auth?: 'required' | 'optional' | 'none';
    /** Role-based access control for this endpoint. */
    roleAccess?: APIRoleAccess;
}
export interface ApiSpec {
    version: string;
    basePath: string;
    endpoints: ApiEndpoint[];
}
/**
 * Top-level API specification configuration. Provides metadata,
 * endpoint definitions, global defaults, and CORS configuration.
 */
export interface APISpecConfig {
    /** API title (e.g. 'phz-grid Workspace API'). */
    title: string;
    /** Semantic version of the API (e.g. '1.0.0'). */
    version: string;
    /** Base path for all endpoints (e.g. '/api/v1'). */
    basePath: string;
    /** Full API endpoint definitions. */
    endpoints: ApiEndpoint[];
    /** Default role access for endpoints that don't specify their own. */
    defaultRoleAccess?: APIRoleAccess;
    /** Global rate limit per minute per user (overridden by per-endpoint). */
    globalRateLimitPerMinute?: number;
    /** Allowed CORS origins. */
    corsOrigins?: string[];
    /** Description of the API for documentation. */
    description?: string;
}
export declare function createApiEndpoint(method: HttpMethod, path: string, description: string, options?: Partial<Omit<ApiEndpoint, 'method' | 'path' | 'description'>>): ApiEndpoint;
//# sourceMappingURL=api-spec.d.ts.map