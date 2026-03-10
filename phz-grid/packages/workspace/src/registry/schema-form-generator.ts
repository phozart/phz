/**
 * @phozart/phz-workspace — Schema Form Generator
 *
 * Generates UI field descriptors from a simple JSON Schema-like object,
 * enabling dynamic form rendering for widget configuration panels.
 */

export interface FormFieldDescriptor {
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'select' | 'color' | 'array';
  label: string;
  required: boolean;
  defaultValue?: unknown;
  options?: string[];
  min?: number;
  max?: number;
}

export interface PropertyDef {
  type: string;
  label: string;
  default?: unknown;
  enum?: string[];
  format?: string;
  min?: number;
  max?: number;
  items?: { type: string };
}

export interface SimpleSchema {
  properties: Record<string, PropertyDef>;
  required?: string[];
}

function resolveFieldType(prop: PropertyDef): FormFieldDescriptor['type'] {
  if (prop.type === 'boolean') return 'checkbox';
  if (prop.type === 'number') return 'number';
  if (prop.type === 'array') return 'array';
  if (prop.type === 'string') {
    if (prop.enum?.length) return 'select';
    if (prop.format === 'color') return 'color';
    return 'text';
  }
  return 'text';
}

export function generateFormFields(schema: SimpleSchema): FormFieldDescriptor[] {
  const requiredSet = new Set(schema.required ?? []);
  const fields: FormFieldDescriptor[] = [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const field: FormFieldDescriptor = {
      name,
      type: resolveFieldType(prop),
      label: prop.label,
      required: requiredSet.has(name),
    };

    if (prop.default !== undefined) field.defaultValue = prop.default;
    if (prop.enum?.length) field.options = prop.enum;
    if (prop.min !== undefined) field.min = prop.min;
    if (prop.max !== undefined) field.max = prop.max;

    fields.push(field);
  }

  return fields;
}
