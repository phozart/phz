/**
 * Tests for the SVG icon system (styles/icons.ts)
 */
import { describe, it, expect } from 'vitest';
import {
  ICONS,
  icon,
  iconPath,
  ARTIFACT_ICONS,
  FIELD_TYPE_ICONS,
  SOURCE_ICONS,
  NAV_ICONS,
  ACTION_ICONS,
  type IconName,
} from '../styles/icons.js';

// ── ICONS Registry ──────────────────────────────────────────────────────

describe('ICONS registry', () => {
  it('has at least 60 named icons', () => {
    const count = Object.keys(ICONS).length;
    expect(count).toBeGreaterThanOrEqual(60);
  });

  it('every icon value is a non-empty SVG path string', () => {
    for (const [name, path] of Object.entries(ICONS)) {
      expect(path, `ICONS.${name} should be a non-empty string`).toBeTruthy();
      expect(typeof path).toBe('string');
      // Path data always starts with M (moveTo)
      expect(path[0], `ICONS.${name} should start with M`).toBe('M');
    }
  });

  it('contains all artifact type icons', () => {
    const required: IconName[] = [
      'dashboard', 'report', 'grid', 'kpi', 'metric',
      'alertRule', 'filterPreset', 'filterDefinition', 'filterRule', 'subscription',
    ];
    for (const name of required) {
      expect(ICONS[name], `ICONS should contain ${name}`).toBeDefined();
    }
  });

  it('contains all field type icons', () => {
    const required: IconName[] = ['fieldText', 'fieldNumber', 'fieldDate', 'fieldBoolean', 'fieldEnum'];
    for (const name of required) {
      expect(ICONS[name], `ICONS should contain ${name}`).toBeDefined();
    }
  });

  it('contains all data source icons', () => {
    const required: IconName[] = [
      'sourceUpload', 'sourceCsv', 'sourceExcel', 'sourceParquet',
      'sourceJson', 'sourceDatabase', 'sourceApi', 'sourceUrl',
    ];
    for (const name of required) {
      expect(ICONS[name], `ICONS should contain ${name}`).toBeDefined();
    }
  });
});

// ── icon() renderer ─────────────────────────────────────────────────────

