/**
 * @phozart/phz-react — useGridAdmin Hook Tests
 *
 * Tests for the useGridAdmin hook and settingsToGridProps utility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Setup ─────────────────────────────────────────────

let stateIndex = 0;
const stateStore: Array<{ value: unknown; setter: Function }> = [];

vi.mock('react', () => ({
  useState: (init: unknown) => {
    const idx = stateIndex++;
    if (!stateStore[idx]) {
      const setter = vi.fn((val: unknown) => {
        stateStore[idx].value = typeof val === 'function' ? (val as Function)(stateStore[idx].value) : val;
      });
      stateStore[idx] = { value: init, setter };
    }
    return [stateStore[idx].value, stateStore[idx].setter];
  },
  useEffect: vi.fn(),
  useCallback: (cb: Function, _deps?: unknown[]) => cb,
  useRef: (init: unknown) => ({ current: init }),
  forwardRef: (comp: Function) => comp,
  useImperativeHandle: vi.fn(),
  createElement: vi.fn(),
}));

vi.mock('@phozart/phz-grid-admin', () => ({}));
vi.mock('@phozart/phz-core', () => ({}));
vi.mock('@phozart/phz-engine', () => ({}));

import { useGridAdmin } from '../hooks/use-grid-admin.js';
import { settingsToGridProps } from '../utils/settings-to-grid-props.js';
import type { GridAdminApi } from '../phz-grid-admin.js';

// ─── Test Helpers ───────────────────────────────────────────

function resetHookState() {
  stateIndex = 0;
  stateStore.length = 0;
}

function createMockAdminApi(): GridAdminApi {
  return {
    getSettings: vi.fn(() => ({
      tableSettings: { density: 'compact' as const, showToolbar: true },
      columnFormatting: { name: { bold: true } },
    })),
    setSettings: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  };
}

// ─── useGridAdmin Tests ─────────────────────────────────────

describe('useGridAdmin', () => {
  beforeEach(resetHookState);

  it('returns settings, isOpen, getSettings, setSettings, open, close', () => {
    const adminRef = { current: createMockAdminApi() };
    const result = useGridAdmin(adminRef);

    expect(result).toHaveProperty('settings');
    expect(result).toHaveProperty('isOpen');
    expect(result).toHaveProperty('getSettings');
    expect(result).toHaveProperty('setSettings');
    expect(result).toHaveProperty('open');
    expect(result).toHaveProperty('close');
  });

  it('initial settings is null', () => {
    const adminRef = { current: createMockAdminApi() };
    const result = useGridAdmin(adminRef);
    expect(result.settings).toBeNull();
  });

  it('initial isOpen is false', () => {
    const adminRef = { current: createMockAdminApi() };
    const result = useGridAdmin(adminRef);
    expect(result.isOpen).toBe(false);
  });

  it('getSettings delegates to adminApi.getSettings()', () => {
    const api = createMockAdminApi();
    const adminRef = { current: api };
    const { getSettings } = useGridAdmin(adminRef);

    const settings = getSettings();
    expect(api.getSettings).toHaveBeenCalled();
    expect(settings).toEqual({
      tableSettings: { density: 'compact', showToolbar: true },
      columnFormatting: { name: { bold: true } },
    });
  });

  it('setSettings delegates to adminApi.setSettings()', () => {
    const api = createMockAdminApi();
    const adminRef = { current: api };
    const { setSettings } = useGridAdmin(adminRef);

    const newSettings = { tableSettings: { density: 'dense' as const } };
    setSettings(newSettings);
    expect(api.setSettings).toHaveBeenCalledWith(newSettings);
  });

  it('open delegates to adminApi.open()', () => {
    const api = createMockAdminApi();
    const adminRef = { current: api };
    const { open } = useGridAdmin(adminRef);

    open();
    expect(api.open).toHaveBeenCalled();
  });

  it('close delegates to adminApi.close()', () => {
    const api = createMockAdminApi();
    const adminRef = { current: api };
    const { close } = useGridAdmin(adminRef);

    close();
    expect(api.close).toHaveBeenCalled();
  });
});

// ─── Null Ref Safety Tests ──────────────────────────────────

describe('useGridAdmin null ref safety', () => {
  beforeEach(resetHookState);

  it('with null ref does not throw', () => {
    const adminRef = { current: null };
    expect(() => useGridAdmin(adminRef)).not.toThrow();
  });

  it('getSettings returns null with null ref', () => {
    const adminRef = { current: null };
    const { getSettings } = useGridAdmin(adminRef);
    expect(getSettings()).toBeNull();
  });

  it('setSettings is a no-op with null ref', () => {
    const adminRef = { current: null };
    const { setSettings } = useGridAdmin(adminRef);
    expect(() => setSettings({ tableSettings: {} })).not.toThrow();
  });

  it('open is a no-op with null ref', () => {
    const adminRef = { current: null };
    const { open } = useGridAdmin(adminRef);
    expect(() => open()).not.toThrow();
  });

  it('close is a no-op with null ref', () => {
    const adminRef = { current: null };
    const { close } = useGridAdmin(adminRef);
    expect(() => close()).not.toThrow();
  });
});

// ─── settingsToGridProps Tests ──────────────────────────────

describe('settingsToGridProps', () => {
  it('returns empty object for null settings', () => {
    expect(settingsToGridProps(null)).toEqual({});
  });

  it('returns empty object for undefined settings', () => {
    expect(settingsToGridProps(undefined)).toEqual({});
  });

  it('returns empty object for settings with no tableSettings', () => {
    expect(settingsToGridProps({})).toEqual({});
  });

  it('maps container settings', () => {
    const result = settingsToGridProps({
      tableSettings: { containerShadow: 'lg', containerRadius: 12 },
    });
    expect(result.containerShadow).toBe('lg');
    expect(result.containerRadius).toBe(12);
  });

  it('maps title bar settings', () => {
    const result = settingsToGridProps({
      tableSettings: {
        showTitleBar: true,
        titleText: 'My Grid',
        subtitleText: 'Subtitle',
        titleFontFamily: 'Arial',
        titleFontSize: 16,
        subtitleFontSize: 14,
        titleBarBg: '#000',
        titleBarText: '#fff',
        titleIcon: 'chart',
      },
    });
    expect(result.showTitleBar).toBe(true);
    expect(result.gridTitle).toBe('My Grid');
    expect(result.gridSubtitle).toBe('Subtitle');
    expect(result.titleFontFamily).toBe('Arial');
    expect(result.titleFontSize).toBe(16);
    expect(result.subtitleFontSize).toBe(14);
    expect(result.titleBarBg).toBe('#000');
    expect(result.titleBarText).toBe('#fff');
    expect(result.titleIcon).toBe('chart');
  });

  it('maps toolbar settings', () => {
    const result = settingsToGridProps({
      tableSettings: {
        showToolbar: false,
        showSearch: true,
        showDensityToggle: false,
        showColumnEditor: true,
        showCsvExport: false,
        showExcelExport: true,
      },
    });
    expect(result.showToolbar).toBe(false);
    expect(result.showSearch).toBe(true);
    expect(result.showDensityToggle).toBe(false);
    expect(result.showColumnEditor).toBe(true);
    expect(result.showCsvExport).toBe(false);
    expect(result.showExcelExport).toBe(true);
  });

  it('maps grid options', () => {
    const result = settingsToGridProps({
      tableSettings: {
        density: 'dense',
        pageSize: 50,
        rowBanding: true,
        showPagination: false,
        showCheckboxes: true,
        scrollMode: 'virtual',
      },
    });
    expect(result.density).toBe('dense');
    expect(result.pageSize).toBe(50);
    expect(result.rowBanding).toBe(true);
    expect(result.showPagination).toBe(false);
    expect(result.showCheckboxes).toBe(true);
    expect(result.scrollMode).toBe('virtual');
  });

  it('maps grouping settings (groupByFields → groupBy)', () => {
    const result = settingsToGridProps({
      tableSettings: {
        groupByFields: ['region', 'dept'],
        groupByLevels: [['region'], ['dept']],
        groupTotals: true,
        groupTotalsFn: 'avg',
      },
    });
    expect(result.groupBy).toEqual(['region', 'dept']);
    expect(result.groupByLevels).toEqual([['region'], ['dept']]);
    expect(result.groupTotals).toBe(true);
    expect(result.groupTotalsFn).toBe('avg');
  });

  it('maps aggregation settings (showAggregation → aggregation)', () => {
    const result = settingsToGridProps({
      tableSettings: {
        showAggregation: true,
        aggregationPosition: 'both',
        aggregationFn: 'max',
      },
    });
    expect(result.aggregation).toBe(true);
    expect(result.aggregationPosition).toBe('both');
    expect(result.aggregationFn).toBe('max');
  });

  it('maps display settings', () => {
    const result = settingsToGridProps({
      tableSettings: {
        gridLines: 'both',
        gridLineColor: '#ccc',
        gridLineWidth: 'medium',
        bandingColor: '#eee',
        hoverHighlight: false,
        cellTextOverflow: 'ellipsis',
        compactNumbers: true,
      },
    });
    expect(result.gridLines).toBe('both');
    expect(result.gridLineColor).toBe('#ccc');
    expect(result.gridLineWidth).toBe('medium');
    expect(result.bandingColor).toBe('#eee');
    expect(result.hoverHighlight).toBe(false);
    expect(result.cellTextOverflow).toBe('ellipsis');
    expect(result.compactNumbers).toBe(true);
  });

  it('maps section colors', () => {
    const result = settingsToGridProps({
      tableSettings: {
        headerBg: '#aaa',
        headerText: '#111',
        bodyBg: '#bbb',
        bodyText: '#222',
        footerBg: '#ccc',
        footerText: '#333',
      },
    });
    expect(result.headerBg).toBe('#aaa');
    expect(result.headerText).toBe('#111');
    expect(result.bodyBg).toBe('#bbb');
    expect(result.bodyText).toBe('#222');
    expect(result.footerBg).toBe('#ccc');
    expect(result.footerText).toBe('#333');
  });

  it('maps top-level presentation properties', () => {
    const result = settingsToGridProps({
      columnFormatting: { name: { bold: true } },
      numberFormats: { amount: { decimals: 2 } },
      statusColors: { active: { bg: '#g', color: '#w', dot: '#g' } },
      barThresholds: [{ min: 80, color: '#green' }],
      dateFormats: { created: 'dd/mm/yyyy' },
    });
    expect(result.columnFormatting).toEqual({ name: { bold: true } });
    expect(result.numberFormats).toEqual({ amount: { decimals: 2 } });
    expect(result.statusColors).toEqual({ active: { bg: '#g', color: '#w', dot: '#g' } });
    expect(result.barThresholds).toEqual([{ min: 80, color: '#green' }]);
    expect(result.dateFormats).toEqual({ created: 'dd/mm/yyyy' });
  });

  it('maps typography settings', () => {
    const result = settingsToGridProps({
      tableSettings: {
        fontFamily: 'Roboto',
        fontSize: 14,
      },
    });
    expect(result.fontFamily).toBe('Roboto');
    expect(result.fontSize).toBe(14);
  });

  it('only includes defined properties (no undefined keys)', () => {
    const result = settingsToGridProps({
      tableSettings: { density: 'compact' },
    });
    expect(result.density).toBe('compact');
    // Should NOT have keys that were not set
    expect(result).not.toHaveProperty('showToolbar');
    expect(result).not.toHaveProperty('gridTitle');
  });
});
