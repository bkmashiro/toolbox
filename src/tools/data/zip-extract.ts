import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'zip-extract',
  name: 'ZIP Extract / List',
  description: 'List the contents of a ZIP archive (names and sizes).',
  category: 'data',
  tags: ['zip', 'archive', 'extract', 'list', 'unzip', 'contents', 'data'],
  inputs: [
    {
      id: 'file',
      label: 'ZIP File',
      type: 'file',
      accept: '.zip,application/zip,application/x-zip-compressed',
    },
  ],
  options: [
    {
      id: 'showSizes',
      label: 'Show Uncompressed Sizes',
      type: 'checkbox',
      default: true,
    },
  ],
  output: {
    type: 'text',
    defaultFilename: 'zip-contents.txt',
    defaultMimeType: 'text/plain',
  },
  apiSupported: false,
  heavyDeps: ['jszip'],
  async run(inputs, options, onProgress) {
    const JSZip = (await import('jszip')).default;

    const file = inputs.file as File;
    if (!file) {
      return { type: 'text', data: 'Error: No file provided.' };
    }

    const showSizes = options.showSizes as boolean;

    onProgress?.(10, 'Loading ZIP…');
    const zip = await JSZip.loadAsync(file);
    onProgress?.(80, 'Reading entries…');

    interface EntryInfo {
      path: string;
      size?: number;
    }

    const entries: EntryInfo[] = [];

    const sizePromises: Promise<void>[] = [];

    zip.forEach((path, entry) => {
      if (!entry.dir) {
        const info: EntryInfo = { path };
        entries.push(info);
        if (showSizes) {
          sizePromises.push(
            entry.async('arraybuffer').then((buf) => {
              info.size = buf.byteLength;
            })
          );
        }
      }
    });

    if (sizePromises.length) {
      await Promise.all(sizePromises);
    }

    onProgress?.(100, 'Done');

    // Sort alphabetically
    entries.sort((a, b) => a.path.localeCompare(b.path));

    const lines = entries.map((e) => {
      if (showSizes && e.size !== undefined) {
        const kb = (e.size / 1024).toFixed(1);
        return `${e.path}  (${kb} KB)`;
      }
      return e.path;
    });

    return {
      type: 'text',
      data: lines.join('\n'),
      summary: `${entries.length} file${entries.length !== 1 ? 's' : ''} in archive`,
    };
  },
};

registry.register(tool);
export default tool;
