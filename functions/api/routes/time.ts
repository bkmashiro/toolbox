import { Hono } from 'hono';

const timeRoutes = new Hono();

// GET /api/timestamp?input=1700000000
timeRoutes.get('/timestamp', (c) => {
  try {
    const input = c.req.query('input') ?? '';
    const timezone = c.req.query('timezone') ?? 'UTC';

    let date: Date;
    if (!input || input.toLowerCase() === 'now') {
      date = new Date();
    } else if (/^\d+$/.test(input)) {
      const n = parseInt(input);
      // Heuristic: if >1e10, treat as ms; else as seconds
      date = new Date(n > 1e10 ? n : n * 1000);
    } else {
      date = new Date(input);
    }

    if (isNaN(date.getTime())) {
      return c.json({ ok: false, error: 'Invalid date/timestamp input' }, 400);
    }

    const unix = Math.floor(date.getTime() / 1000);
    const unixMs = date.getTime();
    const iso = date.toISOString();
    const rfc2822 = date.toUTCString();

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffAbs = Math.abs(diffMs);
    const future = diffMs < 0;
    let relative: string;
    if (diffAbs < 60000) relative = 'just now';
    else if (diffAbs < 3600000) relative = `${Math.round(diffAbs / 60000)} minutes ${future ? 'from now' : 'ago'}`;
    else if (diffAbs < 86400000) relative = `${Math.round(diffAbs / 3600000)} hours ${future ? 'from now' : 'ago'}`;
    else if (diffAbs < 2592000000) relative = `${Math.round(diffAbs / 86400000)} days ${future ? 'from now' : 'ago'}`;
    else if (diffAbs < 31536000000) relative = `${Math.round(diffAbs / 2592000000)} months ${future ? 'from now' : 'ago'}`;
    else relative = `${Math.round(diffAbs / 31536000000)} years ${future ? 'from now' : 'ago'}`;

    const local = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' });

    return c.json({
      ok: true,
      result: { unix, unixMs, iso, rfc2822, relative, local, timezone },
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/date-calc?dateA=2024-01-01&dateB=2024-12-31&mode=difference
timeRoutes.get('/date-calc', (c) => {
  try {
    const dateAStr = c.req.query('dateA') ?? '';
    const dateBStr = c.req.query('dateB') ?? '';
    const mode = c.req.query('mode') ?? 'difference';
    const amount = parseInt(c.req.query('amount') ?? '0');
    const unit = c.req.query('unit') ?? 'days';

    if (!dateAStr) return c.json({ ok: false, error: 'dateA is required' }, 400);
    const dateA = new Date(dateAStr);
    if (isNaN(dateA.getTime())) return c.json({ ok: false, error: `Invalid dateA: "${dateAStr}"` }, 400);

    if (mode === 'difference') {
      if (!dateBStr) return c.json({ ok: false, error: 'dateB is required for difference mode' }, 400);
      const dateB = new Date(dateBStr);
      if (isNaN(dateB.getTime())) return c.json({ ok: false, error: `Invalid dateB: "${dateBStr}"` }, 400);

      const days = Math.round((dateB.getTime() - dateA.getTime()) / 86400000);
      const weeks = days / 7;
      let months = (dateB.getFullYear() - dateA.getFullYear()) * 12 + (dateB.getMonth() - dateA.getMonth());
      if (dateB.getDate() < dateA.getDate()) months--;
      const years = months / 12;

      return c.json({ ok: true, result: { days, weeks, months: Math.floor(months), years: parseFloat(years.toFixed(4)) } });
    } else {
      const sign = mode === 'subtract' ? -1 : 1;
      const d = new Date(dateA);
      if (unit === 'days') d.setDate(d.getDate() + sign * amount);
      else if (unit === 'weeks') d.setDate(d.getDate() + sign * amount * 7);
      else if (unit === 'months') d.setMonth(d.getMonth() + sign * amount);
      else if (unit === 'years') d.setFullYear(d.getFullYear() + sign * amount);
      else return c.json({ ok: false, error: 'Invalid unit' }, 400);

      return c.json({ ok: true, result: { date: d.toISOString().slice(0, 10) } });
    }
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/timezone-convert?time=2024-01-15T14:30:00&from=UTC&to=America/New_York
timeRoutes.get('/timezone-convert', (c) => {
  try {
    const timeStr = c.req.query('time') ?? 'now';
    const from = c.req.query('from') ?? 'UTC';
    const to = c.req.query('to') ?? 'UTC';

    let date: Date;
    if (!timeStr || timeStr === 'now') {
      date = new Date();
    } else {
      date = new Date(timeStr);
      if (isNaN(date.getTime())) return c.json({ ok: false, error: `Invalid time: "${timeStr}"` }, 400);
    }

    const formatInZone = (d: Date, tz: string) => d.toLocaleString('en-US', {
      timeZone: tz,
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZoneName: 'short',
    });

    return c.json({
      ok: true,
      result: {
        source: { timezone: from, time: formatInZone(date, from) },
        target: { timezone: to, time: formatInZone(date, to) },
        utc: date.toISOString(),
      },
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

export { timeRoutes };
