import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(r: number, g: number, b: number): number {
  return [r, g, b].reduce((sum, c, i) => {
    const s = c / 255;
    return sum + (s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)) * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

function ratio(l1: number, l2: number): number {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const tool: Tool = {
  id: 'wcag-contrast',
  name: 'WCAG Contrast Checker',
  description: 'Check color contrast ratio against WCAG AA and AAA accessibility standards',
  category: 'developer',
  tags: ['wcag', 'contrast', 'accessibility', 'a11y', 'color', 'design', 'developer'],
  inputs: [
    {
      id: 'fg',
      label: 'Foreground Color',
      type: 'text',
      placeholder: '#000000 or rgb(0, 0, 0)',
    },
    {
      id: 'bg',
      label: 'Background Color',
      type: 'text',
      placeholder: '#ffffff or rgb(255, 255, 255)',
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs) {
    const fgInput = (inputs.fg as string ?? '').trim();
    const bgInput = (inputs.bg as string ?? '').trim();
    if (!fgInput) throw new Error('Foreground color is required');
    if (!bgInput) throw new Error('Background color is required');

    const [fr, fg2, fb] = parseHex(fgInput);
    const [br, bg2, bb] = parseHex(bgInput);
    const r = ratio(luminance(fr, fg2, fb), luminance(br, bg2, bb));

    const lines = [
      `Contrast Ratio: ${r.toFixed(2)}:1`,
      `Normal text   — AA: ${r >= 4.5 ? 'PASS' : 'FAIL'} | AAA: ${r >= 7 ? 'PASS' : 'FAIL'}`,
      `Large text    — AA: ${r >= 3 ? 'PASS' : 'FAIL'} | AAA: ${r >= 4.5 ? 'PASS' : 'FAIL'}`,
      `UI components — AA: ${r >= 3 ? 'PASS' : 'FAIL'}`,
    ];
    return { type: 'text', data: lines.join('\n') };
  },
};

registry.register(tool);
export default tool;
