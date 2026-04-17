import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'markdown-to-html',
  name: 'Markdown to HTML',
  description: 'Convert Markdown to HTML. Shows both HTML source and rendered preview.',
  category: 'data',
  tags: ['markdown', 'html', 'convert', 'md', 'preview', 'render', 'data'],
  inputs: [
    {
      id: 'markdown',
      label: 'Markdown Input',
      type: 'textarea',
      placeholder: '# Hello World\n\nThis is **bold** and _italic_.',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'output',
      label: 'Output Mode',
      type: 'select',
      default: 'preview',
      options: [
        { label: 'Rendered Preview', value: 'preview' },
        { label: 'HTML Source', value: 'source' },
      ],
    },
    {
      id: 'gfm',
      label: 'GitHub Flavored Markdown',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'breaks',
      label: 'Line breaks as <br>',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'html' },
  apiSupported: true,
  async run(inputs, options) {
    const md = inputs.markdown as string;
    const outputMode = options.output as string;
    const gfm = options.gfm as boolean;
    const breaks = options.breaks as boolean;

    const { marked } = await import('marked');
    marked.setOptions({ gfm, breaks });
    const htmlContent = await marked(md);

    if (outputMode === 'source') {
      return { type: 'text', data: htmlContent };
    }

    // Rendered preview
    const preview = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
       line-height: 1.6; color: #24292e; max-width: 860px; margin: 0 auto; padding: 16px; }
h1,h2,h3,h4,h5,h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
code { background: #f6f8fa; border-radius: 3px; font-size: 85%; padding: .2em .4em; font-family: monospace; }
pre { background: #f6f8fa; border-radius: 6px; padding: 16px; overflow: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: .25em solid #dfe2e5; color: #6a737d; margin: 0; padding: 0 1em; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
th { background: #f6f8fa; font-weight: 600; }
tr:nth-child(even) { background: #f6f8fa; }
a { color: #0366d6; text-decoration: none; }
a:hover { text-decoration: underline; }
img { max-width: 100%; }
hr { border: none; border-top: 1px solid #eaecef; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

    return { type: 'html', data: preview };
  },
};

registry.register(tool);
export default tool;
