import { Hono } from 'hono';

const networkRoutes = new Hono();

// GET /api/ip-info?ip=8.8.8.8
networkRoutes.get('/ip-info', async (c) => {
  try {
    const ip = c.req.query('ip');
    const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    const resp = await fetch(url, { headers: { 'User-Agent': 'toolbox/1.0' } });
    if (!resp.ok) return c.json({ ok: false, error: `ipapi.co responded with ${resp.status}` }, 502);
    const data = await resp.json() as any;
    if (data.error) return c.json({ ok: false, error: data.reason ?? 'IP lookup failed' }, 400);
    return c.json({
      ok: true,
      result: {
        ip: data.ip, city: data.city, region: data.region, country: data.country_name,
        countryCode: data.country_code, lat: data.latitude, lng: data.longitude,
        asn: data.asn, org: data.org, timezone: data.timezone, currency: data.currency,
      },
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 502);
  }
});

// GET /api/dns-lookup?domain=example.com&type=A
networkRoutes.get('/dns-lookup', async (c) => {
  try {
    const domain = c.req.query('domain') ?? '';
    const type = c.req.query('type') ?? 'A';
    const provider = c.req.query('provider') ?? 'cloudflare';
    if (!domain) return c.json({ ok: false, error: 'domain is required' }, 400);

    const dohUrl = provider === 'google'
      ? `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`
      : `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;

    const resp = await fetch(dohUrl, { headers: { Accept: 'application/dns-json' } });
    if (!resp.ok) return c.json({ ok: false, error: `DNS query failed: ${resp.status}` }, 502);
    const data = await resp.json() as any;

    const typeNames: Record<number, string> = {
      1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV',
    };

    const records = (data.Answer ?? []).map((r: any) => ({
      name: r.name, type: typeNames[r.type] ?? r.type, ttl: r.TTL, data: r.data,
    }));

    return c.json({ ok: true, result: { records, status: data.Status === 0 ? 'OK' : 'Error' } });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 502);
  }
});

// GET /api/url-parse?url=https://example.com:8080/path?a=1#frag
networkRoutes.get('/url-parse', (c) => {
  try {
    const urlStr = c.req.query('url') ?? '';
    if (!urlStr) return c.json({ ok: false, error: 'url is required' }, 400);
    const u = new URL(urlStr);
    const searchParams: Record<string, string> = {};
    u.searchParams.forEach((v, k) => { searchParams[k] = v; });
    return c.json({
      ok: true,
      result: {
        protocol: u.protocol, host: u.host, hostname: u.hostname,
        port: u.port, pathname: u.pathname, search: u.search,
        searchParams, hash: u.hash, origin: u.origin,
      },
    });
  } catch (e) {
    return c.json({ ok: false, error: 'Invalid URL' }, 400);
  }
});

// GET /api/ip-calc?cidr=192.168.1.0/24
networkRoutes.get('/ip-calc', (c) => {
  try {
    const cidr = c.req.query('cidr') ?? '';
    if (!cidr) return c.json({ ok: false, error: 'cidr is required' }, 400);

    const [ipStr, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr ?? '32');
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return c.json({ ok: false, error: 'Invalid prefix length' }, 400);

    const parts = ipStr.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return c.json({ ok: false, error: 'Invalid IPv4 address' }, 400);
    }

    const ipInt = parts.reduce((acc, p) => (acc << 8) | p, 0) >>> 0;
    const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const hostCount = Math.pow(2, 32 - prefix) - 2;

    const intToIp = (n: number) => [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF].join('.');

    return c.json({
      ok: true,
      result: {
        network: intToIp(network), broadcast: intToIp(broadcast),
        firstUsable: intToIp(network + 1), lastUsable: intToIp(broadcast - 1),
        subnetMask: intToIp(mask), wildcardMask: intToIp(~mask >>> 0),
        hostCount: Math.max(0, hostCount), prefix,
        cidr: `${intToIp(network)}/${prefix}`,
      },
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

export { networkRoutes };
