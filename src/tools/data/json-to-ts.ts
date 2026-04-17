import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function toInterfaceName(key: string): string {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-](.)/g, (_, c) => c.toUpperCase());
  return pascal || 'Root';
}

function generateInterfaces(
  value: unknown,
  name: string,
  interfaces: Map<string, string>
): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    const itemType = generateInterfaces(value[0], name + 'Item', interfaces);
    return `${itemType}[]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return 'Record<string, unknown>';

    const interfaceName = toInterfaceName(name);
    const lines: string[] = [`interface ${interfaceName} {`];

    for (const [key, val] of entries) {
      const fieldName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
      const fieldType = generateInterfaces(val, key, interfaces);
      const optional = val === null || val === undefined ? '?' : '';
      lines.push(`  ${fieldName}${optional}: ${fieldType};`);
    }
    lines.push('}');

    interfaces.set(interfaceName, lines.join('\n'));
    return interfaceName;
  }
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'number' : 'number';
  }
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

const tool: Tool = {
  id: 'json-to-ts',
  name: 'JSON to TypeScript',
  description: 'Generate TypeScript interfaces from a JSON sample. Handles nested objects, arrays, and optional fields.',
  category: 'data',
  tags: ['json', 'typescript', 'interface', 'type', 'generate', 'convert', 'data'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Sample',
      type: 'textarea',
      placeholder: 'Paste your JSON sample here...',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'rootName',
      label: 'Root Interface Name',
      type: 'text',
      default: 'Root',
      placeholder: 'Root',
    },
    {
      id: 'exportKeyword',
      label: 'Export interfaces',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const raw = inputs.json as string;
    const rootName = (options.rootName as string) || 'Root';
    const exportKw = options.exportKeyword as boolean;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Parse error: ${msg}` };
    }

    const interfaces = new Map<string, string>();
    generateInterfaces(parsed, rootName, interfaces);

    const prefix = exportKw ? 'export ' : '';
    const output = Array.from(interfaces.values())
      .reverse()
      .map(iface => prefix + iface)
      .join('\n\n');

    return { type: 'text', data: output };
  },
};

registry.register(tool);
export default tool;
