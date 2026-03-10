/**
 * @phozart/phz-workspace/criteria-admin — Admin components for criteria configuration
 */

// Designer + Configurator (primary admin components)
export { PhzFilterDesigner } from './phz-filter-designer.js';
export { PhzFilterConfigurator } from './phz-filter-configurator.js';

// Rule management
export { PhzRuleAdmin } from './phz-rule-admin.js';
export { PhzRuleEditorModal, type RuleEditorMode } from './phz-rule-editor-modal.js';

// Preset management
export {
  PhzPresetAdmin,
  defToFieldDef,
  formatPresetValuePreview,
  isFilterTypeCompatible,
  buildFilterPresetContextItems,
  resolveDefinitionOptions,
} from './phz-preset-admin.js';

// Legacy (deprecated)
/** @deprecated Use PhzFilterDesigner instead */
export { PhzCriteriaAdmin } from './phz-criteria-admin.js';
/** @deprecated Use PhzFilterDesigner + PhzFilterConfigurator instead */
export { PhzFilterDefinitionAdmin } from './phz-filter-definition-admin.js';
