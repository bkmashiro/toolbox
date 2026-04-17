import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'box-shadow',
  name: 'Box Shadow',
  description: 'Visual box-shadow builder — sliders for offsets, blur, spread, color',
  category: 'developer',
  tags: ['css', 'box-shadow', 'shadow', 'builder', 'visual', 'drop', 'developer'],
  inputs: [],
  options: [
    {
      id: 'inset',
      label: 'Inset',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'x',
      label: 'X Offset (px)',
      type: 'range',
      default: 5,
      min: -100,
      max: 100,
      step: 1,
    },
    {
      id: 'y',
      label: 'Y Offset (px)',
      type: 'range',
      default: 5,
      min: -100,
      max: 100,
      step: 1,
    },
    {
      id: 'blur',
      label: 'Blur Radius (px)',
      type: 'range',
      default: 10,
      min: 0,
      max: 100,
      step: 1,
    },
    {
      id: 'spread',
      label: 'Spread Radius (px)',
      type: 'range',
      default: 0,
      min: -50,
      max: 50,
      step: 1,
    },
    {
      id: 'color',
      label: 'Shadow Color',
      type: 'color',
      default: '#00000040',
    },
    {
      id: 'opacity',
      label: 'Shadow Opacity (%)',
      type: 'range',
      default: 25,
      min: 0,
      max: 100,
      step: 1,
    },
    {
      id: 'bgColor',
      label: 'Preview Background Color',
      type: 'color',
      default: '#ffffff',
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(_inputs, options) {
    const inset = options.inset as boolean;
    const x = options.x as number;
    const y = options.y as number;
    const blur = options.blur as number;
    const spread = options.spread as number;
    const color = options.color as string;
    const opacity = options.opacity as number;
    const bgColor = options.bgColor as string;

    // Convert hex color + opacity
    let shadowColor = color;
    if (color.startsWith('#') && color.length === 7) {
      const alpha = Math.round(opacity * 2.55).toString(16).padStart(2, '0');
      shadowColor = color + alpha;
    }

    const shadow = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${shadowColor}`;
    const css = `box-shadow: ${shadow};`;

    const html = `<style>
      body { font-family:system-ui,sans-serif; margin:0; }
      .preview-wrap { background:${bgColor}; padding:60px; display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:16px; }
      .preview-box { width:200px; height:120px; background:#fff; border-radius:8px; box-shadow:${shadow}; display:flex; align-items:center; justify-content:center; color:#868e96; font-size:14px; }
      .code { background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:16px; font-family:monospace; font-size:14px; word-break:break-all; }
      .label { font-weight:600; margin-bottom:8px; font-family:system-ui; }
    </style>
    <div class="preview-wrap"><div class="preview-box">Box Shadow</div></div>
    <div class="label">CSS Code:</div>
    <div class="code">${css}</div>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
