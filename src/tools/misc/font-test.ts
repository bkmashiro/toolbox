import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const SYSTEM_FONTS = [
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'Arial, Helvetica, sans-serif',
  '"Times New Roman", Times, serif',
  'Georgia, "Times New Roman", serif',
  '"Courier New", Courier, monospace',
  '"Lucida Console", Monaco, monospace',
  'Verdana, Geneva, sans-serif',
  'Trebuchet MS, Helvetica, sans-serif',
  '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  '"Comic Sans MS", cursive',
  'Impact, Charcoal, sans-serif',
  '"Gill Sans", "Gill Sans MT", sans-serif',
  'Tahoma, Geneva, sans-serif',
  '"Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
  '"Noto Sans", sans-serif',
  '"Noto Serif", serif',
  'system-ui, sans-serif',
  'monospace',
  'serif',
  'sans-serif',
  'cursive',
  'fantasy',
];

const tool: Tool = {
  id: 'font-test',
  name: 'Font Tester',
  description: 'Preview system fonts and custom CSS fonts with custom text, sizes, and weights',
  category: 'misc',
  tags: ['font', 'preview', 'test', 'typography', 'system', 'css', 'typeface'],
  inputs: [],
  options: [
    {
      id: 'fontFamily',
      label: 'Font Family',
      type: 'select',
      default: SYSTEM_FONTS[0],
      options: SYSTEM_FONTS.map(f => ({ label: f, value: f })),
    },
    {
      id: 'customFont',
      label: 'Custom CSS Font (overrides above)',
      type: 'text',
      default: '',
      placeholder: '"My Font", fallback',
    },
    {
      id: 'testText',
      label: 'Test Text',
      type: 'textarea',
      default: 'The quick brown fox jumps over the lazy dog. 0123456789 !@#$%',
      placeholder: 'Enter test text...',
      rows: 3,
    },
    {
      id: 'fontSize',
      label: 'Font Size (px)',
      type: 'range',
      default: 24,
      min: 8,
      max: 120,
      step: 2,
    },
    {
      id: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      default: '400',
      options: [
        { label: '100 (Thin)', value: '100' },
        { label: '200 (Extra Light)', value: '200' },
        { label: '300 (Light)', value: '300' },
        { label: '400 (Regular)', value: '400' },
        { label: '500 (Medium)', value: '500' },
        { label: '600 (Semi Bold)', value: '600' },
        { label: '700 (Bold)', value: '700' },
        { label: '800 (Extra Bold)', value: '800' },
        { label: '900 (Black)', value: '900' },
      ],
    },
    {
      id: 'letterSpacing',
      label: 'Letter Spacing (em)',
      type: 'range',
      default: 0,
      min: -0.1,
      max: 0.5,
      step: 0.01,
    },
    {
      id: 'lineHeight',
      label: 'Line Height',
      type: 'range',
      default: 1.5,
      min: 0.8,
      max: 3,
      step: 0.1,
    },
    {
      id: 'multiSize',
      label: 'Show all sizes (8-72px)',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs, options) {
    const customFont = (options.customFont as string).trim();
    const fontFamily = customFont || (options.fontFamily as string);
    const testText = (options.testText as string) || 'The quick brown fox jumps over the lazy dog';
    const fontSize = options.fontSize as number;
    const fontWeight = options.fontWeight as string;
    const letterSpacing = options.letterSpacing as number;
    const lineHeight = options.lineHeight as number;
    const multiSize = options.multiSize as boolean;

    const escaped = testText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let content: string;
    if (multiSize) {
      const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
      content = sizes.map(sz => `
<div style="margin-bottom:16px;">
  <div style="font-size:0.7rem;color:#868e96;margin-bottom:4px">${sz}px</div>
  <div style="font-family:${fontFamily};font-size:${sz}px;font-weight:${fontWeight};letter-spacing:${letterSpacing}em;line-height:${lineHeight}">${escaped}</div>
</div>`).join('');
    } else {
      content = `<div style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:${fontWeight};letter-spacing:${letterSpacing}em;line-height:${lineHeight}">${escaped}</div>`;
    }

    const html = `
<div style="padding:16px;">
  <div style="font-size:0.75rem;color:#868e96;margin-bottom:12px;font-family:monospace">
    font-family: ${fontFamily} | size: ${fontSize}px | weight: ${fontWeight} | letter-spacing: ${letterSpacing}em | line-height: ${lineHeight}
  </div>
  <hr style="border:none;border-top:1px solid #dee2e6;margin-bottom:16px">
  ${content}
</div>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
