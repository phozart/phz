/**
 * v15 Amendment Integration Test
 *
 * Verifies that the 4 amendments (A through D) work together and
 * their cross-cutting concerns are coherent:
 *
 *   Amendment A: Alert-Aware Single-Value Widgets
 *   Amendment B: Micro-Widget Cell Renderers
 *   Amendment C: Impact Chain State Machine
 *   Amendment D: Attention Faceted Filtering
 *
 * Cross-amendment: Alert tokens in micro-widget value-only renderer
 * should match the design system alert token colors.
 */
import { describe, it, expect } from 'vitest';

// --- Amendment A imports ---
import {
  type AlertVisualState,
  type SingleValueAlertConfig,
  type WidgetAlertSeverity,
  resolveAlertVisualState,
  getAlertTokens,
  degradeAlertMode,
  createDefaultAlertConfig,
} from '@phozart/shared/types';

import {
  ALERT_WIDGET_TOKENS,
} from '@phozart/shared/design-system';

// --- Amendment B imports ---
import {
  type CellRendererRegistry,
  createCellRendererRegistry,
  type MicroWidgetCellConfig,
} from '@phozart/shared/types';

import {
  createValueOnlyRenderer,
  createSparklineRenderer,
  createDeltaRenderer,
  createGaugeArcRenderer,
  registerAllMicroWidgetRenderers,
} from '@phozart/widgets';

// --- Amendment C imports ---
import type {
  ImpactChainNode,
} from '@phozart/shared/types';

import {
  initialImpactChainState,
  computeChainLayout,
  getChainContainerVariant,
  getHypothesisColor,
  getHypothesisLabel,
  getNodeRoleColor,
  computeChainSummary,
  resolveConclusion,
  type ImpactChainState,
  type NodePosition,
} from '@phozart/widgets';

// --- Amendment D imports ---
import {
  type FilterableAttentionItem,
  type AttentionFilterState,
  filterAttentionItems,
  computeAttentionFacets,
} from '@phozart/shared/types';

import {
  initialAttentionFacetedState,
  toggleFacetValue,
  getVisibleItems,
} from '@phozart/shared/coordination';

// ========================================================================
// Helpers
// ========================================================================

function createTestNodes(): ImpactChainNode[] {
  return [
    {
      id: 'root',
      label: 'Database Overload',
      parentId: undefined,
      status: 'critical' as const,
      nodeRole: 'root-cause',
      hypothesisState: 'validated',
      edgeLabel: undefined,
      impactMetrics: [
        { label: 'CPU', value: '95%', field: 'cpu_pct' },
      ],
    },
    {
      id: 'failure',
      label: 'Query Timeout',
      parentId: 'root',
      status: 'warning' as const,
      nodeRole: 'failure',
      hypothesisState: 'validated',
      edgeLabel: 'causes',
      impactMetrics: [
        { label: 'Latency', value: '12s', field: 'query_latency' },
      ],
    },
    {
      id: 'hypothesis-1',
      label: 'Missing Index',
      parentId: 'failure',
      status: 'info' as const,
      nodeRole: 'hypothesis',
      hypothesisState: 'invalidated',
      edgeLabel: 'possibly due to',
    },
    {
      id: 'hypothesis-2',
      label: 'Lock Contention',
      parentId: 'failure',
      status: 'info' as const,
      nodeRole: 'hypothesis',
      hypothesisState: 'inconclusive',
      edgeLabel: 'possibly due to',
    },
    {
      id: 'impact',
      label: 'User Churn',
      parentId: 'failure',
      status: 'warning' as const,
      nodeRole: 'impact',
      hypothesisState: 'pending',
      edgeLabel: 'impacts',
    },
  ];
}

