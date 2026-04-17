import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'base64-to-image',
  name: 'Base64 to Image',
  description: 'Convert a base64 data URL or raw base64 string to a downloadable image',
  category: 'image',
  tags: ['image', 'base64', 'data url', 'decode', 'convert'],
  inputs: [
    {
      id: 'base64',
      label: 'Base64 Data URL or raw base64 string',
      type: 'textarea',
      placeholder: 'Paste base64 string or data:image/...;base64,... here',
      rows: 6,
    },
  ],
  options: [
    {
      id: 'format',
      label: 'Output Format (used when no data URL MIME provided)',
      type: 'select',
      default: 'png',
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WebP', value: 'webp' },
        { label: 'GIF', value: 'gif' },
      ],
    },
  ],
  output: {
    type: 'file',
    defaultMimeType: 'image/png',
  },
  apiSupported: true,

  async run(inputs, options) {
    const raw = (inputs['base64'] as string).trim();
    const fallbackFormat = options['format'] as string;

    let mime = `image/${fallbackFormat}`;
    let b64 = raw;

    const dataUrlMatch = raw.match(/^data:([^;]+);base64,(.+)$/s);
    if (dataUrlMatch) {
      mime = dataUrlMatch[1];
      b64 = dataUrlMatch[2];
    }

    // Decode base64 to binary
    let binaryStr: string;
    try {
      binaryStr = atob(b64.replace(/\s/g, ''));
    } catch {
      throw new Error('Invalid base64 string');
    }

    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mime });
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

    return {
      type: 'file',
      data: blob,
      filename: `image.${ext}`,
      mimeType: mime,
      summary: `Decoded ${(bytes.byteLength / 1024).toFixed(1)} KB ${mime} image`,
    };
  },
};

registry.register(tool);
export default tool;
