import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'headers-check',
  name: 'HTTP Headers',
  description: 'Fetch URL and show response headers (CORS-limited — best used via API)',
  category: 'network',
  tags: ['http', 'headers', 'response', 'cors', 'check', 'fetch', 'status', 'network'],
  inputs: [
    {
      id: 'url',
      label: 'URL',
      type: 'text',
      placeholder: 'https://example.com',
    },
  ],
  options: [
    {
      id: 'method',
      label: 'Method',
      type: 'select',
      default: 'HEAD',
      options: [
        { label: 'HEAD', value: 'HEAD' },
        { label: 'GET', value: 'GET' },
      ],
    },
  ],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs, options) {
    const url = ((inputs.url as string) ?? '').trim();
    if (!url) throw new Error('URL is required');

    const method = options.method as string;
    const start = Date.now();

    let resp: Response;
    try {
      resp = await fetch(url, { method, mode: 'cors' });
    } catch (e) {
      throw new Error(
        `Request failed: ${(e as Error).message}. Note: many URLs block cross-origin requests (CORS). ` +
        'Try using the API endpoint instead.'
      );
    }

    const elapsed = Date.now() - start;
    const headers: Record<string, string> = {};
    resp.headers.forEach((value, key) => { headers[key] = value; });

    return {
      type: 'json',
      data: {
        url,
        method,
        status: resp.status,
        statusText: resp.statusText,
        ok: resp.ok,
        headers,
        timing: { totalMs: elapsed },
        note: 'CORS restrictions may prevent some headers from being visible in browser context.',
      },
    };
  },
};

registry.register(tool);
export default tool;
