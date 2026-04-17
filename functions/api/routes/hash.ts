import { Hono } from 'hono';

const hashRoutes = new Hono();

// GET /api/hash?algo=sha-256&input=hello
hashRoutes.get('/hash', async (c) => {
  try {
    const input = c.req.query('input') ?? '';
    const algoRaw = (c.req.query('algo') ?? 'sha-256').toLowerCase().replace(/^md5$/, 'md5');
    const uppercase = c.req.query('uppercase') === '1' || c.req.query('uppercase') === 'true';

    const algoMap: Record<string, string> = {
      'sha-256': 'SHA-256', 'sha256': 'SHA-256',
      'sha-384': 'SHA-384', 'sha384': 'SHA-384',
      'sha-512': 'SHA-512', 'sha512': 'SHA-512',
      'sha-1': 'SHA-1', 'sha1': 'SHA-1',
      'sha-224': 'SHA-224', 'sha224': 'SHA-224',
    };

    const subtleAlgo = algoMap[algoRaw];
    if (!subtleAlgo) {
      return c.json({ ok: false, error: `Unsupported algorithm: ${algoRaw}. Supported: sha-1, sha-224, sha-256, sha-384, sha-512` }, 400);
    }

    const buf = await crypto.subtle.digest(subtleAlgo, new TextEncoder().encode(input));
    let hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (uppercase) hex = hex.toUpperCase();

    return c.json({ ok: true, result: hex });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

// GET /api/hash-gen (alias for compatibility)
hashRoutes.get('/hash-gen', async (c) => {
  return hashRoutes.fetch(
    new Request(c.req.url.replace('/hash-gen', '/hash'), c.req.raw),
    c.env as any,
    c.executionCtx as any
  );
});

export { hashRoutes };