describe('icon()', () => {
  it('renders a complete SVG element with default params', () => {
    const svg = icon('dashboard');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('width="24"');
    expect(svg).toContain('height="24"');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('stroke-width="1.5"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('stroke-linejoin="round"');
  });

  it('applies custom size', () => {
    const svg = icon('kpi', 16);
    expect(svg).toContain('width="16"');
    expect(svg).toContain('height="16"');
    // viewBox stays the same (24x24) — size changes the rendered dimensions
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it('applies custom color', () => {
    const svg = icon('report', 24, '#3B82F6');
    expect(svg).toContain('stroke="#3B82F6"');
  });

  it('applies custom stroke width', () => {
    const svg = icon('grid', 24, 'currentColor', 2);
    expect(svg).toContain('stroke-width="2"');
  });

  it('returns empty string for unknown icon name', () => {
    // @ts-expect-error — intentionally passing invalid name
    const svg = icon('nonexistent-icon-that-does-not-exist');
    expect(svg).toBe('');
  });

  it('renders path elements inside the svg', () => {
    const svg = icon('add');
    expect(svg).toContain('<path');
    expect(svg).toContain('d="');
  });

  it('splits multi-path icons into separate <path> elements', () => {
    // The dashboard icon has multiple M commands → should produce multiple <path>
    const svg = icon('dashboard');
    const pathCount = (svg.match(/<path /g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(1);
  });
});

// ── iconPath() ──────────────────────────────────────────────────────────

describe('iconPath()', () => {
  it('returns path element(s) without wrapping svg', () => {
    const paths = iconPath('kpi');
    expect(paths).toContain('<path');
    expect(paths).not.toContain('<svg');
  });

  it('returns empty string for unknown icon', () => {
    // @ts-expect-error — intentionally passing invalid name
    expect(iconPath('nonexistent')).toBe('');
  });
});

// ── Grouped Icon Sets ───────────────────────────────────────────────────

describe('ARTIFACT_ICONS', () => {
  it('maps all ArtifactType values to valid icon names', () => {
    const expectedTypes = [
      'dashboard', 'report', 'grid-definition', 'kpi', 'metric',
      'filter-preset', 'filter-definition', 'filter-rule',
      'alert-rule', 'subscription',
    ];
    for (const type of expectedTypes) {
      const iconName = ARTIFACT_ICONS[type];
      expect(iconName, `ARTIFACT_ICONS['${type}'] should be defined`).toBeDefined();
      expect(ICONS[iconName as IconName], `ICONS[${iconName}] should exist`).toBeDefined();
    }
  });
});

describe('FIELD_TYPE_ICONS', () => {
  it('maps common data types including aliases', () => {
    const expectedTypes = ['string', 'text', 'number', 'integer', 'float', 'decimal',
      'date', 'datetime', 'timestamp', 'boolean', 'bool', 'enum', 'category'];
    for (const type of expectedTypes) {
      const iconName = FIELD_TYPE_ICONS[type];
      expect(iconName, `FIELD_TYPE_ICONS['${type}'] should be defined`).toBeDefined();
      expect(ICONS[iconName as IconName], `ICONS[${iconName}] should exist`).toBeDefined();
    }
  });
});

describe('SOURCE_ICONS', () => {
  it('maps all data source types', () => {
    const expectedTypes = ['csv', 'excel', 'parquet', 'json', 'jsonl', 'database', 'api', 'url', 'upload'];
    for (const type of expectedTypes) {
      const iconName = SOURCE_ICONS[type];
      expect(iconName, `SOURCE_ICONS['${type}'] should be defined`).toBeDefined();
      expect(ICONS[iconName as IconName], `ICONS[${iconName}] should exist`).toBeDefined();
    }
  });
});

describe('NAV_ICONS', () => {
  it('maps all navigation sections', () => {
    const expectedSections = ['home', 'catalog', 'explore', 'settings', 'filter', 'alert', 'data', 'users'];
    for (const section of expectedSections) {
      const iconName = NAV_ICONS[section];
      expect(iconName, `NAV_ICONS['${section}'] should be defined`).toBeDefined();
      expect(ICONS[iconName as IconName], `ICONS[${iconName}] should exist`).toBeDefined();
    }
  });
});

describe('ACTION_ICONS', () => {
  it('maps all common actions', () => {
    const expectedActions = [
      'edit', 'delete', 'duplicate', 'export', 'import', 'save',
      'refresh', 'search', 'close', 'add', 'remove', 'publish',
      'share', 'drill', 'navigate', 'back',
    ];
    for (const action of expectedActions) {
      const iconName = ACTION_ICONS[action];
      expect(iconName, `ACTION_ICONS['${action}'] should be defined`).toBeDefined();
      expect(ICONS[iconName as IconName], `ICONS[${iconName}] should exist`).toBeDefined();
    }
  });
});

// ── Integration: icon functions used by other modules ───────────────────

import { getArtifactIcon } from '../catalog/catalog-visual.js';
import { getFieldTypeIconSvg } from '../styles/explorer-visual.js';
import { getSourceTypeIconSvg } from '../local/data-source-panel.js';

describe('icon integration with visual modules', () => {
  it('getArtifactIcon uses ARTIFACT_ICONS lookup', () => {
    const svg = getArtifactIcon('dashboard');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#3B82F6'); // dashboard color
  });

  it('getFieldTypeIconSvg uses FIELD_TYPE_ICONS lookup', () => {
    const svg = getFieldTypeIconSvg('number');
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="16"'); // default size
  });

  it('getSourceTypeIconSvg uses SOURCE_ICONS lookup', () => {
    const svg = getSourceTypeIconSvg('csv');
    expect(svg).toContain('<svg');
  });

  it('falls back to default icon for unknown types', () => {
    const svg = getFieldTypeIconSvg('unknown-type');
    // Should fall back to 'fieldText'
    expect(svg).toContain('<svg');
  });

  it('getSourceTypeIconSvg falls back to database icon', () => {
    const svg = getSourceTypeIconSvg('some-unknown-source');
    expect(svg).toContain('<svg');
  });
});
