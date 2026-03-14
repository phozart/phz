/**
 * Tests for Design System — tokens, responsive, container queries,
 * component patterns, shell layout, icons, and mobile helpers.
 */
import {
  DESIGN_TOKENS,
  generateTokenCSS,
  SECTION_HEADERS,
} from '@phozart/shared/design-system';

import {
  BREAKPOINT_VALUES,
  getViewportBreakpoint,
  getBreakpointClasses,
  getBottomTabItems,
} from '@phozart/shared/design-system';

import {
  getKPICardClass,
  getChartClass,
  getTableClass,
  getFilterBarClass,
  getVisibleColumns,
} from '@phozart/shared/design-system';

import {
  getFormDensityClasses,
  getModalClasses,
  getDrawerClasses,
  DRAWER_DEFAULTS,
  getEmptyStateProps,
  getSkeletonClass,
  STATUS_BADGE_VARIANTS,
  getOverflowClasses,
} from '@phozart/shared/design-system';

import {
  SHELL_LAYOUT,
  EXPLORER_LAYOUT,
  SQL_PREVIEW_THEME,
  getDefaultShellRegions,
} from '@phozart/shared/design-system';

import {
  ICONS,
  icon,
  iconPath,
  getFieldTypeIcon,
  getFieldTypeIconSvg,
  getCardinalityBadgeClass,
  getDropZoneClass,
  ARTIFACT_ICONS,
  FIELD_TYPE_ICONS,
  SOURCE_ICONS,
  NAV_ICONS,
  ACTION_ICONS,
} from '@phozart/shared/design-system';

import {
  MIN_TOUCH_TARGET,
  COMFORTABLE_TOUCH_TARGET,
  getBottomSheetDimensions,
  SWIPE_THRESHOLDS,
  getMobileNavConfig,
} from '@phozart/shared/design-system';

// ========================================================================
// Design Tokens
// ========================================================================

describe('DESIGN_TOKENS', () => {
  it('has core color tokens', () => {
    expect(DESIGN_TOKENS.headerBg).toBe('#1C1917');
    expect(DESIGN_TOKENS.bgBase).toBe('#FEFDFB');
    expect(DESIGN_TOKENS.primary500).toBe('#3B82F6');
  });

  it('has spacing tokens on 4px grid', () => {
    expect(DESIGN_TOKENS.space1).toBe('4px');
    expect(DESIGN_TOKENS.space2).toBe('8px');
    expect(DESIGN_TOKENS.space4).toBe('16px');
  });

  it('has typography tokens', () => {
    expect(DESIGN_TOKENS.fontSans).toContain('Inter');
    expect(DESIGN_TOKENS.textBase).toBe('14px');
  });

  it('has radius tokens', () => {
    expect(DESIGN_TOKENS.radiusSm).toBe('6px');
    expect(DESIGN_TOKENS.radiusFull).toBe('9999px');
  });

  it('has shadow tokens', () => {
    expect(DESIGN_TOKENS.shadowXs).toContain('rgba');
    expect(DESIGN_TOKENS.shadow2xl).toContain('rgba');
  });
});

describe('SECTION_HEADERS', () => {
  it('has three sections', () => {
    expect(SECTION_HEADERS).toEqual(['CONTENT', 'DATA', 'GOVERN']);
  });
});

describe('generateTokenCSS', () => {
  it('generates a :root CSS block', () => {
    const css = generateTokenCSS();
    expect(css).toMatch(/^:root \{/);
    expect(css).toMatch(/\}$/);
  });

  it('contains CSS custom properties for all tokens', () => {
    const css = generateTokenCSS();
    expect(css).toContain('--phz-header-bg: #1C1917');
    expect(css).toContain('--phz-bg-base: #FEFDFB');
    expect(css).toContain('--phz-space-1: 4px');
    expect(css).toContain('--phz-radius-sm: 6px');
    expect(css).toContain('--phz-shadow-xs:');
  });
});

// ========================================================================
// Responsive Breakpoints
// ========================================================================

describe('BREAKPOINT_VALUES', () => {
  it('has correct pixel values', () => {
    expect(BREAKPOINT_VALUES.mobile).toBe(768);
    expect(BREAKPOINT_VALUES.tablet).toBe(1024);
    expect(BREAKPOINT_VALUES.laptop).toBe(1280);
  });
});

