import { describe, it, expect } from 'vitest';
import type {
  CriteriaConfig,
  SelectionContext,
  SelectionFieldDef,
  FilterBarFieldConfig,
  FilterBarBehavior,
  FilterBarLayout,
  MatchFilterState,
  SelectionPreset,
  BarMode,
  FilterDefinition,
  FilterBinding,
  FilterDefinitionId,
  ArtefactId,
} from '@phozart/core';
import { filterDefinitionId, artefactId } from '@phozart/core';
import { formatCriteriaValue, validateCriteria, resolveDynamicDefaults } from '@phozart/engine';

// --- Test helpers for bar logic (mirroring component logic) ---

function getActiveFields(config: CriteriaConfig, ctx: SelectionContext): SelectionFieldDef[] {
  return config.fields.filter(f => {
    const v = ctx[f.id];
    if (v === null || v === undefined) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === 'string' && v === '') return false;
    return true;
  });
}

function getPinnedFields(config: CriteriaConfig): SelectionFieldDef[] {
  return config.fields.filter(f => f.barConfig?.pinnedToBar);
}

function fieldCount(field: SelectionFieldDef, ctx: SelectionContext): number {
  const v = ctx[field.id];
  if (v === null || v === undefined) return 0;
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'string' && v === '') return 0;
  return 1;
}

// --- Test Data ---

const regionField: SelectionFieldDef = {
  id: 'region',
  label: 'Region',
  type: 'multi_select',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'eu', label: 'Europe' },
    { value: 'asia', label: 'Asia Pacific' },
  ],
  barConfig: { pinnedToBar: true, defaultOpen: true },
};

const statusField: SelectionFieldDef = {
  id: 'status',
  label: 'Status',
  type: 'chip_group',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ],
};

const departmentField: SelectionFieldDef = {
  id: 'department',
  label: 'Department',
  type: 'tree_select',
  treeOptions: [
    {
      value: 'eng',
      label: 'Engineering',
      children: [
        { value: 'frontend', label: 'Frontend' },
        { value: 'backend', label: 'Backend' },
      ],
    },
    { value: 'sales', label: 'Sales' },
  ],
  barConfig: { maxVisibleItems: 5, enableMatchFilter: true },
};

const searchField: SelectionFieldDef = {
  id: 'search',
  label: 'Search',
  type: 'search',
  placeholder: 'Search employees...',
};

const presenceField: SelectionFieldDef = {
  id: 'presence',
  label: 'Field Presence',
  type: 'field_presence',
  fieldPresenceConfig: { fields: ['salary', 'email', 'phone'] },
};

const lockedField: SelectionFieldDef = {
  id: 'year',
  label: 'Year',
  type: 'single_select',
  options: [
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ],
  locked: true,
  lockedValue: '2026',
};

const requiredField: SelectionFieldDef = {
  id: 'country',
  label: 'Country',
  type: 'single_select',
  required: true,
  options: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
  ],
};

const config: CriteriaConfig = {
  fields: [regionField, statusField, departmentField, searchField, presenceField, lockedField],
  behavior: {
    autoApply: false,
    showResetButton: true,
  },
};

// --- Tests ---

