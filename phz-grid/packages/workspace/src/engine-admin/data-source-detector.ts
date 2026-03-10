/**
 * @phozart/phz-engine-admin — Data Source Detector
 *
 * Pure utility functions for schema detection, delimiter detection,
 * CSV parsing, and source config validation.
 */

export interface DetectedField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  nullable: boolean;
}

export interface CSVParseOptions {
  delimiter: string;
  hasHeader: boolean;
  maxRows: number;
}

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export type SourceType = 'json' | 'csv' | 'rest' | 'duckdb';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function inferType(value: unknown): 'string' | 'number' | 'boolean' | 'date' | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) return 'date';
  if (typeof value === 'string') return 'string';
  return 'string';
}

export function detectSchema(data: Record<string, unknown>[]): DetectedField[] {
  if (data.length === 0) return [];

  const fieldNames = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      fieldNames.add(key);
    }
  }

  const fields: DetectedField[] = [];

  for (const name of fieldNames) {
    const types = new Set<string>();
    let hasNull = false;

    for (const row of data) {
      const val = row[name];
      if (val === null || val === undefined) {
        hasNull = true;
        continue;
      }
      const t = inferType(val);
      if (t) types.add(t);
    }

    let type: DetectedField['type'];
    if (types.size === 0) {
      type = 'string';
      hasNull = true;
    } else if (types.size === 1) {
      type = [...types][0] as DetectedField['type'];
    } else {
      type = 'string';
    }

    fields.push({ name, type, nullable: hasNull });
  }

  return fields;
}

export function detectDelimiter(text: string): string {
  const candidates = [',', '\t', ';', '|'];
  const firstLine = text.split('\n')[0] ?? '';

  let bestDelimiter = ',';
  let bestCount = 0;

  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

export function parseCSVPreview(text: string, options: CSVParseOptions): CSVParseResult {
  if (!text.trim()) return { headers: [], rows: [] };

  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  let headers: string[];
  let dataStart: number;

  if (options.hasHeader) {
    headers = lines[0].split(options.delimiter).map(h => h.trim());
    dataStart = 1;
  } else {
    const colCount = lines[0].split(options.delimiter).length;
    headers = Array.from({ length: colCount }, (_, i) => `column_${i + 1}`);
    dataStart = 0;
  }

  const rows: Record<string, string>[] = [];
  const end = Math.min(lines.length, dataStart + options.maxRows);

  for (let i = dataStart; i < end; i++) {
    const values = lines[i].split(options.delimiter).map(v => v.trim());
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

export function validateSourceConfig(
  sourceType: SourceType,
  config: Record<string, unknown>,
): ValidationResult {
  switch (sourceType) {
    case 'json':
      if (!config.data && !config.url) {
        return { valid: false, error: 'JSON source requires data or URL' };
      }
      return { valid: true };

    case 'csv':
      if (!config.data && !config.url) {
        return { valid: false, error: 'CSV source requires data or URL' };
      }
      return { valid: true };

    case 'rest':
      if (!config.url) {
        return { valid: false, error: 'REST API source requires a URL' };
      }
      return { valid: true };

    case 'duckdb':
      if (!config.tableName && !config.filePath) {
        return { valid: false, error: 'DuckDB source requires a table name or file path' };
      }
      return { valid: true };

    default:
      return { valid: false, error: `Unknown source type: ${sourceType}` };
  }
}
