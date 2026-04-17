import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function optimizeSvg(
  svg: string,
  opts: {
    removeComments: boolean;
    removeMetadata: boolean;
    minify: boolean;
    precision: number;
  }
): string {
  let out = svg;

  if (opts.removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (opts.removeMetadata) {
    out = out.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    out = out.replace(/<desc[\s\S]*?<\/desc>/gi, '');
    out = out.replace(/<title>[\s\S]*?<\/title>/gi, '');
    // Remove empty groups
    let prev = '';
    while (prev !== out) {
      prev = out;
      out = out.replace(/<g[^>]*>\s*<\/g>/gi, '');
    }
  }

  if (opts.minify) {
    // Minimize decimal numbers
    const prec = opts.precision;
    out = out.replace(/(\d+\.\d+)/g, (m) => {
      const n = parseFloat(m);
      return parseFloat(n.toFixed(prec)).toString();
    });

    // Collapse whitespace between tags
    out = out.replace(/>\s+</g, '><');
    // Collapse multiple spaces
    out = out.replace(/\s{2,}/g, ' ');
    // Remove whitespace around = in attributes
    out = out.replace(/\s*=\s*/g, '=');
    // Trim
    out = out.trim();
  }

  return out;
}

const tool: Tool = {
  id: 'svg-optimize',
  name: 'SVG Optimize',
  description: 'Clean up and minimize SVG files by stripping comments, metadata, and minimizing numbers',
  category: 'image',
  tags: ['svg', 'optimize', 'minify', 'clean', 'compress', 'vector', 'image'],
  inputs: [
    {
      id: 'svgFile',
      label: 'SVG File',
      type: 'file',
      accept: 'image/svg+xml,.svg',
      required: false,
    },
    {
      id: 'svgText',
      label: 'Or paste SVG here',
      type: 'textarea',
      placeholder: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>',
      rows: 8,
      required: false,
    },
  ],
  options: [
    {
      id: 'removeComments',
      label: 'Remove Comments',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'removeMetadata',
      label: 'Remove Metadata / Empty Groups',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'minify',
      label: 'Minify (collapse whitespace)',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'precision',
      label: 'Number Precision (decimal places)',
      type: 'range',
      default: 3,
      min: 0,
      max: 8,
      step: 1,
    },
  ],
  output: {
    type: 'text',
  },
  apiSupported: false,

  async run(inputs, options) {
    const file = inputs['svgFile'] as File | undefined;
    const textInput = inputs['svgText'] as string;

    let svgContent: string;
    if (file && file.size > 0) {
      svgContent = await file.text();
    } else if (textInput && textInput.trim()) {
      svgContent = textInput;
    } else {
      throw new Error('Provide an SVG file or paste SVG content');
    }

    const removeComments = options['removeComments'] as boolean;
    const removeMetadata = options['removeMetadata'] as boolean;
    const minify = options['minify'] as boolean;
    const precision = options['precision'] as number;

    const optimized = optimizeSvg(svgContent, { removeComments, removeMetadata, minify, precision });

    const origSize = new TextEncoder().encode(svgContent).byteLength;
    const newSize = new TextEncoder().encode(optimized).byteLength;
    const reduction = (((origSize - newSize) / origSize) * 100).toFixed(1);

    return {
      type: 'text',
      data: optimized,
      summary: `${(origSize / 1024).toFixed(1)} KB → ${(newSize / 1024).toFixed(1)} KB (${reduction}% smaller)`,
    };
  },
};

registry.register(tool);
export default tool;
