/**
 * Design Tokens — Central design token definitions for the phozart Console mode.
 *
 * Extracted from @phozart/phz-workspace styles (S.1).
 * Exports plain JS constants and pure functions only — no Lit/CSS dependencies.
 */

// ========================================================================
// Token Values
// ========================================================================

export const DESIGN_TOKENS = {
  // Core colors
  headerBg: '#1C1917',
  bgBase: '#FEFDFB',
  bgSubtle: '#FAF9F7',
  bgMuted: '#F5F5F4',
  bgEmphasis: '#292524',

  // Text
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#78716C',
  textFaint: '#A8A29E',

  // Borders
  borderDefault: '#E7E5E4',
  borderEmphasis: '#D6D3D1',

  // Header
  headerText: '#FAFAF9',
  headerTextMuted: '#A8A29E',
  headerBorder: '#292524',
  headerAccent: '#F59E0B',

  // Semantic
  primary500: '#3B82F6',
  info500: '#06B6D4',
  error500: '#EF4444',
  warning500: '#F59E0B',

  // Spacing (4px grid)
  space1: '4px',
  space2: '8px',
  space3: '12px',
  space4: '16px',
  space5: '20px',
  space6: '24px',
  space8: '32px',
  space10: '40px',
  space12: '48px',
  space16: '64px',

  // Typography
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  textXs: '11px',
  textSm: '13px',
  textBase: '14px',
  textLg: '16px',
  textXl: '20px',
  text2xl: '24px',

  // Radii
  radiusSm: '6px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusXl: '16px',
  radiusFull: '9999px',

  // Shadows (warm multi-layer)
  shadowXs: '0 1px 2px rgba(28, 25, 23, 0.04)',
  shadowSm: '0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
  shadowMd: '0 4px 6px rgba(28, 25, 23, 0.06), 0 2px 4px rgba(28, 25, 23, 0.04)',
  shadowLg: '0 10px 15px rgba(28, 25, 23, 0.06), 0 4px 6px rgba(28, 25, 23, 0.04)',
  shadowXl: '0 20px 25px rgba(28, 25, 23, 0.08), 0 8px 10px rgba(28, 25, 23, 0.04)',
  shadow2xl: '0 25px 50px rgba(28, 25, 23, 0.12)',

  // Attention facet panel (7A-D)
  attentionFacetPanelWidth: '200px',
  attentionFacetCountColor: '#6b7280',
  attentionFacetActiveBg: 'rgba(59, 130, 246, 0.08)',
} as const;

/** Type for a single token key */
export type DesignTokenKey = keyof typeof DESIGN_TOKENS;

// ========================================================================
// Section Headers
// ========================================================================

export const SECTION_HEADERS = ['CONTENT', 'DATA', 'GOVERN'] as const;

export type SectionHeader = (typeof SECTION_HEADERS)[number];

// ========================================================================
// Token-to-CSS-Variable Mapping
// ========================================================================

const TOKEN_TO_CSS: Record<string, string> = {
  headerBg: '--phz-header-bg',
  bgBase: '--phz-bg-base',
  bgSubtle: '--phz-bg-subtle',
  bgMuted: '--phz-bg-muted',
  bgEmphasis: '--phz-bg-emphasis',
  textPrimary: '--phz-text-primary',
  textSecondary: '--phz-text-secondary',
  textMuted: '--phz-text-muted',
  textFaint: '--phz-text-faint',
  borderDefault: '--phz-border-default',
  borderEmphasis: '--phz-border-emphasis',
  headerText: '--phz-header-text',
  headerTextMuted: '--phz-header-text-muted',
  headerBorder: '--phz-header-border',
  headerAccent: '--phz-header-accent',
  primary500: '--phz-primary-500',
  info500: '--phz-info-500',
  error500: '--phz-error-500',
  warning500: '--phz-warning-500',
  space1: '--phz-space-1',
  space2: '--phz-space-2',
  space3: '--phz-space-3',
  space4: '--phz-space-4',
  space5: '--phz-space-5',
  space6: '--phz-space-6',
  space8: '--phz-space-8',
  space10: '--phz-space-10',
  space12: '--phz-space-12',
  space16: '--phz-space-16',
  fontSans: '--phz-font-sans',
  fontMono: '--phz-font-mono',
  textXs: '--phz-text-xs',
  textSm: '--phz-text-sm',
  textBase: '--phz-text-base',
  textLg: '--phz-text-lg',
  textXl: '--phz-text-xl',
  text2xl: '--phz-text-2xl',
  radiusSm: '--phz-radius-sm',
  radiusMd: '--phz-radius-md',
  radiusLg: '--phz-radius-lg',
  radiusXl: '--phz-radius-xl',
  radiusFull: '--phz-radius-full',
  shadowXs: '--phz-shadow-xs',
  shadowSm: '--phz-shadow-sm',
  shadowMd: '--phz-shadow-md',
  shadowLg: '--phz-shadow-lg',
  shadowXl: '--phz-shadow-xl',
  shadow2xl: '--phz-shadow-2xl',
  attentionFacetPanelWidth: '--phz-attention-facet-panel-width',
  attentionFacetCountColor: '--phz-attention-facet-count-color',
  attentionFacetActiveBg: '--phz-attention-facet-active-bg',
};

/**
 * Generate a CSS `:root` block with all design tokens as custom properties.
 *
 * @returns A complete CSS `:root { ... }` string.
 */
export function generateTokenCSS(): string {
  const lines: string[] = [];
  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS)) {
    const value = (DESIGN_TOKENS as Record<string, string>)[key];
    if (value !== undefined) {
      lines.push(`  ${cssVar}: ${value};`);
    }
  }
  return `:root {\n${lines.join('\n')}\n}`;
}