describe('Selection Criteria Bar', () => {
  describe('Active count computation', () => {
    it('counts no active filters when context is empty', () => {
      const active = getActiveFields(config, {});
      expect(active).toHaveLength(0);
    });

    it('counts active filters with multi-select values', () => {
      const ctx: SelectionContext = { region: ['us', 'eu'] };
      const active = getActiveFields(config, ctx);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('region');
    });

    it('counts multiple active filters', () => {
      const ctx: SelectionContext = { region: ['us'], status: ['active'], search: 'john' };
      const active = getActiveFields(config, ctx);
      expect(active).toHaveLength(3);
    });

    it('ignores empty arrays', () => {
      const ctx: SelectionContext = { region: [] };
      const active = getActiveFields(config, ctx);
      expect(active).toHaveLength(0);
    });

    it('ignores empty strings', () => {
      const ctx: SelectionContext = { search: '' };
      const active = getActiveFields(config, ctx);
      expect(active).toHaveLength(0);
    });

    it('ignores null values', () => {
      const ctx: SelectionContext = { region: null };
      const active = getActiveFields(config, ctx);
      expect(active).toHaveLength(0);
    });
  });

  describe('Pinned tags', () => {
    it('identifies pinned fields from barConfig', () => {
      const pinned = getPinnedFields(config);
      expect(pinned).toHaveLength(1);
      expect(pinned[0].id).toBe('region');
    });

    it('returns empty when no fields are pinned', () => {
      const noPinnedConfig: CriteriaConfig = {
        fields: [statusField, searchField],
      };
      expect(getPinnedFields(noPinnedConfig)).toHaveLength(0);
    });
  });

  describe('Field count', () => {
    it('returns 0 for undefined value', () => {
      expect(fieldCount(regionField, {})).toBe(0);
    });

    it('returns 0 for null value', () => {
      expect(fieldCount(regionField, { region: null })).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(fieldCount(regionField, { region: [] })).toBe(0);
    });

    it('returns array length for multi-select', () => {
      expect(fieldCount(regionField, { region: ['us', 'eu'] })).toBe(2);
    });

    it('returns 1 for non-empty string', () => {
      expect(fieldCount(searchField, { search: 'test' })).toBe(1);
    });

    it('returns 0 for empty string', () => {
      expect(fieldCount(searchField, { search: '' })).toBe(0);
    });
  });

  describe('Tag removal', () => {
    it('removes a filter by clearing its value', () => {
      const ctx: SelectionContext = { region: ['us', 'eu'], status: ['active'] };
      const newCtx = { ...ctx };
      delete newCtx['region'];
      expect(newCtx).toEqual({ status: ['active'] });
    });

    it('preserves locked fields on clear all', () => {
      const allConfig: CriteriaConfig = {
        fields: [regionField, lockedField],
      };
      const cleared: SelectionContext = {};
      for (const field of allConfig.fields) {
        if (field.locked && field.lockedValue !== undefined) {
          cleared[field.id] = field.lockedValue;
        }
      }
      expect(cleared).toEqual({ year: '2026' });
    });
  });
});

describe('Filter Section', () => {
  describe('Expand/collapse logic', () => {
    it('defaultOpen fields start expanded', () => {
      const expandedSections = new Set<string>();
      for (const field of config.fields) {
        if (field.barConfig?.defaultOpen) {
          expandedSections.add(field.id);
        }
      }
      expect(expandedSections.has('region')).toBe(true);
      expect(expandedSections.size).toBe(1);
    });

    it('toggle adds and removes from expanded set', () => {
      const sections = new Set<string>(['region']);
      // Collapse region
      sections.delete('region');
      expect(sections.has('region')).toBe(false);
      // Expand status
      sections.add('status');
      expect(sections.has('status')).toBe(true);
    });
  });

  describe('Count badge', () => {
    it('shows count for active multi-select', () => {
      const ctx: SelectionContext = { region: ['us', 'eu', 'asia'] };
      expect(fieldCount(regionField, ctx)).toBe(3);
    });

    it('hides count when zero', () => {
      expect(fieldCount(regionField, {})).toBe(0);
    });
  });
});

describe('Chip Select logic', () => {
  it('toggles selection on', () => {
    const current: string[] = ['active'];
    const toggle = 'pending';
    const result = current.includes(toggle)
      ? current.filter(v => v !== toggle)
      : [...current, toggle];
    expect(result).toEqual(['active', 'pending']);
  });

  it('toggles selection off', () => {
    const current: string[] = ['active', 'pending'];
    const toggle = 'active';
    const result = current.includes(toggle)
      ? current.filter(v => v !== toggle)
      : [...current, toggle];
    expect(result).toEqual(['pending']);
  });

  it('handles empty initial value', () => {
    const current: string[] = [];
    const toggle = 'active';
    const result = [...current, toggle];
    expect(result).toEqual(['active']);
  });
});

describe('Match Filter Pill', () => {
  it('cycles through states correctly', () => {
    const CYCLE: MatchFilterState[] = ['all', 'matching', 'non-matching'];
    const next = (state: MatchFilterState): MatchFilterState => {
      const idx = CYCLE.indexOf(state);
      return CYCLE[(idx + 1) % CYCLE.length];
    };

    expect(next('all')).toBe('matching');
    expect(next('matching')).toBe('non-matching');
    expect(next('non-matching')).toBe('all');
  });
});

