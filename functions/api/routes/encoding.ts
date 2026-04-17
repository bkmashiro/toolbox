import { Hono } from 'hono';

const encodingRoutes = new Hono();

// GET /api/base64?mode=encode&input=hello&urlSafe=1
encodingRoutes.get('/base64', (c) => {
  const input = c.req.query('input') ?? '';
  const mode = c.req.query('mode') ?? 'encode';
  const urlSafe = c.req.query('urlSafe') === '1' || c.req.query('variant') === 'url-safe';
  try {
    if (mode === 'encode') {
      let result = btoa(unescape(encodeURIComponent(input)));
      if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      return c.json({ ok: true, result });
    } else {
      const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
      const result = decodeURIComponent(escape(atob(b64)));
      return c.json({ ok: true, result });
    }
  } catch (e) {
    return c.json({ ok: false, error: 'Invalid base64 input' }, 400);
  }
});

// GET /api/base64-encode (alias)
encodingRoutes.get('/base64-encode', (c) => {
  return encodingRoutes.fetch(
    new Request(c.req.url.replace('/base64-encode', '/base64'), c.req.raw)
  );
});

// GET /api/hex?mode=encode&input=hello
encodingRoutes.get('/hex', (c) => {
  const input = c.req.query('input') ?? '';
  const mode = c.req.query('mode') ?? 'encode';
  const separator = c.req.query('separator') ?? 'none';
  const uppercase = c.req.query('uppercase') === '1' || c.req.query('uppercase') === 'true';
  try {
    if (mode === 'encode') {
      const bytes = new TextEncoder().encode(input);
      let parts = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
      if (uppercase) parts = parts.map(p => p.toUpperCase());
      const sep = separator === 'space' ? ' ' : separator === 'colon' ? ':' : '';
      return c.json({ ok: true, result: parts.join(sep) });
    } else {
      // Decode: strip separators
      const clean = input.replace(/[\s:]/g, '');
      if (!/^[0-9a-fA-F]*$/.test(clean)) {
        return c.json({ ok: false, error: 'Invalid hex input' }, 400);
      }
      const bytes = new Uint8Array(clean.match(/.{2}/g)!.map(b => parseInt(b, 16)));
      const result = new TextDecoder().decode(bytes);
      return c.json({ ok: true, result });
    }
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/hex-encode (alias)
encodingRoutes.get('/hex-encode', (c) => {
  return encodingRoutes.fetch(
    new Request(c.req.url.replace('/hex-encode', '/hex'), c.req.raw)
  );
});

// GET /api/url-encode?mode=encode&input=hello%20world
encodingRoutes.get('/url-encode', (c) => {
  const input = c.req.query('input') ?? '';
  const mode = c.req.query('mode') ?? 'encode';
  const component = c.req.query('component') ?? 'component';
  try {
    let result: string;
    if (mode === 'encode') {
      result = component === 'full' ? encodeURI(input) : encodeURIComponent(input);
    } else {
      result = component === 'full' ? decodeURI(input) : decodeURIComponent(input);
    }
    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: 'Invalid URL encoding' }, 400);
  }
});

// GET /api/number-base?number=255&from=10&to=16
encodingRoutes.get('/number-base', (c) => {
  const numStr = c.req.query('number') ?? '';
  const from = parseInt(c.req.query('from') ?? '10');
  const to = parseInt(c.req.query('to') ?? '16');
  try {
    if (isNaN(from) || from < 2 || from > 36) return c.json({ ok: false, error: 'from base must be 2-36' }, 400);
    if (isNaN(to) || to < 2 || to > 36) return c.json({ ok: false, error: 'to base must be 2-36' }, 400);
    const n = parseInt(numStr, from);
    if (isNaN(n)) return c.json({ ok: false, error: 'Invalid number for the given base' }, 400);
    return c.json({ ok: true, result: n.toString(to) });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

export { encodingRoutes };
