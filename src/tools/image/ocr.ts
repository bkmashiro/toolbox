import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'ocr',
  name: 'OCR — Image to Text',
  description: 'Extract text from images using Tesseract OCR — runs entirely in your browser',
  category: 'image',
  tags: ['image', 'ocr', 'text', 'extract', 'tesseract', 'scan', 'recognize', 'read'],
  inputs: [
    {
      id: 'file',
      label: 'Image',
      type: 'file',
      accept: 'image/*',
      required: true,
    },
  ],
  options: [
    {
      id: 'language',
      label: 'Language',
      type: 'select',
      default: 'eng',
      options: [
        { value: 'eng', label: 'English' },
        { value: 'chi_sim', label: 'Chinese Simplified' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'spa', label: 'Spanish' },
        { value: 'rus', label: 'Russian' },
      ],
    },
  ],
  output: {
    type: 'text',
  },
  heavyDeps: ['tesseract.js'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs.file as File;
    const lang = (options.language as string) || 'eng';

    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(file, lang, {
      logger: (m: { status: string; progress: number }) => {
        onProgress?.(Math.round(m.progress * 100), m.status);
      },
    });

    return {
      type: 'text',
      data: result.data.text,
    };
  },
};

registry.register(tool);
export default tool;
