import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'whois-lookup',
  name: 'WHOIS Lookup',
  description: 'Domain WHOIS query via public RDAP/WHOIS API',
  category: 'network',
  tags: ['whois', 'domain', 'rdap', 'registrar', 'expiry', 'dns', 'registration', 'network'],
  inputs: [
    {
      id: 'domain',
      label: 'Domain',
      type: 'text',
      placeholder: 'example.com',
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs) {
    const domain = ((inputs.domain as string) ?? '').trim().toLowerCase();
    if (!domain) throw new Error('Domain is required');

    // Try RDAP first (structured, JSON)
    try {
      const rdapResp = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
      if (rdapResp.ok) {
        const data = await rdapResp.json() as Record<string, unknown>;
        const lines: string[] = [`RDAP Lookup for: ${domain}`, '='.repeat(50)];

        const getName = (entity: unknown): string => {
          const e = entity as Record<string, unknown>;
          const vcard = e.vcardArray as unknown[];
          if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
            const fn = (vcard[1] as unknown[]).find((v) => (v as unknown[])[0] === 'fn');
            if (fn) return (fn as unknown[])[3] as string;
          }
          return (e.handle as string) || 'N/A';
        };

        if (data.ldhName) lines.push(`Domain: ${data.ldhName}`);
        if (data.status) lines.push(`Status: ${(data.status as string[]).join(', ')}`);

        if (Array.isArray(data.events)) {
          for (const evt of data.events as Array<{ eventAction: string; eventDate: string }>) {
            lines.push(`${evt.eventAction}: ${new Date(evt.eventDate).toISOString().split('T')[0]}`);
          }
        }

        if (Array.isArray(data.nameservers)) {
          lines.push('Nameservers:');
          for (const ns of data.nameservers as Array<{ ldhName: string }>) {
            lines.push(`  ${ns.ldhName}`);
          }
        }

        if (Array.isArray(data.entities)) {
          for (const entity of data.entities as Array<Record<string, unknown>>) {
            const roles = (entity.roles as string[]) ?? [];
            lines.push(`${roles.join('/')}: ${getName(entity)}`);
          }
        }

        return { type: 'text', data: lines.join('\n') };
      }
    } catch {
      // fall through to whois.vu
    }

    // Fallback to whois.vu
    const resp = await fetch(`https://api.whois.vu/?q=${encodeURIComponent(domain)}`);
    if (!resp.ok) throw new Error(`WHOIS lookup failed: HTTP ${resp.status}`);

    const text = await resp.text();
    return { type: 'text', data: text };
  },
};

registry.register(tool);
export default tool;
