import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'zip-create',
  name: 'Create ZIP Archive',
  description: 'Compress one or more files into a ZIP archive.',
  category: 'data',
  tags: ['zip', 'archive', 'compress', 'pack', 'bundle', 'deflate', 'data'],
  inputs: [
    {
      id: 'files',
      label: 'Files to Archive',
      type: 'multifile',
      accept: '*/*',
    },
  ],
  options: [
    {
      id: 'filename',
      label: 'Output Filename',
      type: 'text',
      default: 'archive',
      placeholder: 'archive',
      helpText: 'Name of the resulting .zip file (without extension)',
    },
    {
      id: 'level',
      label: 'Compression Level',
      type: 'range',
      default: 6,
      min: 1,
      max: 9,
      step: 1,
      helpText: '1 = fastest / largest, 9 = slowest / smallest',
    },
  ],
  output: {
    type: 'file',
    defaultFilename: 'archive.zip',
    defaultMimeType: 'application/zip',
  },
  apiSupported: false,
  heavyDeps: ['jszip'],
  async run(inputs, options, onProgress) {
    const JSZip = (await import('jszip')).default;

    const rawFiles = inputs.files;
    const files = Array.isArray(rawFiles) ? (rawFiles as File[]) : [rawFiles as File];

    if (!files.length || !files[0]) {
      return { type: 'text', data: 'Error: No files provided.' };
    }

    const level = (options.level as number) ?? 6;
    const outputName = ((options.filename as string) || 'archive').replace(/\.zip$/i, '');

    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.name, file);
    }

    const blob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level },
      },
      (meta) => {
        onProgress?.(meta.percent | 0, `Compressing... ${meta.percent | 0}%`);
      }
    );

    return {
      type: 'file',
      data: blob,
      filename: `${outputName}.zip`,
      mimeType: 'application/zip',
      summary: `${files.length} file${files.length !== 1 ? 's' : ''} compressed into ${outputName}.zip`,
    };
  },
};

registry.register(tool);
export default tool;
