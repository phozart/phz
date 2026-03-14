/**
 * Tests for OpenAPI Spec Generator (C-2.09)
 */
import { describe, it, expect } from 'vitest';
import {
  generateOpenAPISpec,
  endpointToOperation,
  generatePathItem,
} from '../api/openapi-generator.js';
import type { ApiEndpoint, APISpecConfig } from '@phozart/shared/types';

// --- Test helpers ---

function makeEndpoint(overrides?: Partial<ApiEndpoint>): ApiEndpoint {
  return {
    method: 'GET',
    path: '/items',
    description: 'List items',
    ...overrides,
  };
}

function makeConfig(overrides?: Partial<APISpecConfig>): APISpecConfig {
  return {
    title: 'Test API',
    version: '1.0.0',
    basePath: '/api/v1',
    endpoints: [],
    ...overrides,
  };
}

describe('endpointToOperation', () => {
  it('generates a basic operation', () => {
    const op = endpointToOperation(makeEndpoint());
    expect(op.summary).toBe('List items');
    expect(op.responses).toBeDefined();
    expect((op.responses as Record<string, unknown>)['200']).toBeDefined();
  });

  it('includes query parameters', () => {
    const op = endpointToOperation(makeEndpoint({
      queryParams: [
        { name: 'page', type: 'number', required: false, description: 'Page number' },
        { name: 'q', type: 'string', required: true },
      ],
    }));
    expect(op.parameters).toHaveLength(2);
    const params = op.parameters as Array<Record<string, unknown>>;
    expect(params[0].name).toBe('page');
    expect(params[0].in).toBe('query');
    expect(params[0].required).toBe(false);
    expect(params[1].required).toBe(true);
  });

  it('includes path parameters', () => {
    const op = endpointToOperation(makeEndpoint({
      path: '/items/{id}',
      pathParams: [{ name: 'id', type: 'string', required: true }],
    }));
    const params = op.parameters as Array<Record<string, unknown>>;
    expect(params[0].in).toBe('path');
    expect(params[0].required).toBe(true);
  });

  it('includes header parameters', () => {
    const op = endpointToOperation(makeEndpoint({
      headers: [{ name: 'X-Request-Id', type: 'string', required: false }],
    }));
    const params = op.parameters as Array<Record<string, unknown>>;
    expect(params[0].in).toBe('header');
  });

  it('includes request body with $ref', () => {
    const op = endpointToOperation(makeEndpoint({
      method: 'POST',
      requestBody: { $ref: '#/components/schemas/CreateItem' },
    }));
    const rb = op.requestBody as Record<string, unknown>;
    expect(rb.required).toBe(true);
    const content = rb.content as Record<string, Record<string, unknown>>;
    expect(content['application/json'].schema).toEqual({ $ref: '#/components/schemas/CreateItem' });
  });

  it('includes request body with type', () => {
    const op = endpointToOperation(makeEndpoint({
      method: 'POST',
      requestBody: { type: 'object', description: 'Item body' },
    }));
    const rb = op.requestBody as Record<string, unknown>;
    expect(rb.description).toBe('Item body');
  });

  it('includes response body schema', () => {
    const op = endpointToOperation(makeEndpoint({
      responseBody: { $ref: '#/components/schemas/ItemList' },
    }));
    const response200 = (op.responses as Record<string, unknown>)['200'] as Record<string, unknown>;
    expect(response200.content).toBeDefined();
  });

  it('adds security for required auth', () => {
    const op = endpointToOperation(makeEndpoint({ auth: 'required' }));
    expect(op.security).toEqual([{ bearerAuth: [] }]);
  });

  it('adds optional security', () => {
    const op = endpointToOperation(makeEndpoint({ auth: 'optional' }));
    expect(op.security).toEqual([{ bearerAuth: [] }, {}]);
  });

  it('omits security for no auth', () => {
    const op = endpointToOperation(makeEndpoint({ auth: 'none' }));
    expect(op.security).toBeUndefined();
  });

  it('derives tags from path', () => {
    const op = endpointToOperation(makeEndpoint({ path: '/users/list' }));
    expect(op.tags).toEqual(['users']);
  });

  it('handles default value in param', () => {
    const op = endpointToOperation(makeEndpoint({
      queryParams: [{ name: 'limit', type: 'number', required: false, defaultValue: 10 }],
    }));
    const params = op.parameters as Array<Record<string, unknown>>;
    const schema = params[0].schema as Record<string, unknown>;
    expect(schema.default).toBe(10);
  });

  it('handles array type params', () => {
    const op = endpointToOperation(makeEndpoint({
      queryParams: [{ name: 'ids', type: 'array', required: false }],
    }));
    const params = op.parameters as Array<Record<string, unknown>>;
    const schema = params[0].schema as Record<string, unknown>;
    expect(schema.type).toBe('array');
    expect(schema.items).toEqual({ type: 'string' });
  });
});

