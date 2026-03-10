import { describe, it, expect } from 'vitest';
import { createReportConfigStore } from '../report.js';
import type { ReportConfig } from '../report.js';
import type { ReportPresentation, TableSettings } from '../report-presentation.js';
import { DEFAULT_TABLE_SETTINGS, DEFAULT_REPORT_PRESENTATION } from '../report-presentation.js';
import { reportId, dataProductId } from '../types.js';

function makeReport(overrides: Partial<ReportConfig> = {}): ReportConfig {
  return {
    id: reportId('rp1'),
    name: 'Presentation Test Report',
    dataProductId: dataProductId('sales'),
    columns: [
      { field: 'region', header: 'Region' },
      { field: 'amount', header: 'Amount', width: 120 },
    ],
    sort: { columns: [{ field: 'amount', direction: 'desc' }] },
    pageSize: 50,
    created: Date.now(),
    updated: Date.now(),
    ...overrides,
  };
}

describe('ReportPresentation types', () => {
  it('DEFAULT_TABLE_SETTINGS has all expected keys', () => {
    const keys: (keyof TableSettings)[] = [
      'containerShadow', 'containerRadius',
      'showTitleBar', 'titleText', 'subtitleText',
      'showToolbar', 'showSearch',
      'density', 'loadingMode', 'pageSize',
      'fontFamily', 'fontSize', 'hAlign', 'vAlign',
      'headerBg', 'headerText', 'bodyBg', 'bodyText',
      'groupByFields', 'groupByLevels', 'groupTotals',
      'numberAlign', 'textAlign', 'dateAlign', 'booleanAlign',
      'showAggregation', 'aggregationPosition', 'aggregationFn', 'aggregationOverrides',
      'scrollMode', 'virtualScrollThreshold', 'fetchPageSize', 'prefetchPages',
    ];
    for (const key of keys) {
      expect(DEFAULT_TABLE_SETTINGS).toHaveProperty(key);
    }
  });

  it('DEFAULT_TABLE_SETTINGS aggregation defaults are correct', () => {
    expect(DEFAULT_TABLE_SETTINGS.showAggregation).toBe(false);
    expect(DEFAULT_TABLE_SETTINGS.aggregationPosition).toBe('bottom');
    expect(DEFAULT_TABLE_SETTINGS.aggregationFn).toBe('sum');
    expect(DEFAULT_TABLE_SETTINGS.aggregationOverrides).toEqual({});
  });

  it('DEFAULT_REPORT_PRESENTATION is a valid shell with tableSettings', () => {
    expect(DEFAULT_REPORT_PRESENTATION).toBeDefined();
    expect(DEFAULT_REPORT_PRESENTATION.tableSettings).toBeDefined();
    expect(DEFAULT_REPORT_PRESENTATION.tableSettings!.density).toBe('compact');
  });
});

describe('ReportConfig with presentation', () => {
  it('saves and retrieves a report with presentation', () => {
    const store = createReportConfigStore();
    const presentation: ReportPresentation = {
      tableSettings: { density: 'comfortable', fontSize: 16 },
      columnFormatting: { region: { bold: true } },
    };
    const report = makeReport({ presentation });
    store.save(report);

    const saved = store.get(reportId('rp1'));
    expect(saved?.presentation).toBeDefined();
    expect(saved?.presentation?.tableSettings?.density).toBe('comfortable');
    expect(saved?.presentation?.columnFormatting?.region?.bold).toBe(true);
  });

  it('saves a report without presentation (backward compat)', () => {
    const store = createReportConfigStore();
    const report = makeReport();
    store.save(report);
    const saved = store.get(reportId('rp1'));
    expect(saved?.presentation).toBeUndefined();
  });

  it('toGridConfig includes presentation when present', () => {
    const store = createReportConfigStore();
    const presentation: ReportPresentation = {
      tableSettings: { density: 'comfortable' },
      statusColors: { active: { bg: '#00ff00', color: '#000', dot: '#0f0' } },
    };
    const report = makeReport({ presentation });
    const gridConfig = store.toGridConfig(report);

    expect(gridConfig.presentation).toBeDefined();
    expect(gridConfig.presentation?.tableSettings?.density).toBe('comfortable');
    expect(gridConfig.presentation?.statusColors?.active.bg).toBe('#00ff00');
  });

  it('toGridConfig omits presentation when not set', () => {
    const store = createReportConfigStore();
    const report = makeReport();
    const gridConfig = store.toGridConfig(report);

    expect(gridConfig.presentation).toBeUndefined();
  });

  it('round-trips full presentation through save/get', () => {
    const store = createReportConfigStore();
    const presentation: ReportPresentation = {
      tableSettings: { density: 'compact', showToolbar: false, pageSize: 100 },
      columnFormatting: { amount: { bold: true, hAlign: 'right', bgColor: '#FEF3C7' } },
      numberFormats: { amount: { decimals: 2, display: 'currency', prefix: '$' } },
      dateFormats: { created: 'yyyy-mm-dd' },
      barThresholds: [{ min: 0, color: '#22C55E' }, { min: 50, color: '#EF4444' }],
    };
    const report = makeReport({ presentation });
    store.save(report);

    const saved = store.get(reportId('rp1'));
    expect(saved!.presentation!.tableSettings!.pageSize).toBe(100);
    expect(saved!.presentation!.numberFormats!.amount.prefix).toBe('$');
    expect(saved!.presentation!.barThresholds).toHaveLength(2);
    expect(saved!.presentation!.dateFormats!.created).toBe('yyyy-mm-dd');
  });
});
