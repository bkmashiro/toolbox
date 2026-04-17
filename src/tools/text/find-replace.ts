import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

interface Replacement {
  find: string;
  replace: string;
}

function parseReplacements(rulesText: string): Replacement[] {
  return rulesText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      // Format: find → replace  (using → or ->)
      const sep = line.includes('→') ? '→' : '->';
      const parts = line.split(sep);
      if (parts.length < 2) return null;
      return {
        find: parts[0].trim(),
        replace: parts.slice(1).join(sep).trim(),
      };
    })
    .filter((r): r is Replacement => r !== null && r.find !== '');
}

const tool: Tool = {
  id: 'find-replace',
  name: 'Find & Replace',
  description:
    'Batch find and replace with regex support. Preview replacements before applying.',
  category: 'text',
  tags: ['find', 'replace', 'search', 'regex', 'batch', 'substitute', 'text'],
  inputs: [
    {
      id: 'text',
      label: 'Text to Process',
      type: 'textarea',
      placeholder: 'Enter text here...',
      rows: 8,
    },
    {
      id: 'rules',
      label: 'Replacement Rules (one per line)',
      type: 'textarea',
      placeholder: 'find → replace\nold text → new text\n# comment lines are ignored',
      rows: 6,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Output',
      type: 'select',
      default: 'result',
      options: [
        { label: 'Result text', value: 'result' },
        { label: 'Preview (show changes)', value: 'preview' },
      ],
    },
    {
      id: 'useRegex',
      label: 'Use regex for find patterns',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'caseSensitive',
      label: 'Case sensitive',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'wholeWord',
      label: 'Match whole word only',
      type: 'checkbox',
      default: false,
      showWhen: { optionId: 'useRegex', value: false },
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    let text = inputs.text as string;
    const rulesText = inputs.rules as string;
    const mode = options.mode as string;
    const useRegex = options.useRegex as boolean;
    const caseSensitive = options.caseSensitive as boolean;
    const wholeWord = options.wholeWord as boolean;

    const replacements = parseReplacements(rulesText);
    if (replacements.length === 0) {
      return { type: 'text', data: text, summary: 'No rules defined' };
    }

    const flags = caseSensitive ? 'g' : 'gi';
    let totalReplacements = 0;
    const previewLines: string[] = [];

    for (const { find, replace } of replacements) {
      let pattern: RegExp;
      try {
        if (useRegex) {
          pattern = new RegExp(find, flags);
        } else {
          const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordBoundary = wholeWord ? '\\b' : '';
          pattern = new RegExp(`${wordBoundary}${escaped}${wordBoundary}`, flags);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { type: 'text', data: `Invalid regex for "${find}": ${msg}` };
      }

      const matches = text.match(pattern);
      const count = matches ? matches.length : 0;
      totalReplacements += count;

      if (mode === 'preview') {
        previewLines.push(`"${find}" → "${replace}" (${count} replacement${count !== 1 ? 's' : ''})`);
      }

      text = text.replace(pattern, replace);
    }

    if (mode === 'preview') {
      return {
        type: 'text',
        data: `=== Preview ===\n${previewLines.join('\n')}\n\nTotal replacements: ${totalReplacements}\n\n=== Result ===\n${text}`,
        summary: `${totalReplacements} replacements across ${replacements.length} rules`,
      };
    }

    return {
      type: 'text',
      data: text,
      summary: `${totalReplacements} replacements`,
    };
  },
};

registry.register(tool);
export default tool;
