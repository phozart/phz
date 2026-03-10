import { describe, it, expect } from 'vitest';

/**
 * Heatmap — pure logic tests (no DOM).
 * Tests color interpolation, cell layout, and accessible descriptions.
 */

// --- Types ---

interface HeatmapDatum {
  row: string;
  col: string;
  value: number;
}

interface HeatmapCell {
  row: string;
  col: string;
  value: number;
  rowIndex: number;
  colIndex: number;
  color: string;
  normalizedValue: number;
}

// --- Pure functions under test ---

function interpolateColor(
  normalizedValue: number,
  colorScale: [string, string] = ['#EFF6FF', '#1D4ED8'],
): string {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  const fromRGB = hexToRGB(colorScale[0]);
  const toRGB = hexToRGB(colorScale[1]);
  const r = Math.round(fromRGB.r + (toRGB.r - fromRGB.r) * clamped);
  const g = Math.round(fromRGB.g + (toRGB.g - fromRGB.g) * clamped);
  const b = Math.round(fromRGB.b + (toRGB.b - fromRGB.b) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function computeHeatmapCells(
  data: HeatmapDatum[],
  colorScale: [string, string] = ['#EFF6FF', '#1D4ED8'],
): { cells: HeatmapCell[]; rows: string[]; cols: string[] } {
  if (data.length === 0) return { cells: [], rows: [], cols: [] };

  const rows = [...new Set(data.map(d => d.row))];
  const cols = [...new Set(data.map(d => d.col))];
  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const cells = data.map(d => {
    const normalizedValue = (d.value - minVal) / range;
    return {
      row: d.row,
      col: d.col,
      value: d.value,
      rowIndex: rows.indexOf(d.row),
      colIndex: cols.indexOf(d.col),
      color: interpolateColor(normalizedValue, colorScale),
      normalizedValue,
    };
  });

  return { cells, rows, cols };
}

function buildHeatmapAccessibleDescription(
  data: HeatmapDatum[],
  rows: string[],
  cols: string[],
): string {
  const lines: string[] = [];
  for (const row of rows) {
    const rowData = cols.map(col => {
      const cell = data.find(d => d.row === row && d.col === col);
      return `${col}: ${cell?.value ?? 'N/A'}`;
    }).join(', ');
    lines.push(`${row}: ${rowData}`);
  }
  return lines.join('. ');
}


// ============ TESTS ============

describe('Heatmap — hexToRGB', () => {
  it('parses white', () => {
    expect(hexToRGB('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses black', () => {
    expect(hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses blue', () => {
    expect(hexToRGB('#1D4ED8')).toEqual({ r: 29, g: 78, b: 216 });
  });

  it('handles without hash', () => {
    expect(hexToRGB('EFF6FF')).toEqual({ r: 239, g: 246, b: 255 });
  });
});

describe('Heatmap — interpolateColor', () => {
  it('returns start color at 0', () => {
    const color = interpolateColor(0, ['#000000', '#FFFFFF']);
    expect(color).toBe('rgb(0, 0, 0)');
  });

  it('returns end color at 1', () => {
    const color = interpolateColor(1, ['#000000', '#FFFFFF']);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  it('returns midpoint at 0.5', () => {
    const color = interpolateColor(0.5, ['#000000', '#FFFFFF']);
    expect(color).toBe('rgb(128, 128, 128)');
  });

  it('clamps values above 1', () => {
    const color = interpolateColor(2.0, ['#000000', '#FFFFFF']);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  it('clamps values below 0', () => {
    const color = interpolateColor(-1, ['#000000', '#FFFFFF']);
    expect(color).toBe('rgb(0, 0, 0)');
  });
});

describe('Heatmap — computeHeatmapCells', () => {
  it('computes cells with correct row/col indices', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 10 },
      { row: 'A', col: 'Y', value: 20 },
      { row: 'B', col: 'X', value: 30 },
      { row: 'B', col: 'Y', value: 40 },
    ];
    const result = computeHeatmapCells(data);
    expect(result.rows).toEqual(['A', 'B']);
    expect(result.cols).toEqual(['X', 'Y']);
    expect(result.cells).toHaveLength(4);
  });

  it('normalizes values between 0 and 1', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 10 },
      { row: 'A', col: 'Y', value: 50 },
      { row: 'B', col: 'X', value: 30 },
    ];
    const result = computeHeatmapCells(data);
    const minCell = result.cells.find(c => c.value === 10)!;
    const maxCell = result.cells.find(c => c.value === 50)!;
    expect(minCell.normalizedValue).toBe(0);
    expect(maxCell.normalizedValue).toBe(1);
  });

  it('handles single value (all normalized to 0)', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 42 },
    ];
    const result = computeHeatmapCells(data);
    expect(result.cells[0].normalizedValue).toBe(0);
  });

  it('handles all equal values', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 5 },
      { row: 'A', col: 'Y', value: 5 },
    ];
    const result = computeHeatmapCells(data);
    // range is 0, falls back to 1, so all normalized to 0
    expect(result.cells[0].normalizedValue).toBe(0);
    expect(result.cells[1].normalizedValue).toBe(0);
  });

  it('returns empty for empty data', () => {
    const result = computeHeatmapCells([]);
    expect(result.cells).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.cols).toEqual([]);
  });

  it('assigns colors from interpolation', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 0 },
      { row: 'A', col: 'Y', value: 100 },
    ];
    const result = computeHeatmapCells(data, ['#000000', '#FFFFFF']);
    expect(result.cells[0].color).toBe('rgb(0, 0, 0)');
    expect(result.cells[1].color).toBe('rgb(255, 255, 255)');
  });
});

describe('Heatmap — buildHeatmapAccessibleDescription', () => {
  it('describes all cells by row', () => {
    const data: HeatmapDatum[] = [
      { row: 'Jan', col: 'Mon', value: 5 },
      { row: 'Jan', col: 'Tue', value: 10 },
      { row: 'Feb', col: 'Mon', value: 15 },
      { row: 'Feb', col: 'Tue', value: 20 },
    ];
    const desc = buildHeatmapAccessibleDescription(data, ['Jan', 'Feb'], ['Mon', 'Tue']);
    expect(desc).toBe('Jan: Mon: 5, Tue: 10. Feb: Mon: 15, Tue: 20');
  });

  it('shows N/A for missing cells', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 1 },
    ];
    const desc = buildHeatmapAccessibleDescription(data, ['A'], ['X', 'Y']);
    expect(desc).toContain('Y: N/A');
  });

  it('handles empty data', () => {
    expect(buildHeatmapAccessibleDescription([], [], [])).toBe('');
  });
});