function createTestAttentionItems(): FilterableAttentionItem[] {
  const now = Date.now();
  return [
    {
      id: 'a1',
      priority: 'critical',
      source: 'alert',
      artifactId: 'dash-1',
      artifactName: 'Sales Dashboard',
      acknowledged: false,
      timestamp: now - 1000,
      title: 'Revenue dropped 15%',
    },
    {
      id: 'a2',
      priority: 'warning',
      source: 'alert',
      artifactId: 'dash-1',
      artifactName: 'Sales Dashboard',
      acknowledged: false,
      timestamp: now - 2000,
      title: 'Conversion rate below target',
    },
    {
      id: 'a3',
      priority: 'critical',
      source: 'system',
      artifactId: 'dash-2',
      artifactName: 'Ops Dashboard',
      acknowledged: false,
      timestamp: now - 3000,
      title: 'Server latency spike',
    },
    {
      id: 'a4',
      priority: 'info',
      source: 'stale',
      artifactId: 'dash-3',
      artifactName: 'HR Dashboard',
      acknowledged: false,
      timestamp: now - 4000,
      title: 'Data source stale',
    },
    {
      id: 'a5',
      priority: 'warning',
      source: 'review',
      artifactId: 'dash-4',
      artifactName: 'Finance Dashboard',
      acknowledged: true,
      timestamp: now - 5000,
      title: 'Report needs review',
    },
    {
      id: 'a6',
      priority: 'info',
      source: 'external',
      artifactId: 'dash-5',
      artifactName: 'Marketing Dashboard',
      acknowledged: false,
      timestamp: now - 6000,
      title: 'External feed update',
    },
  ];
}

// ========================================================================
// Tests
// ========================================================================

