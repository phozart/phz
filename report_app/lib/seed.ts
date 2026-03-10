import { settingsPool, dataPool } from './db';
import { readFileSync } from 'fs';
import { join } from 'path';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Product', 'Design'];
const POSITIONS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP'];
const EMP_STATUS = ['active', 'on-leave', 'probation', 'inactive'];
const LOCATIONS = ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Singapore'];
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack',
  'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rosa', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yuki', 'Zara', 'Aaron', 'Beth', 'Carl', 'Diana',
  'Eric', 'Fiona', 'George', 'Holly', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nina'];
const LAST_NAMES = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Lee', 'Chen', 'Wang', 'Garcia', 'Martinez',
  'Taylor', 'Thomas', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King',
  'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Roberts',
  'Carter', 'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Morris'];

/** Initialize settings database schema. */
export async function initSettingsSchema() {
  const sql = readFileSync(join(process.cwd(), 'lib/schema-settings.sql'), 'utf-8');
  await settingsPool.query(sql);
}

/** Initialize data database schema. */
export async function initDataSchema() {
  const sql = readFileSync(join(process.cwd(), 'lib/schema-data.sql'), 'utf-8');
  await dataPool.query(sql);
}

/** Initialize both schemas (convenience). */
export async function initSchema() {
  await initSettingsSchema();
  await initDataSchema();
}

/**
 * Seed sales_orders using generate_series — runs entirely inside PostgreSQL.
 * Batches in 1M-row chunks to avoid connection/statement timeouts on large counts.
 */
export async function seedSalesOrders(count: number): Promise<number> {
  await dataPool.query('TRUNCATE sales_orders RESTART IDENTITY');
  const seedSQL = readFileSync(join(process.cwd(), 'lib/seed-large.sql'), 'utf-8');

  const BATCH = 1_000_000;
  for (let offset = 1; offset <= count; offset += BATCH) {
    const batchSize = Math.min(BATCH, count - offset + 1);
    await dataPool.query(seedSQL, [offset, batchSize]);
  }
  return count;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export async function seedEmployees(count: number = 200): Promise<number> {
  await dataPool.query('TRUNCATE employees RESTART IDENTITY');
  const rng = seededRandom(99);
  const rows: string[] = [];

  for (let i = 0; i < count; i++) {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const posIdx = Math.min(Math.floor(rng() * 7), 6);
    const baseSalary = [60000, 80000, 110000, 130000, 150000, 180000, 220000][posIdx];
    const salary = Math.round(baseSalary * (0.85 + rng() * 0.3));
    const rating = Math.round((2.5 + rng() * 2.5) * 10) / 10;
    const startYear = 2015 + Math.floor(rng() * 10);
    const startMonth = String(1 + Math.floor(rng() * 12)).padStart(2, '0');
    const startDay = String(1 + Math.floor(rng() * 28)).padStart(2, '0');
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const projects = Math.floor(rng() * 15) + 1;
    const isRemote = rng() < 0.35;
    const status = EMP_STATUS[rng() < 0.75 ? 0 : Math.floor(rng() * EMP_STATUS.length)];
    const location = LOCATIONS[Math.floor(rng() * LOCATIONS.length)];

    rows.push(`('${firstName} ${lastName}','${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com','${dept}','${POSITIONS[posIdx]}',${salary},${rating},'${startYear}-${startMonth}-${startDay}','${status}','${location}',${projects},${isRemote})`);
  }

  await dataPool.query(
    `INSERT INTO employees (name,email,department,position,salary,rating,start_date,status,location,projects,is_remote) VALUES ${rows.join(',')}`
  );
  return count;
}
