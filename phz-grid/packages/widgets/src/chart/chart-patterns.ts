/**
 * @phozart/widgets — SVG Pattern Definitions
 *
 * Generates SVG <pattern> elements as secondary encoding for colorblind safety.
 * Each series gets a unique pattern paired with its color. Patterns are opt-in
 * via series[].patternFill or automatic when prefers-contrast: more is detected.
 */

import { svg } from 'lit';
import type { TemplateResult } from 'lit';

export interface PatternDef {
  id: string;
  name: string;
}

export const CHART_PATTERNS: PatternDef[] = [
  { id: 'diagonal-stripe', name: 'Diagonal Stripes' },
  { id: 'dots', name: 'Dots' },
  { id: 'crosshatch', name: 'Crosshatch' },
  { id: 'horizontal-stripe', name: 'Horizontal Stripes' },
  { id: 'vertical-stripe', name: 'Vertical Stripes' },
  { id: 'diagonal-reverse', name: 'Reverse Diagonal' },
  { id: 'diamond', name: 'Diamonds' },
  { id: 'zigzag', name: 'Zigzag' },
];

/**
 * Generate SVG <defs> containing pattern definitions for a set of series colors.
 * Each pattern is rendered in the series color so it overlays correctly.
 */
export function renderPatternDefs(
  patterns: { patternId: string; color: string }[],
): TemplateResult {
  if (patterns.length === 0) return svg``;

  return svg`
    <defs>
      ${patterns.map(({ patternId, color }) => renderSinglePattern(patternId, color))}
    </defs>
  `;
}

function renderSinglePattern(patternId: string, color: string): TemplateResult {
  const uid = `phz-pat-${patternId}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  switch (patternId) {
    case 'diagonal-stripe':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
          <line x1="0" y1="6" x2="6" y2="0" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
        </pattern>
      `;

    case 'dots':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
          <circle cx="3" cy="3" r="1.2" fill="rgba(255,255,255,0.6)" />
        </pattern>
      `;

    case 'crosshatch':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
          <line x1="0" y1="0" x2="6" y2="6" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
          <line x1="6" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        </pattern>
      `;

    case 'horizontal-stripe':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
          <line x1="0" y1="3" x2="6" y2="3" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
        </pattern>
      `;

    case 'vertical-stripe':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
          <line x1="3" y1="0" x2="3" y2="6" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
        </pattern>
      `;

    case 'diagonal-reverse':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
          <line x1="0" y1="0" x2="6" y2="6" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
        </pattern>
      `;

    case 'diamond':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="${color}" />
          <polygon points="4,0 8,4 4,8 0,4" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        </pattern>
      `;

    case 'zigzag':
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="8" height="4">
          <rect width="8" height="4" fill="${color}" />
          <polyline points="0,4 2,0 4,4 6,0 8,4" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        </pattern>
      `;

    default:
      return svg`
        <pattern id="${uid}" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="${color}" />
        </pattern>
      `;
  }
}

/**
 * Get the fill value for a mark — either a pattern URL reference or plain color.
 */
export function getPatternFill(patternId: string | undefined, color: string): string {
  if (!patternId) return color;
  const uid = `phz-pat-${patternId}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return `url(#${uid})`;
}
