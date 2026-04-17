import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

// HTML entities
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlUnescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

// JSON string escape/unescape
function jsonEscape(s: string): string {
  return JSON.stringify(s).slice(1, -1); // Remove surrounding quotes
}

function jsonUnescape(s: string): string {
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s;
  }
}

// URL encode/decode
function urlEscape(s: string): string {
  return encodeURIComponent(s);
}

function urlUnescape(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// XML escape/unescape (subset of HTML)
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlUnescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const tool: Tool = {
  id: 'text-escape',
  name: 'Text Escape / Unescape',
  description: 'Escape or unescape HTML entities, JSON strings, URLs, and XML.',
  category: 'text',
  tags: ['escape', 'unescape', 'html', 'json', 'url', 'xml', 'encode', 'decode', 'entities', 'text'],
  inputs: [
    {
      id: 'text',
      label: 'Input',
      type: 'textarea',
      placeholder: 'Enter text to escape/unescape...',
      rows: 8,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'escape',
      options: [
        { label: 'Escape', value: 'escape' },
        { label: 'Unescape', value: 'unescape' },
      ],
    },
    {
      id: 'type',
      label: 'Type',
      type: 'select',
      default: 'html',
      options: [
        { label: 'HTML Entities', value: 'html' },
        { label: 'JSON String', value: 'json' },
        { label: 'URL (percent-encoding)', value: 'url' },
        { label: 'XML', value: 'xml' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const text = inputs.text as string;
    const mode = options.mode as string;
    const type = options.type as string;

    let result: string;

    if (mode === 'escape') {
      if (type === 'html') result = htmlEscape(text);
      else if (type === 'json') result = jsonEscape(text);
      else if (type === 'url') result = urlEscape(text);
      else if (type === 'xml') result = xmlEscape(text);
      else result = text;
    } else {
      if (type === 'html') result = htmlUnescape(text);
      else if (type === 'json') result = jsonUnescape(text);
      else if (type === 'url') result = urlUnescape(text);
      else if (type === 'xml') result = xmlUnescape(text);
      else result = text;
    }

    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
