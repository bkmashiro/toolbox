import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { minify as terserMinify } from 'terser';
import { minify as htmlMinify } from 'html-minifier-terser';

function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

const tool: Tool = {
  id: 'code-minify',
  name: 'Code Minifier',
  description: 'Minify JavaScript, CSS, or HTML to reduce file size',
  category: 'developer',
  tags: ['minify', 'minifier', 'compress', 'js', 'css', 'html', 'optimize', 'developer'],
  inputs: [
    {
      id: 'code',
      label: 'Source Code',
      type: 'textarea',
      placeholder: 'Paste your JS, CSS, or HTML here...',
      rows: 10,
    },
  ],
  options: [
    {
      id: 'type',
      label: 'Language',
      type: 'select',
      default: 'js',
      options: [
        { label: 'JavaScript', value: 'js' },
        { label: 'CSS', value: 'css' },
        { label: 'HTML', value: 'html' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const type = (options.type as string) || 'js';
    const code = inputs.code as string;
    if (!code) throw new Error('Source code is required');

    if (type === 'js') {
      const r = await terserMinify(code, { compress: true, mangle: true });
      return { type: 'text', data: r.code ?? '' };
    } else if (type === 'css') {
      return { type: 'text', data: minifyCSS(code) };
    } else {
      const r = await htmlMinify(code, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      });
      return { type: 'text', data: r };
    }
  },
};

registry.register(tool);
export default tool;
