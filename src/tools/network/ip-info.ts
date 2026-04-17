import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'ip-info',
  name: 'IP Info',
  description: 'IP geolocation and ASN lookup — blank input shows your own IP',
  category: 'network',
  tags: ['ip', 'geolocation', 'asn', 'lookup', 'network', 'country', 'isp', 'location'],
  inputs: [
    {
      id: 'ip',
      label: 'IP Address (leave blank to use your IP)',
      type: 'text',
      placeholder: '8.8.8.8 or blank for your IP',
      required: false,
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs) {
    const ip = ((inputs.ip as string) ?? '').trim();
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : 'https://ipapi.co/json/';

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const data = await resp.json() as Record<string, unknown>;

    if (data.error) throw new Error(data.reason as string || 'IP lookup failed');

    return {
      type: 'json',
      data: {
        ip: data.ip,
        city: data.city,
        region: data.region,
        regionCode: data.region_code,
        country: data.country_name,
        countryCode: data.country_code,
        continent: data.continent_code,
        postalCode: data.postal,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        utcOffset: data.utc_offset,
        asn: data.asn,
        org: data.org,
        hostname: data.hostname || null,
        inEU: data.in_eu,
      },
    };
  },
};

registry.register(tool);
export default tool;
