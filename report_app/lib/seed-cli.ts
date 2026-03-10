#!/usr/bin/env npx tsx
/**
 * Seed PostgreSQL with large datasets using generate_series (runs inside PG).
 * Supports partitioned sales_orders table (range-partitioned by date).
 *
 * Usage:
 *   npx tsx lib/seed-cli.ts              # default 100M
 *   npx tsx lib/seed-cli.ts 50000000     # 50M
 *   npx tsx lib/seed-cli.ts 150_000_000  # underscores OK
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET = Number((process.argv[2] ?? '100_000_000').replace(/_/g, ''));
const BATCH = 1_000_000; // 1M rows per INSERT ... SELECT

const pool = new pg.Pool({
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5434),
  database: process.env.PG_DB ?? 'phz_data',
  user: process.env.PG_USER ?? 'phz',
  password: process.env.PG_PASSWORD ?? 'phz',
  max: 2,
  statement_timeout: 0,  // no timeout — large batches can take minutes
});

const batchSQL = readFileSync(join(__dirname, 'seed-large.sql'), 'utf-8');
const schemaSQL = readFileSync(join(__dirname, 'schema-data.sql'), 'utf-8');

async function main() {
  const totalStart = performance.now();
  console.log(`\nSeeding ${TARGET.toLocaleString()} sales_orders into PostgreSQL (partitioned)...`);
  console.log(`Batch size: ${BATCH.toLocaleString()} rows\n`);

  // ── Drop everything cleanly ──
  await pool.query('DROP MATERIALIZED VIEW IF EXISTS sales_orders_summary CASCADE');
  await pool.query('DROP MATERIALIZED VIEW IF EXISTS sales_orders_by_region CASCADE');
  await pool.query('DROP MATERIALIZED VIEW IF EXISTS sales_orders_by_category CASCADE');
  await pool.query('DROP MATERIALIZED VIEW IF EXISTS sales_orders_by_month CASCADE');
  await pool.query('DROP TABLE IF EXISTS sales_orders CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');

  // ── Create tables + partitions (without indexes — deferred for bulk load) ──
  // Parse schema: keep CREATE TABLE and PARTITION lines, skip indexes/views
  const tableLines: string[] = [];
  let inMV = false;
  for (const line of schemaSQL.split('\n')) {
    if (line.startsWith('CREATE MATERIALIZED')) { inMV = true; continue; }
    if (inMV) { if (line.includes(';')) inMV = false; continue; }
    if (line.startsWith('CREATE INDEX') || line.startsWith('CREATE UNIQUE')) continue;
    tableLines.push(line);
  }
  await pool.query(tableLines.join('\n'));
  console.log('Schema ready (tables + partitions, indexes deferred).');

  // ── Drop indexes on partitions for bulk load speed ──
  console.log('Dropping partition indexes for bulk load...');
  const idxResult = await pool.query(`
    SELECT schemaname, indexname FROM pg_indexes
    WHERE tablename LIKE 'sales_orders%'
      AND indexname NOT LIKE '%_pkey'
  `);
  for (const row of idxResult.rows) {
    await pool.query(`DROP INDEX IF EXISTS "${row.indexname}"`);
  }
  console.log(`Dropped ${idxResult.rows.length} indexes.\n`);

  // ── Bulk insert ──
  let inserted = 0;
  for (let offset = 1; inserted < TARGET; offset += BATCH) {
    const size = Math.min(BATCH, TARGET - inserted);
    const start = performance.now();

    await pool.query(batchSQL, [offset, size]);

    inserted += size;
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    const pct = ((inserted / TARGET) * 100).toFixed(1);
    const rate = Math.round(size / ((performance.now() - start) / 1000));
    console.log(
      `  ${inserted.toLocaleString().padStart(15)} / ${TARGET.toLocaleString()} ` +
      `(${pct.padStart(5)}%)  ${elapsed}s  ${rate.toLocaleString()} rows/s`
    );
  }

  // ── Verify partition distribution ──
  console.log('\nPartition distribution:');
  const partResult = await pool.query(`
    SELECT relname, pg_size_pretty(pg_relation_size(oid)) AS size,
           (SELECT count(*) FROM pg_class c2 WHERE c2.oid = c.reltoastrelid) AS toast
    FROM pg_class c
    WHERE relname LIKE 'sales_orders_20%' AND relkind = 'r'
    ORDER BY relname
  `);
  for (const row of partResult.rows) {
    const countRes = await pool.query(`SELECT count(*)::bigint AS cnt FROM "${row.relname}"`);
    console.log(`  ${row.relname}: ${Number(countRes.rows[0].cnt).toLocaleString()} rows (${row.size})`);
  }

  // ── Rebuild indexes ──
  console.log('\nRebuilding indexes...');
  const indexStart = performance.now();
  // Extract single-line CREATE INDEX statements
  const indexLines = schemaSQL.split('\n').filter(line =>
    line.startsWith('CREATE INDEX') ||
    line.startsWith('CREATE UNIQUE')
  );
  for (const stmt of indexLines) {
    if (stmt.trim()) {
      const label = stmt.match(/IF NOT EXISTS (\S+)/)?.[1] ?? stmt.slice(0, 50);
      process.stdout.write(`  ${label}...`);
      const t = performance.now();
      await pool.query(stmt);
      console.log(` ${((performance.now() - t) / 1000).toFixed(1)}s`);
    }
  }
  console.log(`Indexes rebuilt in ${((performance.now() - indexStart) / 1000).toFixed(1)}s`);

  // ── Rebuild materialized views ──
  console.log('\nRebuilding materialized views...');
  const mvStart = performance.now();
  const mvStatements = schemaSQL.match(/CREATE MATERIALIZED VIEW[\s\S]*?;/g) ?? [];
  for (const mv of mvStatements) {
    const name = mv.match(/IF NOT EXISTS (\S+)/)?.[1] ?? 'view';
    process.stdout.write(`  ${name}...`);
    const t = performance.now();
    await pool.query(mv);
    console.log(` ${((performance.now() - t) / 1000).toFixed(1)}s`);
  }
  console.log(`Materialized views rebuilt in ${((performance.now() - mvStart) / 1000).toFixed(1)}s`);

  // ── Seed employees ──
  const empSQL = `
    INSERT INTO employees (name, email, department, position, salary, rating, start_date, status, location, projects, is_remote)
    SELECT
      fn || ' ' || ln,
      LOWER(fn) || '.' || LOWER(ln) || '@company.com',
      (ARRAY['Engineering','Marketing','Sales','Finance','HR','Operations','Product','Design'])[1 + abs(hashint4(i)) % 8],
      (ARRAY['Junior','Mid','Senior','Lead','Manager','Director','VP'])[1 + pi],
      (ARRAY[60000,80000,110000,130000,150000,180000,220000])[1 + pi] * (85 + abs(hashint4(i*3)) % 30) / 100,
      ROUND((2.5 + (abs(hashint4(i*4)) % 25) / 10.0)::numeric, 1),
      ('2015-01-01'::date + abs(hashint4(i*5)) % 3650),
      CASE WHEN abs(hashint4(i*6)) % 4 < 3 THEN 'active' ELSE (ARRAY['active','on-leave','probation','inactive'])[1 + abs(hashint4(i*7)) % 4] END,
      (ARRAY['New York','San Francisco','London','Berlin','Tokyo','Sydney','Toronto','Singapore'])[1 + abs(hashint4(i*8)) % 8],
      1 + abs(hashint4(i*9)) % 15,
      abs(hashint4(i*10)) % 100 < 35
    FROM generate_series(1, 200) AS i,
    LATERAL (SELECT
      (ARRAY['Alice','Bob','Carol','David','Eve','Frank','Grace','Henry','Iris','Jack',
             'Kate','Leo','Mia','Noah','Olivia','Paul','Quinn','Rosa','Sam','Tina'])[1 + abs(hashint4(i)) % 20] AS fn,
      (ARRAY['Smith','Johnson','Brown','Davis','Wilson','Lee','Chen','Wang','Garcia','Martinez',
             'Taylor','Thomas','Harris','Clark','Lewis','Walker','Hall','Allen','Young','King'])[1 + abs(hashint4(i*11)) % 20] AS ln,
      abs(hashint4(i*2)) % 7 AS pi
    ) AS names`;
  await pool.query(empSQL);
  console.log('\n200 employees seeded.');

  // ── ANALYZE for query planner ──
  console.log('\nRunning ANALYZE...');
  await pool.query('ANALYZE sales_orders');
  await pool.query('ANALYZE employees');
  console.log('ANALYZE complete.');

  const totalSec = ((performance.now() - totalStart) / 1000).toFixed(1);
  console.log(`\nDone! ${TARGET.toLocaleString()} sales_orders (32 cols, 8 partitions) + 200 employees in ${totalSec}s\n`);

  await pool.end();
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
