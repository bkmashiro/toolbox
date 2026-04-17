import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

type JsonSchema = {
  $schema?: string;
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  anyOf?: JsonSchema[];
};

function inferSchema(value: unknown): JsonSchema {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} };
    // Merge schemas for array items
    const itemSchemas = value.map(inferSchema);
    const merged = mergeSchemas(itemSchemas);
    return { type: 'array', items: merged };
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      properties[key] = inferSchema(val);
      required.push(key);
    }
    const schema: JsonSchema = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }
  if (typeof value === 'string') return { type: 'string' };
  if (typeof value === 'number') return { type: 'number' };
  if (typeof value === 'boolean') return { type: 'boolean' };
  return {};
}

function mergeSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];

  const types = new Set(schemas.map(s => s.type));
  if (types.size === 1) {
    const type = schemas[0].type;
    if (type === 'object') {
      // Merge object properties
      const allKeys = new Set<string>();
      for (const s of schemas) {
        for (const key of Object.keys(s.properties ?? {})) {
          allKeys.add(key);
        }
      }
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const key of allKeys) {
        const subSchemas = schemas
          .filter(s => s.properties?.[key] !== undefined)
          .map(s => s.properties![key]);
        properties[key] = mergeSchemas(subSchemas);
        // Only required if present in all samples
        if (schemas.every(s => s.properties?.[key] !== undefined)) {
          required.push(key);
        }
      }
      const merged: JsonSchema = { type: 'object', properties };
      if (required.length > 0) merged.required = required;
      return merged;
    }
    if (type === 'array') {
      const itemSchemas = schemas.map(s => s.items ?? {});
      return { type: 'array', items: mergeSchemas(itemSchemas) };
    }
    return schemas[0];
  }
  // Multiple types: anyOf
  return { anyOf: schemas };
}

const tool: Tool = {
  id: 'json-schema',
  name: 'JSON Schema Generator',
  description: 'Generate a JSON Schema (draft-07) from a JSON sample, inferring types and required fields.',
  category: 'data',
  tags: ['json', 'schema', 'draft-07', 'generate', 'infer', 'validate', 'data'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Sample',
      type: 'textarea',
      placeholder: 'Paste your JSON sample here...',
      rows: 12,
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs) {
    const raw = inputs.json as string;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferSchema(parsed),
    };

    return {
      type: 'text',
      data: JSON.stringify(schema, null, 2),
    };
  },
};

registry.register(tool);
export default tool;
