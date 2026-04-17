import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'markdown-preview',
  name: 'Markdown Preview',
  description: 'Live Markdown editor with split-pane preview',
  category: 'developer',
  tags: ['markdown', 'preview', 'editor', 'md', 'render', 'html', 'developer'],
  inputs: [
    {
      id: 'markdown',
      label: 'Markdown',
      type: 'textarea',
      placeholder: '# Hello World\n\nWrite your **markdown** here...',
      rows: 16,
    },
  ],
  options: [
    {
      id: 'sanitize',
      label: 'Sanitize HTML',
      type: 'checkbox',
      default: true,
      helpText: 'Remove potentially dangerous HTML from the output',
    },
    {
      id: 'gfm',
      label: 'GitHub Flavored Markdown',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs, options) {
    const { marked } = await import('marked');
    const md = (inputs.markdown as string) ?? '';
    const gfm = options.gfm as boolean;

    marked.setOptions({ gfm });

    let rendered = await marked.parse(md);

    if (options.sanitize) {
      // Basic sanitization — remove script tags and on* attributes
      rendered = rendered
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+on\w+="[^"]*"/gi, '')
        .replace(/\s+on\w+='[^']*'/gi, '');
    }

    const html = `<style>
      body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#212529; max-width:100%; padding:16px; margin:0; box-sizing:border-box; }
      h1,h2,h3,h4,h5,h6 { font-weight:700; margin-top:1.5em; margin-bottom:0.5em; line-height:1.25; }
      h1 { font-size:2em; border-bottom:2px solid #dee2e6; padding-bottom:0.3em; }
      h2 { font-size:1.5em; border-bottom:1px solid #dee2e6; padding-bottom:0.3em; }
      code { background:#f1f3f5; padding:0.2em 0.4em; border-radius:3px; font-family:monospace; font-size:0.875em; }
      pre { background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:16px; overflow-x:auto; }
      pre code { background:none; padding:0; }
      blockquote { border-left:4px solid #228be6; margin:0; padding:0.5em 1em; background:#e7f5ff; border-radius:0 4px 4px 0; }
      table { border-collapse:collapse; width:100%; margin:1em 0; }
      th,td { border:1px solid #dee2e6; padding:8px 12px; }
      th { background:#f8f9fa; font-weight:600; }
      a { color:#228be6; }
      img { max-width:100%; }
      hr { border:none; border-top:2px solid #dee2e6; margin:2em 0; }
    </style>
    ${rendered}`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
