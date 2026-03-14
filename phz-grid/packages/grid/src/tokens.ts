/**
 * @phozart/grid — Phz Console Design Tokens (Three-Layer System)
 *
 * Layer 1: Brand Tokens (primitives — warm neutrals, dual typography, status colors)
 * Layer 2: Semantic Tokens (theme — purpose-based references)
 * Layer 3: Component Tokens (specific — individual component values + density scale)
 */

// Layer 1: Brand Tokens (Primitive) — Phz Console palette
export const BrandTokens = {
  // Warm neutrals (stone palette)
  '--phz-color-primary': '#3B82F6',
  '--phz-color-primary-hover': '#2563EB',
  '--phz-color-primary-light': 'rgba(59, 130, 246, 0.1)',
  '--phz-color-secondary': '#8B5CF6',
  '--phz-color-success': '#22C55E',
  '--phz-color-warning': '#F59E0B',
  '--phz-color-danger': '#EF4444',
  '--phz-color-info': '#3B82F6',

  '--phz-color-neutral-50': '#FAFAF9',
  '--phz-color-neutral-100': '#F5F5F4',
  '--phz-color-neutral-200': '#E7E5E4',
  '--phz-color-neutral-300': '#D6D3D1',
  '--phz-color-neutral-400': '#A8A29E',
  '--phz-color-neutral-500': '#78716C',
  '--phz-color-neutral-600': '#57534E',
  '--phz-color-neutral-700': '#44403C',
  '--phz-color-neutral-800': '#292524',
  '--phz-color-neutral-900': '#1C1917',

  // Dual typography
  '--phz-font-family-base': "'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif",
  '--phz-font-family-mono': "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",

  '--phz-font-size-xs': '0.75rem',
  '--phz-font-size-sm': '0.8125rem',
  '--phz-font-size-base': '0.875rem',
  '--phz-font-size-lg': '1rem',
  '--phz-font-size-xl': '1.125rem',

  '--phz-font-weight-normal': '400',
  '--phz-font-weight-medium': '500',
  '--phz-font-weight-semibold': '600',
  '--phz-font-weight-bold': '700',

  // Spacing
  '--phz-spacing-xs': '0.25rem',
  '--phz-spacing-sm': '0.5rem',
  '--phz-spacing-md': '1rem',
  '--phz-spacing-lg': '1.5rem',
  '--phz-spacing-xl': '2rem',

  // Generous radii
  '--phz-border-radius-sm': '6px',
  '--phz-border-radius-md': '12px',
  '--phz-border-radius-lg': '16px',
  '--phz-border-radius-full': '9999px',

  // Warm-tinted floating shadows
  '--phz-shadow-sm': '0 1px 2px rgba(28,25,23,0.06), 0 1px 3px rgba(28,25,23,0.04)',
  '--phz-shadow-md': '0 4px 6px rgba(28,25,23,0.07), 0 2px 4px rgba(28,25,23,0.04)',
  '--phz-shadow-lg': '0 10px 25px rgba(28,25,23,0.10), 0 4px 10px rgba(28,25,23,0.05)',
  '--phz-shadow-xl': '0 20px 40px rgba(28,25,23,0.12), 0 8px 16px rgba(28,25,23,0.06)',
  '--phz-shadow-float': '0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',

  // Transition timing
  '--phz-transition-fast': '150ms cubic-bezier(0.0, 0.0, 0.2, 1)',
  '--phz-transition-base': '200ms cubic-bezier(0.0, 0.0, 0.2, 1)',
  '--phz-transition-slow': '300ms cubic-bezier(0.0, 0.0, 0.2, 1)',
} as const;

// Layer 2: Semantic Tokens (Theme)
export const SemanticTokens = {
  '--phz-grid-bg': '#FEFDFB',
  '--phz-grid-text': '#1C1917',
  '--phz-grid-border': '#E7E5E4',

  // Dark header bar
  '--phz-header-bg': '#1C1917',
  '--phz-header-text': '#FAFAF9',
  '--phz-header-border': '#292524',
  '--phz-header-hover-bg': '#292524',

  // Row colors — warm alternating
  '--phz-row-bg': 'transparent',
  '--phz-row-bg-alt': '#FAF9F7',
  '--phz-row-bg-hover': 'rgba(59, 130, 246, 0.06)',
  '--phz-row-bg-selected': 'rgba(59, 130, 246, 0.12)',
  '--phz-row-text-selected': '#1C1917',
  '--phz-row-border': '#F5F5F4',

  // Cell tokens
  '--phz-cell-bg': 'transparent',
  '--phz-cell-text': 'inherit',
  '--phz-cell-border': '#F5F5F4',
  '--phz-cell-bg-editing': '#FFFFFF',
  '--phz-cell-border-editing': 'var(--phz-color-primary)',

  // Focus
  '--phz-focus-ring-color': 'var(--phz-color-primary)',
  '--phz-focus-ring-width': '2px',
  '--phz-focus-ring-offset': '2px',

  // Filter badge
  '--phz-filter-badge-color': 'var(--phz-color-primary)',
  '--phz-filter-badge-size': '8px',

  // Context menu / popover
  '--phz-popover-bg': '#FEFDFB',
  '--phz-popover-border': '#E7E5E4',
  '--phz-popover-shadow': 'var(--phz-shadow-float)',

  // Aggregation footer
  '--phz-footer-bg': '#F5F5F4',
  '--phz-footer-text': '#44403C',
  '--phz-footer-border': '#E7E5E4',
} as const;

// Layer 3: Component Tokens (Specific)
export const ComponentTokens = {
  '--phz-cell-padding': '8px 16px',
  '--phz-cell-font-size': 'var(--phz-font-size-sm)',
  '--phz-cell-line-height': '1.5',

  '--phz-header-padding': '10px 16px',
  '--phz-header-font-size': '0.6875rem',
  '--phz-header-font-weight': '600',
  '--phz-header-letter-spacing': '0.06em',
  '--phz-header-text-transform': 'uppercase',

  // Density scale
  '--phz-row-height': '40px',
  '--phz-row-height-compact': '36px',
  '--phz-row-height-comfortable': '48px',
  '--phz-row-height-dense': '32px',

  // Scrollbar
  '--phz-scrollbar-width': '8px',
  '--phz-scrollbar-thumb-bg': 'var(--phz-color-neutral-300)',
  '--phz-scrollbar-track-bg': 'transparent',

  // Resize handle
  '--phz-resize-handle-width': '8px',
  '--phz-resize-handle-bg': 'transparent',
  '--phz-resize-handle-bg-hover': 'var(--phz-color-primary)',
  '--phz-resize-handle-bg-active': 'var(--phz-color-primary)',
} as const;

/**
 * Generates a CSS stylesheet string from all three token layers.
 * Apply to :host for Lit components.
 */
export function generateTokenStyles(): string {
  const allTokens = { ...BrandTokens, ...SemanticTokens, ...ComponentTokens };
  const entries = Object.entries(allTokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `:host {\n${entries}\n}`;
}
