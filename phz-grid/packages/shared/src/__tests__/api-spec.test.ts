/**
 * Tests for ApiSpec types and helpers.
 */
import { createApiEndpoint } from '@phozart/phz-shared/types';

describe('createApiEndpoint', () => {
  it('creates an endpoint with required fields', () => {
    const endpoint = createApiEndpoint('GET', '/api/users', 'List all users');
    expect(endpoint.method).toBe('GET');
    expect(endpoint.path).toBe('/api/users');
    expect(endpoint.description).toBe('List all users');
  });

  it('includes optional fields when provided', () => {
    const endpoint = createApiEndpoint('POST', '/api/users', 'Create user', {
      auth: 'required',
      requestBody: { $ref: '#/components/schemas/CreateUser' },
      responseBody: { $ref: '#/components/schemas/User' },
      queryParams: [{ name: 'dryRun', type: 'boolean', required: false }],
      roleAccess: {
        allowedRoles: ['admin'],
        requiresAuth: true,
        rateLimitPerMinute: 60,
      },
    });

    expect(endpoint.auth).toBe('required');
    expect(endpoint.requestBody?.$ref).toBe('#/components/schemas/CreateUser');
    expect(endpoint.responseBody?.$ref).toBe('#/components/schemas/User');
    expect(endpoint.queryParams).toHaveLength(1);
    expect(endpoint.queryParams![0].name).toBe('dryRun');
    expect(endpoint.roleAccess?.allowedRoles).toEqual(['admin']);
    expect(endpoint.roleAccess?.rateLimitPerMinute).toBe(60);
  });

  it('does not include undefined optional fields', () => {
    const endpoint = createApiEndpoint('DELETE', '/api/users/:id', 'Delete user');
    expect(endpoint.requestBody).toBeUndefined();
    expect(endpoint.responseBody).toBeUndefined();
    expect(endpoint.queryParams).toBeUndefined();
    expect(endpoint.pathParams).toBeUndefined();
    expect(endpoint.headers).toBeUndefined();
    expect(endpoint.auth).toBeUndefined();
    expect(endpoint.roleAccess).toBeUndefined();
  });

  it('supports all HTTP methods', () => {
    expect(createApiEndpoint('GET', '/a', 'a').method).toBe('GET');
    expect(createApiEndpoint('POST', '/a', 'a').method).toBe('POST');
    expect(createApiEndpoint('PUT', '/a', 'a').method).toBe('PUT');
    expect(createApiEndpoint('PATCH', '/a', 'a').method).toBe('PATCH');
    expect(createApiEndpoint('DELETE', '/a', 'a').method).toBe('DELETE');
  });

  it('includes pathParams and headers when provided', () => {
    const endpoint = createApiEndpoint('GET', '/api/users/:id', 'Get user', {
      pathParams: [{ name: 'id', type: 'string', required: true }],
      headers: [{ name: 'X-Request-Id', type: 'string', required: false }],
    });
    expect(endpoint.pathParams).toHaveLength(1);
    expect(endpoint.headers).toHaveLength(1);
  });
});
