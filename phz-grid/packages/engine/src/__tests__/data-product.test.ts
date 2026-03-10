import { describe, it, expect } from 'vitest';
import { createDataProductRegistry } from '../data-product.js';
import type { DataProductDef } from '../data-product.js';
import { dataProductId } from '../types.js';

function makeSalesProduct(): DataProductDef {
  return {
    id: dataProductId('sales'),
    name: 'Sales Data',
    description: 'Monthly sales figures',
    owner: 'analytics-team',
    schema: {
      fields: [
        { name: 'region', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'date' },
      ],
    },
    tags: ['sales', 'revenue'],
  };
}

describe('DataProductRegistry', () => {
  it('registers and retrieves a data product', () => {
    const registry = createDataProductRegistry();
    const product = makeSalesProduct();
    registry.register(product);
    expect(registry.get(dataProductId('sales'))).toEqual(product);
  });

  it('lists all registered products', () => {
    const registry = createDataProductRegistry();
    registry.register(makeSalesProduct());
    registry.register({
      id: dataProductId('hr'),
      name: 'HR Data',
      schema: { fields: [{ name: 'employee', type: 'string' }] },
    });
    expect(registry.list()).toHaveLength(2);
  });

  it('unregisters a data product', () => {
    const registry = createDataProductRegistry();
    registry.register(makeSalesProduct());
    registry.unregister(dataProductId('sales'));
    expect(registry.get(dataProductId('sales'))).toBeUndefined();
  });

  it('searches by name', () => {
    const registry = createDataProductRegistry();
    registry.register(makeSalesProduct());
    registry.register({
      id: dataProductId('hr'),
      name: 'HR Data',
      schema: { fields: [{ name: 'employee', type: 'string' }] },
    });
    expect(registry.search('sales')).toHaveLength(1);
    expect(registry.search('data')).toHaveLength(2);
  });

  it('searches by tags', () => {
    const registry = createDataProductRegistry();
    registry.register(makeSalesProduct());
    expect(registry.search('revenue')).toHaveLength(1);
  });

  it('returns schema for a product', () => {
    const registry = createDataProductRegistry();
    registry.register(makeSalesProduct());
    const schema = registry.getSchema(dataProductId('sales'));
    expect(schema?.fields).toHaveLength(3);
  });

  it('validates product — missing name', () => {
    const registry = createDataProductRegistry();
    const result = registry.validate({ id: dataProductId('x'), schema: { fields: [{ name: 'f', type: 'string' }] } });
    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe('name');
  });

  it('validates product — empty fields', () => {
    const registry = createDataProductRegistry();
    const result = registry.validate({ id: dataProductId('x'), name: 'X', schema: { fields: [] } });
    expect(result.valid).toBe(false);
  });

  it('validates complete product as valid', () => {
    const registry = createDataProductRegistry();
    const result = registry.validate(makeSalesProduct());
    expect(result.valid).toBe(true);
  });
});
