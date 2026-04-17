import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

function generatePalette(baseHex: string, harmony: string, count: number): string[] {
  const [h, s, l] = hexToHsl(baseHex);

  switch (harmony) {
    case 'complementary':
      return [baseHex, hslToHex(h + 180, s, l)];

    case 'triadic':
      return [
        baseHex,
        hslToHex(h + 120, s, l),
        hslToHex(h + 240, s, l),
      ];

    case 'tetradic':
      return [
        baseHex,
        hslToHex(h + 90, s, l),
        hslToHex(h + 180, s, l),
        hslToHex(h + 270, s, l),
      ];

    case 'analogous':
      return [
        hslToHex(h - 30, s, l),
        hslToHex(h - 15, s, l),
        baseHex,
        hslToHex(h + 15, s, l),
        hslToHex(h + 30, s, l),
      ];

    case 'split-complementary':
      return [
        baseHex,
        hslToHex(h + 150, s, l),
        hslToHex(h + 210, s, l),
      ];

    case 'monochromatic': {
      const clamp = (n: number) => Math.max(10, Math.min(90, n));
      const step = 60 / (count - 1);
      return Array.from({ length: count }, (_, i) =>
        hslToHex(h, s, clamp(l - 30 + i * step))
      );
    }

    default:
      return [baseHex];
  }
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const tool: Tool = {
  id: 'color-palette',
  name: 'Color Palette',
  description: 'Generate color palettes (complementary, triadic, analogous, monochromatic) from a base color using HSL math',
  category: 'misc',
  tags: ['color', 'palette', 'complementary', 'triadic', 'analogous', 'monochromatic', 'hsl', 'hex', 'design'],
  inputs: [
    {
      id: 'baseColor',
      label: 'Base Color (HEX)',
      type: 'text',
      placeholder: '#3b82f6',
    },
  ],
  options: [
    {
      id: 'harmony',
      label: 'Harmony',
      type: 'select',
      default: 'complementary',
      options: [
        { label: 'Complementary (2 colors)', value: 'complementary' },
        { label: 'Triadic (3 colors)', value: 'triadic' },
        { label: 'Tetradic (4 colors)', value: 'tetradic' },
        { label: 'Analogous (5 colors)', value: 'analogous' },
        { label: 'Split-complementary (3 colors)', value: 'split-complementary' },
        { label: 'Monochromatic (variable)', value: 'monochromatic' },
      ],
    },
    {
      id: 'monoCount',
      label: 'Count (monochromatic only)',
      type: 'range',
      default: 5,
      min: 3,
      max: 10,
      step: 1,
      showWhen: { optionId: 'harmony', value: 'monochromatic' },
    },
  ],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs, options) {
    let baseHex = (inputs.baseColor as string).trim();
    if (!baseHex.startsWith('#')) baseHex = '#' + baseHex;
    if (!/^#[0-9A-Fa-f]{6}$/.test(baseHex)) throw new Error('Please enter a valid 6-digit hex color (e.g. #3b82f6)');

    const harmony = options.harmony as string;
    const monoCount = options.monoCount as number;

    const colors = generatePalette(baseHex, harmony, monoCount);
    const [bh, bs, bl] = hexToHsl(baseHex);

    const swatches = colors.map(hex => {
      const textColor = luminance(hex) > 0.5 ? '#212529' : '#ffffff';
      const [h, s, l] = hexToHsl(hex);
      return `
<div class="color-swatch" style="background:${hex};color:${textColor}"
     onclick="navigator.clipboard.writeText('${hex}')"
     title="Click to copy ${hex}">
  <div class="color-swatch-label">${hex.toUpperCase()}</div>
  <div class="color-swatch-label" style="font-size:0.65rem">${hexToRgb(hex)}</div>
  <div class="color-swatch-label" style="font-size:0.65rem">hsl(${h},${s}%,${l}%)</div>
</div>`;
    }).join('\n');

    const html = `
<style>
.palette-container { padding: 16px; }
.palette-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.color-swatch {
  min-width: 110px; min-height: 90px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.12);
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding: 4px; cursor: pointer; transition: transform 150ms, box-shadow 150ms;
}
.color-swatch:hover { transform: translateY(-3px); box-shadow: 0 6px 12px rgba(0,0,0,0.18); }
.color-swatch-label {
  font-size: 0.72rem; font-family: monospace;
  background: rgba(255,255,255,0.9); border-radius: 3px; padding: 1px 4px; margin-top: 2px;
  color: #212529;
}
.palette-info { font-size: 0.8rem; color: #6c757d; margin-top: 8px; }
</style>
<div class="palette-container">
  <p style="font-size:0.85rem;margin-bottom:12px">
    Base: <strong>${baseHex.toUpperCase()}</strong> — hsl(${bh}, ${bs}%, ${bl}%) — Harmony: <strong>${harmony}</strong>
    &nbsp; Click any swatch to copy its HEX value.
  </p>
  <div class="palette-row">${swatches}</div>
</div>`;

    return { type: 'html', data: html, summary: `${colors.length} colors generated (${harmony})` };
  },
};

registry.register(tool);
export default tool;
