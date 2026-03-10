/**
 * Impact Chain Design Tokens (7A-C)
 *
 * Color tokens for the impact chain rendering variant of the decision tree widget.
 * These tokens integrate with the three-layer CSS custom property system:
 * public API tokens (--phz-*) -> internal computed tokens (--_*) -> component styles.
 */

// ========================================================================
// Impact Chain Token Values
// ========================================================================

export const IMPACT_CHAIN_TOKENS = {
  'chain.rootCause.accent': '#dc2626',
  'chain.failure.accent': '#f59e0b',
  'chain.impact.accent': '#3b82f6',
  'chain.hypothesis.validated': '#22c55e',
  'chain.hypothesis.invalidated': '#ef4444',
  'chain.hypothesis.pending': '#f59e0b',
} as const;

export type ImpactChainTokenKey = keyof typeof IMPACT_CHAIN_TOKENS;

// ========================================================================
// Token-to-CSS-Variable Mapping
// ========================================================================

const CHAIN_TOKEN_TO_CSS: Record<ImpactChainTokenKey, string> = {
  'chain.rootCause.accent': '--phz-chain-root-cause-accent',
  'chain.failure.accent': '--phz-chain-failure-accent',
  'chain.impact.accent': '--phz-chain-impact-accent',
  'chain.hypothesis.validated': '--phz-chain-hypothesis-validated',
  'chain.hypothesis.invalidated': '--phz-chain-hypothesis-invalidated',
  'chain.hypothesis.pending': '--phz-chain-hypothesis-pending',
};

/**
 * Generate CSS custom property declarations for all impact chain tokens.
 *
 * @returns A string of `--phz-chain-*: value;` declarations (no selector wrapper).
 */
export function generateChainTokenCSS(): string {
  const lines: string[] = [];
  for (const [key, cssVar] of Object.entries(CHAIN_TOKEN_TO_CSS)) {
    const value = IMPACT_CHAIN_TOKENS[key as ImpactChainTokenKey];
    lines.push(`  ${cssVar}: ${value};`);
  }
  return lines.join('\n');
}

/**
 * Resolve a single chain token key to its CSS custom property reference.
 *
 * @param key - One of the IMPACT_CHAIN_TOKENS keys.
 * @returns The CSS `var(--phz-chain-*)` reference string, or the raw value as fallback.
 */
export function resolveChainTokenVar(key: ImpactChainTokenKey): string {
  const cssVar = CHAIN_TOKEN_TO_CSS[key];
  const fallback = IMPACT_CHAIN_TOKENS[key];
  return `var(${cssVar}, ${fallback})`;
}
