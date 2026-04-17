import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function formatXml(xml: string, indent: string): string {
  // Remove existing formatting
  const cleaned = xml.replace(/>\s+</g, '><').trim();
  let result = '';
  let depth = 0;
  let i = 0;

  while (i < cleaned.length) {
    if (cleaned[i] === '<') {
      const end = cleaned.indexOf('>', i);
      if (end === -1) break;
      const tag = cleaned.slice(i, end + 1);
      i = end + 1;

      if (tag.startsWith('</')) {
        // Closing tag
        depth--;
        result += indent.repeat(depth) + tag + '\n';
      } else if (tag.endsWith('/>') || tag.startsWith('<?') || tag.startsWith('<!')) {
        // Self-closing, processing instruction, or declaration
        result += indent.repeat(depth) + tag + '\n';
      } else {
        // Opening tag — check if there's inline content before next tag
        const nextLt = cleaned.indexOf('<', i);
        if (nextLt === -1) {
          result += indent.repeat(depth) + tag + '\n';
          depth++;
        } else {
          const between = cleaned.slice(i, nextLt);
          if (between.trim()) {
            // Has inline text content
            const closingStart = cleaned.indexOf('</', nextLt);
            const closingEnd = cleaned.indexOf('>', closingStart);
            if (closingStart === nextLt && closingEnd !== -1) {
              const closingTag = cleaned.slice(nextLt, closingEnd + 1);
              result += indent.repeat(depth) + tag + between + closingTag + '\n';
              i = closingEnd + 1;
            } else {
              result += indent.repeat(depth) + tag + '\n';
              depth++;
            }
          } else {
            result += indent.repeat(depth) + tag + '\n';
            depth++;
          }
        }
      }
    } else {
      // Text content outside tags (skip whitespace-only)
      const nextLt = cleaned.indexOf('<', i);
      const text = nextLt === -1 ? cleaned.slice(i) : cleaned.slice(i, nextLt);
      if (text.trim()) {
        result += indent.repeat(depth) + text.trim() + '\n';
      }
      i = nextLt === -1 ? cleaned.length : nextLt;
    }
  }

  return result.trimEnd();
}

const tool: Tool = {
  id: 'xml-format',
  name: 'XML Format / Minify',
  description: 'Format or minify XML with proper indentation.',
  category: 'data',
  tags: ['xml', 'format', 'pretty', 'minify', 'beautify', 'indent', 'data'],
  inputs: [
    {
      id: 'xml',
      label: 'XML Input',
      type: 'textarea',
      placeholder: 'Paste XML here...',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'pretty',
      options: [
        { label: 'Pretty (format)', value: 'pretty' },
        { label: 'Minify', value: 'minify' },
      ],
    },
    {
      id: 'indent',
      label: 'Indentation',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
        { label: 'Tab', value: 'tab' },
      ],
      showWhen: { optionId: 'mode', value: 'pretty' },
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const raw = inputs.xml as string;
    const mode = options.mode as string;
    const indentOpt = options.indent as string;

    if (mode === 'minify') {
      const minified = raw.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
      return { type: 'text', data: minified, summary: 'Minified' };
    }

    const indentStr = indentOpt === 'tab' ? '\t' : ' '.repeat(parseInt(indentOpt, 10));
    try {
      const formatted = formatXml(raw, indentStr);
      return { type: 'text', data: formatted };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Format error: ${msg}` };
    }
  },
};

registry.register(tool);
export default tool;
