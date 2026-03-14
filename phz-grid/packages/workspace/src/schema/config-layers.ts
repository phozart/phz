/**
 * @phozart/workspace — Config Layer Separation Types
 *
 * DataDefinition = what data to show (fields, expressions, filters)
 * PresentationDefinition = how to show it (colors, formatting, layout)
 * LayoutIntent = where to place it (positioning, responsive behavior)
 */

export interface DataDefinition {
  fields: string[];
  expressions?: Record<string, string>;
  filters?: Record<string, unknown>;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

export interface PresentationDefinition {
  theme?: string;
  formatting?: Record<string, unknown>;
  density?: 'compact' | 'dense' | 'comfortable';
  colorScheme?: string[];
}

export interface LayoutIntent {
  type: 'flow' | 'grid' | 'stack';
  columns?: number;
  gap?: number;
  responsive?: boolean;
}

// --- Composable Layout Tree ---

export interface TabsLayout {
  kind: 'tabs';
  tabs: Array<{ label: string; icon?: string; children: LayoutNode[] }>;
}

export interface SectionsLayout {
  kind: 'sections';
  sections: Array<{ title: string; collapsed?: boolean; children: LayoutNode[] }>;
}

export interface AutoGridLayout {
  kind: 'auto-grid';
  minItemWidth: number;
  gap: number;
  maxColumns?: number;
  children: LayoutNode[];
}

export interface WidgetSlot {
  kind: 'widget';
  widgetId: string;
  weight?: number;
  minHeight?: number;
  dataTier?: 'preload' | 'full' | 'both';
}

export interface FreeformLayout {
  kind: 'freeform';
  columns: number;
  rows: number;
  cellSizePx: number;
  gapPx: number;
  children: FreeformWidgetSlot[];
}

export interface FreeformWidgetSlot {
  kind: 'freeform-widget';
  widgetId: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  zIndex?: number;
}

export type LayoutNode = TabsLayout | SectionsLayout | AutoGridLayout | FreeformLayout | WidgetSlot;

export function flattenLayoutWidgets(node: LayoutNode): string[] {
  switch (node.kind) {
    case 'widget': return [node.widgetId];
    case 'tabs': return node.tabs.flatMap(t => t.children.flatMap(flattenLayoutWidgets));
    case 'sections': return node.sections.flatMap(s => s.children.flatMap(flattenLayoutWidgets));
    case 'auto-grid': return node.children.flatMap(flattenLayoutWidgets);
    case 'freeform': return node.children.map(c => c.widgetId);
  }
}

export function freeformToAutoGrid(freeform: FreeformLayout): AutoGridLayout {
  // Sort children by position (top-to-bottom, left-to-right)
  const sorted = [...freeform.children].sort((a, b) => a.row - b.row || a.col - b.col);
  return {
    kind: 'auto-grid',
    minItemWidth: 200,
    gap: 16,
    children: sorted.map(c => ({
      kind: 'widget' as const,
      widgetId: c.widgetId,
      weight: Math.max(1, Math.round(c.colSpan / (freeform.columns / 12))),
      minHeight: c.rowSpan * (freeform.cellSizePx + freeform.gapPx),
    })),
  };
}

export function convertLegacyLayout(
  placements: Array<{ row: number; col: number; colSpan: number; rowSpan: number; widgetId: string }>,
): AutoGridLayout {
  const sorted = [...placements].sort((a, b) => a.row - b.row || a.col - b.col);
  return {
    kind: 'auto-grid',
    minItemWidth: 200,
    gap: 16,
    children: sorted.map(p => ({
      kind: 'widget' as const,
      widgetId: p.widgetId,
      weight: p.colSpan,
      minHeight: p.rowSpan * 100,
    })),
  };
}
