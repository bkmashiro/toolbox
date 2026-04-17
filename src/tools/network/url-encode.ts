import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'url-encode',
  name: 'URL Encode',
  description: 'URL encode and decode text using encodeURIComponent or encodeURI',
  category: 'network',
  tags: ['url', 'encode', 'decode', 'percent', 'uri', 'component', 'network'],
  inputs: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      placeholder: 'Enter text to encode or decode...',
      rows: 4,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'encode',
      options: [
        { label: 'Encode', value: 'encode' },
        { label: 'Decode', value: 'decode' },
      ],
    },
    {
      id: 'component',
      label: 'Encoding Type',
      type: 'select',
      default: 'component',
      options: [
        { label: 'encodeURIComponent (most characters)', value: 'component' },
        { label: 'encodeURI (preserves :/?#[]@!$&...)', value: 'full' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const text = (inputs.text as string) ?? '';
    const mode = options.mode as string;
    const component = options.component as string;

    if (mode === 'encode') {
      const result = component === 'component' ? encodeURIComponent(text) : encodeURI(text);
      return { type: 'text', data: result };
    } else {
      let result: string;
      try {
        result = component === 'component' ? decodeURIComponent(text) : decodeURI(text);
      } catch (e) {
        throw new Error(`Decode failed: ${(e as Error).message}`);
      }
      return { type: 'text', data: result };
    }
  },
};

registry.register(tool);
export default tool;
