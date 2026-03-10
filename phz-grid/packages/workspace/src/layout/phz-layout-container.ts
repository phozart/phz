/**
 * @phozart/phz-workspace — Layout Container HTML Generation (K.3)
 *
 * Pure functions that generate accessible HTML from LayoutNode trees.
 * These produce HTML strings for SSR / headless usage. The Lit component
 * wrapper (if needed) consumes these generators.
 */

import type {
  LayoutNode,
  AutoGridLayout,
  TabsLayout,
  SectionsLayout,
  WidgetSlot,
  FreeformLayout,
} from '../schema/config-layers.js';

export function generateLayoutHTML(node: LayoutNode): string {
  switch (node.kind) {
    case 'widget': return generateWidgetSlotHTML(node);
    case 'auto-grid': return generateGridHTML(node);
    case 'tabs': return generateTabsHTML(node);
    case 'sections': return generateSectionsHTML(node);
    case 'freeform': return generateFreeformHTML(node);
    default: return '';
  }
}

function generateWidgetSlotHTML(node: WidgetSlot): string {
  const style: string[] = [];
  if (node.minHeight) style.push(`min-height: ${node.minHeight}px`);
  if (node.weight && node.weight > 1) style.push(`grid-column: span ${node.weight}`);
  const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';
  return `<div class="phz-widget-slot" data-widget-id="${node.widgetId}"${styleAttr}></div>`;
}

export function generateGridHTML(node: AutoGridLayout): string {
  const gridStyle = `display: grid; grid-template-columns: repeat(auto-fill, minmax(${node.minItemWidth}px, 1fr)); gap: ${node.gap}px;`;
  const children = node.children.map(c => generateLayoutHTML(c)).join('\n');
  return `<div class="phz-auto-grid" style="${gridStyle}">\n${children}\n</div>`;
}

export function generateTabsHTML(node: TabsLayout): string {
  const tabButtons = node.tabs.map((tab, i) => {
    const icon = tab.icon ? `<span class="phz-tab-icon" data-icon="${tab.icon}"></span>` : '';
    const selected = i === 0 ? 'true' : 'false';
    const tabindex = i === 0 ? '0' : '-1';
    return `<button role="tab" id="tab-${i}" aria-selected="${selected}" aria-controls="panel-${i}" tabindex="${tabindex}">${icon}${tab.label}</button>`;
  }).join('\n');

  const panels = node.tabs.map((tab, i) => {
    const children = tab.children.map(c => generateLayoutHTML(c)).join('\n');
    const hidden = i > 0 ? ' hidden' : '';
    return `<div role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}"${hidden}>\n${children}\n</div>`;
  }).join('\n');

  return `<div class="phz-tabs">\n<div role="tablist">\n${tabButtons}\n</div>\n${panels}\n</div>`;
}

export function generateSectionsHTML(node: SectionsLayout): string {
  const sections = node.sections.map((section) => {
    const children = section.children.map(c => generateLayoutHTML(c)).join('\n');
    const collapsed = section.collapsed ? ' collapsed data-collapsed="true"' : '';
    const expanded = section.collapsed ? 'false' : 'true';
    return `<div class="phz-layout-section"${collapsed}>
<div class="phz-section-header" role="button" aria-expanded="${expanded}" tabindex="0">
<span class="phz-section-title">${section.title}</span>
</div>
<div class="phz-section-content"${section.collapsed ? ' hidden' : ''}>
${children}
</div>
</div>`;
  }).join('\n');

  return `<div class="phz-sections">\n${sections}\n</div>`;
}

export function generateFreeformHTML(node: FreeformLayout): string {
  const gridStyle = `display: grid; grid-template-columns: repeat(${node.columns}, ${node.cellSizePx}px); grid-auto-rows: ${node.cellSizePx}px; gap: ${node.gapPx}px; position: relative;`;
  const children = node.children.map(c => {
    const style = [
      `grid-column: ${c.col + 1} / span ${c.colSpan}`,
      `grid-row: ${c.row + 1} / span ${c.rowSpan}`,
    ];
    if (c.zIndex !== undefined) style.push(`z-index: ${c.zIndex}`);
    return `<div class="phz-widget-slot" data-widget-id="${c.widgetId}" style="${style.join('; ')}"></div>`;
  }).join('\n');
  return `<div class="phz-freeform-grid" style="${gridStyle}">\n${children}\n</div>`;
}
