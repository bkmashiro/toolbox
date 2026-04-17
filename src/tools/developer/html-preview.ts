import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'html-preview',
  name: 'HTML Preview',
  description: 'Paste HTML and see it rendered in a sandboxed preview',
  category: 'developer',
  tags: ['html', 'preview', 'render', 'sandbox', 'developer', 'template'],
  inputs: [
    {
      id: 'html',
      label: 'HTML',
      type: 'textarea',
      placeholder: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
      rows: 16,
    },
  ],
  options: [],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs) {
    const html = (inputs.html as string) ?? '';
    // Return the raw HTML — the framework renders it in a sandboxed iframe
    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
