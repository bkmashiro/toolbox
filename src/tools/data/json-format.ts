import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'json-format',
  name: 'JSON Format / Minify',
  description: 'Format or minify JSON with configurable indentation. Shows parse errors inline.',
  category: 'data',
  tags: ['json', 'format', 'pretty', 'minify', 'beautify', 'indent', 'lint'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Input',
      type: 'textarea',
      placeholder: 'Paste JSON here...',
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
  apiSupported: true,
  async run(inputs, options) {
    const raw = inputs.json as string;
    const mode = options.mode as string;
    const indentOpt = options.indent as string;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        type: 'text',
        data: `Parse error: ${msg}`,
        summary: 'JSON parse error',
      };
    }

    if (mode === 'minify') {
      return {
        type: 'text',
        data: JSON.stringify(parsed),
        summary: 'Minified',
      };
    }

    const indent = indentOpt === 'tab' ? '\t' : parseInt(indentOpt, 10);
    return {
      type: 'text',
      data: JSON.stringify(parsed, null, indent),
      summary: `Formatted with ${indentOpt === 'tab' ? 'tabs' : indentOpt + ' spaces'}`,
    };
  },
};

registry.register(tool);
export default tool;
