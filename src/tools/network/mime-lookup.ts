import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { MIME_DATA } from './mime-data';

const tool: Tool = {
  id: 'mime-lookup',
  name: 'MIME Lookup',
  description: 'Look up MIME types by file extension or find extensions for a MIME type',
  category: 'network',
  tags: ['mime', 'content-type', 'extension', 'lookup', 'media', 'type', 'file', 'network'],
  inputs: [
    {
      id: 'query',
      label: 'Query (extension or MIME type)',
      type: 'text',
      placeholder: 'pdf or application/pdf',
    },
  ],
  options: [
    {
      id: 'direction',
      label: 'Direction',
      type: 'select',
      default: 'auto',
      options: [
        { label: 'Auto-detect', value: 'auto' },
        { label: 'Extension → MIME', value: 'ext-to-mime' },
        { label: 'MIME → Extension', value: 'mime-to-ext' },
      ],
    },
  ],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs, options) {
    const query = ((inputs.query as string) ?? '').trim().toLowerCase().replace(/^\./, '');
    if (!query) throw new Error('Query is required');

    const direction = options.direction as string;
    const ismime = direction === 'mime-to-ext' || (direction === 'auto' && query.includes('/'));

    if (ismime) {
      const matches = MIME_DATA.filter((m) => m.mime.toLowerCase() === query);
      if (!matches.length) {
        // Try partial match
        const partial = MIME_DATA.filter((m) => m.mime.toLowerCase().includes(query));
        if (!partial.length) throw new Error(`No extensions found for MIME type: ${query}`);
        return {
          type: 'json',
          data: {
            query,
            direction: 'mime-to-extension',
            results: partial.map((m) => ({ extension: m.extension, mime: m.mime, description: m.description })),
          },
        };
      }
      return {
        type: 'json',
        data: {
          query,
          direction: 'mime-to-extension',
          results: matches.map((m) => ({ extension: m.extension, mime: m.mime, description: m.description })),
        },
      };
    } else {
      const matches = MIME_DATA.filter((m) => m.extension.toLowerCase() === query);
      if (!matches.length) {
        const partial = MIME_DATA.filter((m) => m.extension.toLowerCase().includes(query) || m.description.toLowerCase().includes(query));
        if (!partial.length) throw new Error(`No MIME type found for extension: .${query}`);
        return {
          type: 'json',
          data: {
            query,
            direction: 'extension-to-mime',
            results: partial.map((m) => ({ extension: m.extension, mime: m.mime, description: m.description })),
          },
        };
      }
      return {
        type: 'json',
        data: {
          query,
          direction: 'extension-to-mime',
          results: matches.map((m) => ({ extension: m.extension, mime: m.mime, description: m.description })),
        },
      };
    }
  },
};

registry.register(tool);
export default tool;