describe('getViewportBreakpoint', () => {
  it('returns mobile for widths < 768', () => {
    expect(getViewportBreakpoint(320)).toBe('mobile');
    expect(getViewportBreakpoint(767)).toBe('mobile');
  });

  it('returns tablet for widths 768-1023', () => {
    expect(getViewportBreakpoint(768)).toBe('tablet');
    expect(getViewportBreakpoint(1023)).toBe('tablet');
  });

  it('returns laptop for widths 1024-1280', () => {
    expect(getViewportBreakpoint(1024)).toBe('laptop');
    expect(getViewportBreakpoint(1280)).toBe('laptop');
  });

  it('returns desktop for widths > 1280', () => {
    expect(getViewportBreakpoint(1281)).toBe('desktop');
    expect(getViewportBreakpoint(1920)).toBe('desktop');
  });
});

describe('getBreakpointClasses', () => {
  it('returns full classes for desktop', () => {
    const classes = getBreakpointClasses('desktop');
    expect(classes.sidebar).toBe('sidebar--full');
    expect(classes.header).toBe('header--full');
    expect(classes.content).toBe('content--full');
    expect(classes.hamburger).toBeUndefined();
    expect(classes.bottomBar).toBeUndefined();
  });

  it('returns icon-only sidebar for laptop', () => {
    const classes = getBreakpointClasses('laptop');
    expect(classes.sidebar).toBe('sidebar--icon-only');
  });

  it('returns overlay sidebar and hamburger for tablet', () => {
    const classes = getBreakpointClasses('tablet');
    expect(classes.sidebar).toBe('sidebar--overlay');
    expect(classes.hamburger).toBe('hamburger--visible');
  });

  it('returns hidden sidebar and bottom bar for mobile', () => {
    const classes = getBreakpointClasses('mobile');
    expect(classes.sidebar).toBe('sidebar--hidden');
    expect(classes.header).toBe('header--compact');
    expect(classes.bottomBar).toBe('bottom-bar--visible');
  });
});

