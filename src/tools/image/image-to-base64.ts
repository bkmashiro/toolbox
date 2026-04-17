import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'image-to-base64',
  name: 'Image to Base64',
  description: 'Convert an image file to a base64 data URL',
  category: 'image',
  tags: ['image', 'base64', 'data url', 'encode', 'convert', 'embed'],
  inputs: [
    {
      id: 'image',
      label: 'Image',
      type: 'file',
      accept: 'image/*',
    },
  ],
  options: [],
  output: {
    type: 'text',
  },
  apiSupported: true,

  async run(inputs) {
    const file = inputs['image'] as File;
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    const dataUrl = `data:${file.type || 'image/png'};base64,${b64}`;
    return {
      type: 'text',
      data: dataUrl,
      summary: `Base64 encoded: ${(b64.length / 1024).toFixed(1)} KB`,
    };
  },
};

registry.register(tool);
export default tool;
