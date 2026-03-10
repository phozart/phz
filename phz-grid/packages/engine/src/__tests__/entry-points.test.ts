/**
 * Tests that focused entry points export the expected symbols.
 */
import { describe, it, expect } from 'vitest';

describe('entry-kpi', () => {
  it('exports KPI registry and status functions', async () => {
    const mod = await import('../entry-kpi.js');
    expect(mod.createKPIRegistry).toBeTypeOf('function');
    expect(mod.computeStatus).toBeTypeOf('function');
    expect(mod.computeDelta).toBeTypeOf('function');
    expect(mod.classifyKPIScore).toBeTypeOf('function');
    expect(mod.STATUS_COLORS).toBeDefined();
    expect(mod.STATUS_ICONS).toBeDefined();
    expect(mod.createDefaultScoreProvider).toBeTypeOf('function');
    expect(mod.resolveThresholdValue).toBeTypeOf('function');
    expect(mod.computeStatusFromBands).toBeTypeOf('function');
  });
});

describe('entry-dashboard', () => {
  it('exports dashboard config and widget utilities', async () => {
    const mod = await import('../entry-dashboard.js');
    expect(mod.createDashboardConfigStore).toBeTypeOf('function');
    expect(mod.upgradeDashboardConfig).toBeTypeOf('function');
    expect(mod.createEnhancedDashboardConfig).toBeTypeOf('function');
    expect(mod.serializeDashboard).toBeTypeOf('function');
    expect(mod.isEnhancedDashboard).toBeTypeOf('function');
    expect(mod.DEFAULT_DASHBOARD_THEME).toBeDefined();
    expect(mod.validateWidget).toBeTypeOf('function');
    expect(mod.SMART_DEFAULTS).toBeDefined();
    expect(mod.resolveWidgetProps).toBeTypeOf('function');
    expect(mod.resolveDashboardWidgets).toBeTypeOf('function');
    expect(mod.processWidgetData).toBeTypeOf('function');
    expect(mod.projectChartData).toBeTypeOf('function');
    expect(mod.projectAggregatedChartData).toBeTypeOf('function');
    expect(mod.projectPieData).toBeTypeOf('function');
    expect(mod.getPaletteColors).toBeTypeOf('function');
    expect(mod.PALETTE_PRESETS).toBeDefined();
    expect(mod.createDashboardDataModelStore).toBeTypeOf('function');
    expect(mod.deepMerge).toBeTypeOf('function');
  });
});

describe('entry-criteria', () => {
  it('exports criteria engine and filter utilities', async () => {
    const mod = await import('../entry-criteria.js');
    expect(mod.createCriteriaEngine).toBeTypeOf('function');
    expect(mod.createFilterAdapter).toBeTypeOf('function');
    expect(mod.applyArtefactCriteria).toBeTypeOf('function');
    expect(mod.globalFiltersToCriteriaBindings).toBeTypeOf('function');
    expect(mod.createFilterRegistry).toBeTypeOf('function');
    expect(mod.createFilterBindingStore).toBeTypeOf('function');
    expect(mod.createFilterStateManager).toBeTypeOf('function');
    expect(mod.createFilterRuleEngine).toBeTypeOf('function');
    expect(mod.createCriteriaOutputManager).toBeTypeOf('function');
    expect(mod.createFilterAdminService).toBeTypeOf('function');
    expect(mod.resolveReportCriteria).toBeTypeOf('function');
    expect(mod.resolveDashboardCriteria).toBeTypeOf('function');
    expect(mod.validateCriteria).toBeTypeOf('function');
    expect(mod.serializeCriteria).toBeTypeOf('function');
    expect(mod.deserializeCriteria).toBeTypeOf('function');
  });
});

describe('entry-expression', () => {
  it('exports expression parser, evaluator, and validator', async () => {
    const mod = await import('../entry-expression.js');
    expect(mod.parameterId).toBeTypeOf('function');
    expect(mod.calculatedFieldId).toBeTypeOf('function');
    expect(mod.createDependencyGraph).toBeTypeOf('function');
    expect(mod.extractDependencies).toBeTypeOf('function');
    expect(mod.evaluateRowExpression).toBeTypeOf('function');
    expect(mod.evaluateMetricExpression).toBeTypeOf('function');
    expect(mod.validateExpression).toBeTypeOf('function');
    expect(mod.parseFormula).toBeTypeOf('function');
    expect(mod.formatFormula).toBeTypeOf('function');
  });
});

describe('entry-storage', () => {
  it('exports storage adapters', async () => {
    const mod = await import('../entry-storage.js');
    expect(mod.MemoryStorageAdapter).toBeTypeOf('function');
    expect(mod.LocalStorageAdapter).toBeTypeOf('function');
  });
});

describe('main index backward compatibility', () => {
  it('still exports everything from the main entry point', async () => {
    const main = await import('../index.js');
    // Spot-check that the main entry still has everything
    expect(main.createBIEngine).toBeTypeOf('function');
    expect(main.createKPIRegistry).toBeTypeOf('function');
    expect(main.computeStatus).toBeTypeOf('function');
    expect(main.createDashboardConfigStore).toBeTypeOf('function');
    expect(main.createCriteriaEngine).toBeTypeOf('function');
    expect(main.createFilterAdapter).toBeTypeOf('function');
    expect(main.parseFormula).toBeTypeOf('function');
    expect(main.MemoryStorageAdapter).toBeTypeOf('function');
    expect(main.processWidgetData).toBeTypeOf('function');
  });
});
