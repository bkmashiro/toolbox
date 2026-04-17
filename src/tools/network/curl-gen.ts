import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'curl-gen',
  name: 'cURL Builder',
  description: 'Visually build cURL commands — URL, method, headers, body, auth',
  category: 'network',
  tags: ['curl', 'http', 'request', 'builder', 'api', 'rest', 'headers', 'auth', 'network'],
  inputs: [
    {
      id: 'url',
      label: 'URL',
      type: 'text',
      placeholder: 'https://api.example.com/endpoint',
    },
    {
      id: 'headers',
      label: 'Headers (one per line, key: value)',
      type: 'textarea',
      placeholder: 'Content-Type: application/json\nX-API-Key: your-key',
      rows: 4,
      required: false,
    },
    {
      id: 'body',
      label: 'Request Body',
      type: 'textarea',
      placeholder: '{\n  "key": "value"\n}',
      rows: 6,
      required: false,
    },
  ],
  options: [
    {
      id: 'method',
      label: 'Method',
      type: 'select',
      default: 'GET',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'HEAD', value: 'HEAD' },
        { label: 'OPTIONS', value: 'OPTIONS' },
      ],
    },
    {
      id: 'authType',
      label: 'Auth Type',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'Bearer Token', value: 'bearer' },
      ],
    },
    {
      id: 'authValue',
      label: 'Auth Value (user:pass or token)',
      type: 'text',
      default: '',
      placeholder: 'username:password or token',
      required: false,
    },
    {
      id: 'followRedirects',
      label: 'Follow Redirects (-L)',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'verbose',
      label: 'Verbose (-v)',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'insecure',
      label: 'Insecure (-k, skip SSL verify)',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const url = ((inputs.url as string) ?? '').trim();
    if (!url) throw new Error('URL is required');

    const method = options.method as string;
    const authType = options.authType as string;
    const authValue = (options.authValue as string) || '';
    const followRedirects = options.followRedirects as boolean;
    const verbose = options.verbose as boolean;
    const insecure = options.insecure as boolean;
    const headersStr = (inputs.headers as string) ?? '';
    const body = (inputs.body as string) ?? '';

    const parts: string[] = ['curl'];

    if (method !== 'GET') parts.push(`-X ${method}`);
    if (followRedirects) parts.push('-L');
    if (verbose) parts.push('-v');
    if (insecure) parts.push('-k');

    // Auth
    if (authType === 'basic' && authValue) {
      parts.push(`-u '${authValue}'`);
    } else if (authType === 'bearer' && authValue) {
      parts.push(`-H 'Authorization: Bearer ${authValue}'`);
    }

    // Headers
    if (headersStr) {
      const lines = headersStr.split('\n').filter((l) => l.trim());
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          parts.push(`-H '${key}: ${val}'`);
        }
      }
    }

    // Body
    if (body && !['GET', 'HEAD'].includes(method)) {
      const escaped = body.replace(/'/g, "'\\''");
      parts.push(`-d '${escaped}'`);
    }

    parts.push(`'${url}'`);

    // Also generate fetch equivalent
    const fetchHeaders: Record<string, string> = {};
    if (authType === 'bearer' && authValue) fetchHeaders['Authorization'] = `Bearer ${authValue}`;
    if (headersStr) {
      for (const line of headersStr.split('\n').filter((l) => l.trim())) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) fetchHeaders[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
      }
    }

    const fetchOptions: Record<string, unknown> = { method };
    if (Object.keys(fetchHeaders).length) fetchOptions.headers = fetchHeaders;
    if (body && !['GET', 'HEAD'].includes(method)) fetchOptions.body = body;

    const fetchCode = `fetch('${url}', ${JSON.stringify(fetchOptions, null, 2)})
  .then(r => r.json())
  .then(console.log)`;

    const curl = parts.join(' \\\n  ');
    return {
      type: 'text',
      data: `# cURL Command\n${curl}\n\n# Fetch Equivalent\n${fetchCode}`,
    };
  },
};

registry.register(tool);
export default tool;
