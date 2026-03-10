/**
 * @phozart/phz-engine — Data Product Registry
 *
 * Data products are the foundational data entities in the BI engine.
 * Each data product has a schema describing its fields.
 */

import type { ColumnType } from '@phozart/phz-core';
import type { DataProductId, ValidationResult } from './types.js';
import { dataProductId } from './types.js';

export interface DataProductField {
  name: string;
  type: ColumnType;
  description?: string;
  nullable?: boolean;
}

export interface DataProductSchema {
  fields: DataProductField[];
}

export interface DataProductDef {
  id: DataProductId;
  name: string;
  description?: string;
  owner?: string;
  schema: DataProductSchema;
  tags?: string[];
}

export interface DataProductRegistry {
  register(product: DataProductDef): void;
  unregister(id: DataProductId): void;
  get(id: DataProductId): DataProductDef | undefined;
  list(): DataProductDef[];
  search(query: string): DataProductDef[];
  getSchema(id: DataProductId): DataProductSchema | undefined;
  validate(product: Partial<DataProductDef>): ValidationResult;
}

export function createDataProductRegistry(): DataProductRegistry {
  const products = new Map<DataProductId, DataProductDef>();

  return {
    register(product: DataProductDef): void {
      products.set(product.id, product);
    },

    unregister(id: DataProductId): void {
      products.delete(id);
    },

    get(id: DataProductId): DataProductDef | undefined {
      return products.get(id);
    },

    list(): DataProductDef[] {
      return Array.from(products.values());
    },

    search(query: string): DataProductDef[] {
      const q = query.toLowerCase();
      return Array.from(products.values()).filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q))),
      );
    },

    getSchema(id: DataProductId): DataProductSchema | undefined {
      return products.get(id)?.schema;
    },

    validate(product: Partial<DataProductDef>): ValidationResult {
      const errors: { path: string; message: string }[] = [];

      if (!product.id) errors.push({ path: 'id', message: 'ID is required' });
      if (!product.name) errors.push({ path: 'name', message: 'Name is required' });
      if (!product.schema) {
        errors.push({ path: 'schema', message: 'Schema is required' });
      } else if (!product.schema.fields || product.schema.fields.length === 0) {
        errors.push({ path: 'schema.fields', message: 'At least one field is required' });
      }

      return { valid: errors.length === 0, errors };
    },
  };
}
