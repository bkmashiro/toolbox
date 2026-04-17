import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'hex-encode',
  name: 'Hex Encode',
  description: 'Convert text to/from hexadecimal (UTF-8 byte encoding)',
  category: 'developer',
  tags: ['hex', 'encode', 'decode', 'hexadecimal', 'bytes', 'utf8', 'developer'],
  inputs: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      placeholder: 'Enter text or hex...',
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
        { label: 'Text → Hex', value: 'encode' },
        { label: 'Hex → Text', value: 'decode' },
      ],
    },
    {
      id: 'separator',
      label: 'Separator',
      type: 'select',
      default: 'space',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Space', value: 'space' },
        { label: 'Colon (:)', value: 'colon' },
      ],
      showWhen: { optionId: 'mode', value: 'encode' },
    },
    {
      id: 'uppercase',
      label: 'Uppercase',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const text = (inputs.text as string) ?? '';
    const mode = options.mode as string;
    const separator = options.separator as string;
    const uppercase = options.uppercase as boolean;

    if (mode === 'encode') {
      const bytes = new TextEncoder().encode(text);
      const sep = separator === 'space' ? ' ' : separator === 'colon' ? ':' : '';
      let hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(sep);
      if (uppercase) hex = hex.toUpperCase();
      return { type: 'text', data: hex };
    } else {
      const clean = text.replace(/[:\s]/g, '');
      if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Invalid hex characters');
      if (clean.length % 2 !== 0) throw new Error('Hex string must have even number of characters');
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
      }
      const result = new TextDecoder().decode(bytes);
      return { type: 'text', data: result };
    }
  },
};

registry.register(tool);
export default tool;
