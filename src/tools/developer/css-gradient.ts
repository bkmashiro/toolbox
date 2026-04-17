import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'css-gradient',
  name: 'CSS Gradient',
  description: 'Visual gradient builder — generate CSS gradient code with live preview',
  category: 'developer',
  tags: ['css', 'gradient', 'linear', 'radial', 'conic', 'background', 'color', 'developer'],
  inputs: [],
  options: [
    {
      id: 'type',
      label: 'Gradient Type',
      type: 'select',
      default: 'linear',
      options: [
        { label: 'Linear', value: 'linear' },
        { label: 'Radial', value: 'radial' },
        { label: 'Conic', value: 'conic' },
      ],
    },
    {
      id: 'angle',
      label: 'Angle (deg, for linear)',
      type: 'range',
      default: 90,
      min: 0,
      max: 360,
      step: 1,
      showWhen: { optionId: 'type', value: 'linear' },
    },
    {
      id: 'shape',
      label: 'Shape (for radial)',
      type: 'select',
      default: 'ellipse',
      options: [
        { label: 'Ellipse', value: 'ellipse' },
        { label: 'Circle', value: 'circle' },
      ],
      showWhen: { optionId: 'type', value: 'radial' },
    },
    {
      id: 'stop1color',
      label: 'Stop 1 Color',
      type: 'color',
      default: '#4dabf7',
    },
    {
      id: 'stop1pos',
      label: 'Stop 1 Position (%)',
      type: 'range',
      default: 0,
      min: 0,
      max: 100,
      step: 1,
    },
    {
      id: 'stop2color',
      label: 'Stop 2 Color',
      type: 'color',
      default: '#7048e8',
    },
    {
      id: 'stop2pos',
      label: 'Stop 2 Position (%)',
      type: 'range',
      default: 100,
      min: 0,
      max: 100,
      step: 1,
    },
    {
      id: 'stop3color',
      label: 'Stop 3 Color (optional)',
      type: 'color',
      default: '',
    },
    {
      id: 'stop3pos',
      label: 'Stop 3 Position (%)',
      type: 'range',
      default: 50,
      min: 0,
      max: 100,
      step: 1,
    },
    {
      id: 'repeat',
      label: 'Repeat',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(_inputs, options) {
    const type = options.type as string;
    const angle = options.angle as number;
    const shape = options.shape as string;
    const repeat = options.repeat as boolean;
    const s1c = options.stop1color as string;
    const s1p = options.stop1pos as number;
    const s2c = options.stop2color as string;
    const s2p = options.stop2pos as number;
    const s3c = (options.stop3color as string) || '';
    const s3p = options.stop3pos as number;

    const stops = [`${s1c} ${s1p}%`, `${s2c} ${s2p}%`];
    if (s3c) stops.push(`${s3c} ${s3p}%`);
    const stopsStr = stops.join(', ');

    let gradient: string;
    const prefix = repeat ? 'repeating-' : '';

    if (type === 'linear') {
      gradient = `${prefix}linear-gradient(${angle}deg, ${stopsStr})`;
    } else if (type === 'radial') {
      gradient = `${prefix}radial-gradient(${shape} at center, ${stopsStr})`;
    } else {
      gradient = `${prefix}conic-gradient(from ${angle}deg, ${stopsStr})`;
    }

    const html = `<style>
      .preview { width:100%; height:200px; border-radius:8px; background:${gradient}; margin-bottom:16px; }
      .code { background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:16px; font-family:monospace; font-size:14px; word-break:break-all; }
      .label { font-weight:600; margin-bottom:8px; font-family:system-ui; }
    </style>
    <div class="preview"></div>
    <div class="label">CSS Code:</div>
    <div class="code">background: ${gradient};</div>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
