/**
 * @phozart/engine — OpenAPI Spec Generator (C-2.09)
 *
 * Generates an OpenAPI 3.1.0 document from the phz-grid API specification
 * types defined in @phozart/shared/types.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { ApiEndpoint, APISpecConfig } from '@phozart/shared/types';
export interface OpenAPIDocument {
    openapi: '3.1.0';
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: Record<string, Record<string, unknown>>;
    components?: {
        schemas?: Record<string, unknown>;
    };
}
/**
 * Convert a single ApiEndpoint to an OpenAPI operation object.
 *
 * @param endpoint - The API endpoint definition.
 * @returns An OpenAPI operation object.
 */
export declare function endpointToOperation(endpoint: ApiEndpoint): Record<string, unknown>;
/**
 * Generate a complete OpenAPI path item from a group of endpoints sharing
 * the same path. Each endpoint produces a method (get, post, etc.) entry.
 *
 * @param endpoints - Endpoints sharing the same path.
 * @returns An OpenAPI path item object.
 */
export declare function generatePathItem(endpoints: ApiEndpoint[]): Record<string, unknown>;
/**
 * Generate a complete OpenAPI 3.1.0 document from an APISpecConfig.
 *
 * @param config - The full API specification configuration.
 * @returns A complete OpenAPI 3.1.0 document object.
 */
export declare function generateOpenAPISpec(config: APISpecConfig): OpenAPIDocument;
//# sourceMappingURL=openapi-generator.d.ts.map