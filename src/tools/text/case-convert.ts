import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function tokenize(text: string): string[] {
  // Split on spaces, underscores, hyphens, camelCase boundaries
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-]+/)
    .filter(Boolean);
}

function toCamelCase(tokens: string[]): string {
  return tokens
    .map((t, i) => (i === 0 ? t.toLowerCase() : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()))
    .join('');
}

function toSnakeCase(tokens: string[]): string {
  return tokens.map(t => t.toLowerCase()).join('_');
}

function toKebabCase(tokens: string[]): string {
  return tokens.map(t => t.toLowerCase()).join('-');
}

function toPascalCase(tokens: string[]): string {
  return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join('');
}

function toUpperSnakeCase(tokens: string[]): string {
  return tokens.map(t => t.toUpperCase()).join('_');
}

function toTitleCase(tokens: string[]): string {
  return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
}

function toSentenceCase(tokens: string[]): string {
  const sentence = tokens.map(t => t.toLowerCase()).join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

const converters: Record<string, (tokens: string[]) => string> = {
  camelCase: toCamelCase,
  snake_case: toSnakeCase,
  'kebab-case': toKebabCase,
  PascalCase: toPascalCase,
  UPPER_SNAKE_CASE: toUpperSnakeCase,
  'Title Case': toTitleCase,
  'sentence case': toSentenceCase,
};

const tool: Tool = {
  id: 'case-convert',
  name: 'Case Convert',
  description:
    'Convert between camelCase, snake_case, kebab-case, PascalCase, UPPER_SNAKE_CASE, Title Case, and sentence case.',
  category: 'text',
  tags: ['case', 'camel', 'snake', 'kebab', 'pascal', 'uppercase', 'lowercase', 'title', 'convert', 'text'],
  inputs: [
    {
      id: 'text',
      label: 'Input Text',
      type: 'textarea',
      placeholder: 'Enter text to convert...',
      rows: 6,
    },
  ],
  options: [
    {
      id: 'targetCase',
      label: 'Target Case',
      type: 'select',
      default: 'camelCase',
      options: [
        { label: 'camelCase', value: 'camelCase' },
        { label: 'snake_case', value: 'snake_case' },
        { label: 'kebab-case', value: 'kebab-case' },
        { label: 'PascalCase', value: 'PascalCase' },
        { label: 'UPPER_SNAKE_CASE', value: 'UPPER_SNAKE_CASE' },
        { label: 'Title Case', value: 'Title Case' },
        { label: 'sentence case', value: 'sentence case' },
      ],
    },
    {
      id: 'perLine',
      label: 'Convert each line separately',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const text = inputs.text as string;
    const targetCase = options.targetCase as string;
    const perLine = options.perLine as boolean;
    const converter = converters[targetCase];
    if (!converter) {
      return { type: 'text', data: `Unknown case: ${targetCase}` };
    }

    const convertText = (t: string) => converter(tokenize(t));

    if (perLine) {
      const lines = text.split('\n').map(line => convertText(line));
      return { type: 'text', data: lines.join('\n') };
    }

    return { type: 'text', data: convertText(text) };
  },
};

registry.register(tool);
export default tool;
