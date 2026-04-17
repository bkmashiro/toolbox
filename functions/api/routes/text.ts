import { Hono } from 'hono';

const textRoutes = new Hono();

// GET /api/case-convert?to=camel&input=hello_world
textRoutes.get('/case-convert', (c) => {
  try {
    const input = c.req.query('input') ?? '';
    const target = c.req.query('to') ?? c.req.query('target') ?? 'camelCase';

    // Tokenize: split on spaces, underscores, hyphens, and camelCase boundaries
    const tokens = input
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[\s_\-]+/)
      .filter(t => t.trim())
      .map(t => t.toLowerCase());

    if (tokens.length === 0) return c.json({ ok: true, result: input });

    let result: string;
    switch (target) {
      case 'camelCase':
        result = tokens[0] + tokens.slice(1).map(t => t[0].toUpperCase() + t.slice(1)).join('');
        break;
      case 'PascalCase':
        result = tokens.map(t => t[0].toUpperCase() + t.slice(1)).join('');
        break;
      case 'snake_case':
        result = tokens.join('_');
        break;
      case 'UPPER_SNAKE_CASE':
        result = tokens.join('_').toUpperCase();
        break;
      case 'kebab-case':
        result = tokens.join('-');
        break;
      case 'Title Case':
        result = tokens.map(t => t[0].toUpperCase() + t.slice(1)).join(' ');
        break;
      case 'sentence case':
        result = tokens.join(' ');
        result = result[0].toUpperCase() + result.slice(1);
        break;
      default:
        return c.json({ ok: false, error: `Unknown target case: ${target}` }, 400);
    }

    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/uuid
textRoutes.get('/uuid', (c) => {
  try {
    const count = Math.min(100, parseInt(c.req.query('count') ?? '1'));
    const uppercase = c.req.query('uppercase') === '1';

    const uuids = Array.from({ length: count }, () => {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
      return uppercase ? uuid.toUpperCase() : uuid;
    });

    return c.json({ ok: true, result: count === 1 ? uuids[0] : uuids });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

// GET /api/color?from=hex&to=rgb&value=ff0000
textRoutes.get('/color', (c) => {
  try {
    const value = (c.req.query('value') ?? '').replace(/^#/, '');
    const from = c.req.query('from') ?? 'hex';
    const to = c.req.query('to') ?? 'rgb';

    let r: number, g: number, b: number;

    if (from === 'hex') {
      if (!/^[0-9A-Fa-f]{6}$/.test(value)) return c.json({ ok: false, error: 'Invalid hex color (6 digits required)' }, 400);
      r = parseInt(value.slice(0, 2), 16);
      g = parseInt(value.slice(2, 4), 16);
      b = parseInt(value.slice(4, 6), 16);
    } else if (from === 'rgb') {
      const parts = value.split(',').map(Number);
      if (parts.length < 3) return c.json({ ok: false, error: 'RGB format: r,g,b' }, 400);
      [r, g, b] = parts;
    } else {
      return c.json({ ok: false, error: 'from must be hex or rgb' }, 400);
    }

    let result: string;
    if (to === 'hex') {
      result = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    } else if (to === 'rgb') {
      result = `rgb(${r}, ${g}, ${b})`;
    } else if (to === 'hsl') {
      const ri = r/255, gi = g/255, bi = b/255;
      const max = Math.max(ri, gi, bi), min = Math.min(ri, gi, bi);
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case ri: h = ((gi - bi) / d + (gi < bi ? 6 : 0)) / 6; break;
          case gi: h = ((bi - ri) / d + 2) / 6; break;
          case bi: h = ((ri - gi) / d + 4) / 6; break;
        }
      }
      result = `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
    } else {
      return c.json({ ok: false, error: 'to must be hex, rgb, or hsl' }, 400);
    }

    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// POST /api/json-format
textRoutes.post('/json-format', async (c) => {
  try {
    let body: any;
    try { body = await c.req.json(); } catch { body = {}; }
    const input = body.input ?? c.req.query('input') ?? '';
    const mode = body.mode ?? c.req.query('mode') ?? 'format';
    const indent = parseInt(body.indent ?? c.req.query('indent') ?? '2');

    const parsed = JSON.parse(input);
    const result = mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/json-format (for short inputs via query param)
textRoutes.get('/json-format', async (c) => {
  try {
    const input = c.req.query('input') ?? '';
    const mode = c.req.query('mode') ?? 'format';
    const indent = parseInt(c.req.query('indent') ?? '2');
    const parsed = JSON.parse(input);
    const result = mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/markdown?input=# Hello
textRoutes.get('/markdown', async (c) => {
  try {
    const input = c.req.query('input') ?? '';
    const { marked } = await import('marked');
    const result = await marked(input);
    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

export { textRoutes };
