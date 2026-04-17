import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'url-parse',
  name: 'URL Parser',
  description: 'Parse URL into components and rebuild from parts',
  category: 'network',
  tags: ['url', 'parse', 'protocol', 'host', 'port', 'path', 'query', 'params', 'hash', 'network'],
  inputs: [
    {
      id: 'url',
      label: 'URL',
      type: 'text',
      placeholder: 'https://example.com:8080/path?key=value&foo=bar#section',
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs) {
    const urlStr = ((inputs.url as string) ?? '').trim();
    if (!urlStr) throw new Error('URL is required');

    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      // Try adding protocol
      try {
        parsed = new URL('https://' + urlStr);
      } catch {
        throw new Error('Invalid URL');
      }
    }

    const params: Record<string, string | string[]> = {};
    parsed.searchParams.forEach((value, key) => {
      if (key in params) {
        const existing = params[key];
        params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        params[key] = value;
      }
    });

    return {
      type: 'json',
      data: {
        original: urlStr,
        protocol: parsed.protocol,
        username: parsed.username || null,
        password: parsed.password || null,
        hostname: parsed.hostname,
        port: parsed.port || null,
        host: parsed.host,
        pathname: parsed.pathname,
        search: parsed.search || null,
        searchParams: params,
        hash: parsed.hash || null,
        origin: parsed.origin,
        href: parsed.href,
        paramsTable: Array.from(parsed.searchParams.entries()).map(([k, v]) => ({ key: k, value: v })),
      },
    };
  },
};

registry.register(tool);
export default tool;
