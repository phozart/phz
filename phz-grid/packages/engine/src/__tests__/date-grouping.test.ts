/**
 * @phozart/engine — Date Grouping Tests
 *
 * Tests for JS bucketing and SQL expression generation.
 */

import { describe, it, expect } from 'vitest';
import { groupDate, addDateBuckets, dateGroupingSQL } from '../date-grouping.js';

describe('groupDate', () => {
  const testDate = new Date('2024-07-15T10:30:00Z');

  it('groups by year', () => {
    expect(groupDate(testDate, 'year')).toBe('2024');
  });

  it('groups by quarter', () => {
    expect(groupDate(testDate, 'quarter')).toBe('Q3 2024');
    expect(groupDate(new Date('2024-01-15'), 'quarter')).toBe('Q1 2024');
    expect(groupDate(new Date('2024-04-15'), 'quarter')).toBe('Q2 2024');
    expect(groupDate(new Date('2024-10-15'), 'quarter')).toBe('Q4 2024');
  });

  it('groups by month', () => {
    expect(groupDate(testDate, 'month')).toBe('2024-07');
    expect(groupDate(new Date('2024-01-01'), 'month')).toBe('2024-01');
  });

  it('groups by week', () => {
    const result = groupDate(testDate, 'week');
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('groups by day', () => {
    expect(groupDate(testDate, 'day')).toBe('2024-07-15');
  });

  it('handles ISO string input', () => {
    expect(groupDate('2024-07-15T10:30:00Z', 'year')).toBe('2024');
    expect(groupDate('2024-07-15', 'month')).toBe('2024-07');
  });

  it('handles numeric timestamp input', () => {
    expect(groupDate(testDate.getTime(), 'year')).toBe('2024');
  });

  it('returns empty string for null', () => {
    expect(groupDate(null, 'year')).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(groupDate(undefined, 'year')).toBe('');
  });

  it('returns empty string for invalid date string', () => {
    expect(groupDate('not-a-date', 'year')).toBe('');
  });

  it('returns empty string for non-date objects', () => {
    expect(groupDate({}, 'year')).toBe('');
    expect(groupDate([], 'year')).toBe('');
  });
});

describe('addDateBuckets', () => {
  const rows = [
    { id: 1, orderDate: '2024-01-15' },
    { id: 2, orderDate: '2024-04-20' },
    { id: 3, orderDate: '2024-07-10' },
  ];

  it('adds bucketed field with default output name', () => {
    const result = addDateBuckets(rows, 'orderDate', 'quarter');
    expect(result[0]).toHaveProperty('orderDate_quarter');
    expect(result[0].orderDate_quarter).toBe('Q1 2024');
    expect(result[1].orderDate_quarter).toBe('Q2 2024');
    expect(result[2].orderDate_quarter).toBe('Q3 2024');
  });

  it('adds bucketed field with custom output name', () => {
    const result = addDateBuckets(rows, 'orderDate', 'year', 'fiscal_year');
    expect(result[0]).toHaveProperty('fiscal_year');
    expect(result[0].fiscal_year).toBe('2024');
  });

  it('preserves original rows', () => {
    const result = addDateBuckets(rows, 'orderDate', 'month');
    expect(result[0].id).toBe(1);
    expect(result[0].orderDate).toBe('2024-01-15');
  });

  it('does not mutate original array', () => {
    const original = [...rows];
    addDateBuckets(rows, 'orderDate', 'year');
    expect(rows).toEqual(original);
  });

  it('handles empty array', () => {
    expect(addDateBuckets([], 'orderDate', 'year')).toEqual([]);
  });

  it('handles rows with null date values', () => {
    const data = [{ id: 1, orderDate: null }];
    const result = addDateBuckets(data, 'orderDate', 'year');
    expect(result[0].orderDate_year).toBe('');
  });
});

describe('dateGroupingSQL', () => {
  it('generates year SQL', () => {
    const sql = dateGroupingSQL('order_date', 'year');
    expect(sql).toContain('EXTRACT(YEAR FROM');
    expect(sql).toContain('"order_date"');
  });

  it('generates quarter SQL', () => {
    const sql = dateGroupingSQL('order_date', 'quarter');
    expect(sql).toContain('EXTRACT(QUARTER FROM');
    expect(sql).toContain('EXTRACT(YEAR FROM');
  });

  it('generates month SQL', () => {
    const sql = dateGroupingSQL('order_date', 'month');
    expect(sql).toContain('STRFTIME');
    expect(sql).toContain('%Y-%m');
  });

  it('generates week SQL', () => {
    const sql = dateGroupingSQL('order_date', 'week');
    expect(sql).toContain('STRFTIME');
    expect(sql).toContain('%G-W%V');
  });

  it('generates day SQL', () => {
    const sql = dateGroupingSQL('order_date', 'day');
    expect(sql).toContain('CAST');
    expect(sql).toContain('AS DATE');
  });
});
