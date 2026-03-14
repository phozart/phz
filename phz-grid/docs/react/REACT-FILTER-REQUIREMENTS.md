# React Filter Components Requirements

> Formal requirements for filter/criteria React wrappers in `@phozart/react`.
> Traced to the underlying `<phz-selection-criteria>`, `<phz-filter-designer>`,
> `<phz-preset-admin>`, and `<phz-filter-configurator>` Web Components.

---

## 1. PhzSelectionCriteria (REQ-CRIT-*)

### REQ-CRIT-001 — Component Shape
`PhzSelectionCriteria` MUST be a `forwardRef` component exposing `CriteriaApi` via ref.

### REQ-CRIT-002 — CriteriaApi Interface
```typescript
interface CriteriaApi {
  getContext(): SelectionContext;
  setContext(ctx: SelectionContext): void;
  apply(): void;
  reset(): void;
  openDrawer(): void;
  closeDrawer(): void;
}
```

### REQ-CRIT-003 — Config Props
- `config: CriteriaConfig` (required) — field definitions, dependencies, behavior
- `data?: Record<string, unknown>[]` — sample data for option resolution
- `presets?: SelectionPreset[]` — saved presets
- `initialState?: SelectionContext` — initial field values
- `dataSources?: Record<string, any>` — runtime data source map

### REQ-CRIT-004 — Registry Mode Props
- `registryMode?: boolean`
- `filterRegistry?: any`
- `filterBindings?: any`
- `filterStateManager?: any`
- `filterRuleEngine?: any`
- `criteriaOutputManager?: any`
- `artefactId?: string`
- `resolvedFields?: any[]`

### REQ-CRIT-005 — Event Callbacks
- `onCriteriaChange` → `criteria-change`
- `onCriteriaApply` → `criteria-apply`
- `onCriteriaReset` → `criteria-reset`
- `onPinChange` → `criteria-pin-change`

### REQ-CRIT-006 — Styling Props
`className?: string`, `style?: React.CSSProperties`

---

## 2. PhzFilterDesigner (REQ-DESGN-*)

### REQ-DESGN-001 — Component Shape
`PhzFilterDesigner` MUST be a `forwardRef` component exposing `FilterDesignerApi` via ref.

### REQ-DESGN-002 — FilterDesignerApi
```typescript
interface FilterDesignerApi {
  getDefinitions(): FilterDefinition[];
  getRules(): FilterRule[];
}
```

### REQ-DESGN-003 — Props
- `definitions: FilterDefinition[]` (required)
- `rules?: FilterRule[]`
- `sharedPresets?: SelectionPreset[]`
- `userPresets?: SelectionPreset[]`
- `availableColumns?: string[]`
- `data?: Record<string, unknown>[]`
- `rulePreviewResults?: Record<string, { before: number; after: number }>`
- `dataSources?: any[]`
- `filterPresets?: any[]`

### REQ-DESGN-004 — Definition Events
- `onDefinitionCreate` → `definition-create`
- `onDefinitionUpdate` → `definition-update`
- `onDefinitionDeprecate` → `definition-deprecate`
- `onDefinitionRestore` → `definition-restore`
- `onDefinitionDuplicate` → `definition-duplicate`

### REQ-DESGN-005 — Rule Events
- `onRuleAdd` → `rule-add`
- `onRuleRemove` → `rule-remove`
- `onRuleToggle` → `rule-toggle`
- `onRuleUpdate` → `rule-update`

### REQ-DESGN-006 — Preset Events
- `onPresetCreate` → `preset-create`
- `onPresetUpdate` → `preset-update`
- `onPresetDelete` → `preset-delete`
- `onFilterPresetCreate` → `filter-preset-create`
- `onFilterPresetUpdate` → `filter-preset-update`
- `onFilterPresetDelete` → `filter-preset-delete`
- `onFilterPresetCopy` → `filter-preset-copy`

---

## 3. PhzPresetAdmin (REQ-PRESET-*)

### REQ-PRESET-001 — Component Shape
`PhzPresetAdmin` MUST be a standard component (no imperative API needed).

### REQ-PRESET-002 — Props
- `sharedPresets?: SelectionPreset[]`
- `userPresets?: SelectionPreset[]`
- `mode?: 'cross-filter' | 'per-filter'`
- `definitions?: any[]`
- `filterPresets?: any[]`
- `dataSources?: any[]`
- `data?: Record<string, unknown>[]`

### REQ-PRESET-003 — Cross-Filter Events
- `onPresetCreate` → `preset-create`
- `onPresetUpdate` → `preset-update`
- `onPresetDelete` → `preset-delete`

### REQ-PRESET-004 — Per-Filter Events
- `onFilterPresetCreate` → `filter-preset-create`
- `onFilterPresetUpdate` → `filter-preset-update`
- `onFilterPresetDelete` → `filter-preset-delete`
- `onFilterPresetCopy` → `filter-preset-copy`

---

## 4. PhzFilterConfigurator (REQ-CONFIG-*)

### REQ-CONFIG-001 — Component Shape
`PhzFilterConfigurator` MUST be a standard component (no imperative API needed).

### REQ-CONFIG-002 — Props
- `definitions: FilterDefinition[]` (required)
- `bindings?: FilterBinding[]`
- `artefactId?: string`
- `artefactName?: string`
- `availableColumns?: string[]`

### REQ-CONFIG-003 — Events
- `onBindingAdd` → `binding-add`
- `onBindingRemove` → `binding-remove`
- `onBindingUpdate` → `binding-update`
- `onBindingReorder` → `binding-reorder`
- `onOpenDesigner` → `open-designer`

---

## 5. useCriteria Hook (REQ-HOOK-CRIT-*)

### REQ-HOOK-CRIT-001 — Signature
```typescript
function useCriteria(criteriaRef: RefObject<CriteriaApi | null>): CriteriaHookResult
```

### REQ-HOOK-CRIT-002 — Return Shape
- `context: SelectionContext | null`
- `getContext(): SelectionContext | null`
- `setContext(ctx: SelectionContext): void`
- `apply(): void`
- `reset(): void`
- `openDrawer(): void`
- `closeDrawer(): void`

### REQ-HOOK-CRIT-003 — Null Safety
All actions MUST be safe when ref is null.

---

## 6. useFilterDesigner Hook (REQ-HOOK-DESGN-*)

### REQ-HOOK-DESGN-001 — Signature
```typescript
function useFilterDesigner(designerRef: RefObject<FilterDesignerApi | null>): FilterDesignerHookResult
```

### REQ-HOOK-DESGN-002 — Return Shape
- `definitions: FilterDefinition[] | null`
- `rules: FilterRule[] | null`
- `getDefinitions(): FilterDefinition[] | null`
- `getRules(): FilterRule[] | null`