describe('v15 Amendment Integration', () => {
  // ==============================================================
  // Amendment A: Alert-Aware Single-Value Widgets
  // ==============================================================

  describe('Amendment A: Alert-Aware Single-Value Widgets', () => {
    it('creates a default alert config', () => {
      const config = createDefaultAlertConfig();
      expect(config.alertVisualMode).toBe('indicator');
      expect(config.alertAnimateTransition).toBe(true);
      expect(config.alertRuleBinding).toBeUndefined();
    });

    it('resolves alert visual state from alert events', () => {
      const config: SingleValueAlertConfig = {
        alertRuleBinding: 'rule-1',
        alertVisualMode: 'background',
        alertAnimateTransition: true,
      };

      const events = new Map<string, WidgetAlertSeverity>();
      events.set('rule-1', 'critical');

      const state: AlertVisualState = resolveAlertVisualState(config, events);
      expect(state.severity).toBe('critical');
      expect(state.ruleId).toBe('rule-1');
      expect(state.lastTransition).toBeGreaterThan(0);
    });

    it('returns healthy when no binding exists', () => {
      const config = createDefaultAlertConfig();
      const events = new Map<string, WidgetAlertSeverity>();
      events.set('rule-1', 'critical');

      const state = resolveAlertVisualState(config, events);
      expect(state.severity).toBe('healthy');
    });

    it('computes alert tokens for each severity and mode', () => {
      const criticalBg = getAlertTokens('critical', 'background');
      expect(criticalBg.bg).toBe('widget.alert.critical.bg');
      expect(criticalBg.indicator).toBe('widget.alert.critical.indicator');

      const warningBorder = getAlertTokens('warning', 'border');
      expect(warningBorder.border).toBe('widget.alert.warning.border');
      expect(warningBorder.indicator).toBe('widget.alert.warning.indicator');

      const noneTokens = getAlertTokens('healthy', 'none');
      expect(noneTokens.bg).toBeUndefined();
      expect(noneTokens.indicator).toBeUndefined();
      expect(noneTokens.border).toBeUndefined();
    });

    it('degrades alert rendering for compact container', () => {
      const params = degradeAlertMode('indicator', 'compact');
      expect(params.showIndicator).toBe(true);
      expect(params.indicatorSize).toBe(8);
      expect(params.borderWidth).toBe(0);
    });

    it('degrades alert rendering for minimal container', () => {
      const params = degradeAlertMode('border', 'minimal');
      expect(params.showIndicator).toBe(true);
      expect(params.indicatorSize).toBe(6);
      expect(params.borderWidth).toBe(2);
    });

    it('token values match design system constants', () => {
      const tokens = getAlertTokens('critical', 'indicator');
      const tokenKey = tokens.indicator!;
      // The token key is 'widget.alert.critical.indicator'
      // The actual color value is in ALERT_WIDGET_TOKENS
      expect(ALERT_WIDGET_TOKENS['widget.alert.critical.indicator']).toBe('#ef4444');
      expect(ALERT_WIDGET_TOKENS['widget.alert.warning.indicator']).toBe('#f59e0b');
      expect(ALERT_WIDGET_TOKENS['widget.alert.healthy.indicator']).toBe('#22c55e');
    });
  });

  // ==============================================================
  // Amendment B: Micro-Widget Cell Renderers
  // ==============================================================

  describe('Amendment B: Micro-Widget Cell Renderers', () => {
    it('creates a registry and registers renderers', () => {
      const registry = createCellRendererRegistry();
      expect(registry.has('value-only')).toBe(false);

      registerAllMicroWidgetRenderers(registry);

      expect(registry.has('value-only')).toBe(true);
      expect(registry.has('sparkline')).toBe(true);
      expect(registry.has('delta')).toBe(true);
      expect(registry.has('gauge-arc')).toBe(true);
      expect(registry.getRegisteredTypes()).toHaveLength(4);
    });

    it('renders a sparkline', () => {
      const renderer = createSparklineRenderer();
      const config: MicroWidgetCellConfig = {
        widgetType: 'trend-line',
        dataBinding: { valueField: 'revenue', sparklineField: 'revenue_history' },
        displayMode: 'sparkline',
      };

      expect(renderer.canRender(config, 80)).toBe(true);
      expect(renderer.canRender(config, 40)).toBe(false);

      const result = renderer.render(config, [10, 20, 15, 25, 30], 120, 24);
      expect(result.html).toContain('<svg');
      expect(result.html).toContain('polyline');
      expect(result.width).toBe(120);
      expect(result.height).toBe(24);
    });

    it('renders a delta', () => {
      const renderer = createDeltaRenderer();
      const config: MicroWidgetCellConfig = {
        widgetType: 'kpi-card',
        dataBinding: { valueField: 'revenue', compareField: 'prev_revenue' },
        displayMode: 'delta',
      };

      const result = renderer.render(config, { current: 120, previous: 100 }, 150, 24);
      expect(result.html).toContain('<svg');
      expect(result.html).toContain('+20.0%');
    });

    it('renders a gauge arc', () => {
      const renderer = createGaugeArcRenderer();
      const config: MicroWidgetCellConfig = {
        widgetType: 'gauge',
        dataBinding: { valueField: 'cpu' },
        displayMode: 'gauge-arc',
        thresholds: { warning: 70, critical: 90 },
      };

      const result = renderer.render(config, 85, 80, 40);
      expect(result.html).toContain('<svg');
      expect(result.html).toContain('85');
    });

    it('value-only renderer produces SVG with status dot', () => {
      const renderer = createValueOnlyRenderer();
      const config: MicroWidgetCellConfig = {
        widgetType: 'kpi-card',
        dataBinding: { valueField: 'revenue' },
        displayMode: 'value-only',
        thresholds: { warning: 80, critical: 95 },
      };

      // Value below warning -> healthy (green dot)
      const healthyResult = renderer.render(config, 50, 100, 24);
      expect(healthyResult.html).toContain('#22c55e'); // healthy indicator color

      // Value above critical -> critical (red dot)
      const criticalResult = renderer.render(config, 96, 100, 24);
      expect(criticalResult.html).toContain('#ef4444'); // critical indicator color
    });
  });

  // ==============================================================
  // Amendment C: Impact Chain State Machine
  // ==============================================================

  describe('Amendment C: Impact Chain State Machine', () => {
    it('creates initial state from nodes', () => {
      const nodes = createTestNodes();
      const state: ImpactChainState = initialImpactChainState(nodes);

      expect(state.nodes).toHaveLength(5);
      expect(state.variant).toBe('impact-chain');
      expect(state.chainLayout.direction).toBe('horizontal');
      expect(state.chainLayout.showEdgeLabels).toBe(true);
      expect(state.containerWidth).toBe(800);
      // Root node (no parentId) should be expanded by default
      expect(state.expandedNodeIds.has('root')).toBe(true);
    });

    it('computes chain layout with positions', () => {
      const nodes = createTestNodes();
      const state = initialImpactChainState(nodes);
      const layout = computeChainLayout(state);

      expect(layout.layoutDirection).toBe('horizontal');
      expect(layout.nodePositions).toHaveLength(5);
      expect(layout.edges).toHaveLength(4);

      // Verify positions are laid out horizontally
      const positions = layout.nodePositions;
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].x).toBeGreaterThan(positions[i - 1].x);
        expect(positions[i].y).toBe(0); // horizontal layout => y = 0
      }

      // Check edge labels
      const edgeWithLabel = layout.edges.find(e => e.label === 'causes');
      expect(edgeWithLabel).toBeDefined();
      expect(edgeWithLabel!.from).toBe('root');
      expect(edgeWithLabel!.to).toBe('failure');
    });

    it('computes layout with collapseInvalidated', () => {
      const nodes = createTestNodes();
      const state = initialImpactChainState(nodes, {
        renderVariant: 'impact-chain',
        chainLayout: {
          direction: 'horizontal',
          showEdgeLabels: true,
          collapseInvalidated: true,
        },
      });

      const layout = computeChainLayout(state);
      // hypothesis-1 is invalidated, should be filtered out
      expect(layout.nodePositions).toHaveLength(4);
      const nodeIds = layout.nodePositions.map(p => p.nodeId);
      expect(nodeIds).not.toContain('hypothesis-1');
    });

    it('determines container variant based on width', () => {
      expect(getChainContainerVariant(800)).toBe('full');
      expect(getChainContainerVariant(400)).toBe('compact');
      expect(getChainContainerVariant(150)).toBe('summary');
    });

    it('provides hypothesis colors and labels', () => {
      expect(getHypothesisColor('validated')).toBe('#22c55e');
      expect(getHypothesisColor('invalidated')).toBe('#ef4444');
      expect(getHypothesisLabel('inconclusive')).toBe('Inconclusive');
      expect(getHypothesisLabel('pending')).toBe('Pending');
    });

    it('provides node role colors', () => {
      expect(getNodeRoleColor('root-cause')).toBe('#dc2626');
      expect(getNodeRoleColor('failure')).toBe('#f59e0b');
      expect(getNodeRoleColor('impact')).toBe('#3b82f6');
      expect(getNodeRoleColor('hypothesis')).toBe('#8b5cf6');
    });

    it('computes chain summary', () => {
      const nodes = createTestNodes();
      const summary = computeChainSummary(nodes);

      expect(summary.validated).toBe(2); // root + failure
      expect(summary.invalidated).toBe(1); // hypothesis-1
      expect(summary.inconclusive).toBe(1); // hypothesis-2
      expect(summary.pending).toBe(1); // impact
      expect(summary.rootCauses).toEqual(['Database Overload']);
      expect(summary.impacts).toEqual(['User Churn']);
    });

    it('resolves conclusion text template', () => {
      const nodes = createTestNodes();
      const template = '{{validatedCount}} validated, {{invalidatedCount}} invalidated. Root causes: {{rootCauses}}';
      const result = resolveConclusion(template, nodes);
      expect(result).toBe('2 validated, 1 invalidated. Root causes: Database Overload');
    });
  });

  // ==============================================================
  // Amendment D: Attention Faceted Filtering
  // ==============================================================

  describe('Amendment D: Attention Faceted Filtering', () => {
    it('filters items by priority (OR within facet)', () => {
      const items = createTestAttentionItems();
      const filters: AttentionFilterState = {
        priority: ['critical'],
        acknowledged: false,
      };

      const result = filterAttentionItems(items, filters);
      expect(result).toHaveLength(2); // a1, a3
      expect(result.every(i => i.priority === 'critical')).toBe(true);
    });

    it('filters items by source (OR within facet)', () => {
      const items = createTestAttentionItems();
      const filters: AttentionFilterState = {
        source: ['alert', 'system'],
        acknowledged: false,
      };

      const result = filterAttentionItems(items, filters);
      expect(result).toHaveLength(3); // a1, a2, a3
    });

    it('filters with AND across facets', () => {
      const items = createTestAttentionItems();
      const filters: AttentionFilterState = {
        priority: ['critical'],
        source: ['alert'],
        acknowledged: false,
      };

      const result = filterAttentionItems(items, filters);
      expect(result).toHaveLength(1); // only a1
      expect(result[0].id).toBe('a1');
    });

    it('computes facets with cross-facet counting', () => {
      const items = createTestAttentionItems();
      const filters: AttentionFilterState = {
        priority: ['critical'],
        acknowledged: false,
      };

      const facets = computeAttentionFacets(items, filters);

      // Priority facet: counts exclude the priority filter itself
      const priorityFacet = facets.find(f => f.field === 'priority')!;
      expect(priorityFacet).toBeDefined();
      expect(priorityFacet.values).toHaveLength(3); // critical, warning, info

      // Source facet: should only count items matching the priority filter (critical)
      const sourceFacet = facets.find(f => f.field === 'source')!;
      expect(sourceFacet).toBeDefined();
      // With priority=critical filter applied: alert(1), system(1)
      const alertCount = sourceFacet.values.find(v => v.value === 'alert')?.count ?? 0;
      const systemCount = sourceFacet.values.find(v => v.value === 'system')?.count ?? 0;
      expect(alertCount).toBe(1);
      expect(systemCount).toBe(1);
    });

    it('creates faceted state and toggles filters', () => {
      const items = createTestAttentionItems();
      let state = initialAttentionFacetedState(items);

      // Initial state: acknowledged=false filter by default
      const visible = getVisibleItems(state);
      // 5 unacknowledged items (a5 is acknowledged)
      expect(visible).toHaveLength(5);

      // Toggle priority filter to critical
      state = toggleFacetValue(state, 'priority', 'critical');
      const filtered = getVisibleItems(state);
      expect(filtered).toHaveLength(2); // a1, a3

      // Toggle again to remove filter
      state = toggleFacetValue(state, 'priority', 'critical');
      const unfiltered = getVisibleItems(state);
      expect(unfiltered).toHaveLength(5);
    });

    it('priority facet values have semantic colors', () => {
      const items = createTestAttentionItems();
      const facets = computeAttentionFacets(items, { acknowledged: false });

      const priorityFacet = facets.find(f => f.field === 'priority')!;
      const criticalValue = priorityFacet.values.find(v => v.value === 'critical')!;
      expect(criticalValue.color).toBe('#EF4444');

      const warningValue = priorityFacet.values.find(v => v.value === 'warning')!;
      expect(warningValue.color).toBe('#F59E0B');

      const infoValue = priorityFacet.values.find(v => v.value === 'info')!;
      expect(infoValue.color).toBe('#6B7280');
    });
  });

  // ==============================================================
  // Cross-Amendment: Alert tokens in micro-widget renderers
  // ==============================================================

  describe('Cross-Amendment: Alert tokens in micro-widget renderers', () => {
    it('value-only renderer uses alert token colors for status dots', () => {
      const renderer = createValueOnlyRenderer();
      const config: MicroWidgetCellConfig = {
        widgetType: 'kpi-card',
        dataBinding: { valueField: 'metric' },
        displayMode: 'value-only',
        thresholds: { warning: 50, critical: 80 },
      };

      // Below warning -> healthy green from ALERT_WIDGET_TOKENS
      const healthyResult = renderer.render(config, 30, 100, 24);
      expect(healthyResult.html).toContain(
        ALERT_WIDGET_TOKENS['widget.alert.healthy.indicator'],
      );

      // Above warning but below critical -> warning amber
      const warningResult = renderer.render(config, 60, 100, 24);
      expect(warningResult.html).toContain(
        ALERT_WIDGET_TOKENS['widget.alert.warning.indicator'],
      );

      // Above critical -> critical red
      const criticalResult = renderer.render(config, 90, 100, 24);
      expect(criticalResult.html).toContain(
        ALERT_WIDGET_TOKENS['widget.alert.critical.indicator'],
      );
    });

    it('alert visual state severity maps to consistent design tokens', () => {
      // Demonstrate the integration path:
      // 1. Resolve alert visual state (Amendment A)
      const config: SingleValueAlertConfig = {
        alertRuleBinding: 'rule-1',
        alertVisualMode: 'indicator',
        alertAnimateTransition: true,
      };
      const events = new Map<string, WidgetAlertSeverity>();
      events.set('rule-1', 'warning');

      const alertState = resolveAlertVisualState(config, events);
      expect(alertState.severity).toBe('warning');

      // 2. Get alert tokens for the resolved state (Amendment A)
      const tokens = getAlertTokens(alertState.severity, config.alertVisualMode);
      expect(tokens.indicator).toBe('widget.alert.warning.indicator');

      // 3. The actual color value from the design system matches what
      //    micro-widget renderers use
      const tokenColor = ALERT_WIDGET_TOKENS['widget.alert.warning.indicator'];
      expect(tokenColor).toBe('#f59e0b');

      // 4. Micro-widget value-only renderer uses the same color
      const renderer = createValueOnlyRenderer();
      const microConfig: MicroWidgetCellConfig = {
        widgetType: 'kpi-card',
        dataBinding: { valueField: 'metric' },
        displayMode: 'value-only',
        thresholds: { warning: 50, critical: 80 },
      };

      // Value 60 is above warning(50) but below critical(80) => warning color
      const result = renderer.render(microConfig, 60, 100, 24);
      expect(result.html).toContain(tokenColor);
    });
  });
});
