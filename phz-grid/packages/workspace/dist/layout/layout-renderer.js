/**
 * @phozart/workspace — Layout Renderer (K.1 + K.5)
 *
 * Transforms a declarative LayoutNode tree into CSS and HTML strings.
 * Pure functions -- no DOM dependency, safe for workers/SSR.
 */
import { flattenLayoutWidgets } from '../schema/config-layers.js';
// --- K.1: Core Layout Rendering ---
export function renderLayoutToCSS(node) {
    const widgetIds = flattenLayoutWidgets(node);
    const { css, html } = renderNode(node);
    return { css, html, widgetIds };
}
function renderNode(node) {
    switch (node.kind) {
        case 'widget': return renderWidgetSlot(node);
        case 'auto-grid': return renderAutoGrid(node);
        case 'tabs': return renderTabs(node);
        case 'sections': return renderSections(node);
        case 'freeform': return renderFreeformLayout(node);
    }
}
function renderWidgetSlot(node) {
    const style = [];
    if (node.minHeight)
        style.push(`min-height: ${node.minHeight}px`);
    if (node.weight && node.weight > 1)
        style.push(`grid-column: span ${node.weight}`);
    const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';
    const css = `[data-widget-id="${node.widgetId}"] { container-type: inline-size;${node.minHeight ? ` min-height: ${node.minHeight}px;` : ''}${node.weight && node.weight > 1 ? ` grid-column: span ${node.weight};` : ''} }`;
    const html = `<div class="phz-widget-slot" data-widget-id="${node.widgetId}"${styleAttr}></div>`;
    return { css, html };
}
function renderAutoGrid(node) {
    const maxColRule = node.maxColumns
        ? `repeat(${node.maxColumns}, 1fr)`
        : `repeat(auto-fill, minmax(${node.minItemWidth}px, 1fr))`;
    const gridCSS = `display: grid; grid-template-columns: ${maxColRule}; gap: ${node.gap}px;`;
    const childResults = node.children.map(c => renderNode(c));
    const css = `.phz-auto-grid { ${gridCSS} }\n` + childResults.map(r => r.css).join('\n');
    const html = `<div class="phz-auto-grid" style="${gridCSS}">\n${childResults.map(r => r.html).join('\n')}\n</div>`;
    return { css, html };
}
function renderTabs(node) {
    const tabButtons = node.tabs.map((tab, i) => {
        const icon = tab.icon ? `<span class="phz-tab-icon" data-icon="${tab.icon}"></span>` : '';
        const selected = i === 0 ? ' aria-selected="true"' : ' aria-selected="false"';
        return `<button role="tab" id="tab-${i}"${selected} aria-controls="panel-${i}">${icon}${tab.label}</button>`;
    }).join('\n');
    const panels = node.tabs.map((tab, i) => {
        const childResults = tab.children.map(c => renderNode(c));
        const hidden = i === 0 ? '' : ' hidden';
        return `<div role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}"${hidden}>\n${childResults.map(r => r.html).join('\n')}\n</div>`;
    }).join('\n');
    const childCSS = node.tabs
        .flatMap(t => t.children.map(c => renderNode(c).css))
        .join('\n');
    const css = `.phz-tabs [role="tablist"] { display: flex; border-bottom: 1px solid var(--phz-border-color, #ddd); }\n` +
        `.phz-tabs [role="tab"] { padding: 8px 16px; cursor: pointer; border: none; background: none; }\n` +
        `.phz-tabs [role="tab"][aria-selected="true"] { border-bottom: 2px solid var(--phz-primary, #0066cc); }\n` +
        childCSS;
    const html = `<div class="phz-tabs">\n<div role="tablist">\n${tabButtons}\n</div>\n${panels}\n</div>`;
    return { css, html };
}
function renderSections(node) {
    const sectionHTML = node.sections.map((section, i) => {
        const childResults = section.children.map(c => renderNode(c));
        const collapsedAttr = section.collapsed ? ' data-collapsed="true" collapsed' : '';
        return `<div class="phz-layout-section"${collapsedAttr}>
<div class="phz-section-header" role="button" aria-expanded="${!section.collapsed}" tabindex="0">
<span class="phz-section-title">${section.title}</span>
</div>
<div class="phz-section-content"${section.collapsed ? ' hidden' : ''}>
${childResults.map(r => r.html).join('\n')}
</div>
</div>`;
    }).join('\n');
    const childCSS = node.sections
        .flatMap(s => s.children.map(c => renderNode(c).css))
        .join('\n');
    const css = `.phz-layout-section { margin-bottom: 16px; }\n` +
        `.phz-section-header { cursor: pointer; padding: 8px; font-weight: 600; }\n` +
        `.phz-layout-section[data-collapsed="true"] .phz-section-content { display: none; }\n` +
        childCSS;
    const html = `<div class="phz-sections">\n${sectionHTML}\n</div>`;
    return { css, html };
}
function renderFreeformLayout(node) {
    const gridCSS = `display: grid; grid-template-columns: repeat(${node.columns}, ${node.cellSizePx}px); grid-auto-rows: ${node.cellSizePx}px; gap: ${node.gapPx}px; position: relative;`;
    const dotSize = node.cellSizePx + node.gapPx;
    const dotBg = `background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px); background-size: ${dotSize}px ${dotSize}px;`;
    const childResults = node.children.map(c => {
        const style = [
            `grid-column: ${c.col + 1} / span ${c.colSpan}`,
            `grid-row: ${c.row + 1} / span ${c.rowSpan}`,
        ];
        if (c.zIndex !== undefined)
            style.push(`z-index: ${c.zIndex}`);
        const css = `[data-widget-id="${c.widgetId}"] { container-type: inline-size; ${style.join('; ')}; }`;
        const html = `<div class="phz-widget-slot" data-widget-id="${c.widgetId}" style="${style.join('; ')}"></div>`;
        return { css, html };
    });
    const css = `.phz-freeform-grid { ${gridCSS} }\n` +
        `.phz-freeform-grid[data-mode="edit"] { ${dotBg} }\n` +
        childResults.map(r => r.css).join('\n');
    const html = `<div class="phz-freeform-grid" style="${gridCSS}">\n${childResults.map(r => r.html).join('\n')}\n</div>`;
    return { css, html };
}
// --- K.5: Responsive CSS Generation ---
export function generateResponsiveCSS(widgetId, behavior) {
    if (!behavior)
        return '';
    const rules = [];
    // Compact breakpoint
    rules.push(`@container (max-width: ${behavior.compactBelow}px) {`);
    rules.push(`  [data-widget-id="${widgetId}"] {`);
    if (behavior.compactBehavior.hideLegend)
        rules.push('    --phz-legend-display: none;');
    if (behavior.compactBehavior.hideAxisLabels)
        rules.push('    --phz-axis-labels-display: none;');
    if (behavior.compactBehavior.hideDataLabels)
        rules.push('    --phz-data-labels-display: none;');
    if (behavior.compactBehavior.simplifyToSingleValue)
        rules.push('    --phz-simplify: single-value;');
    if (behavior.compactBehavior.collapseToSummary)
        rules.push('    --phz-collapse: summary;');
    rules.push('  }');
    rules.push('}');
    // Minimal breakpoint
    if (behavior.minimalBelow) {
        rules.push(`@container (max-width: ${behavior.minimalBelow}px) {`);
        rules.push(`  [data-widget-id="${widgetId}"] {`);
        rules.push('    --phz-legend-display: none;');
        rules.push('    --phz-axis-labels-display: none;');
        rules.push('    --phz-data-labels-display: none;');
        rules.push('    --phz-simplify: single-value;');
        rules.push('  }');
        rules.push('}');
    }
    // Aspect ratio constraints
    if (behavior.minAspectRatio || behavior.maxAspectRatio) {
        rules.push(`[data-widget-id="${widgetId}"] {`);
        if (behavior.minAspectRatio) {
            rules.push(`  aspect-ratio: ${behavior.minAspectRatio};`);
        }
        if (behavior.maxAspectRatio) {
            rules.push(`  max-aspect-ratio: ${behavior.maxAspectRatio};`);
        }
        rules.push('}');
    }
    return rules.join('\n');
}
export function generatePrintCSS() {
    return `@media print {
  .phz-tabs [role="tablist"],
  .phz-section-header [data-collapse-icon],
  .phz-loading-spinner,
  .phz-stale-indicator,
  .phz-freshness-badge,
  .phz-quality-warning {
    display: none;
  }
  .phz-widget-slot {
    break-inside: avoid;
    box-shadow: none;
    border-radius: 0;
  }
  .phz-auto-grid {
    display: block;
  }
  .phz-auto-grid > * {
    margin-bottom: 16px;
    page-break-inside: avoid;
  }
  .phz-layout-section[data-collapsed="true"] .phz-section-content {
    display: block;
  }
}`;
}
export function computeContainerBreakpoints(layout) {
    const compact = layout.minItemWidth * 2 + layout.gap;
    const mobile = layout.minItemWidth + layout.gap;
    return { compact, mobile };
}
//# sourceMappingURL=layout-renderer.js.map