describe('getBottomTabItems', () => {
  it('returns all 5 tabs for admin', () => {
    const tabs = getBottomTabItems('admin');
    expect(tabs).toHaveLength(5);
    expect(tabs.map(t => t.id)).toEqual(['catalog', 'explore', 'dashboards', 'data', 'govern']);
  });

  it('returns 4 tabs for author (no GOVERN)', () => {
    const tabs = getBottomTabItems('author');
    expect(tabs).toHaveLength(4);
    expect(tabs.find(t => t.id === 'govern')).toBeUndefined();
  });

  it('returns 2 tabs for viewer (catalog + dashboards)', () => {
    const tabs = getBottomTabItems('viewer');
    expect(tabs).toHaveLength(2);
    expect(tabs.map(t => t.id)).toEqual(['catalog', 'dashboards']);
  });

  it('admin tabs are a copy (mutation-safe)', () => {
    const a = getBottomTabItems('admin');
    const b = getBottomTabItems('admin');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

// ========================================================================
// Container Query Helpers
// ========================================================================

describe('getKPICardClass', () => {
  it('returns full for width > 280', () => {
    expect(getKPICardClass(281)).toBe('kpi--full');
  });

  it('returns compact for width 200-280', () => {
    expect(getKPICardClass(200)).toBe('kpi--compact');
    expect(getKPICardClass(280)).toBe('kpi--compact');
  });

  it('returns minimal for width < 200', () => {
    expect(getKPICardClass(199)).toBe('kpi--minimal');
  });
});

describe('getChartClass', () => {
  it('returns full for width > 400', () => {
    expect(getChartClass(401)).toBe('chart--full');
  });

  it('returns no-legend for width 280-400', () => {
    expect(getChartClass(280)).toBe('chart--no-legend');
    expect(getChartClass(400)).toBe('chart--no-legend');
  });

  it('returns no-labels for width 160-279', () => {
    expect(getChartClass(160)).toBe('chart--no-labels');
    expect(getChartClass(279)).toBe('chart--no-labels');
  });

  it('returns single-value for width < 160', () => {
    expect(getChartClass(159)).toBe('chart--single-value');
  });
});

describe('getTableClass', () => {
  it('returns all for width > 600', () => {
    expect(getTableClass(601)).toBe('table--all');
  });

  it('returns hide-low for width 400-600', () => {
    expect(getTableClass(400)).toBe('table--hide-low');
    expect(getTableClass(600)).toBe('table--hide-low');
  });

  it('returns hide-medium for width 300-399', () => {
    expect(getTableClass(300)).toBe('table--hide-medium');
    expect(getTableClass(399)).toBe('table--hide-medium');
  });

  it('returns card for width < 300', () => {
    expect(getTableClass(299)).toBe('table--card');
  });
});

describe('getFilterBarClass', () => {
  it('returns row for width > 600', () => {
    expect(getFilterBarClass(601)).toBe('filter-bar--row');
  });

  it('returns two-col for width 400-600', () => {
    expect(getFilterBarClass(400)).toBe('filter-bar--two-col');
    expect(getFilterBarClass(600)).toBe('filter-bar--two-col');
  });

  it('returns vertical for width < 400', () => {
    expect(getFilterBarClass(399)).toBe('filter-bar--vertical');
  });
});

describe('getVisibleColumns', () => {
  const columns = [
    { name: 'id', priority: 'high' as const },
    { name: 'name', priority: 'medium' as const },
    { name: 'description', priority: 'low' as const },
  ];

  it('shows all columns for width > 600', () => {
    expect(getVisibleColumns(columns, 601)).toEqual(['id', 'name', 'description']);
  });

  it('hides low-priority columns for width 400-600', () => {
    expect(getVisibleColumns(columns, 500)).toEqual(['id', 'name']);
  });

  it('shows only high-priority columns for width < 400', () => {
    expect(getVisibleColumns(columns, 350)).toEqual(['id']);
  });

  it('returns empty array when no columns match', () => {
    const lowOnly = [{ name: 'x', priority: 'low' as const }];
    expect(getVisibleColumns(lowOnly, 350)).toEqual([]);
  });
});

// ========================================================================
// Component Patterns
// ========================================================================

describe('getFormDensityClasses', () => {
  it('returns compact classes', () => {
    const classes = getFormDensityClasses('compact');
    expect(classes.label).toBe('form-label--compact');
    expect(classes.input).toBe('form-input--compact');
    expect(classes.toggle).toBe('form-toggle--compact');
  });

  it('returns default classes', () => {
    const classes = getFormDensityClasses('default');
    expect(classes.label).toBe('form-label--default');
  });
});

describe('getModalClasses', () => {
  it('returns visible backdrop when open', () => {
    const classes = getModalClasses({ open: true });
    expect(classes.backdrop).toContain('modal-backdrop--visible');
    expect(classes.container).toBe('modal-container');
  });

  it('returns base backdrop when closed', () => {
    const classes = getModalClasses({ open: false });
    expect(classes.backdrop).toBe('modal-backdrop');
    expect(classes.backdrop).not.toContain('--visible');
  });
});

describe('getDrawerClasses', () => {
  it('returns open right drawer classes', () => {
    const classes = getDrawerClasses({ open: true, position: 'right' });
    expect(classes.drawer).toContain('drawer--right');
    expect(classes.drawer).toContain('drawer--open');
  });

  it('returns closed left drawer classes', () => {
    const classes = getDrawerClasses({ open: false, position: 'left' });
    expect(classes.drawer).toContain('drawer--left');
    expect(classes.drawer).not.toContain('drawer--open');
  });
});

describe('DRAWER_DEFAULTS', () => {
  it('has correct dimensions', () => {
    expect(DRAWER_DEFAULTS.width).toBe(400);
    expect(DRAWER_DEFAULTS.maxWidth).toBe(560);
  });
});

describe('getEmptyStateProps', () => {
  it('returns props for known state types', () => {
    const props = getEmptyStateProps('no-data');
    expect(props.title).toBe('No data available');
    expect(props.ctaLabel).toBe('Add Data Source');
  });

  it('returns fallback for unknown state types', () => {
    const props = getEmptyStateProps('unknown-type');
    expect(props.title).toBe('Nothing here yet');
    expect(props.description).toContain('available');
  });

  it('returns props for no-selection', () => {
    const props = getEmptyStateProps('no-selection');
    expect(props.title).toBe('Nothing selected');
    expect(props.ctaLabel).toBeUndefined();
  });

  it('returns props for empty-dashboard', () => {
    const props = getEmptyStateProps('empty-dashboard');
    expect(props.ctaLabel).toBe('Browse Templates');
  });
});

describe('getSkeletonClass', () => {
  it('returns correct class for each variant', () => {
    expect(getSkeletonClass('text')).toBe('skeleton skeleton--text');
    expect(getSkeletonClass('card')).toBe('skeleton skeleton--card');
    expect(getSkeletonClass('chart')).toBe('skeleton skeleton--chart');
    expect(getSkeletonClass('table')).toBe('skeleton skeleton--table');
  });
});

describe('STATUS_BADGE_VARIANTS', () => {
  it('has published, shared, personal, draft, breach, processing', () => {
    expect(STATUS_BADGE_VARIANTS.published).toBeDefined();
    expect(STATUS_BADGE_VARIANTS.shared).toBeDefined();
    expect(STATUS_BADGE_VARIANTS.personal).toBeDefined();
    expect(STATUS_BADGE_VARIANTS.draft).toBeDefined();
    expect(STATUS_BADGE_VARIANTS.breach).toBeDefined();
    expect(STATUS_BADGE_VARIANTS.processing).toBeDefined();
  });

  it('each variant has bgColor, textColor, label', () => {
    for (const variant of Object.values(STATUS_BADGE_VARIANTS)) {
      expect(typeof variant.bgColor).toBe('string');
      expect(typeof variant.textColor).toBe('string');
      expect(typeof variant.label).toBe('string');
    }
  });
});

describe('getOverflowClasses', () => {
  it('returns truncate, minWidth, wordBreak classes', () => {
    const classes = getOverflowClasses();
    expect(classes.truncate).toBe('text-truncate');
    expect(classes.minWidth).toBe('min-w-0');
    expect(classes.wordBreak).toBe('word-break');
  });
});

// ========================================================================
// Shell Layout
// ========================================================================

describe('SHELL_LAYOUT', () => {
  it('has correct dimensions', () => {
    expect(SHELL_LAYOUT.headerHeight).toBe(56);
    expect(SHELL_LAYOUT.sidebarWidth).toBe(240);
    expect(SHELL_LAYOUT.contentMaxWidth).toBe(1440);
    expect(SHELL_LAYOUT.headerZ).toBe(50);
  });
});

describe('EXPLORER_LAYOUT', () => {
  it('has correct panel widths', () => {
    expect(EXPLORER_LAYOUT.fieldPaletteWidth).toBe(260);
    expect(EXPLORER_LAYOUT.configPanelWidth).toBe(360);
    expect(EXPLORER_LAYOUT.widgetPaletteWidth).toBe(260);
  });
});

describe('SQL_PREVIEW_THEME', () => {
  it('has dark background', () => {
    expect(SQL_PREVIEW_THEME.background).toBe('#1C1917');
    expect(SQL_PREVIEW_THEME.keywordColor).toBe('#3B82F6');
  });
});

describe('getDefaultShellRegions', () => {
  it('returns 5 regions', () => {
    const regions = getDefaultShellRegions();
    expect(regions).toHaveLength(5);
  });

  it('header, sidebar, content are visible; overlay is not', () => {
    const regions = getDefaultShellRegions();
    expect(regions.find(r => r.region === 'header')?.visible).toBe(true);
    expect(regions.find(r => r.region === 'sidebar')?.visible).toBe(true);
    expect(regions.find(r => r.region === 'content')?.visible).toBe(true);
    expect(regions.find(r => r.region === 'overlay')?.visible).toBe(false);
  });

  it('sidebar and footer are collapsible', () => {
    const regions = getDefaultShellRegions();
    expect(regions.find(r => r.region === 'sidebar')?.collapsible).toBe(true);
    expect(regions.find(r => r.region === 'footer')?.collapsible).toBe(true);
    expect(regions.find(r => r.region === 'header')?.collapsible).toBe(false);
  });
});

// ========================================================================
// Icons
// ========================================================================

describe('ICONS', () => {
  it('has SVG path data for dashboard', () => {
    expect(typeof ICONS.dashboard).toBe('string');
    expect(ICONS.dashboard.length).toBeGreaterThan(0);
  });

  it('has paths for all artifact types', () => {
    for (const name of Object.values(ARTIFACT_ICONS)) {
      expect(ICONS[name]).toBeDefined();
    }
  });
});

describe('icon', () => {
  it('renders an SVG string with default size', () => {
    const svg = icon('dashboard');
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="24"');
    expect(svg).toContain('height="24"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('<path');
    expect(svg).toContain('</svg>');
  });

  it('renders with custom size', () => {
    const svg = icon('dashboard', 16);
    expect(svg).toContain('width="16"');
    expect(svg).toContain('height="16"');
  });

  it('renders with custom color', () => {
    const svg = icon('dashboard', 24, '#FF0000');
    expect(svg).toContain('stroke="#FF0000"');
  });

  it('renders with custom stroke width', () => {
    const svg = icon('dashboard', 24, 'currentColor', 2);
    expect(svg).toContain('stroke-width="2"');
  });

  it('returns empty string for unknown icon name', () => {
    // @ts-expect-error — testing runtime behavior with bad input
    const svg = icon('nonexistent-icon-xyz');
    expect(svg).toBe('');
  });
});

describe('iconPath', () => {
  it('returns path elements for known icon', () => {
    const path = iconPath('dashboard');
    expect(path).toContain('<path');
    expect(path).not.toContain('<svg');
  });

  it('returns empty string for unknown icon', () => {
    // @ts-expect-error
    expect(iconPath('nonexistent')).toBe('');
  });
});

describe('getFieldTypeIcon (legacy)', () => {
  it('returns correct icon for string', () => {
    expect(getFieldTypeIcon('string')).toBe('Aa');
  });

  it('returns correct icon for number', () => {
    expect(getFieldTypeIcon('number')).toBe('#');
  });

  it('returns fallback for unknown type', () => {
    expect(getFieldTypeIcon('binary')).toBe('\u2022');
  });
});

describe('getFieldTypeIconSvg', () => {
  it('returns SVG for known field types', () => {
    const svg = getFieldTypeIconSvg('string');
    expect(svg).toContain('<svg');
  });

  it('falls back to fieldText for unknown types', () => {
    const svg = getFieldTypeIconSvg('binary');
    expect(svg).toContain('<svg');
  });

  it('respects size and color parameters', () => {
    const svg = getFieldTypeIconSvg('number', 20, 'red');
    expect(svg).toContain('width="20"');
    expect(svg).toContain('stroke="red"');
  });
});

describe('getCardinalityBadgeClass', () => {
  it('returns correct class', () => {
    expect(getCardinalityBadgeClass('high')).toBe('badge--cardinality-high');
    expect(getCardinalityBadgeClass('low')).toBe('badge--cardinality-low');
  });
});

describe('getDropZoneClass', () => {
  it('returns base class when not dragging over', () => {
    const cls = getDropZoneClass('rows', false);
    expect(cls).toBe('drop-zone drop-zone--rows');
    expect(cls).not.toContain('active');
  });

  it('adds active class when dragging over', () => {
    const cls = getDropZoneClass('values', true);
    expect(cls).toContain('drop-zone--values');
    expect(cls).toContain('drop-zone--active');
  });
});

describe('icon registry constants', () => {
  it('ARTIFACT_ICONS has entries', () => {
    expect(Object.keys(ARTIFACT_ICONS).length).toBeGreaterThan(0);
  });

  it('FIELD_TYPE_ICONS has entries', () => {
    expect(Object.keys(FIELD_TYPE_ICONS).length).toBeGreaterThan(0);
  });

  it('SOURCE_ICONS has entries', () => {
    expect(Object.keys(SOURCE_ICONS).length).toBeGreaterThan(0);
  });

  it('NAV_ICONS has entries', () => {
    expect(Object.keys(NAV_ICONS).length).toBeGreaterThan(0);
  });

  it('ACTION_ICONS has entries', () => {
    expect(Object.keys(ACTION_ICONS).length).toBeGreaterThan(0);
  });
});

// ========================================================================
// Mobile
// ========================================================================

describe('Mobile constants', () => {
  it('MIN_TOUCH_TARGET is 44', () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });

  it('COMFORTABLE_TOUCH_TARGET is 48', () => {
    expect(COMFORTABLE_TOUCH_TARGET).toBe(48);
  });
});

describe('getBottomSheetDimensions', () => {
  it('returns 30% height for peek', () => {
    const dims = getBottomSheetDimensions('peek');
    expect(dims.heightPercent).toBe(30);
    expect(dims.showHandle).toBe(true);
    expect(dims.backgroundScrollable).toBe(true);
  });

  it('returns 50% height for half', () => {
    const dims = getBottomSheetDimensions('half');
    expect(dims.heightPercent).toBe(50);
    expect(dims.showHandle).toBe(true);
    expect(dims.backgroundScrollable).toBe(false);
  });

  it('returns 92% height for full', () => {
    const dims = getBottomSheetDimensions('full');
    expect(dims.heightPercent).toBe(92);
    expect(dims.showHandle).toBe(true);
    expect(dims.backgroundScrollable).toBe(false);
  });
});

describe('SWIPE_THRESHOLDS', () => {
  it('has expected values', () => {
    expect(SWIPE_THRESHOLDS.minDistance).toBe(50);
    expect(SWIPE_THRESHOLDS.maxVerticalDeviation).toBe(30);
    expect(SWIPE_THRESHOLDS.maxDuration).toBe(300);
    expect(SWIPE_THRESHOLDS.velocityThreshold).toBe(0.3);
  });
});

describe('getMobileNavConfig', () => {
  it('returns default mobile config', () => {
    const config = getMobileNavConfig();
    expect(config.showBottomTabs).toBe(true);
    expect(config.showHamburger).toBe(true);
    expect(config.useBottomSheets).toBe(true);
    expect(config.useStackNavigation).toBe(true);
  });
});
