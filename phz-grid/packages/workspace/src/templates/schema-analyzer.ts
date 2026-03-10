/**
 * @phozart/phz-workspace — Schema Analyzer
 *
 * Analyzes a DataSourceSchema and produces a FieldProfile describing
 * the data's characteristics for template matching and auto-binding.
 */

import type { DataSourceSchema, FieldMetadata } from '../data-adapter.js';

export interface FieldProfile {
  numericFields: string[];
  categoricalFields: string[];
  dateFields: string[];
  identifierFields: string[];
  suggestedMeasures: string[];
  suggestedDimensions: string[];
  hasTimeSeries: boolean;
  hasCategorical: boolean;
  hasMultipleMeasures: boolean;
}

const MEASURE_NAME_PATTERNS = [
  /revenue/i, /cost/i, /amount/i, /total/i, /count/i, /price/i,
  /profit/i, /margin/i, /sum/i, /avg/i, /sales/i, /quantity/i,
  /budget/i, /spend/i, /rate/i, /score/i, /value/i,
];

function isMeasureByName(name: string): boolean {
  return MEASURE_NAME_PATTERNS.some(p => p.test(name));
}

function isMeasureField(field: FieldMetadata): boolean {
  if (field.semanticHint === 'measure' || field.semanticHint === 'currency' || field.semanticHint === 'percentage') return true;
  if (field.dataType === 'number' && isMeasureByName(field.name)) return true;
  return false;
}

function isDimensionField(field: FieldMetadata): boolean {
  if (field.semanticHint === 'dimension' || field.semanticHint === 'category') return true;
  if (field.dataType === 'string' && (field.cardinality === 'low' || field.cardinality === 'medium')) return true;
  return false;
}

export function analyzeSchema(schema: DataSourceSchema): FieldProfile {
  const numericFields: string[] = [];
  const categoricalFields: string[] = [];
  const dateFields: string[] = [];
  const identifierFields: string[] = [];
  const suggestedMeasures: string[] = [];
  const suggestedDimensions: string[] = [];

  for (const field of schema.fields) {
    if (field.dataType === 'number') numericFields.push(field.name);
    if (field.dataType === 'date') dateFields.push(field.name);

    if (field.semanticHint === 'identifier') {
      identifierFields.push(field.name);
    } else if (field.dataType === 'string' && field.cardinality !== 'high') {
      categoricalFields.push(field.name);
    }

    if (isMeasureField(field)) {
      suggestedMeasures.push(field.name);
    }
    if (isDimensionField(field)) {
      suggestedDimensions.push(field.name);
    }
  }

  return {
    numericFields,
    categoricalFields,
    dateFields,
    identifierFields,
    suggestedMeasures,
    suggestedDimensions,
    hasTimeSeries: dateFields.length > 0,
    hasCategorical: categoricalFields.length > 0,
    hasMultipleMeasures: suggestedMeasures.length > 1,
  };
}
