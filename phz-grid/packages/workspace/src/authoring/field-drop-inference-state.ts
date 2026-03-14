/**
 * @phozart/workspace — Field-Drop Inference State (UX-016)
 *
 * Pure state management for drag-drop field-to-widget inference.
 * When a user drops a data field onto the dashboard canvas, this state machine
 * infers the best widget type based on the field's data type, semantic hints,
 * and cardinality.
 */

export interface FieldInput {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  semanticHint?: 'measure' | 'dimension' | 'identifier' | 'timestamp' | 'category' | 'currency' | 'percentage';
  cardinality?: 'low' | 'medium' | 'high';
}

export interface FieldDropInference {
  widgetType: string;
  variant?: string;
  rationale: string;
  confidence: number;
  dataConfig: {
    dimensions: string[];
    measures: string[];
  };
}

export interface FieldDropInferenceState {
  inferences: FieldDropInference[];
  selectedIndex: number;
  fields: FieldInput[];
}

/** Factory: empty inferences, selectedIndex=0, empty fields. */
export function createFieldDropInferenceState(): FieldDropInferenceState {
  return {
    inferences: [],
    selectedIndex: 0,
    fields: [],
  };
}

/**
 * Build the data config for a single field: numeric fields go to measures,
 * everything else goes to dimensions.
 */
function singleFieldDataConfig(field: FieldInput): { dimensions: string[]; measures: string[] } {
  if (field.dataType === 'number') {
    return { dimensions: [], measures: [field.name] };
  }
  return { dimensions: [field.name], measures: [] };
}

/** Single field inference. Produces a ranked list of widget suggestions. */
export function inferWidgetForField(state: FieldDropInferenceState, field: FieldInput): FieldDropInferenceState {
  const inferences: FieldDropInference[] = [];
  const dataConfig = singleFieldDataConfig(field);

  if (field.dataType === 'number') {
    if (field.semanticHint === 'currency') {
      inferences.push({
        widgetType: 'kpi-card',
        confidence: 0.9,
        rationale: 'Currency value — KPI card',
        dataConfig,
      });
      inferences.push({
        widgetType: 'bar-chart',
        confidence: 0.9 - 0.15,
        rationale: 'Currency value — bar chart',
        dataConfig,
      });
    } else if (field.semanticHint === 'percentage') {
      inferences.push({
        widgetType: 'gauge',
        confidence: 0.85,
        rationale: 'Percentage value — gauge display',
        dataConfig,
      });
      inferences.push({
        widgetType: 'bar-chart',
        confidence: 0.85 - 0.15,
        rationale: 'Percentage value — bar chart',
        dataConfig,
      });
    } else {
      inferences.push({
        widgetType: 'kpi-card',
        confidence: 0.8,
        rationale: 'Numeric value — KPI card',
        dataConfig,
      });
      inferences.push({
        widgetType: 'bar-chart',
        confidence: 0.8 - 0.15,
        rationale: 'Numeric value — bar chart',
        dataConfig,
      });
    }
  } else if (field.dataType === 'date') {
    inferences.push({
      widgetType: 'trend-line',
      confidence: 0.9,
      rationale: 'Date field — trend line',
      dataConfig,
    });
    inferences.push({
      widgetType: 'data-table',
      confidence: 0.9 - 0.2,
      rationale: 'Date field — data table',
      dataConfig,
    });
  } else if (field.dataType === 'string') {
    if (field.cardinality === 'low') {
      inferences.push({
        widgetType: 'pie-chart',
        confidence: 0.8,
        rationale: 'Few categories — pie chart',
        dataConfig,
      });
    } else if (field.cardinality === 'high') {
      inferences.push({
        widgetType: 'data-table',
        confidence: 0.85,
        rationale: 'Many distinct values — data table',
        dataConfig,
      });
    } else if (field.cardinality === 'medium') {
      inferences.push({
        widgetType: 'bar-chart',
        confidence: 0.8,
        rationale: 'Moderate categories — bar chart',
        dataConfig,
      });
    } else {
      inferences.push({
        widgetType: 'bar-chart',
        confidence: 0.75,
        rationale: 'Text field — bar chart',
        dataConfig,
      });
    }
  } else if (field.dataType === 'boolean') {
    inferences.push({
      widgetType: 'kpi-card',
      confidence: 0.7,
      rationale: 'Boolean field — KPI card',
      dataConfig,
    });
  }

  return {
    inferences,
    selectedIndex: 0,
    fields: [field],
  };
}

/** Multi-field inference. Produces ranked suggestions for field combinations. */
export function inferWidgetForFields(state: FieldDropInferenceState, fields: FieldInput[]): FieldDropInferenceState {
  const inferences: FieldDropInference[] = [];

  const dateFields = fields.filter(f => f.dataType === 'date');
  const numberFields = fields.filter(f => f.dataType === 'number');
  const stringFields = fields.filter(f => f.dataType === 'string');

  const dimensions = fields.filter(f => f.dataType !== 'number').map(f => f.name);
  const measures = numberFields.map(f => f.name);

  if (dateFields.length === 1 && numberFields.length === 1 && fields.length === 2) {
    // 1 date + 1 number → trend-line
    inferences.push({
      widgetType: 'trend-line',
      confidence: 0.95,
      rationale: 'Date and numeric field — trend line',
      dataConfig: {
        dimensions: [dateFields[0].name],
        measures: [numberFields[0].name],
      },
    });
  } else if (stringFields.length === 1 && numberFields.length === 1 && fields.length === 2) {
    // 1 string + 1 number → bar-chart
    inferences.push({
      widgetType: 'bar-chart',
      confidence: 0.9,
      rationale: 'Category and numeric field — bar chart',
      dataConfig: {
        dimensions: [stringFields[0].name],
        measures: [numberFields[0].name],
      },
    });
  } else if (numberFields.length >= 2 && numberFields.length === fields.length) {
    // 2+ numbers only → kpi-scorecard
    inferences.push({
      widgetType: 'kpi-scorecard',
      confidence: 0.8,
      rationale: 'Multiple numeric fields — KPI scorecard',
      dataConfig: {
        dimensions: [],
        measures,
      },
    });
  } else if (stringFields.length === 1 && numberFields.length >= 2) {
    // 1 string + 2+ numbers → bar-chart grouped
    inferences.push({
      widgetType: 'bar-chart',
      variant: 'grouped',
      confidence: 0.85,
      rationale: 'Category with multiple measures — grouped bar chart',
      dataConfig: {
        dimensions: [stringFields[0].name],
        measures,
      },
    });
  } else {
    // Fallback → data-table
    inferences.push({
      widgetType: 'data-table',
      confidence: 0.7,
      rationale: 'Mixed fields — data table',
      dataConfig: {
        dimensions,
        measures,
      },
    });
  }

  return {
    inferences,
    selectedIndex: 0,
    fields: [...fields],
  };
}

/** Set selectedIndex, clamped to valid range. */
export function selectInference(state: FieldDropInferenceState, index: number): FieldDropInferenceState {
  const maxIndex = state.inferences.length > 0 ? state.inferences.length - 1 : 0;
  const clamped = Math.max(0, Math.min(index, maxIndex));
  return { ...state, selectedIndex: clamped };
}

/** Return inference at selectedIndex, or null if empty. */
export function getSelectedInference(state: FieldDropInferenceState): FieldDropInference | null {
  if (state.inferences.length === 0) return null;
  return state.inferences[state.selectedIndex] ?? null;
}

/** Reset to empty state. */
export function clearInference(_state: FieldDropInferenceState): FieldDropInferenceState {
  return createFieldDropInferenceState();
}
