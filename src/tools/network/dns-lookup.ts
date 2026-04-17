import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const RECORD_TYPES: Record<string, number> = {
  A: 1, AAAA: 28, MX: 15, TXT: 16, CNAME: 5, NS: 2, SOA: 6,
};

async function dohLookup(domain: string, type: string, provider: string): Promise<unknown[]> {
  const baseUrl = provider === 'Google'
    ? 'https://dns.google/resolve'
    : 'https://cloudflare-dns.com/dns-query';

  const typeNum = RECORD_TYPES[type];
  if (!typeNum) throw new Error(`Unknown record type: ${type}`);

  const url = `${baseUrl}?name=${encodeURIComponent(domain)}&type=${typeNum}`;
  const resp = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
  });

  if (!resp.ok) throw new Error(`DNS query failed: HTTP ${resp.status}`);
  const data = await resp.json() as { Status: number; Answer?: unknown[]; Authority?: unknown[] };

  if (data.Status !== 0) {
    const statusMap: Record<number, string> = {
      1: 'Format error', 2: 'Server failure', 3: 'NXDOMAIN (domain not found)',
      5: 'Refused',
    };
    throw new Error(statusMap[data.Status] || `DNS error: status ${data.Status}`);
  }

  return data.Answer ?? [];
}

const tool: Tool = {
  id: 'dns-lookup',
  name: 'DNS Lookup',
  description: 'Query DNS records via DNS-over-HTTPS (Cloudflare or Google)',
  category: 'network',
  tags: ['dns', 'lookup', 'a', 'aaaa', 'mx', 'txt', 'cname', 'ns', 'soa', 'doh', 'network'],
  inputs: [
    {
      id: 'domain',
      label: 'Domain',
      type: 'text',
      placeholder: 'example.com',
    },
  ],
  options: [
    {
      id: 'type',
      label: 'Record Type',
      type: 'select',
      default: 'A',
      options: [
        { label: 'A (IPv4)', value: 'A' },
        { label: 'AAAA (IPv6)', value: 'AAAA' },
        { label: 'MX (Mail)', value: 'MX' },
        { label: 'TXT', value: 'TXT' },
        { label: 'CNAME', value: 'CNAME' },
        { label: 'NS (Nameserver)', value: 'NS' },
        { label: 'SOA', value: 'SOA' },
        { label: 'ALL', value: 'ALL' },
      ],
    },
    {
      id: 'provider',
      label: 'DoH Provider',
      type: 'select',
      default: 'Cloudflare',
      options: [
        { label: 'Cloudflare', value: 'Cloudflare' },
        { label: 'Google', value: 'Google' },
      ],
    },
  ],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs, options) {
    const domain = ((inputs.domain as string) ?? '').trim();
    if (!domain) throw new Error('Domain is required');

    const type = options.type as string;
    const provider = options.provider as string;

    if (type === 'ALL') {
      const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA'];
      const results: Record<string, unknown[]> = {};
      await Promise.allSettled(
        types.map(async (t) => {
          try {
            const records = await dohLookup(domain, t, provider);
            if (records.length > 0) results[t] = records;
          } catch {
            // skip failed types in ALL mode
          }
        })
      );
      return { type: 'json', data: { domain, provider, records: results } };
    }

    const records = await dohLookup(domain, type, provider);
    return {
      type: 'json',
      data: { domain, type, provider, records, count: records.length },
    };
  },
};

registry.register(tool);
export default tool;
