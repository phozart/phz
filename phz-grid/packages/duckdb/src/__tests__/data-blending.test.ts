/**
 * @phozart/phz-duckdb — Data Blending Tests (WI 28)
 *
 * Tests JOIN query generation and blended view creation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildJoinQuery,
  buildCreateViewQuery,
  type JoinDefinition,
  type JoinCondition,
} from '../data-blending.js';

describe('data-blending', () => {
  describe('buildJoinQuery', () => {
    it('generates simple INNER JOIN', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'orders',
        rightTable: 'customers',
        joinType: 'inner',
        on: [{ leftField: 'customer_id', rightField: 'id' }],
      }];
      const r = buildJoinQuery(joins, ['*']);
      expect(r.sql).toContain('FROM "orders"');
      expect(r.sql).toContain('INNER JOIN "customers"');
      expect(r.sql).toContain('ON "orders"."customer_id" = "customers"."id"');
    });

    it('generates LEFT JOIN', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'orders',
        rightTable: 'products',
        joinType: 'left',
        on: [{ leftField: 'product_id', rightField: 'id' }],
      }];
      const r = buildJoinQuery(joins, ['*']);
      expect(r.sql).toContain('LEFT JOIN "products"');
    });

    it('generates RIGHT JOIN', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'orders',
        rightTable: 'categories',
        joinType: 'right',
        on: [{ leftField: 'cat_id', rightField: 'id' }],
      }];
      const r = buildJoinQuery(joins, ['*']);
      expect(r.sql).toContain('RIGHT JOIN "categories"');
    });

    it('generates FULL JOIN', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'a',
        rightTable: 'b',
        joinType: 'full',
        on: [{ leftField: 'id', rightField: 'id' }],
      }];
      const r = buildJoinQuery(joins, ['*']);
      expect(r.sql).toContain('FULL JOIN "b"');
    });

    it('handles multi-join (3 tables)', () => {
      const joins: JoinDefinition[] = [
        {
          leftTable: 'orders',
          rightTable: 'customers',
          joinType: 'left',
          on: [{ leftField: 'customer_id', rightField: 'id' }],
        },
        {
          leftTable: 'orders',
          rightTable: 'products',
          joinType: 'left',
          on: [{ leftField: 'product_id', rightField: 'id' }],
        },
      ];
      const r = buildJoinQuery(joins, ['orders.*', 'customers.name', 'products.title']);
      expect(r.sql).toContain('LEFT JOIN "customers"');
      expect(r.sql).toContain('LEFT JOIN "products"');
    });

    it('handles multiple join conditions', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'a',
        rightTable: 'b',
        joinType: 'inner',
        on: [
          { leftField: 'x', rightField: 'x' },
          { leftField: 'y', rightField: 'y' },
        ],
      }];
      const r = buildJoinQuery(joins, ['*']);
      expect(r.sql).toContain('"a"."x" = "b"."x"');
      expect(r.sql).toContain('"a"."y" = "b"."y"');
      expect(r.sql).toContain('AND');
    });

    it('applies filters to joined query', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'orders',
        rightTable: 'customers',
        joinType: 'inner',
        on: [{ leftField: 'customer_id', rightField: 'id' }],
      }];
      const r = buildJoinQuery(joins, ['*'], [
        { field: 'orders.status', operator: 'equals', value: 'shipped' },
      ]);
      expect(r.sql).toContain('WHERE "orders"."status" = ?');
      expect(r.params).toContain('shipped');
    });

    it('selects specific columns with table qualifiers', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'orders',
        rightTable: 'customers',
        joinType: 'inner',
        on: [{ leftField: 'customer_id', rightField: 'id' }],
      }];
      const r = buildJoinQuery(joins, ['orders.id', 'customers.name']);
      expect(r.sql).toContain('"orders"."id"');
      expect(r.sql).toContain('"customers"."name"');
    });
  });

  describe('buildCreateViewQuery', () => {
    it('wraps a join query in CREATE VIEW', () => {
      const joins: JoinDefinition[] = [{
        leftTable: 'orders',
        rightTable: 'customers',
        joinType: 'inner',
        on: [{ leftField: 'customer_id', rightField: 'id' }],
      }];
      const sql = buildCreateViewQuery('order_details', joins, ['*']);
      expect(sql).toContain('CREATE OR REPLACE VIEW "order_details" AS');
      expect(sql).toContain('FROM "orders"');
    });
  });
});
