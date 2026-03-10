/**
 * @phozart/phz-widgets — Widget Export Utilities
 *
 * CSV generation, clipboard formatting, and image capture for widget data.
 */

export interface ExportColumn {
  key: string;
  label: string;
}

export function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function exportToCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename?: string,
): string {
  const header = columns.map(c => escapeCSVField(c.label)).join(',');
  const rows = data.map(row =>
    columns.map(c => escapeCSVField(row[c.key])).join(','),
  );
  const csv = [header, ...rows].join('\n');

  if (filename && typeof document !== 'undefined') {
    triggerDownload(csv, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv');
  }

  return csv;
}

export function formatClipboardData(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
): string {
  const sanitize = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[\t\n\r]/g, ' ');
  };

  const header = columns.map(c => sanitize(c.label)).join('\t');
  const rows = data.map(row =>
    columns.map(c => sanitize(row[c.key])).join('\t'),
  );
  return [header, ...rows].join('\n');
}

export async function exportToClipboard(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
): Promise<void> {
  const tsv = formatClipboardData(data, columns);
  await navigator.clipboard.writeText(tsv);
}

export async function exportToImage(
  element: HTMLElement,
  filename?: string,
  format: 'png' | 'svg' = 'png',
): Promise<void> {
  if (format === 'svg') {
    const svgEl = element.querySelector('svg') ?? element.shadowRoot?.querySelector('svg');
    if (!svgEl) throw new Error('No SVG element found');
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    triggerLinkDownload(url, filename ?? 'widget.svg');
    URL.revokeObjectURL(url);
    return;
  }

  const canvas = document.createElement('canvas');
  const rect = element.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${element.outerHTML}</div>
      </foreignObject>
    </svg>`;
  const img = new Image();
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => {
        if (!b) { reject(new Error('Failed to create image')); return; }
        const blobUrl = URL.createObjectURL(b);
        triggerLinkDownload(blobUrl, filename ?? 'widget.png');
        URL.revokeObjectURL(blobUrl);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image render failed')); };
    img.src = url;
  });
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerLinkDownload(url, filename);
  URL.revokeObjectURL(url);
}

function triggerLinkDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