describe('Orchestrator logic', () => {
  describe('Initialization', () => {
    it('resolves dynamic defaults', () => {
      const configWithDefaults: CriteriaConfig = {
        fields: [
          { ...regionField, defaultValue: ['us'] },
          { ...statusField, defaultValue: ['active'] },
        ],
      };
      const defaults = resolveDynamicDefaults(configWithDefaults);
      expect(defaults.region).toEqual(['us']);
      expect(defaults.status).toEqual(['active']);
    });

    it('initialState overrides defaults', () => {
      const defaults = resolveDynamicDefaults(config);
      const initialState: SelectionContext = { region: ['eu'] };
      const merged = { ...defaults, ...initialState };
      expect(merged.region).toEqual(['eu']);
    });
  });

  describe('Validation', () => {
    it('validates required fields', () => {
      const reqConfig: CriteriaConfig = {
        fields: [requiredField],
      };
      const result = validateCriteria(reqConfig, {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('country');
    });

    it('passes when required field has value', () => {
      const reqConfig: CriteriaConfig = {
        fields: [requiredField],
      };
      const result = validateCriteria(reqConfig, { country: 'us' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Format criteria value', () => {
    it('formats multi-select with option labels', () => {
      const display = formatCriteriaValue(regionField, ['us', 'eu']);
      expect(display).toContain('United States');
      expect(display).toContain('Europe');
    });

    it('formats single select with label', () => {
      const display = formatCriteriaValue(requiredField, 'us');
      expect(display).toBe('United States');
    });

    it('returns "(All)" for null value', () => {
      const display = formatCriteriaValue(regionField, null);
      expect(display).toBe('(All)');
    });
  });

  describe('FilterBarFieldConfig types', () => {
    it('accepts barConfig on SelectionFieldDef', () => {
      const field: SelectionFieldDef = {
        id: 'test',
        label: 'Test',
        type: 'multi_select',
        barConfig: {
          pinnedToBar: true,
          defaultOpen: false,
          expandable: true,
          maxVisibleItems: 10,
          enableMatchFilter: false,
        },
      };
      expect(field.barConfig?.pinnedToBar).toBe(true);
      expect(field.barConfig?.maxVisibleItems).toBe(10);
    });
  });

  describe('FilterBarBehavior types', () => {
    it('extends CriteriaBehavior with drawer settings', () => {
      const behavior: FilterBarBehavior = {
        autoApply: true,
        showResetButton: true,
        drawerWidth: 600,
        showBackdrop: false,
        animated: true,
      };
      expect(behavior.drawerWidth).toBe(600);
      expect(behavior.autoApply).toBe(true);
    });
  });
});

// --- Summary Bar Mode Tests ---

function getSummaryFields(config: CriteriaConfig): SelectionFieldDef[] {
  return config.fields.filter(f => f.barConfig?.showOnSummary);
}

function formatValue(field: SelectionFieldDef, ctx: SelectionContext): string {
  const v = ctx[field.id];
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) {
    if (v.length === 0) return '';
    if (v.length === 1) {
      const opt = field.options?.find(o => o.value === v[0]);
      return opt?.label ?? v[0];
    }
    return `${v.length} selected`;
  }
  if (typeof v === 'string') {
    if (v === '') return '';
    const opt = field.options?.find(o => o.value === v);
    return opt?.label ?? v;
  }
  return String(v);
}

function buildSummaryText(config: CriteriaConfig, ctx: SelectionContext): string {
  const summaryFields = getSummaryFields(config);
  const parts: string[] = [];
  for (const field of summaryFields) {
    const val = formatValue(field, ctx);
    if (val) {
      parts.push(`${field.label}: ${val}`);
    }
  }
  return parts.join(' \u2022 ');
}

describe('Summary Bar Mode', () => {
  const summaryConfig: CriteriaConfig = {
    fields: [
      {
        ...regionField,
        barConfig: { pinnedToBar: true, showOnSummary: true },
      },
      {
        ...statusField,
        barConfig: { showOnSummary: true },
      },
      {
        ...departmentField,
        barConfig: { showOnSummary: false },
      },
      searchField, // no barConfig at all
    ],
  };

  describe('Summary field selection', () => {
    it('returns only fields with showOnSummary: true', () => {
      const fields = getSummaryFields(summaryConfig);
      expect(fields).toHaveLength(2);
      expect(fields[0].id).toBe('region');
      expect(fields[1].id).toBe('status');
    });

    it('excludes fields with showOnSummary: false', () => {
      const fields = getSummaryFields(summaryConfig);
      expect(fields.find(f => f.id === 'department')).toBeUndefined();
    });

    it('excludes fields without barConfig', () => {
      const fields = getSummaryFields(summaryConfig);
      expect(fields.find(f => f.id === 'search')).toBeUndefined();
    });
  });

  describe('Summary text building', () => {
    it('builds text from showOnSummary fields with active values', () => {
      const ctx: SelectionContext = { region: ['us'], status: ['active'] };
      const text = buildSummaryText(summaryConfig, ctx);
      expect(text).toBe('Region: United States \u2022 Status: Active');
    });

    it('excludes fields without active values', () => {
      const ctx: SelectionContext = { region: ['us'] };
      const text = buildSummaryText(summaryConfig, ctx);
      expect(text).toBe('Region: United States');
    });

    it('returns empty string when no filters active', () => {
      const text = buildSummaryText(summaryConfig, {});
      expect(text).toBe('');
    });

    it('ignores active values on non-summary fields', () => {
      const ctx: SelectionContext = { department: ['eng'], search: 'test' };
      const text = buildSummaryText(summaryConfig, ctx);
      expect(text).toBe('');
    });

    it('shows count for multi-value selections', () => {
      const ctx: SelectionContext = { region: ['us', 'eu', 'asia'] };
      const text = buildSummaryText(summaryConfig, ctx);
      expect(text).toBe('Region: 3 selected');
    });
  });

  describe('Summary placeholder', () => {
    it('uses default placeholder when no summaryPlaceholder set', () => {
      const layout: FilterBarLayout = { barMode: 'summary' };
      const placeholder = layout.summaryPlaceholder ?? 'No filters applied';
      expect(placeholder).toBe('No filters applied');
    });

    it('uses custom placeholder when set', () => {
      const layout: FilterBarLayout = { barMode: 'summary', summaryPlaceholder: 'Click to filter' };
      const placeholder = layout.summaryPlaceholder ?? 'No filters applied';
      expect(placeholder).toBe('Click to filter');
    });

    it('placeholder is shown when summary text is empty', () => {
      const text = buildSummaryText(summaryConfig, {});
      const layout: FilterBarLayout = { barMode: 'summary', summaryPlaceholder: 'No active filters' };
      const displayText = text || (layout.summaryPlaceholder ?? 'No filters applied');
      expect(displayText).toBe('No active filters');
    });
  });

  describe('BarMode type', () => {
    it('accepts button mode', () => {
      const layout: FilterBarLayout = { barMode: 'button' };
      expect(layout.barMode).toBe('button');
    });

    it('accepts summary mode', () => {
      const layout: FilterBarLayout = { barMode: 'summary' };
      expect(layout.barMode).toBe('summary');
    });

    it('defaults to button when not set', () => {
      const layout: FilterBarLayout = {};
      const mode: BarMode = layout.barMode ?? 'button';
      expect(mode).toBe('button');
    });
  });
});

// --- Unified Admin: Resolved Fields Tests ---

/** Mirrors the _resolvedFields logic from phz-criteria-admin */
interface ResolvedField {
  field: SelectionFieldDef;
  definition?: FilterDefinition;
  binding?: FilterBinding;
}

function resolveFields(
  filterDefinitions: FilterDefinition[],
  filterBindings: FilterBinding[],
  criteriaConfig: CriteriaConfig,
  artId: ArtefactId | '',
): ResolvedField[] {
  const isRegistryBacked = filterDefinitions.length > 0;

  if (isRegistryBacked && filterBindings.length > 0) {
    const defMap = new Map(filterDefinitions.map(d => [d.id as string, d]));
    const brandedArtId = artId ? artId : undefined;
    return filterBindings
      .filter(b => !brandedArtId || b.artefactId === brandedArtId)
      .sort((a, b) => a.order - b.order)
      .map(binding => {
        const def = defMap.get(binding.filterDefinitionId as string);
        if (!def || def.deprecated) return null;
        const field: SelectionFieldDef = {
          id: def.id as string,
          label: binding.labelOverride ?? def.label,
          type: def.type,
          dataField: def.dataField,
          options: def.options,
          defaultValue: binding.defaultValueOverride ?? def.defaultValue,
          required: binding.requiredOverride ?? def.required,
          selectionMode: def.selectionMode,
          barConfig: binding.barConfigOverride,
        };
        return { field, definition: def, binding } as ResolvedField;
      })
      .filter((r): r is ResolvedField => r !== null);
  }

  return criteriaConfig.fields.map(field => ({ field }));
}

function getUnboundDefinitions(
  filterDefinitions: FilterDefinition[],
  filterBindings: FilterBinding[],
  artId: ArtefactId | '',
): FilterDefinition[] {
  const brandedArtId = artId ? artId : undefined;
  const boundIds = new Set(
    filterBindings
      .filter(b => !brandedArtId || b.artefactId === brandedArtId)
      .map(b => b.filterDefinitionId as string)
  );
  return filterDefinitions.filter(d => !d.deprecated && !boundIds.has(d.id as string));
}

describe('Unified Admin: Resolved Fields', () => {
  const now = Date.now();
  const artIdReport = artefactId('report:sales-report');

  const regionDef: FilterDefinition = {
    id: filterDefinitionId('region'),
    label: 'Region',
    type: 'multi_select',
    sessionBehavior: 'reset',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'eu', label: 'Europe' },
    ],
    defaultValue: ['us'],
    required: false,
    createdAt: now,
    updatedAt: now,
  };

  const statusDef: FilterDefinition = {
    id: filterDefinitionId('status'),
    label: 'Status',
    type: 'chip_group',
    sessionBehavior: 'persist',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    required: true,
    createdAt: now,
    updatedAt: now,
  };

  const deprecatedDef: FilterDefinition = {
    id: filterDefinitionId('old_filter'),
    label: 'Old Filter',
    type: 'text',
    sessionBehavior: 'reset',
    deprecated: true,
    createdAt: now,
    updatedAt: now,
  };

  const regionBinding: FilterBinding = {
    filterDefinitionId: filterDefinitionId('region'),
    artefactId: artIdReport,
    visible: true,
    order: 0,
    labelOverride: 'Sales Region',
    defaultValueOverride: ['eu'],
  };

  const statusBinding: FilterBinding = {
    filterDefinitionId: filterDefinitionId('status'),
    artefactId: artIdReport,
    visible: true,
    order: 1,
    requiredOverride: false,
  };

  describe('Registry-backed resolution', () => {
    it('resolves fields from definitions + bindings', () => {
      const resolved = resolveFields(
        [regionDef, statusDef],
        [regionBinding, statusBinding],
        { fields: [] },
        artIdReport,
      );
      expect(resolved).toHaveLength(2);
      expect(resolved[0].field.id).toBe('region');
      expect(resolved[1].field.id).toBe('status');
    });

    it('applies label override from binding', () => {
      const resolved = resolveFields(
        [regionDef],
        [regionBinding],
        { fields: [] },
        artIdReport,
      );
      expect(resolved[0].field.label).toBe('Sales Region');
    });

    it('applies default value override from binding', () => {
      const resolved = resolveFields(
        [regionDef],
        [regionBinding],
        { fields: [] },
        artIdReport,
      );
      expect(resolved[0].field.defaultValue).toEqual(['eu']);
    });

    it('applies required override from binding', () => {
      const resolved = resolveFields(
        [statusDef],
        [statusBinding],
        { fields: [] },
        artIdReport,
      );
      // statusDef.required=true, binding.requiredOverride=false → should be false
      expect(resolved[0].field.required).toBe(false);
    });

    it('preserves definition as read-only reference', () => {
      const resolved = resolveFields(
        [regionDef],
        [regionBinding],
        { fields: [] },
        artIdReport,
      );
      expect(resolved[0].definition).toBe(regionDef);
      expect(resolved[0].binding).toBe(regionBinding);
    });

    it('skips deprecated definitions', () => {
      const deprecatedBinding: FilterBinding = {
        filterDefinitionId: filterDefinitionId('old_filter'),
        artefactId: artIdReport,
        visible: true,
        order: 2,
      };
      const resolved = resolveFields(
        [regionDef, deprecatedDef],
        [regionBinding, deprecatedBinding],
        { fields: [] },
        artIdReport,
      );
      expect(resolved).toHaveLength(1);
      expect(resolved[0].field.id).toBe('region');
    });

    it('sorts by binding order', () => {
      const reversed: FilterBinding[] = [
        { ...statusBinding, order: 0 },
        { ...regionBinding, order: 1 },
      ];
      const resolved = resolveFields(
        [regionDef, statusDef],
        reversed,
        { fields: [] },
        artIdReport,
      );
      expect(resolved[0].field.id).toBe('status');
      expect(resolved[1].field.id).toBe('region');
    });

    it('filters by artefact ID when provided', () => {
      const otherArt = artefactId('report:other');
      const otherBinding: FilterBinding = {
        filterDefinitionId: filterDefinitionId('status'),
        artefactId: otherArt,
        visible: true,
        order: 0,
      };
      const resolved = resolveFields(
        [regionDef, statusDef],
        [regionBinding, otherBinding],
        { fields: [] },
        artIdReport,
      );
      expect(resolved).toHaveLength(1);
      expect(resolved[0].field.id).toBe('region');
    });
  });

  describe('Legacy fallback resolution', () => {
    it('returns legacy fields when no definitions provided', () => {
      const legacyConfig: CriteriaConfig = {
        fields: [regionField, statusField],
      };
      const resolved = resolveFields([], [], legacyConfig, '');
      expect(resolved).toHaveLength(2);
      expect(resolved[0].field).toBe(regionField);
      expect(resolved[1].field).toBe(statusField);
      expect(resolved[0].definition).toBeUndefined();
      expect(resolved[0].binding).toBeUndefined();
    });

    it('wraps each legacy field without definition or binding', () => {
      const legacyConfig: CriteriaConfig = {
        fields: [searchField],
      };
      const resolved = resolveFields([], [], legacyConfig, '');
      expect(resolved).toHaveLength(1);
      expect(resolved[0].field.id).toBe('search');
      expect(resolved[0].definition).toBeUndefined();
    });
  });

  describe('Unbound definitions', () => {
    it('returns definitions not yet bound', () => {
      const unbound = getUnboundDefinitions(
        [regionDef, statusDef],
        [regionBinding],
        artIdReport,
      );
      expect(unbound).toHaveLength(1);
      expect(unbound[0].id).toBe(filterDefinitionId('status'));
    });

    it('returns all definitions when nothing is bound', () => {
      const unbound = getUnboundDefinitions(
        [regionDef, statusDef],
        [],
        artIdReport,
      );
      expect(unbound).toHaveLength(2);
    });

    it('excludes deprecated definitions', () => {
      const unbound = getUnboundDefinitions(
        [regionDef, deprecatedDef],
        [],
        artIdReport,
      );
      expect(unbound).toHaveLength(1);
      expect(unbound[0].id).toBe(filterDefinitionId('region'));
    });

    it('returns empty when all are bound', () => {
      const unbound = getUnboundDefinitions(
        [regionDef, statusDef],
        [regionBinding, statusBinding],
        artIdReport,
      );
      expect(unbound).toHaveLength(0);
    });

    it('only considers bindings for the given artefact', () => {
      const otherArt = artefactId('report:other');
      const otherBinding: FilterBinding = {
        filterDefinitionId: filterDefinitionId('status'),
        artefactId: otherArt,
        visible: true,
        order: 0,
      };
      const unbound = getUnboundDefinitions(
        [regionDef, statusDef],
        [regionBinding, otherBinding],
        artIdReport,
      );
      // status is bound to 'other', not to artIdReport → unbound for artIdReport
      expect(unbound).toHaveLength(1);
      expect(unbound[0].id).toBe(filterDefinitionId('status'));
    });
  });
});
