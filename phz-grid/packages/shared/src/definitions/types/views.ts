/**
 * Definition Views — saved named views stored in the definition.
 */

export interface DefinitionSavedView {
  id: string;
  name: string;
  isDefault?: boolean;
  state: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ViewCollection {
  views: DefinitionSavedView[];
  defaultViewId?: string;
}
