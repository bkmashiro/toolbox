import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'border-radius',
  name: 'Border Radius',
  description: 'Visual border-radius builder with individual corner control',
  category: 'developer',
  tags: ['css', 'border-radius', 'rounded', 'corners', 'builder', 'visual', 'developer'],
  inputs: [],
  options: [
    {
      id: 'linked',
      label: 'Link All Corners',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'all',
      label: 'All Corners (px)',
      type: 'range',
      default: 8,
      min: 0,
      max: 200,
      step: 1,
      showWhen: { optionId: 'linked', value: true },
    },
    {
      id: 'tl',
      label: 'Top-Left (px)',
      type: 'range',
      default: 8,
      min: 0,
      max: 200,
      step: 1,
    },
    {
      id: 'tr',
      label: 'Top-Right (px)',
      type: 'range',
      default: 8,
      min: 0,
      max: 200,
      step: 1,
    },
    {
      id: 'br',
      label: 'Bottom-Right (px)',
      type: 'range',
      default: 8,
      min: 0,
      max: 200,
      step: 1,
    },
    {
      id: 'bl',
      label: 'Bottom-Left (px)',
      type: 'range',
      default: 8,
      min: 0,
      max: 200,
      step: 1,
    },
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      default: 'px',
      options: [
        { label: 'px', value: 'px' },
        { label: '%', value: '%' },
      ],
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(_inputs, options) {
    const linked = options.linked as boolean;
    const unit = options.unit as string;
    const all = options.all as number;
    const tl = linked ? all : options.tl as number;
    const tr = linked ? all : options.tr as number;
    const br = linked ? all : options.br as number;
    const bl = linked ? all : options.bl as number;

    const radii = [tl, tr, br, bl];
    const isUniform = radii.every((r) => r === radii[0]);
    const css = isUniform
      ? `border-radius: ${tl}${unit};`
      : `border-radius: ${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit};`;

    const borderRadius = isUniform
      ? `${tl}${unit}`
      : `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;

    const html = `<style>
      body { font-family:system-ui,sans-serif; margin:0; }
      .preview-wrap { background:#f8f9fa; padding:40px; display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:16px; }
      .preview-box { width:200px; height:120px; background:#4dabf7; border-radius:${borderRadius}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:600; }
      .code { background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:16px; font-family:monospace; font-size:14px; word-break:break-all; }
      .label { font-weight:600; margin-bottom:8px; font-family:system-ui; }
      .corners { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; font-size:13px; font-family:system-ui; }
      .corner { background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px; padding:8px; }
    </style>
    <div class="preview-wrap"><div class="preview-box">Preview</div></div>
    <div class="corners">
      <div class="corner">Top-Left: ${tl}${unit}</div>
      <div class="corner">Top-Right: ${tr}${unit}</div>
      <div class="corner">Bottom-Left: ${bl}${unit}</div>
      <div class="corner">Bottom-Right: ${br}${unit}</div>
    </div>
    <div class="label">CSS Code:</div>
    <div class="code">${css}</div>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
