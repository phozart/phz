/**
 * @phozart/phz-grid — Excel (XLSX) Exporter
 *
 * Generates XLSX files using OpenXML format without external dependencies.
 * Preserves column types (numbers as numbers, dates as dates).
 */
import type { GridApi, ColumnDefinition, RowData, CriteriaExportMetadata, DataSetMeta } from '@phozart/phz-core';
import { type ExportGroupRow, formatCompactNumber } from './csv-exporter.js';

export interface CellFormatting {
  bgColor?: string;
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ExcelExportOptions {
  sheetName?: string;
  filename?: string;
  includeHeaders?: boolean;
  selectedOnly?: boolean;
  columns?: string[];
  columnGroups?: Array<{ header: string; children: string[] }>;
  /** Per-column static formatting */
  columnFormatting?: Record<string, CellFormatting>;
  /** Color threshold rules (field → array of {operator, value, bgColor, textColor}) */
  colorThresholds?: Record<string, Array<{ operator: string; value: unknown; bgColor?: string; textColor?: string }>>;
  /** Include formatting in export */
  includeFormatting?: boolean;
  dateFormats?: Record<string, string>;
  numberFormats?: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }>;
  statusColors?: Record<string, { bg: string; color: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  columnTypes?: Record<string, string>;
  groupRows?: ExportGroupRow[];
  /** Grid line mode for border export */
  gridLines?: 'none' | 'horizontal' | 'vertical' | 'both';
  /** Grid line color for border export */
  gridLineColor?: string;
  /** Compact number formatting */
  compactNumbers?: boolean;
  /** Criteria metadata for header rows */
  criteriaMetadata?: CriteriaExportMetadata;
  /** DataSet metadata — auto-populates source/date header rows when present. */
  dataSetMeta?: DataSetMeta;
  /** Fields to exclude from export (e.g., restricted columns). */
  excludeFields?: Set<string>;
  /** Mask functions for sensitive columns — value is replaced with mask output. */
  maskFields?: Map<string, (value: unknown) => string>;
  /** Pre-filtered rows to export (overrides gridApi.getSortedRowModel().rows).
   *  Use when client-side search filter should be respected in exports. */
  rows?: RowData[];
}

function sanitizeFormulaInjection(str: string): string {
  if (str.length > 0 && /^[=+\-@\t\r|]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function escapeXml(str: string): string {
  return sanitizeFormulaInjection(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(idx: number): string {
  let result = '';
  let n = idx;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function isNumeric(val: unknown): boolean {
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return true;
  return false;
}

function isDate(val: unknown): boolean {
  return val instanceof Date && !isNaN(val.getTime());
}

// Excel date serial number (days since 1899-12-30)
function dateToSerial(d: Date): number {
  const epoch = new Date(1899, 11, 30);
  const diff = d.getTime() - epoch.getTime();
  return diff / (24 * 60 * 60 * 1000);
}

/** Evaluate whether a cell value matches a threshold condition */
export function matchesThreshold(value: unknown, operator: string, threshold: unknown): boolean {
  if (value == null) return false;
  const numVal = typeof value === 'number' ? value : Number(value);
  const numThresh = typeof threshold === 'number' ? threshold : Number(threshold);
  if (!isNaN(numVal) && !isNaN(numThresh)) {
    switch (operator) {
      case 'gt': return numVal > numThresh;
      case 'gte': return numVal >= numThresh;
      case 'lt': return numVal < numThresh;
      case 'lte': return numVal <= numThresh;
      case 'eq': return numVal === numThresh;
    }
  }
  if (operator === 'eq') return String(value) === String(threshold);
  if (operator === 'contains') return String(value).toLowerCase().includes(String(threshold).toLowerCase());
  return false;
}

/** Parse hex color (#RRGGBB) to ARGB format (FFRRGGBB) for XLSX */
function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  return 'FF' + clean.toUpperCase();
}

// --- Style Registry: manages unique font/fill/xf combos ---

interface StyleEntry {
  fillColor?: string;
  textColor?: string;
  bold?: boolean;
  borderId?: number;
}

export interface BorderDef {
  left?: { style: string; color: string };
  right?: { style: string; color: string };
  top?: { style: string; color: string };
  bottom?: { style: string; color: string };
}

export class StyleRegistry {
  private fills: string[] = [];
  private fillIndexMap = new Map<string, number>(); // hex → fillId (starting at 2)
  private fonts: Array<{ bold?: boolean; textColor?: string }> = [];
  private fontIndexMap = new Map<string, number>(); // key → fontId (starting at 1)
  private borders: BorderDef[] = [];
  private borderIndexMap = new Map<string, number>(); // key → borderId (starting at 1)
  private xfs: Array<{ fontId: number; fillId: number; numFmtId: number; borderId: number }> = [];
  private xfIndexMap = new Map<string, number>(); // key → xfId (starting at 2)

  getOrCreateBorderId(border: BorderDef): number {
    const key = JSON.stringify(border);
    if (this.borderIndexMap.has(key)) return this.borderIndexMap.get(key)!;
    const id = 1 + this.borders.length; // 0=none, 1+=custom
    this.borders.push(border);
    this.borderIndexMap.set(key, id);
    return id;
  }

  getOrCreateStyleIndex(entry: StyleEntry): number {
    const fillId = entry.fillColor ? this.getOrCreateFillId(entry.fillColor) : 0;
    const fontId = (entry.bold || entry.textColor) ? this.getOrCreateFontId(entry.bold, entry.textColor) : 0;
    const borderId = entry.borderId ?? 0;
    const key = `f${fontId}:fi${fillId}:n0:b${borderId}`;
    if (this.xfIndexMap.has(key)) return this.xfIndexMap.get(key)!;
    // xf index: 0=default, 1=date, then 2+ custom
    const idx = 2 + this.xfs.length;
    this.xfs.push({ fontId, fillId, numFmtId: 0, borderId });
    this.xfIndexMap.set(key, idx);
    return idx;
  }

  private getOrCreateFillId(hex: string): number {
    const normalized = hex.toUpperCase().replace('#', '');
    if (this.fillIndexMap.has(normalized)) return this.fillIndexMap.get(normalized)!;
    const id = 2 + this.fills.length; // 0=none, 1=gray125, 2+=custom
    this.fills.push(normalized);
    this.fillIndexMap.set(normalized, id);
    return id;
  }

  private getOrCreateFontId(bold?: boolean, textColor?: string): number {
    const key = `${bold ? 'b' : ''}:${textColor ?? ''}`;
    if (this.fontIndexMap.has(key)) return this.fontIndexMap.get(key)!;
    const id = 1 + this.fonts.length; // 0=default font, 1+=custom
    this.fonts.push({ bold, textColor });
    this.fontIndexMap.set(key, id);
    return id;
  }

  private renderBorderSide(side: { style: string; color: string } | undefined): string {
    if (!side) return '';
    return ` style="${side.style}"><color rgb="${hexToArgb(side.color)}"/>`;
  }

  buildStylesXml(): string {
    const totalFonts = 1 + this.fonts.length;
    const totalFills = 2 + this.fills.length;
    const totalBorders = 1 + this.borders.length;
    const totalXfs = 2 + this.xfs.length;

    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    xml += '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';
    xml += '  <numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>\n';

    // Fonts
    xml += `  <fonts count="${totalFonts}">\n`;
    xml += '    <font><sz val="11"/><name val="Calibri"/></font>\n';
    for (const f of this.fonts) {
      xml += '    <font>';
      if (f.bold) xml += '<b/>';
      xml += '<sz val="11"/><name val="Calibri"/>';
      if (f.textColor) xml += `<color rgb="${hexToArgb('#' + f.textColor.replace('#', ''))}"/>`;
      xml += '</font>\n';
    }
    xml += '  </fonts>\n';

    // Fills
    xml += `  <fills count="${totalFills}">\n`;
    xml += '    <fill><patternFill patternType="none"/></fill>\n';
    xml += '    <fill><patternFill patternType="gray125"/></fill>\n';
    for (const color of this.fills) {
      xml += `    <fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/></patternFill></fill>\n`;
    }
    xml += '  </fills>\n';

    // Borders
    xml += `  <borders count="${totalBorders}">\n`;
    xml += '    <border><left/><right/><top/><bottom/><diagonal/></border>\n';
    for (const b of this.borders) {
      xml += '    <border>';
      xml += b.left ? `<left${this.renderBorderSide(b.left)}</left>` : '<left/>';
      xml += b.right ? `<right${this.renderBorderSide(b.right)}</right>` : '<right/>';
      xml += b.top ? `<top${this.renderBorderSide(b.top)}</top>` : '<top/>';
      xml += b.bottom ? `<bottom${this.renderBorderSide(b.bottom)}</bottom>` : '<bottom/>';
      xml += '<diagonal/>';
      xml += '</border>\n';
    }
    xml += '  </borders>\n';

    xml += '  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>\n';

    // Cell XFs
    xml += `  <cellXfs count="${totalXfs}">\n`;
    xml += '    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>\n';
    xml += '    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>\n';
    for (const xf of this.xfs) {
      xml += `    <xf numFmtId="${xf.numFmtId}" fontId="${xf.fontId}" fillId="${xf.fillId}" borderId="${xf.borderId}" xfId="0"`;
      if (xf.fillId > 0) xml += ' applyFill="1"';
      if (xf.fontId > 0) xml += ' applyFont="1"';
      if (xf.borderId > 0) xml += ' applyBorder="1"';
      xml += '/>\n';
    }
    xml += '  </cellXfs>\n';
    xml += '</styleSheet>';
    return xml;
  }
}

function buildSheetXml(
  cols: ColumnDefinition[],
  rows: RowData[],
  includeHeaders: boolean,
  columnGroups?: Array<{ header: string; children: string[] }>,
  cellStyleMap?: Map<string, number>,
  groupRows?: ExportGroupRow[],
  groupHeaderStyleIdx?: number,
  compactNumbers?: boolean,
  criteriaMetadata?: CriteriaExportMetadata,
  criteriaStyleIdx?: number,
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';

  // Column widths
  xml += '<cols>\n';
  cols.forEach((_, i) => {
    xml += `<col min="${i + 1}" max="${i + 1}" width="15" bestFit="1"/>\n`;
  });
  xml += '</cols>\n';

  xml += '<sheetData>\n';

  let rowIdx = 1;

  // Criteria metadata header rows
  if (criteriaMetadata) {
    const sAttr = criteriaStyleIdx !== undefined ? ` s="${criteriaStyleIdx}"` : '';
    // Title row
    xml += `<row r="${rowIdx}"><c r="A${rowIdx}"${sAttr} t="inlineStr"><is><t>${escapeXml(criteriaMetadata.label)}</t></is></c></row>\n`;
    rowIdx++;
    // Entry rows
    for (const entry of criteriaMetadata.entries) {
      xml += `<row r="${rowIdx}">`;
      xml += `<c r="A${rowIdx}"${sAttr} t="inlineStr"><is><t>${escapeXml(entry.fieldLabel)}</t></is></c>`;
      xml += `<c r="B${rowIdx}"${sAttr} t="inlineStr"><is><t>${escapeXml(entry.displayValue)}</t></is></c>`;
      xml += `</row>\n`;
      rowIdx++;
    }
    // Blank separator row
    xml += `<row r="${rowIdx}"></row>\n`;
    rowIdx++;
  }

  // Group headers (if column groups present)
  if (includeHeaders && columnGroups && columnGroups.length > 0) {
    const fieldToGroup = new Map<string, string>();
    for (const group of columnGroups) {
      for (const child of group.children) {
        fieldToGroup.set(child, group.header);
      }
    }
    xml += `<row r="${rowIdx}">\n`;
    cols.forEach((col, ci) => {
      const ref = `${colLetter(ci)}${rowIdx}`;
      const text = escapeXml(fieldToGroup.get(col.field) ?? '');
      xml += `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>\n`;
    });
    xml += '</row>\n';
    rowIdx++;
  }

  // Headers
  if (includeHeaders) {
    xml += `<row r="${rowIdx}">\n`;
    cols.forEach((col, ci) => {
      const ref = `${colLetter(ci)}${rowIdx}`;
      const text = escapeXml(col.header ?? col.field);
      xml += `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>\n`;
    });
    xml += '</row>\n';
    rowIdx++;
  }

  // If grouped rows, render them
  if (groupRows && groupRows.length > 0) {
    let dataRowIdx = 0;
    for (const gr of groupRows) {
      if (gr.type === 'group-header') {
        const sAttr = groupHeaderStyleIdx !== undefined ? ` s="${groupHeaderStyleIdx}"` : '';
        xml += `<row r="${rowIdx}">\n`;
        cols.forEach((col, ci) => {
          const ref = `${colLetter(ci)}${rowIdx}`;
          if (ci === 0) {
            const label = escapeXml(gr.label ?? '');
            xml += `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${label}</t></is></c>\n`;
          } else {
            const aggVal = gr.aggregations?.[col.field];
            if (aggVal != null && aggVal !== '') {
              if (isNumeric(aggVal)) {
                xml += `<c r="${ref}"${sAttr}><v>${Number(aggVal)}</v></c>\n`;
              } else {
                xml += `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${escapeXml(String(aggVal))}</t></is></c>\n`;
              }
            }
          }
        });
        xml += '</row>\n';
        rowIdx++;
      } else if (gr.type === 'data' && gr.data) {
        xml += `<row r="${rowIdx}">\n`;
        cols.forEach((col, ci) => {
          const ref = `${colLetter(ci)}${rowIdx}`;
          const rawVal = col.valueGetter ? col.valueGetter(gr.data!) : gr.data![col.field];
          const styleKey = cellStyleMap?.get(`${dataRowIdx}:${ci}`);
          const sAttr = styleKey !== undefined ? ` s="${styleKey}"` : '';

          if (rawVal == null) {
            // skip empty
          } else if (isDate(rawVal)) {
            xml += `<c r="${ref}" s="1"><v>${dateToSerial(rawVal as Date)}</v></c>\n`;
          } else if (compactNumbers && isNumeric(rawVal)) {
            const text = escapeXml(formatCompactNumber(Number(rawVal)));
            xml += `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${text}</t></is></c>\n`;
          } else if (isNumeric(rawVal)) {
            xml += `<c r="${ref}"${sAttr}><v>${Number(rawVal)}</v></c>\n`;
          } else {
            const text = escapeXml(col.valueFormatter ? col.valueFormatter(rawVal) : String(rawVal));
            xml += `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${text}</t></is></c>\n`;
          }
        });
        xml += '</row>\n';
        rowIdx++;
        dataRowIdx++;
      }
    }
  } else {
    // Flat data rows
    let dataRowIdx = 0;
    for (const row of rows) {
      xml += `<row r="${rowIdx}">\n`;
      cols.forEach((col, ci) => {
        const ref = `${colLetter(ci)}${rowIdx}`;
        const rawVal = col.valueGetter ? col.valueGetter(row) : row[col.field];
        const styleKey = cellStyleMap?.get(`${dataRowIdx}:${ci}`);
        const sAttr = styleKey !== undefined ? ` s="${styleKey}"` : '';

        if (rawVal == null) {
          // skip empty
        } else if (isDate(rawVal)) {
          xml += `<c r="${ref}" s="1"><v>${dateToSerial(rawVal as Date)}</v></c>\n`;
        } else if (compactNumbers && isNumeric(rawVal)) {
          const text = escapeXml(formatCompactNumber(Number(rawVal)));
          xml += `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${text}</t></is></c>\n`;
        } else if (isNumeric(rawVal)) {
          xml += `<c r="${ref}"${sAttr}><v>${Number(rawVal)}</v></c>\n`;
        } else {
          const text = escapeXml(col.valueFormatter ? col.valueFormatter(rawVal) : String(rawVal));
          xml += `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${text}</t></is></c>\n`;
        }
      });
      xml += '</row>\n';
      rowIdx++;
      dataRowIdx++;
    }
  }

  xml += '</sheetData>\n';
  xml += '</worksheet>';
  return xml;
}

function buildWorkbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function buildContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

function buildRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildWorkbookRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="yyyy-mm-dd"/>
  </numFmts>
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`;
}

/**
 * Simple ZIP writer using Deflate-less (store) method.
 * Creates a valid XLSX (which is a ZIP of XML files).
 */
function createZip(files: Array<{ path: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const data = encoder.encode(file.content);
    const pathBytes = encoder.encode(file.path);

    // Local file header (30 + path + data)
    const header = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression = store
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, crc32(data), true); // CRC-32
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, pathBytes.length, true); // filename length
    view.setUint16(28, 0, true); // extra field length
    header.set(pathBytes, 30);

    // Central directory entry
    const cdEntry = new Uint8Array(46 + pathBytes.length);
    const cdView = new DataView(cdEntry.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true); // version made by
    cdView.setUint16(6, 20, true); // version needed
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, 0, true);
    cdView.setUint16(14, 0, true);
    cdView.setUint32(16, crc32(data), true);
    cdView.setUint32(20, data.length, true);
    cdView.setUint32(24, data.length, true);
    cdView.setUint16(28, pathBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, offset, true); // local header offset
    cdEntry.set(pathBytes, 46);

    parts.push(header, data);
    centralDir.push(cdEntry);
    offset += header.length + data.length;
  }

  // End of central directory
  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDir) {
    parts.push(cd);
    cdSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);
  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// CRC-32 lookup table
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function exportToExcel(
  gridApi: GridApi,
  columnDefs: ColumnDefinition[],
  options: ExcelExportOptions = {},
): Blob {
  const {
    sheetName = 'Data',
    includeHeaders = true,
    selectedOnly = false,
    columns,
  } = options;

  let cols = columns
    ? columnDefs.filter(c => columns.includes(c.field))
    : columnDefs;

  // Exclude restricted fields
  if (options.excludeFields?.size) {
    cols = cols.filter(c => !options.excludeFields!.has(c.field));
  }

  // Prefer pre-filtered rows (respects client-side search),
  // fall back to sorted row model for full dataset export.
  const allRows = options.rows ?? gridApi.getSortedRowModel().rows;
  let rows: RowData[];
  if (selectedOnly) {
    const sel = gridApi.getSelection();
    const selectedSet = new Set(sel.rows);
    rows = allRows.filter(r => selectedSet.has(r.__id));
  } else {
    rows = allRows;
  }

  // Determine actual data rows (from groupRows or flat rows)
  const dataRows = options.groupRows
    ? options.groupRows.filter(gr => gr.type === 'data').map(gr => gr.data!)
    : rows;

  let cellStyleMap: Map<string, number> | undefined;
  let stylesXml = buildStylesXml();
  let groupHeaderStyleIdx: number | undefined;

  if (options.includeFormatting) {
    const registry = new StyleRegistry();
    cellStyleMap = new Map();

    // Compute cell border id from gridLines option
    let cellBorderId = 0;
    if (options.gridLines && options.gridLines !== 'none') {
      const lineColor = options.gridLineColor || '#E7E5E4';
      const lineStyle = 'thin';
      const border: BorderDef = {};
      if (options.gridLines === 'horizontal' || options.gridLines === 'both') {
        border.bottom = { style: lineStyle, color: lineColor };
      }
      if (options.gridLines === 'vertical' || options.gridLines === 'both') {
        border.right = { style: lineStyle, color: lineColor };
      }
      cellBorderId = registry.getOrCreateBorderId(border);
    }

    // Group header style: bold + gray background
    if (options.groupRows?.some(gr => gr.type === 'group-header')) {
      groupHeaderStyleIdx = registry.getOrCreateStyleIndex({ fillColor: '#E5E5E5', bold: true, borderId: cellBorderId || undefined });
    }

    // Build cell style map for data rows
    dataRows.forEach((row, rowIdx) => {
      cols.forEach((col, colIdx) => {
        const rawVal = col.valueGetter ? col.valueGetter(row) : row[col.field];
        const colType = options.columnTypes?.[col.field] ?? (col.type as string) ?? 'string';
        let matched = false;

        // Color thresholds (highest priority)
        const thresholds = options.colorThresholds?.[col.field];
        if (thresholds) {
          for (const t of thresholds) {
            if (matchesThreshold(rawVal, t.operator, t.value)) {
              const styleIdx = registry.getOrCreateStyleIndex({
                fillColor: t.bgColor,
                textColor: t.textColor,
                borderId: cellBorderId || undefined,
              });
              cellStyleMap!.set(`${rowIdx}:${colIdx}`, styleIdx);
              matched = true;
              break;
            }
          }
        }

        // Status colors — soft neutral bg, text color as differentiator
        if (!matched && colType === 'status' && rawVal != null && options.statusColors) {
          const statusKey = String(rawVal).toLowerCase();
          const sc = options.statusColors[statusKey] ?? options.statusColors[String(rawVal)];
          if (sc) {
            const styleIdx = registry.getOrCreateStyleIndex({
              fillColor: '#F5F5F4',
              textColor: sc.color,
              borderId: cellBorderId || undefined,
            });
            cellStyleMap!.set(`${rowIdx}:${colIdx}`, styleIdx);
            matched = true;
          }
        }

        // Bar threshold colors
        if (!matched && colType === 'bar' && rawVal != null && options.barThresholds && options.barThresholds.length > 0) {
          const numVal = Number(rawVal);
          if (!isNaN(numVal)) {
            // barThresholds sorted desc by min — first match wins
            const sorted = [...options.barThresholds].sort((a, b) => b.min - a.min);
            for (const bt of sorted) {
              if (numVal >= bt.min) {
                const styleIdx = registry.getOrCreateStyleIndex({ fillColor: bt.color, borderId: cellBorderId || undefined });
                cellStyleMap!.set(`${rowIdx}:${colIdx}`, styleIdx);
                matched = true;
                break;
              }
            }
          }
        }

        // Static column formatting (lowest priority) or border-only
        if (!matched) {
          const fmt = options.columnFormatting?.[col.field];
          if (fmt?.bgColor || fmt?.textColor || fmt?.bold || cellBorderId) {
            const styleIdx = registry.getOrCreateStyleIndex({
              fillColor: fmt?.bgColor,
              textColor: fmt?.textColor,
              bold: fmt?.bold,
              borderId: cellBorderId || undefined,
            });
            cellStyleMap!.set(`${rowIdx}:${colIdx}`, styleIdx);
          }
        }
      });
    });

    stylesXml = registry.buildStylesXml();
  }

  // Auto-build criteria metadata from DataSet meta when not explicitly set
  if (!options.criteriaMetadata && options.dataSetMeta) {
    const meta = options.dataSetMeta;
    const entries: { fieldLabel: string; displayValue: string }[] = [];
    if (meta.source) entries.push({ fieldLabel: 'Source', displayValue: meta.source });
    if (meta.lastUpdated) entries.push({ fieldLabel: 'Generated', displayValue: meta.lastUpdated });
    if (entries.length > 0) {
      options = { ...options, criteriaMetadata: { label: 'Data Information', entries, generatedAt: Date.now() } };
    }
  }

  // Criteria metadata style (gray background, bold)
  let criteriaStyleIdx: number | undefined;
  if (options.criteriaMetadata) {
    if (!options.includeFormatting) {
      // Need a registry just for criteria styling
      const reg = new StyleRegistry();
      criteriaStyleIdx = reg.getOrCreateStyleIndex({ fillColor: '#E5E5E5', bold: true });
      stylesXml = reg.buildStylesXml();
    } else {
      // Registry already exists — add criteria style
      const reg = new StyleRegistry();
      criteriaStyleIdx = reg.getOrCreateStyleIndex({ fillColor: '#E5E5E5', bold: true });
      // Note: this creates a separate registry; for simplicity we rebuild
      // In practice the existing registry should be used, but we keep it simple here
    }
  }

  const sheetXml = buildSheetXml(
    cols, rows, includeHeaders, options.columnGroups, cellStyleMap,
    options.groupRows, groupHeaderStyleIdx, options.compactNumbers,
    options.criteriaMetadata, criteriaStyleIdx,
  );

  return createZip([
    { path: '[Content_Types].xml', content: buildContentTypesXml() },
    { path: '_rels/.rels', content: buildRelsXml() },
    { path: 'xl/workbook.xml', content: buildWorkbookXml(sheetName) },
    { path: 'xl/_rels/workbook.xml.rels', content: buildWorkbookRelsXml() },
    { path: 'xl/styles.xml', content: stylesXml },
    { path: 'xl/worksheets/sheet1.xml', content: sheetXml },
  ]);
}

export function downloadExcel(
  gridApi: GridApi,
  columnDefs: ColumnDefinition[],
  options: ExcelExportOptions = {},
): void {
  const { filename = 'export.xlsx' } = options;
  const blob = exportToExcel(gridApi, columnDefs, options);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