describe('generatePathItem', () => {
  it('generates a path item from multiple endpoints', () => {
    const endpoints: ApiEndpoint[] = [
      makeEndpoint({ method: 'GET', path: '/items', description: 'List' }),
      makeEndpoint({ method: 'POST', path: '/items', description: 'Create' }),
    ];
    const item = generatePathItem(endpoints);
    expect(item.get).toBeDefined();
    expect(item.post).toBeDefined();
  });

  it('handles single endpoint', () => {
    const item = generatePathItem([makeEndpoint()]);
    expect(item.get).toBeDefined();
  });
});

describe('generateOpenAPISpec', () => {
  it('generates a complete spec', () => {
    const config = makeConfig({
      endpoints: [
        makeEndpoint({ method: 'GET', path: '/items' }),
        makeEndpoint({ method: 'POST', path: '/items' }),
      ],
    });
    const spec = generateOpenAPISpec(config);
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.paths['/api/v1/items']).toBeDefined();
    expect(spec.paths['/api/v1/items'].get).toBeDefined();
    expect(spec.paths['/api/v1/items'].post).toBeDefined();
  });

  it('includes description in info', () => {
    const config = makeConfig({ description: 'My API' });
    const spec = generateOpenAPISpec(config);
    expect(spec.info.description).toBe('My API');
  });

  it('generates servers from CORS origins', () => {
    const config = makeConfig({
      corsOrigins: ['https://app1.example.com', 'https://app2.example.com'],
    });
    const spec = generateOpenAPISpec(config);
    expect(spec.servers).toHaveLength(2);
    expect(spec.servers![0].url).toBe('https://app1.example.com/api/v1');
  });

  it('adds security scheme when auth endpoints exist', () => {
    const config = makeConfig({
      endpoints: [makeEndpoint({ auth: 'required' })],
    });
    const spec = generateOpenAPISpec(config);
    expect(spec.components).toBeDefined();
    const secSchemes = (spec.components as Record<string, unknown>).securitySchemes;
    expect(secSchemes).toBeDefined();
  });

  it('omits security scheme when no auth endpoints', () => {
    const config = makeConfig({
      endpoints: [makeEndpoint({ auth: 'none' })],
    });
    const spec = generateOpenAPISpec(config);
    expect(spec.components).toBeUndefined();
  });

  it('groups endpoints by path', () => {
    const config = makeConfig({
      endpoints: [
        makeEndpoint({ method: 'GET', path: '/items' }),
        makeEndpoint({ method: 'GET', path: '/users' }),
      ],
    });
    const spec = generateOpenAPISpec(config);
    expect(Object.keys(spec.paths)).toHaveLength(2);
    expect(spec.paths['/api/v1/items']).toBeDefined();
    expect(spec.paths['/api/v1/users']).toBeDefined();
  });

  it('handles empty endpoints', () => {
    const config = makeConfig({ endpoints: [] });
    const spec = generateOpenAPISpec(config);
    expect(spec.paths).toEqual({});
  });
});
