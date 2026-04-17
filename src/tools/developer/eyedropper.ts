import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'eyedropper',
  name: 'Screen Eyedropper',
  description: 'Pick any color from your screen and get HEX, RGB, and HSL values',
  category: 'developer',
  tags: ['eyedropper', 'color', 'pick', 'screen', 'hex', 'rgb', 'hsl', 'design', 'developer'],
  inputs: [],
  options: [],
  output: { type: 'text' },
  apiSupported: false,
  async run(_inputs, _options) {
    if (!('EyeDropper' in globalThis)) {
      throw new Error('EyeDropper API requires Chrome or Edge 95+. Not supported in this browser.');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ed = new (globalThis as any).EyeDropper();
    const { sRGBHex } = await ed.open() as { sRGBHex: string };
    const r = parseInt(sRGBHex.slice(1, 3), 16);
    const g = parseInt(sRGBHex.slice(3, 5), 16);
    const b = parseInt(sRGBHex.slice(5, 7), 16);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = ((gn - bn) / d) % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h = Math.round(h * 60);
    }
    if (h < 0) h += 360;
    return {
      type: 'text',
      data: `HEX: ${sRGBHex.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    };
  },
};

registry.register(tool);
export default tool;
